const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameId: {
        type: String,
        required: true
    },
    gameName: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
ReviewSchema.index({ gameId: 1, timestamp: -1 });
ReviewSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Review', ReviewSchema); 