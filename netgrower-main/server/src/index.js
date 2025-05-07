const express = require('express');

const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const jwt = require('jsonwebtoken');
const userRoutes = require('./routes/userRoutes');
const connectionsRoutes = require('./routes/connections');
const messageRoutes = require('./routes/messages');
const forumRoutes = require('./routes/forumRoutes');
const pool = require('./config/db');
const setupSocket = require('./socket');
const jwtConfig = require('./config/jwt');

// Create Express app
const app = express();
const server = http.createServer(app);

// Make sure JWT_SECRET is defined consistently
const JWT_SECRET = jwtConfig.secret;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Create message attachments directory
const messageAttachmentsDir = path.join(__dirname, '../uploads/messages');
if (!fs.existsSync(messageAttachmentsDir)) {
  fs.mkdirSync(messageAttachmentsDir, { recursive: true });
}

// Create profile pictures directory
const profileUploadsDir = path.join(__dirname, '../uploads/profile');
if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/forum', forumRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Store pool in app.locals for use in routes
app.locals.pool = pool;

// Make the app available to the server for socket.io
server.app = app;

// Set up Socket.IO using the external socket.js module
const io = setupSocket(server);

// Store the io instance in the app for use in routes
app.set('io', io);

// Start server
const PORT = 5000; // Use port 5000 as requested
console.log('Starting server on port:', PORT);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('Server shutting down');
  pool.end();
  process.exit(0);
});