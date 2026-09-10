# Stage 1: Build static binary
FROM golang:alpine AS builder

ENV GOTOOLCHAIN=auto
WORKDIR /app

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Ensure dependencies are tidy and build stripped static binary
RUN go mod tidy && \
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o /app/server \
    ./cmd/server

# Stage 2: Minimal runtime container (~15MB)
FROM alpine:3.20

WORKDIR /app

# Add ca-certificates for outbound TLS
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user for security
RUN adduser -D -g '' appuser

COPY --from=builder /app/server /app/server
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

ENTRYPOINT ["/app/server"]
