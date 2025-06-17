// src/server.js
import express from 'express';
import path from 'node:path';
import converterRoutes from './routes/converter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use('/api', converterRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🐶 Bruno to 🚀 Postman Converter running at http://localhost:${PORT}`);
  console.log(`📁 Upload your Bruno JSON files and convert them to Postman format!`);
});

export default app;
