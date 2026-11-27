// Package store holds all PostgreSQL queries.
package store

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound      = errors.New("not found")
	ErrEmailTaken    = errors.New("email already registered")
	ErrUsernameTaken = errors.New("username already taken")
)

type Store struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func (s *Store) Ping(ctx context.Context) error { return s.pool.Ping(ctx) }

// ---- users ----

type User struct {
	ID           int64     `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
}

func (s *Store) CreateUser(ctx context.Context, username, email, hash string) (*User, error) {
	u := &User{Username: username, Email: email}
	err := s.pool.QueryRow(ctx,
		`INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, created_at`,
		username, email, hash,
	).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "users_username_key" {
				return nil, ErrUsernameTaken
			}
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	return u, nil
}

func (s *Store) UserByEmail(ctx context.Context, email string) (*User, error) {
	return s.userWhere(ctx, "lower(email) = lower($1)", email)
}

func (s *Store) UserByID(ctx context.Context, id int64) (*User, error) {
	return s.userWhere(ctx, "id = $1", id)
}

func (s *Store) userWhere(ctx context.Context, where string, arg any) (*User, error) {
	u := &User{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, username, email, password_hash, created_at FROM users WHERE `+where, arg,
	).Scan(&u.ID, &u.Username, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

// ---- results & stats ----

type Outcome string

const (
	OutcomeWin  Outcome = "win"
	OutcomeLoss Outcome = "loss"
	OutcomeDraw Outcome = "draw"
	// OutcomeDone is for solo games with no win/loss notion.
	OutcomeDone Outcome = "done"
)

type RecordResult struct {
	Best         int  `json:"best"`
	IsNewBest    bool `json:"isNewBest"`
	Streak       int  `json:"streak"`
	PreviousBest int  `json:"previousBest"`
}

// RecordPlay updates last-played time when a user starts a session.
func (s *Store) RecordPlay(ctx context.Context, userID int64, gameID string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO player_stats (user_id, game_id, last_played_at) VALUES ($1, $2, now())
		ON CONFLICT (user_id, game_id) DO UPDATE SET last_played_at = now()`,
		userID, gameID)
	return err
}

// RecordResult atomically folds a finished, server-verified session into the
// player's stats. Wins extend the streak, losses reset it, draws and solo
// completions leave it unchanged.
func (s *Store) RecordResult(ctx context.Context, userID int64, gameID string, score int, outcome Outcome) (*RecordResult, error) {
	var win, loss, draw int
	switch outcome {
	case OutcomeWin:
		win = 1
	case OutcomeLoss:
		loss = 1
	case OutcomeDraw:
		draw = 1
	}
	res := &RecordResult{}
	err := s.pool.QueryRow(ctx, `
		WITH prev AS (
			SELECT best_score FROM player_stats WHERE user_id = $1 AND game_id = $2
		), up AS (
			INSERT INTO player_stats AS p (user_id, game_id, best_score, best_at, total_score, plays, wins, losses, draws, current_streak, best_streak, last_played_at)
			VALUES ($1, $2, $3, CASE WHEN $3 > 0 THEN now() END, $3, 1, $4, $5, $6, $4, $4, now())
			ON CONFLICT (user_id, game_id) DO UPDATE SET
				best_at        = CASE WHEN EXCLUDED.best_score > p.best_score THEN now() ELSE p.best_at END,
				best_score     = GREATEST(p.best_score, EXCLUDED.best_score),
				total_score    = p.total_score + EXCLUDED.total_score,
				plays          = p.plays + 1,
				wins           = p.wins + EXCLUDED.wins,
				losses         = p.losses + EXCLUDED.losses,
				draws          = p.draws + EXCLUDED.draws,
				current_streak = CASE WHEN $4 = 1 THEN p.current_streak + 1 WHEN $5 = 1 THEN 0 ELSE p.current_streak END,
				best_streak    = GREATEST(p.best_streak, CASE WHEN $4 = 1 THEN p.current_streak + 1 ELSE 0 END),
				last_played_at = now()
			RETURNING best_score, current_streak
		)
		SELECT up.best_score, up.current_streak, COALESCE((SELECT best_score FROM prev), 0) FROM up`,
		userID, gameID, score, win, loss, draw,
	).Scan(&res.Best, &res.Streak, &res.PreviousBest)
	if err != nil {
		return nil, err
	}
	res.IsNewBest = score > res.PreviousBest
	return res, nil
}

type GameStats struct {
	GameID        string    `json:"gameId"`
	BestScore     int       `json:"bestScore"`
	TotalScore    int64     `json:"totalScore"`
	Plays         int       `json:"plays"`
	Wins          int       `json:"wins"`
	Losses        int       `json:"losses"`
	Draws         int       `json:"draws"`
	CurrentStreak int       `json:"currentStreak"`
	BestStreak    int       `json:"bestStreak"`
	Rank          *int      `json:"rank"`
	LastPlayedAt  time.Time `json:"lastPlayedAt"`
}

// UserStats returns every game the user has touched, most recent first, with
// their rank on each game's board.
func (s *Store) UserStats(ctx context.Context, userID int64) ([]GameStats, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT p.game_id, p.best_score, p.total_score, p.plays, p.wins, p.losses, p.draws,
		       p.current_streak, p.best_streak, p.last_played_at,
		       CASE WHEN p.best_score > 0 THEN (
		           SELECT count(*) + 1 FROM player_stats o
		           WHERE o.game_id = p.game_id
		             AND (o.best_score > p.best_score OR (o.best_score = p.best_score AND o.best_at < p.best_at))
		       )::int END
		FROM player_stats p
		WHERE p.user_id = $1
		ORDER BY p.last_played_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (GameStats, error) {
		var g GameStats
		err := r.Scan(&g.GameID, &g.BestScore, &g.TotalScore, &g.Plays, &g.Wins, &g.Losses, &g.Draws,
			&g.CurrentStreak, &g.BestStreak, &g.LastPlayedAt, &g.Rank)
		return g, err
	})
}

// ---- leaderboards ----

type BoardEntry struct {
	Rank     int       `json:"rank"`
	UserID   int64     `json:"userId"`
	Username string    `json:"username"`
	Score    int64     `json:"score"`
	Games    int       `json:"games,omitempty"`
	At       time.Time `json:"at"`
}

// GameBoard ranks best scores for one game; ties go to whoever got there first.
func (s *Store) GameBoard(ctx context.Context, gameID string, limit int) ([]BoardEntry, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT (rank() OVER (ORDER BY p.best_score DESC))::int, u.id, u.username, p.best_score, p.best_at
		FROM player_stats p JOIN users u ON u.id = p.user_id
		WHERE p.game_id = $1 AND p.best_score > 0
		ORDER BY p.best_score DESC, p.best_at ASC, u.id
		LIMIT $2`, gameID, limit)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (BoardEntry, error) {
		var e BoardEntry
		return e, r.Scan(&e.Rank, &e.UserID, &e.Username, &e.Score, &e.At)
	})
}

