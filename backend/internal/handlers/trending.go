package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"game-on-backend/internal/models"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TrendingHandler struct {
	pool *pgxpool.Pool
}

func NewTrendingHandler(pool *pgxpool.Pool) *TrendingHandler {
	return &TrendingHandler{pool: pool}
}

// GetTrending returns the top arcade games ranked by play frequency
func (h *TrendingHandler) GetTrending(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT game_id, game_name, click_count, last_clicked
		FROM game_stats
		ORDER BY click_count DESC, last_clicked DESC
		LIMIT 10;
	`

	rows, err := h.pool.Query(ctx, querySQL)
	if err != nil {
		http.Error(w, `{"message":"Server error loading trending games"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := make([]models.TrendingGame, 0)
	for rows.Next() {
		var gameID, gameName string
		var count int
		var lastClicked time.Time

		if err := rows.Scan(&gameID, &gameName, &count, &lastClicked); err == nil {
			list = append(list, models.TrendingGame{
				GameID:      gameID,
				GameName:    gameName,
				ClickCount:  count,
				LastClicked: lastClicked.Format(time.RFC3339),
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

// TrackClick increments the play count for a game
func (h *TrendingHandler) TrackClick(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "gameId")
	if gameID == "" {
		http.Error(w, `{"message":"Game ID is required"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		GameName string `json:"gameName"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	gameName := req.GameName
	if gameName == "" {
		gameName = gameID
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	upsertSQL := `
		INSERT INTO game_stats (game_id, game_name, click_count, last_clicked)
		VALUES ($1, $2, 1, NOW())
		ON CONFLICT (game_id)
		DO UPDATE SET
			click_count = game_stats.click_count + 1,
			game_name = EXCLUDED.game_name,
			last_clicked = NOW()
		RETURNING game_id, game_name, click_count;
	`

	var res models.TrendingGame
	err := h.pool.QueryRow(ctx, upsertSQL, gameID, gameName).Scan(&res.GameID, &res.GameName, &res.ClickCount)
	if err != nil {
		http.Error(w, `{"message":"Server error recording click"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}
