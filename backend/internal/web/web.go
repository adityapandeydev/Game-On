// Package web serves the built single-page app: hashed assets with immutable
// caching, precompressed .br/.gz variants when present, and index.html for any
// client-side route.
package web

import (
	"io/fs"
	"mime"
	"net/http"
	"path"
	"strings"
)

func init() {
	// Windows registries sometimes map these wrongly; pin them.
	_ = mime.AddExtensionType(".js", "text/javascript; charset=utf-8")
	_ = mime.AddExtensionType(".css", "text/css; charset=utf-8")
	_ = mime.AddExtensionType(".svg", "image/svg+xml")
	_ = mime.AddExtensionType(".woff2", "font/woff2")
	_ = mime.AddExtensionType(".webmanifest", "application/manifest+json")
}

type handler struct {
	files fs.FS
}

// Handler serves files from root (normally the Vite dist directory).
func Handler(root fs.FS) http.Handler {
	return &handler{files: root}
}

func (h *handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		w.Header().Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
	if name == "" {
		name = "index.html"
	}

	info, err := fs.Stat(h.files, name)
	if err != nil || info.IsDir() {
		// Unknown paths with a file extension are genuine 404s; anything else is a
		// client-side route and gets the app shell.
		if path.Ext(name) != "" {
			http.NotFound(w, r)
			return
		}
		name = "index.html"
	}

	hdr := w.Header()
	switch {
	case name == "index.html":
		// The shell must revalidate so new deploys are picked up immediately.
		hdr.Set("Cache-Control", "no-cache")
	case strings.HasPrefix(name, "assets/"):
		// Vite fingerprints everything under assets/, so it never changes.
		hdr.Set("Cache-Control", "public, max-age=31536000, immutable")
	default:
		hdr.Set("Cache-Control", "public, max-age=3600")
	}
	h.serve(w, r, name)
}

// serve writes name, preferring a precompressed sibling the client accepts.
func (h *handler) serve(w http.ResponseWriter, r *http.Request, name string) {
	ctype := mime.TypeByExtension(path.Ext(name))
	if ctype == "" {
		ctype = "application/octet-stream"
	}
	w.Header().Set("Content-Type", ctype)
	w.Header().Add("Vary", "Accept-Encoding")

	accept := r.Header.Get("Accept-Encoding")
	for _, enc := range []struct{ token, ext string }{{"br", ".br"}, {"gzip", ".gz"}} {
		if !strings.Contains(accept, enc.token) {
			continue
		}
		if f, err := h.files.Open(name + enc.ext); err == nil {
			defer f.Close()
			if st, err := f.Stat(); err == nil {
				if rs, ok := f.(readSeeker); ok {
					w.Header().Set("Content-Encoding", enc.token)
					http.ServeContent(w, r, name, st.ModTime(), rs)
					return
				}
			}
		}
	}

	f, err := h.files.Open(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	st, err := f.Stat()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	rs, ok := f.(readSeeker)
	if !ok {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}
	http.ServeContent(w, r, name, st.ModTime(), rs)
}

type readSeeker interface {
	Read([]byte) (int, error)
	Seek(int64, int) (int64, error)
}
