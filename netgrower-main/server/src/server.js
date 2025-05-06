const express = require('express');
const http = require('http');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const setupSocket = require('./socket');
require('dotenv').config();

// Create Express app
const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/netgrower',
});

// Make the pool available to all routes
app.locals.pool = pool;

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log authentication headers
  if (req.headers.authorization || req.headers['x-auth-token']) {
    console.log('Auth headers present:', {
      authorization: req.headers.authorization ? 'Bearer token present' : 'None',
      xAuthToken: req.headers['x-auth-token'] ? 'Token present' : 'None'
    });
  } else {
    console.log('No auth headers present');
  }
  
  next();
});

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/connections', require('./routes/connections'));

// Health check endpoint
app.get('/health-check', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Create HTTP server
const server = http.createServer(app);

// Make the app available to the server for socket.io
server.app = app;

// Set up Socket.IO
const io = setupSocket(server);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('Server shutting down');
  pool.end();
  process.exit(0);
});