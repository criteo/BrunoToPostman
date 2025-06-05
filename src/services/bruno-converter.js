// src/services/bruno-converter.js
const AuthMapper = require('../mappers/auth-mapper');
const BodyMapper = require('../mappers/body-mapper');
const UrlMapper = require('../mappers/url-mapper');
const ScriptConverter = require('../mappers/script-converter');
const BaseMapper = require('../mappers/base-mapper');
const { generatePostmanId } = require('../utils/postman-id');
const { POSTMAN_SCHEMA, DEFAULT_VALUES } = require('../utils/constants');

class BrunoConverter {
  /**
   * Convert Bruno JSON collection to Postman v2.1.0 format
   * @param {Object} brunoJson - Bruno collection JSON
   * @returns {Object} Postman collection JSON
   */
  static convert(brunoJson) {
    console.log("🔍 Converting Bruno collection with keys:", Object.keys(brunoJson));
    console.log("🔍 Items count:", Array.isArray(brunoJson.items) ? brunoJson.items.length : 'N/A');
    console.log("🔍 Root auth:", brunoJson.root?.request?.auth?.mode || 'none');

    const collection = this.createBaseCollection(brunoJson);
    
    // Add collection-level variables
    collection.variable = this.mapCollectionVariables(brunoJson);
    
    // Add collection-level authentication
    this.addCollectionAuth(collection, brunoJson);
    
    // Add collection-level scripts
    this.addCollectionScripts(collection, brunoJson);
    
    // Convert all items (requests and folders)
    collection.item = this.convertItems(brunoJson.items || []);
    
    // Clean up empty auth object
    if (collection.auth && Object.keys(collection.auth).length === 0) {
      delete collection.auth;
    }
    
    console.log(`✅ Conversion completed: ${collection.item.length} items, ${collection.variable.length} variables`);
    
    return collection;
  }

  /**
   * Create base Postman collection structure
   * @param {Object} brunoJson - Bruno collection JSON
   * @returns {Object} Base collection object
   */
  static createBaseCollection(brunoJson) {
    const collection = {
      info: {
        name: BaseMapper.getCollectionName(brunoJson),
        schema: POSTMAN_SCHEMA,
        description: BaseMapper.getDescription(brunoJson.root?.request)
      },
      item: [],
      event: [],
      variable: [],
      auth: { type: 'noauth' }
    };

    // Add Postman ID and metadata
    if (brunoJson.info) {
      collection.info._postman_id = brunoJson.info._postman_id || generatePostmanId();
      if (brunoJson.info._exporter_id) {
        collection.info._exporter_id = brunoJson.info._exporter_id;
      }
      if (brunoJson.info._collection_link) {
        collection.info._collection_link = brunoJson.info._collection_link;
      }
    } else {
      collection.info._postman_id = generatePostmanId();
    }

    return collection;
  }

  /**
   * Map collection-level variables from Bruno to Postman
   * @param {Object} brunoJson - Bruno collection JSON
   * @returns {Array} Postman variables array
   */
  static mapCollectionVariables(brunoJson) {
    const rootVars = brunoJson.root?.request?.vars;
    return BaseMapper.mapVariables(rootVars);
  }

  /**
   * Add collection-level authentication
   * @param {Object} collection - Postman collection object
   * @param {Object} brunoJson - Bruno collection JSON
   */
  static addCollectionAuth(collection, brunoJson) {
    const rootAuth = brunoJson.root?.request?.auth;
    if (BaseMapper.shouldIncludeAuth(rootAuth)) {
      collection.auth = AuthMapper.map(rootAuth);
    }
  }

  /**
   * Add collection-level scripts
   * @param {Object} collection - Postman collection object
   * @param {Object} brunoJson - Bruno collection JSON
   */
  static addCollectionScripts(collection, brunoJson) {
    const rootRequest = brunoJson.root?.request;
    if (!rootRequest) return;

    const events = ScriptConverter.mapFolderScripts(rootRequest);
    if (events.length > 0) {
      collection.event = events;
    }
  }

  /**
   * Convert all items (requests and folders) from Bruno to Postman
   * @param {Array} items - Bruno items array
   * @returns {Array} Postman items array
   */
  static convertItems(items) {
    return items.map(item => this.convertItem(item));
  }

  /**
   * Convert a single item (request or folder) from Bruno to Postman
   * @param {Object} node - Bruno item node
   * @returns {Object} Postman item object
   */
  static convertItem(node) {
    if (node.type === 'folder') {
      return this.convertFolder(node);
    }
    return this.convertRequest(node);
  }

  /**
   * Convert a Bruno folder to Postman folder
   * @param {Object} node - Bruno folder node
   * @returns {Object} Postman folder object
   */
  static convertFolder(node) {
    const folder = {
      name: node.name,
      item: this.convertItems(node.items || [])
    };
    
    // Add folder description
    const description = BaseMapper.getDescription(node.root?.request);
    if (description) {
      folder.description = description;
    }
    
    // Add folder-level scripts
    const events = ScriptConverter.mapFolderScripts(node.root?.request);
    if (events.length > 0) {
      folder.event = events;
    }
    
    // Add folder-level authentication
    const folderAuth = node.root?.request?.auth;
    if (BaseMapper.shouldIncludeAuth(folderAuth)) {
      folder.auth = AuthMapper.map(folderAuth);
    }
    
    // Add folder-level variables
    const folderVars = BaseMapper.mapVariables(node.root?.request?.vars);
    if (folderVars.length > 0) {
      folder.variable = folderVars;
    }
    
    return folder;
  }

  /**
   * Convert a Bruno request to Postman request
   * @param {Object} node - Bruno request node
   * @returns {Object} Postman request item object
   */
  static convertRequest(node) {
    const item = {
      name: node.name,
      request: this.mapRequest(node.request),
      response: []
    };
    
    // Add request-level scripts
    const events = ScriptConverter.mapRequestScripts(node.request);
    if (events.length > 0) {
      item.event = events;
    }
    
    // Add request-level variables
    const requestVars = BaseMapper.mapVariables(node.request?.vars);
    if (requestVars.length > 0) {
      item.variable = requestVars;
    }
    
    return item;
  }

  /**
   * Map a Bruno request to Postman request format
   * @param {Object} brunoRequest - Bruno request object
   * @returns {Object} Postman request object
   */
  static mapRequest(brunoRequest) {
    const request = {
      method: brunoRequest.method || DEFAULT_VALUES.METHOD,
      header: BaseMapper.mapHeaders(brunoRequest.headers),
      url: UrlMapper.map(brunoRequest.url, brunoRequest.params)
    };
    
    // Add request body
    const body = BodyMapper.map(brunoRequest.body);
    if (body) {
      request.body = body;
    }
    
    // Add request description
    const description = BaseMapper.getDescription(brunoRequest);
    if (description) {
      request.description = description;
    }

    // Add protocol profile behavior
    if (brunoRequest.protocolProfileBehavior) {
      request.protocolProfileBehavior = brunoRequest.protocolProfileBehavior;
    }

    // Add request-level authentication
    if (BaseMapper.shouldIncludeAuth(brunoRequest.auth)) {
      request.auth = AuthMapper.map(brunoRequest.auth);
    }

    return request;
  }
}

module.exports = BrunoConverter;