// GlobalBoard ranks players by the sum of their best scores across games.
func (s *Store) GlobalBoard(ctx context.Context, limit int) ([]BoardEntry, error) {
	rows, err := s.pool.Query(ctx, `
		WITH totals AS (
			SELECT user_id, sum(best_score)::bigint AS total, count(*)::int AS games, max(best_at) AS at
			FROM player_stats WHERE best_score > 0 GROUP BY user_id
		)
		SELECT (rank() OVER (ORDER BY t.total DESC))::int, u.id, u.username, t.total, t.games, t.at
		FROM totals t JOIN users u ON u.id = t.user_id
		ORDER BY t.total DESC, t.at ASC, u.id
		LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (BoardEntry, error) {
		var e BoardEntry
		return e, r.Scan(&e.Rank, &e.UserID, &e.Username, &e.Score, &e.Games, &e.At)
	})
}

// ---- plays / trending ----

// AddPlays bulk-increments today's play counters.
func (s *Store) AddPlays(ctx context.Context, counts map[string]int) error {
	if len(counts) == 0 {
		return nil
	}
	batch := &pgx.Batch{}
	for id, n := range counts {
		batch.Queue(`
			INSERT INTO game_daily_plays (game_id, day, plays) VALUES ($1, current_date, $2)
			ON CONFLICT (game_id, day) DO UPDATE SET plays = game_daily_plays.plays + EXCLUDED.plays`, id, n)
	}
	return s.pool.SendBatch(ctx, batch).Close()
}

type Popularity struct {
	GameID     string `json:"gameId"`
	PlaysWeek  int    `json:"playsWeek"`
	PlaysTotal int    `json:"playsTotal"`
}

// Popularity returns play counts for the last seven days and all time.
func (s *Store) Popularity(ctx context.Context) ([]Popularity, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT game_id,
		       COALESCE(sum(plays) FILTER (WHERE day > current_date - 7), 0)::int,
		       sum(plays)::int
		FROM game_daily_plays GROUP BY game_id`)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (Popularity, error) {
		var p Popularity
		return p, r.Scan(&p.GameID, &p.PlaysWeek, &p.PlaysTotal)
	})
}

