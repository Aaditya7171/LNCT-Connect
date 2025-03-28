const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files from the uploads directory
// This is the key fix - ensure the path is correct and the middleware is properly configured
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lnct_connect',
    password: '01020304',
    port: 5432,
});

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database', err);
    } else {
        console.log('Database connected successfully');
        initDb();
    }
});

// Initialize database tables
const initDb = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        profile_picture VARCHAR(255),
        college VARCHAR(255),
        branch VARCHAR(255),
        batch VARCHAR(50),
        linkedin_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database tables:', error);
    }
};

// Make pool available globally
app.locals.pool = pool;

// Routes
app.use('/api/users', userRoutes);

// Add a global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', err);
    res.status(500).json({
        msg: 'Server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});