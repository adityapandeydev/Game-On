package auth

import (
	"encoding/base64"
	"errors"
	"strings"
	"testing"
	"time"
)

func TestIssueVerifyRoundTrip(t *testing.T) {
	s := NewSigner([]byte("k"), time.Hour)
	tok, err := s.Issue(42)
	if err != nil {
		t.Fatal(err)
	}
	c, err := s.Verify(tok)
	if err != nil {
		t.Fatalf("verify: %v", err)
	}
	if id, _ := c.UserID(); id != 42 {
		t.Fatalf("user id = %d, want 42", id)
	}
}

func TestVerifyRejectsTampering(t *testing.T) {
	s := NewSigner([]byte("k"), time.Hour)
	tok, _ := s.Issue(1)
	parts := strings.Split(tok, ".")

	forged := base64.RawURLEncoding.EncodeToString([]byte(`{"sub":"2","iat":0,"exp":99999999999}`))
	noneHeader := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"none","typ":"JWT"}`))

	cases := map[string]string{
		"payload swap":  parts[0] + "." + forged + "." + parts[2],
		"alg none":      noneHeader + "." + parts[1] + ".",
		"other secret":  mustIssue(t, NewSigner([]byte("other"), time.Hour), 1),
		"extra segment": tok + ".x",
		"garbage":       "abc",
		"empty":         "",
		"truncated sig": tok[:len(tok)-2],
	}
	for name, bad := range cases {
		if _, err := s.Verify(bad); err == nil {
			t.Errorf("%s: expected rejection", name)
		}
	}
}

func TestVerifyExpired(t *testing.T) {
	s := NewSigner([]byte("k"), time.Minute)
	base := time.Unix(1_700_000_000, 0)
	s.now = func() time.Time { return base }
	tok, _ := s.Issue(1)
	s.now = func() time.Time { return base.Add(2 * time.Minute) }
	if _, err := s.Verify(tok); !errors.Is(err, ErrTokenExpired) {
		t.Fatalf("err = %v, want ErrTokenExpired", err)
	}
}

func mustIssue(t *testing.T, s *Signer, id int64) string {
	t.Helper()
	tok, err := s.Issue(id)
	if err != nil {
		t.Fatal(err)
	}
	return tok
}
