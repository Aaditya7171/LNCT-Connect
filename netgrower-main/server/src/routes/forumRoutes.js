const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/forum');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage for forum post images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'forum-' + uniqueSuffix + ext);
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
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Get all forum posts
router.get('/posts', async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const query = `
            SELECT
                fp.id,
                fp.content,
                fp.image_url,
                fp.created_at,
                fp.updated_at,
                u.id as user_id,
                u.name as user_name,
                u.profile_picture,
                COALESCE(l.like_count, 0) as likes,
                COALESCE(c.comment_count, 0) as comments
            FROM
                forum_posts fp
            JOIN
                users u ON fp.user_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM forum_likes
                GROUP BY post_id
            ) l ON fp.id = l.post_id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as comment_count
                FROM forum_comments
                GROUP BY post_id
            ) c ON fp.id = c.post_id
            ORDER BY
                fp.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching forum posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get trending forum posts (sorted by likes)
router.get('/posts/trending', async (req, res) => {
    try {
        const pool = req.app.locals.pool;

        const query = `
            SELECT
                fp.id,
                fp.content,
                fp.image_url,
                fp.created_at,
                fp.updated_at,
                u.id as user_id,
                u.name as user_name,
                u.profile_picture,
                COALESCE(l.like_count, 0) as likes,
                COALESCE(c.comment_count, 0) as comments
            FROM
                forum_posts fp
            JOIN
                users u ON fp.user_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM forum_likes
                GROUP BY post_id
            ) l ON fp.id = l.post_id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as comment_count
                FROM forum_comments
                GROUP BY post_id
            ) c ON fp.id = c.post_id
            ORDER BY
                likes DESC, fp.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching trending forum posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific forum post with comments
router.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = req.app.locals.pool;

        // Get post details
        const postQuery = `
            SELECT
                fp.id,
                fp.content,
                fp.image_url,
                fp.created_at,
                fp.updated_at,
                u.id as user_id,
                u.name as user_name,
                u.profile_picture,
                COALESCE(l.like_count, 0) as likes,
                COALESCE(c.comment_count, 0) as comments
            FROM
                forum_posts fp
            JOIN
                users u ON fp.user_id = u.id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as like_count
                FROM forum_likes
                GROUP BY post_id
            ) l ON fp.id = l.post_id
            LEFT JOIN (
                SELECT post_id, COUNT(*) as comment_count
                FROM forum_comments
                GROUP BY post_id
            ) c ON fp.id = c.post_id
            WHERE
                fp.id = $1
        `;

        const postResult = await pool.query(postQuery, [id]);

        if (postResult.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Get comments for the post
        const commentsQuery = `
            SELECT
                fc.id,
                fc.content,
                fc.created_at,
                u.id as user_id,
                u.name as user_name,
                u.profile_picture
            FROM
                forum_comments fc
            JOIN
                users u ON fc.user_id = u.id
            WHERE
                fc.post_id = $1
            ORDER BY
                fc.created_at ASC
        `;

        const commentsResult = await pool.query(commentsQuery, [id]);

        // Combine post and comments
        const post = postResult.rows[0];
        post.comments = commentsResult.rows;

        res.json(post);
    } catch (error) {
        console.error('Error fetching forum post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new forum post
router.post('/posts', auth, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.userId;
        const pool = req.app.locals.pool;

        // Validate input
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        // Get image URL if an image was uploaded
        const imageUrl = req.file ? `/uploads/forum/${req.file.filename}` : null;

        // Insert post into database
        const query = `
            INSERT INTO forum_posts (user_id, content, image_url)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(query, [userId, content, imageUrl]);

        // Get user details
        const userQuery = `
            SELECT id, name, profile_picture
            FROM users
            WHERE id = $1
        `;

        const userResult = await pool.query(userQuery, [userId]);

        // Combine post and user details
        const post = result.rows[0];
        post.user_id = userResult.rows[0].id;
        post.user_name = userResult.rows[0].name;
        post.profile_picture = userResult.rows[0].profile_picture;
        post.likes = 0;
        post.comments = 0;

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating forum post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a comment to a post
router.post('/posts/:id/comments', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.userId;
        const pool = req.app.locals.pool;

        // Validate input
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        // Check if post exists
        const postCheck = await pool.query('SELECT * FROM forum_posts WHERE id = $1', [id]);

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Insert comment into database
        const query = `
            INSERT INTO forum_comments (post_id, user_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `;

        const result = await pool.query(query, [id, userId, content]);

        // Get user details
        const userQuery = `
            SELECT id, name, profile_picture
            FROM users
            WHERE id = $1
        `;

        const userResult = await pool.query(userQuery, [userId]);

        // Combine comment and user details
        const comment = result.rows[0];
        comment.user_id = userResult.rows[0].id;
        comment.user_name = userResult.rows[0].name;
        comment.profile_picture = userResult.rows[0].profile_picture;

        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/unlike a post
router.post('/posts/:id/like', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const pool = req.app.locals.pool;

        // Check if post exists
        const postCheck = await pool.query('SELECT * FROM forum_posts WHERE id = $1', [id]);

        if (postCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user already liked the post
        const likeCheck = await pool.query(
            'SELECT * FROM forum_likes WHERE post_id = $1 AND user_id = $2',
            [id, userId]
        );

        let action;

        if (likeCheck.rows.length > 0) {
            // User already liked the post, so unlike it
            await pool.query(
                'DELETE FROM forum_likes WHERE post_id = $1 AND user_id = $2',
                [id, userId]
            );
            action = 'unliked';
        } else {
            // User hasn't liked the post yet, so like it
            await pool.query(
                'INSERT INTO forum_likes (post_id, user_id) VALUES ($1, $2)',
                [id, userId]
            );
            action = 'liked';
        }

        // Get updated like count
        const likeCountQuery = `
            SELECT COUNT(*) as like_count
            FROM forum_likes
            WHERE post_id = $1
        `;

        const likeCountResult = await pool.query(likeCountQuery, [id]);
        const likeCount = parseInt(likeCountResult.rows[0].like_count);

        res.json({ action, likes: likeCount });
    } catch (error) {
        console.error('Error liking/unliking post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
