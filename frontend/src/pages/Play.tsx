import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, Bot, ChevronDown, Clock3, Crown, Flag, LogIn, Play as PlayIcon, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { Page } from "../components/layout/Page";
import { GameArt } from "../components/art/GameArt";
import { Button } from "../components/ui/Button";
import { Segmented, Tabs } from "../components/ui/Segmented";
import { Counter } from "../components/ui/Counter";
import { Kbd, Skeleton, Stat } from "../components/ui/Misc";
import { Spinner } from "../components/ui/Spinner";
import { toast } from "../lib/toast";
import { BoardList } from "../components/BoardList";
import { ReviewList, ReviewComposer } from "../components/ReviewBits";
import { useBoard, useGame, useMe } from "../lib/queries";
import { useGameSession } from "../lib/session";
import { useKeydown, isTyping } from "../lib/hotkeys";
import { cx, fmt } from "../lib/format";
import { preloadStage, stages } from "../games/registry";
import type { Game, GameId } from "../lib/types";
import NotFound from "./NotFound";

export default function Play() {
  const { id } = useParams();
  const { data: game, isPending } = useGame(id);
  if (isPending) return <PlaySkeleton />;
  if (!game) return <NotFound />;
  return <PlayGame key={game.id} game={game} />;
}

function PlayGame({ game }: { game: Game }) {
  const navigate = useNavigate();
  const session = useGameSession<unknown>(game.id);
  const [difficulty, setDifficulty] = useState(game.difficulties?.find((d) => d.id === "normal")?.id ?? game.difficulties?.[0]?.id ?? "");
  const [sheetOpen, setSheetOpen] = useState(true);
  const Stage = stages[game.id];

  useEffect(() => preloadStage(game.id), [game.id]);
  const { error, clearError } = session;
  useEffect(() => {
    if (error) {
      toast(error);
      clearError();
    }
  }, [error, clearError]);
  const start = () => {
    setSheetOpen(true);
    void session.start(difficulty || undefined);
  };

  useKeydown((e) => {
    if (isTyping(e)) return;
    if (e.key === "Escape" && session.phase !== "playing") navigate("/");
    if (e.key === "Enter" && session.phase === "idle") start();
  });

  const lobby = session.phase === "idle" || session.phase === "starting";

  return (
    <Page title={game.title}>
      <div data-accent={game.accent} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section aria-label={`${game.title} game`} className="chunk relative flex min-h-[min(640px,calc(100dvh-6rem))] flex-col overflow-hidden lg:h-[calc(100dvh-6rem)] lg:min-h-[560px]">
          <StageHeader game={game} difficulty={difficulty} playing={session.phase === "playing"} onQuit={() => session.reset()} />
          <div className="relative flex min-h-0 flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {lobby ? (
                <Lobby key="lobby" game={game} difficulty={difficulty} setDifficulty={setDifficulty} starting={session.phase === "starting"} onStart={start} />
              ) : (
                <m.div
                  key={`stage-${session.id}`}
                  className="flex min-h-0 flex-1 flex-col"
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.25, ease: [0.2, 0.9, 0.1, 1] }}
                >
                  <Suspense fallback={<div className="grid flex-1 place-items-center text-ink-3"><Spinner size={28} /></div>}>
                    <Stage game={game} session={session as never} difficulty={difficulty} />
                  </Suspense>
                </m.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {session.phase === "over" && session.result && (
                <ResultSheet
                  key="result"
                  open={sheetOpen}
                  setOpen={setSheetOpen}
                  game={game}
                  session={session}
                  onAgain={start}
                  onLobby={() => session.reset()}
                />
              )}
            </AnimatePresence>
          </div>
        </section>
        <SidePanel game={game} />
      </div>
    </Page>
  );
}

