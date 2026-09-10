const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:6243@localhost:5432/game_on',
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                recently_played JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Scores table with unique constraint on user_id + game_id
        await client.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game_id VARCHAR(100) NOT NULL,
                game_name VARCHAR(255) NOT NULL,
                score INTEGER NOT NULL,
                streak INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                CONSTRAINT unique_user_game UNIQUE (user_id, game_id)
            );
            CREATE INDEX IF NOT EXISTS idx_scores_game_score ON scores(game_id, score DESC);
        `);

        // Reviews table
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game_id VARCHAR(100) NOT NULL,
                game_name VARCHAR(255) NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_reviews_game ON reviews(game_id, created_at DESC);
        `);

        // Game click stats (Trending)
        await client.query(`
            CREATE TABLE IF NOT EXISTS game_stats (
                game_id VARCHAR(100) PRIMARY KEY,
                game_name VARCHAR(255) NOT NULL,
                click_count INTEGER DEFAULT 0,
                last_clicked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        // Seed initial trending games if empty
        await client.query(`
            INSERT INTO game_stats (game_id, game_name, click_count)
            VALUES 
                ('tictactoe', 'Tic Tac Toe', 1420),
                ('connect4', 'Connect 4', 1180),
                ('tetris', 'Tetris', 950),
                ('mathquiz', 'Quantum Guess', 840),
                ('capitalcities', 'Geo Quest', 720),
                ('guessmynumber', 'Guess My Number', 650),
                ('slidingpuzzle', 'Sliding Puzzle', 590),
                ('typestorm', 'TypeStorm', 540),
                ('piggame', 'Pig Game', 430)
            ON CONFLICT (game_id) DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log('✅ PostgreSQL Schema initialized successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to initialize PostgreSQL schema:', err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    query: (text, params) => pool.query(text, params),
    initDB
};
