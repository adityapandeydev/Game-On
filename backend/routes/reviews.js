const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db/postgres');

// Get platform / general reviews
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                r.id as _id,
                r.id,
                r.game_id as "gameId",
                r.game_name as "gameName",
                r.rating,
                r.rating as "starRating",
                r.comment,
                r.comment as "reviewText",
                r.created_at as timestamp,
                r.created_at as "createdAt",
                json_build_object('id', u.id, 'name', u.name) as "userId",
                u.name as username
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 50;
        `;
        const result = await query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Server error loading reviews' });
    }
});

// Get all reviews for a specific game
router.get('/game/:gameId', async (req, res) => {
    try {
        const sql = `
            SELECT 
                r.id as _id,
                r.id,
                r.game_id as "gameId",
                r.game_name as "gameName",
                r.rating,
                r.rating as "starRating",
                r.comment,
                r.comment as "reviewText",
                r.created_at as timestamp,
                r.created_at as "createdAt",
                json_build_object('id', u.id, 'name', u.name) as "userId",
                u.name as username
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.game_id = $1
            ORDER BY r.created_at DESC
            LIMIT 50;
        `;
        const result = await query(sql, [req.params.gameId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching game reviews:', err);
        res.status(500).json({ message: 'Server error loading reviews' });
    }
});

// Submit a review
const handleReviewSubmit = async (req, res) => {
    try {
        const { gameId, gameName, rating, comment, reviewText } = req.body;
        const userId = parseInt(req.user.id || req.user.userId, 10);
        const effectiveComment = comment || reviewText;
        const effectiveRating = rating || 5;

        if (!effectiveComment) {
            return res.status(400).json({ msg: 'Review comment is required' });
        }

        const sql = `
            INSERT INTO reviews (user_id, game_id, game_name, rating, comment)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, user_id, game_id, game_name, rating, comment, created_at;
        `;

        const result = await query(sql, [
            userId,
            gameId || 'website',
            gameName || 'Platform',
            Math.min(5, Math.max(1, effectiveRating)),
            effectiveComment
        ]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error submitting review:', err);
        res.status(500).json({ message: 'Server error saving review' });
    }
};

router.post('/', auth, handleReviewSubmit);
router.post('/submit', auth, handleReviewSubmit);

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.reviewId, 10);
        const userId = parseInt(req.user.id, 10);

        const reviewCheck = await query('SELECT user_id FROM reviews WHERE id = $1', [reviewId]);
        if (reviewCheck.rows.length === 0) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        if (reviewCheck.rows[0].user_id !== userId) {
            return res.status(401).json({ msg: 'Not authorized to delete this review' });
        }

        await query('DELETE FROM reviews WHERE id = $1', [reviewId]);
        res.json({ msg: 'Review removed successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ message: 'Server error deleting review' });
    }
});

module.exports = router;