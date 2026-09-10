const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db/postgres');

// Get user's game stats
router.get('/:gameId', auth, async (req, res) => {
    try {
        const userId = parseInt(req.user.id, 10);
        const { gameId } = req.params;

        const sql = `
            SELECT score as "currentScore", streak as "currentStreak", score as "highestScore"
            FROM scores
            WHERE user_id = $1 AND game_id = $2;
        `;
        const result = await query(sql, [userId, gameId]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.json({ currentScore: 0, currentStreak: 0, highestScore: 0 });
        }
    } catch (err) {
        console.error('Error getting game stats:', err);
        res.status(500).json({ message: 'Server error loading stats' });
    }
});

// Update game stats
router.post('/update', auth, async (req, res) => {
    try {
        const { gameId, currentScore, currentStreak, gameName } = req.body;
        const userId = parseInt(req.user.id, 10);

        const sql = `
            INSERT INTO scores (user_id, game_id, game_name, score, streak, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (user_id, game_id)
            DO UPDATE SET 
                score = GREATEST(scores.score, EXCLUDED.score),
                streak = EXCLUDED.streak,
                updated_at = NOW()
            RETURNING score as "currentScore", streak as "currentStreak";
        `;

        const result = await query(sql, [
            userId,
            gameId,
            gameName || gameId,
            currentScore || 0,
            currentStreak || 0
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating stats:', err);
        res.status(500).json({ message: 'Server error updating stats' });
    }
});

module.exports = router;