const mongoose = require('mongoose');

const GameStatsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameId: {
        type: String,
        required: true
    },
    currentScore: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create a compound unique index for userId and gameId
GameStatsSchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('GameStats', GameStatsSchema); 