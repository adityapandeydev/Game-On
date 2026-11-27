package store

import (
	"context"
	"log/slog"
	"sync"
	"time"
)

// PlayCounter buffers session-start counts in memory and flushes them in one
// batch on an interval, so a burst of plays costs one round trip, not hundreds.
type PlayCounter struct {
	store *Store
	log   *slog.Logger

	mu      sync.Mutex
	pending map[string]int
}

func NewPlayCounter(s *Store, log *slog.Logger) *PlayCounter {
	return &PlayCounter{store: s, log: log, pending: make(map[string]int)}
}

func (p *PlayCounter) Add(gameID string) {
	p.mu.Lock()
	p.pending[gameID]++
	p.mu.Unlock()
}

// Run flushes every interval until ctx ends, then performs a final flush.
func (p *PlayCounter) Run(ctx context.Context, interval time.Duration) {
	t := time.NewTicker(interval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			flushCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
			p.flush(flushCtx)
			cancel()
			return
		case <-t.C:
			p.flush(ctx)
		}
	}
}

func (p *PlayCounter) flush(ctx context.Context) {
	p.mu.Lock()
	if len(p.pending) == 0 {
		p.mu.Unlock()
		return
	}
	batch := p.pending
	p.pending = make(map[string]int, len(batch))
	p.mu.Unlock()

	if err := p.store.AddPlays(ctx, batch); err != nil {
		p.log.Error("flush play counts", "err", err)
		// Put the counts back so they are retried on the next tick.
		p.mu.Lock()
		for k, v := range batch {
			p.pending[k] += v
		}
		p.mu.Unlock()
	}
}
