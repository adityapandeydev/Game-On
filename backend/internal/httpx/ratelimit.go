package httpx

import (
	"context"
	"math"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// RateLimiter is a per-key token bucket held in memory.
type RateLimiter struct {
	rate  float64 // tokens per second
	burst float64

	mu      sync.Mutex
	buckets map[string]*bucket
}

type bucket struct {
	tokens float64
	last   time.Time
}

// NewRateLimiter allows `burst` requests at once, refilling `perMinute` per minute.
// Idle buckets are evicted until ctx is cancelled.
func NewRateLimiter(ctx context.Context, perMinute, burst int) *RateLimiter {
	rl := &RateLimiter{
		rate:    float64(perMinute) / 60,
		burst:   float64(burst),
		buckets: make(map[string]*bucket),
	}
	go rl.janitor(ctx)
	return rl
}

// Allow consumes a token for key, returning false and the wait when exhausted.
func (rl *RateLimiter) Allow(key string) (bool, time.Duration) {
	now := time.Now()
	rl.mu.Lock()
	defer rl.mu.Unlock()
	b, ok := rl.buckets[key]
	if !ok {
		b = &bucket{tokens: rl.burst, last: now}
		rl.buckets[key] = b
	}
	b.tokens = math.Min(rl.burst, b.tokens+now.Sub(b.last).Seconds()*rl.rate)
	b.last = now
	if b.tokens >= 1 {
		b.tokens--
		return true, 0
	}
	return false, time.Duration((1 - b.tokens) / rl.rate * float64(time.Second))
}

func (rl *RateLimiter) janitor(ctx context.Context) {
	t := time.NewTicker(time.Minute)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case now := <-t.C:
			idle := time.Duration(rl.burst/rl.rate*float64(time.Second)) + time.Minute
			rl.mu.Lock()
			for k, b := range rl.buckets {
				if now.Sub(b.last) > idle {
					delete(rl.buckets, k)
				}
			}
			rl.mu.Unlock()
		}
	}
}

// Middleware limits by client IP.
func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if ok, wait := rl.Allow(ClientIP(r)); !ok {
			w.Header().Set("Retry-After", strconv.Itoa(int(math.Ceil(wait.Seconds()))))
			JSON(w, http.StatusTooManyRequests, map[string]*Error{"error": NewError(http.StatusTooManyRequests, "rate_limited", "Too many requests, slow down a little")})
			return
		}
		next.ServeHTTP(w, r)
	})
}
