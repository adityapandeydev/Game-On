// Command server runs the Game-On API and serves the built web app.
package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gameon/internal/api"
	"gameon/internal/auth"
	"gameon/internal/config"
	"gameon/internal/db"
	"gameon/internal/game"
	"gameon/internal/games"
	"gameon/internal/httpx"
	"gameon/internal/store"
	"gameon/internal/web"
)

func main() {
	healthcheck := flag.Bool("healthcheck", false, "probe the local server's /api/health and exit (for container HEALTHCHECK)")
	flag.Parse()
	if *healthcheck {
		os.Exit(probe())
	}
	if err := run(); err != nil {
		slog.Error("fatal", "err", err)
		os.Exit(1)
	}
}

// probe returns 0 when the server on $PORT answers /api/health.
func probe() int {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	client := &http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/api/health")
	if err != nil {
		return 1
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}

func run() error {
	// All timestamps leave the API in UTC regardless of host timezone.
	time.Local = time.UTC

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	var handler slog.Handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug})
	if cfg.IsProduction() {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo})
	}
	log := slog.New(handler)
	slog.SetDefault(log)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	startCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	pool, err := db.Open(startCtx, cfg.DatabaseURL, cfg.DBMaxConns, log)
	cancel()
	if err != nil {
		return err
	}
	defer pool.Close()

	st := store.New(pool)
	plays := store.NewPlayCounter(st, log)
	manager := game.NewManager(games.All()...)

	// Background workers stop when bg is cancelled, after the HTTP server drains.
	bg, stopBG := context.WithCancel(context.Background())
	defer stopBG()
	playsDone := make(chan struct{})
	go func() { plays.Run(bg, 10*time.Second); close(playsDone) }()
	go manager.Run(bg)

	sessions := &auth.Sessions{Signer: auth.NewSigner(cfg.JWTSecret, cfg.TokenTTL), Secure: cfg.IsProduction()}
	mux := http.NewServeMux()
	api.Routes(mux, api.Deps{
		Log:      log,
		Store:    st,
		Plays:    plays,
		Sessions: sessions,
		Games:    manager,
		Ctx:      bg,
	})
	if cfg.StaticDir != "" {
		mux.Handle("/", web.Handler(os.DirFS(cfg.StaticDir)))
		log.Info("serving web app", "dir", cfg.StaticDir)
	}

	root := httpx.Chain(mux,
		httpx.WithRequestID,
		httpx.Recover(log),
		httpx.RealIP(cfg.TrustProxy),
		httpx.Logger(log),
		httpx.SecurityHeaders(cfg.IsProduction()),
		httpx.CORS(cfg.AllowedOrigins),
		httpx.Gzip,
		sessions.Middleware,
	)

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           root,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
		MaxHeaderBytes:    16 << 10,
		ErrorLog:          slog.NewLogLogger(handler, slog.LevelWarn),
	}

	errCh := make(chan error, 1)
	go func() {
		log.Info("listening", "addr", cfg.Addr, "env", cfg.Env)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-ctx.Done():
		log.Info("shutting down")
		shutCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
		defer cancel()
		if err := srv.Shutdown(shutCtx); err != nil {
			log.Warn("graceful shutdown incomplete", "err", err)
		}
	}
	stopBG()
	<-playsDone // final flush of play counters
	log.Info("stopped")
	return nil
}
