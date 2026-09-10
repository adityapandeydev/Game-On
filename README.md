# Game-On

A high-performance retro-futuristic arcade platform featuring a React and TypeScript frontend, a Go and Chi backend service, and a normalized PostgreSQL 16 database orchestrated via Docker Compose.

---

## Architecture Overview

Game-On is structured as a decoupled client-server architecture:

- Frontend: Single-page application built with React 19, TypeScript, and Vite. Styled with modern arcade glassmorphism and Tailwind CSS.
- Backend: Micro-latency REST service implemented in Go using the Chi router adhering to standard net/http contracts.
- Persistence: PostgreSQL 16 relational database with connection pooling via pgxpool, atomic score upserts, and host-managed persistent volumes.
- Runtime Environment: Dockerized backend and database services with local development options powered by Bun.

```
Game-On/
├── backend/
│   ├── cmd/server/main.go       # Go application entrypoint and lifecycle
│   ├── internal/
│   │   ├── config/              # Environment variable configuration
│   │   ├── database/            # pgxpool connection management and schema sync
│   │   ├── handlers/            # REST controllers (auth, leaderboards, reviews, stats)
│   │   ├── middleware/          # JWT authentication and request context
│   │   ├── models/              # Relational models and DTO structures
│   │   └── router/              # Chi router mounting and middleware pipeline
│   ├── Dockerfile               # Multi-stage Alpine container builder
│   ├── go.mod                   # Go module definitions
│   └── go.sum                   # Dependency checksums
├── frontend/
│   ├── src/
│   │   ├── components/          # Arcade game interfaces, navbar, and leaderboards
│   │   ├── context/             # AuthContext and session state
│   │   ├── services/            # API abstraction layer (ScoreService)
│   │   └── types/               # TypeScript domain interfaces
│   ├── package.json             # Frontend package definitions
│   └── vite.config.ts           # Vite bundler and API reverse-proxy configuration
├── docker-compose.yml           # Multi-container orchestration (Go backend + PostgreSQL 16)
├── go.work                      # Go workspace configuration
└── package.json                 # Unified workspace scripts
```

---

## Technology Stack

### Frontend
- Runtime and Package Manager: Bun
- Framework: React 19 with TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS, Vanilla CSS custom glassmorphism design tokens
- Animation: Framer Motion, Canvas Confetti
- Icons: Lucide React

### Backend
- Language: Go 1.27
- Router: go-chi/chi/v5
- Database Driver: jackc/pgx/v5 with pgxpool connection pooling
- Cryptography: golang.org/x/crypto/bcrypt (work factor 10)
- Tokens: golang-jwt/jwt/v5 (HMAC-SHA256)
- Container: Docker (Alpine 3.20 base, non-root user execution, sub-15MB image footprint)

### Database
- Engine: PostgreSQL 16 Alpine
- Storage: Named persistent Docker volume (`postgres_data`)

---

## Database Architecture

The PostgreSQL schema initializes automatically on backend startup with strict constraints and indexes:

| Table | Primary Key | Foreign Keys / Constraints | Indexes | Description |
| :--- | :--- | :--- | :--- | :--- |
| users | id SERIAL | UNIQUE(email) | Primary Key, UNIQUE(email) | User credentials and profile data |
| scores | id SERIAL | user_id REFERENCES users(id) ON DELETE CASCADE, UNIQUE(user_id, game_id) | (game_id, score DESC), (user_id) | High scores per game per user |
| recently_played | id SERIAL | user_id REFERENCES users(id) ON DELETE CASCADE, UNIQUE(user_id, game_id) | (user_id, last_played DESC) | Player game launch history |
| game_stats | game_id VARCHAR(50) | PRIMARY KEY (game_id) | (click_count DESC) | Platform-wide game popularity metrics |
| reviews | id SERIAL | user_id REFERENCES users(id) ON DELETE CASCADE, CHECK(rating >= 1 AND rating <= 5) | (game_id, created_at DESC) | User feedback and game ratings |

### Atomic Score Upserts
Score persistence utilizes atomic PostgreSQL upserts to eliminate race conditions under concurrent submissions:

```sql
INSERT INTO scores (user_id, game_id, game_name, score, streak, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
ON CONFLICT (user_id, game_id)
DO UPDATE SET
    score = GREATEST(scores.score, EXCLUDED.score),
    streak = EXCLUDED.streak,
    game_name = EXCLUDED.game_name,
    updated_at = NOW();
```

---

## Getting Started

### Prerequisites
- Docker Desktop with Docker Compose
- Bun (or Node.js 20+)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/adityapandeydev/Game-On.git
cd Game-On
```

### 2. Environment Configuration
Create a `.env` file in the root or `backend/` directory if custom credentials are required. By default, `docker-compose.yml` provides sensible defaults:

```env
PORT=5000
DATABASE_URL=postgres://postgres:6243@db:5432/game_on?sslmode=disable
JWT_SECRET=game_on_super_secret_jwt_key_2026
```

### 3. Start Backend and Database via Docker
Run the following command to start both the PostgreSQL 16 database and the Go backend service in the background:

```bash
bun run docker:up
```

Alternatively:
```bash
docker compose up -d
```

To view live backend logs:
```bash
bun run docker:logs
```

To stop all containers:
```bash
bun run docker:down
```

### 4. Start Frontend
In a separate terminal, launch the React development server:

```bash
bun run dev:frontend
```

The frontend will run at `http://localhost:5173` and automatically proxy API requests to `http://localhost:5000`.

---

## API Reference

### Authentication
- `POST /api/auth/register` - Register a new user account with hashed password
- `POST /api/auth/login` - Authenticate user and issue JWT
- `GET /api/auth/me` - Retrieve authenticated user profile
- `GET /api/auth/verify` - Validate token integrity

### Leaderboards
- `GET /api/leaderboard/global` - Global player ranking aggregated across all games
- `GET /api/leaderboard/:gameId` - Top scores for a specific game
- `GET /api/leaderboard/user/:userId` - Historical best scores for a user
- `POST /api/leaderboard/submit` - Submit or update best score (requires JWT)

### Recently Played
- `GET /api/recently-played` - Retrieve the current user's recently launched games
- `POST /api/recently-played/track` - Record game activity (requires JWT)

### Trending Games
- `GET /api/trending` - List games sorted by engagement and click count
- `POST /api/trending/track/:gameId` - Atomically increment click count for a game

### Reviews
- `GET /api/reviews` - Retrieve recent platform reviews
- `GET /api/reviews/:gameId` - Retrieve reviews for a specific title
- `POST /api/reviews` - Submit a review and star rating (requires JWT)
- `DELETE /api/reviews/:reviewId` - Remove user-owned review (requires JWT)

### Game Statistics
- `GET /api/gamestats/:gameId` - Retrieve telemetry and aggregate stats for a game

---

## Security Specifications

1. Password Storage: Passwords are encrypted using bcrypt with salt rounds set to cost 10 before storage. Plaintext passwords are never persisted or logged.
2. Token Authentication: Authorization utilizes HMAC-SHA256 JWT tokens with a 7-day expiration lifecycle. Tokens can be provided via `Authorization: Bearer <token>` or `x-auth-token` headers.
3. Container Hardening: The backend Docker container runs under an unprivileged `appuser` account inside Alpine Linux with stripped debugging symbols (`-ldflags="-s -w"`).
4. SQL Injection Protection: All database interactions utilize parameterized prepared statements via the `pgx` driver.
5. Persistent Data Guarantee: Database files reside in the named volume `postgres_data`, surviving system reboots and container upgrades.

---

## License

This project is licensed under the MIT License.
