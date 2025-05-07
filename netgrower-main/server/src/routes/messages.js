const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Configure multer storage for message attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'msg-' + uniqueSuffix + ext);
  }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DOCX files are allowed.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Get all conversations for a user
router.get('/conversations/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the authenticated user is accessing their own data
    if (req.user.userId != userId) {
      console.log(`Auth mismatch: ${req.user.userId} trying to access ${userId}'s conversations`);
      return res.status(403).json({ message: 'Not authorized to access these conversations' });
    }

    const pool = req.app.locals.pool;

    // Get all users the current user has exchanged messages with
    const query = `
      SELECT DISTINCT
        CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END as user_id,
        u.name,
        u.profile_picture,
        c.status as connection_status,
        (
          SELECT content
          FROM messages
          WHERE (sender_id = $1 AND receiver_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
             OR (sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AND receiver_id = $1)
          ORDER BY created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT created_at
          FROM messages
          WHERE (sender_id = $1 AND receiver_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
             OR (sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AND receiver_id = $1)
          ORDER BY created_at DESC
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
            AND receiver_id = $1
            AND is_read = false
        ) as unread_count
      FROM messages m
      JOIN users u ON (
        CASE
          WHEN m.sender_id = $1 THEN m.receiver_id
          ELSE m.sender_id
        END = u.id
      )
      LEFT JOIN connections c ON (
        (c.user_id = $1 AND c.target_user_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
        OR
        (c.user_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END AND c.target_user_id = $1)
      )
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY last_message_time DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json({ conversations: result.rows });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get message requests (unread messages from users not in connections)
router.get('/requests/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the authenticated user is accessing their own data
    if (req.user.userId != userId) {
      console.log(`Auth mismatch: ${req.user.userId} trying to access ${userId}'s message requests`);
      return res.status(403).json({ message: 'Not authorized to access these message requests' });
    }

    const pool = req.app.locals.pool;

    // Get message requests
    const query = `
      SELECT DISTINCT
        m.sender_id as user_id,
        u.name,
        u.profile_picture,
        (
          SELECT COUNT(*)
          FROM messages
          WHERE sender_id = m.sender_id
            AND receiver_id = $1
            AND is_read = false
        ) as unread_count
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN connections c ON
        (c.user_id = $1 AND c.target_user_id = m.sender_id)
        OR
        (c.user_id = m.sender_id AND c.target_user_id = $1)
      WHERE m.receiver_id = $1
        AND m.is_read = false
        AND (c.id IS NULL OR c.status != 'accepted')
      ORDER BY unread_count DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Error fetching message requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages between two users
router.get('/:userId/:targetUserId', auth, async (req, res) => {
  try {
    const { userId, targetUserId } = req.params;
    const authenticatedUserId = req.user.userId;

    // Verify the authenticated user is one of the participants in the conversation
    // Allow access if the authenticated user is either the userId or targetUserId
    if (authenticatedUserId != userId && authenticatedUserId != targetUserId) {
      console.log(`Auth mismatch: ${authenticatedUserId} trying to access conversation between ${userId} and ${targetUserId}`);
      return res.status(403).json({ message: 'Not authorized to access these messages' });
    }

    const pool = req.app.locals.pool;

    // Get messages between the two users
    const query = `
      SELECT * FROM messages
      WHERE (sender_id = $1 AND receiver_id = $2)
      OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
    `;

    const result = await pool.query(query, [userId, targetUserId]);
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/read', auth, async (req, res) => {
  try {
    const { userId, senderId } = req.body;

    // Verify the authenticated user is marking their own messages as read
    if (req.user.userId != userId) {
      console.log(`Auth mismatch: ${req.user.userId} trying to mark ${userId}'s messages as read`);
      return res.status(403).json({ message: 'Not authorized to mark these messages as read' });
    }

    const pool = req.app.locals.pool;

    // Mark messages as read
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false
      RETURNING id
    `;

    const result = await pool.query(query, [senderId, userId]);

    // Notify the sender that their messages were read via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(senderId).emit('messages-read', {
        by: userId,
        count: result.rowCount
      });
    }

    res.json({
      message: 'Messages marked as read',
      count: result.rowCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { sender_id, receiver_id, content, message_type } = req.body;

    console.log('Received message request with body:', {
      sender_id,
      receiver_id,
      content: content ? content.substring(0, 20) + '...' : null,
      message_type,
      hasFile: !!req.file
    });

    // Verify the authenticated user is sending the message
    if (req.user.userId != sender_id) {
      console.log(`Auth mismatch: ${req.user.userId} trying to send message as ${sender_id}`);
      return res.status(403).json({ message: 'Not authorized to send message as this user' });
    }

    const pool = req.app.locals.pool;

    // Handle file attachment if present
    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/messages/${req.file.filename}`;
      console.log('File uploaded to:', attachmentUrl);
    }

    // First, check the structure of the messages table
    try {
      const tableInfo = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name IN ('sender_id', 'receiver_id')
        LIMIT 1
      `);

      console.log('Messages table column info:', tableInfo.rows);

      // Determine if sender_id is integer or varchar
      const isIntegerType = tableInfo.rows.length > 0 &&
        (tableInfo.rows[0].data_type === 'integer' || tableInfo.rows[0].data_type === 'bigint');

      console.log('Using integer type for IDs:', isIntegerType);

      // Prepare values based on column type
      let senderIdValue, receiverIdValue;

      if (isIntegerType) {
        senderIdValue = parseInt(sender_id, 10);
        receiverIdValue = parseInt(receiver_id, 10);

        if (isNaN(senderIdValue) || isNaN(receiverIdValue)) {
          console.error('Invalid sender_id or receiver_id for integer column:', { sender_id, receiver_id });
          return res.status(400).json({ message: 'Invalid sender or receiver ID' });
        }
      } else {
        // Use as string if not integer type
        senderIdValue = sender_id;
        receiverIdValue = receiver_id;
      }

      console.log('Using values for insert:', {
        senderIdValue,
        receiverIdValue,
        content: content || '',
        attachmentUrl,
        messageType: message_type || 'text'
      });

      // Check if message_type column exists
      const columnCheck = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'message_type'
      `);

      let query;
      let queryParams;

      if (columnCheck.rows.length > 0) {
        // If message_type column exists, use it
        query = `
          INSERT INTO messages (sender_id, receiver_id, content, attachment_url, message_type, is_read)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        queryParams = [
          senderIdValue,
          receiverIdValue,
          content || '',  // Ensure content is not null
          attachmentUrl,
          message_type || 'text',
          false
        ];
      } else {
        // If message_type column doesn't exist, don't include it
        query = `
          INSERT INTO messages (sender_id, receiver_id, content, attachment_url, is_read)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        queryParams = [
          senderIdValue,
          receiverIdValue,
          content || '',  // Ensure content is not null
          attachmentUrl,
          false
        ];
      }

      console.log('Using query:', query);
      console.log('With params:', queryParams);

      const result = await pool.query(query, queryParams);

      const newMessage = result.rows[0];
      console.log('Message inserted successfully:', newMessage);

      // Emit message to recipient via socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(receiver_id).emit('private-message', newMessage);
        console.log('Message emitted to socket room:', receiver_id);
      }

      res.status(201).json(newMessage);
    } catch (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    console.error('Request body:', req.body);
    console.error('Request file:', req.file);
    console.error('User ID from token:', req.user.userId);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});



module.exports = router;