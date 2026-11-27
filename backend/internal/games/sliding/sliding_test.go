package sliding

import (
	"encoding/json"
	"math/rand/v2"
	"testing"
	"time"

	"gameon/internal/game"
)

// solvable checks the inversion-parity rule for n-puzzles.
func solvable(t []int, n int) bool {
	inv, gapRow := 0, 0
	for i := range t {
		if t[i] == 0 {
			gapRow = i / n
			continue
		}
		for j := i + 1; j < len(t); j++ {
			if t[j] != 0 && t[j] < t[i] {
				inv++
			}
		}
	}
	if n%2 == 1 {
		return inv%2 == 0
	}
	return (inv+(n-1-gapRow))%2 == 0
}

func TestShufflesAreSolvable(t *testing.T) {
	for _, n := range []int{3, 4, 5} {
		for seed := uint64(0); seed < 100; seed++ {
			tiles := Shuffle(n, rand.New(rand.NewPCG(seed, uint64(n))))
			if !solvable(tiles, n) || solved(tiles) {
				t.Fatalf("n=%d seed=%d: bad shuffle %v", n, seed, tiles)
			}
		}
	}
}

func TestMovesAndSolve(t *testing.T) {
	s := &session{Size: 3, Tiles: []int{1, 2, 3, 4, 5, 6, 7, 0, 8}, Status: "playing", ceiling: 1000}
	if err := s.Act(time.Now(), json.RawMessage(`{"type":"move","tiles":[1]}`)); !game.IsActionError(err) {
		t.Fatal("non-adjacent move accepted")
	}
	if err := s.Act(time.Now(), json.RawMessage(`{"type":"move","tiles":[8]}`)); err != nil {
		t.Fatal(err)
	}
	if s.Result() == nil || s.Result().Score <= 0 {
		t.Fatal("solve not detected")
	}
}
