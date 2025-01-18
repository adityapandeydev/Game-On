const mongoose = require('mongoose');

const GameStatsSchema = new mongoose.Schema({
    gameId: {
        type: String,
        required: true
    },
    gameName: {
        type: String,
        required: true
    },
    clickCount: {
        type: Number,
        default: 0
    },
    lastClicked: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Define all indexes in one place
GameStatsSchema.index({ gameId: 1 }, { unique: true });
GameStatsSchema.index({ clickCount: -1 });

module.exports = mongoose.model('GameStats', GameStatsSchema); 