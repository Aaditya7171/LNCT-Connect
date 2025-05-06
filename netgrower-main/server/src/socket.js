const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtConfig = require('./config/jwt');

// Make sure JWT_SECRET is consistent with the one in index.js
const JWT_SECRET = process.env.JWT_SECRET || '992f26e6d5a978bc559892942aeb66d573c4c38877823f64f104c925784f73a6';

const setupSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
            credentials: true
        },
        pingTimeout: 60000, // Increase ping timeout to prevent frequent disconnects
        pingInterval: 25000 // Adjust ping interval
    });

    // Authentication middleware for Socket.IO
    io.use((socket, next) => {
        try {
            // Accept token from multiple sources
            const token = socket.handshake.auth.token ||
                socket.handshake.headers.authorization?.replace('Bearer ', '') ||
                socket.handshake.headers['x-auth-token'];

            if (!token) {
                console.log('Socket connection rejected: No token provided');
                return next(new Error('Authentication error: No token provided'));
            }

            // Verify the token
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded;

            // Store the user ID for easy access - handle both formats
            socket.userId = decoded.userId || decoded.id || (decoded.user && decoded.user.id);

            if (!socket.userId) {
                console.log('Socket connection rejected: No user ID in token', decoded);
                return next(new Error('Authentication error: Invalid token format'));
            }

            console.log(`Socket authenticated for user ID: ${socket.userId}`);
            next();
        } catch (error) {
            console.error('Socket authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log('New socket connection:', socket.id, 'for user:', socket.userId);

        // Join a room with the user's ID for private messages
        socket.on('join', (data) => {
            try {
                // Handle different data formats
                const room = typeof data === 'object' ? data.room : data;

                // Verify that the room ID matches the authenticated user ID or allow joining any room
                if (room) {
                    socket.join(room.toString());
                    console.log(`Socket ${socket.id} joined room: ${room}`);
                } else {
                    console.error(`Socket ${socket.id} attempted to join with invalid room data`);
                }
            } catch (error) {
                console.error('Error joining room:', error);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // Handle both 'private-message' and 'message' events for compatibility
        const messageHandler = async (data) => {
            try {
                // Handle different message formats
                const to = data.to || data.receiver_id;
                const message = data.message || data.content;
                const attachmentUrl = data.attachmentUrl || data.attachment_url;
                const messageType = data.messageType || data.message_type || 'text';

                if (!to || !message) {
                    console.error('Invalid message data:', data);
                    socket.emit('error', { message: 'Invalid message data' });
                    return;
                }

                console.log(`Emitting message from ${socket.userId} to user ${to}`);

                // Get the database pool from the app
                const pool = server.app.locals.pool;

                // Save the message to the database
                if (pool) {
                    try {
                        const result = await pool.query(
                            `INSERT INTO messages 
               (sender_id, receiver_id, content, attachment_url, message_type, is_read, created_at) 
               VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
               RETURNING *`,
                            [socket.userId, to, message, attachmentUrl, messageType, false]
                        );

                        const savedMessage = result.rows[0];
                        console.log('Message saved to database:', savedMessage.id);

                        // Emit the message to the recipient's room using both event names
                        io.to(to.toString()).emit('private-message', savedMessage);
                        io.to(to.toString()).emit('message', savedMessage);

                        // Also emit back to sender for confirmation
                        socket.emit('message-sent', savedMessage);
                    } catch (dbError) {
                        console.error('Database error saving message:', dbError);
                        socket.emit('error', { message: 'Failed to save message to database' });
                    }
                } else {
                    console.warn('Database pool not available, message not saved');

                    // Still emit the message even if we couldn't save it
                    const tempMessage = {
                        sender_id: socket.userId,
                        receiver_id: to,
                        content: message,
                        attachment_url: attachmentUrl,
                        message_type: messageType,
                        is_read: false,
                        created_at: new Date().toISOString()
                    };

                    io.to(to.toString()).emit('private-message', tempMessage);
                    io.to(to.toString()).emit('message', tempMessage);
                    socket.emit('message-sent', tempMessage);
                }
            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('error', { message: 'Failed to process message' });
            }
        };

        // Register both event handlers to the same function
        socket.on('private-message', messageHandler);
        socket.on('message', messageHandler);

        // Handle marking messages as read
        socket.on('mark-read', async (data) => {
            try {
                const senderId = data.senderId || data.sender_id;

                if (!senderId) {
                    console.error('Invalid mark-read data:', data);
                    socket.emit('error', { message: 'Invalid mark-read data' });
                    return;
                }

                console.log(`Marking messages from ${senderId} to ${socket.userId} as read`);

                // Get the database pool from the app
                const pool = server.app.locals.pool;

                if (pool) {
                    try {
                        const result = await pool.query(
                            `UPDATE messages 
               SET is_read = true 
               WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false 
               RETURNING id`,
                            [senderId, socket.userId]
                        );

                        console.log(`Marked ${result.rowCount} messages as read`);

                        // Notify the sender that their messages were read
                        io.to(senderId.toString()).emit('messages-read', {
                            by: socket.userId,
                            count: result.rowCount
                        });
                    } catch (dbError) {
                        console.error('Database error marking messages as read:', dbError);
                        socket.emit('error', { message: 'Failed to mark messages as read' });
                    }
                } else {
                    console.warn('Database pool not available, messages not marked as read');
                    socket.emit('error', { message: 'Database not available' });
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
                socket.emit('error', { message: 'Failed to mark messages as read' });
            }
        });

        // Send a welcome message to confirm connection
        socket.emit('welcome', {
            message: 'Connected to server',
            userId: socket.userId
        });

        // Handle ping to keep connection alive
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });

        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id} for user: ${socket.userId}, reason: ${reason}`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    // Make io instance available to the Express app
    server.app.set('io', io);

    return io;
};

module.exports = setupSocket;