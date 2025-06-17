// src/mappers/script-converter.js

export default class ScriptConverter {
  /**
   * Convert Bruno script syntax to Postman script syntax
   * @param {string} script - Bruno script content
   * @returns {string} Converted Postman script
   */
  static convertToPostman(script) {
    if (!script) return '';

    const conversions = [
      // Response methods
      [/res\.getBody\(\)/g, 'pm.response.json()'],
      [/res\.getJsonBody\(\)/g, 'pm.response.json()'],
      [/res\.body/g, 'pm.response.json()'],
      [/res\.json/g, 'pm.response.json()'],
      [/res\.getStatus\(\)/g, 'pm.response.code'],
      [/res\.status/g, 'pm.response.code'],
      [/res\.getHeader\((.*?)\)/g, 'pm.response.headers.get($1)'],
      [/res\.headers/g, 'pm.response.headers'],

      // Variable methods
      [/bru\.setVar\((.*?),\s*(.*?)\)/g, 'pm.collectionVariables.set($1, $2)'],
      [/bru\.getVar\((.*?)\)/g, 'pm.collectionVariables.get($1)'],
      [/bru\.setEnvVar\((.*?),\s*(.*?)\)/g, 'pm.environment.set($1, $2)'],
      [/bru\.getEnvVar\((.*?)\)/g, 'pm.environment.get($1)'],
      [/bru\.setGlobalVar\((.*?),\s*(.*?)\)/g, 'pm.globals.set($1, $2)'],
      [/bru\.getGlobalVar\((.*?)\)/g, 'pm.globals.get($1)'],

      // Request methods
      [/req\.getUrl\(\)/g, 'pm.request.url.toString()'],
      [/req\.getMethod\(\)/g, 'pm.request.method'],
      [/req\.getHeader\((.*?)\)/g, 'pm.request.headers.get($1)'],

      // Test methods
      [/expect\(/g, 'pm.expect('],
      [/assert\(/g, 'pm.assert('],
      [/test\((.*?),/g, 'pm.test($1,'],

      // Clean up JSON.stringify redundancy
      [/JSON\.stringify\(\s*(pm\.response\.text\(\))\s*\)/g, '$1']
    ];

    let converted = script;
    conversions.forEach(([pattern, replacement]) => {
      converted = converted.replace(pattern, replacement);
    });

    return converted;
  }

  /**
   * Create script event objects for Postman
   * @param {Object} request - Request object with scripts
   * @returns {Array} Array of event objects
   */
  static mapRequestScripts(request = {}) {
    const events = [];

    if (request.script?.req) {
      events.push({
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: this.convertToPostman(request.script.req).split('\n'),
          packages: {}
        }
      });
    }

    if (request.script?.res) {
      events.push({
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: this.convertToPostman(request.script.res).split('\n'),
          packages: {}
        }
      });
    }

    if (request.tests) {
      events.push({
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: this.convertToPostman(request.tests).split('\n'),
          packages: {}
        }
      });
    }

    return events;
  }

  /**
   * Create script event objects for folders
   * @param {Object} req - Folder request object with scripts
   * @returns {Array} Array of event objects
   */
  static mapFolderScripts(req) {
    if (!req) return [];

    const events = [];

    if (req.script?.req) {
      events.push({
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: this.convertToPostman(req.script.req).split('\n'),
          packages: {}
        }
      });
    }

    if (req.script?.res) {
      events.push({
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: this.convertToPostman(req.script.res).split('\n'),
          packages: {}
        }
      });
    }

    if (req.tests) {
      events.push({
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: this.convertToPostman(req.tests).split('\n'),
          packages: {}
        }
      });
    }

    return events;
  }
}
