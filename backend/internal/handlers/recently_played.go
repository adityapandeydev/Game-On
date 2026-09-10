package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"game-on-backend/internal/middleware"
	"game-on-backend/internal/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RecentlyPlayedHandler struct {
	pool *pgxpool.Pool
}

func NewRecentlyPlayedHandler(pool *pgxpool.Pool) *RecentlyPlayedHandler {
	return &RecentlyPlayedHandler{pool: pool}
}

// GetRecentlyPlayed retrieves the player's recent game history from PostgreSQL
func (h *RecentlyPlayedHandler) GetRecentlyPlayed(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT game_id, game_name, last_played
		FROM recently_played
		WHERE user_id = $1
		ORDER BY last_played DESC
		LIMIT 6;
	`

	rows, err := h.pool.Query(ctx, querySQL, userID)
	if err != nil {
		http.Error(w, `{"message":"Server error loading recently played"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := make([]models.RecentGame, 0)
	for rows.Next() {
		var gameID, gameName string
		var lastPlayed time.Time

		if err := rows.Scan(&gameID, &gameName, &lastPlayed); err == nil {
			list = append(list, models.RecentGame{
				ID:         gameID,
				GameID:     gameID,
				Title:      gameName,
				GameName:   gameName,
				LastPlayed: lastPlayed.Format(time.RFC3339),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

// TrackRecentlyPlayed records a play session
func (h *RecentlyPlayedHandler) TrackRecentlyPlayed(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.TrackGameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"message":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.GameID == "" {
		http.Error(w, `{"message":"Game ID is required"}`, http.StatusBadRequest)
		return
	}

	gameName := req.GameName
	if gameName == "" {
		gameName = req.GameID
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	upsertSQL := `
		INSERT INTO recently_played (user_id, game_id, game_name, last_played)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id, game_id)
		DO UPDATE SET last_played = NOW(), game_name = EXCLUDED.game_name;
	`
	_, err := h.pool.Exec(ctx, upsertSQL, userID, req.GameID, gameName)
	if err != nil {
		http.Error(w, `{"message":"Server error saving recently played"}`, http.StatusInternalServerError)
		return
	}

	// Return updated list
	h.GetRecentlyPlayed(w, r)
}
