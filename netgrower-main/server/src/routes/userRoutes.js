const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: fileFilter
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || '992f26e6d5a978bc559892942aeb66d573c4c38877823f64f104c925784f73a6';

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const pool = req.app.locals.pool;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
      [email, hashedPassword, name]
    );

    // Create JWT token
    const token = jwt.sign(
      { userId: newUser.rows[0].id },  // Change from id to userId for consistency
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user and token
    res.json({
      token,
      user: {
        id: newUser.rows[0].id,
        name: newUser.rows[0].name,
        email: newUser.rows[0].email
      }
    });
  } catch (err) {
    console.error('Error in register route:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const pool = req.app.locals.pool;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ msg: 'User does not exist' });
    }

    const user = userCheck.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id },  // Change from id to userId for consistency
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user and token
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile_picture: user.profile_picture,
        college: user.college,
        branch: user.branch,
        batch: user.batch,
        linkedin_url: user.linkedin_url
      }
    });
  } catch (err) {
    console.error('Error in login route:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Check if email exists
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    const pool = req.app.locals.pool;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const pool = req.app.locals.pool;

    const result = await pool.query('SELECT id, name, email, profile_picture, college, branch, batch, linkedin_url FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Update user profile - handle basic info without file
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const pool = req.app.locals.pool;
    
    // Check if user exists
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user is authorized to update this profile
    if (req.user.id != userId) {
      return res.status(401).json({ msg: 'Not authorized to update this profile' });
    }
    
    // Prepare update data
    const { name, email, college, branch, batch, linkedin_url } = req.body;
    
    // Update user in database
    const updateResult = await pool.query(
      'UPDATE users SET name = $1, email = $2, college = $3, branch = $4, batch = $5, linkedin_url = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [
        name || user.name,
        email || user.email,
        college || user.college,
        branch || user.branch,
        batch || user.batch,
        linkedin_url || user.linkedin_url,
        userId
      ]
    );
    
    // Return updated user
    const updatedUser = updateResult.rows[0];
    res.json({
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile_picture: updatedUser.profile_picture,
        college: updatedUser.college,
        branch: updatedUser.branch,
        batch: updatedUser.batch,
        linkedin_url: updatedUser.linkedin_url
      }
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Add a separate route for profile picture upload
// Update the avatar upload route to ensure proper error handling and file path construction
router.post('/:id/avatar', auth, async (req, res) => {
  try {
    // Use multer middleware for this specific request
    upload.single('avatar')(req, res, async function(err) {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(400).json({ msg: 'File upload error', error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
      }

      const userId = req.params.id;
      const pool = req.app.locals.pool;
      
      // Check if user exists
      let userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Check if user is authorized to update this profile
      if (req.user.id != userId) {
        return res.status(401).json({ msg: 'Not authorized to update this profile' });
      }
      
      // Delete old profile picture if exists
      if (user.profile_picture) {
        const oldPicturePath = path.join(__dirname, '../..', user.profile_picture);
        if (fs.existsSync(oldPicturePath)) {
          try {
            fs.unlinkSync(oldPicturePath);
          } catch (unlinkErr) {
            console.error('Error deleting old profile picture:', unlinkErr);
          }
        }
      }
      
      // Set new profile picture path - ensure this path is correct
      const profilePicturePath = `/uploads/profile/${req.file.filename}`;
      
      // Update user in database
      await pool.query(
        'UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [profilePicturePath, userId]
      );
      
      // Return the updated profile picture path
      res.json({ 
        msg: 'Profile picture updated successfully',
        profile_picture: profilePicturePath
      });
    });
  } catch (err) {
    console.error('Error in avatar upload route:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Add this route to test static file serving
router.get('/test-static', (req, res) => {
  res.send(`
    <html>
      <head><title>Static File Test</title></head>
      <body>
        <h1>Static File Serving Test</h1>
        <p>If you can see an image below, static file serving is working:</p>
        <img src="/uploads/profile/test-image.jpg" alt="Test Image" onerror="this.onerror=null;this.src='/uploads/test-fallback.jpg';this.alt='Fallback Image';" />
        <p>Current uploads directory: ${path.join(__dirname, '../../uploads')}</p>
        <p>Files in uploads directory:</p>
        <pre>${
          fs.existsSync(path.join(__dirname, '../../uploads')) 
            ? JSON.stringify(fs.readdirSync(path.join(__dirname, '../../uploads'), { recursive: true }), null, 2) 
            : 'Directory does not exist'
        }</pre>
      </body>
    </html>
  `);
});
module.exports = router;