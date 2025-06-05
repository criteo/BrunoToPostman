// src/routes/converter.js
const express = require('express');
const BrunoConverter = require('../services/bruno-converter');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

/**
 * Convert Bruno collection to Postman format
 * POST /api/convert
 */
router.post('/convert', upload.single('brunoFile'), async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select a Bruno JSON file to convert' 
      });
    }

    console.log('🔄 Starting conversion process...');
    console.log(`📁 File: ${req.file.originalname} (${req.file.size} bytes)`);
    
    // Parse Bruno JSON
    let brunoCollection;
    try {
      brunoCollection = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError.message);
      return res.status(400).json({ 
        error: 'Invalid JSON file',
        message: 'The uploaded file is not valid JSON format',
        details: parseError.message 
      });
    }
    
    // Validate Bruno collection structure
    if (!brunoCollection || typeof brunoCollection !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid Bruno collection',
        message: 'The file does not appear to be a valid Bruno collection' 
      });
    }
    
    // Convert to Postman format
    const postmanCollection = BrunoConverter.convert(brunoCollection);
    
    // Generate filename
    const originalName = req.file.originalname.replace(/\.json$/, '');
    const fileName = `${originalName}.postman_collection.json`;
    
    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Conversion-Stats', JSON.stringify({
      items: postmanCollection.item.length,
      variables: postmanCollection.variable.length,
      hasAuth: !!postmanCollection.auth && Object.keys(postmanCollection.auth).length > 0
    }));
    
    // Send converted collection
    res.send(JSON.stringify(postmanCollection, null, 2));
    
    console.log(`✅ Successfully converted: ${fileName}`);
    console.log(`📊 Stats: ${postmanCollection.item.length} items, ${postmanCollection.variable.length} variables`);
    
  } catch (error) {
    console.error('❌ Conversion error:', error);
    
    // Determine error type and provide appropriate response
    if (error.name === 'SyntaxError') {
      return res.status(400).json({ 
        error: 'Invalid JSON format', 
        message: 'The uploaded file contains invalid JSON',
        details: error.message 
      });
    }
    
    if (error.message?.includes('collection')) {
      return res.status(400).json({ 
        error: 'Invalid Bruno collection', 
        message: 'The file structure is not recognized as a Bruno collection',
        details: error.message 
      });
    }
    
    // Generic conversion error
    res.status(500).json({ 
      error: 'Conversion failed', 
      message: 'An error occurred while converting the collection',
      details: error.message 
    });
  }
});

/**
 * Validate Bruno collection without converting
 * POST /api/validate
 */
router.post('/validate', upload.single('brunoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const brunoCollection = JSON.parse(req.file.buffer.toString('utf8'));
    
    // Basic validation
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        items: 0,
        folders: 0,
        requests: 0,
        variables: 0,
        hasAuth: false
      }
    };

    if (!brunoCollection || typeof brunoCollection !== 'object') {
      validation.isValid = false;
      validation.errors.push('Invalid collection structure');
    } else {
      // Collect stats
      if (brunoCollection.items) {
        validation.stats.items = brunoCollection.items.length;
        brunoCollection.items.forEach(item => {
          if (item.type === 'folder') {
            validation.stats.folders++;
          } else {
            validation.stats.requests++;
          }
        });
      }
      
      if (brunoCollection.root?.request?.vars) {
        validation.stats.variables = [
          ...(brunoCollection.root.request.vars.req || []),
          ...(brunoCollection.root.request.vars.res || [])
        ].length;
      }
      
      validation.stats.hasAuth = !!(brunoCollection.root?.request?.auth?.mode && 
        brunoCollection.root.request.auth.mode !== 'none');
    }

    res.json(validation);

  } catch (error) {
    res.status(400).json({ 
      error: 'Validation failed', 
      details: error.message 
    });
  }
});

// Apply upload error handling middleware
router.use(handleUploadError);

module.exports = router;