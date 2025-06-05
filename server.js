// server.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Configure multer for file uploads (store in memory)
const upload = multer({ 
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Serve static files
app.use(express.static('public'));
app.use(express.json());

/**
 * Convert Bruno JSON → Postman v2.1.0 collection
 * (Your existing conversion function - keeping it unchanged)
 */
function convertBrunoToPostman(brunoJson) {
  console.log("🔍 top-level keys:", Object.keys(brunoJson));
  console.log("🔍 items:", Array.isArray(brunoJson.items) ? brunoJson.items.length : brunoJson.items);
  console.log("🔍 root.request.auth:", brunoJson.root?.request?.auth);

  const col = {
    info: {
      name:        brunoJson.name || brunoJson.brunoConfig?.name || 'Converted Collection',
      schema:      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      description: brunoJson.root?.request?.docs || brunoJson.description || ''
    },
    item:     [],
    event:    [],
    variable: [],
    auth:     { type: 'noauth' }
  };

  if (brunoJson.info) {
    col.info._postman_id = brunoJson.info._postman_id || generatePostmanId();
    if (brunoJson.info._exporter_id) col.info._exporter_id = brunoJson.info._exporter_id;
    if (brunoJson.info._collection_link) col.info._collection_link = brunoJson.info._collection_link;
  } else {
    col.info._postman_id = generatePostmanId();
  }

  const brunoVars = [
    ...(brunoJson.root?.request?.vars?.req || []),
    ...(brunoJson.root?.request?.vars?.res || [])
  ];
  
  const uniqueVars = {};
  brunoVars.forEach(v => {
    if (!uniqueVars[v.name]) {
      uniqueVars[v.name] = v;
    }
  });
  
  Object.values(uniqueVars).forEach(v => {
    const variable = {
      key:   v.name,
      value: v.value !== undefined ? String(v.value) : '',
      type:  v.type || 'default'
    };
    if (v.description) variable.description = v.description;
    col.variable.push(variable);
  });

  const rootAuth = brunoJson.root?.request?.auth;
  if (rootAuth?.mode && rootAuth.mode !== 'none' && rootAuth.mode !== 'inherit') {
    col.auth = mapAuth(rootAuth);
  }

  const rootReq = brunoJson.root?.request;
  if (rootReq?.script?.req) {
    col.event.push({
      listen: 'prerequest',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(rootReq.script.req).split('\n'),
        packages: {}
      }
    });
  }
  if (rootReq?.script?.res) {
    col.event.push({
      listen: 'test',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(rootReq.script.res).split('\n'),
        packages: {}
      }
    });
  }
  if (rootReq?.tests) {
    col.event.push({
      listen: 'test',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(rootReq.tests).split('\n'),
        packages: {}
      }
    });
  }

  col.item = (brunoJson.items || []).map(mapNode);
  
  if (Object.keys(col.auth).length === 0) {
    delete col.auth;
  }
  
  return col;
}

