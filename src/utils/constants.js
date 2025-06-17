// src/utils/constants.js

export const POSTMAN_SCHEMA = 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json';

export const AUTH_TYPES = {
  NONE: 'none',
  INHERIT: 'inherit',
  OAUTH2: 'oauth2',
  BEARER: 'bearer',
  APIKEY: 'apikey',
  BASIC: 'basic',
  DIGEST: 'digest',
  AWS: 'aws'
};

export const BODY_MODES = {
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

export const SCRIPT_EVENT_TYPES = {
  PREREQUEST: 'prerequest',
  TEST: 'test'
};

export const DEFAULT_VALUES = {
  METHOD: 'GET',
  AUTH_TYPE: 'noauth',
  COLLECTION_NAME: 'Converted Collection'
};
