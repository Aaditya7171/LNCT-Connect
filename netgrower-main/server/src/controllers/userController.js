const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '992f26e6d5a978bc559892942aeb66d573c4c38877823f64f104c925784f73a6';

// Register a new user
exports.registerUser = async (req, res) => {
  const { email, password, name } = req.body;
  const pool = req.app.locals.pool;

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.rows[0].id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const pool = req.app.locals.pool;

  try {
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  const { userId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const result = await pool.query(
      'SELECT id, name, email, profile_picture, college, branch, batch, linkedin_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { name, email, college, branch, batch, linkedinUrl } = req.body;
  const pool = req.app.locals.pool;

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare profile picture path if a file was uploaded
    let profilePicturePath = userCheck.rows[0].profile_picture;
    if (req.file) {
      profilePicturePath = `/uploads/profile/${req.file.filename}`;
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name), 
           email = COALESCE($2, email), 
           profile_picture = COALESCE($3, profile_picture), 
           college = COALESCE($4, college), 
           branch = COALESCE($5, branch), 
           batch = COALESCE($6, batch), 
           linkedin_url = COALESCE($7, linkedin_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, name, email, profile_picture, college, branch, batch, linkedin_url`,
      [name, email, profilePicturePath, college, branch, batch, linkedinUrl, userId]
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update the updateUser function to properly handle all profile fields
exports.updateUser = async (req, res) => {
  const userId = req.params.id;
  const pool = req.app.locals.pool;

  try {
    // Log the incoming update request
    console.log('Updating user profile:', {
      userId,
      body: req.body
    });

    // Extract all possible profile fields from the request
    const { name, email, college, branch, batch, linkedin_url } = req.body;

    // Build the SQL query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(name);
      paramIndex++;
    }

    if (email) {
      updateFields.push(`email = $${paramIndex}`);
      queryParams.push(email);
      paramIndex++;
    }

    if (college !== undefined) {
      updateFields.push(`college = $${paramIndex}`);
      queryParams.push(college || null); // Allow empty string to be stored as null
      paramIndex++;
    }

    if (branch !== undefined) {
      updateFields.push(`branch = $${paramIndex}`);
      queryParams.push(branch || null);
      paramIndex++;
    }

    if (batch !== undefined) {
      updateFields.push(`batch = $${paramIndex}`);
      queryParams.push(batch || null);
      paramIndex++;
    }

    if (linkedin_url !== undefined) {
      updateFields.push(`linkedin_url = $${paramIndex}`);
      queryParams.push(linkedin_url || null);
      paramIndex++;
    }

    // Add userId as the last parameter
    queryParams.push(userId);

    // If no fields to update, return early
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Construct and execute the query
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING id, name, email, profile_picture, college, branch, batch, linkedin_url
    `;

    console.log('Executing SQL query:', query, 'with params:', queryParams);

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated successfully:', result.rows[0]);

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update the getUser function to return all profile fields
exports.getUser = async (req, res) => {
  const userId = req.params.id;
  const pool = req.app.locals.pool;

  try {
    // Get user by ID with all profile fields
    const result = await pool.query(
      'SELECT id, name, email, profile_picture, college, branch, batch, linkedin_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the user data being returned
    console.log('Returning user data:', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};