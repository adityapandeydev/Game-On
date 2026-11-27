// Package httpx contains small net/http helpers: JSON encoding, typed API errors,
// request decoding and middleware.
package httpx

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net/http"
	"strconv"
)

// Error is an API error with an HTTP status and a stable machine-readable code.
type Error struct {
	Status  int               `json:"-"`
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Fields  map[string]string `json:"fields,omitempty"`
}

func (e *Error) Error() string { return e.Code + ": " + e.Message }

func NewError(status int, code, msg string) *Error {
	return &Error{Status: status, Code: code, Message: msg}
}

func BadRequest(msg string) *Error { return NewError(http.StatusBadRequest, "bad_request", msg) }
func NotFound(msg string) *Error   { return NewError(http.StatusNotFound, "not_found", msg) }
func Conflict(code, msg string) *Error {
	return NewError(http.StatusConflict, code, msg)
}
func Unauthorized(msg string) *Error {
	return NewError(http.StatusUnauthorized, "unauthorized", msg)
}

// Invalid returns a 422 carrying per-field validation messages.
func Invalid(fields map[string]string) *Error {
	return &Error{Status: http.StatusUnprocessableEntity, Code: "validation_failed", Message: "Some fields are invalid", Fields: fields}
}

// HandlerFunc is an http handler that may return an error; see Handle.
type HandlerFunc func(w http.ResponseWriter, r *http.Request) error

// Handle adapts a HandlerFunc, rendering returned errors as JSON. Non-API errors
// are logged and reported as a generic 500 so internals never leak.
func Handle(log *slog.Logger, h HandlerFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		err := h(w, r)
		if err == nil {
			return
		}
		var apiErr *Error
		if !errors.As(err, &apiErr) {
			log.ErrorContext(r.Context(), "request failed", "method", r.Method, "path", r.URL.Path, "err", err, "request_id", RequestID(r.Context()))
			apiErr = NewError(http.StatusInternalServerError, "internal", "Something went wrong on our side")
		}
		JSON(w, apiErr.Status, map[string]*Error{"error": apiErr})
	})
}

// JSON writes v as a JSON response with the given status.
func JSON(w http.ResponseWriter, status int, v any) {
	b, err := json.Marshal(v)
	if err != nil {
		http.Error(w, `{"error":{"code":"internal","message":"encoding failed"}}`, http.StatusInternalServerError)
		return
	}
	h := w.Header()
	h.Set("Content-Type", "application/json; charset=utf-8")
	h.Set("Content-Length", strconv.Itoa(len(b)))
	w.WriteHeader(status)
	_, _ = w.Write(b)
}

// NoContent writes a 204.
func NoContent(w http.ResponseWriter) { w.WriteHeader(http.StatusNoContent) }

const maxBodyBytes = 64 << 10

// Decode parses a JSON request body into dst, rejecting unknown fields,
// trailing data, wrong content types and bodies over 64 KiB.
func Decode(w http.ResponseWriter, r *http.Request, dst any) error {
	// Requiring application/json also blocks cross-site HTML form posts (CSRF).
	if mt, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type")); mt != "application/json" {
		return NewError(http.StatusUnsupportedMediaType, "unsupported_media_type", "Content-Type must be application/json")
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		var maxErr *http.MaxBytesError
		switch {
		case errors.As(err, &maxErr):
			return NewError(http.StatusRequestEntityTooLarge, "body_too_large", "Request body is too large")
		case errors.Is(err, io.EOF):
			return BadRequest("Request body is empty")
		default:
			return BadRequest(fmt.Sprintf("Malformed JSON: %v", err))
		}
	}
	if dec.More() {
		return BadRequest("Request body must contain a single JSON object")
	}
	return nil
}