// All your existing helper functions (keeping them unchanged)
function generatePostmanId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function convertScriptToPostman(script) {
  if (!script) return '';
  
  let converted = script
    .replace(/res\.getBody\(\)/g, 'pm.response.json()')
    .replace(/res\.getJsonBody\(\)/g, 'pm.response.json()')
    .replace(/res\.body/g, 'pm.response.json()')
    .replace(/res\.json/g, 'pm.response.json()')
    .replace(/res\.getStatus\(\)/g, 'pm.response.code')
    .replace(/res\.status/g, 'pm.response.code')
    .replace(/res\.getHeader\((.*?)\)/g, 'pm.response.headers.get($1)')
    .replace(/res\.headers/g, 'pm.response.headers')
    .replace(/bru\.setVar\((.*?),\s*(.*?)\)/g, 'pm.collectionVariables.set($1, $2)')
    .replace(/bru\.getVar\((.*?)\)/g, 'pm.collectionVariables.get($1)')
    .replace(/bru\.setEnvVar\((.*?),\s*(.*?)\)/g, 'pm.environment.set($1, $2)')
    .replace(/bru\.getEnvVar\((.*?)\)/g, 'pm.environment.get($1)')
    .replace(/bru\.setGlobalVar\((.*?),\s*(.*?)\)/g, 'pm.globals.set($1, $2)')
    .replace(/bru\.getGlobalVar\((.*?)\)/g, 'pm.globals.get($1)')
    .replace(/req\.getUrl\(\)/g, 'pm.request.url.toString()')
    .replace(/req\.getMethod\(\)/g, 'pm.request.method')
    .replace(/req\.getHeader\((.*?)\)/g, 'pm.request.headers.get($1)')
    .replace(/expect\(/g, 'pm.expect(')
    .replace(/assert\(/g, 'pm.assert(')
    .replace(/test\((.*?),/g, 'pm.test($1,')
    .replace(/JSON\.stringify\(\s*(pm\.response\.text\(\))\s*\)/g, '$1');
    
  return converted;
}

function mapNode(node) {
  if (node.type === 'folder') {
    const fld = {
      name: node.name,
      item: (node.items || []).map(mapNode)
    };
    
    if (node.root?.request?.docs || node.description) {
      fld.description = node.root?.request?.docs || node.description;
    }
    
    const events = mapFolderScripts(node.root?.request);
    if (events && events.length > 0) {
      fld.event = events;
    }
    
    if (node.root?.request?.auth?.mode && 
        node.root.request.auth.mode !== 'none' && 
        node.root.request.auth.mode !== 'inherit') {
      fld.auth = mapAuth(node.root.request.auth);
    }
    
    if (node.root?.request?.vars?.req || node.root?.request?.vars?.res) {
      fld.variable = [];
      const vars = [
        ...(node.root.request.vars.req || []),
        ...(node.root.request.vars.res || [])
      ];
      vars.forEach(v => {
        fld.variable.push({
          key: v.name,
          value: v.value !== undefined ? String(v.value) : '',
          type: v.type || 'default'
        });
      });
    }
    
    return fld;
  }

  const item = {
    name: node.name,
    request: mapRequest(node.request),
    response: []
  };
  
  const events = mapRequestScripts(node.request);
  if (events && events.length > 0) {
    item.event = events;
  }
  
  if (node.request?.vars?.req || node.request?.vars?.res) {
    item.variable = [];
    const vars = [
      ...(node.request.vars.req || []),
      ...(node.request.vars.res || [])
    ];
    vars.forEach(v => {
      item.variable.push({
        key: v.name,
        value: v.value !== undefined ? String(v.value) : '',
        type: v.type || 'default'
      });
    });
  }
  
  return item;
}

function mapFolderScripts(req) {
  if (!req) return [];
  const ev = [];
  if (req.script?.req) {
    ev.push({
      listen: 'prerequest',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(req.script.req).split('\n'),
        packages: {}
      }
    });
  }
  if (req.script?.res) {
    ev.push({
      listen: 'test',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(req.script.res).split('\n'),
        packages: {}
      }
    });
  }
  if (req.tests) {
    ev.push({
      listen: 'test',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(req.tests).split('\n'),
        packages: {}
      }
    });
  }
  return ev;
}

function mapRequest(r) {
  const req = {
    method: r.method || 'GET',
    header: mapHeaders(r.headers),
    url: mapUrl(r.url, r.params)
  };
  
  const body = mapBody(r.body);
  if (body) {
    req.body = body;
  }
  
  if (r.docs || r.description) {
    req.description = r.docs || r.description;
  }

  if (r.protocolProfileBehavior) {
    req.protocolProfileBehavior = r.protocolProfileBehavior;
  }

  if (r.auth?.mode && r.auth.mode !== 'none' && r.auth.mode !== 'inherit') {
    req.auth = mapAuth(r.auth);
  }

  return req;
}

function mapHeaders(headers = []) {
  return headers
    .filter(h => h.name)
    .map(h => ({
      key: h.name,
      value: h.value !== undefined ? String(h.value) : '',
      disabled: h.enabled === false,
      type: h.type || 'text',
      description: h.description
    }))
    .filter(h => h.key);
}

