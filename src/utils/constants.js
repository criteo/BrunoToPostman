// src/utils/constants.js

const POSTMAN_SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

const AUTH_TYPES = {
  NONE: 'none',
  INHERIT: 'inherit',
  OAUTH2: 'oauth2',
  BEARER: 'bearer',
  APIKEY: 'apikey',
  BASIC: 'basic',
  DIGEST: 'digest',
  AWS: 'aws'
};

const BODY_MODES = {
  NONE: 'none',
  JSON: 'json',
  TEXT: 'text',
  XML: 'xml',
  SPARQL: 'sparql',
  FORMDATA: 'formdata',
  MULTIPART_FORM: 'multipartForm',
  URLENCODED: 'urlencoded',
  FORM_URL_ENCODED: 'formUrlEncoded',
  FILE: 'file',
  GRAPHQL: 'graphql'
};

const SCRIPT_EVENT_TYPES = {
  PREREQUEST: 'prerequest',
  TEST: 'test'
};

const DEFAULT_VALUES = {
  METHOD: 'GET',
  AUTH_TYPE: 'noauth',
  COLLECTION_NAME: 'Converted Collection'
};

module.exports = {
  POSTMAN_SCHEMA,
  AUTH_TYPES,
  BODY_MODES,
  SCRIPT_EVENT_TYPES,
  DEFAULT_VALUES
};