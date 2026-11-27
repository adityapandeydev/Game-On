import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { Button } from "../../components/ui/Button";
import { cx } from "../../lib/format";

interface Guess {
  value: number;
  hint: "higher" | "lower" | "correct";
}
interface State {
  min: number;
  max: number;
  low: number;
  high: number;
  remaining: number;
  allowed: number;
  history: Guess[];
  status: "playing" | "won" | "lost";
  secret?: number;
}

export default function GuessNumber({ session }: StageProps<State>) {
  const s = session.state!;
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const playing = s.status === "playing";
  const last = s.history.at(-1);

  useEffect(() => {
    if (playing && !session.busy) input.current?.focus();
  }, [playing, session.busy]);

  const submit = () => {
    const v = Number(value);
    if (!value || !Number.isInteger(v) || v < s.min || v > s.max) {
      setShake((x) => x + 1);
      return;
    }
    setValue("");
    void session.act({ type: "guess", value: v });
  };

  const span = s.max - s.min + 1;
  const left = ((s.low - s.min) / span) * 100;
  const width = ((s.high - s.low + 1) / span) * 100;

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Guesses left", value: s.remaining, accent: true },
            { label: "Range", value: `${s.min}-${s.max}` },
          ]}
        />
      }
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-7">
        <div className="relative grid h-36 w-36 place-items-center rounded-[28px] border-2 border-line bg-surface shadow-[6px_6px_0_var(--shadow)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.span
              key={s.secret ?? last?.value ?? "q"}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              exit={{ rotateX: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
              className={cx("display text-6xl", s.status === "won" && "text-success", s.status === "lost" && "text-danger")}
            >
              {s.secret ?? (last ? last.value : "?")}
            </m.span>
          </AnimatePresence>
          <AnimatePresence>
            {last && playing && (
              <m.span
                key={s.history.length}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 18 }}
                className="label-caps absolute -right-4 -bottom-3 inline-flex items-center gap-1 rounded-lg border-2 border-line bg-[var(--accent)] px-2 py-1.5 text-[#17151c] shadow-[2px_2px_0_var(--shadow)]"
              >
                {last.hint === "higher" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {last.hint}
              </m.span>
            )}
          </AnimatePresence>
        </div>

        {/* The remaining possible range narrows as you guess. */}
        <div className="w-full">
          <div className="relative h-5 rounded-full border-2 border-line bg-surface-2">
            <m.div
              className="absolute inset-y-0 rounded-full bg-[var(--accent)]"
              animate={{ left: `${left}%`, width: `${width}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            />
          </div>
          <div className="num mt-1.5 flex justify-between text-xs font-bold text-ink-2">
            <span>{s.low}</span>
            <span className="text-ink-3">still possible</span>
            <span>{s.high}</span>
          </div>
        </div>

        {playing && (
          <m.form
            key={shake}
            animate={shake ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
            transition={{ duration: 0.35 }}
            className="flex w-full max-w-sm gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              ref={input}
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder={`${s.min}-${s.max}`}
              aria-label="Your guess"
              className="num h-14 min-w-0 flex-1 rounded-[var(--radius-btn)] border-2 border-line bg-surface px-4 text-center text-2xl font-bold outline-none focus:shadow-[3px_3px_0_var(--shadow)]"
            />
            <Button type="submit" variant="accent" size="lg" status={session.busy ? "loading" : "idle"} icon={<Check size={20} />}>
              Guess
            </Button>
          </m.form>
        )}

        <ol className="flex flex-wrap justify-center gap-2">
          {s.history.map((g, i) => (
            <m.li
              key={i}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cx(
                "num inline-flex items-center gap-1 rounded-lg border-2 px-2 py-1 text-sm font-bold",
                g.hint === "correct" ? "border-line bg-success text-white" : "border-line-soft bg-surface",
              )}
            >
              {g.value}
              {g.hint === "higher" && <ArrowUp size={13} className="text-ink-3" />}
              {g.hint === "lower" && <ArrowDown size={13} className="text-ink-3" />}
            </m.li>
          ))}
        </ol>
      </div>
    </StageBody>
  );
}
