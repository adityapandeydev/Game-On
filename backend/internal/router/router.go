package router

import (
	"net/http"
	"strings"

	"game-on-backend/internal/handlers"
	"game-on-backend/internal/middleware"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func NewRouter(pool *pgxpool.Pool, jwtSecret string) http.Handler {
	r := chi.NewRouter()

	// Essential Middlewares
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(chimw.Compress(5))

	// CORS Configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "x-auth-token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Handlers
	authHandler := handlers.NewAuthHandler(pool, jwtSecret)
	leaderboardHandler := handlers.NewLeaderboardHandler(pool)
	recentlyPlayedHandler := handlers.NewRecentlyPlayedHandler(pool)
	trendingHandler := handlers.NewTrendingHandler(pool)
	reviewsHandler := handlers.NewReviewsHandler(pool)
	gameStatsHandler := handlers.NewGameStatsHandler(pool)

	authMw := middleware.AuthMiddleware(jwtSecret)

	// Health Check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok","engine":"go-chi","database":"postgres"}`))
	})

	// Optional Auth Middleware for endpoints like gamestats
	optionalAuthMw := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tokenStr := r.Header.Get("x-auth-token")
			if tokenStr == "" {
				authHeader := r.Header.Get("Authorization")
				if strings.HasPrefix(authHeader, "Bearer ") {
					tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
				}
			}
			if tokenStr != "" {
				token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
					return []byte(jwtSecret), nil
				})
				if err == nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						var userID int
						if uid, ok := claims["userId"].(float64); ok {
							userID = int(uid)
						} else if uid, ok := claims["id"].(float64); ok {
							userID = int(uid)
						}
						if userID > 0 {
							ctx := r.Context()
							r = r.WithContext(middleware.WithUserID(ctx, userID))
						}
					}
				}
			}
			next.ServeHTTP(w, r)
		})
	}

	// Mount /api routes
	r.Route("/api", func(api chi.Router) {
		// Health Check
		api.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"status":"ok","engine":"go-chi","database":"postgres"}`))
		})

		// 1. Auth routes
		api.Route("/auth", func(auth chi.Router) {
			auth.Post("/signup", authHandler.Register)
			auth.Post("/register", authHandler.Register)
			auth.Post("/login", authHandler.Login)
			auth.With(authMw).Get("/me", authHandler.Me)
			auth.With(authMw).Get("/verify", authHandler.Verify)
		})

		// 2. Leaderboard routes
		api.Route("/leaderboard", func(lead chi.Router) {
			lead.Get("/global", leaderboardHandler.GetGlobalLeaderboard)
			lead.Get("/user/{userId}", leaderboardHandler.GetUserScores)
			lead.Get("/{gameId}", leaderboardHandler.GetGameLeaderboard)
			lead.With(authMw).Post("/submit", leaderboardHandler.SubmitScore)
			lead.With(authMw).Post("/scores", leaderboardHandler.SubmitScore)
		})

		// 3. Recently Played routes
		api.Route("/recently-played", func(recent chi.Router) {
			recent.With(authMw).Get("/", recentlyPlayedHandler.GetRecentlyPlayed)
			recent.With(authMw).Post("/", recentlyPlayedHandler.TrackRecentlyPlayed)
			recent.With(authMw).Post("/track", recentlyPlayedHandler.TrackRecentlyPlayed)
		})

		// 4. Trending games routes
		api.Route("/trending", func(trend chi.Router) {
			trend.Get("/", trendingHandler.GetTrending)
			trend.Post("/track/{gameId}", trendingHandler.TrackClick)
		})

		// 5. Reviews routes
		api.Route("/reviews", func(rev chi.Router) {
			rev.Get("/", reviewsHandler.GetReviews)
			rev.Get("/{gameId}", reviewsHandler.GetGameReviews)
			rev.Get("/game/{gameId}", reviewsHandler.GetGameReviews)
			rev.With(authMw).Post("/", reviewsHandler.CreateReview)
			rev.With(authMw).Post("/submit", reviewsHandler.CreateReview)
			rev.With(authMw).Delete("/{reviewId}", reviewsHandler.DeleteReview)
		})

		// 6. Game stats routes
		api.Route("/gamestats", func(stats chi.Router) {
			stats.With(optionalAuthMw).Get("/{gameId}", gameStatsHandler.GetGameStats)
		})
		api.Route("/stats", func(stats chi.Router) {
			stats.With(optionalAuthMw).Get("/{gameId}", gameStatsHandler.GetGameStats)
		})
	})

	return r
}
