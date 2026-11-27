package quantum

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

func TestSprint(t *testing.T) {
	for _, d := range []string{"easy", "normal", "hard"} {
		s, _ := Definition().New(game.Config{Difficulty: d, RNG: rand.New(rand.NewPCG(4, 4))})
		ss := s.(*session)
		t0 := time.Unix(1000, 0)
		if err := s.Act(t0, json.RawMessage(`{"type":"answer","value":1}`)); !game.IsActionError(err) {
			t.Fatal("answer before start accepted")
		}
		_ = s.Act(t0, json.RawMessage(`{"type":"start"}`))
		for i := 0; i < 30; i++ {
			if ss.answer < 0 || ss.Question == "" {
				t.Fatalf("bad question %q = %d", ss.Question, ss.answer)
			}
			b, _ := json.Marshal(map[string]any{"type": "answer", "value": ss.answer})
			if err := s.Act(t0.Add(time.Duration(i)*time.Second), b); err != nil {
				t.Fatal(err)
			}
		}
		if ss.Combo != maxCombo || ss.Correct != 30 {
			t.Fatalf("combo %d correct %d", ss.Combo, ss.Correct)
		}
		// An answer arriving well after the deadline ends the round without scoring.
		before := ss.Score
		_ = s.Act(t0.Add(70*time.Second), json.RawMessage(`{"type":"answer","value":0}`))
		if s.Result() == nil || s.Result().Score != before {
			t.Fatal("late answer counted or round not ended")
		}
	}
}
