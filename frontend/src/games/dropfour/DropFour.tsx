import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { useKeydown } from "../../lib/hotkeys";
import { cx } from "../../lib/format";

const COLS = 7;
const ROWS = 6;
const BOT_DELAY = 420;

interface Move {
  player: number;
  col: number;
  row: number;
}
interface State {
  board: number[][];
  moves: Move[];
  status: "your-turn" | "over";
  winner?: number;
  winLine?: [number, number][];
  turns: number;
}

type Grid = number[][];
const empty = (): Grid => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export default function DropFour({ session }: StageProps<State>) {
  const s = session.state;
  const [grid, setGrid] = useState<Grid>(() => s?.board.map((r) => [...r]) ?? empty());
  const [dropped, setDropped] = useState<Set<string>>(new Set()); // cells that should animate in
  const [hover, setHover] = useState<number | null>(null);
  const [winLine, setWinLine] = useState<[number, number][]>([]);
  const lastSeen = useRef<State | null>(null);

  // The player's disc drops locally on click; the bot's reply lands after a beat.
  useEffect(() => {
    if (!s || s === lastSeen.current) return;
    lastSeen.current = s;
    const bot = s.moves?.[1];
    const timers: number[] = [];
    if (bot) {
      timers.push(
        window.setTimeout(() => {
          setGrid((g) => {
            const n = g.map((r) => [...r]);
            n[bot.row][bot.col] = bot.player;
            return n;
          });
          setDropped((d) => new Set(d).add(`${bot.row}-${bot.col}`));
        }, BOT_DELAY),
      );
    }
    if (s.winLine) timers.push(window.setTimeout(() => setWinLine(s.winLine!), bot ? BOT_DELAY + 380 : 380));
    return () => timers.forEach(clearTimeout);
  }, [s]);

  const thinking = session.busy || (!!s?.moves?.[1] && grid[s.moves[1].row][s.moves[1].col] === 0);
  const canMove = s?.status === "your-turn" && !thinking;
  const drop = (col: number) => {
    if (!canMove || grid[0][col] !== 0) return;
    let row = ROWS - 1;
    while (grid[row][col] !== 0) row--;
    const before = grid;
    setGrid((g) => {
      const n = g.map((r) => [...r]);
      n[row][col] = 1;
      return n;
    });
    setDropped((d) => new Set(d).add(`${row}-${col}`));
    void session.act({ type: "drop", col }).then((r) => !r && setGrid(before));
  };

  useKeydown((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= COLS) drop(n - 1);
  });

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Your discs", value: s?.turns ?? 0 },
            { label: "Turn", value: s?.status === "over" ? "Done" : thinking ? "Bot" : "You", accent: true },
          ]}
        />
      }
    >
      <div className="w-[min(100%,calc((100dvh-20rem)*7/6),640px)]">
        {/* Column pickers with a hovering ghost disc. */}
        <div className="mb-1 grid grid-cols-7 gap-[3%] px-[2.5%]">
          {Array.from({ length: COLS }, (_, c) => (
            <div key={c} className="grid aspect-square place-items-center">
              <m.span
                animate={{ opacity: hover === c && canMove ? 1 : 0, y: hover === c ? 0 : -6 }}
                transition={{ duration: 0.15 }}
                className="size-[78%] rounded-full border-2 border-line bg-[var(--accent)]"
              />
            </div>
          ))}
        </div>
        <div className="relative rounded-[18px] border-2 border-line bg-[#2a2833] p-[2.5%] shadow-[5px_5px_0_var(--shadow)] dark:bg-[#0c0b10]" onMouseLeave={() => setHover(null)}>
          <div className="grid grid-cols-7 gap-[3%]">
            {Array.from({ length: COLS }, (_, c) => (
              <button
                key={c}
                onMouseEnter={() => setHover(c)}
                onFocus={() => setHover(c)}
                onClick={() => drop(c)}
                disabled={!canMove || grid[0][c] !== 0}
                aria-label={`Drop in column ${c + 1}`}
                className={cx("grid grid-rows-6 gap-[3%] rounded-xl transition-colors", hover === c && canMove && "bg-white/8")}
              >
                {Array.from({ length: ROWS }, (_, r) => {
                  const v = grid[r][c];
                  const key = `${r}-${c}`;
                  const win = winLine.some(([wr, wc]) => wr === r && wc === c);
                  return (
                    <span key={r} className="relative aspect-square rounded-full bg-[var(--bg)] shadow-[inset_0_3px_0_rgba(0,0,0,0.25)]">
                      {v !== 0 && (
                        <m.span
                          initial={dropped.has(key) ? { y: `${-(r + 1.4) * 112}%` } : false}
                          animate={{ y: 0, scale: win ? [1, 1.12, 1] : 1 }}
                          transition={dropped.has(key) ? { type: "spring", stiffness: 520, damping: 24, mass: 0.9 } : { duration: 0.4 }}
                          className={cx(
                            "absolute inset-[4%] rounded-full border-2 border-line",
                            v === 1 ? "bg-[var(--accent)]" : "bg-[#fffcf5]",
                            win && "ring-4 ring-[var(--brand)] ring-offset-2 ring-offset-[#2a2833]",
                          )}
                        >
                          <span className="absolute inset-[22%] rounded-full border-2 border-black/15" />
                        </m.span>
                      )}
                    </span>
                  );
                })}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-center gap-5 text-xs font-semibold text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3.5 rounded-full border-2 border-line bg-[var(--accent)]" /> You
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3.5 rounded-full border-2 border-line bg-[#fffcf5]" /> Bot
          </span>
          <span className="text-ink-3">keys 1-7</span>
        </div>
      </div>
    </StageBody>
  );
}
