const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lnct_connect',
    password: process.env.DB_PASSWORD || '01020304',
    port: process.env.DB_PORT || 5432,
});

async function createForumTables() {
    try {
        // Create forum_posts table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS forum_posts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                image_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Forum posts table created successfully');

        // Create index for faster post retrieval
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_forum_posts_user 
            ON forum_posts(user_id);
        `);
        console.log('Forum posts index created successfully');

        // Create forum_comments table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS forum_comments (
                id SERIAL PRIMARY KEY,
                post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Forum comments table created successfully');

        // Create index for faster comment retrieval
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_forum_comments_post 
            ON forum_comments(post_id);
        `);
        console.log('Forum comments index created successfully');

        // Create forum_likes table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS forum_likes (
                id SERIAL PRIMARY KEY,
                post_id INTEGER NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(post_id, user_id)
            );
        `);
        console.log('Forum likes table created successfully');

        // Create index for faster like retrieval
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_forum_likes_post 
            ON forum_likes(post_id);
        `);
        console.log('Forum likes index created successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error creating forum tables:', error);
        process.exit(1);
    }
}

createForumTables();
