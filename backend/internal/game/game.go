// Package game is the server-authoritative game engine. Every game runs as a
// Session held in memory; clients send actions and receive a client-safe view.
// Scores only ever come from a session the server ran to completion.
package game

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/rand/v2"
	"time"
)

type Outcome string

const (
	Win  Outcome = "win"
	Loss Outcome = "loss"
	Draw Outcome = "draw"
	Done Outcome = "done" // solo games without win/loss
)

// Result is the final, verified outcome of a session.
type Result struct {
	Outcome Outcome `json:"outcome"`
	Score   int     `json:"score"`
}

// Session is one play-through of a game. Implementations need not be safe for
// concurrent use; the Manager serialises access.
type Session interface {
	// Act applies a raw JSON action at time now. Invalid moves return an *ActionError.
	Act(now time.Time, action json.RawMessage) error
	// View is the client-safe state (never includes secrets such as answers).
	View() any
	// Result is nil until the session is over.
	Result() *Result
}

// Config describes how to start a session.
type Config struct {
	Difficulty string
	Now        time.Time
	RNG        *rand.Rand
	// Seed is a public per-session seed, for games where the client mirrors the
	// simulation (e.g. Stackfall's piece order).
	Seed uint32
}

// Definition registers a game with the engine.
type Definition struct {
	ID string
	// Difficulties lists accepted difficulty ids; the first is the default.
	// Empty means the game has no difficulty setting.
	Difficulties []string
	New          func(Config) (Session, error)
}

// ActionError is a rejected move; it is the player's mistake, not a server fault.
type ActionError struct{ Msg string }

func (e *ActionError) Error() string { return e.Msg }

// Reject builds an ActionError.
func Reject(format string, args ...any) error {
	return &ActionError{Msg: fmt.Sprintf(format, args...)}
}

var ErrFinished = &ActionError{Msg: "This game is already over"}

// DecodeAction unmarshals an action, mapping malformed input to an ActionError.
func DecodeAction(raw json.RawMessage, dst any) error {
	if err := json.Unmarshal(raw, dst); err != nil {
		return &ActionError{Msg: "Malformed action"}
	}
	return nil
}

// IsActionError reports whether err is a rejected move.
func IsActionError(err error) bool {
	var ae *ActionError
	return errors.As(err, &ae)
}

// Kind extracts just the "type" field of an action.
func Kind(raw json.RawMessage) string {
	var k struct {
		Type string `json:"type"`
	}
	_ = json.Unmarshal(raw, &k)
	return k.Type
}

// Clamp bounds v to [lo, hi].
func Clamp(v, lo, hi int) int {
	return max(lo, min(hi, v))
}
