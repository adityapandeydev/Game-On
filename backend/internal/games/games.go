// Package games registers every playable game with the engine.
package games

import "gameon/internal/game"

// All returns the definitions of every game, in catalog order.
func All() []game.Definition {
	return []game.Definition{}
}
