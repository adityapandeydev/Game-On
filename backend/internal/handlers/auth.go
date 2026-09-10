package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"game-on-backend/internal/middleware"
	"game-on-backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	pool      *pgxpool.Pool
	jwtSecret string
}

func NewAuthHandler(pool *pgxpool.Pool, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		pool:      pool,
		jwtSecret: jwtSecret,
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"msg":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	name := req.Name
	if name == "" {
		name = req.Username
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := req.Password

	if name == "" || email == "" || password == "" {
		http.Error(w, `{"msg":"Please provide all required fields"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Check if email or username already exists
	var exists bool
	err := h.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 OR name = $2 OR username = $2)", email, name).Scan(&exists)
	if err != nil {
		http.Error(w, `{"msg":"Database query error"}`, http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, `{"msg":"User with this email or username already exists"}`, http.StatusBadRequest)
		return
	}

	// Hash password securely with bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"msg":"Failed to hash password"}`, http.StatusInternalServerError)
		return
	}

	// Insert new user
	var userID int
	err = h.pool.QueryRow(ctx,
		"INSERT INTO users (name, username, email, password, password_hash, created_at, updated_at) VALUES ($1, $1, $2, $3, $3, NOW(), NOW()) RETURNING id",
		name, email, string(hashedPassword),
	).Scan(&userID)
	if err != nil {
		http.Error(w, `{"msg":"Failed to create user account"}`, http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := h.generateToken(userID)
	if err != nil {
		http.Error(w, `{"msg":"Failed to generate auth token"}`, http.StatusInternalServerError)
		return
	}

	resp := models.AuthResponse{
		Token: token,
		User: models.UserPublic{
			ID:    fmt.Sprintf("%d", userID),
			Name:  name,
			Email: email,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"msg":"Invalid request body"}`, http.StatusBadRequest)
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := req.Password

	if email == "" || password == "" {
		http.Error(w, `{"msg":"Email and password required"}`, http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user models.User
	err := h.pool.QueryRow(ctx,
		"SELECT id, COALESCE(name, username), email, COALESCE(password_hash, password) FROM users WHERE email = $1",
		email,
	).Scan(&user.ID, &user.Username, &user.Email, &user.PasswordHash)
	if err != nil {
		http.Error(w, `{"msg":"Invalid credentials"}`, http.StatusBadRequest)
		return
	}

	// Verify password hash
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		http.Error(w, `{"msg":"Invalid credentials"}`, http.StatusBadRequest)
		return
	}

	token, err := h.generateToken(user.ID)
	if err != nil {
		http.Error(w, `{"msg":"Failed to generate auth token"}`, http.StatusInternalServerError)
		return
	}

	resp := models.AuthResponse{
		Token: token,
		User: models.UserPublic{
			ID:    fmt.Sprintf("%d", user.ID),
			Name:  user.Username,
			Email: user.Email,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		http.Error(w, `{"msg":"Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var user models.UserPublic
	var id int
	err := h.pool.QueryRow(ctx, "SELECT id, COALESCE(name, username), email FROM users WHERE id = $1", userID).Scan(&id, &user.Name, &user.Email)
	if err != nil {
		http.Error(w, `{"msg":"User not found"}`, http.StatusNotFound)
		return
	}
	user.ID = fmt.Sprintf("%d", id)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"user":  user,
		"id":    user.ID,
		"name":  user.Name,
		"email": user.Email,
	})
}

func (h *AuthHandler) Verify(w http.ResponseWriter, r *http.Request) {
	h.Me(w, r)
}

func (h *AuthHandler) generateToken(userID int) (string, error) {
	claims := jwt.MapClaims{
		"userId": userID,
		"id":     userID,
		"iat":    time.Now().Unix(),
		"exp":    time.Now().Add(7 * 24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.jwtSecret))
}
