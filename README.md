🐶Bruno to 🚀Postman Converter 🔄
A modern web application that converts Bruno JSON collections to Postman v2.1.0 format with an intuitive drag-and-drop interface.


📋 Description
This tool provides a user-friendly web interface to convert Bruno API collections to Postman format. Unlike command-line tools, this web app offers a modern interface with drag-and-drop functionality, real-time feedback, and automatic downloads.

🛠️ Setup Instructions
1. Project Structure
Create this folder structure:
bruno-converter/
├── server.js          (main server file)
├── package.json       (dependencies)
├── public/
│   └── index.html     (frontend interface)
└── README.md          (this file)
2. Prerequisites

Node.js (version 14.0.0 or higher)
npm (comes with Node.js)

3. Installation
bash# Navigate to your project folder
cd bruno-converter

# Install dependencies
npm install

# Optional: Install nodemon for development
npm install --save-dev nodemon
4. Run the Application
bash# Start the server
npm start

# Or for development with auto-restart
npm run dev
5. Access the App
Open your browser and go to: http://localhost:3000
✨ Features
🎨 Modern Interface

Drag & drop file upload
Clean, responsive design
Real-time progress feedback
Automatic file download

🔧 Enhanced Functionality

No more fixed input/output directories
File validation (JSON only, 10MB limit)
Better error handling
Conversion statistics display

📱 User Experience

Works on desktop and mobile
Visual feedback during conversion
Success/error notifications
Reset functionality for multiple conversions

🚀 How It Works

Upload: Users drag & drop or select their Bruno JSON file
Validate: The app checks file type and size
Convert: Your original conversion logic processes the file
Download: The converted Postman collection downloads automatically

📊 Supported Conversions
The converter handles all major Bruno features:

✅ Collections & Folders: Complete hierarchy preservation
✅ Authentication: Bearer, Basic, API Key, OAuth2, AWS, Digest
✅ Variables: Collection, environment, and request-level variables
✅ Scripts: Pre-request and test scripts with Bruno→Postman syntax conversion
✅ Request Methods: GET, POST, PUT, DELETE, PATCH, etc.
✅ Headers: Custom headers with enable/disable state
✅ Body Types: JSON, Form-data, URL-encoded, Raw, GraphQL
✅ Parameters: Query parameters and path variables
✅ URL Structure: Complex URLs with variables and parameters


📝 Usage Example

Start the server: npm start
Open http://localhost:3000 in your browser
Drag your Bruno .json file onto the upload area
Click "Convert to Postman"
The converted file downloads automatically as .postman_collection.json

🛡️ Error Handling
The application includes comprehensive error handling for:

Invalid file formats
File size limits (10MB max)
Malformed JSON
Conversion errors
Network issues

🔄 Advantages Over CLI Version
This web app is much more user-friendly than CLI version:

No file path management - just drag and drop
Visual feedback - see progress and results
Better error messages - clear, actionable feedback
Multiple conversions - easily convert many files
Cross-platform - works on any device with a browser
No terminal required - accessible to non-technical users

🤝 Contributing

Fork the repository 🍴
Create your feature branch 🌿
Commit your changes  💾
Push to the branch ⬆️ 
Open a Pull Request 📥


🐛 Troubleshooting
Common Issues
Port already in use:
bash# Kill process on port 3000
npx kill-port 3000
# Or use a different port
PORT=3001 npm start
File upload fails:

Ensure file is valid JSON format (BRUNO Exported collection)
Check file size is under 10MB
Verify file extension is .json

Conversion errors:

Validate your Bruno JSON structure
Check server logs for detailed error messages

📞 Support
If you encounter any issues or have questions:
💬 Send me a message on Slack -> Francesco Aldrovandi

Check the troubleshooting section above
Review server console logs for detailed error messages
Ensure your Bruno JSON file is valid and properly formatted

Made with ❤️ for the API development community