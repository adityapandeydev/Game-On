// Package tictactoe is a run of up to ten rounds against a minimax bot.
// The player is X. Starting turns alternate each round. A loss ends the run;
// the player may also cash out between rounds.
package tictactoe

import (
	"encoding/json"
	"math/rand/v2"
	"time"

	"gameon/internal/game"
)

const (
	maxRounds = 10
	you       = 'X'
	bot       = 'O'
)

var lines = [8][3]int{
	{0, 1, 2}, {3, 4, 5}, {6, 7, 8},
	{0, 3, 6}, {1, 4, 7}, {2, 5, 8},
	{0, 4, 8}, {2, 4, 6},
}

type level struct {
	blunder float64 // chance the bot plays a random move
	mult    float64
}

var levels = map[string]level{
	"easy":   {blunder: 0.55, mult: 0.5},
	"normal": {blunder: 0.2, mult: 1},
	"hard":   {blunder: 0, mult: 2},
}

func Definition() game.Definition {
	return game.Definition{
		ID:           "tic-tac-toe",
		Difficulties: []string{"normal", "easy", "hard"},
		New: func(c game.Config) (game.Session, error) {
			s := &session{rng: c.RNG, lvl: levels[c.Difficulty], Difficulty: c.Difficulty}
			s.startRound()
			return s, nil
		},
	}
}

type session struct {
	rng *rand.Rand
	lvl level

	Difficulty string    `json:"difficulty"`
	Board      [9]string `json:"board"`
	Round      int       `json:"round"`
	MaxRounds  int       `json:"maxRounds"`
	Streak     int       `json:"streak"`
	Score      int       `json:"score"`
	Wins       int       `json:"wins"`
	Draws      int       `json:"draws"`
	// Status: "your-turn" | "round-over" | "over"
	Status     string `json:"status"`
	RoundEnd   string `json:"roundEnd,omitempty"` // "win" | "loss" | "draw"
	RoundPts   int    `json:"roundPoints,omitempty"`
	WinLine    []int  `json:"winLine,omitempty"`
	BotMove    *int   `json:"botMove,omitempty"`
	YouStarted bool   `json:"youStarted"`

	result *game.Result
}

func (s *session) View() any            { v := *s; return &v }
func (s *session) Result() *game.Result { return s.result }

func (s *session) startRound() {
	s.Round++
	s.MaxRounds = maxRounds
	s.Board = [9]string{}
	s.RoundEnd, s.RoundPts, s.WinLine, s.BotMove = "", 0, nil, nil
	s.YouStarted = s.Round%2 == 1
	s.Status = "your-turn"
	if !s.YouStarted {
		s.botPlay()
	}
}

func (s *session) Act(_ time.Time, raw json.RawMessage) error {
	var a struct {
		Type string `json:"type"`
		Cell *int   `json:"cell"`
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	switch a.Type {
	case "move":
		if s.Status != "your-turn" {
			return game.Reject("Not your turn")
		}
		if a.Cell == nil || *a.Cell < 0 || *a.Cell > 8 {
			return game.Reject("Pick a square from 0 to 8")
		}
		if s.Board[*a.Cell] != "" {
			return game.Reject("That square is taken")
		}
		s.BotMove = nil
		s.Board[*a.Cell] = string(you)
		if s.settle() {
			return nil
		}
		s.botPlay()
		s.settle()
	case "next":
		if s.Status != "round-over" {
			return game.Reject("The round is still going")
		}
		s.startRound()
	case "cashout":
		if s.Status != "round-over" {
			return game.Reject("Finish the round first")
		}
		s.finish(false)
	default:
		return game.Reject("Unknown action")
	}
	return nil
}

// settle checks for the end of a round and applies scoring. It reports whether
// the round ended.
func (s *session) settle() bool {
	if line, ok := winner(s.Board, you); ok {
		s.WinLine = line[:]
		s.RoundPts = int(float64(100*(4+s.Streak)/4) * s.lvl.mult) // +25% per streak step
		s.Streak++
		s.Wins++
		s.endRound("win")
		return true
	}
	if line, ok := winner(s.Board, bot); ok {
		s.WinLine = line[:]
		s.RoundPts = 0
		s.endRound("loss")
		s.finish(true)
		return true
	}
	if full(s.Board) {
		s.RoundPts = int(30 * s.lvl.mult)
		s.Draws++
		s.endRound("draw")
		return true
	}
	return false
}

func (s *session) endRound(how string) {
	s.RoundEnd = how
	s.Score += s.RoundPts
	s.Status = "round-over"
	if how != "loss" && s.Round >= maxRounds {
		s.finish(false)
	}
}

func (s *session) finish(lost bool) {
	s.Status = "over"
	outcome := game.Draw
	switch {
	case lost:
		outcome = game.Loss
	case s.Wins > 0:
		outcome = game.Win
	}
	s.result = &game.Result{Outcome: outcome, Score: s.Score}
}

func (s *session) botPlay() {
	var empty []int
	for i, c := range s.Board {
		if c == "" {
			empty = append(empty, i)
		}
	}
	if len(empty) == 0 {
		return
	}
	move := empty[s.rng.IntN(len(empty))]
	if s.rng.Float64() >= s.lvl.blunder {
		move = BestMove(s.Board, bot)
	}
	s.Board[move] = string(bot)
	s.BotMove = &move
}

// BestMove returns a perfect move for mark using minimax, preferring faster wins.
func BestMove(b [9]string, mark rune) int {
	best, bestScore := -1, -100
	for i := range b {
		if b[i] != "" {
			continue
		}
		b[i] = string(mark)
		sc := -negamax(b, other(mark), 1)
		b[i] = ""
		if sc > bestScore {
			best, bestScore = i, sc
		}
	}
	return best
}

func negamax(b [9]string, mark rune, depth int) int {
	if _, ok := winner(b, other(mark)); ok {
		return depth - 10 // the previous mover won; sooner is worse for us
	}
	if full(b) {
		return 0
	}
	best := -100
	for i := range b {
		if b[i] != "" {
			continue
		}
		b[i] = string(mark)
		best = max(best, -negamax(b, other(mark), depth+1))
		b[i] = ""
	}
	return best
}

func other(m rune) rune {
	if m == you {
		return bot
	}
	return you
}

func winner(b [9]string, m rune) ([3]int, bool) {
	s := string(m)
	for _, l := range lines {
		if b[l[0]] == s && b[l[1]] == s && b[l[2]] == s {
			return l, true
		}
	}
	return [3]int{}, false
}

func full(b [9]string) bool {
	for _, c := range b {
		if c == "" {
			return false
		}
	}
	return true
}