// ---- reviews ----

type Review struct {
	ID        int64     `json:"id"`
	GameID    string    `json:"gameId"`
	UserID    int64     `json:"userId"`
	Username  string    `json:"username"`
	Rating    int       `json:"rating"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

const reviewCols = `r.id, r.game_id, r.user_id, u.username, r.rating, r.body, r.created_at, r.updated_at`

func scanReview(r pgx.CollectableRow) (Review, error) {
	var v Review
	return v, r.Scan(&v.ID, &v.GameID, &v.UserID, &v.Username, &v.Rating, &v.Body, &v.CreatedAt, &v.UpdatedAt)
}

// Reviews lists reviews newest first, optionally for one game, with keyset
// pagination on id (pass before=0 for the first page).
func (s *Store) Reviews(ctx context.Context, gameID string, before int64, limit int) ([]Review, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT `+reviewCols+`
		FROM reviews r JOIN users u ON u.id = r.user_id
		WHERE ($1 = '' OR r.game_id = $1) AND ($2 = 0 OR r.id < $2)
		ORDER BY r.id DESC
		LIMIT $3`, gameID, before, limit)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, scanReview)
}

// UpsertReview creates or replaces the user's review for a game.
func (s *Store) UpsertReview(ctx context.Context, userID int64, gameID string, rating int, body string) (*Review, error) {
	rows, err := s.pool.Query(ctx, `
		WITH r AS (
			INSERT INTO reviews (user_id, game_id, rating, body) VALUES ($1, $2, $3, $4)
			ON CONFLICT (user_id, game_id) DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, updated_at = now()
			RETURNING *
		)
		SELECT `+reviewCols+` FROM r JOIN users u ON u.id = r.user_id`, userID, gameID, rating, body)
	if err != nil {
		return nil, err
	}
	rv, err := pgx.CollectExactlyOneRow(rows, scanReview)
	if err != nil {
		return nil, err
	}
	return &rv, nil
}

// DeleteReview removes a review owned by userID in a single statement.
func (s *Store) DeleteReview(ctx context.Context, userID, reviewID int64) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM reviews WHERE id = $1 AND user_id = $2`, reviewID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

type RatingSummary struct {
	GameID  string  `json:"gameId"`
	Average float64 `json:"average"`
	Count   int     `json:"count"`
}

func (s *Store) RatingSummaries(ctx context.Context) ([]RatingSummary, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT game_id, round(avg(rating)::numeric, 2)::float8, count(*)::int FROM reviews GROUP BY game_id`)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(r pgx.CollectableRow) (RatingSummary, error) {
		var v RatingSummary
		return v, r.Scan(&v.GameID, &v.Average, &v.Count)
	})
}
