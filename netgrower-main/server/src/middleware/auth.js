const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = function (req, res, next) {
    // Log the request path for debugging
    console.log(`Auth middleware for: ${req.method} ${req.path}`);

    // Get token from header (support both formats)
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    // Log token presence (not the actual token)
    console.log(`Auth token present: ${!!token}, length: ${token ? token.length : 0}`);

    // Check if no token
    if (!token) {
        console.log('Auth middleware: No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token using the central JWT secret
        const decoded = jwt.verify(token, jwtConfig.secret);

        // Add user from payload - handle both formats
        req.user = decoded;

        // Ensure userId is available in a consistent format
        req.user.userId = decoded.userId || decoded.id || (decoded.user && decoded.user.id);
        req.user.id = req.user.userId; // Ensure id is also available

        console.log(`Auth middleware: Token valid for user ID ${req.user.userId}`);

        // Check if the user is trying to update their own profile
        if (req.method === 'PUT' && req.path.match(/^\/\d+$/) && req.params.id) {
            const requestedUserId = req.params.id;
            if (req.user.userId != requestedUserId) {
                console.error(`Auth middleware: User ${req.user.userId} attempted to update profile of user ${requestedUserId}`);
                return res.status(401).json({ message: 'Not authorized to update this profile' });
            }
        }

        next();
    } catch (err) {
        console.error('Auth middleware: Token verification failed', err.message);
        res.status(401).json({ message: 'Token is not valid or has expired' });
    }
};