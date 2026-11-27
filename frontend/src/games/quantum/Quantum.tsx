import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { TimerBar } from "../TimerBar";
import { cx, fmt } from "../../lib/format";

interface State {
  status: "ready" | "playing" | "over";
  question?: string;
  durationMs: number;
  remainingMs: number;
  correct: number;
  wrong: number;
  combo: number;
  score: number;
  lastCorrect?: boolean;
  lastAnswer?: number;
}

export default function Quantum({ session }: StageProps<State>) {
  const s = session.state!;
  const [count, setCount] = useState(3);
  const [value, setValue] = useState("");
  const [deadline, setDeadline] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const starting = useRef<ReturnType<typeof session.act> | null>(null);
  const { act } = session;

  // 3-2-1, then start the server clock (once, even if effects re-run).
  useEffect(() => {
    if (s.status !== "ready") return;
    if (count > 0) {
      const t = window.setTimeout(() => setCount((c) => c - 1), 650);
      return () => clearTimeout(t);
    }
    let live = true;
    starting.current ??= act({ type: "start" });
    void starting.current.then((r) => live && r && setDeadline(performance.now() + r.state.remainingMs));
    return () => {
      live = false;
    };
  }, [count, s.status, act]);

  // End the round when the local clock runs out; the server checks it too.
  useEffect(() => {
    if (s.status !== "playing" || !deadline) return;
    const t = window.setTimeout(() => void act({ type: "end" }), Math.max(0, deadline - performance.now()) + 50);
    return () => clearTimeout(t);
  }, [deadline, s.status, act]);

  useEffect(() => {
    if (s.status === "playing") input.current?.focus();
  }, [s.status, s.question]);

  const submit = () => {
    if (!value || s.status !== "playing") return;
    void act({ type: "answer", value: Number(value) });
    setValue("");
  };

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Score", value: fmt(s.score), accent: true },
            { label: "Combo", value: `${s.combo || 1}x` },
            { label: "Correct", value: s.correct },
          ]}
        />
      }
    >
      <div className="flex w-full max-w-lg flex-col items-center gap-6">
        <TimerBar className="w-full" totalMs={s.durationMs} endsAt={s.status === "ready" ? undefined : deadline} running={s.status === "playing" && deadline > 0} resetKey={deadline} />

        <div className="relative grid h-44 w-full place-items-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {s.status === "ready" ? (
              <m.span
                key={`count-${count}`}
                initial={{ scale: 1.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="display text-8xl"
              >
                {count || "Go"}
              </m.span>
            ) : (
              <m.span
                key={s.question ?? "done"}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 34 }}
                className="display num text-[clamp(2.6rem,9vw,4.6rem)] !font-sans"
              >
                {s.question ?? "Time"}
              </m.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {s.lastCorrect !== undefined && s.status === "playing" && (
              <m.span
                key={s.correct + s.wrong}
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 1, 0], y: -34, scale: 1 }}
                transition={{ duration: 0.9, times: [0, 0.1, 0.7, 1] }}
                className={cx("label-caps absolute top-2 rounded-lg border-2 border-line px-2.5 py-1", s.lastCorrect ? "bg-success text-white" : "bg-danger text-white")}
              >
                {s.lastCorrect ? `+${10 * (s.combo || 1)}` : `It was ${s.lastAnswer}`}
              </m.span>
            )}
          </AnimatePresence>
        </div>

        <m.form
          key={`${s.wrong}`}
          animate={s.wrong ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={input}
            inputMode="numeric"
            value={value}
            disabled={s.status !== "playing"}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9-]/g, "").slice(0, 6))}
            aria-label="Answer"
            placeholder="Answer, then Enter"
            className="num h-16 w-full rounded-[var(--radius-btn)] border-2 border-line bg-surface text-center text-3xl font-bold outline-none placeholder:text-base placeholder:font-normal focus:shadow-[4px_4px_0_var(--shadow)] disabled:opacity-50"
          />
        </m.form>
        <ComboMeter combo={s.combo || 1} />
      </div>
    </StageBody>
  );
}

function ComboMeter({ combo }: { combo: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Combo ${combo} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <m.span
          key={n}
          animate={{ scale: n === combo ? [1, 1.35, 1] : 1 }}
          transition={{ duration: 0.3 }}
          className={cx("h-2.5 w-8 rounded-full border-2 border-line transition-colors duration-200", n <= combo ? "bg-[var(--accent)]" : "bg-surface-2")}
        />
      ))}
    </div>
  );
}
