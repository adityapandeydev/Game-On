const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');

// Get all reviews for a game
router.get('/game/:gameId', async (req, res) => {
    try {
        const reviews = await Review.find({ gameId: req.params.gameId })
            .sort({ timestamp: -1 })
            .populate('userId', 'name')
            .lean();

        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Get user's reviews
router.get('/user/:userId', auth, async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId })
            .sort({ timestamp: -1 })
            .lean();

        res.json(reviews);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Submit a review
router.post('/submit', auth, async (req, res) => {
    try {
        const { gameId, gameName, rating, comment } = req.body;
        const userId = req.user.id;

        // Check if user already reviewed this game
        const existingReview = await Review.findOne({ userId, gameId });
        if (existingReview) {
            return res.status(400).json({ msg: 'You have already reviewed this game' });
        }

        const newReview = new Review({
            userId,
            gameId,
            gameName,
            rating,
            comment
        });

        await newReview.save();
        res.json(newReview);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        if (review.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        review.rating = rating;
        review.comment = comment;
        await review.save();

        res.json(review);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);

        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        if (review.userId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await review.remove();
        res.json({ msg: 'Review removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router; 