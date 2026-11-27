// Package dropfour is a four-in-a-row game on a 7x6 grid against a negamax bot
// with alpha-beta pruning.
package dropfour

import (
	"encoding/json"
	"math/rand/v2"
	"time"

	"gameon/internal/game"
)

const (
	Cols  = 7
	Rows  = 6
	empty = 0
	you   = 1
	bot   = 2
)

type level struct {
	depth  int
	random float64 // chance of a random (non-losing-in-one) move
	base   int
}

var levels = map[string]level{
	"easy":   {depth: 2, random: 0.35, base: 200},
	"normal": {depth: 4, random: 0.05, base: 500},
	"hard":   {depth: 7, random: 0, base: 1000},
}

// Board is row-major with row 0 at the top.
type Board [Rows][Cols]int8

type Move struct {
	Player int `json:"player"`
	Col    int `json:"col"`
	Row    int `json:"row"`
}

func Definition() game.Definition {
	return game.Definition{
		ID:           "drop-four",
		Difficulties: []string{"normal", "easy", "hard"},
		New: func(c game.Config) (game.Session, error) {
			return &session{rng: c.RNG, lvl: levels[c.Difficulty], Difficulty: c.Difficulty, Status: "your-turn"}, nil
		},
	}
}

type session struct {
	rng *rand.Rand
	lvl level

	Difficulty string `json:"difficulty"`
	Board      Board  `json:"board"`
	// Moves made by this action, in order (for drop animations).
	Moves   []Move   `json:"moves"`
	Status  string   `json:"status"` // "your-turn" | "over"
	Winner  int      `json:"winner,omitempty"`
	WinLine [][2]int `json:"winLine,omitempty"` // [row, col] pairs
	Turns   int      `json:"turns"`             // discs you have dropped
	Score   int      `json:"score"`

	result *game.Result
}

func (s *session) View() any            { v := *s; return &v }
func (s *session) Result() *game.Result { return s.result }

