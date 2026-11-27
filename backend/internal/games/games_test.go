package games

import (
	"slices"
	"testing"

	"gameon/internal/catalog"
)

// Every catalog entry must be playable and its difficulty ids must match the engine's.
func TestCatalogMatchesEngine(t *testing.T) {
	defs := map[string][]string{}
	for _, d := range All() {
		defs[d.ID] = d.Difficulties
	}
	if len(defs) != len(catalog.Games) {
		t.Fatalf("%d engine games vs %d catalog games", len(defs), len(catalog.Games))
	}
	for _, g := range catalog.Games {
		engine, ok := defs[g.ID]
		if !ok {
			t.Fatalf("catalog game %q has no engine", g.ID)
		}
		var ids []string
		for _, o := range g.Difficulties {
			ids = append(ids, o.ID)
		}
		a, b := slices.Clone(ids), slices.Clone(engine)
		slices.Sort(a)
		slices.Sort(b)
		if !slices.Equal(a, b) {
			t.Errorf("%s: catalog difficulties %v, engine %v", g.ID, ids, engine)
		}
	}
}
