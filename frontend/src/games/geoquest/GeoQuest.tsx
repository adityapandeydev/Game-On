import { useEffect, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Check, X } from "lucide-react";
import type { StageProps } from "../types";
import { Hud, StageBody } from "../Hud";
import { TimerBar } from "../TimerBar";
import { useKeydown } from "../../lib/hotkeys";
import { cx, fmt } from "../../lib/format";

interface State {
  round: number;
  total: number;
  question?: { country: string; region: string; choices: string[] };
  last?: { chosen: number; correct: number; right: boolean; points: number };
  correct: number;
  score: number;
  timeLimitMs: number;
  status: "playing" | "reveal" | "over";
}

const REVEAL_MS = 1150;
const regionLabel: Record<string, string> = {
  europe: "Europe",
  asia: "Asia",
  "middle-east": "Middle East",
  africa: "Africa",
  americas: "Americas",
  oceania: "Oceania",
};

export default function GeoQuest({ session }: StageProps<State>) {
  const s = session.state!;
  const [pick, setPick] = useState<{ round: number; i: number } | null>(null);
  const picked = pick?.round === s.round ? pick.i : null;
  const q = s.question;
  const revealing = s.status === "reveal" || (s.status === "over" && !!s.last);
  const { act } = session;

  // Advance after the reveal beat; the next question's clock starts on the server only then.
  useEffect(() => {
    if (s.status !== "reveal") return;
    const t = window.setTimeout(() => void act({ type: "next" }), REVEAL_MS);
    return () => clearTimeout(t);
  }, [s.status, s.round, act]);

  // The client timer is cosmetic; the server enforces the limit.
  useEffect(() => {
    if (s.status !== "playing") return;
    const t = window.setTimeout(() => void act({ type: "timeout" }), s.timeLimitMs + 150);
    return () => clearTimeout(t);
  }, [s.status, s.round, s.timeLimitMs, act]);

  const answer = (i: number) => {
    if (s.status !== "playing" || session.busy) return;
    setPick({ round: s.round, i });
    void session.act({ type: "answer", choice: i });
  };
  useKeydown((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= 4) answer(n - 1);
  });

  return (
    <StageBody
      hud={
        <Hud
          items={[
            { label: "Question", value: `${Math.min(s.round, s.total)}/${s.total}` },
            { label: "Correct", value: s.correct },
            { label: "Score", value: fmt(s.score), accent: true },
          ]}
        />
      }
    >
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex gap-1.5">
          {Array.from({ length: s.total }, (_, i) => (
            <span
              key={i}
              className={cx(
                "h-2 flex-1 rounded-full border-2 border-line transition-colors duration-300",
                i < s.round - 1 || (i === s.round - 1 && revealing) ? "bg-ink" : i === s.round - 1 ? "bg-[var(--accent)]" : "bg-surface-2",
              )}
            />
          ))}
        </div>

        {q && (
          <>
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={s.round}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="text-center"
              >
                <p className="label-caps text-ink-3">{regionLabel[q.region]} · What is the capital of</p>
                <p className="display mt-2 text-[clamp(2rem,6vw,3.4rem)]">{q.country}</p>
              </m.div>
            </AnimatePresence>
            <TimerBar totalMs={s.timeLimitMs} running={s.status === "playing"} resetKey={s.round} />
            <div className="grid gap-3 sm:grid-cols-2">
              {q.choices.map((c, i) => {
                const isRight = revealing && s.last?.correct === i;
                const isWrong = revealing && s.last?.chosen === i && !s.last.right;
                return (
                  <m.button
                    key={`${s.round}-${c}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isWrong ? { opacity: 1, y: 0, x: [0, -6, 6, -3, 0] } : { opacity: 1, y: 0 }}
                    transition={{ delay: isWrong ? 0 : i * 0.04, duration: isWrong ? 0.35 : undefined }}
                    onClick={() => answer(i)}
                    disabled={s.status !== "playing"}
                    className={cx(
                      "group flex h-16 items-center gap-3 rounded-[14px] border-2 border-line px-4 text-left font-bold transition-[transform,box-shadow,background-color] duration-150",
                      "bg-surface shadow-[3px_3px_0_var(--shadow)] enabled:hover:-translate-y-0.5 enabled:active:translate-x-[3px] enabled:active:translate-y-[3px] enabled:active:shadow-none",
                      picked === i && !revealing && "bg-surface-2",
                      isRight && "!bg-success text-white",
                      isWrong && "!bg-danger text-white",
                      revealing && !isRight && !isWrong && "opacity-55",
                    )}
                  >
                    <span className="num grid size-7 shrink-0 place-items-center rounded-md border-2 border-current/40 text-xs">{i + 1}</span>
                    <span className="flex-1">{c}</span>
                    {isRight && <Check size={20} />}
                    {isWrong && <X size={20} />}
                  </m.button>
                );
              })}
            </div>
            <p className="h-5 text-center text-sm font-bold text-ink-2">
              {revealing && s.last && (s.last.right ? `Correct, +${s.last.points}` : s.last.chosen < 0 ? "Out of time" : "Not quite")}
            </p>
          </>
        )}
      </div>
    </StageBody>
  );
}
