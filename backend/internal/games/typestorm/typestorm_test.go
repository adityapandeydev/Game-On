package typestorm

import (
	"encoding/json"
	"math/rand/v2"
	"strings"
	"testing"
	"time"

	"gameon/internal/game"
)

func newSession(t *testing.T) *session {
	t.Helper()
	s, _ := Definition().New(game.Config{Difficulty: "normal", RNG: rand.New(rand.NewPCG(1, 1))})
	return s.(*session)
}

func finish(s *session, at time.Time, msPerChar, mistakes int) error {
	var words []WordStat
	parts := strings.Split(s.Passage, " ")
	for i, w := range parts {
		n := len(w)
		if i < len(parts)-1 {
			n++
		}
		words = append(words, WordStat{Ms: n * msPerChar, Mistakes: mistakes})
	}
	b, _ := json.Marshal(map[string]any{"type": "finish", "words": words})
	return s.Act(at, b)
}

func start(s *session, t0 time.Time) { _ = s.Act(t0, json.RawMessage(`{"type":"start"}`)) }

func TestHonestRace(t *testing.T) {
	s := newSession(t)
	t0 := time.Unix(0, 0)
	start(s, t0)
	// 200 ms per character = 60 WPM.
	end := t0.Add(time.Duration(len(s.Passage)*200) * time.Millisecond)
	if err := finish(s, end, 200, 0); err != nil {
		t.Fatal(err)
	}
	if s.WPM < 59 || s.WPM > 61 || s.Accuracy != 100 {
		t.Fatalf("wpm %.1f acc %.1f", s.WPM, s.Accuracy)
	}
}

func TestRejectsImpossibleSpeed(t *testing.T) {
	s := newSession(t)
	t0 := time.Unix(0, 0)
	start(s, t0)
	if err := finish(s, t0.Add(2*time.Second), 10, 0); err != nil || s.Rejected == "" || s.Result().Score != 0 {
		t.Fatal("bot-speed race accepted")
	}
}

func TestRejectsTimingsLongerThanRace(t *testing.T) {
	s := newSession(t)
	t0 := time.Unix(0, 0)
	start(s, t0)
	if err := finish(s, t0.Add(5*time.Second), 200, 0); err != nil || s.Rejected == "" {
		t.Fatal("inflated timings accepted")
	}
}

func TestMistakesLowerAccuracyAndListWords(t *testing.T) {
	s := newSession(t)
	t0 := time.Unix(0, 0)
	start(s, t0)
	end := t0.Add(time.Duration(len(s.Passage)*200) * time.Millisecond)
	if err := finish(s, end, 200, 1); err != nil {
		t.Fatal(err)
	}
	if s.Accuracy >= 100 || s.Accuracy <= 0 || len(s.MistakeWords) == 0 {
		t.Fatalf("acc %.1f words %v", s.Accuracy, s.MistakeWords)
	}
}

func TestTimeLimitFromMinimumSpeed(t *testing.T) {
	s := newSession(t)
	want := float64(len(s.Passage)) / 5 / minWPM * 60_000
	if got := float64(s.TimeLimitMs); got < want-1000 || got > want+1000 {
		t.Fatalf("limit %v ms, want about %v", got, want)
	}
}
