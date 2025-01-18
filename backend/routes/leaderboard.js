const express = require('express');
const Score = require('../models/Score');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');

// Get game-specific leaderboard
router.get('/game/:gameId', auth, async (req, res) => {
    try {
        console.log('Fetching leaderboard for game:', req.params.gameId);
        const scores = await Score.aggregate([
            { $match: { gameId: req.params.gameId } },
            { 
                $sort: { 
                    timestamp: -1 
                } 
            },
            {
                $group: {
                    _id: '$userId',
                    totalScore: { $sum: '$score' },
                    currentStreak: { $first: '$streak' },
                    maxStreak: { $max: '$streak' }
                }
            },
            { $sort: { totalScore: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    username: '$user.name',
                    score: '$totalScore',
                    currentStreak: '$currentStreak',
                    maxStreak: '$maxStreak'
                }
            }
        ]);

        res.json(scores);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get global leaderboard
router.get('/global', auth, async (req, res) => {
    try {
        const aggregatedScores = await Score.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalScore: { $sum: '$score' },
                    gameScores: {
                        $push: {
                            gameId: '$gameId',
                            score: '$score'
                        }
                    }
                }
            },
            { $sort: { totalScore: -1 } },
            { $limit: 10 }
        ]);

        const populatedScores = await User.populate(aggregatedScores, {
            path: '_id',
            select: 'name'
        });

        const leaderboard = populatedScores.map(entry => ({
            userId: entry._id._id,
            username: entry._id.name,
            totalScore: entry.totalScore,
            gameScores: entry.gameScores.reduce((acc, curr) => {
                acc[curr.gameId] = curr.score;
                return acc;
            }, {})
        }));

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add this new route
router.post('/score', auth, async (req, res) => {
    try {
        const { userId, gameId, score, streak } = req.body;
        
        const newScore = new Score({
            userId,
            gameId,
            score,
            streak,
            timestamp: new Date()
        });

        await newScore.save();
        res.json({ message: 'Score saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving score' });
    }
});

// Get user stats for a specific game
router.get('/game/:gameId/stats/:userId', async (req, res) => {
    try {
        const { gameId, userId } = req.params;
        const stats = await Score.aggregate([
            { $match: { gameId, userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    highestScore: { $max: '$score' },
                    currentStreak: { $max: '$streak' },
                    totalGamesPlayed: { $sum: 1 }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                userId,
                gameId,
                highestScore: 0,
                currentStreak: 0,
                totalGamesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0
            });
        }

        res.json({
            userId,
            gameId,
            ...stats[0],
            _id: undefined
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user stats
router.put('/stats/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const stats = req.body;
        
        // Update stats for the user
        await User.findByIdAndUpdate(userId, { stats });
        
        res.json({ message: 'Stats updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 