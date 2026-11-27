package auth

import (
	"context"
	"net/http"
	"time"
)

const CookieName = "gameon_session"

type ctxKey struct{}

// UserID returns the authenticated user's ID, or 0 for guests.
func UserID(ctx context.Context) int64 {
	id, _ := ctx.Value(ctxKey{}).(int64)
	return id
}

// WithUserID returns ctx carrying the authenticated user ID (useful in tests).
func WithUserID(ctx context.Context, id int64) context.Context {
	return context.WithValue(ctx, ctxKey{}, id)
}

// Sessions reads and writes the HttpOnly session cookie. Keeping the token out
// of JavaScript removes the XSS token-theft risk that localStorage had.
type Sessions struct {
	Signer *Signer
	Secure bool
}

// Middleware attaches the user ID when a valid session cookie is present.
// It never rejects; handlers that need a user call Require.
func (s *Sessions) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if c, err := r.Cookie(CookieName); err == nil && c.Value != "" {
			if claims, err := s.Signer.Verify(c.Value); err == nil {
				if id, err := claims.UserID(); err == nil {
					r = r.WithContext(WithUserID(r.Context(), id))
				}
			} else {
				s.Clear(w)
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Sessions) Set(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   int(s.Signer.TTL() / time.Second),
		HttpOnly: true,
		Secure:   s.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}

func (s *Sessions) Clear(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     CookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   s.Secure,
		SameSite: http.SameSiteLaxMode,
	})
}
