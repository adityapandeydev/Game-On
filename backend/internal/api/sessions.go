package api

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"gameon/internal/auth"
	"gameon/internal/game"
	"gameon/internal/httpx"
	"gameon/internal/store"
)

type sessionResponse struct {
	ID     string              `json:"id"`
	GameID string              `json:"gameId"`
	Seed   uint32              `json:"seed"`
	State  any                 `json:"state"`
	Result *game.Result        `json:"result,omitempty"`
	Record *store.RecordResult `json:"record,omitempty"`
	// Saved says whether the result counts toward stats (false for guests).
	Saved bool `json:"saved"`
}

func (a *API) respondSession(w http.ResponseWriter, status int, e *game.Entry, rec *store.RecordResult) {
	view, res := a.Games.Snapshot(e)
	privateNoStore(w)
	httpx.JSON(w, status, sessionResponse{
		ID: e.ID, GameID: e.GameID, Seed: e.Seed, State: view, Result: res, Record: rec,
		Saved: e.OwnerID != 0,
	})
}

func (a *API) startSession(w http.ResponseWriter, r *http.Request) error {
	gameID := r.PathValue("id")
	if !a.Games.Has(gameID) {
		return httpx.NotFound("No such game")
	}
	var in struct {
		Difficulty string `json:"difficulty"`
	}
	if r.ContentLength != 0 {
		if err := httpx.Decode(w, r, &in); err != nil {
			return err
		}
	}
	owner := auth.UserID(r.Context())
	e, err := a.Games.Start(gameID, owner, in.Difficulty)
	switch {
	case errors.Is(err, game.ErrUnknownDifficulty):
		return httpx.Invalid(map[string]string{"difficulty": "Unknown difficulty"})
	case errors.Is(err, game.ErrCapacity):
		return httpx.NewError(http.StatusServiceUnavailable, "busy", "The arcade is full right now, try again in a minute")
	case err != nil:
		return err
	}

	a.Plays.Add(gameID)
	if owner != 0 {
		// Recently-played bookkeeping must not slow the start of a game.
		go func() {
			ctx, cancel := context.WithTimeout(context.WithoutCancel(r.Context()), 3*time.Second)
			defer cancel()
			if err := a.Store.RecordPlay(ctx, owner, gameID); err != nil {
				a.Log.Warn("record play", "err", err)
			}
		}()
	}
	a.respondSession(w, http.StatusCreated, e, nil)
	return nil
}

func (a *API) entry(r *http.Request) (*game.Entry, error) {
	e, err := a.Games.Get(r.PathValue("sid"), auth.UserID(r.Context()))
	if err != nil {
		return nil, httpx.NewError(http.StatusNotFound, "session_gone", "This game session has ended or expired")
	}
	return e, nil
}

func (a *API) getSession(w http.ResponseWriter, r *http.Request) error {
	e, err := a.entry(r)
	if err != nil {
		return err
	}
	a.respondSession(w, http.StatusOK, e, nil)
	return nil
}

const maxActionBytes = 256 << 10 // Stackfall input logs can be a few KB

func (a *API) sessionAction(w http.ResponseWriter, r *http.Request) error {
	e, err := a.entry(r)
	if err != nil {
		return err
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxActionBytes))
	if err != nil {
		return httpx.NewError(http.StatusRequestEntityTooLarge, "body_too_large", "Action is too large")
	}
	if !json.Valid(body) {
		return httpx.BadRequest("Malformed action")
	}

	var rec *store.RecordResult
	err = a.Games.Act(e, body, func(res *game.Result) error {
		if e.OwnerID == 0 {
			return nil
		}
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		out, err := a.Store.RecordResult(ctx, e.OwnerID, e.GameID, res.Score, store.Outcome(res.Outcome))
		if err != nil {
			return err
		}
		rec = out
		a.cache.Invalidate("board:")
		return nil
	})
	if err != nil {
		if game.IsActionError(err) {
			return httpx.NewError(http.StatusUnprocessableEntity, "invalid_move", err.Error())
		}
		return err
	}
	a.respondSession(w, http.StatusOK, e, rec)
	return nil
}

func (a *API) abandonSession(w http.ResponseWriter, r *http.Request) error {
	a.Games.Remove(r.PathValue("sid"), auth.UserID(r.Context()))
	httpx.NoContent(w)
	return nil
}
