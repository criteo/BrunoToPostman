// src/mappers/body-mapper.js
import { BODY_MODES } from '../utils/constants.js';

export default class BodyMapper {
  /**
   * Map Bruno request body to Postman request body
   * @param {Object} body - Bruno body object
   * @returns {Object|undefined} Postman body object or undefined if no body
   */
  static map(body = {}) {
    if (!body || !body.mode || body.mode === BODY_MODES.NONE) {
      return undefined;
    }

    const bodyMappers = {
      [BODY_MODES.JSON]: this.mapJson,
      [BODY_MODES.TEXT]: this.mapText,
      [BODY_MODES.XML]: this.mapXml,
      [BODY_MODES.SPARQL]: this.mapSparql,
      [BODY_MODES.FORMDATA]: this.mapFormData,
      [BODY_MODES.MULTIPART_FORM]: this.mapFormData,
      [BODY_MODES.URLENCODED]: this.mapUrlEncoded,
      [BODY_MODES.FORM_URL_ENCODED]: this.mapUrlEncoded,
      [BODY_MODES.FILE]: this.mapFile,
      [BODY_MODES.GRAPHQL]: this.mapGraphQL
    };

    const mapper = bodyMappers[body.mode];
    if (mapper) {
      return mapper.call(this, body);
    }

    // Fallback for unknown body types
    return {
      mode: 'raw',
      raw: body[body.mode] || '',
      options: { raw: { language: body.mode } }
    };
  }

  /**
   * Map JSON body
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman raw body with JSON
   */
  static mapJson(body) {
    const jsonContent = typeof body.json === 'string'
      ? body.json
      : JSON.stringify(body.json, null, 2);

    return {
      mode: 'raw',
      raw: jsonContent,
      options: { raw: { language: 'json' } }
    };
  }

  /**
   * Map text body
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman raw body with text
   */
  static mapText(body) {
    return {
      mode: 'raw',
      raw: body.text || '',
      options: { raw: { language: 'text' } }
    };
  }

  /**
   * Map XML body
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman raw body with XML
   */
  static mapXml(body) {
    return {
      mode: 'raw',
      raw: body.xml || '',
      options: { raw: { language: 'xml' } }
    };
  }

  /**
   * Map SPARQL body
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman raw body with SPARQL
   */
  static mapSparql(body) {
    return {
      mode: 'raw',
      raw: body.sparql || '',
      options: { raw: { language: 'text' } }
    };
  }

  /**
   * Map form data body (multipart/form-data)
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman formdata body
   */
  static mapFormData(body) {
    const formData = body.multipartForm || body.formdata || body.form || [];

    return {
      mode: 'formdata',
      formdata: formData.map(field => {
        const item = {
          key: field.name || field.key,
          type: field.type || 'text',
          disabled: field.enabled === false
        };

        if (field.type === 'file') {
          item.src = field.value || field.src || '';
        } else {
          item.value = field.value !== undefined ? String(field.value) : '';
        }

        if (field.description) {
          item.description = field.description;
        }

        return item;
      })
    };
  }

  /**
   * Map URL encoded body (application/x-www-form-urlencoded)
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman urlencoded body
   */
  static mapUrlEncoded(body) {
    const urlencoded = body.urlencoded || body.formUrlEncoded || [];

    return {
      mode: 'urlencoded',
      urlencoded: urlencoded.map(field => ({
        key: field.name || field.key,
        value: field.value !== undefined ? String(field.value) : '',
        disabled: field.enabled === false,
        type: field.type || 'text',
        description: field.description
      }))
    };
  }

  /**
   * Map file body
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman file body
   */
  static mapFile(body) {
    return {
      mode: 'file',
      file: { src: body.file || '' }
    };
  }

  /**
   * Map GraphQL body
   * @param {Object} body - Bruno body object
   * @returns {Object} Postman GraphQL body
   */
  static mapGraphQL(body) {
    const variables = body.graphql?.variables;
    const variablesString = typeof variables === 'string'
      ? variables
      : JSON.stringify(variables || {});

    return {
      mode: 'graphql',
      graphql: {
        query: body.graphql?.query || '',
        variables: variablesString
      }
    };
  }
}
