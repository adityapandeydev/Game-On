package httpx

import (
	"compress/gzip"
	"io"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

var gzipPool = sync.Pool{New: func() any {
	w, _ := gzip.NewWriterLevel(io.Discard, gzip.BestSpeed)
	return w
}}

type gzipWriter struct {
	http.ResponseWriter
	gz          *gzip.Writer
	decided     bool
	compressing bool
}

const minGzipSize = 1024

func (g *gzipWriter) WriteHeader(code int) {
	if !g.decided {
		g.decide(code, nil)
	}
	g.ResponseWriter.WriteHeader(code)
}

// decide compresses JSON responses unless they are known to be tiny.
func (g *gzipWriter) decide(code int, first []byte) {
	g.decided = true
	h := g.ResponseWriter.Header()
	if code == http.StatusNoContent || code == http.StatusNotModified || h.Get("Content-Encoding") != "" {
		return
	}
	if !strings.HasPrefix(h.Get("Content-Type"), "application/json") {
		return
	}
	if n, err := strconv.Atoi(h.Get("Content-Length")); err == nil && n < minGzipSize {
		return
	}
	if first != nil && len(first) < minGzipSize {
		return
	}
	g.compressing = true
	h.Set("Content-Encoding", "gzip")
	h.Del("Content-Length")
	g.gz = gzipPool.Get().(*gzip.Writer)
	g.gz.Reset(g.ResponseWriter)
}

func (g *gzipWriter) Write(b []byte) (int, error) {
	if !g.decided {
		g.decide(http.StatusOK, b)
	}
	if g.compressing {
		return g.gz.Write(b)
	}
	return g.ResponseWriter.Write(b)
}

func (g *gzipWriter) Unwrap() http.ResponseWriter { return g.ResponseWriter }

func (g *gzipWriter) close() {
	if g.gz != nil {
		_ = g.gz.Close()
		gzipPool.Put(g.gz)
	}
}

// Gzip compresses JSON API responses. Static files are served precompressed by
// the web package instead, so they skip this path.
func Gzip(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Accept-Encoding")
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
			next.ServeHTTP(w, r)
			return
		}
		gw := &gzipWriter{ResponseWriter: w}
		defer gw.close()
		next.ServeHTTP(gw, r)
	})
}
