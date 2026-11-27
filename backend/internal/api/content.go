package api

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

	"gameon/internal/catalog"
	"gameon/internal/httpx"
	"gameon/internal/store"
)

func itoa(n int) string { return strconv.Itoa(n) }

type gameCard struct {
	*catalog.Game
	PlaysWeek  int     `json:"playsWeek"`
	PlaysTotal int     `json:"playsTotal"`
	Rating     float64 `json:"rating"`
	Reviews    int     `json:"reviews"`
}

// gameCards merges static catalog data with live popularity and ratings.
func (a *API) gameCards(ctx context.Context) ([]gameCard, error) {
	return store.Get(ctx, a.cache, "games", func(ctx context.Context) ([]gameCard, error) {
		pop, err := a.Store.Popularity(ctx)
		if err != nil {
			return nil, err
		}
		ratings, err := a.Store.RatingSummaries(ctx)
		if err != nil {
			return nil, err
		}
		cards := make([]gameCard, len(catalog.Games))
		idx := make(map[string]*gameCard, len(cards))
		for i := range catalog.Games {
			cards[i] = gameCard{Game: &catalog.Games[i]}
			idx[cards[i].ID] = &cards[i]
		}
		for _, p := range pop {
			if c, ok := idx[p.GameID]; ok {
				c.PlaysWeek, c.PlaysTotal = p.PlaysWeek, p.PlaysTotal
			}
		}
		for _, rs := range ratings {
			if c, ok := idx[rs.GameID]; ok {
				c.Rating, c.Reviews = rs.Average, rs.Count
			}
		}
		return cards, nil
	})
}

func (a *API) listGames(w http.ResponseWriter, r *http.Request) error {
	cards, err := a.gameCards(r.Context())
	if err != nil {
		return err
	}
	publicCache(w, 15)
	httpx.JSON(w, http.StatusOK, map[string]any{"games": cards})
	return nil
}

func (a *API) getGame(w http.ResponseWriter, r *http.Request) error {
	id := r.PathValue("id")
	cards, err := a.gameCards(r.Context())
	if err != nil {
		return err
	}
	for i := range cards {
		if cards[i].ID == id {
			publicCache(w, 15)
			httpx.JSON(w, http.StatusOK, cards[i])
			return nil
		}
	}
	return httpx.NotFound("No such game")
}

const boardSize = 50

func (a *API) gameBoard(w http.ResponseWriter, r *http.Request) error {
	id := r.PathValue("gameId")
	if !catalog.Exists(id) {
		return httpx.NotFound("No such game")
	}
	entries, err := store.Get(r.Context(), a.cache, "board:"+id, func(ctx context.Context) ([]store.BoardEntry, error) {
		return a.Store.GameBoard(ctx, id, boardSize)
	})
	if err != nil {
		return err
	}
	publicCache(w, 5)
	httpx.JSON(w, http.StatusOK, map[string]any{"gameId": id, "entries": nonNil(entries)})
	return nil
}

func (a *API) globalBoard(w http.ResponseWriter, r *http.Request) error {
	entries, err := store.Get(r.Context(), a.cache, "board:global", func(ctx context.Context) ([]store.BoardEntry, error) {
		return a.Store.GlobalBoard(ctx, boardSize)
	})
	if err != nil {
		return err
	}
	publicCache(w, 5)
	httpx.JSON(w, http.StatusOK, map[string]any{"entries": nonNil(entries)})
	return nil
}

const reviewPage = 20

func (a *API) listReviews(w http.ResponseWriter, r *http.Request) error {
	q := r.URL.Query()
	gameID := q.Get("game")
	if gameID != "" && gameID != "platform" && !catalog.Exists(gameID) {
		return httpx.NotFound("No such game")
	}
	var before int64
	if s := q.Get("before"); s != "" {
		v, err := strconv.ParseInt(s, 10, 64)
		if err != nil || v <= 0 {
			return httpx.BadRequest("before must be a positive review id")
		}
		before = v
	}

	load := func(ctx context.Context) ([]store.Review, error) {
		return a.Store.Reviews(ctx, gameID, before, reviewPage+1)
	}
	var list []store.Review
	var err error
	if before == 0 {
		// Only first pages are cached, which keeps the key space bounded.
		list, err = store.Get(r.Context(), a.cache, "reviews:"+gameID, load)
	} else {
		list, err = load(r.Context())
	}
	if err != nil {
		return err
	}
	var next *int64
	if len(list) > reviewPage {
		list = list[:reviewPage]
		next = &list[reviewPage-1].ID
	}
	publicCache(w, 5)
	httpx.JSON(w, http.StatusOK, map[string]any{"reviews": nonNil(list), "next": next})
	return nil
}

func (a *API) upsertReview(w http.ResponseWriter, r *http.Request) error {
	uid, err := requireUser(r)
	if err != nil {
		return err
	}
	var in struct {
		GameID string `json:"gameId"`
		Rating int    `json:"rating"`
		Body   string `json:"body"`
	}
	if err := httpx.Decode(w, r, &in); err != nil {
		return err
	}
	in.Body = strings.TrimSpace(in.Body)
	fields := map[string]string{}
	if in.GameID != "platform" && !catalog.Exists(in.GameID) {
		fields["gameId"] = "Pick a game"
	}
	if in.Rating < 1 || in.Rating > 5 {
		fields["rating"] = "Choose 1 to 5 stars"
	}
	if n := utf8.RuneCountInString(in.Body); n < 1 || n > 1000 {
		fields["body"] = "Write between 1 and 1000 characters"
	}
	if len(fields) > 0 {
		return httpx.Invalid(fields)
	}
	rv, err := a.Store.UpsertReview(r.Context(), uid, in.GameID, in.Rating, in.Body)
	if err != nil {
		return err
	}
	a.cache.Invalidate("reviews:")
	a.cache.Invalidate("games")
	httpx.JSON(w, http.StatusOK, rv)
	return nil
}

func (a *API) deleteReview(w http.ResponseWriter, r *http.Request) error {
	uid, err := requireUser(r)
	if err != nil {
		return err
	}
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		return httpx.BadRequest("Invalid review id")
	}
	if err := a.Store.DeleteReview(r.Context(), uid, id); errors.Is(err, store.ErrNotFound) {
		// Same answer whether it doesn't exist or isn't yours.
		return httpx.NotFound("Review not found")
	} else if err != nil {
		return err
	}
	a.cache.Invalidate("reviews:")
	a.cache.Invalidate("games")
	httpx.NoContent(w)
	return nil
}

func nonNil[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}
