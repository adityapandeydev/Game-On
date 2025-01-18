const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    gameId: {
        type: String,
        required: true,
        enum: ['tictactoe', 'connect4', 'guessmynumber', 'piggame']
    },
    score: {
        type: Number,
        required: true
    },
    streak: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Score', ScoreSchema); 