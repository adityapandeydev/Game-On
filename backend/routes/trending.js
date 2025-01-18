const express = require('express');
const router = express.Router();
const GameStats = require('../models/GameStats');
const auth = require('../middleware/auth');

// Get trending games
router.get('/', async (req, res) => {
    try {
        const trendingGames = await GameStats.find()
            .sort({ clickCount: -1 })
            .limit(10);

        res.json(trendingGames);
    } catch (error) {
        console.error('Error fetching trending games:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Track game click
router.post('/track/:gameId', auth, async (req, res) => {
    try {
        const { gameId } = req.params;
        const { gameName } = req.body;

        const stats = await GameStats.findOneAndUpdate(
            { gameId },
            { 
                $inc: { clickCount: 1 },
                $set: { 
                    lastClicked: new Date(),
                    gameName: gameName 
                }
            },
            { 
                new: true,
                upsert: true
            }
        );

        res.json(stats);
    } catch (error) {
        console.error('Error tracking game click:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 