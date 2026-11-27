// Shapes returned by the Go API (backend/internal/api, backend/internal/catalog).

export type Accent = "lime" | "coral" | "sky" | "violet" | "amber" | "teal" | "pink" | "indigo" | "rose";
export type Genre = "strategy" | "puzzle" | "arcade" | "brain";

export type GameId =
  | "stackfall"
  | "drop-four"
  | "tic-tac-toe"
  | "sliding-puzzle"
  | "typestorm"
  | "geo-quest"
  | "quantum-guess"
  | "guess-number"
  | "pig";

export interface Option {
  id: string;
  label: string;
  hint?: string;
}

export interface Game {
  id: GameId;
  title: string;
  tagline: string;
  description: string;
  genre: Genre;
  mode: "vs-bot" | "solo";
  minutes: number;
  accent: Accent;
  controls: string[];
  howTo: { title: string; body: string }[];
  difficulties?: Option[];
  scoring: string;
  playsWeek: number;
  playsTotal: number;
  rating: number;
  reviews: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

export interface GameStats {
  gameId: GameId;
  bestScore: number;
  totalScore: number;
  plays: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  bestStreak: number;
  rank: number | null;
  lastPlayedAt: string;
}

export interface Me {
  user: User | null;
  stats?: GameStats[];
}

export interface BoardEntry {
  rank: number;
  userId: number;
  username: string;
  score: number;
  games?: number;
  at: string;
}

export interface Review {
  id: number;
  gameId: GameId | "platform";
  userId: number;
  username: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type Outcome = "win" | "loss" | "draw" | "done";

export interface SessionResult {
  outcome: Outcome;
  score: number;
}

export interface RecordResult {
  best: number;
  isNewBest: boolean;
  streak: number;
  previousBest: number;
}

export interface SessionResponse<S> {
  id: string;
  gameId: GameId;
  seed: number;
  state: S;
  result?: SessionResult;
  record?: RecordResult;
  saved: boolean;
}
