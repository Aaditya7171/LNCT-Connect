const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// If you have auth middleware, uncomment the next line
// const auth = require('../middleware/auth');

// Get all users with connection status for a specific user
router.get('/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Fetching network users for userId:', userId);

        // Query to get all users except the current user, with their connection status
        const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.college, 
        u.branch, 
        u.batch, 
        COALESCE(u.profile_picture, '') as profile_picture,
        COALESCE(
          (SELECT 
            CASE 
              WHEN c.status = 'accepted' THEN 'connected'
              WHEN c.status = 'pending' AND c.user_id = $1 THEN 'pending-sent'
              WHEN c.status = 'pending' AND c.target_user_id = $1 THEN 'pending-received'
              ELSE 'none'
            END
          FROM connections c 
          WHERE (c.user_id = $1 AND c.target_user_id = u.id) 
          OR (c.user_id = u.id AND c.target_user_id = $1)
          LIMIT 1), 
        'none') as connection_status
      FROM users u
      WHERE u.id != $1
      ORDER BY u.name
    `;

        const result = await pool.query(query, [userId]);
        console.log(`Found ${result.rows.length} users`);

        res.json({ users: result.rows });
    } catch (error) {
        console.error('Error fetching network users:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update connection status
router.post('/update', async (req, res) => {
    const client = await pool.connect();

    try {
        const { userId, targetUserId, status } = req.body;
        console.log('Updating connection:', { userId, targetUserId, status });

        if (!userId || !targetUserId || !status) {
            return res.status(400).json({ msg: 'Missing required fields' });
        }

        await client.query('BEGIN');

        // Check if connection already exists
        const checkQuery = `
      SELECT * FROM connections 
      WHERE (user_id = $1 AND target_user_id = $2) 
      OR (user_id = $2 AND target_user_id = $1)
    `;
        const checkResult = await client.query(checkQuery, [userId, targetUserId]);

        if (checkResult.rows.length > 0) {
            const existingConnection = checkResult.rows[0];

            if (status === 'connected') {
                // Accept connection request
                if (existingConnection.status === 'pending' && existingConnection.target_user_id.toString() === userId) {
                    await client.query(
                        'UPDATE connections SET status = $1, updated_at = NOW() WHERE id = $2',
                        ['accepted', existingConnection.id]
                    );
                } else {
                    throw new Error('Cannot accept this connection request');
                }
            } else if (status === 'none') {
                // Remove connection
                await client.query('DELETE FROM connections WHERE id = $1', [existingConnection.id]);
            } else {
                // Update existing connection
                await client.query(
                    'UPDATE connections SET status = $1, updated_at = NOW() WHERE id = $2',
                    [status === 'pending' ? 'pending' : status, existingConnection.id]
                );
            }
        } else if (status === 'pending') {
            // Create new pending connection
            await client.query(
                'INSERT INTO connections (user_id, target_user_id, status) VALUES ($1, $2, $3)',
                [userId, targetUserId, 'pending']
            );
        }

        await client.query('COMMIT');

        res.json({ msg: 'Connection updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating connection:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;