func (s *session) Act(_ time.Time, raw json.RawMessage) error {
	var a struct {
		Type string `json:"type"`
		Col  *int   `json:"col"`
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	switch a.Type {
	case "drop":
	case "resign":
		s.Moves = nil
		s.end(bot)
		return nil
	default:
		return game.Reject("Unknown action")
	}
	if s.Status != "your-turn" {
		return game.Reject("Not your turn")
	}
	if a.Col == nil || *a.Col < 0 || *a.Col >= Cols {
		return game.Reject("Pick a column from 0 to 6")
	}
	row := s.Board.drop(*a.Col, you)
	if row < 0 {
		return game.Reject("That column is full")
	}
	s.Turns++
	s.Moves = []Move{{Player: you, Col: *a.Col, Row: row}}
	if s.checkEnd(row, *a.Col, you) {
		return nil
	}

	col := s.botMove()
	brow := s.Board.drop(col, bot)
	s.Moves = append(s.Moves, Move{Player: bot, Col: col, Row: brow})
	s.checkEnd(brow, col, bot)
	return nil
}

func (s *session) checkEnd(row, col, p int) bool {
	if line := s.Board.lineThrough(row, col, int8(p)); line != nil {
		s.WinLine = line
		s.end(p)
		return true
	}
	if s.Board.full() {
		s.end(empty)
		return true
	}
	return false
}

func (s *session) end(winner int) {
	s.Status, s.Winner = "over", winner
	switch winner {
	case you:
		// Faster wins earn up to +50%.
		speed := max(0, 21-s.Turns) * s.lvl.base / 42
		s.Score = s.lvl.base + speed
		s.result = &game.Result{Outcome: game.Win, Score: s.Score}
	case bot:
		s.result = &game.Result{Outcome: game.Loss, Score: 0}
	default:
		s.Score = s.lvl.base / 4
		s.result = &game.Result{Outcome: game.Draw, Score: s.Score}
	}
}

// botMove picks the bot's column.
func (s *session) botMove() int {
	b := &s.Board
	// Always take an immediate win and block an immediate loss, at any level.
	for _, p := range [2]int8{bot, you} {
		for c := 0; c < Cols; c++ {
			if r := b.drop(c, int(p)); r >= 0 {
				won := b.lineThrough(r, c, p) != nil
				b[r][c] = empty
				if won {
					return c
				}
			}
		}
	}
	if s.rng.Float64() < s.lvl.random {
		var options []int
		for c := 0; c < Cols; c++ {
			if b[0][c] == empty {
				options = append(options, c)
			}
		}
		return options[s.rng.IntN(len(options))]
	}
	return BestMove(b, s.lvl.depth)
}

var order = [Cols]int{3, 2, 4, 1, 5, 0, 6} // centre first improves pruning

// BestMove searches depth plies for the bot.
func BestMove(b *Board, depth int) int {
	best, bestScore := -1, -1<<30
	alpha, beta := -1<<30, 1<<30
	for _, c := range order {
		r := b.drop(c, bot)
		if r < 0 {
			continue
		}
		var sc int
		if b.lineThrough(r, c, bot) != nil {
			sc = winScore + depth
		} else {
			sc = -negamax(b, depth-1, -beta, -alpha, you)
		}
		b[r][c] = empty
		if sc > bestScore || best < 0 {
			best, bestScore = c, sc
		}
		alpha = max(alpha, sc)
	}
	return best
}

const winScore = 1_000_000

func negamax(b *Board, depth, alpha, beta int, p int8) int {
	if b.full() {
		return 0
	}
	if depth == 0 {
		return b.evaluate(p)
	}
	best := -1 << 30
	for _, c := range order {
		r := b.drop(c, int(p))
		if r < 0 {
			continue
		}
		var sc int
		if b.lineThrough(r, c, p) != nil {
			sc = winScore + depth
		} else {
			sc = -negamax(b, depth-1, -beta, -alpha, 3-p)
		}
		b[r][c] = empty
		best = max(best, sc)
		alpha = max(alpha, sc)
		if alpha >= beta {
			break
		}
	}
	return best
}

// evaluate scores every four-cell window from p's perspective.
func (b *Board) evaluate(p int8) int {
	opp := 3 - p
	score := 0
	for r := 0; r < Rows; r++ {
		if b[r][3] == p {
			score += 3
		} else if b[r][3] == opp {
			score -= 3
		}
	}
	window := func(r, c, dr, dc int) {
		var mine, theirs int
		for i := 0; i < 4; i++ {
			switch b[r+dr*i][c+dc*i] {
			case p:
				mine++
			case opp:
				theirs++
			}
		}
		switch {
		case theirs == 0 && mine == 3:
			score += 50
		case theirs == 0 && mine == 2:
			score += 5
		case mine == 0 && theirs == 3:
			score -= 60
		case mine == 0 && theirs == 2:
			score -= 5
		}
	}
	for r := 0; r < Rows; r++ {
		for c := 0; c < Cols; c++ {
			if c+3 < Cols {
				window(r, c, 0, 1)
			}
			if r+3 < Rows {
				window(r, c, 1, 0)
				if c+3 < Cols {
					window(r, c, 1, 1)
				}
				if c-3 >= 0 {
					window(r, c, 1, -1)
				}
			}
		}
	}
	return score
}

// drop places p in col and returns the row, or -1 if the column is full.
func (b *Board) drop(col, p int) int {
	for r := Rows - 1; r >= 0; r-- {
		if b[r][col] == empty {
			b[r][col] = int8(p)
			return r
		}
	}
	return -1
}

func (b *Board) full() bool {
	for c := 0; c < Cols; c++ {
		if b[0][c] == empty {
			return false
		}
	}
	return true
}

// lineThrough returns the cells of a four-or-longer line through (row, col).
func (b *Board) lineThrough(row, col int, p int8) [][2]int {
	for _, d := range [4][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}} {
		cells := [][2]int{{row, col}}
		for _, sign := range [2]int{1, -1} {
			r, c := row+d[0]*sign, col+d[1]*sign
			for r >= 0 && r < Rows && c >= 0 && c < Cols && b[r][c] == p {
				cells = append(cells, [2]int{r, c})
				r, c = r+d[0]*sign, c+d[1]*sign
			}
		}
		if len(cells) >= 4 {
			return cells
		}
	}
	return nil
}
