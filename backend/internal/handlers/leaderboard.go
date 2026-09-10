package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"game-on-backend/internal/middleware"
	"game-on-backend/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type LeaderboardHandler struct {
	pool *pgxpool.Pool
}

func NewLeaderboardHandler(pool *pgxpool.Pool) *LeaderboardHandler {
	return &LeaderboardHandler{pool: pool}
}

// SubmitScore performs an atomic PostgreSQL upsert for the player's best score
func (h *LeaderboardHandler) SubmitScore(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"msg":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.ScoreSubmission
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"msg":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.GameID == "" {
		http.Error(w, `{"msg":"gameId is required"}`, http.StatusBadRequest)
		return
	}

	gameName := req.GameName
	if gameName == "" {
		gameName = req.GameID
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// 1. Atomic Score Upsert
	upsertScoreSQL := `
		INSERT INTO scores (user_id, game_id, game_name, score, streak, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (user_id, game_id)
		DO UPDATE SET
			score = GREATEST(scores.score, EXCLUDED.score),
			streak = EXCLUDED.streak,
			game_name = EXCLUDED.game_name,
			updated_at = NOW()
		RETURNING id, user_id, game_id, score, streak, updated_at;
	`

	var score models.Score
	err := h.pool.QueryRow(ctx, upsertScoreSQL, userID, req.GameID, gameName, req.Score, req.Streak).Scan(
		&score.ID, &score.UserID, &score.GameID, &score.Score, &score.Streak, &score.UpdatedAt,
	)
	if err != nil {
		http.Error(w, `{"message":"Server error saving score"}`, http.StatusInternalServerError)
		return
	}

	// 2. Also keep Recently Played updated automatically
	upsertRecentSQL := `
		INSERT INTO recently_played (user_id, game_id, game_name, last_played)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id, game_id)
		DO UPDATE SET last_played = NOW(), game_name = EXCLUDED.game_name;
	`
	_, _ = h.pool.Exec(ctx, upsertRecentSQL, userID, req.GameID, gameName)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"success":   true,
		"id":        score.ID,
		"userId":    score.UserID,
		"gameId":    score.GameID,
		"gameName":  gameName,
		"score":     score.Score,
		"streak":    score.Streak,
		"updatedAt": score.UpdatedAt,
	})
}

// GetGameLeaderboard returns the top 10 scores for a particular game
func (h *LeaderboardHandler) GetGameLeaderboard(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "gameId")
	if gameID == "global" {
		h.GetGlobalLeaderboard(w, r)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT 
			s.id,
			s.score,
			s.streak,
			s.game_name,
			s.updated_at,
			u.id,
			COALESCE(u.username, u.name) as username
		FROM scores s
		JOIN users u ON s.user_id = u.id
		WHERE s.game_id = $1
		ORDER BY s.score DESC, s.updated_at ASC
		LIMIT 10;
	`

	rows, err := h.pool.Query(ctx, querySQL, gameID)
	if err != nil {
		http.Error(w, `{"message":"Server error loading game leaderboard"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	entries := make([]models.LeaderboardEntry, 0)
	for rows.Next() {
		var id, score, streak, uID int
		var gameName, username string
		var updatedAt time.Time

		if err := rows.Scan(&id, &score, &streak, &gameName, &updatedAt, &uID, &username); err == nil {
			uidStr := fmt.Sprintf("%d", uID)
			entries = append(entries, models.LeaderboardEntry{
				ID:        fmt.Sprintf("%d", id),
				Score:     score,
				GameName:  gameName,
				Timestamp: updatedAt.Format(time.RFC3339),
				UserRef: models.LeaderboardUserRef{
					ID:   uidStr,
					RID:  uidStr,
					Name: username,
				},
				Username: username,
				Streak:   streak,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(entries)
}

// GetGlobalLeaderboard returns players ranked by aggregate score across all games
func (h *LeaderboardHandler) GetGlobalLeaderboard(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT 
			u.id,
			COALESCE(u.username, u.name) as username,
			COALESCE(SUM(s.score), 0)::int as total_score,
			COUNT(DISTINCT s.game_id)::int as games_played,
			COALESCE(MAX(s.updated_at), u.created_at) as last_activity
		FROM users u
		JOIN scores s ON u.id = s.user_id
		GROUP BY u.id, u.name, u.username, u.created_at
		ORDER BY total_score DESC
		LIMIT 10;
	`

	rows, err := h.pool.Query(ctx, querySQL)
	if err != nil {
		http.Error(w, `{"message":"Server error loading global rankings"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	entries := make([]models.GlobalLeaderboardEntry, 0)
	rank := 1
	for rows.Next() {
		var uID, totalScore, gamesPlayed int
		var username string
		var lastActivity time.Time

		if err := rows.Scan(&uID, &username, &totalScore, &gamesPlayed, &lastActivity); err == nil {
			uidStr := fmt.Sprintf("%d", uID)
			entries = append(entries, models.GlobalLeaderboardEntry{
				ID:   uidStr,
				Rank: rank,
				UserRef: models.LeaderboardUserRef{
					ID:   uidStr,
					RID:  uidStr,
					Name: username,
				},
				Username:    username,
				Score:       totalScore,
				TotalScore:  totalScore,
				GamesPlayed: gamesPlayed,
				Timestamp:   lastActivity.Format(time.RFC3339),
			})
			rank++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(entries)
}

// GetUserScores returns personal best scores for a specific user
func (h *LeaderboardHandler) GetUserScores(w http.ResponseWriter, r *http.Request) {
	targetUIDStr := chi.URLParam(r, "userId")
	targetUID, err := strconv.Atoi(targetUIDStr)
	if err != nil {
		http.Error(w, `{"message":"Invalid user id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT 
			s.id,
			s.game_id,
			s.game_name,
			s.score,
			s.streak,
			s.updated_at,
			u.id,
			COALESCE(u.username, u.name) as username
		FROM scores s
		JOIN users u ON s.user_id = u.id
		WHERE s.user_id = $1
		ORDER BY s.updated_at DESC;
	`

	rows, err := h.pool.Query(ctx, querySQL, targetUID)
	if err != nil {
		http.Error(w, `{"message":"Server error loading user scores"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	results := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, score, streak, uID int
		var gameID, gameName, username string
		var updatedAt time.Time

		if err := rows.Scan(&id, &gameID, &gameName, &score, &streak, &updatedAt, &uID, &username); err == nil {
			uidStr := fmt.Sprintf("%d", uID)
			results = append(results, map[string]interface{}{
				"_id":       fmt.Sprintf("%d", id),
				"gameId":    gameID,
				"gameName":  gameName,
				"score":     score,
				"streak":    streak,
				"timestamp": updatedAt.Format(time.RFC3339),
				"username":  username,
				"userId": map[string]string{
					"id":   uidStr,
					"_id":  uidStr,
					"name": username,
				},
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(results)
}
