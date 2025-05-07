const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtConfig = require('./config/jwt');

const setupSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
            credentials: true
        },
        // Increase timeouts to prevent frequent disconnects
        pingTimeout: 120000,
        pingInterval: 30000,
        // Use polling as a fallback if websocket fails
        transports: ['websocket', 'polling']
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
            const decoded = jwt.verify(token, jwtConfig.secret);
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
                const room = data.room || socket.userId;
                socket.join(room);
                console.log(`Socket ${socket.id} joined room: ${room}`);
            } catch (error) {
                console.error('Error joining room:', error);
            }
        });

        // Handle sending messages - support both event names for compatibility
        socket.on('send_message', handleMessage);
        socket.on('private-message', handleMessage);

        // Message handling function
        async function handleMessage(data) {
            try {
                console.log('Message received:', {
                    from: socket.userId,
                    to: data.to,
                    messageType: data.messageType || 'text',
                    hasContent: !!data.message,
                    hasAttachment: !!data.attachmentUrl
                });

                // Create message object
                const messageObj = {
                    id: data.id || `temp-${Date.now()}`,
                    sender_id: socket.userId,
                    receiver_id: data.to,
                    content: data.message,
                    attachment_url: data.attachmentUrl,
                    message_type: data.messageType || 'text',
                    is_read: false,
                    created_at: new Date().toISOString()
                };

                // Emit to the recipient's room using both event names for compatibility
                io.to(data.to).emit('new_message', messageObj);
                io.to(data.to).emit('private-message', messageObj);

                console.log(`Message emitted to room: ${data.to}`);

                // We no longer store the message in the database here
                // This is now handled exclusively by the HTTP API route
                // to prevent duplicate messages
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        }

        // Handle read receipts
        socket.on('mark_read', (data) => {
            try {
                if (!data.senderId) {
                    return socket.emit('error', { message: 'Sender ID is required' });
                }

                // Emit to the sender's room that messages have been read
                io.to(data.senderId).emit('messages_read', {
                    by: socket.userId,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`Socket disconnected: ${socket.id} for user: ${socket.userId}, reason: ${reason}`);
        });
    });

    return io;
};

module.exports = setupSocket;