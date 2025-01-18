const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    gameId: {
        type: String,
        required: function() {
            return this.reviewType === 'game';
        }
    },
    reviewText: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 1000
    },
    starRating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewType: {
        type: String,
        enum: ['game', 'website'],
        required: true
    }
}, {
    timestamps: true
});

// Ensure one review per user per game/website
ReviewSchema.index(
    { userId: 1, gameId: 1, reviewType: 1 }, 
    { unique: true }
);

// Index for faster queries
ReviewSchema.index({ gameId: 1, reviewType: 1 });
ReviewSchema.index({ starRating: -1 });

module.exports = mongoose.model('Review', ReviewSchema); 