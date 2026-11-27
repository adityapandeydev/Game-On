# syntax=docker/dockerfile:1.7

# ---- web: build the SPA ----
FROM oven/bun:1.3-alpine AS web
WORKDIR /src/frontend
COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

# ---- api: build a static Go binary ----
FROM golang:1.27-alpine AS api
WORKDIR /src/backend
COPY backend/go.mod backend/go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod go mod download
COPY backend/ ./
ARG TARGETOS TARGETARCH
RUN --mount=type=cache,target=/go/pkg/mod --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ---- runtime: distroless, non-root, no shell ----
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=api /out/server /app/server
COPY --from=web /src/frontend/dist /app/web
ENV APP_ENV=production \
    PORT=8080 \
    STATIC_DIR=/app/web
EXPOSE 8080
USER nonroot:nonroot
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD ["/app/server", "-healthcheck"]
ENTRYPOINT ["/app/server"]
