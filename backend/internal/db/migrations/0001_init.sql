CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username      TEXT        NOT NULL CHECK (char_length(username) BETWEEN 3 AND 24),
    email         TEXT        NOT NULL CHECK (char_length(email) <= 254),
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_key    ON users (lower(email));
CREATE UNIQUE INDEX users_username_key ON users (lower(username));

-- One row per (player, game). Holds best score, lifetime counters and streaks,
-- and doubles as the "recently played" source via last_played_at.
CREATE TABLE player_stats (
    user_id        BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    game_id        TEXT        NOT NULL,
    best_score     INTEGER     NOT NULL DEFAULT 0 CHECK (best_score >= 0),
    best_at        TIMESTAMPTZ,
    total_score    BIGINT      NOT NULL DEFAULT 0,
    plays          INTEGER     NOT NULL DEFAULT 0,
    wins           INTEGER     NOT NULL DEFAULT 0,
    losses         INTEGER     NOT NULL DEFAULT 0,
    draws          INTEGER     NOT NULL DEFAULT 0,
    current_streak INTEGER     NOT NULL DEFAULT 0,
    best_streak    INTEGER     NOT NULL DEFAULT 0,
    last_played_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, game_id)
);
CREATE INDEX player_stats_board  ON player_stats (game_id, best_score DESC, best_at ASC) WHERE best_score > 0;
CREATE INDEX player_stats_recent ON player_stats (user_id, last_played_at DESC);

-- Session starts per game per day; drives "trending". Written in batches.
CREATE TABLE game_daily_plays (
    game_id TEXT    NOT NULL,
    day     DATE    NOT NULL,
    plays   INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (game_id, day)
);

-- One review per player per game ('platform' for site-wide feedback); re-submitting edits it.
CREATE TABLE reviews (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    game_id    TEXT        NOT NULL,
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, game_id)
);
CREATE INDEX reviews_game_recent ON reviews (game_id, created_at DESC);
CREATE INDEX reviews_recent      ON reviews (created_at DESC);
