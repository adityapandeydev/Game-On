package geoquest

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

func TestDataIntegrity(t *testing.T) {
	names, caps := map[string]bool{}, map[string]bool{}
	for _, c := range countries {
		if names[c.name] || caps[c.capital] {
			t.Fatalf("duplicate %s / %s", c.name, c.capital)
		}
		names[c.name], caps[c.capital] = true, true
		if c.tier < 1 || c.tier > 3 {
			t.Fatalf("%s bad tier", c.name)
		}
	}
	for d, l := range levels {
		n := 0
		for _, c := range countries {
			for _, tier := range l.tiers {
				if c.tier == tier {
					n++
				}
			}
		}
		if n < Rounds {
			t.Fatalf("%s pool too small", d)
		}
	}
}

func TestPerfectRun(t *testing.T) {
	t0 := time.Unix(0, 0)
	s, _ := Definition().New(game.Config{Difficulty: "normal", RNG: rand.New(rand.NewPCG(2, 2)), Now: t0})
	ss := s.(*session)
	for s.Result() == nil {
		q := *ss.Question
		if len(q.Choices) != 4 || q.Choices[ss.answer] == "" {
			t.Fatal("bad question")
		}
		b, _ := json.Marshal(map[string]any{"type": "answer", "choice": ss.answer})
		if err := s.Act(t0, b); err != nil {
			t.Fatal(err)
		}
		if s.Result() == nil {
			if err := s.Act(t0, json.RawMessage(`{"type":"next"}`)); err != nil {
				t.Fatal(err)
			}
		}
	}
	if ss.CorrectN != Rounds || ss.Score != Rounds*int(150*1.5) {
		t.Fatalf("correct=%d score=%d", ss.CorrectN, ss.Score)
	}
}
