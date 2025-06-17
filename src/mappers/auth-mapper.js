// src/mappers/auth-mapper.js
import { AUTH_TYPES } from '../utils/constants.js';

export default class AuthMapper {
  /**
   * Map Bruno authentication to Postman authentication
   * @param {Object} auth - Bruno auth object
   * @returns {Object} Postman auth object
   */
  static map(auth = { mode: AUTH_TYPES.NONE }) {
    if (!auth || auth.mode === AUTH_TYPES.NONE || auth.mode === AUTH_TYPES.INHERIT) {
      return { type: 'noauth' };
    }

    const authMethods = {
      [AUTH_TYPES.OAUTH2]: this.mapOAuth2,
      [AUTH_TYPES.BEARER]: this.mapBearer,
      [AUTH_TYPES.APIKEY]: this.mapApiKey,
      [AUTH_TYPES.BASIC]: this.mapBasic,
      [AUTH_TYPES.DIGEST]: this.mapDigest,
      [AUTH_TYPES.AWS]: this.mapAws
    };

    const mapMethod = authMethods[auth.mode];
    if (mapMethod) {
      return mapMethod.call(this, auth);
    }

    // Fallback for unknown auth types
    const result = { type: auth.mode };
    if (auth[auth.mode]) {
      result[auth.mode] = auth[auth.mode];
    }
    return result;
  }

  /**
   * Map OAuth2 authentication
   * @param {Object} auth - Bruno OAuth2 auth object
   * @returns {Object} Postman OAuth2 auth object
   */
  static mapOAuth2(auth) {
    return {
      type: 'oauth2',
      oauth2: this.mapOAuth2Config(auth.oauth2)
    };
  }

  /**
   * Map OAuth2 configuration
   * @param {Object} oauth2 - Bruno OAuth2 config
   * @returns {Array} Postman OAuth2 configuration array
   */
  static mapOAuth2Config(oauth2 = {}) {
    const mapped = [];

    const fieldMapping = {
      grant_type: oauth2.grantType || 'authorization_code',
      callback_url: oauth2.callbackUrl,
      auth_url: oauth2.authorizationUrl,
      access_token_url: oauth2.accessTokenUrl,
      refresh_token_url: oauth2.refreshTokenUrl,
      client_id: oauth2.clientId,
      client_secret: oauth2.clientSecret,
      scope: oauth2.scope,
      state: oauth2.state,
      client_authentication: oauth2.credentialsPlacement || 'header',
      token_name: oauth2.credentialsId || 'token',
      header_prefix: oauth2.tokenHeaderPrefix || 'Bearer',
      query_key: oauth2.tokenQueryKey,
      username: oauth2.username,
      password: oauth2.password,
      audience: oauth2.audience,
      resource: oauth2.resource,
      code_challenge_method: oauth2.codeChallengeMethod
    };

    Object.entries(fieldMapping).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        mapped.push({ key, value: String(value), type: 'string' });
      }
    });

    if (oauth2.pkce !== undefined) {
      mapped.push({ key: 'use_pkce', value: String(oauth2.pkce), type: 'boolean' });
    }

    if (oauth2.addTokenTo) {
      mapped.push({ key: 'add_token_to', value: oauth2.addTokenTo, type: 'string' });
    }

    return mapped;
  }

  /**
   * Map Bearer token authentication
   * @param {Object} auth - Bruno Bearer auth object
   * @returns {Object} Postman Bearer auth object
   */
  static mapBearer(auth) {
    return {
      type: 'bearer',
      bearer: [{
        key: 'token',
        value: auth.bearer?.token || '',
        type: 'string'
      }]
    };
  }

  /**
   * Map API Key authentication
   * @param {Object} auth - Bruno API Key auth object
   * @returns {Object} Postman API Key auth object
   */
  static mapApiKey(auth) {
    return {
      type: 'apikey',
      apikey: [
        { key: 'key', value: auth.apikey?.key || '', type: 'string' },
        { key: 'value', value: auth.apikey?.value || '', type: 'string' },
        { key: 'in', value: auth.apikey?.placement || 'header', type: 'string' }
      ]
    };
  }

  /**
   * Map Basic authentication
   * @param {Object} auth - Bruno Basic auth object
   * @returns {Object} Postman Basic auth object
   */
  static mapBasic(auth) {
    return {
      type: 'basic',
      basic: [
        { key: 'username', value: auth.basic?.username || '', type: 'string' },
        { key: 'password', value: auth.basic?.password || '', type: 'string' }
      ]
    };
  }

  /**
   * Map Digest authentication
   * @param {Object} auth - Bruno Digest auth object
   * @returns {Object} Postman Digest auth object
   */
  static mapDigest(auth) {
    return {
      type: 'digest',
      digest: [
        { key: 'username', value: auth.digest?.username || '', type: 'string' },
        { key: 'password', value: auth.digest?.password || '', type: 'string' },
        { key: 'realm', value: auth.digest?.realm || '', type: 'string' },
        { key: 'nonce', value: auth.digest?.nonce || '', type: 'string' },
        { key: 'algorithm', value: auth.digest?.algorithm || 'MD5', type: 'string' },
        { key: 'qop', value: auth.digest?.qop || '', type: 'string' },
        { key: 'nc', value: auth.digest?.nc || '', type: 'string' },
        { key: 'cnonce', value: auth.digest?.cnonce || '', type: 'string' },
        { key: 'opaque', value: auth.digest?.opaque || '', type: 'string' }
      ]
    };
  }

  /**
   * Map AWS authentication
   * @param {Object} auth - Bruno AWS auth object
   * @returns {Object} Postman AWS auth object
   */
  static mapAws(auth) {
    return {
      type: 'awsv4',
      awsv4: [
        { key: 'accessKey', value: auth.aws?.accessKey || '', type: 'string' },
        { key: 'secretKey', value: auth.aws?.secretKey || '', type: 'string' },
        { key: 'region', value: auth.aws?.region || '', type: 'string' },
        { key: 'service', value: auth.aws?.service || '', type: 'string' },
        { key: 'sessionToken', value: auth.aws?.sessionToken || '', type: 'string' }
      ]
    };
  }
}
