package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InitSchema creates all tables, unique constraints, and b-tree indexes
func InitSchema(pool *pgxpool.Pool) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	queries := []string{
		// 1. Users table
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255),
			username VARCHAR(255),
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255),
			password_hash VARCHAR(255),
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`,
		`UPDATE users SET username = name WHERE username IS NULL AND name IS NOT NULL;`,
		`UPDATE users SET name = username WHERE name IS NULL AND username IS NOT NULL;`,
		`UPDATE users SET password = password_hash WHERE password IS NULL AND password_hash IS NOT NULL;`,
		`UPDATE users SET password_hash = password WHERE password_hash IS NULL AND password IS NOT NULL;`,

		// 2. Scores table with atomic unique constraint on (user_id, game_id)
		`CREATE TABLE IF NOT EXISTS scores (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			game_id VARCHAR(50) NOT NULL,
			game_name VARCHAR(100) NOT NULL,
			score INT NOT NULL DEFAULT 0,
			streak INT NOT NULL DEFAULT 0,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			CONSTRAINT uq_user_game UNIQUE (user_id, game_id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_scores_leaderboard ON scores (game_id, score DESC);`,
		`CREATE INDEX IF NOT EXISTS idx_scores_user ON scores (user_id);`,

		// 3. Normalized Recently Played table
		`CREATE TABLE IF NOT EXISTS recently_played (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			game_id VARCHAR(50) NOT NULL,
			game_name VARCHAR(100) NOT NULL,
			last_played TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			CONSTRAINT uq_user_recent_game UNIQUE (user_id, game_id)
		);`,
		`CREATE INDEX IF NOT EXISTS idx_recent_user ON recently_played (user_id, last_played DESC);`,

		// 4. Game Stats & Trending Clicks table
		`CREATE TABLE IF NOT EXISTS game_stats (
			id SERIAL PRIMARY KEY,
			game_id VARCHAR(50) UNIQUE NOT NULL,
			game_name VARCHAR(100) NOT NULL,
			click_count INT NOT NULL DEFAULT 0,
			last_clicked TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_gamestats_clicks ON game_stats (click_count DESC);`,

		// 5. Reviews table
		`CREATE TABLE IF NOT EXISTS reviews (
			id SERIAL PRIMARY KEY,
			user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			game_id VARCHAR(50) NOT NULL DEFAULT 'website',
			game_name VARCHAR(100) NOT NULL DEFAULT 'Platform',
			rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
			comment TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_reviews_game ON reviews (game_id, created_at DESC);`,
	}

	for i, q := range queries {
		if _, err := pool.Exec(ctx, q); err != nil {
			return fmt.Errorf("error executing schema statement #%d: %w", i+1, err)
		}
	}

	// Initialize default arcade catalog in game_stats if empty
	var count int
	err := pool.QueryRow(ctx, "SELECT COUNT(*) FROM game_stats").Scan(&count)
	if err == nil && count == 0 {
		initialGames := []struct {
			id   string
			name string
		}{
			{"tictactoe", "Tic Tac Toe"},
			{"connect4", "Connect 4"},
			{"tetris", "Tetris"},
			{"mathquiz", "Quantum Guess"},
			{"capitalcities", "Geo Quest"},
			{"guessmynumber", "Guess My Number"},
			{"slidingpuzzle", "Sliding Puzzle"},
			{"typestorm", "TypeStorm"},
			{"piggame", "Pig Game"},
		}

		for _, g := range initialGames {
			_, _ = pool.Exec(ctx, `
				INSERT INTO game_stats (game_id, game_name, click_count, last_clicked)
				VALUES ($1, $2, 0, NOW())
				ON CONFLICT (game_id) DO NOTHING;
			`, g.id, g.name)
		}
	}

	log.Println("✅ PostgreSQL database schema synchronized and indexed")
	return nil
}
