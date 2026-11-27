import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, HandCoins } from "lucide-react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { Button } from "../../components/ui/Button";
import { useKeydown } from "../../lib/hotkeys";
import { cx, fmt } from "../../lib/format";

interface State {
  board: string[];
  round: number;
  maxRounds: number;
  streak: number;
  score: number;
  status: "your-turn" | "round-over" | "over";
  roundEnd?: "win" | "loss" | "draw";
  roundPoints?: number;
  winLine?: number[];
  botMove?: number;
  youStarted: boolean;
}

const BOT_DELAY = 320; // a short beat so the bot feels like it is thinking

export default function TicTacToe({ session }: StageProps<State>) {
  const s = session.state;
  // What is on screen. Player moves show instantly; the bot's reply lands after a beat.
  const [shown, setShown] = useState<State | null>(s);
  const clickedAt = useRef(0);

  useEffect(() => {
    if (!s) return;
    const wait = Math.max(0, BOT_DELAY - (performance.now() - clickedAt.current));
    const t = window.setTimeout(() => setShown(s), s.botMove !== undefined && clickedAt.current ? wait : 0);
    return () => clearTimeout(t);
  }, [s]);

  if (!shown) return null;
  const canMove = shown.status === "your-turn" && !session.busy;

  const play = (cell: number) => {
    if (!canMove || shown.board[cell]) return;
    clickedAt.current = performance.now();
    setShown({ ...shown, board: shown.board.map((v, i) => (i === cell ? "X" : v)), botMove: undefined, status: "your-turn" });
    void session.act({ type: "move", cell });
  };

  return (
    <Controls state={shown} onPlay={play} canMove={canMove} session={session} />
  );
}

function Controls({ state, onPlay, canMove, session }: { state: State; onPlay: (c: number) => void; canMove: boolean; session: StageProps<State>["session"] }) {
  const roundOver = state.status === "round-over";
  useKeydown((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 9) onPlay(n - 1);
    if (roundOver && e.key === "Enter") void session.act({ type: "next" });
  });

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Round", value: `${state.round}/${state.maxRounds}` },
            { label: "Streak", value: state.streak },
            { label: "Score", value: fmt(state.score), accent: true },
          ]}
        />
      }
    >
      <div className="relative aspect-square w-[min(100%,52vh,440px)]">
        <div className="grid size-full grid-cols-3 grid-rows-3 gap-2.5">
          {state.board.map((v, i) => (
            <button
              key={i}
              onClick={() => onPlay(i)}
              disabled={!canMove || !!v}
              aria-label={`Square ${i + 1}${v ? `, ${v === "X" ? "you" : "bot"}` : ""}`}
              className={cx(
                "group relative grid place-items-center rounded-2xl border-2 border-line bg-surface transition-[transform,box-shadow,background-color] duration-150",
                !v && canMove && "shadow-[3px_3px_0_var(--shadow)] hover:-translate-y-0.5 hover:bg-[var(--accent)]/15 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
                v && "bg-surface-2",
                state.winLine?.includes(i) && (state.roundEnd === "win" ? "!bg-[var(--accent)]" : "!bg-danger/25"),
              )}
            >
              {v === "X" && <Mark kind="X" />}
              {v === "O" && <Mark kind="O" />}
              {!v && canMove && <span className="num absolute top-1.5 left-2 text-[0.65rem] text-ink-3 opacity-0 transition-opacity group-hover:opacity-100">{i + 1}</span>}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {roundOver && (
            <m.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 28, delay: 0.25 }}
              className="chunk absolute inset-x-4 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 p-5 text-center !shadow-[6px_6px_0_var(--shadow)]"
            >
              <p className="display text-3xl">{state.roundEnd === "win" ? "Round won" : state.roundEnd === "draw" ? "Draw" : "Round lost"}</p>
              <p className="num text-sm font-bold text-ink-2">+{state.roundPoints ?? 0} points</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<HandCoins size={16} />} onClick={() => void session.act({ type: "cashout" })}>
                  Cash out
                </Button>
                <Button variant="accent" size="sm" iconRight={<ArrowRight size={16} />} onClick={() => void session.act({ type: "next" })} status={session.busy ? "loading" : "idle"} autoFocus>
                  Next round
                </Button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">{state.youStarted ? "You move first this round" : "Bot moved first this round"} · keys 1-9</p>
    </StageBody>
  );
}

const draw = { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.22, ease: "easeOut" } } as const;

function Mark({ kind }: { kind: "X" | "O" }) {
  return (
    <svg viewBox="0 0 40 40" className="size-[58%]" aria-hidden>
      {kind === "X" ? (
        <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none">
          <m.path d="M9 9l22 22" {...draw} />
          <m.path d="M31 9L9 31" {...draw} transition={{ ...draw.transition, delay: 0.1 }} />
        </g>
      ) : (
        <m.circle cx="20" cy="20" r="12" stroke="var(--a-coral)" strokeWidth="6" fill="none" strokeLinecap="round" {...draw} transition={{ duration: 0.3 }} />
      )}
    </svg>
  );
}
