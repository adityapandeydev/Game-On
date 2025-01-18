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

// Get global leaderboard with enhanced information
router.get('/global', auth, async (req, res) => {
    try {
        const aggregatedScores = await Score.aggregate([
            {
                $group: {
                    _id: '$userId',
                    totalScore: { $sum: '$score' },
                    gamesPlayed: { $sum: 1 },
                    gameScores: {
                        $push: {
                            gameId: '$gameId',
                            score: '$score'
                        }
                    },
                    lastPlayed: { $max: '$timestamp' }
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
                    totalScore: 1,
                    gamesPlayed: 1,
                    gameScores: 1,
                    lastPlayed: 1
                }
            }
        ]);

        res.json(aggregatedScores);
    } catch (error) {
        console.error('Global leaderboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user score with enhanced streak handling
router.post('/score', auth, async (req, res) => {
    try {
        const { userId, gameId, score, result } = req.body;
        
        // Find existing score record
        let existingScore = await Score.findOne({ userId, gameId });
        
        if (!existingScore) {
            existingScore = new Score({
                userId,
                gameId,
                score: 0,
                streak: 0
            });
        }

        // Update streak based on result
        if (result === 'win') {
            existingScore.streak += 1;
            existingScore.maxStreak = Math.max(existingScore.streak, existingScore.maxStreak || 0);
        } else if (result === 'lose') {
            existingScore.streak = 0;
        }

        // Update score if new score is higher
        existingScore.score = Math.max(existingScore.score, score);
        existingScore.timestamp = new Date();

        await existingScore.save();
        res.json({ message: 'Score updated successfully', score: existingScore });
    } catch (error) {
        console.error('Score update error:', error);
        res.status(500).json({ message: 'Error saving score' });
    }
});

// Get user stats for a specific game
router.get('/game/:gameId/stats/:userId', auth, async (req, res) => {
    try {
        const { gameId, userId } = req.params;
        const stats = await Score.aggregate([
            { $match: { gameId, userId: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    highestScore: { $max: '$score' },
                    currentStreak: { $max: '$streak' },
                    maxStreak: { $max: '$maxStreak' },
                    totalGamesPlayed: { $sum: 1 },
                    lastPlayed: { $max: '$timestamp' }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.json({
                userId,
                gameId,
                highestScore: 0,
                currentStreak: 0,
                maxStreak: 0,
                totalGamesPlayed: 0,
                lastPlayed: null
            });
        }

        res.json({
            userId,
            gameId,
            ...stats[0],
            _id: undefined
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 