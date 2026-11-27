package guessnumber

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

func guess(s game.Session, v int) error {
	b, _ := json.Marshal(map[string]any{"type": "guess", "value": v})
	return s.Act(time.Now(), b)
}

func TestBinarySearchAlwaysWins(t *testing.T) {
	for _, d := range []string{"easy", "normal", "hard"} {
		for seed := uint64(0); seed < 200; seed++ {
			s, _ := Definition().New(game.Config{Difficulty: d, RNG: rand.New(rand.NewPCG(seed, 3))})
			ss := s.(*session)
			for s.Result() == nil {
				if err := guess(s, (ss.Low+ss.High)/2); err != nil {
					t.Fatal(err)
				}
			}
			if s.Result().Outcome != game.Win || s.Result().Score <= 0 {
				t.Fatalf("%s seed %d: binary search lost", d, seed)
			}
		}
	}
}

func TestSecretHiddenUntilEnd(t *testing.T) {
	s, _ := Definition().New(game.Config{Difficulty: "hard", RNG: rand.New(rand.NewPCG(1, 1))})
	_ = guess(s, 1)
	b, _ := json.Marshal(s.View())
	var v map[string]any
	_ = json.Unmarshal(b, &v)
	if _, leaked := v["secret"]; leaked && s.Result() == nil {
		t.Fatal("secret leaked mid-game")
	}
	if err := guess(s, 5000); !game.IsActionError(err) {
		t.Fatal("out-of-range guess accepted")
	}
}
