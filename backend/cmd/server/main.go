package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"game-on-backend/internal/config"
	"game-on-backend/internal/database"
	"game-on-backend/internal/router"
)

func main() {
	cfg := config.LoadConfig()

	log.Println("🔌 Initializing PostgreSQL connection pool...")
	pool, err := database.NewPool(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Fatal: Failed to connect to PostgreSQL: %v", err)
	}
	defer pool.Close()

	r := router.NewRouter(pool, cfg.JWTSecret)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Channel to listen for errors coming from the listener
	serverErrors := make(chan error, 1)

	// Start the server
	go func() {
		log.Printf("🚀 Game-On Go + Chi backend running on port %s with PostgreSQL", cfg.Port)
		serverErrors <- server.ListenAndServe()
	}()

	// Channel to listen for an interrupt or terminate signal from the OS
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Blocking main and waiting for shutdown
	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server error: %v", err)
		}

	case sig := <-shutdown:
		log.Printf("🛑 Main: %v : Start graceful shutdown", sig)

		// Give outstanding requests a deadline for completion
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		// Asking listener to shutdown and shed load
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Graceful shutdown failed, forcing server close: %v", err)
			_ = server.Close()
		}
		fmt.Println("👋 Game-On Go backend shut down gracefully")
	}
}
