package game

import (
	"context"
	crand "crypto/rand"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"errors"
	"math/rand/v2"
	"slices"
	"sync"
	"time"
)

var (
	ErrUnknownGame       = errors.New("unknown game")
	ErrUnknownDifficulty = errors.New("unknown difficulty")
	ErrNoSession         = errors.New("session not found")
	ErrCapacity          = errors.New("server is at session capacity")
)

const (
	idleTTL     = 30 * time.Minute // in-progress sessions with no activity
	finishedTTL = 5 * time.Minute  // finished sessions kept for a final fetch
	maxSessions = 200_000
)

// Entry is a live session plus bookkeeping. Lock mu before touching Session.
type Entry struct {
	ID       string
	GameID   string
	OwnerID  int64 // 0 for guests
	Seed     uint32
	Created  time.Time
	mu       sync.Mutex
	Session  Session
	last     time.Time
	recorded bool
}

// Manager stores sessions in memory. A single process owns its sessions, so
// running several instances requires sticky routing (or a shared store later).
type Manager struct {
	defs map[string]Definition
	now  func() time.Time

	mu       sync.RWMutex
	sessions map[string]*Entry
	// active maps owner+game to the session id so a user has one live run per
	// game; starting again replaces it. Guests (owner 0) are not indexed.
	active map[activeKey]string
}

type activeKey struct {
	owner int64
	game  string
}

func NewManager(defs ...Definition) *Manager {
	m := &Manager{
		defs:     make(map[string]Definition, len(defs)),
		now:      time.Now,
		sessions: make(map[string]*Entry),
		active:   make(map[activeKey]string),
	}
	for _, d := range defs {
		m.defs[d.ID] = d
	}
	return m
}

// Has reports whether a game is registered.
func (m *Manager) Has(id string) bool { _, ok := m.defs[id]; return ok }

// Len returns the number of live sessions.
func (m *Manager) Len() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.sessions)
}

// Start creates a session for owner.
func (m *Manager) Start(gameID string, owner int64, difficulty string) (*Entry, error) {
	def, ok := m.defs[gameID]
	if !ok {
		return nil, ErrUnknownGame
	}
	if len(def.Difficulties) > 0 {
		if difficulty == "" {
			difficulty = def.Difficulties[0]
		} else if !slices.Contains(def.Difficulties, difficulty) {
			return nil, ErrUnknownDifficulty
		}
	} else {
		difficulty = ""
	}

	var seedBytes [20]byte
	_, _ = crand.Read(seedBytes[:])
	rng := rand.New(rand.NewPCG(binary.LittleEndian.Uint64(seedBytes[0:8]), binary.LittleEndian.Uint64(seedBytes[8:16])))
	seed := binary.LittleEndian.Uint32(seedBytes[16:20])

	now := m.now()
	sess, err := def.New(Config{Difficulty: difficulty, Now: now, RNG: rng, Seed: seed})
	if err != nil {
		return nil, err
	}

	e := &Entry{ID: newID(), GameID: gameID, OwnerID: owner, Seed: seed, Created: now, Session: sess, last: now}

	m.mu.Lock()
	defer m.mu.Unlock()
	if owner != 0 {
		key := activeKey{owner, gameID}
		if old, ok := m.active[key]; ok {
			delete(m.sessions, old)
		}
		m.active[key] = e.ID
	} else if len(m.sessions) >= maxSessions {
		// Only guests can be refused; signed-in users replace their own run above.
		return nil, ErrCapacity
	}
	m.sessions[e.ID] = e
	return e, nil
}

// Get returns the session if it exists and belongs to owner.
func (m *Manager) Get(id string, owner int64) (*Entry, error) {
	m.mu.RLock()
	e, ok := m.sessions[id]
	m.mu.RUnlock()
	if !ok || e.OwnerID != owner {
		return nil, ErrNoSession
	}
	return e, nil
}

// Act applies an action under the session lock. fn runs while still locked,
// exactly once per session when it first reports a result (for recording).
func (m *Manager) Act(e *Entry, action json.RawMessage, onFinish func(*Result) error) error {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.Session.Result() != nil {
		return ErrFinished
	}
	now := m.now()
	if err := e.Session.Act(now, action); err != nil {
		return err
	}
	e.last = now
	if res := e.Session.Result(); res != nil && !e.recorded {
		e.recorded = true
		if onFinish != nil {
			return onFinish(res)
		}
	}
	return nil
}

// Snapshot returns the view and result under the session lock.
func (m *Manager) Snapshot(e *Entry) (view any, res *Result) {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.Session.View(), e.Session.Result()
}

// Remove deletes a session owned by owner.
func (m *Manager) Remove(id string, owner int64) bool {
	m.mu.Lock()
	defer m.mu.Unlock()
	e, ok := m.sessions[id]
	if !ok || e.OwnerID != owner {
		return false
	}
	m.removeLocked(e)
	return true
}

func (m *Manager) removeLocked(e *Entry) {
	delete(m.sessions, e.ID)
	key := activeKey{e.OwnerID, e.GameID}
	if m.active[key] == e.ID {
		delete(m.active, key)
	}
}

// Run evicts idle and finished sessions until ctx is cancelled.
func (m *Manager) Run(ctx context.Context) {
	t := time.NewTicker(time.Minute)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			m.sweep()
		}
	}
}

func (m *Manager) sweep() {
	now := m.now()
	m.mu.RLock()
	var stale []*Entry
	for _, e := range m.sessions {
		e.mu.Lock()
		ttl := idleTTL
		if e.Session.Result() != nil {
			ttl = finishedTTL
		}
		if now.Sub(e.last) > ttl {
			stale = append(stale, e)
		}
		e.mu.Unlock()
	}
	m.mu.RUnlock()
	if len(stale) == 0 {
		return
	}
	m.mu.Lock()
	for _, e := range stale {
		if cur, ok := m.sessions[e.ID]; ok && cur == e {
			m.removeLocked(e)
		}
	}
	m.mu.Unlock()
}

func newID() string {
	var b [16]byte
	_, _ = crand.Read(b[:])
	return base64.RawURLEncoding.EncodeToString(b[:])
}