function mapAuth(auth = { mode: 'none' }) {
  if (!auth || auth.mode === 'none' || auth.mode === 'inherit') {
    return { type: 'noauth' };
  }

  switch (auth.mode) {
    case 'oauth2':
      return { type: 'oauth2', oauth2: mapOAuth2(auth.oauth2) };
    case 'bearer':
      return {
        type: 'bearer',
        bearer: [{ 
          key: 'token', 
          value: auth.bearer?.token || '', 
          type: 'string' 
        }]
      };
    case 'apikey':
      return {
        type: 'apikey',
        apikey: [
          { key: 'key', value: auth.apikey?.key || '', type: 'string' },
          { key: 'value', value: auth.apikey?.value || '', type: 'string' },
          { key: 'in', value: auth.apikey?.placement || 'header', type: 'string' }
        ]
      };
    case 'basic':
      return {
        type: 'basic',
        basic: [
          { key: 'username', value: auth.basic?.username || '', type: 'string' },
          { key: 'password', value: auth.basic?.password || '', type: 'string' }
        ]
      };
    case 'digest':
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
    case 'aws':
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
    default:
      const out = { type: auth.mode };
      if (auth[auth.mode]) {
        out[auth.mode] = auth[auth.mode];
      }
      return out;
  }
}

function mapOAuth2(oauth2 = {}) {
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

function mapBody(body = {}) {
  if (!body || !body.mode || body.mode === 'none') return undefined;
  
  switch (body.mode) {
    case 'json':
      return { 
        mode: 'raw', 
        raw: typeof body.json === 'string' ? body.json : JSON.stringify(body.json, null, 2), 
        options: { raw: { language: 'json' } } 
      };
    case 'text':
      return { 
        mode: 'raw', 
        raw: body.text || '', 
        options: { raw: { language: 'text' } } 
      };
    case 'xml':
      return { 
        mode: 'raw', 
        raw: body.xml || '', 
        options: { raw: { language: 'xml' } } 
      };
    case 'sparql':
      return { 
        mode: 'raw', 
        raw: body.sparql || '', 
        options: { raw: { language: 'text' } } 
      };
    case 'formdata':
    case 'multipartForm':
      const formData = body.multipartForm || body.formdata || body.form || [];
      return {
        mode: 'formdata',
        formdata: formData.map(f => {
          const item = { 
            key: f.name || f.key, 
            type: f.type || 'text', 
            disabled: f.enabled === false 
          };
          if (f.type === 'file') {
            item.src = f.value || f.src || '';
          } else {
            item.value = f.value !== undefined ? String(f.value) : '';
          }
          if (f.description) item.description = f.description;
          return item;
        })
      };
    case 'urlencoded':
    case 'formUrlEncoded':
      const urlencoded = body.urlencoded || body.formUrlEncoded || [];
      return {
        mode: 'urlencoded',
        urlencoded: urlencoded.map(u => ({
          key: u.name || u.key,
          value: u.value !== undefined ? String(u.value) : '',
          disabled: u.enabled === false,
          type: u.type || 'text',
          description: u.description
        }))
      };
    case 'file':
      return {
        mode: 'file',
        file: { src: body.file || '' }
      };
    case 'graphql':
      return {
        mode: 'graphql',
        graphql: {
          query: body.graphql?.query || '',
          variables: typeof body.graphql?.variables === 'string' 
            ? body.graphql.variables 
            : JSON.stringify(body.graphql?.variables || {})
        }
      };
    default:
      return {
        mode: 'raw',
        raw: body[body.mode] || '',
        options: { raw: { language: body.mode } }
      };
  }
}

function mapUrl(rawUrl = '', params = []) {
  if (!rawUrl) return { raw: '', protocol: '', host: [], path: [], query: [], variable: [] };

  const result = { raw: rawUrl };
  
  const hasVariables = rawUrl.includes('{{') && rawUrl.includes('}}');
  const hasPathParams = rawUrl.includes('{') && rawUrl.includes('}');
  
  let urlToParse = rawUrl;
  
  const varReplacements = [];
  if (hasVariables) {
    urlToParse = rawUrl.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const placeholder = `__VAR_${varReplacements.length}__`;
      varReplacements.push({ placeholder, original: match, varName });
      return placeholder;
    });
  }
  
  try {
    const url = new URL(urlToParse);
    result.protocol = url.protocol.replace(':', '');
    
    let host = url.hostname;
    varReplacements.forEach(({ placeholder, original }) => {
      host = host.replace(placeholder, original);
    });
    result.host = host.split('.');
    
    let pathParts = url.pathname.split('/').filter(Boolean);
    pathParts = pathParts.map(part => {
      varReplacements.forEach(({ placeholder, original }) => {
        part = part.replace(placeholder, original);
      });
      return part;
    });
    result.path = pathParts;
    
    const urlQuery = [];
    url.searchParams.forEach((value, key) => {
      varReplacements.forEach(({ placeholder, original }) => {
        value = value.replace(placeholder, original);
      });
      urlQuery.push({ key, value });
    });
    
    const queryParams = params.filter(p => p.type === 'query');
    const existingKeys = new Set(urlQuery.map(q => q.key));
    
    queryParams.forEach(p => {
      if (!existingKeys.has(p.name)) {
        const queryParam = {
          key: p.name,
          value: p.value !== undefined ? String(p.value) : '',
          disabled: p.enabled === false
        };
        if (p.description) queryParam.description = p.description;
        urlQuery.push(queryParam);
      }
    });
    
    if (urlQuery.length > 0) {
      result.query = urlQuery;
    }
    
    const pathVars = [];
    
    if (hasPathParams) {
      const pathVarMatches = rawUrl.match(/\{([^}]+)\}/g) || [];
      pathVarMatches.forEach(match => {
        const varName = match.slice(1, -1);
        pathVars.push({ key: varName, value: '' });
      });
    }
    
    params.filter(p => p.type === 'path').forEach(p => {
      const existing = pathVars.find(v => v.key === p.name);
      if (existing) {
        existing.value = p.value !== undefined ? String(p.value) : '';
        if (p.description) existing.description = p.description;
      } else {
        const pathVar = {
          key: p.name,
          value: p.value !== undefined ? String(p.value) : ''
        };
        if (p.description) pathVar.description = p.description;
        pathVars.push(pathVar);
      }
    });
    
    if (pathVars.length > 0) {
      result.variable = pathVars;
    }
    
  } catch (e) {
    const manualParse = parseUrlManually(rawUrl);
    Object.assign(result, manualParse);
    
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
  
  return result;
}

