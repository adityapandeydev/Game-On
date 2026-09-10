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

type ReviewsHandler struct {
	pool *pgxpool.Pool
}

func NewReviewsHandler(pool *pgxpool.Pool) *ReviewsHandler {
	return &ReviewsHandler{pool: pool}
}

// GetReviews returns the latest 50 reviews across the platform
func (h *ReviewsHandler) GetReviews(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT 
			r.id,
			r.game_id,
			r.game_name,
			r.rating,
			r.comment,
			r.created_at,
			u.id,
			COALESCE(u.username, u.name) as username
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		ORDER BY r.created_at DESC
		LIMIT 50;
	`

	rows, err := h.pool.Query(ctx, querySQL)
	if err != nil {
		http.Error(w, `{"message":"Server error loading reviews"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := make([]models.Review, 0)
	for rows.Next() {
		var id, rating, uID int
		var gameID, gameName, comment, username string
		var createdAt time.Time

		if err := rows.Scan(&id, &gameID, &gameName, &rating, &comment, &createdAt, &uID, &username); err == nil {
			idStr := fmt.Sprintf("%d", id)
			uidStr := fmt.Sprintf("%d", uID)
			timeStr := createdAt.Format(time.RFC3339)

			list = append(list, models.Review{
				ID:         id,
				RID:        idStr,
				GameID:     gameID,
				GameName:   gameName,
				Rating:     rating,
				StarRating: rating,
				Comment:    comment,
				ReviewText: comment,
				Timestamp:  timeStr,
				CreatedAt:  timeStr,
				UserRef: models.LeaderboardUserRef{
					ID:   uidStr,
					RID:  uidStr,
					Name: username,
				},
				Username: username,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

// GetGameReviews returns reviews for a specific game
func (h *ReviewsHandler) GetGameReviews(w http.ResponseWriter, r *http.Request) {
	gameID := chi.URLParam(r, "gameId")

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	querySQL := `
		SELECT 
			r.id,
			r.game_id,
			r.game_name,
			r.rating,
			r.comment,
			r.created_at,
			u.id,
			COALESCE(u.username, u.name) as username
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		WHERE r.game_id = $1
		ORDER BY r.created_at DESC
		LIMIT 50;
	`

	rows, err := h.pool.Query(ctx, querySQL, gameID)
	if err != nil {
		http.Error(w, `{"message":"Server error loading reviews"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := make([]models.Review, 0)
	for rows.Next() {
		var id, rating, uID int
		var gID, gameName, comment, username string
		var createdAt time.Time

		if err := rows.Scan(&id, &gID, &gameName, &rating, &comment, &createdAt, &uID, &username); err == nil {
			idStr := fmt.Sprintf("%d", id)
			uidStr := fmt.Sprintf("%d", uID)
			timeStr := createdAt.Format(time.RFC3339)

			list = append(list, models.Review{
				ID:         id,
				RID:        idStr,
				GameID:     gID,
				GameName:   gameName,
				Rating:     rating,
				StarRating: rating,
				Comment:    comment,
				ReviewText: comment,
				Timestamp:  timeStr,
				CreatedAt:  timeStr,
				UserRef: models.LeaderboardUserRef{
					ID:   uidStr,
					RID:  uidStr,
					Name: username,
				},
				Username: username,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)
}

// CreateReview records a new player review
func (h *ReviewsHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.CreateReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"msg":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	comment := req.Comment
	if comment == "" {
		comment = req.ReviewText
	}
	if comment == "" {
		http.Error(w, `{"msg":"Review comment is required"}`, http.StatusBadRequest)
		return
	}

	rating := req.Rating
	if rating < 1 {
		rating = 5
	}
	if rating > 5 {
		rating = 5
	}

	gameID := req.GameID
	if gameID == "" {
		gameID = "website"
	}
	gameName := req.GameName
	if gameName == "" {
		gameName = "Platform"
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	insertSQL := `
		INSERT INTO reviews (user_id, game_id, game_name, rating, comment, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id, created_at;
	`

	var reviewID int
	var createdAt time.Time
	err := h.pool.QueryRow(ctx, insertSQL, userID, gameID, gameName, rating, comment).Scan(&reviewID, &createdAt)
	if err != nil {
		http.Error(w, `{"message":"Server error saving review"}`, http.StatusInternalServerError)
		return
	}

	// Fetch username for response
	var username string
	_ = h.pool.QueryRow(ctx, "SELECT COALESCE(username, name) FROM users WHERE id = $1", userID).Scan(&username)

	idStr := fmt.Sprintf("%d", reviewID)
	uidStr := fmt.Sprintf("%d", userID)
	timeStr := createdAt.Format(time.RFC3339)

	resp := models.Review{
		ID:         reviewID,
		RID:        idStr,
		GameID:     gameID,
		GameName:   gameName,
		Rating:     rating,
		StarRating: rating,
		Comment:    comment,
		ReviewText: comment,
		Timestamp:  timeStr,
		CreatedAt:  timeStr,
		UserRef: models.LeaderboardUserRef{
			ID:   uidStr,
			RID:  uidStr,
			Name: username,
		},
		Username: username,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

// DeleteReview removes a review if owned by user
func (h *ReviewsHandler) DeleteReview(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"message":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	reviewIDStr := chi.URLParam(r, "reviewId")
	reviewID, err := strconv.Atoi(reviewIDStr)
	if err != nil {
		http.Error(w, `{"msg":"Invalid review id"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var ownerID int
	err = h.pool.QueryRow(ctx, "SELECT user_id FROM reviews WHERE id = $1", reviewID).Scan(&ownerID)
	if err != nil {
		http.Error(w, `{"msg":"Review not found"}`, http.StatusNotFound)
		return
	}

	if ownerID != userID {
		http.Error(w, `{"msg":"Not authorized to delete this review"}`, http.StatusForbidden)
		return
	}

	_, err = h.pool.Exec(ctx, "DELETE FROM reviews WHERE id = $1", reviewID)
	if err != nil {
		http.Error(w, `{"message":"Server error deleting review"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"msg":"Review removed successfully"}`))
}
