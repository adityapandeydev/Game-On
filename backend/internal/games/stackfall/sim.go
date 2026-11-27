// Package stackfall is a falling-block game verified by deterministic replay.
//
// The browser runs this exact simulation at 60 ticks per second for smooth
// play and streams its input log to the server, which replays it to produce the
// authoritative score. The TypeScript twin lives at
// frontend/src/games/stackfall/sim.ts and MUST stay bit-for-bit identical; the
// fixture test in this package generates cases the frontend test replays.
//
// Rules (shared spec):
//   - Well: 10 columns x 22 rows; rows 0-1 are hidden spawn rows.
//   - RNG: mulberry32 over uint32, seeded with the session seed.
//   - Pieces come from a 7-bag of "IJLOSTZ", shuffled by Fisher-Yates
//     (i from 6 down to 1, j = rng() % (i+1)). The queue is refilled with a new
//     bag whenever it holds fewer than 7 pieces.
//   - Shapes are SRS spawn matrices; rotating clockwise maps
//     m'[r][c] = m[n-1-c][r]. Spawn at row 0, col (10-n)/2, rotation 0.
//   - Rotation kicks, tried in order as (dCol, dRow): (0,0) (-1,0) (1,0)
//     (0,-1) (-2,0) (2,0).
//   - Inputs: 1 left, 2 right, 3 rotate CW, 4 rotate CCW, 5 soft drop,
//     6 hard drop. Events for a tick are applied in order before gravity.
//   - Gravity: frames per row from gravityTable by level; level = lines/10+1.
//   - Lock delay: 30 ticks grounded. A successful move or rotation while the
//     lock timer is running resets it, at most 15 times per piece.
//   - Scoring: soft drop +1/row, hard drop +2/row; clears 100/300/500/800 x level
//     (level before the clear). Spawning into blocks, or locking a piece
//     entirely inside the hidden rows, ends the game.
package stackfall

const (
	Width       = 10
	Height      = 22
	Hidden      = 2
	TicksPerSec = 60
	lockDelay   = 30
	maxResets   = 15
)

const (
	InLeft = iota + 1
	InRight
	InRotateCW
	InRotateCCW
	InSoftDrop
	InHardDrop
)

const kinds = "IJLOSTZ"

var gravityTable = []int{48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1}

var clearPoints = [5]int{0, 100, 300, 500, 800}

var kicks = [6][2]int{{0, 0}, {-1, 0}, {1, 0}, {0, -1}, {-2, 0}, {2, 0}}

// shapes[kind][rotation] lists filled (row, col) offsets in row-major order.
var shapes = func() [7][4][][2]int {
	base := [7][][]int{
		{{0, 0, 0, 0}, {1, 1, 1, 1}, {0, 0, 0, 0}, {0, 0, 0, 0}}, // I
		{{1, 0, 0}, {1, 1, 1}, {0, 0, 0}},                        // J
		{{0, 0, 1}, {1, 1, 1}, {0, 0, 0}},                        // L
		{{1, 1}, {1, 1}},                                         // O
		{{0, 1, 1}, {1, 1, 0}, {0, 0, 0}},                        // S
		{{0, 1, 0}, {1, 1, 1}, {0, 0, 0}},                        // T
		{{1, 1, 0}, {0, 1, 1}, {0, 0, 0}},                        // Z
	}
	var out [7][4][][2]int
	for k, m := range base {
		for rot := 0; rot < 4; rot++ {
			var cells [][2]int
			for r := range m {
				for c := range m[r] {
					if m[r][c] == 1 {
						cells = append(cells, [2]int{r, c})
					}
				}
			}
			out[k][rot] = cells
			n := len(m)
			next := make([][]int, n)
			for r := 0; r < n; r++ {
				next[r] = make([]int, n)
				for c := 0; c < n; c++ {
					next[r][c] = m[n-1-c][r]
				}
			}
			m = next
		}
	}
	return out
}()

var boxSize = [7]int{4, 3, 3, 2, 3, 3, 3}

type Piece struct {
	Kind int `json:"kind"` // index into "IJLOSTZ"
	Rot  int `json:"rot"`
	Row  int `json:"row"`
	Col  int `json:"col"`
}

// Sim is the complete game state. All fields are exported so the server can
// send a full snapshot for client resync.
type Sim struct {
	Board   [Height][Width]int8 `json:"board"` // 0 empty, 1-7 = kind+1
	Piece   Piece               `json:"piece"`
	Queue   []int               `json:"queue"`
	RNG     uint32              `json:"rng"`
	Tick    int                 `json:"tick"`
	Score   int                 `json:"score"`
	Lines   int                 `json:"lines"`
	Over    bool                `json:"over"`
	Gravity int                 `json:"gravity"` // ticks since last gravity step
	Lock    int                 `json:"lock"`    // ticks spent grounded
	Resets  int                 `json:"resets"`
}

