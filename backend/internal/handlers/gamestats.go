package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"game-on-backend/internal/middleware"
	"game-on-backend/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GameStatsHandler struct {
	pool *pgxpool.Pool
}

func NewGameStatsHandler(pool *pgxpool.Pool) *GameStatsHandler {
	return &GameStatsHandler{pool: pool}
}

// GetGameStats returns user stats for a specific game
func (h *GameStatsHandler) GetGameStats(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "gameId")
	userID, ok := middleware.GetUserID(r.Context())

	stats := models.UserGameStats{
		UserID:           fmt.Sprintf("%d", userID),
		GameID:           gameID,
		CurrentScore:     0,
		CurrentStreak:    0,
		HighestScore:     0,
		TotalGamesPlayed: 0,
		Wins:             0,
		Draws:            0,
		Losses:           0,
	}

	if ok && userID > 0 {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var score, streak int
		err := h.pool.QueryRow(ctx, "SELECT score, streak FROM scores WHERE user_id = $1 AND game_id = $2", userID, gameID).Scan(&score, &streak)
		if err == nil {
			stats.CurrentScore = score
			stats.HighestScore = score
			stats.CurrentStreak = streak
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(stats)
}
