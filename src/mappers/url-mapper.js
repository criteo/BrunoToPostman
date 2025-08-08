// src/mappers/url-mapper.js

class UrlMapper {
  /**
   * Map Bruno URL and parameters to Postman URL object
   * @param {string} rawUrl - Bruno URL string
   * @param {Array} params - Bruno parameters array
   * @returns {Object} Postman URL object
   */
  static map(rawUrl = '', params = []) {
    if (!rawUrl) {
      return { 
        raw: '', 
        protocol: '', 
        host: [], 
        path: [], 
        query: [], 
        variable: [] 
      };
    }

    const result = { raw: rawUrl };
    
    try {
      const parsedUrl = this.parseUrl(rawUrl);
      Object.assign(result, parsedUrl);
      
      // Add query parameters from params array
      this.addQueryParameters(result, params);
      
      // Add path variables from params array
      this.addPathVariables(result, params, rawUrl);
      
    } catch (error) {
      console.warn('URL parsing in progress ... Parsed manually', error.message);
      const manualParsed = this.parseUrlManually(rawUrl);
      Object.assign(result, manualParsed);
      
      this.addParametersFromArray(result, params);
    }
    
    return result;
  }

  /**
   * Parse URL using URL API with variable handling
   * @param {string} rawUrl - Raw URL string
   * @returns {Object} Parsed URL components
   */
  static parseUrl(rawUrl) {
    const hasVariables = rawUrl.includes('{{') && rawUrl.includes('}}');
    const hasPathParams = rawUrl.includes('{') && rawUrl.includes('}');
    
    let urlToParse = rawUrl;
    const varReplacements = [];
    
    // Replace variables with placeholders for parsing
    if (hasVariables) {
      urlToParse = rawUrl.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        const placeholder = `__VAR_${varReplacements.length}__`;
        varReplacements.push({ placeholder, original: match, varName });
        return placeholder;
      });
    }
    
    const url = new URL(urlToParse);
    
    // Restore variables in components
    const result = {
      protocol: url.protocol.replace(':', ''),
      host: this.restoreVariables(url.hostname, varReplacements).split('.'),
      path: url.pathname.split('/').filter(Boolean).map(part => 
        this.restoreVariables(part, varReplacements)
      ),
      query: []
    };
    
    // Process existing query parameters
    url.searchParams.forEach((value, key) => {
      result.query.push({
        key,
        value: this.restoreVariables(value, varReplacements)
      });
    });
    
    return result;
  }

  /**
   * Restore variables in a string from replacements
   * @param {string} str - String with placeholders
   * @param {Array} varReplacements - Variable replacement mappings
   * @returns {string} String with restored variables
   */
  static restoreVariables(str, varReplacements) {
    let result = str;
    varReplacements.forEach(({ placeholder, original }) => {
      result = result.replace(placeholder, original);
    });
    return result;
  }

  /**
   * Add query parameters from params array to URL object
   * @param {Object} result - URL result object
   * @param {Array} params - Parameters array
   */
  static addQueryParameters(result, params) {
    const queryParams = params.filter(p => p.type === 'query');
    const existingKeys = new Set(result.query.map(q => q.key));
    
    queryParams.forEach(param => {
      if (!existingKeys.has(param.name)) {
        const queryParam = {
          key: param.name,
          value: param.value !== undefined ? String(param.value) : '',
          disabled: param.enabled === false
        };
        
        if (param.description) {
          queryParam.description = param.description;
        }
        
        result.query.push(queryParam);
      }
    });
  }

  /**
   * Add path variables from params array to URL object
   * @param {Object} result - URL result object
   * @param {Array} params - Parameters array
   * @param {string} rawUrl - Original URL string
   */
  static addPathVariables(result, params, rawUrl) {
    const pathVars = [];
    
    // Extract path variables from URL pattern
    const hasPathParams = rawUrl.includes('{') && rawUrl.includes('}');
    if (hasPathParams) {
      const pathVarMatches = rawUrl.match(/\{([^}]+)\}/g) || [];
      pathVarMatches.forEach(match => {
        const varName = match.slice(1, -1);
        pathVars.push({ key: varName, value: '' });
      });
    }
    
    // Merge with path parameters from params array
    params.filter(p => p.type === 'path').forEach(param => {
      const existing = pathVars.find(v => v.key === param.name);
      if (existing) {
        existing.value = param.value !== undefined ? String(param.value) : '';
        if (param.description) {
          existing.description = param.description;
        }
      } else {
        const pathVar = {
          key: param.name,
          value: param.value !== undefined ? String(param.value) : ''
        };
        if (param.description) {
          pathVar.description = param.description;
        }
        pathVars.push(pathVar);
      }
    });
    
    if (pathVars.length > 0) {
      result.variable = pathVars;
    }
  }

  /**
   * Add parameters from array when manual parsing is used
   * @param {Object} result - URL result object
   * @param {Array} params - Parameters array
   */
  static addParametersFromArray(result, params) {
    const queryParams = params.filter(p => p.type === 'query');
    if (queryParams.length > 0) {
      result.query = queryParams.map(p => ({
        key: p.name,
        value: p.value !== undefined ? String(p.value) : '',
        disabled: p.enabled === false,
        description: p.description
      }));
    }
    
    const pathParams = params.filter(p => p.type === 'path');
    if (pathParams.length > 0) {
      result.variable = pathParams.map(p => ({
        key: p.name,
        value: p.value !== undefined ? String(p.value) : '',
        description: p.description
      }));
    }
  }

  /**
   * Manual URL parsing for complex or invalid URLs
   * @param {string} url - URL string to parse
   * @returns {Object} Parsed URL components
   */
  static parseUrlManually(url) {
    const result = {
      protocol: '',
      host: [],
      path: [],
      query: []
    };
    
    // Extract protocol
    const protocolMatch = url.match(/^([^:]+):\/\//);
    if (protocolMatch) {
      result.protocol = protocolMatch[1];
      url = url.substring(protocolMatch[0].length);
    }
    
    // Split host and path
    const firstSlash = url.indexOf('/');
    let hostPart = url;
    let pathPart = '';
    
    if (firstSlash !== -1) {
      hostPart = url.substring(0, firstSlash);
      pathPart = url.substring(firstSlash + 1);
    }
    
    // Extract query string
    const queryIndex = pathPart.indexOf('?');
    let queryPart = '';
    if (queryIndex !== -1) {
      queryPart = pathPart.substring(queryIndex + 1);
      pathPart = pathPart.substring(0, queryIndex);
    }
    
    // Parse components
    result.host = hostPart.split('.').filter(Boolean);
    result.path = pathPart.split('/').filter(Boolean);
    
    // Parse query parameters
    if (queryPart) {
      queryPart.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) {
          result.query.push({
            key: decodeURIComponent(key),
            value: value ? decodeURIComponent(value) : ''
          });
        }
      });
    }
    
    return result;
  }
}

module.exports = UrlMapper;