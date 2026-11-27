// Package sliding is the n-puzzle. Shuffles are produced by random legal moves
// from the solved state, so every board is solvable.
package sliding

import (
	"encoding/json"
	"math/rand/v2"
	"strconv"
	"time"

	"gameon/internal/game"
)

var ceilings = map[int]int{3: 1000, 4: 2500, 5: 5000}

func Definition() game.Definition {
	return game.Definition{
		ID:           "sliding-puzzle",
		Difficulties: []string{"3", "4", "5"},
		New: func(c game.Config) (game.Session, error) {
			n, _ := strconv.Atoi(c.Difficulty)
			return &session{Size: n, Tiles: Shuffle(n, c.RNG), Status: "playing", ceiling: ceilings[n]}, nil
		},
	}
}

// Shuffle returns a solvable, unsolved board of size n (0 is the gap).
func Shuffle(n int, rng *rand.Rand) []int {
	tiles := make([]int, n*n)
	for {
		for i := range tiles {
			tiles[i] = (i + 1) % (n * n)
		}
		gap, prev := n*n-1, -1
		for i := 0; i < 40*n*n; i++ {
			nb := neighbours(gap, n)
			next := nb[rng.IntN(len(nb))]
			if next == prev && len(nb) > 1 {
				continue
			}
			tiles[gap], tiles[next] = tiles[next], 0
			prev, gap = gap, next
		}
		if !solved(tiles) && misplaced(tiles) >= n*n/2 {
			return tiles
		}
	}
}

func neighbours(i, n int) []int {
	r, c := i/n, i%n
	out := make([]int, 0, 4)
	if r > 0 {
		out = append(out, i-n)
	}
	if r < n-1 {
		out = append(out, i+n)
	}
	if c > 0 {
		out = append(out, i-1)
	}
	if c < n-1 {
		out = append(out, i+1)
	}
	return out
}

func solved(t []int) bool {
	for i := 0; i < len(t)-1; i++ {
		if t[i] != i+1 {
			return false
		}
	}
	return true
}

func misplaced(t []int) int {
	n := 0
	for i, v := range t {
		if v != 0 && v != i+1 {
			n++
		}
	}
	return n
}

type session struct {
	ceiling int
	started time.Time

	Size    int    `json:"size"`
	Tiles   []int  `json:"tiles"`
	Moves   int    `json:"moves"`
	Elapsed int    `json:"elapsedMs"`
	Status  string `json:"status"` // "playing" | "solved"
	Score   int    `json:"score"`

	result *game.Result
}

func (s *session) View() any {
	v := *s
	v.Tiles = append(s.Tiles[:0:0], s.Tiles...)
	return &v
}
func (s *session) Result() *game.Result { return s.result }

func (s *session) Act(now time.Time, raw json.RawMessage) error {
	var a struct {
		Type  string `json:"type"`
		Tiles []int  `json:"tiles"` // tile values to slide, in order
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	if a.Type != "move" {
		return game.Reject("Unknown action")
	}
	if len(a.Tiles) == 0 || len(a.Tiles) > 64 {
		return game.Reject("Send between 1 and 64 tiles")
	}
	if s.started.IsZero() {
		s.started = now
	}
	// Validate the whole batch before applying any of it.
	next := append(s.Tiles[:0:0], s.Tiles...)
	for _, v := range a.Tiles {
		if !slide(next, s.Size, v) {
			return game.Reject("Tile %d is not next to the gap", v)
		}
	}
	s.Tiles = next
	s.Moves += len(a.Tiles)
	s.Elapsed = int(now.Sub(s.started).Milliseconds())
	if solved(s.Tiles) {
		s.Status = "solved"
		secs := s.Elapsed / 1000
		s.Score = max(s.ceiling/10, s.ceiling-5*s.Moves-2*secs)
		s.result = &game.Result{Outcome: game.Win, Score: s.Score}
	}
	return nil
}

// slide moves tile v into the adjacent gap, reporting whether it was legal.
func slide(t []int, n, v int) bool {
	gap, at := -1, -1
	for i, x := range t {
		if x == 0 {
			gap = i
		}
		if x == v {
			at = i
		}
	}
	if v == 0 || at < 0 {
		return false
	}
	for _, nb := range neighbours(gap, n) {
		if nb == at {
			t[gap], t[at] = v, 0
			return true
		}
	}
	return false
}
