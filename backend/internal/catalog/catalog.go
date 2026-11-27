// Package catalog is the single source of truth for the games on the platform.
// The frontend renders entirely from this data, served at GET /api/games.
package catalog

type Genre string

const (
	GenreStrategy Genre = "strategy"
	GenrePuzzle   Genre = "puzzle"
	GenreArcade   Genre = "arcade"
	GenreBrain    Genre = "brain"
)

type Option struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Hint  string `json:"hint,omitempty"`
}

type Step struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

type Game struct {
	ID           string   `json:"id"`
	Title        string   `json:"title"`
	Tagline      string   `json:"tagline"`
	Description  string   `json:"description"`
	Genre        Genre    `json:"genre"`
	Mode         string   `json:"mode"`    // "vs-bot" | "solo"
	Minutes      int      `json:"minutes"` // typical session length
	Accent       string   `json:"accent"`  // design-token name, not a colour value
	Controls     []string `json:"controls"`
	HowTo        []Step   `json:"howTo"`
	Difficulties []Option `json:"difficulties,omitempty"`
	Scoring      string   `json:"scoring"`
}

var difficulty3 = []Option{
	{ID: "easy", Label: "Easy"},
	{ID: "normal", Label: "Normal"},
	{ID: "hard", Label: "Hard"},
}

