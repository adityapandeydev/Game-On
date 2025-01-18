const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    recentlyPlayed: [{
        gameId: {
            type: String,
            required: true
        },
        gameName: {
            type: String,
            required: true
        },
        lastPlayed: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Keep only the most recent N games
UserSchema.methods.addRecentlyPlayed = async function(gameId, gameName) {
    const MAX_RECENT_GAMES = 5;
    
    // Remove the game if it exists (to update its position)
    this.recentlyPlayed = this.recentlyPlayed.filter(game => game.gameId !== gameId);
    
    // Add the game to the beginning of the array
    this.recentlyPlayed.unshift({
        gameId,
        gameName,
        lastPlayed: new Date()
    });
    
    // Keep only the most recent games
    if (this.recentlyPlayed.length > MAX_RECENT_GAMES) {
        this.recentlyPlayed = this.recentlyPlayed.slice(0, MAX_RECENT_GAMES);
    }
    
    return this.save();
};

// Index for faster queries
UserSchema.index({ 'recentlyPlayed.lastPlayed': -1 });

const User = mongoose.model('User', UserSchema);

module.exports = User;
