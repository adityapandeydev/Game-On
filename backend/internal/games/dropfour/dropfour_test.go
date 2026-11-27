package dropfour

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

func TestLineDetection(t *testing.T) {
	var b Board
	for c := 0; c < 4; c++ {
		b[5][c] = you
	}
	if b.lineThrough(5, 2, you) == nil {
		t.Fatal("horizontal missed")
	}
	var d Board
	for i := 0; i < 4; i++ {
		d[5-i][i] = bot
	}
	if d.lineThrough(3, 2, bot) == nil {
		t.Fatal("diagonal missed")
	}
}

func TestBotBlocksAndWins(t *testing.T) {
	s := &session{rng: rand.New(rand.NewPCG(1, 1)), lvl: levels["easy"]}
	s.Board[5][0], s.Board[5][1], s.Board[5][2] = you, you, you
	if c := s.botMove(); c != 3 {
		t.Fatalf("bot should block at 3, got %d", c)
	}
	s.Board[4][0], s.Board[4][1], s.Board[4][2] = bot, bot, bot
	if c := s.botMove(); c != 3 {
		t.Fatalf("bot should win at 3, got %d", c)
	}
}

func TestRandomPlayerLosesToHard(t *testing.T) {
	r := rand.New(rand.NewPCG(5, 5))
	losses := 0
	const games = 10
	for g := 0; g < games; g++ {
		sess, _ := Definition().New(game.Config{Difficulty: "hard", RNG: rand.New(rand.NewPCG(uint64(g), 2))})
		s := sess.(*session)
		for s.Result() == nil {
			col := r.IntN(Cols)
			b, _ := json.Marshal(map[string]any{"type": "drop", "col": col})
			_ = s.Act(time.Now(), b) // full columns are rejected; just retry
		}
		if s.Result().Outcome == game.Loss {
			losses++
		}
	}
	if losses < games-1 {
		t.Fatalf("hard bot lost or drew too often against random play: %d/%d losses", losses, games)
	}
}

func BenchmarkHardMove(b *testing.B) {
	var board Board
	board.drop(3, you)
	for i := 0; i < b.N; i++ {
		BestMove(&board, levels["hard"].depth)
	}
}
