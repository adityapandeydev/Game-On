import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ChevronsDown, Pause, Play, RotateCw } from "lucide-react";
import { HEIGHT, HIDDEN, In, SHAPES, Sim, TICKS_PER_SEC, WIDTH } from "./sim";
import type { StageProps } from "../types";
import { Hud } from "../Hud";
import { Button } from "../../components/ui/Button";
import { fmt } from "../../lib/format";

const STEP_MS = 1000 / TICKS_PER_SEC;
const DAS = 10; // ticks before auto-repeat
const ARR = 2; // ticks between repeats
const SOFT_EVERY = 2;
const FLUSH_TICKS = TICKS_PER_SEC; // stream inputs to the server every second

const PIECE_COLORS = ["--a-sky", "--a-indigo", "--a-amber", "--a-lime", "--a-teal", "--a-violet", "--a-rose"];

interface Hold {
  code: number;
  since: number;
}

interface UiState {
  score: number;
  lines: number;
  level: number;
  queue: number[];
  paused: boolean;
}

/**
 * Runs the shared deterministic simulation at a fixed 60 Hz in the browser and
 * streams the input log to the server, which replays it to verify the score.
 * The render loop only runs while actively playing.
 */
export default function Stackfall({ session }: StageProps<{ status: string }>) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const sim = useRef<Sim | null>(null);
  const pending = useRef<[number, number][]>([]);
  const held = useRef(new Map<string, Hold>());
  const taps = useRef<number[]>([]);
  const flash = useRef<{ rows: number[]; until: number }>({ rows: [], until: 0 });
  const raf = useRef(0);
  const colors = useRef<string[]>([]);
  const [ui, setUi] = useState<UiState>({ score: 0, lines: 0, level: 1, queue: [], paused: false });
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);
  const pausedRef = useRef(false);
  const { queue: send, seed } = session;

  const flush = useCallback(
    (final = false) => {
      const s = sim.current;
      if (!s) return;
      const events = pending.current;
      pending.current = [];
      const upTo = final ? s.tick + 1 : s.tick;
      void send({ type: "inputs", upTo, events });
    },
    [send],
  );

  const draw = useCallback(() => {
    const cv = canvas.current;
    const s = sim.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const cell = Number(cv.dataset.cell || 24);
    const w = cell * WIDTH;
    const h = cell * (HEIGHT - HIDDEN);
    const dark = document.documentElement.classList.contains("dark");
    ctx.fillStyle = dark ? "#16151b" : "#f7f3ea";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = dark ? "#24222c" : "#e6e0d3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 1; c < WIDTH; c++) {
      ctx.moveTo(c * cell + 0.5, 0);
      ctx.lineTo(c * cell + 0.5, h);
    }
    for (let r = 1; r < HEIGHT - HIDDEN; r++) {
      ctx.moveTo(0, r * cell + 0.5);
      ctx.lineTo(w, r * cell + 0.5);
    }
    ctx.stroke();
    if (!s) return;

    const ink = dark ? "#000" : "#17151c";
    const block = (r: number, c: number, kind: number, alpha = 1) => {
      const y = (r - HIDDEN) * cell;
      if (y < -cell) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors.current[kind];
      ctx.fillRect(c * cell + 1, y + 1, cell - 2, cell - 2);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(c * cell + 2, y + 2, cell - 4, cell - 4);
      // a small highlight notch gives each block a tactile, printed look
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(c * cell + 4, y + 4, Math.max(2, cell * 0.22), Math.max(2, cell * 0.12));
      ctx.globalAlpha = 1;
    };

    for (let r = HIDDEN; r < HEIGHT; r++) for (let c = 0; c < WIDTH; c++) {
      const v = s.cell(r, c);
      if (v) block(r, c, v - 1);
    }
    if (!s.over) {
      const ghost = s.dropRow();
      ctx.setLineDash([4, 3]);
      for (const [dr, dc] of SHAPES[s.piece.kind][s.piece.rot]) {
        const y = (ghost + dr - HIDDEN) * cell;
        ctx.strokeStyle = dark ? "#5a5566" : "#a39d8f";
        ctx.lineWidth = 2;
        ctx.strokeRect((s.piece.col + dc) * cell + 3, y + 3, cell - 6, cell - 6);
      }
      ctx.setLineDash([]);
      for (const [dr, dc] of SHAPES[s.piece.kind][s.piece.rot]) block(s.piece.row + dr, s.piece.col + dc, s.piece.kind);
    }
    const f = flash.current;
    if (f.rows.length && performance.now() < f.until) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      for (const r of f.rows) ctx.fillRect(0, (r - HIDDEN) * cell, w, cell);
    }
  }, []);

  // Palette and board sizing.
  useLayoutEffect(() => {
    const css = getComputedStyle(document.documentElement);
    colors.current = PIECE_COLORS.map((v) => css.getPropertyValue(v).trim());
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const fit = () => {
      const visible = HEIGHT - HIDDEN;
      const cell = Math.max(12, Math.floor(Math.min(el.clientHeight / visible, el.clientWidth / WIDTH)));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.style.width = `${cell * WIDTH}px`;
      cv.style.height = `${cell * visible}px`;
      cv.width = cell * WIDTH * dpr;
      cv.height = cell * visible * dpr;
      cv.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cv.dataset.cell = String(cell);
      draw();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  const syncUi = useCallback(() => {
    const s = sim.current!;
    setUi((u) => {
      const level = s.level();
      if (u.score === s.score && u.lines === s.lines && u.level === level && u.queue[0] === s.queue[0]) return u;
      return { ...u, score: s.score, lines: s.lines, level, queue: s.queue.slice(0, 3) };
    });
  }, []);

  const loop = useCallback(() => {
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      const s = sim.current;
      if (!s || s.over || pausedRef.current) return; // stops the loop entirely
      acc += Math.min(250, now - last);
      last = now;
      let steps = 0;
      while (acc >= STEP_MS && steps < 5) {
        acc -= STEP_MS;
        steps++;
        const events = taps.current.splice(0);
        for (const [, h] of held.current) {
          const age = s.tick - h.since;
          if (h.code === In.SoftDrop ? age > 0 && age % SOFT_EVERY === 0 : age >= DAS && (age - DAS) % ARR === 0) events.push(h.code);
        }
        for (const e of events) pending.current.push([s.tick, e]);
        const lines = s.lines;
        s.step(events);
        if (s.lines !== lines) flash.current = { rows: s.lastCleared, until: now + 120 };
        if (s.tick % FLUSH_TICKS === 0) flush();
        if (s.over) {
          flush(true);
          setOver(true);
          break;
        }
      }
      draw();
      syncUi();
      if (!s.over) raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, [draw, flush, syncUi]);

  const setPaused = useCallback(
    (p: boolean) => {
      if (!sim.current || sim.current.over || pausedRef.current === p) return;
      pausedRef.current = p;
      held.current.clear();
      setUi((u) => ({ ...u, paused: p }));
      if (p) {
        cancelAnimationFrame(raf.current);
        flush();
      } else loop();
    },
    [flush, loop],
  );

  // Start: tell the server once, then begin ticking.
  const starting = useRef<Promise<unknown> | null>(null);
  useEffect(() => {
    if (!seed) return;
    let live = true;
    sim.current ??= new Sim(seed);
    starting.current ??= send({ type: "start" });
    void starting.current.then(() => {
      if (!live) return;
      setStarted(true);
      syncUi();
      loop();
    });
    return () => {
      live = false;
      cancelAnimationFrame(raf.current);
    };
  }, [seed, send, loop, syncUi]);

  // Pause automatically when the tab is hidden.
  useEffect(() => {
    const onVis = () => document.hidden && setPaused(true);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [setPaused]);

  // Keyboard.
  useEffect(() => {
    const map: Record<string, number> = {
      ArrowLeft: In.Left, KeyA: In.Left,
      ArrowRight: In.Right, KeyD: In.Right,
      ArrowUp: In.RotateCW, KeyX: In.RotateCW, KeyW: In.RotateCW,
      KeyZ: In.RotateCCW, ControlLeft: In.RotateCCW,
      ArrowDown: In.SoftDrop, KeyS: In.SoftDrop,
      Space: In.HardDrop,
    };
    const repeatable = new Set<number>([In.Left, In.Right, In.SoftDrop]);
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyP" || e.code === "Escape") {
        e.preventDefault();
        setPaused(!pausedRef.current);
        return;
      }
      const code = map[e.code];
      if (!code || !sim.current || pausedRef.current) return;
      e.preventDefault();
      if (e.repeat) return;
      taps.current.push(code);
      if (repeatable.has(code)) {
        // Opposite directions cancel each other's auto-repeat.
        if (code === In.Left) {
          held.current.delete("ArrowRight");
          held.current.delete("KeyD");
        }
        if (code === In.Right) {
          held.current.delete("ArrowLeft");
          held.current.delete("KeyA");
        }
        held.current.set(e.code, { code, since: sim.current.tick });
      }
    };
    const up = (e: KeyboardEvent) => held.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [setPaused]);

  const touch = (code: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      if (!sim.current || pausedRef.current) return;
      taps.current.push(code);
      if (code === In.Left || code === In.Right || code === In.SoftDrop) held.current.set(`touch-${code}`, { code, since: sim.current.tick });
    },
    onPointerUp: () => held.current.delete(`touch-${code}`),
    onPointerLeave: () => held.current.delete(`touch-${code}`),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row md:p-6">
      <div ref={wrap} className="relative grid min-h-[320px] flex-1 place-items-center">
        <div className="relative rounded-xl border-2 border-line p-1 shadow-[4px_4px_0_var(--shadow)]">
          <canvas ref={canvas} className="block rounded-md" aria-label="Stackfall well" role="img" />
          <AnimatePresence>
            {(ui.paused || !started) && !over && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-1 grid place-items-center rounded-md bg-surface/85 text-center"
              >
                {started ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="display text-3xl">Paused</p>
                    <Button variant="accent" icon={<Play size={18} fill="currentColor" />} onClick={() => setPaused(false)}>
                      Resume
                    </Button>
                    <p className="text-xs text-ink-3">P or Esc to toggle</p>
                  </div>
                ) : (
                  <p className="display text-2xl">Get ready</p>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:w-44">
        <Hud
          className="md:flex-col"
          items={[
            { label: "Score", value: fmt(ui.score), accent: true },
            { label: "Lines", value: ui.lines },
            { label: "Level", value: ui.level },
          ]}
        />
        <div className="hidden rounded-xl border-2 border-line bg-surface p-3 md:block">
          <p className="label-caps mb-2 text-ink-3">Next</p>
          <div className="flex flex-col items-center gap-3">
            {ui.queue.map((k, i) => (
              <MiniPiece key={`${i}-${k}`} kind={k} size={i === 0 ? 16 : 11} />
            ))}
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={ui.paused ? <Play size={16} /> : <Pause size={16} />} onClick={() => setPaused(!ui.paused)} disabled={over || !started}>
          {ui.paused ? "Resume" : "Pause"}
        </Button>
      </div>

      {/* Touch controls for phones and tablets. */}
      <div className="grid grid-cols-5 gap-2 md:hidden [@media(pointer:fine)]:hidden">
        {[
          { code: In.Left, icon: <ArrowLeft />, label: "Left" },
          { code: In.SoftDrop, icon: <ArrowDown />, label: "Soft drop" },
          { code: In.RotateCW, icon: <RotateCw />, label: "Rotate" },
          { code: In.Right, icon: <ArrowRight />, label: "Right" },
          { code: In.HardDrop, icon: <ChevronsDown />, label: "Hard drop" },
        ].map((b) => (
          <button
            key={b.code}
            aria-label={b.label}
            {...touch(b.code)}
            className="grid h-14 touch-none place-items-center rounded-xl border-2 border-line bg-surface shadow-[3px_3px_0_var(--shadow)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            {b.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniPiece({ kind, size }: { kind: number; size: number }) {
  const cells = SHAPES[kind][0];
  const minR = Math.min(...cells.map((c) => c[0]));
  const maxR = Math.max(...cells.map((c) => c[0]));
  const maxC = Math.max(...cells.map((c) => c[1]));
  return (
    <svg width={(maxC + 1) * size} height={(maxR - minR + 1) * size} aria-hidden>
      {cells.map(([r, c]) => (
        <rect
          key={`${r}-${c}`}
          x={c * size + 1}
          y={(r - minR) * size + 1}
          width={size - 2}
          height={size - 2}
          rx={2}
          fill={`var(${PIECE_COLORS[kind]})`}
          stroke="var(--line)"
          strokeWidth={1.6}
        />
      ))}
    </svg>
  );
}
