const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Score = require('../models/Score');
const User = require('../models/User');

// Get global rankings (sum of highest scores per game for each user)
router.get('/global', async (req, res) => {
    try {
        // Aggregate pipeline to get total scores
        const globalRankings = await Score.aggregate([
            // First group by userId and gameId to get max score for each game
            {
                $group: {
                    _id: {
                        userId: '$userId',
                        gameId: '$gameId'
                    },
                    maxScore: { $max: '$score' }
                }
            },
            // Then group by userId to sum up all max scores
            {
                $group: {
                    _id: '$_id.userId',
                    totalScore: { $sum: '$maxScore' }
                }
            },
            // Look up user details
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            // Unwind the user details array
            { $unwind: '$userDetails' },
            // Project the final format
            {
                $project: {
                    _id: 1,
                    userId: {
                        _id: '$_id',
                        name: '$userDetails.name'
                    },
                    score: '$totalScore',
                    timestamp: new Date()
                }
            },
            // Sort by total score descending
            { $sort: { score: -1 } },
            // Limit to top 10
            { $limit: 10 }
        ]);

        res.json(globalRankings);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get global leaderboard for a specific game
router.get('/:gameId', async (req, res) => {
    if (req.params.gameId === 'global') return;
    try {
        const leaderboard = await Score.find({ gameId: req.params.gameId })
            .sort({ score: -1 })
            .limit(10)
            .populate('userId', 'name')
            .lean();

        res.json(leaderboard);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get user's personal best scores
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const scores = await Score.find({ userId: req.params.userId })
            .sort({ score: -1 })
            .limit(10)
            .populate('userId', 'name')
            .lean();

        res.json(scores);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Submit new score
router.post('/submit', auth, async (req, res) => {
    try {
        const { gameId, score, gameName } = req.body;
        const userId = req.user.id;

        // Find existing score
        const existingScore = await Score.findOne({ userId, gameId });

        if (existingScore) {
            // Only update if new score is higher
            if (score > existingScore.score) {
                existingScore.score = score;
                existingScore.timestamp = new Date();
                await existingScore.save();
                return res.json(existingScore);
            } else {
                return res.status(400).json({ 
                    msg: 'New score is not higher than existing score',
                    currentBest: existingScore.score 
                });
            }
        }

        // Create new score record
        const newScore = new Score({
            userId,
            gameId,
            score,
            gameName
        });

        await newScore.save();
        res.json(newScore);
    } catch (err) {
        console.error('Error saving score:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 