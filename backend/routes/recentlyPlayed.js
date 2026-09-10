const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db/postgres');

// Get recently played games for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const result = await query('SELECT recently_played FROM users WHERE id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const recent = result.rows[0].recently_played || [];
        res.json(recent);
    } catch (error) {
        console.error('Error fetching recently played games:', error);
        res.status(500).json({ message: 'Server error loading recently played' });
    }
});

// Add a game to recently played
router.post('/track', auth, async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const { gameId, gameName } = req.body;

        if (!gameId || !gameName) {
            return res.status(400).json({ message: 'Game ID and name are required' });
        }

        const userResult = await query('SELECT recently_played FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        let recent = userResult.rows[0].recently_played || [];
        // Filter out existing occurrence of this game
        recent = recent.filter(g => g.gameId !== gameId);
        // Prepend new play event
        recent.unshift({
            gameId,
            gameName,
            lastPlayed: new Date().toISOString()
        });
        // Keep top 5
        recent = recent.slice(0, 5);

        await query('UPDATE users SET recently_played = $1 WHERE id = $2', [JSON.stringify(recent), userId]);

        res.json(recent);
    } catch (error) {
        console.error('Error tracking recently played game:', error);
        res.status(500).json({ message: 'Server error saving recently played' });
    }
});

module.exports = router;