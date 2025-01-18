const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        console.log('No token provided'); // Debug log
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('Token verified for user:', decoded.userId); // Debug log
        next();
    } catch (err) {
        console.error('Token verification failed:', err); // Debug log
        res.status(401).json({ message: 'Token is not valid' });
    }
}; 