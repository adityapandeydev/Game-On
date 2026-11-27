// Package api wires HTTP routes to the store and game engine.
package api

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"gameon/internal/auth"
	"gameon/internal/game"
	"gameon/internal/httpx"
	"gameon/internal/store"
)

type Deps struct {
	Log      *slog.Logger
	Store    *store.Store
	Plays    *store.PlayCounter
	Sessions *auth.Sessions
	Games    *game.Manager
	// Ctx bounds background goroutines (rate-limiter janitors).
	Ctx context.Context
}

type API struct {
	Deps
	cache *store.Cache
}

// Routes registers every /api endpoint on mux.
func Routes(mux *http.ServeMux, d Deps) {
	a := &API{Deps: d, cache: store.NewCache(10 * time.Second)}
	h := func(fn httpx.HandlerFunc) http.Handler { return httpx.Handle(d.Log, fn) }

	authLimit := httpx.NewRateLimiter(d.Ctx, 10, 10)  // 10/min per IP for credential endpoints
	writeLimit := httpx.NewRateLimiter(d.Ctx, 30, 10) // reviews
	playLimit := httpx.NewRateLimiter(d.Ctx, 60, 20)  // new game sessions
	actLimit := httpx.NewRateLimiter(d.Ctx, 900, 120) // in-game actions (fast games need headroom)

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, _ *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})
	mux.Handle("GET /api/ready", h(a.ready))

	mux.Handle("GET /api/games", h(a.listGames))
	mux.Handle("GET /api/games/{id}", h(a.getGame))

	mux.Handle("POST /api/auth/register", authLimit.Middleware(h(a.register)))
	mux.Handle("POST /api/auth/login", authLimit.Middleware(h(a.login)))
	mux.Handle("POST /api/auth/logout", h(a.logout))
	mux.Handle("GET /api/me", h(a.me))

	mux.Handle("GET /api/leaderboards/global", h(a.globalBoard))
	mux.Handle("GET /api/leaderboards/{gameId}", h(a.gameBoard))

	mux.Handle("GET /api/reviews", h(a.listReviews))
	mux.Handle("POST /api/reviews", writeLimit.Middleware(h(a.upsertReview)))
	mux.Handle("DELETE /api/reviews/{id}", writeLimit.Middleware(h(a.deleteReview)))

	mux.Handle("POST /api/games/{id}/sessions", playLimit.Middleware(h(a.startSession)))
	mux.Handle("GET /api/sessions/{sid}", h(a.getSession))
	mux.Handle("POST /api/sessions/{sid}/actions", actLimit.Middleware(h(a.sessionAction)))
	mux.Handle("DELETE /api/sessions/{sid}", h(a.abandonSession))

	mux.Handle("/api/", h(func(http.ResponseWriter, *http.Request) error {
		return httpx.NotFound("No such endpoint")
	}))
}

func (a *API) ready(w http.ResponseWriter, r *http.Request) error {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	if err := a.Store.Ping(ctx); err != nil {
		httpx.JSON(w, http.StatusServiceUnavailable, map[string]string{"status": "unavailable"})
		return nil
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"status": "ready", "liveSessions": a.Games.Len()})
	return nil
}

// requireUser returns the signed-in user's ID or a 401.
func requireUser(r *http.Request) (int64, error) {
	id := auth.UserID(r.Context())
	if id == 0 {
		return 0, httpx.Unauthorized("Sign in to do that")
	}
	return id, nil
}

// publicCache marks a response cacheable by browsers and shared caches briefly.
func publicCache(w http.ResponseWriter, seconds int) {
	w.Header().Set("Cache-Control", "public, max-age="+itoa(seconds)+", stale-while-revalidate=30")
}

func privateNoStore(w http.ResponseWriter) {
	w.Header().Set("Cache-Control", "private, no-store")
}
