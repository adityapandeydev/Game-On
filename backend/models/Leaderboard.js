const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
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
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    maxStreak: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 0
    },
    lastPlayed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
LeaderboardSchema.index({ gameId: 1, score: -1 });
LeaderboardSchema.index({ userId: 1, gameId: 1 }, { unique: true });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema); 