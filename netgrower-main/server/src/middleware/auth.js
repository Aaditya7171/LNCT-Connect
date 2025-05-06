const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

module.exports = function (req, res, next) {
    // Get token from header (support both formats)
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

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

        console.log(`Auth middleware: Token valid for user ID ${req.user.userId}`);
        next();
    } catch (err) {
        console.error('Auth middleware: Token verification failed', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};