// Games in display order.
var Games = []Game{
	{
		ID: "stackfall", Title: "Stackfall", Genre: GenreArcade, Mode: "solo", Minutes: 6, Accent: "lime",
		Tagline:     "Stack falling blocks, clear lines, chase the speed curve.",
		Description: "Seven shapes fall into a ten-wide well. Fill a row to clear it. Every ten lines the drop speeds up, and clearing several rows at once pays far more than one at a time.",
		Controls:    []string{"Left / Right to move", "Up or X to rotate", "Down to soft drop", "Space to hard drop", "P to pause"},
		HowTo: []Step{
			{"Guide the piece", "Move and rotate the falling shape to fit the gaps."},
			{"Fill a row", "A complete row clears and drops everything above it."},
			{"Go big", "Clear four rows with one piece for the biggest payout."},
		},
		Scoring: "100 / 300 / 500 / 800 points for 1-4 lines, multiplied by level. Hard drops add 2 per row.",
	},
	{
		ID: "drop-four", Title: "Drop Four", Genre: GenreStrategy, Mode: "vs-bot", Minutes: 4, Accent: "coral",
		Tagline:     "Line up four discs before the bot does.",
		Description: "Take turns dropping discs into a seven-column grid. Four in a row in any direction wins. The bot searches several moves ahead, so plan your traps.",
		Controls:    []string{"Click a column or press 1-7 to drop"},
		HowTo: []Step{
			{"Drop a disc", "Discs fall to the lowest open slot in a column."},
			{"Connect four", "Horizontal, vertical or diagonal all count."},
			{"Block and fork", "Threaten two lines at once and the bot can only stop one."},
		},
		Difficulties: difficulty3,
		Scoring:      "Wins score by difficulty and speed. Consecutive wins in a run build a streak bonus.",
	},
	{
		ID: "tic-tac-toe", Title: "Tic-Tac-Toe", Genre: GenreStrategy, Mode: "vs-bot", Minutes: 2, Accent: "sky",
		Tagline:     "The classic three-in-a-row, against a bot that rarely blinks.",
		Description: "Play rounds against the bot. On Hard it plays perfectly, so a draw is a respectable result and a win means it slipped.",
		Controls:    []string{"Click a square or press 1-9"},
		HowTo: []Step{
			{"Take a square", "You are X and move first unless you choose otherwise."},
			{"Three in a row", "Rows, columns and diagonals all win."},
			{"Keep the run alive", "Your run continues until you lose a round."},
		},
		Difficulties: difficulty3,
		Scoring:      "Each round won adds points that grow with your streak; draws add a little. The run ends on a loss.",
	},
	{
		ID: "sliding-puzzle", Title: "Slide", Genre: GenrePuzzle, Mode: "solo", Minutes: 3, Accent: "violet",
		Tagline:     "Slide numbered tiles back into order.",
		Description: "A shuffled grid with one gap. Slide tiles into the gap until the numbers read in order. Every shuffle is guaranteed solvable.",
		Controls:    []string{"Click a tile next to the gap", "Arrow keys slide toward the gap"},
		HowTo: []Step{
			{"Find the gap", "Only tiles touching the empty square can move."},
			{"Work in layers", "Solve the top row first, then the next, then the rest."},
			{"Fewer moves wins", "Score drops with every move and second spent."},
		},
		Difficulties: []Option{{ID: "3", Label: "3 x 3"}, {ID: "4", Label: "4 x 4"}, {ID: "5", Label: "5 x 5"}},
		Scoring:      "Starts high and drains with moves and time. Bigger grids have a higher ceiling.",
	},
	{
		ID: "typestorm", Title: "TypeStorm", Genre: GenreBrain, Mode: "solo", Minutes: 1, Accent: "amber",
		Tagline:     "Type the passage fast and clean.",
		Description: "A passage appears; the clock starts on your first key. Speed matters, but every mistake costs accuracy and accuracy multiplies your score.",
		Controls:    []string{"Just type", "Backspace fixes mistakes"},
		HowTo: []Step{
			{"Start typing", "The timer begins with your first keystroke."},
			{"Stay accurate", "Errors are tracked even if you fix them."},
			{"Finish the passage", "Your speed and accuracy are verified on the server."},
		},
		Difficulties: []Option{{ID: "easy", Label: "Short", Hint: "Common words"}, {ID: "normal", Label: "Medium"}, {ID: "hard", Label: "Long", Hint: "Punctuation and numbers"}},
		Scoring:      "Words per minute multiplied by accuracy, with a bonus for longer passages.",
	},
	{
		ID: "geo-quest", Title: "Geo Quest", Genre: GenreBrain, Mode: "solo", Minutes: 2, Accent: "teal",
		Tagline:     "Name the capital. Ten countries, no second chances.",
		Description: "Ten countries drawn from around the world, four choices each. Answer quickly for a time bonus.",
		Controls:    []string{"Click an answer or press 1-4"},
		HowTo: []Step{
			{"Read the country", "Pick its capital from four options."},
			{"Be quick", "Faster correct answers earn more."},
			{"Ten rounds", "Your total after ten questions is your score."},
		},
		Difficulties: difficulty3,
		Scoring:      "100 per correct answer plus up to 50 for speed.",
	},
	{
		ID: "quantum-guess", Title: "Quantum Guess", Genre: GenreBrain, Mode: "solo", Minutes: 1, Accent: "pink",
		Tagline:     "Sixty seconds of mental maths.",
		Description: "Solve as many sums as you can before the clock runs out. Correct answers build a combo; a wrong one breaks it.",
		Controls:    []string{"Type the answer and press Enter"},
		HowTo: []Step{
			{"Solve", "Each question is a quick calculation."},
			{"Build a combo", "Consecutive correct answers multiply your points."},
			{"Beat the clock", "The round ends at sixty seconds."},
		},
		Difficulties: difficulty3,
		Scoring:      "10 points per correct answer, multiplied by your combo (up to 5x).",
	},
	{
		ID: "guess-number", Title: "Guess the Number", Genre: GenreBrain, Mode: "solo", Minutes: 1, Accent: "indigo",
		Tagline:     "Higher or lower, in as few guesses as possible.",
		Description: "The server picks a secret number. Each guess tells you higher or lower. Narrow it down before you run out of guesses.",
		Controls:    []string{"Type a number and press Enter"},
		HowTo: []Step{
			{"Guess", "Enter any number in range."},
			{"Follow the hint", "You will hear higher or lower."},
			{"Halve it", "Splitting the range in half every time is the fastest way in."},
		},
		Difficulties: []Option{{ID: "easy", Label: "1-50"}, {ID: "normal", Label: "1-100"}, {ID: "hard", Label: "1-1000"}},
		Scoring:      "Fewer guesses score more. Larger ranges are worth more.",
	},
	{
		ID: "pig", Title: "Pig", Genre: GenreStrategy, Mode: "vs-bot", Minutes: 3, Accent: "rose",
		Tagline:     "Push your luck with the dice. Roll a one and lose the turn.",
		Description: "Roll to build a turn total, then hold to bank it. Roll a one and the turn total is lost. First to 100 wins against a bot that knows the odds.",
		Controls:    []string{"R to roll", "H to hold"},
		HowTo: []Step{
			{"Roll", "Each roll adds to your turn total."},
			{"Hold", "Bank the turn total into your score."},
			{"Avoid the one", "A one wipes the turn total and passes the dice."},
		},
		Scoring: "A win scores 100 plus your winning margin.",
	},
}

var byID = func() map[string]*Game {
	m := make(map[string]*Game, len(Games))
	for i := range Games {
		m[Games[i].ID] = &Games[i]
	}
	return m
}()

// Lookup returns the game with id, if it exists.
func Lookup(id string) (*Game, bool) {
	g, ok := byID[id]
	return g, ok
}

// Exists reports whether id is a known game (or the "platform" review target).
func Exists(id string) bool {
	_, ok := byID[id]
	return ok
}
