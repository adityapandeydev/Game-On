package stackfall

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"math/rand/v2"
	"os"
	"path/filepath"
	"testing"
	"time"

	"gameon/internal/game"
)

func TestBagHasEveryPiece(t *testing.T) {
	s := NewSim(12345)
	seen := map[int]int{s.Piece.Kind: 1}
	for _, k := range s.Queue[:6] {
		seen[k]++
	}
	if len(seen) != 7 {
		t.Fatalf("first bag not a permutation: %v", seen)
	}
}

func TestRotationsAreFourCells(t *testing.T) {
	for k := range shapes {
		for r := range shapes[k] {
			if len(shapes[k][r]) != 4 {
				t.Fatalf("%c rot %d has %d cells", kinds[k], r, len(shapes[k][r]))
			}
		}
	}
}

func TestLineClearScoring(t *testing.T) {
	s := NewSim(1)
	for c := 0; c < Width; c++ {
		if c < 3 || c > 6 {
			s.Board[Height-1][c] = 1
		}
	}
	s.Piece = Piece{Kind: 0, Rot: 0, Row: 0, Col: 3} // I, flat, fills cols 3-6
	s.Apply(InHardDrop)
	if s.Lines != 1 {
		t.Fatalf("lines = %d", s.Lines)
	}
	if s.Score != 100+2*(Height-2) {
		t.Fatalf("score = %d", s.Score)
	}
}

func TestIdleGameTopsOut(t *testing.T) {
	s := NewSim(7)
	for i := 0; i < 200_000 && !s.Over; i++ {
		s.Step(nil)
	}
	if !s.Over {
		t.Fatal("idle game never ended")
	}
}

// randomInputs builds a plausible human-ish input log.
func randomInputs(r *rand.Rand, ticks int) [][2]int {
	var ev [][2]int
	for t := 0; t < ticks; t++ {
		if r.IntN(6) == 0 {
			ev = append(ev, [2]int{t, 1 + r.IntN(5)})
		}
		if r.IntN(70) == 0 {
			ev = append(ev, [2]int{t, InHardDrop})
		}
	}
	return ev
}

// botInputs plays a greedy placement bot so fixtures exercise line clears,
// levels and fast gravity. Each move is spread over a few ticks, like a human.
func botInputs(seed uint32, ticks int, r *rand.Rand) [][2]int {
	s := NewSim(seed)
	var ev [][2]int
	var plan []int
	var buf []int
	for s.Tick < ticks && !s.Over {
		buf = buf[:0]
		if len(plan) == 0 && s.Piece.Row <= 1 {
			plan = planPiece(s)
		}
		if len(plan) > 0 && s.Tick%(2+r.IntN(3)) == 0 {
			buf = append(buf, plan[0])
			ev = append(ev, [2]int{s.Tick, plan[0]})
			plan = plan[1:]
		}
		s.Step(buf)
	}
	return ev
}

func planPiece(s *Sim) []int {
	best, bestScore := []int{InHardDrop}, 1<<30
	for rot := 0; rot < 4; rot++ {
		for col := -2; col < Width; col++ {
			p := s.Piece
			p.Rot, p.Col = rot, col
			if s.collides(p) {
				continue
			}
			for {
				p.Row++
				if s.collides(p) {
					p.Row--
					break
				}
			}
			sc := placementCost(s, p)
			if sc < bestScore {
				var plan []int
				for i := 0; i < rot; i++ {
					plan = append(plan, InRotateCW)
				}
				d := col - s.Piece.Col
				for ; d < 0; d++ {
					plan = append(plan, InLeft)
				}
				for ; d > 0; d-- {
					plan = append(plan, InRight)
				}
				best, bestScore = append(plan, InHardDrop), sc
			}
		}
	}
	return best
}

func placementCost(s *Sim, p Piece) int {
	b := s.Board
	for _, c := range shapes[p.Kind][p.Rot] {
		b[p.Row+c[0]][p.Col+c[1]] = 1
	}
	cost := 0
	for c := 0; c < Width; c++ {
		seen := false
		for r := 0; r < Height; r++ {
			if b[r][c] != 0 {
				if !seen {
					cost += (Height - r) * 3 // column height
				}
				seen = true
			} else if seen {
				cost += 40 // hole
			}
		}
	}
	for r := 0; r < Height; r++ {
		full := true
		for c := 0; c < Width; c++ {
			full = full && b[r][c] != 0
		}
		if full {
			cost -= 120
		}
	}
	return cost
}

func replay(seed uint32, ticks int, ev [][2]int) *Sim {
	s := NewSim(seed)
	i := 0
	var buf []int
	for s.Tick < ticks && !s.Over {
		buf = buf[:0]
		for i < len(ev) && ev[i][0] == s.Tick {
			buf = append(buf, ev[i][1])
			i++
		}
		s.Step(buf)
	}
	return s
}

func boardHash(s *Sim) string {
	b, _ := json.Marshal(s.Board)
	h := sha256.Sum256(b)
	return hex.EncodeToString(h[:8])
}

