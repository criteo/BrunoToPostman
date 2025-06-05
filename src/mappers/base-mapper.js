// src/mappers/base-mapper.js
const { DEFAULT_VALUES } = require('../utils/constants');

class BaseMapper {
  /**
   * Map Bruno headers to Postman headers
   * @param {Array} headers - Bruno headers array
   * @returns {Array} Postman headers array
   */
  static mapHeaders(headers = []) {
    return headers
      .filter(header => header.name)
      .map(header => ({
        key: header.name,
        value: header.value !== undefined ? String(header.value) : '',
        disabled: header.enabled === false,
        type: header.type || 'text',
        description: header.description
      }))
      .filter(header => header.key);
  }

  /**
   * Map Bruno variables to Postman variables
   * @param {Object} varsObj - Bruno variables object with req/res arrays
   * @returns {Array} Postman variables array
   */
  static mapVariables(varsObj = {}) {
    if (!varsObj.req && !varsObj.res) {
      return [];
    }

    const variables = [
      ...(varsObj.req || []),
      ...(varsObj.res || [])
    ];
    
    // Remove duplicates by name
    const uniqueVars = {};
    variables.forEach(variable => {
      if (!uniqueVars[variable.name]) {
        uniqueVars[variable.name] = variable;
      }
    });
    
    return Object.values(uniqueVars).map(variable => {
      const mapped = {
        key: variable.name,
        value: variable.value !== undefined ? String(variable.value) : '',
        type: variable.type || 'default'
      };
      
      if (variable.description) {
        mapped.description = variable.description;
      }
      
      return mapped;
    });
  }

  /**
   * Safely convert value to string
   * @param {any} value - Value to convert
   * @returns {string} String representation
   */
  static toString(value) {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  }

  /**
   * Check if authentication should be included
   * @param {Object} auth - Auth object
   * @returns {boolean} Whether auth should be included
   */
  static shouldIncludeAuth(auth) {
    return auth && 
           auth.mode && 
           auth.mode !== 'none' && 
           auth.mode !== 'inherit';
  }

  /**
   * Get safe collection name
   * @param {Object} brunoJson - Bruno collection object
   * @returns {string} Collection name
   */
  static getCollectionName(brunoJson) {
    return brunoJson.name || 
           brunoJson.brunoConfig?.name || 
           DEFAULT_VALUES.COLLECTION_NAME;
  }

  /**
   * Get safe description
   * @param {Object} request - Request object
   * @returns {string} Description
   */
  static getDescription(request) {
    return request?.docs || request?.description || '';
  }

  /**
   * Create a clean object without undefined values
   * @param {Object} obj - Object to clean
   * @returns {Object} Cleaned object
   */
  static cleanObject(obj) {
    const cleaned = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            cleaned[key] = value;
          }
        } else if (typeof value === 'object') {
          const cleanedValue = this.cleanObject(value);
          if (Object.keys(cleanedValue).length > 0) {
            cleaned[key] = cleanedValue;
          }
        } else {
          cleaned[key] = value;
        }
      }
    });
    return cleaned;
  }
}

module.exports = BaseMapper;