function parseUrlManually(url) {
  const result = {
    protocol: '',
    host: [],
    path: [],
    query: []
  };
  
  const protocolMatch = url.match(/^([^:]+):\/\//);
  if (protocolMatch) {
    result.protocol = protocolMatch[1];
    url = url.substring(protocolMatch[0].length);
  }
  
  const firstSlash = url.indexOf('/');
  let hostPart = url;
  let pathPart = '';
  
  if (firstSlash !== -1) {
    hostPart = url.substring(0, firstSlash);
    pathPart = url.substring(firstSlash + 1);
  }
  
  const queryIndex = pathPart.indexOf('?');
  let queryPart = '';
  if (queryIndex !== -1) {
    queryPart = pathPart.substring(queryIndex + 1);
    pathPart = pathPart.substring(0, queryIndex);
  }
  
  result.host = hostPart.split('.').filter(Boolean);
  result.path = pathPart.split('/').filter(Boolean);
  
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

function mapRequestScripts(request = {}) {
  const ev = [];
  
  if (request.script?.req) {
    ev.push({
      listen: 'prerequest',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(request.script.req).split('\n'),
        packages: {}
      }
    });
  }
  
  if (request.script?.res) {
    ev.push({
      listen: 'test',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(request.script.res).split('\n'),
        packages: {}
      }
    });
  }
  
  if (request.tests) {
    ev.push({
      listen: 'test',
      script: { 
        type: 'text/javascript', 
        exec: convertScriptToPostman(request.tests).split('\n'),
        packages: {}
      }
    });
  }
  
  return ev;
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Convert endpoint
app.post('/convert', upload.single('brunoFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('🔄 Converting Bruno collection...');
    const bruno = JSON.parse(req.file.buffer.toString('utf8'));
    const postman = convertBrunoToPostman(bruno);
    
    const fileName = req.file.originalname.replace(/\.json$/, '') + '.postman_collection.json';
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(JSON.stringify(postman, null, 2));
    
    console.log(`✅ Successfully converted: ${fileName}`);
    console.log(`📊 Stats: ${postman.item.length} items, ${postman.variable.length} variables`);
    
  } catch (error) {
    console.error('❌ Conversion error:', error);
    res.status(400).json({ 
      error: 'Conversion failed', 
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐶 Bruno to 🚀 Postman Converter running at http://localhost:${PORT}`);
  console.log(`📁 Upload your Bruno JSON files and convert them to Postman format!`);
});

module.exports = app;