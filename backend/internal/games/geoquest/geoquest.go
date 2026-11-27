// Package geoquest is a ten-question capital-city quiz. Correct answers are
// only revealed after the player commits to a choice.
package geoquest

import (
	"encoding/json"
	"math/rand/v2"
	"time"

	"gameon/internal/game"
)

const (
	Rounds    = 10
	TimeLimit = 15 * time.Second
	grace     = time.Second
)

type level struct {
	tiers []int
	mult  float64
}

var levels = map[string]level{
	"easy":   {tiers: []int{1, 2}, mult: 1},
	"normal": {tiers: []int{1, 2, 3}, mult: 1.5},
	"hard":   {tiers: []int{2, 3}, mult: 2},
}

type Question struct {
	Country string   `json:"country"`
	Region  string   `json:"region"`
	Choices []string `json:"choices"`
}

type Reveal struct {
	Chosen  int  `json:"chosen"` // -1 when time ran out
	Correct int  `json:"correct"`
	Right   bool `json:"right"`
	Points  int  `json:"points"`
}

func Definition() game.Definition {
	return game.Definition{
		ID:           "geo-quest",
		Difficulties: []string{"normal", "easy", "hard"},
		New: func(c game.Config) (game.Session, error) {
			l := levels[c.Difficulty]
			var pool []int
			for i, ct := range countries {
				for _, t := range l.tiers {
					if ct.tier == t {
						pool = append(pool, i)
					}
				}
			}
			c.RNG.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })
			s := &session{rng: c.RNG, lvl: l, picks: pool[:Rounds], Difficulty: c.Difficulty, Total: Rounds, Status: "playing", TimeLimitMs: int(TimeLimit / time.Millisecond)}
			s.ask(c.Now)
			return s, nil
		},
	}
}

type session struct {
	rng     *rand.Rand
	lvl     level
	picks   []int
	answer  int
	askedAt time.Time

	Difficulty  string    `json:"difficulty"`
	Round       int       `json:"round"` // 1-based
	Total       int       `json:"total"`
	Question    *Question `json:"question,omitempty"`
	Last        *Reveal   `json:"last,omitempty"`
	CorrectN    int       `json:"correct"`
	Score       int       `json:"score"`
	TimeLimitMs int       `json:"timeLimitMs"`
	Status      string    `json:"status"` // "playing" | "reveal" | "over"

	result *game.Result
}

func (s *session) View() any            { v := *s; return &v }
func (s *session) Result() *game.Result { return s.result }

func (s *session) ask(now time.Time) {
	s.Round++
	ct := countries[s.picks[s.Round-1]]

	// Distractors: prefer the same region so answers are plausible.
	var same, rest []string
	for _, o := range countries {
		if o.capital == ct.capital {
			continue
		}
		if o.region == ct.region {
			same = append(same, o.capital)
		} else {
			rest = append(rest, o.capital)
		}
	}
	s.rng.Shuffle(len(same), func(i, j int) { same[i], same[j] = same[j], same[i] })
	s.rng.Shuffle(len(rest), func(i, j int) { rest[i], rest[j] = rest[j], rest[i] })
	choices := append([]string{ct.capital}, append(same, rest...)[:3]...)
	s.rng.Shuffle(len(choices), func(i, j int) { choices[i], choices[j] = choices[j], choices[i] })
	for i, c := range choices {
		if c == ct.capital {
			s.answer = i
		}
	}
	s.Question = &Question{Country: ct.name, Region: ct.region, Choices: choices}
	s.askedAt = now
}

func (s *session) Act(now time.Time, raw json.RawMessage) error {
	var a struct {
		Type   string `json:"type"`
		Choice *int   `json:"choice"`
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	if a.Type == "next" {
		if s.Status != "reveal" {
			return game.Reject("Answer the current question first")
		}
		s.Status = "playing"
		s.ask(now)
		return nil
	}
	if s.Status != "playing" {
		return game.Reject("Waiting for the next question")
	}
	switch a.Type {
	case "answer":
		if a.Choice == nil || *a.Choice < 0 || *a.Choice > 3 {
			return game.Reject("Choose one of the four answers")
		}
	case "timeout":
		// The client's timer ran out; only honoured once it actually has.
		if now.Sub(s.askedAt) < TimeLimit-grace {
			return game.Reject("There is still time left")
		}
		none := -1
		a.Choice = &none
	default:
		return game.Reject("Unknown action")
	}

	taken := now.Sub(s.askedAt)
	right := *a.Choice == s.answer && taken <= TimeLimit+grace
	pts := 0
	if right {
		speed := max(0, 50-int(taken/(300*time.Millisecond))) // loses 1 pt per 0.3 s
		pts = int(float64(100+speed) * s.lvl.mult)
		s.CorrectN++
		s.Score += pts
	}
	s.Last = &Reveal{Chosen: *a.Choice, Correct: s.answer, Right: right, Points: pts}

	if s.Round >= Rounds {
		s.Status = "over"
		s.result = &game.Result{Outcome: game.Done, Score: s.Score}
		return nil
	}
	s.Status = "reveal"
	return nil
}
