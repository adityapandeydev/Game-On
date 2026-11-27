// Package typestorm is a typing race timed by the server.
//
// The client uses a word-lock input (a mistake must be fixed before moving on),
// so a finished race always reproduces the passage exactly. On finish the
// client reports per-word timings and mistake counts; the server checks them
// against its own clock and plausibility limits, then computes speed and
// accuracy itself.
package typestorm

import (
	"encoding/json"
	"math"
	"strings"
	"time"

	"gameon/internal/game"
)

const (
	maxWPM       = 230                     // sustained speed above this is treated as automation
	minCharMs    = 25                      // no word may average faster than this per character
	minWPM       = 20                      // the time limit allows this speed, at least
	latencySlack = 1500 * time.Millisecond // network allowance on the total time
)

var bonus = map[string]float64{"easy": 1, "normal": 1.2, "hard": 1.5}

func Definition() game.Definition {
	return game.Definition{
		ID:           "typestorm",
		Difficulties: []string{"normal", "easy", "hard"},
		New: func(c game.Config) (game.Session, error) {
			list := passages[c.Difficulty]
			p := list[c.RNG.IntN(len(list))]
			limit := time.Duration(float64(len(p)) / 5 / minWPM * float64(time.Minute))
			limit = max(30*time.Second, limit.Round(time.Second))
			return &session{
				bonus: bonus[c.Difficulty], words: strings.Split(p, " "),
				Difficulty: c.Difficulty, Passage: p, Status: "ready",
				TimeLimitMs: int(limit / time.Millisecond), MistakeWords: []string{},
			}, nil
		},
	}
}

type session struct {
	bonus float64
	words []string
	start time.Time

	Difficulty   string   `json:"difficulty"`
	Passage      string   `json:"passage"`
	TimeLimitMs  int      `json:"timeLimitMs"`
	Status       string   `json:"status"` // "ready" | "typing" | "over"
	TimedOut     bool     `json:"timedOut"`
	WPM          float64  `json:"wpm"`
	Accuracy     float64  `json:"accuracy"` // 0-100
	ElapsedMs    int      `json:"elapsedMs"`
	MistakeWords []string `json:"mistakeWords"`
	Score        int      `json:"score"`

	result *game.Result
}

func (s *session) View() any {
	v := *s
	v.MistakeWords = append(s.MistakeWords[:0:0], s.MistakeWords...)
	return &v
}
func (s *session) Result() *game.Result { return s.result }

// WordStat is the client's report for one word, in passage order.
type WordStat struct {
	Ms       int `json:"ms"`       // time from finishing the previous word to finishing this one
	Mistakes int `json:"mistakes"` // wrong keystrokes in this word, including corrected ones
}

func (s *session) Act(now time.Time, raw json.RawMessage) error {
	var a struct {
		Type  string     `json:"type"`
		Words []WordStat `json:"words"`
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	switch a.Type {
	case "start":
		if s.Status != "ready" {
			return game.Reject("Already started")
		}
		s.Status, s.start = "typing", now
		return nil
	case "finish", "timeout":
	default:
		return game.Reject("Unknown action")
	}
	if s.Status != "typing" {
		return game.Reject("Start typing first")
	}

	elapsed := now.Sub(s.start)
	limit := time.Duration(s.TimeLimitMs) * time.Millisecond
	if a.Type == "timeout" {
		if elapsed < limit-latencySlack {
			return game.Reject("There is still time left")
		}
		s.timeout(elapsed)
		return nil
	}
	if elapsed > limit+latencySlack {
		s.timeout(elapsed)
		return nil
	}
	if len(a.Words) != len(s.words) {
		return game.Reject("Finish the passage first")
	}

	// The reported timings must add up to no more than the server-observed time
	// (the client can't have typed for longer than the race lasted), and each
	// word must be humanly possible.
	totalMs, mistakes := 0, 0
	seen := map[string]bool{}
	for i, w := range a.Words {
		chars := len(s.words[i])
		if i < len(s.words)-1 {
			chars++ // the trailing space
		}
		if w.Ms < minCharMs*chars || w.Mistakes < 0 || w.Mistakes > 100 {
			return game.Reject("That was faster than humanly plausible")
		}
		totalMs += w.Ms
		mistakes += w.Mistakes
		if w.Mistakes > 0 && !seen[s.words[i]] {
			seen[s.words[i]] = true
			s.MistakeWords = append(s.MistakeWords, strings.Trim(s.words[i], ".,;:!?\"'()"))
		}
	}
	if time.Duration(totalMs)*time.Millisecond > elapsed+latencySlack {
		return game.Reject("Timings don't match the race clock")
	}

	// Speed comes from the server clock, never from the client's timings.
	chars := len(s.Passage)
	minutes := elapsed.Minutes()
	wpm := float64(chars) / 5 / minutes
	if wpm > maxWPM {
		return game.Reject("That was faster than humanly plausible")
	}
	acc := float64(chars) / float64(chars+mistakes)

	s.Status = "over"
	s.WPM = math.Round(wpm*10) / 10
	s.Accuracy = math.Round(acc*1000) / 10
	s.ElapsedMs = int(elapsed.Milliseconds())
	s.Score = int(math.Round(wpm * acc * acc * s.bonus * 10))
	s.result = &game.Result{Outcome: game.Done, Score: s.Score}
	return nil
}

func (s *session) timeout(elapsed time.Duration) {
	s.Status, s.TimedOut = "over", true
	s.ElapsedMs = int(elapsed.Milliseconds())
	s.result = &game.Result{Outcome: game.Loss, Score: 0}
}
