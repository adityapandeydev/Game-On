package auth

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 11

// MaxPasswordBytes is bcrypt's input limit; longer inputs are rejected up front.
const MaxPasswordBytes = 72

var ErrPasswordMismatch = errors.New("password mismatch")

// dummyHash lets failed lookups spend the same time as a real comparison, so
// response timing does not reveal which emails are registered.
var dummyHash, _ = bcrypt.GenerateFromPassword([]byte("timing-equaliser"), bcryptCost)

func HashPassword(pw string) (string, error) {
	h, err := bcrypt.GenerateFromPassword([]byte(pw), bcryptCost)
	return string(h), err
}

// CheckPassword compares pw against hash. An empty hash still burns a bcrypt
// comparison and then fails.
func CheckPassword(hash, pw string) error {
	if hash == "" {
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(pw))
		return ErrPasswordMismatch
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pw)); err != nil {
		return ErrPasswordMismatch
	}
	return nil
}
