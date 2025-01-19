const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameId: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    gameName: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for userId and gameId
ScoreSchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Score', ScoreSchema); 