import { useEffect, useState } from "react";
import { m } from "motion/react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { useKeydown } from "../../lib/hotkeys";
import { clock, cx } from "../../lib/format";

interface State {
  size: number;
  tiles: number[];
  moves: number;
  elapsedMs: number;
  status: "playing" | "solved";
}

const spring = { type: "spring", stiffness: 700, damping: 40, mass: 0.6 } as const;

/**
 * Moves apply locally at once (tiles glide via shared layout) and are sent to
 * the server in order; if the server ever disagrees, its board wins.
 */
export default function Sliding({ session }: StageProps<State>) {
  const s = session.state!;
  const n = s.size;
  const [tiles, setTiles] = useState(s.tiles);
  const [moves, setMoves] = useState(s.moves);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [synced, setSynced] = useState(s);
  const solved = s.status === "solved";

  // Authoritative resync when the server's view catches up (also undoes rejected moves).
  if (s !== synced) {
    setSynced(s);
    if (s.moves >= moves || solved) {
      setTiles(s.tiles);
      setMoves(s.moves);
    }
  }

  // Display clock: ticks once per second only while the puzzle is being solved.
  useEffect(() => {
    if (solved || startedAt === null) return;
    const id = window.setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, [solved, startedAt]);

  const slide = (value: number) => {
    if (solved) return;
    const at = tiles.indexOf(value);
    const gap = tiles.indexOf(0);
    const adjacent = (Math.abs(at - gap) === 1 && Math.floor(at / n) === Math.floor(gap / n)) || Math.abs(at - gap) === n;
    if (!adjacent) return;
    const next = [...tiles];
    next[gap] = value;
    next[at] = 0;
    setTiles(next);
    setMoves((m) => m + 1);
    if (startedAt === null) {
      const t = performance.now();
      setStartedAt(t);
      setNow(t);
    }
    void session.queue({ type: "move", tiles: [value] });
  };

  // Arrow keys move the tile *into* the gap from the arrow's direction.
  useKeydown((e) => {
    const gap = tiles.indexOf(0);
    const r = Math.floor(gap / n);
    const c = gap % n;
    const from: Record<string, [number, number]> = { ArrowUp: [r + 1, c], ArrowDown: [r - 1, c], ArrowLeft: [r, c + 1], ArrowRight: [r, c - 1] };
    const target = from[e.key];
    if (!target) return;
    e.preventDefault();
    const [tr, tc] = target;
    if (tr >= 0 && tr < n && tc >= 0 && tc < n) slide(tiles[tr * n + tc]);
  });

  const elapsed = solved ? s.elapsedMs : startedAt !== null ? now - startedAt : 0;

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Moves", value: moves, accent: true },
            { label: "Time", value: clock(elapsed) },
            { label: "Grid", value: `${n}×${n}` },
          ]}
        />
      }
    >
      <div
        className="grid aspect-square w-[min(100%,56vh,500px)] gap-[1.6%] rounded-[18px] border-2 border-line bg-surface-3 p-[2%] shadow-[5px_5px_0_var(--shadow)]"
        style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      >
        {tiles.map((v) =>
          v === 0 ? (
            <m.span key="gap" layout transition={spring} />
          ) : (
            <m.button
              key={v}
              layout
              transition={spring}
              onClick={() => slide(v)}
              aria-label={`Tile ${v}`}
              className={cx(
                "num grid place-items-center rounded-[12%] border-2 border-line font-bold select-none",
                "bg-surface shadow-[0_4px_0_var(--line)] active:translate-y-[3px] active:shadow-[0_1px_0_var(--line)]",
                tiles.indexOf(v) === v - 1 && "!bg-[var(--accent)] text-[#17151c]",
                n === 3 ? "text-[clamp(1.4rem,5vh,2.6rem)]" : n === 4 ? "text-[clamp(1.1rem,3.8vh,2rem)]" : "text-[clamp(0.9rem,3vh,1.6rem)]",
              )}
            >
              {v}
            </m.button>
          ),
        )}
      </div>
      <p className="mt-3 text-center text-xs text-ink-3">Click a tile next to the gap, or use the arrow keys. Tiles in place turn {""}<span className="font-bold">coloured</span>.</p>
    </StageBody>
  );
}
