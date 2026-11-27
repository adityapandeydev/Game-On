package store

import (
	"context"
	"sync"
	"time"
)

// Cache memoises expensive read queries for a short TTL. Concurrent misses for
// the same key share a single load. Writers call Invalidate for read-your-writes.
type Cache struct {
	ttl time.Duration

	mu      sync.Mutex
	entries map[string]*cacheEntry
}

type cacheEntry struct {
	val     any
	err     error
	expires time.Time
	ready   chan struct{}
}

func NewCache(ttl time.Duration) *Cache {
	return &Cache{ttl: ttl, entries: make(map[string]*cacheEntry)}
}

// Get returns the cached value for key, loading it with fn on a miss.
func Get[T any](ctx context.Context, c *Cache, key string, fn func(context.Context) (T, error)) (T, error) {
	c.mu.Lock()
	e, ok := c.entries[key]
	if ok {
		select {
		case <-e.ready:
			if time.Now().Before(e.expires) && e.err == nil {
				c.mu.Unlock()
				return e.val.(T), nil
			}
			ok = false
		default:
			// A load is in flight; wait for it below.
		}
	}
	if !ok {
		e = &cacheEntry{ready: make(chan struct{})}
		c.entries[key] = e
		c.mu.Unlock()

		// Detach from the caller so one cancelled request doesn't fail everyone waiting.
		loadCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
		v, err := fn(loadCtx)
		cancel()
		e.val, e.err, e.expires = v, err, time.Now().Add(c.ttl)
		close(e.ready)
		return v, err
	}
	c.mu.Unlock()

	select {
	case <-e.ready:
		if e.err != nil {
			var zero T
			return zero, e.err
		}
		return e.val.(T), nil
	case <-ctx.Done():
		var zero T
		return zero, ctx.Err()
	}
}

// Invalidate drops every entry whose key starts with prefix.
func (c *Cache) Invalidate(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	for k := range c.entries {
		if len(k) >= len(prefix) && k[:len(prefix)] == prefix {
			delete(c.entries, k)
		}
	}
}
