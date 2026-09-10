const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db/postgres');

// Get global rankings (sum of highest scores per game for each user)
router.get('/global', async (req, res) => {
    try {
        const sql = `
            SELECT 
                u.id as user_id,
                u.name as username,
                SUM(s.score)::int as "totalScore",
                SUM(s.score)::int as score,
                COUNT(DISTINCT s.game_id)::int as "gamesPlayed",
                MAX(s.updated_at) as timestamp
            FROM scores s
            JOIN users u ON s.user_id = u.id
            GROUP BY u.id, u.name
            ORDER BY "totalScore" DESC
            LIMIT 10;
        `;
        const result = await query(sql);

        const formatted = result.rows.map((row, idx) => ({
            _id: row.user_id.toString(),
            rank: idx + 1,
            userId: {
                _id: row.user_id.toString(),
                id: row.user_id.toString(),
                name: row.username
            },
            username: row.username,
            score: row.score,
            totalScore: row.totalScore,
            gamesPlayed: row.gamesPlayed,
            timestamp: row.timestamp || new Date().toISOString()
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching global leaderboard:', err);
        res.status(500).json({ message: 'Server error loading global rankings' });
    }
});

// Get user's personal best scores
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.id as _id,
                s.game_id as "gameId",
                s.game_name as "gameName",
                s.score,
                s.streak,
                s.updated_at as timestamp,
                json_build_object('id', u.id, 'name', u.name) as "userId",
                u.name as username
            FROM scores s
            JOIN users u ON s.user_id = u.id
            WHERE s.user_id = $1
            ORDER BY s.score DESC
            LIMIT 10;
        `;
        const result = await query(sql, [req.params.userId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user scores:', err);
        res.status(500).json({ message: 'Server error loading user scores' });
    }
});

// Submit new score (Atomic PostgreSQL Upsert)
const handleScoreSubmit = async (req, res) => {
    try {
        const { gameId, score, gameName, streak = 0 } = req.body;
        const userId = parseInt(req.user.id || req.user.userId, 10);

        if (!gameId || typeof score !== 'number') {
            return res.status(400).json({ msg: 'gameId and numeric score are required' });
        }

        const sql = `
            INSERT INTO scores (user_id, game_id, game_name, score, streak, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (user_id, game_id)
            DO UPDATE SET 
                score = CASE 
                    WHEN EXCLUDED.score > scores.score THEN EXCLUDED.score 
                    ELSE scores.score 
                END,
                streak = EXCLUDED.streak,
                game_name = EXCLUDED.game_name,
                updated_at = NOW()
            RETURNING id, user_id, game_id, score, streak, updated_at;
        `;

        const result = await query(sql, [
            userId,
            gameId,
            gameName || gameId,
            score,
            streak
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error saving score:', err);
        res.status(500).json({ message: 'Server error saving score' });
    }
};

router.post('/submit', auth, handleScoreSubmit);
router.post('/scores', auth, handleScoreSubmit);

// Get leaderboard for a specific game
router.get('/:gameId', async (req, res) => {
    const { gameId } = req.params;
    if (gameId === 'global') {
        return res.redirect('/api/leaderboard/global');
    }

    try {
        const sql = `
            SELECT 
                s.id as _id,
                s.score,
                s.game_name as "gameName",
                s.updated_at as timestamp,
                json_build_object('id', u.id, '_id', u.id, 'name', u.name) as "userId",
                u.name as username
            FROM scores s
            JOIN users u ON s.user_id = u.id
            WHERE s.game_id = $1
            ORDER BY s.score DESC
            LIMIT 10;
        `;
        const result = await query(sql, [gameId]);
        res.json(result.rows);
    } catch (err) {
        console.error(`Error fetching leaderboard for ${gameId}:`, err);
        res.status(500).json({ message: 'Server error loading game leaderboard' });
    }
});

module.exports = router;