const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    let token = req.header('x-auth-token');

    const authHeader = req.header('authorization');
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'game_on_super_secret_jwt_key_2026');
        const id = decoded.userId || decoded.id;
        req.user = {
            id: id,
            userId: id,
            ...decoded
        };
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        res.status(401).json({ message: 'Token is not valid or expired' });
    }
};