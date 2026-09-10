const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');

// Get trending games
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                game_id as "gameId",
                game_name as "gameName",
                click_count as "clickCount",
                last_clicked as "lastClicked"
            FROM game_stats
            ORDER BY click_count DESC
            LIMIT 10;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching trending games:', error);
        res.status(500).json({ message: 'Server error loading trending games' });
    }
});

// Track game click
router.post('/track/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { gameName } = req.body || {};

        const sql = `
            INSERT INTO game_stats (game_id, game_name, click_count, last_clicked)
            VALUES ($1, $2, 1, NOW())
            ON CONFLICT (game_id)
            DO UPDATE SET 
                click_count = game_stats.click_count + 1,
                last_clicked = NOW()
            RETURNING game_id as "gameId", game_name as "gameName", click_count as "clickCount";
        `;

        const result = await query(sql, [gameId, gameName || gameId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error tracking game click:', error);
        res.status(500).json({ message: 'Server error tracking click' });
    }
});

module.exports = router;