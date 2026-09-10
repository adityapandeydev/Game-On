package models

import (
	"time"
)

// User represents a registered player
type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// UserPublic represents the user profile sent to the client
type UserPublic struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

// RegisterRequest represents the payload for user registration
type RegisterRequest struct {
	Name     string `json:"name"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest represents the payload for user authentication
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents the JSON returned upon successful auth
type AuthResponse struct {
	Token string     `json:"token"`
	User  UserPublic `json:"user"`
}

// Score represents a game score in the database
type Score struct {
	ID        int       `json:"id"`
	UserID    int       `json:"userId"`
	GameID    string    `json:"gameId"`
	GameName  string    `json:"gameName"`
	Score     int       `json:"score"`
	Streak    int       `json:"streak"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// ScoreSubmission represents the payload to submit a score
type ScoreSubmission struct {
	GameID   string `json:"gameId"`
	GameName string `json:"gameName"`
	Score    int    `json:"score"`
	Streak   int    `json:"streak"`
}

// LeaderboardUserRef represents the nested user object in leaderboard responses
type LeaderboardUserRef struct {
	ID   string `json:"id"`
	RID  string `json:"_id"`
	Name string `json:"name"`
}

// LeaderboardEntry represents an item on a game's leaderboard
type LeaderboardEntry struct {
	ID        string             `json:"_id"`
	Score     int                `json:"score"`
	GameName  string             `json:"gameName"`
	Timestamp string             `json:"timestamp"`
	UserRef   LeaderboardUserRef `json:"userId"`
	Username  string             `json:"username"`
	Streak    int                `json:"streak,omitempty"`
}

// GlobalLeaderboardEntry represents an item on the global high score rankings
type GlobalLeaderboardEntry struct {
	ID          string             `json:"_id"`
	Rank        int                `json:"rank"`
	UserRef     LeaderboardUserRef `json:"userId"`
	Username    string             `json:"username"`
	Score       int                `json:"score"`
	TotalScore  int                `json:"totalScore"`
	GamesPlayed int                `json:"gamesPlayed"`
	Timestamp   string             `json:"timestamp"`
}

// RecentGame represents a recently played game entry
type RecentGame struct {
	ID         string `json:"id"`
	GameID     string `json:"gameId"`
	Title      string `json:"title"`
	GameName   string `json:"gameName"`
	LastPlayed string `json:"lastPlayed"`
}

// TrackGameRequest represents a game play / click tracking request
type TrackGameRequest struct {
	GameID   string `json:"gameId"`
	GameName string `json:"gameName"`
}

// TrendingGame represents top games by plays / clicks
type TrendingGame struct {
	GameID      string `json:"gameId"`
	GameName    string `json:"gameName"`
	ClickCount  int    `json:"clickCount"`
	LastClicked string `json:"lastClicked"`
}

// Review represents a player review
type Review struct {
	ID         int                `json:"id"`
	RID        string             `json:"_id"`
	GameID     string             `json:"gameId"`
	GameName   string             `json:"gameName"`
	Rating     int                `json:"rating"`
	StarRating int                `json:"starRating"`
	Comment    string             `json:"comment"`
	ReviewText string             `json:"reviewText"`
	Timestamp  string             `json:"timestamp"`
	CreatedAt  string             `json:"createdAt"`
	UserRef    LeaderboardUserRef `json:"userId"`
	Username   string             `json:"username"`
}

// CreateReviewRequest represents the payload to submit a review
type CreateReviewRequest struct {
	GameID     string `json:"gameId"`
	GameName   string `json:"gameName"`
	Rating     int    `json:"rating"`
	Comment    string `json:"comment"`
	ReviewText string `json:"reviewText"`
}

// UserGameStats represents user performance on a specific game
type UserGameStats struct {
	UserID           string `json:"userId"`
	GameID           string `json:"gameId"`
	CurrentScore     int    `json:"currentScore"`
	CurrentStreak    int    `json:"currentStreak"`
	HighestScore     int    `json:"highestScore"`
	TotalGamesPlayed int    `json:"totalGamesPlayed"`
	Wins             int    `json:"wins"`
	Draws            int    `json:"draws"`
	Losses           int    `json:"losses"`
}
