// Package config loads and validates runtime configuration from the environment.
package config

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Env string

const (
	EnvDevelopment Env = "development"
	EnvProduction  Env = "production"
)

type Config struct {
	Env             Env
	Addr            string
	DatabaseURL     string
	JWTSecret       []byte
	TokenTTL        time.Duration
	AllowedOrigins  []string
	TrustProxy      bool
	StaticDir       string
	ShutdownTimeout time.Duration
	DBMaxConns      int32
}

func (c *Config) IsProduction() bool { return c.Env == EnvProduction }

// Load reads configuration from the process environment. A local ".env" file is
// read first when present (development convenience); real environment variables win.
func Load() (*Config, error) {
	loadDotEnv(".env")

	cfg := &Config{
		Env:             Env(get("APP_ENV", string(EnvDevelopment))),
		Addr:            ":" + get("PORT", "8080"),
		DatabaseURL:     get("DATABASE_URL", "postgres://gameon:gameon@localhost:5433/gameon?sslmode=disable"),
		JWTSecret:       []byte(os.Getenv("JWT_SECRET")),
		TokenTTL:        getDuration("TOKEN_TTL", 30*24*time.Hour),
		AllowedOrigins:  splitList(os.Getenv("CORS_ORIGINS")),
		TrustProxy:      getBool("TRUST_PROXY", false),
		StaticDir:       get("STATIC_DIR", ""),
		ShutdownTimeout: getDuration("SHUTDOWN_TIMEOUT", 15*time.Second),
		DBMaxConns:      int32(getInt("DB_MAX_CONNS", 20)),
	}

	if cfg.Env != EnvDevelopment && cfg.Env != EnvProduction {
		return nil, fmt.Errorf("APP_ENV must be %q or %q, got %q", EnvDevelopment, EnvProduction, cfg.Env)
	}

	if len(cfg.JWTSecret) == 0 {
		if cfg.IsProduction() {
			return nil, errors.New("JWT_SECRET is required in production")
		}
		cfg.JWTSecret = []byte("development-only-secret-do-not-use-in-production")
	}
	if cfg.IsProduction() && len(cfg.JWTSecret) < 32 {
		return nil, errors.New("JWT_SECRET must be at least 32 bytes in production")
	}
	return cfg, nil
}

func get(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func getInt(key string, def int) int {
	if v, err := strconv.Atoi(os.Getenv(key)); err == nil {
		return v
	}
	return def
}

func getBool(key string, def bool) bool {
	if v, err := strconv.ParseBool(os.Getenv(key)); err == nil {
		return v
	}
	return def
}

func getDuration(key string, def time.Duration) time.Duration {
	if v, err := time.ParseDuration(os.Getenv(key)); err == nil {
		return v
	}
	return def
}

func splitList(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

// loadDotEnv sets KEY=VALUE pairs from path without overriding existing variables.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.Trim(strings.TrimSpace(v), `"'`)
		if _, exists := os.LookupEnv(k); !exists {
			_ = os.Setenv(k, v)
		}
	}
}
