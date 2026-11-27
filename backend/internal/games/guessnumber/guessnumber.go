// Package guessnumber hides a number on the server; the player narrows it down
// with higher/lower hints. The secret never leaves the server until the end.
package guessnumber

import (
	"encoding/json"
	"time"

	"gameon/internal/game"
)

type level struct {
	max, guesses, base int
}

var levels = map[string]level{
	"easy":   {max: 50, guesses: 8, base: 200},
	"normal": {max: 100, guesses: 9, base: 400},
	"hard":   {max: 1000, guesses: 12, base: 1000},
}

type Guess struct {
	Value int    `json:"value"`
	Hint  string `json:"hint"` // "higher" | "lower" | "correct"
}

func Definition() game.Definition {
	return game.Definition{
		ID:           "guess-number",
		Difficulties: []string{"normal", "easy", "hard"},
		New: func(c game.Config) (game.Session, error) {
			l := levels[c.Difficulty]
			return &session{
				lvl: l, secret: c.RNG.IntN(l.max) + 1,
				Difficulty: c.Difficulty, Min: 1, Max: l.max, Low: 1, High: l.max,
				Remaining: l.guesses, Allowed: l.guesses, Status: "playing", History: []Guess{},
			}, nil
		},
	}
}

type session struct {
	lvl    level
	secret int

	Difficulty string  `json:"difficulty"`
	Min        int     `json:"min"`
	Max        int     `json:"max"`
	Low        int     `json:"low"`  // smallest value still possible
	High       int     `json:"high"` // largest value still possible
	Remaining  int     `json:"remaining"`
	Allowed    int     `json:"allowed"`
	History    []Guess `json:"history"`
	Status     string  `json:"status"` // "playing" | "won" | "lost"
	Secret     *int    `json:"secret,omitempty"`
	Score      int     `json:"score"`

	result *game.Result
}

func (s *session) View() any {
	v := *s
	v.History = append(s.History[:0:0], s.History...)
	return &v
}
func (s *session) Result() *game.Result { return s.result }

func (s *session) Act(_ time.Time, raw json.RawMessage) error {
	var a struct {
		Type  string `json:"type"`
		Value *int   `json:"value"`
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	if a.Type != "guess" {
		return game.Reject("Unknown action")
	}
	if a.Value == nil || *a.Value < s.Min || *a.Value > s.Max {
		return game.Reject("Guess a number from %d to %d", s.Min, s.Max)
	}
	v := *a.Value
	s.Remaining--
	g := Guess{Value: v}
	switch {
	case v == s.secret:
		g.Hint = "correct"
	case v < s.secret:
		g.Hint = "higher"
		s.Low = max(s.Low, v+1)
	default:
		g.Hint = "lower"
		s.High = min(s.High, v-1)
	}
	s.History = append(s.History, g)

	switch {
	case g.Hint == "correct":
		s.Status = "won"
		s.Score = s.lvl.base * (s.Remaining + 1) / s.lvl.guesses
		s.reveal(game.Win)
	case s.Remaining == 0:
		s.Status = "lost"
		s.reveal(game.Loss)
	}
	return nil
}

func (s *session) reveal(o game.Outcome) {
	secret := s.secret
	s.Secret = &secret
	s.result = &game.Result{Outcome: o, Score: s.Score}
}