func NewSim(seed uint32) *Sim {
	s := &Sim{RNG: seed}
	s.refill()
	s.spawn()
	return s
}

func (s *Sim) Level() int { return s.Lines/10 + 1 }

func (s *Sim) gravityFrames() int {
	return gravityTable[min(s.Level(), len(gravityTable))-1]
}

func (s *Sim) next() uint32 {
	s.RNG += 0x6D2B79F5
	t := s.RNG
	t = (t ^ (t >> 15)) * (t | 1)
	t ^= t + (t^(t>>7))*(t|61)
	return t ^ (t >> 14)
}

func (s *Sim) refill() {
	for len(s.Queue) < 7 {
		bag := []int{0, 1, 2, 3, 4, 5, 6}
		for i := 6; i > 0; i-- {
			j := int(s.next() % uint32(i+1))
			bag[i], bag[j] = bag[j], bag[i]
		}
		s.Queue = append(s.Queue, bag...)
	}
}

func (s *Sim) spawn() {
	k := s.Queue[0]
	s.Queue = append(s.Queue[:0:0], s.Queue[1:]...)
	s.refill()
	s.Piece = Piece{Kind: k, Rot: 0, Row: 0, Col: (Width - boxSize[k]) / 2}
	s.Gravity, s.Lock, s.Resets = 0, 0, 0
	if s.collides(s.Piece) {
		s.Over = true
	}
}

func (s *Sim) collides(p Piece) bool {
	for _, c := range shapes[p.Kind][p.Rot] {
		r, col := p.Row+c[0], p.Col+c[1]
		if col < 0 || col >= Width || r < 0 || r >= Height || s.Board[r][col] != 0 {
			return true
		}
	}
	return false
}

func (s *Sim) try(p Piece) bool {
	if s.collides(p) {
		return false
	}
	s.Piece = p
	if s.Lock > 0 && s.Resets < maxResets {
		s.Lock = 0
		s.Resets++
	}
	return true
}

func (s *Sim) grounded() bool {
	p := s.Piece
	p.Row++
	return s.collides(p)
}

func (s *Sim) rotate(dir int) {
	p := s.Piece
	p.Rot = (p.Rot + dir + 4) % 4
	for _, k := range kicks {
		q := p
		q.Col += k[0]
		q.Row += k[1]
		if s.try(q) {
			return
		}
	}
}

// Apply performs one input event.
func (s *Sim) Apply(code int) {
	if s.Over {
		return
	}
	p := s.Piece
	switch code {
	case InLeft:
		p.Col--
		s.try(p)
	case InRight:
		p.Col++
		s.try(p)
	case InRotateCW:
		s.rotate(1)
	case InRotateCCW:
		s.rotate(-1)
	case InSoftDrop:
		p.Row++
		if !s.collides(p) {
			s.Piece = p
			s.Score++
			s.Gravity = 0
		}
	case InHardDrop:
		n := 0
		for {
			p.Row++
			if s.collides(p) {
				break
			}
			n++
		}
		s.Piece.Row += n
		s.Score += 2 * n
		s.lock()
	}
}

// Step advances one tick after applying that tick's events.
func (s *Sim) Step(events []int) {
	for _, e := range events {
		if s.Over {
			break
		}
		s.Apply(e)
	}
	if s.Over {
		return
	}
	s.Gravity++
	if s.Gravity >= s.gravityFrames() {
		s.Gravity = 0
		p := s.Piece
		p.Row++
		if !s.collides(p) {
			s.Piece = p
		}
	}
	if s.grounded() {
		s.Lock++
		if s.Lock >= lockDelay {
			s.lock()
		}
	} else {
		s.Lock = 0
	}
	s.Tick++
}

func (s *Sim) lock() {
	allHidden := true
	for _, c := range shapes[s.Piece.Kind][s.Piece.Rot] {
		r := s.Piece.Row + c[0]
		s.Board[r][s.Piece.Col+c[1]] = int8(s.Piece.Kind + 1)
		if r >= Hidden {
			allHidden = false
		}
	}
	if allHidden {
		s.Over = true
		return
	}

	level := s.Level()
	cleared := 0
	for r := Height - 1; r >= 0; r-- {
		full := true
		for c := 0; c < Width; c++ {
			if s.Board[r][c] == 0 {
				full = false
				break
			}
		}
		if !full {
			continue
		}
		cleared++
		for rr := r; rr > 0; rr-- {
			s.Board[rr] = s.Board[rr-1]
		}
		s.Board[0] = [Width]int8{}
		r++ // re-check the row that just moved down into r
	}
	if cleared > 0 {
		s.Lines += cleared
		s.Score += clearPoints[cleared] * level
	}
	s.spawn()
}