type fixture struct {
	Seed   uint32   `json:"seed"`
	Ticks  int      `json:"ticks"`
	Events [][2]int `json:"events"`
	Want   struct {
		Tick  int    `json:"tick"`
		Score int    `json:"score"`
		Lines int    `json:"lines"`
		Over  bool   `json:"over"`
		Piece Piece  `json:"piece"`
		Board string `json:"board"` // rows joined, one char per cell
	} `json:"want"`
}

func boardString(s *Sim) string {
	out := make([]byte, 0, Height*Width)
	for r := 0; r < Height; r++ {
		for c := 0; c < Width; c++ {
			out = append(out, '0'+byte(s.Board[r][c]))
		}
	}
	return string(out)
}

// TestFixtures pins the simulation's behaviour. Regenerate with
// UPDATE_FIXTURES=1 go test ./internal/games/stackfall after an intentional
// rule change; the frontend replays the same file to prove its port matches.
func TestFixtures(t *testing.T) {
	path := filepath.Join("..", "..", "..", "..", "frontend", "src", "games", "stackfall", "fixtures.json")
	if os.Getenv("UPDATE_FIXTURES") == "1" {
		r := rand.New(rand.NewPCG(2026, 11))
		var fx []fixture
		for i := 0; i < 24; i++ {
			f := fixture{Seed: r.Uint32(), Ticks: 600 + r.IntN(9000)}
			if i%4 == 0 {
				f.Events = randomInputs(r, f.Ticks)
			} else {
				f.Ticks = 3000 + r.IntN(30000)
				f.Events = botInputs(f.Seed, f.Ticks, r)
			}
			s := replay(f.Seed, f.Ticks, f.Events)
			f.Want.Tick, f.Want.Score, f.Want.Lines, f.Want.Over, f.Want.Piece = s.Tick, s.Score, s.Lines, s.Over, s.Piece
			f.Want.Board = boardString(s)
			fx = append(fx, f)
		}
		b, _ := json.Marshal(fx)
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(path, b, 0o644); err != nil {
			t.Fatal(err)
		}
	}
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read fixtures (regenerate with UPDATE_FIXTURES=1): %v", err)
	}
	var fx []fixture
	if err := json.Unmarshal(b, &fx); err != nil {
		t.Fatal(err)
	}
	for i, f := range fx {
		s := replay(f.Seed, f.Ticks, f.Events)
		if s.Score != f.Want.Score || s.Lines != f.Want.Lines || s.Tick != f.Want.Tick || boardString(s) != f.Want.Board {
			t.Errorf("fixture %d diverged: score %d/%d lines %d/%d", i, s.Score, f.Want.Score, s.Lines, f.Want.Lines)
		}
	}
}

func TestSessionRejectsClockCheating(t *testing.T) {
	sess, _ := Definition().New(game.Config{Seed: 99})
	t0 := time.Unix(0, 0)
	_ = sess.Act(t0, json.RawMessage(`{"type":"start"}`))
	// 10 s of play claimed after only 1 s.
	if err := sess.Act(t0.Add(time.Second), json.RawMessage(`{"type":"inputs","upTo":600,"events":[]}`)); !game.IsActionError(err) {
		t.Fatal("fast-forward accepted")
	}
	if err := sess.Act(t0.Add(time.Second), json.RawMessage(`{"type":"inputs","upTo":60,"events":[[5,9]]}`)); !game.IsActionError(err) {
		t.Fatal("bad input code accepted")
	}
	if err := sess.Act(t0.Add(time.Second), json.RawMessage(`{"type":"inputs","upTo":60,"events":[[10,1],[5,1]]}`)); !game.IsActionError(err) {
		t.Fatal("out-of-order events accepted")
	}
	if err := sess.Act(t0.Add(time.Second), json.RawMessage(`{"type":"inputs","upTo":60,"events":[[5,1],[5,6]]}`)); err != nil {
		t.Fatal(err)
	}
}

func TestSessionMatchesReplay(t *testing.T) {
	r := rand.New(rand.NewPCG(3, 3))
	ev := randomInputs(r, 3000)
	want := replay(42, 3000, ev)

	sess, _ := Definition().New(game.Config{Seed: 42})
	t0 := time.Unix(0, 0)
	_ = sess.Act(t0, json.RawMessage(`{"type":"start"}`))
	// Stream it in one-second batches, as the client does.
	for from := 0; from < 3000 && sess.Result() == nil; from += 60 {
		var batch [][2]int
		for _, e := range ev {
			if e[0] >= from && e[0] < from+60 {
				batch = append(batch, e)
			}
		}
		b, _ := json.Marshal(map[string]any{"type": "inputs", "upTo": from + 60, "events": batch})
		if err := sess.Act(t0.Add(time.Duration(from+60)*time.Second/60), b); err != nil {
			t.Fatal(err)
		}
	}
	got := sess.(*session).sim
	if got.Score != want.Score || boardHash(got) != boardHash(want) {
		t.Fatalf("streamed %d vs replay %d", got.Score, want.Score)
	}
}
