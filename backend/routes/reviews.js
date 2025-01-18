const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const auth = require('../middleware/auth');

// Get all reviews for a game
router.get('/game/:gameId', async (req, res) => {
    try {
        const reviews = await Review.find({
            gameId: req.params.gameId,
            reviewType: 'game'
        }).sort({ createdAt: -1 });

        const averageRating = await Review.aggregate([
            {
                $match: {
                    gameId: req.params.gameId,
                    reviewType: 'game'
                }
            },
            {
                $group: {
                    _id: null,
                    average: { $avg: '$starRating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            reviews,
            averageRating: averageRating[0]?.average || 0,
            totalReviews: averageRating[0]?.count || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get website reviews
router.get('/website', async (req, res) => {
    try {
        const reviews = await Review.find({
            reviewType: 'website'
        }).sort({ createdAt: -1 });

        const averageRating = await Review.aggregate([
            {
                $match: { reviewType: 'website' }
            },
            {
                $group: {
                    _id: null,
                    average: { $avg: '$starRating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            reviews,
            averageRating: averageRating[0]?.average || 0,
            totalReviews: averageRating[0]?.count || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a review
router.post('/', auth, async (req, res) => {
    try {
        const { gameId, reviewText, starRating, reviewType } = req.body;

        // Check for existing review
        const existingReview = await Review.findOne({
            userId: req.user.id,
            gameId,
            reviewType
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this' });
        }

        const review = new Review({
            userId: req.user.id,
            username: req.user.name,
            gameId,
            reviewText,
            starRating,
            reviewType
        });

        await review.save();
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
    try {
        const { reviewText, starRating } = req.body;
        const review = await Review.findOne({
            _id: req.params.reviewId,
            userId: req.user.id
        });

        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        review.reviewText = reviewText;
        review.starRating = starRating;
        await review.save();

        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a review (admin only)
router.delete('/:reviewId', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Check if user is admin or review owner
        if (req.user.role !== 'admin' && review.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await review.remove();
        res.json({ message: 'Review removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router; 