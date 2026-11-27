package api

import (
	"errors"
	"net/http"
	"net/mail"
	"regexp"
	"strings"
	"unicode/utf8"

	"gameon/internal/auth"
	"gameon/internal/httpx"
	"gameon/internal/store"
)

var usernameRE = regexp.MustCompile(`^[A-Za-z0-9_-]{3,24}$`)

type publicUser struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	Email     string `json:"email"`
	CreatedAt string `json:"createdAt"`
}

func toPublic(u *store.User) publicUser {
	return publicUser{ID: u.ID, Username: u.Username, Email: u.Email, CreatedAt: u.CreatedAt.UTC().Format("2006-01-02T15:04:05Z")}
}

func (a *API) register(w http.ResponseWriter, r *http.Request) error {
	var in struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := httpx.Decode(w, r, &in); err != nil {
		return err
	}
	in.Username = strings.TrimSpace(in.Username)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))

	fields := map[string]string{}
	if !usernameRE.MatchString(in.Username) {
		fields["username"] = "3-24 characters: letters, numbers, - or _"
	}
	if addr, err := mail.ParseAddress(in.Email); err != nil || addr.Address != in.Email || len(in.Email) > 254 {
		fields["email"] = "Enter a valid email address"
	}
	switch {
	case utf8.RuneCountInString(in.Password) < 8:
		fields["password"] = "Use at least 8 characters"
	case len(in.Password) > auth.MaxPasswordBytes:
		fields["password"] = "Use at most 72 characters"
	}
	if len(fields) > 0 {
		return httpx.Invalid(fields)
	}

	hash, err := auth.HashPassword(in.Password)
	if err != nil {
		return err
	}
	u, err := a.Store.CreateUser(r.Context(), in.Username, in.Email, hash)
	switch {
	case errors.Is(err, store.ErrEmailTaken):
		return &httpx.Error{Status: http.StatusConflict, Code: "email_taken", Message: "That email is already registered", Fields: map[string]string{"email": "Already registered. Try signing in."}}
	case errors.Is(err, store.ErrUsernameTaken):
		return &httpx.Error{Status: http.StatusConflict, Code: "username_taken", Message: "That username is taken", Fields: map[string]string{"username": "Already taken"}}
	case err != nil:
		return err
	}
	return a.startSessionFor(w, u, http.StatusCreated)
}

func (a *API) login(w http.ResponseWriter, r *http.Request) error {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := httpx.Decode(w, r, &in); err != nil {
		return err
	}
	u, err := a.Store.UserByEmail(r.Context(), strings.TrimSpace(in.Email))
	hash := ""
	if err == nil {
		hash = u.PasswordHash
	} else if !errors.Is(err, store.ErrNotFound) {
		return err
	}
	// Always runs bcrypt, so unknown emails and wrong passwords take equally long.
	if auth.CheckPassword(hash, in.Password) != nil {
		return httpx.NewError(http.StatusUnauthorized, "invalid_credentials", "Email or password is incorrect")
	}
	return a.startSessionFor(w, u, http.StatusOK)
}

func (a *API) startSessionFor(w http.ResponseWriter, u *store.User, status int) error {
	tok, err := a.Sessions.Signer.Issue(u.ID)
	if err != nil {
		return err
	}
	a.Sessions.Set(w, tok)
	privateNoStore(w)
	httpx.JSON(w, status, map[string]any{"user": toPublic(u)})
	return nil
}

func (a *API) logout(w http.ResponseWriter, _ *http.Request) error {
	a.Sessions.Clear(w)
	httpx.NoContent(w)
	return nil
}

// me returns the signed-in user with per-game stats (which double as their
// recently-played list), or {"user": null} for guests.
func (a *API) me(w http.ResponseWriter, r *http.Request) error {
	privateNoStore(w)
	id := auth.UserID(r.Context())
	if id == 0 {
		httpx.JSON(w, http.StatusOK, map[string]any{"user": nil})
		return nil
	}
	u, err := a.Store.UserByID(r.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		// Token for a deleted account.
		a.Sessions.Clear(w)
		httpx.JSON(w, http.StatusOK, map[string]any{"user": nil})
		return nil
	}
	if err != nil {
		return err
	}
	stats, err := a.Store.UserStats(r.Context(), id)
	if err != nil {
		return err
	}
	if stats == nil {
		stats = []store.GameStats{}
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"user": toPublic(u), "stats": stats})
	return nil
}
