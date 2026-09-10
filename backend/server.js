const express = require('express');
const cors = require('cors');
const { initDB } = require('./db/postgres');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), database: 'PostgreSQL' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/gamestats', require('./routes/gamestats'));
app.use('/api/trending', require('./routes/trending'));
app.use('/api/recently-played', require('./routes/recentlyPlayed'));

const PORT = process.env.PORT || 5000;

// Initialize PostgreSQL and start server
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Game-On backend running on port ${PORT} with PostgreSQL`);
        });
    })
    .catch(err => {
        console.error('Fatal: Failed to connect to PostgreSQL:', err);
        process.exit(1);
    });

module.exports = app;
