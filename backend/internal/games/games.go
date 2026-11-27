// Package games registers every playable game with the engine.
package games

import (
	"gameon/internal/game"
	"gameon/internal/games/dropfour"
	"gameon/internal/games/geoquest"
	"gameon/internal/games/guessnumber"
	"gameon/internal/games/pig"
	"gameon/internal/games/quantum"
	"gameon/internal/games/sliding"
	"gameon/internal/games/stackfall"
	"gameon/internal/games/tictactoe"
	"gameon/internal/games/typestorm"
)

// All returns the definitions of every game.
func All() []game.Definition {
	return []game.Definition{
		stackfall.Definition(),
		dropfour.Definition(),
		tictactoe.Definition(),
		sliding.Definition(),
		typestorm.Definition(),
		geoquest.Definition(),
		quantum.Definition(),
		guessnumber.Definition(),
		pig.Definition(),
	}
}
