import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, post } from "./api";
import type { BoardEntry, Game, GameId, Me, Review, User } from "./types";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (n, err) => n < 2 && (err as { status?: number }).status !== 404,
    },
  },
});

export const keys = {
  games: ["games"] as const,
  me: ["me"] as const,
  board: (id: GameId | "global") => ["board", id] as const,
  reviews: (game: string) => ["reviews", game] as const,
};

export function useGames() {
  return useQuery({
    queryKey: keys.games,
    queryFn: ({ signal }) => get<{ games: Game[] }>("/games", signal).then((r) => r.games),
    staleTime: 60_000,
  });
}

export function useGame(id: string | undefined) {
  const q = useGames();
  return { ...q, data: q.data?.find((g) => g.id === id) };
}

export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: ({ signal }) => get<Me>("/me", signal),
    staleTime: 30_000,
  });
}

export function useBoard(id: GameId | "global") {
  return useQuery({
    queryKey: keys.board(id),
    queryFn: ({ signal }) =>
      get<{ entries: BoardEntry[] }>(id === "global" ? "/leaderboards/global" : `/leaderboards/${id}`, signal).then((r) => r.entries),
    staleTime: 10_000,
  });
}

export function useReviews(game: string) {
  return useQuery({
    queryKey: keys.reviews(game),
    queryFn: ({ signal }) =>
      get<{ reviews: Review[]; next: number | null }>(game ? `/reviews?game=${encodeURIComponent(game)}` : "/reviews", signal),
  });
}

export function useAuth() {
  const qc = useQueryClient();
  const onAuthed = (r: { user: User }) => {
    qc.setQueryData<Me>(keys.me, { user: r.user, stats: [] });
    void qc.invalidateQueries({ queryKey: keys.me });
  };
  const login = useMutation({
    mutationFn: (v: { email: string; password: string }) => post<{ user: User }>("/auth/login", v),
    onSuccess: onAuthed,
  });
  const register = useMutation({
    mutationFn: (v: { username: string; email: string; password: string }) => post<{ user: User }>("/auth/register", v),
    onSuccess: onAuthed,
  });
  const logout = useMutation({
    mutationFn: () => post<void>("/auth/logout"),
    onSuccess: () => {
      qc.setQueryData<Me>(keys.me, { user: null });
    },
  });
  return { login, register, logout };
}

export function useReviewMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["reviews"] });
    void qc.invalidateQueries({ queryKey: keys.games });
  };
  const save = useMutation({
    mutationFn: (v: { gameId: string; rating: number; body: string }) => post<Review>("/reviews", v),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: number) => del<void>(`/reviews/${id}`),
    onSuccess: refresh,
  });
  return { save, remove };
}
