package pig

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

func TestGamesFinishWithConsistentScores(t *testing.T) {
	wins := 0
	for seed := uint64(0); seed < 300; seed++ {
		s, _ := Definition().New(game.Config{RNG: rand.New(rand.NewPCG(seed, 7))})
		ss := s.(*session)
		if err := s.Act(time.Now(), json.RawMessage(`{"type":"hold"}`)); !game.IsActionError(err) {
			t.Fatal("hold with empty turn accepted")
		}
		for steps := 0; s.Result() == nil; steps++ {
			if steps > 10000 {
				t.Fatal("game never ended")
			}
			kind := `{"type":"roll"}`
			if ss.TurnTotal >= 20 {
				kind = `{"type":"hold"}`
			}
			if err := s.Act(time.Now(), json.RawMessage(kind)); err != nil {
				t.Fatal(err)
			}
		}
		r := s.Result()
		if r.Outcome == game.Win {
			wins++
			if ss.You < Goal || r.Score != 100+ss.You-ss.Bot {
				t.Fatalf("bad win scoring: %+v you=%d bot=%d", r, ss.You, ss.Bot)
			}
		} else if ss.Bot < Goal {
			t.Fatal("loss without bot reaching goal")
		}
	}
	// Same strategy as the bot and moving first: should be roughly even.
	if wins < 100 || wins > 220 {
		t.Fatalf("implausible win rate %d/300", wins)
	}
}
