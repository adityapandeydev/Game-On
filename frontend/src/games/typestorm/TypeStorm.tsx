import { useEffect, useMemo, useRef, useState } from "react";
import { m } from "motion/react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { clock, cx } from "../../lib/format";

interface State {
  passage: string;
  timeLimitMs: number;
  status: "ready" | "typing" | "over";
  timedOut: boolean;
  rejected?: string;
  wpm: number;
  accuracy: number;
  mistakeWords: string[];
}

interface WordStat {
  ms: number;
  mistakes: number;
}

/**
 * Word-lock typing (from TypeGauge): you can't move past a mistake until it's
 * fixed, so the finished text always equals the passage. Unlike the original,
 * the whole word prefix is checked (so caret edits mid-word are caught), every
 * wrong keystroke counts once, and timing is verified by the server.
 */
export default function TypeStorm({ session }: StageProps<State>) {
  const s = session.state!;
  const words = useMemo(() => s.passage.split(" "), [s.passage]);
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null);
  const stats = useRef<WordStat[]>([]);
  const wordStart = useRef(0);
  const wordMistakes = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const { act, queue } = session;
  const done = s.status === "over";

  useEffect(() => input.current?.focus(), []);

  // One tick per second while typing, for the countdown and live speed only.
  useEffect(() => {
    if (startAt === null || done) return;
    const id = window.setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, [startAt, done]);

  const elapsed = startAt === null ? 0 : (endAt ?? now) - startAt;
  const remaining = s.timeLimitMs - elapsed;

  useEffect(() => {
    if (startAt !== null && !done && remaining <= 0) void act({ type: "timeout" });
  }, [remaining, startAt, done, act]);

  const target = index < words.length - 1 ? words[index] + " " : words[index];
  const typedChars = words.slice(0, index).join(" ").length + (index > 0 ? 1 : 0);
  const correctPrefix = target?.startsWith(typed) ?? true;
  const liveWpm = startAt && elapsed > 2000 ? Math.round((typedChars / 5) / (elapsed / 60000)) : 0;

  const onChange = (value: string) => {
    if (done || !target) return;
    const t = performance.now();
    if (startAt === null) {
      setStartAt(t);
      setNow(t);
      wordStart.current = t;
      void queue({ type: "start" });
    }
    // Every keystroke that lands on (or extends) a wrong prefix is one mistake.
    if (value.length > typed.length && !target.startsWith(value)) {
      wordMistakes.current++;
      setMistakes((m) => m + 1);
    }
    if (value === target) {
      stats.current.push({ ms: Math.round(t - wordStart.current), mistakes: wordMistakes.current });
      wordStart.current = t;
      wordMistakes.current = 0;
      setTyped("");
      if (index === words.length - 1) {
        setIndex(words.length);
        setEndAt(t);
        void act({ type: "finish", words: stats.current });
      } else {
        setIndex(index + 1);
      }
      return;
    }
    setTyped(value);
  };

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Time", value: startAt === null ? clock(s.timeLimitMs) : clock(Math.max(0, remaining)), accent: true },
            { label: "WPM", value: done ? Math.round(s.wpm) : liveWpm },
            { label: "Mistakes", value: mistakes },
          ]}
        />
      }
    >
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <Track progress={typedChars / s.passage.length} done={done} />

        <div
          className="chunk-flat relative cursor-text p-5 text-[clamp(1.1rem,2.4vw,1.45rem)] leading-[1.75] md:p-7"
          onClick={() => input.current?.focus()}
          aria-hidden
        >
          {words.map((w, i) => {
            const isCurrent = i === index;
            const text = i < words.length - 1 ? w + " " : w;
            if (i < index) return <span key={i} className="text-ink">{text}</span>;
            if (!isCurrent) return <span key={i} className="text-ink-3">{text}</span>;
            // Current word: correct part, wrong part, caret, rest.
            let ok = 0;
            while (ok < typed.length && typed[ok] === text[ok]) ok++;
            const wrong = typed.length - ok;
            return (
              <span key={i} className="relative">
                <span className="text-ink underline decoration-[var(--accent)] decoration-3 underline-offset-4">{text.slice(0, ok)}</span>
                {wrong > 0 && <span className="rounded-sm bg-danger/30 text-danger">{text.slice(ok, ok + wrong) || " "}</span>}
                <span className="relative">
                  {/* A solid caret: no blink loop running in the background. */}
                  <span className="absolute top-[0.18em] bottom-[0.18em] -left-px w-[3px] rounded-full bg-ink" />
                  <span className="text-ink-2">{text.slice(ok + wrong)}</span>
                </span>
              </span>
            );
          })}
        </div>

        <input
          ref={input}
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          disabled={done}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Type the passage here"
          placeholder={startAt === null ? "Start typing to begin the clock" : ""}
          className={cx(
            "num h-14 w-full rounded-[var(--radius-btn)] border-2 bg-surface px-4 text-lg outline-none transition-[border-color,box-shadow,background-color] focus:shadow-[3px_3px_0_var(--shadow)]",
            correctPrefix ? "border-line" : "border-danger bg-danger/10",
          )}
        />

        {done && s.rejected && <p className="rounded-xl border-2 border-danger bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">Not counted: {s.rejected}.</p>}
        {done && !s.rejected && (
          <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 sm:grid-cols-[auto_1fr]">
            <div className="flex gap-2">
              <ResultStat label="WPM" value={s.timedOut ? "—" : String(Math.round(s.wpm))} />
              <ResultStat label="Accuracy" value={s.timedOut ? "—" : `${s.accuracy}%`} />
            </div>
            {s.mistakeWords.length > 0 && (
              <div className="rounded-xl border-2 border-line-soft p-3">
                <p className="label-caps mb-1.5 text-ink-3">Words to practise</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.mistakeWords.map((w) => (
                    <span key={w} className="num rounded-md bg-danger/15 px-2 py-0.5 text-sm font-semibold text-danger">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </m.div>
        )}
      </div>
    </StageBody>
  );
}

function Track({ progress, done }: { progress: number; done: boolean }) {
  return (
    <div className="relative h-10">
      <div className="absolute inset-x-0 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-line-soft" />
      <span className="label-caps absolute top-1/2 right-0 -translate-y-1/2 rounded-md border-2 border-line bg-surface px-1.5 py-0.5 text-ink-3">Finish</span>
      <m.div
        className="absolute top-1/2 left-0 -translate-y-1/2"
        animate={{ left: `calc(${Math.min(1, progress) * 100}% - ${Math.min(1, progress) * 64}px)` }}
        transition={{ type: "spring", stiffness: 200, damping: 26 }}
      >
        <span className={cx("grid h-9 w-14 place-items-center rounded-xl border-2 border-line text-xs font-bold text-[#17151c] shadow-[2px_2px_0_var(--shadow)]", done ? "bg-success text-white" : "bg-[var(--accent)]")}>
          {Math.round(progress * 100)}%
        </span>
      </m.div>
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-line bg-surface px-4 py-2">
      <p className="label-caps text-ink-3">{label}</p>
      <p className="num text-2xl font-bold">{value}</p>
    </div>
  );
}
