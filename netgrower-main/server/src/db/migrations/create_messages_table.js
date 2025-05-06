const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'lnct_connect',
    password: '01020304',
    port: 5432,
});

async function createMessagesTable() {
    try {
        // Create messages table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        content TEXT,
        attachment_url TEXT,
        message_type VARCHAR(20) DEFAULT 'text',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('Messages table created successfully');

        // Create index for faster message retrieval
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver 
      ON messages(sender_id, receiver_id);
    `);

        console.log('Messages index created successfully');

        // Create index for unread messages
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_unread 
      ON messages(receiver_id, is_read) 
      WHERE is_read = FALSE;
    `);

        console.log('Unread messages index created successfully');

        process.exit(0);
    } catch (error) {
        console.error('Error creating messages table:', error);
        process.exit(1);
    }
}

createMessagesTable();