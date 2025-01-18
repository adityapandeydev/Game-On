const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get recently played games for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching recently played games for user:', req.user.userId); // Debug log

        const user = await User.findById(req.user.userId);
        if (!user) {
            console.log('User not found:', req.user.userId); // Debug log
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Found user recent games:', user.recentlyPlayed); // Debug log
        res.json(user.recentlyPlayed || []);
    } catch (error) {
        console.error('Error fetching recently played games:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a game to recently played
router.post('/track', auth, async (req, res) => {
    try {
        const { gameId, gameName } = req.body;
        
        if (!gameId || !gameName) {
            return res.status(400).json({ message: 'Game ID and name are required' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.addRecentlyPlayed(gameId, gameName);
        res.json(user.recentlyPlayed);
    } catch (error) {
        console.error('Error tracking recently played game:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 