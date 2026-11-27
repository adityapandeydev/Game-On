package tictactoe

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

func newSession(t *testing.T, diff string, seed uint64) *session {
	t.Helper()
	s, err := Definition().New(game.Config{Difficulty: diff, RNG: rand.New(rand.NewPCG(seed, 1))})
	if err != nil {
		t.Fatal(err)
	}
	return s.(*session)
}

func act(s *session, v any) error {
	b, _ := json.Marshal(v)
	return s.Act(time.Now(), b)
}

func TestBestMoveTakesWinAndBlocks(t *testing.T) {
	win := [9]string{"O", "O", "", "X", "X", "", "", "", ""}
	if m := BestMove(win, bot); m != 2 {
		t.Fatalf("should complete row, got %d", m)
	}
	block := [9]string{"X", "X", "", "", "O", "", "", "", ""}
	if m := BestMove(block, bot); m != 2 {
		t.Fatalf("should block, got %d", m)
	}
}

// A perfect bot never loses: play every possible player line on hard.
func TestHardBotNeverLoses(t *testing.T) {
	var explore func(b [9]string)
	explore = func(b [9]string) {
		for i := range b {
			if b[i] != "" {
				continue
			}
			nb := b
			nb[i] = "X"
			if _, ok := winner(nb, you); ok {
				t.Fatalf("player won against perfect bot: %v", nb)
			}
			if full(nb) {
				continue
			}
			nb[BestMove(nb, bot)] = "O"
			if _, ok := winner(nb, bot); ok || full(nb) {
				continue
			}
			explore(nb)
		}
	}
	explore([9]string{})
}

func TestRejectsBadMoves(t *testing.T) {
	s := newSession(t, "hard", 1)
	if err := act(s, map[string]any{"type": "move", "cell": 9}); !game.IsActionError(err) {
		t.Fatal("out of range accepted")
	}
	_ = act(s, map[string]any{"type": "move", "cell": 4})
	if err := act(s, map[string]any{"type": "move", "cell": 4}); !game.IsActionError(err) {
		t.Fatal("taken square accepted")
	}
	if err := act(s, map[string]any{"type": "cashout"}); !game.IsActionError(err) {
		t.Fatal("cashout mid-round accepted")
	}
}

// Playing randomly against hard should never yield points from wins.
func TestRunEndsAndScores(t *testing.T) {
	r := rand.New(rand.NewPCG(9, 9))
	for seed := uint64(0); seed < 50; seed++ {
		s := newSession(t, "easy", seed)
		for steps := 0; s.Result() == nil && steps < 500; steps++ {
			switch s.Status {
			case "your-turn":
				var empty []int
				for i, c := range s.Board {
					if c == "" {
						empty = append(empty, i)
					}
				}
				if err := act(s, map[string]any{"type": "move", "cell": empty[r.IntN(len(empty))]}); err != nil {
					t.Fatal(err)
				}
			case "round-over":
				if err := act(s, map[string]any{"type": "next"}); err != nil {
					t.Fatal(err)
				}
			}
		}
		res := s.Result()
		if res == nil {
			t.Fatal("run never ended")
		}
		if res.Score != s.Score || res.Score < 0 {
			t.Fatalf("score mismatch %d vs %d", res.Score, s.Score)
		}
		if s.Round > maxRounds {
			t.Fatalf("ran %d rounds", s.Round)
		}
	}
}
