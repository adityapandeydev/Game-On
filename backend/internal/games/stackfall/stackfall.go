package stackfall

import (
	"encoding/json"
	"time"

	"gameon/internal/game"
)

const (
	maxBatchEvents = 4000
	maxBatchTicks  = 2 * 60 * TicksPerSec
	clockSlack     = 2 * TicksPerSec // ticks of allowance for latency and jitter
)

func Definition() game.Definition {
	return game.Definition{
		ID: "stackfall",
		New: func(c game.Config) (game.Session, error) {
			return &session{sim: NewSim(c.Seed), Status: "ready"}, nil
		},
	}
}

type session struct {
	sim   *Sim
	start time.Time

	Status string `json:"status"` // "ready" | "playing" | "over"

	result *game.Result
}

type view struct {
	Status string `json:"status"`
	Level  int    `json:"level"`
	*Sim
}

func (s *session) View() any {
	cp := *s.sim
	cp.Queue = append([]int(nil), s.sim.Queue[:min(5, len(s.sim.Queue))]...)
	return view{Status: s.Status, Level: cp.Level(), Sim: &cp}
}

func (s *session) Result() *game.Result { return s.result }

func (s *session) Act(now time.Time, raw json.RawMessage) error {
	var a struct {
		Type   string   `json:"type"`
		UpTo   int      `json:"upTo"`   // simulate through this tick (exclusive)
		Events [][2]int `json:"events"` // [tick, input] pairs, ticks non-decreasing
	}
	if err := game.DecodeAction(raw, &a); err != nil {
		return err
	}
	switch a.Type {
	case "start":
		if s.Status != "ready" {
			return game.Reject("Already started")
		}
		s.Status, s.start = "playing", now
		return nil
	case "inputs", "end":
	default:
		return game.Reject("Unknown action")
	}
	if s.Status != "playing" {
		return game.Reject("The game has not started")
	}

	sim := s.sim
	if a.UpTo < sim.Tick {
		return game.Reject("Inputs are behind the server")
	}
	if a.UpTo-sim.Tick > maxBatchTicks || len(a.Events) > maxBatchEvents {
		return game.Reject("Input batch too large")
	}
	// The client cannot have played more ticks than real time allows. Pausing
	// only makes the client fall behind, which is fine.
	allowed := int(now.Sub(s.start).Seconds()*TicksPerSec) + clockSlack
	if a.UpTo > allowed {
		return game.Reject("Inputs are ahead of the clock")
	}
	prev := sim.Tick
	for _, e := range a.Events {
		if e[0] < prev || e[0] >= a.UpTo || e[1] < InLeft || e[1] > InHardDrop {
			return game.Reject("Malformed input log")
		}
		prev = e[0]
	}

	i := 0
	var tickEvents []int
	for sim.Tick < a.UpTo && !sim.Over {
		tickEvents = tickEvents[:0]
		for i < len(a.Events) && a.Events[i][0] == sim.Tick {
			tickEvents = append(tickEvents, a.Events[i][1])
			i++
		}
		sim.Step(tickEvents)
	}

	if sim.Over || a.Type == "end" {
		s.Status = "over"
		sim.Over = true
		s.result = &game.Result{Outcome: game.Done, Score: sim.Score}
	}
	return nil
}
