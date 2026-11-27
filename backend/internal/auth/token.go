// Package auth issues and verifies session tokens and hashes passwords.
package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"
)

// Tokens are compact HS256 JWTs. Only this exact header is accepted, which rules
// out algorithm-confusion attacks ("none", RS256-with-HMAC-key, ...).
const jwtHeader = `{"alg":"HS256","typ":"JWT"}`

var encodedHeader = base64.RawURLEncoding.EncodeToString([]byte(jwtHeader))

var (
	ErrTokenInvalid = errors.New("invalid token")
	ErrTokenExpired = errors.New("token expired")
)

type Claims struct {
	Subject  string `json:"sub"`
	IssuedAt int64  `json:"iat"`
	Expires  int64  `json:"exp"`
}

// UserID returns the numeric subject.
func (c Claims) UserID() (int64, error) {
	id, err := strconv.ParseInt(c.Subject, 10, 64)
	if err != nil || id <= 0 {
		return 0, ErrTokenInvalid
	}
	return id, nil
}

type Signer struct {
	secret []byte
	ttl    time.Duration
	now    func() time.Time
}

func NewSigner(secret []byte, ttl time.Duration) *Signer {
	return &Signer{secret: secret, ttl: ttl, now: time.Now}
}

func (s *Signer) TTL() time.Duration { return s.ttl }

func (s *Signer) Issue(userID int64) (string, error) {
	now := s.now()
	payload, err := json.Marshal(Claims{
		Subject:  strconv.FormatInt(userID, 10),
		IssuedAt: now.Unix(),
		Expires:  now.Add(s.ttl).Unix(),
	})
	if err != nil {
		return "", err
	}
	unsigned := encodedHeader + "." + base64.RawURLEncoding.EncodeToString(payload)
	return unsigned + "." + s.sign(unsigned), nil
}

func (s *Signer) Verify(token string) (Claims, error) {
	var c Claims
	header, rest, ok := strings.Cut(token, ".")
	if !ok || header != encodedHeader {
		return c, ErrTokenInvalid
	}
	payload, sig, ok := strings.Cut(rest, ".")
	if !ok || strings.Contains(sig, ".") {
		return c, ErrTokenInvalid
	}
	want := s.sign(header + "." + payload)
	if !hmac.Equal([]byte(sig), []byte(want)) {
		return c, ErrTokenInvalid
	}
	raw, err := base64.RawURLEncoding.DecodeString(payload)
	if err != nil {
		return c, ErrTokenInvalid
	}
	if err := json.Unmarshal(raw, &c); err != nil {
		return c, ErrTokenInvalid
	}
	if c.Expires == 0 || s.now().Unix() >= c.Expires {
		return c, ErrTokenExpired
	}
	return c, nil
}

func (s *Signer) sign(unsigned string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(unsigned))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
