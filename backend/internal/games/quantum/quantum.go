// Package quantum is "Quantum Guess": a sixty-second mental-maths sprint.
// Questions are generated and checked on the server, and the clock is the
// server's clock.
package quantum

import (
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"time"

	"gameon/internal/game"
)

const (
	Duration = 60 * time.Second
	grace    = 1500 * time.Millisecond // network latency allowance
	maxCombo = 5
)

var mults = map[string]float64{"easy": 1, "normal": 1.5, "hard": 2}

func Definition() game.Definition {
	return game.Definition{
		ID:           "quantum-guess",
		Difficulties: []string{"normal", "easy", "hard"},
		New: func(c game.Config) (game.Session, error) {
			return &session{rng: c.RNG, mult: mults[c.Difficulty], Difficulty: c.Difficulty, Status: "ready", DurationMs: int(Duration / time.Millisecond)}, nil
		},
	}
}

type session struct {
	rng    *rand.Rand
	mult   float64
	answer int
	start  time.Time

	Difficulty string `json:"difficulty"`
	Status     string `json:"status"` // "ready" | "playing" | "over"
	Question   string `json:"question,omitempty"`
	DurationMs int    `json:"durationMs"`
	RemainMs   int    `json:"remainingMs"`
	Correct    int    `json:"correct"`
	Wrong      int    `json:"wrong"`
	Combo      int    `json:"combo"` // current multiplier, 1-5
	Run        int    `json:"run"`   // consecutive correct answers
	Score      int    `json:"score"`
	// Last answer feedback.
	LastCorrect *bool `json:"lastCorrect,omitempty"`
	LastAnswer  *int  `json:"lastAnswer,omitempty"` // the right answer to the previous question

	result *game.Result
}

func (s *session) View() any            { v := *s; return &v }
func (s *session) Result() *game.Result { return s.result }

func (s *session) Act(now time.Time, raw json.RawMessage) error {
	var a struct {
		Type  string `json:"type"`
		Value *int   `json:"value"`
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	switch a.Type {
	case "start":
		if s.Status != "ready" {
			return game.Reject("Already started")
		}
		s.Status, s.start, s.Combo = "playing", now, 1
		s.next()
		s.RemainMs = int(Duration / time.Millisecond)
		return nil
	case "answer", "end":
	default:
		return game.Reject("Unknown action")
	}
	if s.Status != "playing" {
		return game.Reject("The round has not started")
	}
	elapsed := now.Sub(s.start)
	s.RemainMs = max(0, int((Duration-elapsed)/time.Millisecond))
	if a.Type == "end" || elapsed > Duration+grace {
		s.finish()
		return nil
	}
	if a.Value == nil {
		return game.Reject("Enter a number")
	}
	right := *a.Value == s.answer
	ans := s.answer
	s.LastCorrect, s.LastAnswer = &right, &ans
	if right {
		s.Correct++
		s.Run++
		s.Combo = min(maxCombo, 1+s.Run/3)
		s.Score += int(float64(10*s.Combo) * s.mult)
	} else {
		s.Wrong++
		s.Run, s.Combo = 0, 1
	}
	if elapsed >= Duration {
		s.finish()
		return nil
	}
	s.next()
	return nil
}

func (s *session) finish() {
	s.Status, s.Question, s.RemainMs = "over", "", 0
	s.result = &game.Result{Outcome: game.Done, Score: s.Score}
}

func (s *session) between(lo, hi int) int { return lo + s.rng.IntN(hi-lo+1) }

// next generates a question whose difficulty also ramps with the run length.
func (s *session) next() {
	r := s.rng
	hard := s.Correct / 8 // gentle ramp within a round
	var a, b int
	op := r.IntN(4)
	switch s.Difficulty {
	case "easy":
		op %= 2
		a, b = s.between(1, 12+hard*4), s.between(1, 12+hard*4)
	case "normal":
		op %= 3
		a, b = s.between(5, 50+hard*10), s.between(2, 30+hard*5)
		if op == 2 {
			a, b = s.between(2, 12), s.between(2, 12)
		}
	default:
		a, b = s.between(12, 99+hard*20), s.between(6, 60+hard*10)
		if op >= 2 {
			a, b = s.between(3, 19), s.between(3, 15)
		}
	}
	switch op {
	case 0:
		s.Question, s.answer = fmt.Sprintf("%d + %d", a, b), a+b
	case 1:
		if b > a {
			a, b = b, a
		}
		s.Question, s.answer = fmt.Sprintf("%d − %d", a, b), a-b
	case 2:
		s.Question, s.answer = fmt.Sprintf("%d × %d", a, b), a*b
	default:
		s.Question, s.answer = fmt.Sprintf("%d ÷ %d", a*b, b), a
	}
}
