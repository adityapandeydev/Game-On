const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GameStats = require('../models/GameStats');

// Update game stats
router.post('/update', auth, async (req, res) => {
    try {
        const { gameId, currentScore, currentStreak } = req.body;
        const userId = req.user.id;

        const stats = await GameStats.findOneAndUpdate(
            { userId, gameId },
            { 
                $set: { 
                    currentScore,
                    currentStreak,
                    timestamp: new Date()
                }
            },
            { upsert: true, new: true }
        );

        res.json(stats);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get user's game stats
router.get('/:gameId', auth, async (req, res) => {
    try {
        const stats = await GameStats.findOne({
            userId: req.user.id,
            gameId: req.params.gameId
        });

        res.json(stats || { currentScore: 0, currentStreak: 0 });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 