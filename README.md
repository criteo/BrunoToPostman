# <img src="https://github.com/user-attachments/assets/81ee463a-e591-4a93-a78a-7b04b1835af6" alt="dog" width="40"/>  Bruno to 🚀 Postman Converter 🔄

A web application that converts Bruno JSON collections to Postman v2.1.0 format with an intuitive drag-and-drop interface.

## 📋 Description

This tool provides a user-friendly web interface to convert Bruno API collections to Postman format. Built with a clean, modular architecture, this web app offers a modern interface with drag-and-drop functionality, real-time feedback, and automatic downloads.

## 🗂️ Project Structure

```
bruno-converter/
├── src/
│   ├── server.js                    # Main Express server
│   ├── routes/
│   │   └── converter.js             # API route handlers
│   ├── services/
│   │   └── bruno-converter.js       # Main conversion orchestrator
│   ├── mappers/
│   │   ├── auth-mapper.js           # Authentication mapping
│   │   ├── body-mapper.js           # Body/payload mapping
│   │   ├── url-mapper.js            # URL parsing and mapping
│   │   ├── script-converter.js      # Script conversion
│   │   └── base-mapper.js           # Common utilities
│   ├── utils/
│   │   ├── postman-id.js            # ID generation
│   │   ├── constants.js             # Configuration constants
│   │   └── validators.js            # Input validation
│   └── middleware/
│       └── upload.js                # File upload configuration
├── public/
│   └── index.html                   # Frontend interface
├── tests/                           # Test files (future)
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## 🛠️ Setup Instructions

### 1. Prerequisites

- Node.js (version 14.0.0 or higher)

### 2. Installation

```bash
# Clone or create the project directory
mkdir bruno-converter
cd bruno-converter

# Create the directory structure
mkdir -p src/{routes,services,mappers,utils,middleware}
mkdir -p tests/{unit,integration,fixtures}
mkdir -p public

# Install dependencies
npm install

# Optional: Install development dependencies
npm install --save-dev nodemon jest eslint supertest
```

### 3. Configuration

Copy all the provided source files to their respective directories:
- Place server files in `src/`
- Place frontend file in `public/`
- Ensure `package.json` has `"main": "src/server.js"`

### 4. Run the Application

```bash
# Start the server (production)
npm start

# Start with auto-restart (development)
npm run dev

# Run tests (when implemented)
npm test

# Check code quality
npm run lint
```

### 5. Access the App

Open your browser and go to: http://localhost:3000

## ✨ Features

### 🎨 Modern Interface

- Drag & drop file upload with visual feedback
- Clean, responsive design
- Real-time progress indicators
- Automatic file download

### 🔧 Enhanced Functionality

- Modular architecture
- File validation (JSON only, 10MB limit)
- Comprehensive error handling
- Conversion statistics display
- RESTful API endpoints

### 📱 User Experience

- Works on desktop and mobile
- Visual feedback during conversion
- Success/error notifications
- Reset functionality for multiple conversions
- Detailed error messages

### 🏗️ Architecture Benefits

- **Modular Design**: Separated concerns for maintainability
- **Testable**: Each component can be unit tested
- **Scalable**: Easy to add new features and auth types
- **Reusable**: Core logic works independently of Express
- **Professional**: Follows Node.js best practices

## 🚀 How It Works

1. **Upload**: Users drag & drop or select their Bruno JSON file
2. **Validate**: The app checks file type, size, and structure
3. **Convert**: Modular conversion pipeline processes the file
4. **Download**: The converted Postman collection downloads automatically

## 📊 Supported Conversions

The converter handles all major Bruno features:

- ✅ **Collections & Folders**: Complete hierarchy preservation
- ✅ **Authentication**: Bearer, Basic, API Key, OAuth2, AWS, Digest
- ✅ **Variables**: Collection, environment, and request-level variables
- ✅ **Scripts**: Pre-request and test scripts with Bruno→Postman syntax conversion
- ✅ **Request Methods**: GET, POST, PUT, DELETE, PATCH, etc.
- ✅ **Headers**: Custom headers with enable/disable state
- ✅ **Body Types**: JSON, Form-data, URL-encoded, Raw, GraphQL
- ✅ **Parameters**: Query parameters and path variables
- ✅ **URL Structure**: Complex URLs with variables and parameters
- ✅ **Path Variables**: Both `{{variable}}` and `{pathParam}` formats

## 📝 Usage Example

1. Start the server: `npm run dev`
2. Open http://localhost:3000 in your browser
3. Drag your Bruno `.json` file onto the upload area
4. Click "Convert to Postman"
5. The converted file downloads automatically as `.postman_collection.json`

## 🛡️ Error Handling

The application includes comprehensive error handling for:

- Invalid file formats
- File size limits (10MB max)
- Malformed JSON structure
- Invalid Bruno collection format
- Conversion errors with detailed messages
- Network and server issues

## 🔄 Advantages Over CLI Version

This web app is much more user-friendly than CLI alternatives:

- **No file path management** - just drag and drop
- **Visual feedback** - see progress and results in real-time
- **Clear error messages** - clear, actionable feedback
- **Multiple conversions** - easily convert many files
- **Cross-platform** - works on any device with a browser
- **No terminal required** - accessible to non-technical users
- **Structured architecture** - maintainable and extensible

## 🛠️ Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use a different port
PORT=3001 npm start
```

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**File upload fails:**
- Ensure file is valid JSON format (Bruno exported collection)
- Check file size is under 10MB
- Verify file extension is `.json`
- Check browser console for errors

**Conversion errors:**
- Validate your Bruno JSON structure
- Check server logs for detailed error messages
- Ensure file contains `brunoConfig` section
- Try with a simpler collection first

**Frontend issues:**
- Clear browser cache (Ctrl+Shift+R)
- Check browser Developer Tools console
- Verify server is running on http://localhost:3000

## 🧪 Development

### Project Architecture

- **Routes**: Handle HTTP requests and responses
- **Services**: Core business logic and orchestration
- **Mappers**: Domain-specific conversion logic
- **Utils**: Common utilities and helpers
- **Middleware**: Request processing (upload, validation, etc.)

### Adding New Features

**New Authentication Type:**
1. Add constant to `src/utils/constants.js`
2. Add mapper method to `src/mappers/auth-mapper.js`
3. Update the auth mapping switch statement

**New Body Format:**
1. Add constant to `src/utils/constants.js`
2. Add mapper method to `src/mappers/body-mapper.js`
3. Update the body mapping switch statement

### Testing

```bash
# Run unit tests (when implemented)
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## 🤝 Contributing

1. Fork the repository 🍴
2. Create your feature branch 🌿
3. Write tests for your changes 🧪
4. Commit your changes 💾
5. Push to the branch ⬆️
6. Open a Pull Request 📥

## 📞 Support

If you encounter any issues or have questions:

💬 **Send me a message on Slack** → Francesco Aldrovandi

**Debugging steps:**
1. Check the troubleshooting section above
2. Review server console logs for detailed error messages
3. Ensure your Bruno JSON file is valid and properly formatted
4. Test with the health endpoint: `curl http://localhost:3000/health`
5. Check browser Developer Tools for frontend errors


**Built with ❤️ for the API development community**