function StageHeader({ game, difficulty, playing, onQuit }: { game: Game; difficulty: string; playing: boolean; onQuit: () => void }) {
  const diffLabel = game.difficulties?.find((d) => d.id === difficulty)?.label;
  return (
    <header className="flex items-center gap-3 border-b-2 border-line bg-[var(--accent)] px-4 py-2.5 text-[#17151c]">
      <GameArt id={game.id} className="size-9 shrink-0 rounded-lg border-2 border-[#17151c]" />
      <div className="min-w-0 flex-1">
        <h1 className="display-tight truncate text-lg leading-tight">{game.title}</h1>
        <p className="truncate text-xs font-semibold opacity-75">{game.tagline}</p>
      </div>
      <AnimatePresence initial={false}>
        {playing && (
          <m.div key="playing" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} className="flex items-center gap-2">
            {diffLabel && <span className="label-caps hidden rounded-md border-2 border-[#17151c] px-2 py-1 sm:inline">{diffLabel}</span>}
            <button
              onClick={onQuit}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border-2 border-[#17151c] bg-[#fffcf5] px-3 text-sm font-bold transition-transform duration-150 hover:-translate-y-px active:translate-y-px"
            >
              <Flag size={15} /> Quit
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Lobby({
  game,
  difficulty,
  setDifficulty,
  starting,
  onStart,
}: {
  game: Game;
  difficulty: string;
  setDifficulty: (d: string) => void;
  starting: boolean;
  onStart: () => void;
}) {
  const { data: me } = useMe();
  const stats = me?.stats?.find((s) => s.gameId === game.id);
  return (
    <m.div
      className="flex flex-1 flex-col overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { staggerChildren: 0.06 } }}
      exit={{ opacity: 0, y: -10, transition: { duration: 0.14 } }}
    >
      <div className="grid flex-1 content-center gap-8 p-5 md:grid-cols-[1fr_1.1fr] md:p-8">
        <m.div
          initial={{ opacity: 0, rotate: -3, y: 16 }}
          animate={{ opacity: 1, rotate: -1.5, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="relative mx-auto w-full max-w-sm self-center overflow-hidden rounded-[var(--radius-card)] border-2 border-line shadow-[6px_6px_0_var(--shadow)] md:max-w-none"
        >
          <GameArt id={game.id} className="aspect-[16/11] w-full" />
        </m.div>

        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-xs font-bold text-ink-2">
              <Chip icon={game.mode === "vs-bot" ? <Bot size={14} /> : <UserRound size={14} />}>{game.mode === "vs-bot" ? "Versus bot" : "Solo"}</Chip>
              <Chip icon={<Clock3 size={14} />}>~{game.minutes} min</Chip>
              {stats && stats.bestScore > 0 && <Chip icon={<Crown size={14} />}>Your best {fmt(stats.bestScore)}</Chip>}
            </div>
            <p className="max-w-prose leading-relaxed text-ink-2">{game.description}</p>
          </div>

          {game.difficulties && (
            <div>
              <p className="label-caps mb-2 text-ink-3">Difficulty</p>
              <Segmented
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={game.difficulties.map((d) => ({ value: d.id, label: d.label, hint: d.hint }))}
                className="w-full max-w-md"
              />
            </div>
          )}

          <ol className="grid gap-2 sm:grid-cols-3">
            {game.howTo.map((s, i) => (
              <m.li
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.06, type: "spring", stiffness: 380, damping: 30 }}
                className="rounded-2xl border-2 border-line-soft bg-surface-2/60 p-3"
              >
                <span className="num mb-1 grid size-6 place-items-center rounded-md bg-[var(--accent)] text-xs font-bold text-[#17151c]">{i + 1}</span>
                <p className="text-sm font-bold">{s.title}</p>
                <p className="text-xs leading-snug text-ink-2">{s.body}</p>
              </m.li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center gap-4">
            <Button variant="accent" size="lg" status={starting ? "loading" : "idle"} icon={<PlayIcon size={20} fill="currentColor" />} onClick={onStart} className="min-w-44">
              Start game
            </Button>
            <span className="hidden items-center gap-1.5 text-xs text-ink-3 sm:inline-flex">
              <Kbd>Enter</Kbd> to start · <Kbd>Esc</Kbd> back to arcade
            </span>
          </div>
          {!me?.user && (
            <p className="flex items-center gap-2 text-sm text-ink-2">
              <LogIn size={16} />
              <span>
                Playing as a guest.{" "}
                <Link to="/login" className="font-bold text-ink underline decoration-2 underline-offset-2">
                  Sign in
                </Link>{" "}
                to save scores.
              </span>
            </p>
          )}
        </div>
      </div>
    </m.div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-line-soft bg-surface px-2 py-1">
      {icon}
      {children}
    </span>
  );
}

const outcomeCopy = {
  win: { title: "You won", tone: "bg-success text-white" },
  loss: { title: "Game over", tone: "bg-danger text-white" },
  draw: { title: "Draw", tone: "bg-surface-3 text-ink" },
  done: { title: "Finished", tone: "bg-brand text-[#17151c]" },
} as const;

function ResultSheet({
  open,
  setOpen,
  game,
  session,
  onAgain,
  onLobby,
}: {
  open: boolean;
  setOpen: (o: boolean) => void;
  game: Game;
  session: ReturnType<typeof useGameSession<unknown>>;
  onAgain: () => void;
  onLobby: () => void;
}) {
  const result = session.result!;
  const rec = session.record;
  const copy = outcomeCopy[result.outcome];
  const navigate = useNavigate();

  return (
    <m.div
      role="dialog"
      aria-label="Result"
      className="absolute inset-x-3 bottom-3 z-20"
      initial={{ y: "115%" }}
      animate={{ y: open ? 0 : "calc(100% - 52px)" }}
      exit={{ y: "115%", transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 340, damping: 32, delay: open ? 0.15 : 0 }}
    >
      <div className="chunk !shadow-[6px_6px_0_var(--shadow)]">
        <button onClick={() => setOpen(!open)} className="flex h-[48px] w-full items-center gap-3 px-4 text-left" aria-expanded={open}>
          <span className={cx("label-caps rounded-md px-2 py-1", copy.tone)}>{copy.title}</span>
          <span className="num font-bold">{fmt(result.score)} pts</span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-ink-3">
            {open ? "Show board" : "Show result"}
            <ChevronDown size={16} className={cx("transition-transform duration-300", !open && "rotate-180")} />
          </span>
        </button>
        <div className="grid gap-4 border-t-2 border-line-soft px-4 pt-4 pb-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="label-caps text-ink-3">Score</p>
            <p className="display text-[clamp(2.6rem,6vw,3.6rem)]">
              <Counter value={result.score} />
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {rec?.isNewBest && (
                <m.span
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: -3 }}
                  transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.9 }}
                  className="label-caps inline-flex items-center gap-1.5 rounded-lg border-2 border-line bg-brand px-2.5 py-1.5 text-[#17151c] shadow-[2px_2px_0_var(--shadow)]"
                >
                  <Sparkles size={14} /> New personal best
                </m.span>
              )}
              {rec && !rec.isNewBest && <span className="text-sm text-ink-2">Your best is {fmt(rec.best)}</span>}
              {rec && rec.streak > 1 && <span className="text-sm font-bold text-ink-2">{rec.streak} wins in a row</span>}
              {!session.saved && (
                <span className="text-sm text-ink-2">
                  <Link to="/login" className="font-bold text-ink underline decoration-2 underline-offset-2">
                    Sign in
                  </Link>{" "}
                  to keep scores like this.
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" icon={<ArrowLeft size={18} />} onClick={() => navigate("/")}>
              Arcade
            </Button>
            {game.difficulties && (
              <Button variant="secondary" onClick={onLobby}>
                Change level
              </Button>
            )}
            <Button variant="accent" icon={<RotateCcw size={18} />} status={session.phase === "starting" ? "loading" : "idle"} onClick={onAgain} autoFocus>
              Play again
            </Button>
          </div>
        </div>
      </div>
    </m.div>
  );
}

type Panel = "board" | "you" | "reviews";

function SidePanel({ game }: { game: Game }) {
  const [tab, setTab] = useState<Panel>("board");
  return (
    <aside className="chunk flex flex-col overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]">
      <Tabs
        label="Game info"
        value={tab}
        onChange={setTab}
        className="px-2"
        tabs={[
          { value: "board", label: "Leaderboard" },
          { value: "you", label: "Your stats" },
          { value: "reviews", label: "Reviews" },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }} className="p-4">
            {tab === "board" && <GameBoard id={game.id} />}
            {tab === "you" && <YourStats game={game} />}
            {tab === "reviews" && (
              <div className="space-y-5">
                <ReviewComposer gameId={game.id} compact />
                <ReviewList game={game.id} compact />
              </div>
            )}
          </m.div>
        </AnimatePresence>
      </div>
      <div className="border-t-2 border-line-soft p-4 text-xs text-ink-2">
        <p className="label-caps mb-1.5 text-ink-3">Scoring</p>
        {game.scoring}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {game.controls.map((c) => (
            <span key={c} className="rounded-md border-2 border-line-soft px-1.5 py-0.5 font-semibold">
              {c}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

function GameBoard({ id }: { id: GameId }) {
  const { data, isPending } = useBoard(id);
  const { data: me } = useMe();
  return <BoardList entries={data?.slice(0, 10)} loading={isPending} meId={me?.user?.id} compact />;
}

function YourStats({ game }: { game: Game }) {
  const { data: me } = useMe();
  if (!me?.user)
    return (
      <div className="space-y-3 text-sm text-ink-2">
        <p>Sign in to track your best score, streaks and rank on every game.</p>
        <Link to="/login" className="font-bold text-ink underline decoration-2 underline-offset-2">
          Sign in or create an account
        </Link>
      </div>
    );
  const s = me.stats?.find((x) => x.gameId === game.id);
  if (!s) return <p className="text-sm text-ink-2">No games played yet. Your stats appear here after your first finish.</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      <Stat label="Best" value={fmt(s.bestScore)} className="col-span-2" />
      <Stat label="Rank" value={s.rank ? `#${s.rank}` : "—"} />
      <Stat label="Plays" value={fmt(s.plays)} />
      {game.mode === "vs-bot" && (
        <>
          <Stat label="Wins" value={fmt(s.wins)} />
          <Stat label="Losses" value={fmt(s.losses)} />
          <Stat label="Streak" value={fmt(s.currentStreak)} />
          <Stat label="Best streak" value={fmt(s.bestStreak)} />
        </>
      )}
      <Stat label="Total points" value={fmt(s.totalScore)} className="col-span-2" />
    </div>
  );
}

function PlaySkeleton() {
  return (
    <div className="grid gap-5 pt-4 lg:grid-cols-[1fr_360px]">
      <Skeleton className="h-[min(640px,calc(100dvh-6rem))] rounded-[var(--radius-card)]" />
      <Skeleton className="hidden h-[480px] rounded-[var(--radius-card)] lg:block" />
    </div>
  );
}
