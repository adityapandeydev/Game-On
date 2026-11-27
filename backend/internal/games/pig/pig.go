// Package pig is the push-your-luck dice game against a bot. All dice are
// rolled on the server.
package pig

import (
	"encoding/json"
	"math/rand/v2"
	"time"

	"gameon/internal/game"
)

const Goal = 100

// BotStep is one event of the bot's turn, replayed by the client for animation.
type BotStep struct {
	Roll int  `json:"roll,omitempty"`
	Hold bool `json:"hold,omitempty"`
}

func Definition() game.Definition {
	return game.Definition{
		ID: "pig",
		New: func(c game.Config) (game.Session, error) {
			return &session{rng: c.RNG, Turn: "you", Status: "playing", BotTurn: []BotStep{}}, nil
		},
	}
}

type session struct {
	rng *rand.Rand

	You       int       `json:"you"`
	Bot       int       `json:"bot"`
	TurnTotal int       `json:"turnTotal"`
	Turn      string    `json:"turn"` // always "you" between actions while playing
	LastRoll  int       `json:"lastRoll,omitempty"`
	Busted    bool      `json:"busted"`  // your last roll was a 1
	BotTurn   []BotStep `json:"botTurn"` // what the bot did since your last action
	Status    string    `json:"status"`  // "playing" | "won" | "lost"
	Score     int       `json:"score"`

	result *game.Result
}

func (s *session) View() any {
	v := *s
	v.BotTurn = append(s.BotTurn[:0:0], s.BotTurn...)
	return &v
}
func (s *session) Result() *game.Result { return s.result }

func (s *session) roll() int { return s.rng.IntN(6) + 1 }

func (s *session) Act(_ time.Time, raw json.RawMessage) error {
	if s.Status != "playing" {
		return game.ErrFinished
	}
	s.BotTurn, s.Busted, s.LastRoll = []BotStep{}, false, 0
	switch game.Kind(raw) {
	case "roll":
		r := s.roll()
		s.LastRoll = r
		if r == 1 {
			s.TurnTotal = 0
			s.Busted = true
			s.botTurn()
			return nil
		}
		s.TurnTotal += r
		if s.You+s.TurnTotal >= Goal {
			s.You += s.TurnTotal
			s.TurnTotal = 0
			s.finish()
		}
	case "hold":
		if s.TurnTotal == 0 {
			return game.Reject("Roll at least once before holding")
		}
		s.You += s.TurnTotal
		s.TurnTotal = 0
		if s.You >= Goal {
			s.finish()
			return nil
		}
		s.botTurn()
	default:
		return game.Reject("Unknown action")
	}
	return nil
}

// botTurn plays the bot until it holds or busts. It holds at 20 normally,
// pushes harder when far behind and stops as soon as it can win.
func (s *session) botTurn() {
	total := 0
	target := 20
	if s.You >= 70 && s.Bot < s.You {
		target = 30
	}
	for {
		r := s.roll()
		s.BotTurn = append(s.BotTurn, BotStep{Roll: r})
		if r == 1 {
			return
		}
		total += r
		if s.Bot+total >= Goal {
			s.Bot += total
			s.finish()
			return
		}
		if total >= target {
			s.Bot += total
			s.BotTurn = append(s.BotTurn, BotStep{Hold: true})
			return
		}
	}
}

func (s *session) finish() {
	if s.You >= Goal {
		s.Status = "won"
		s.Score = 100 + (s.You - s.Bot)
		s.result = &game.Result{Outcome: game.Win, Score: s.Score}
		return
	}
	s.Status = "lost"
	s.result = &game.Result{Outcome: game.Loss}
}
