import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";
import { Dices, Hand } from "lucide-react";
import type { StageProps } from "../types";
import { StageBody } from "../Hud";
import { Button } from "../../components/ui/Button";
import { useKeydown } from "../../lib/hotkeys";
import { cx } from "../../lib/format";

interface BotStep {
  roll?: number;
  hold?: boolean;
}
interface State {
  you: number;
  bot: number;
  turnTotal: number;
  lastRoll?: number;
  busted: boolean;
  botTurn: BotStep[];
  status: "playing" | "won" | "lost";
}

const GOAL = 100;
const STEP_MS = 520;

export default function Pig({ session }: StageProps<State>) {
  const s = session.state!;
  const [die, setDie] = useState<{ value: number; spin: number; who: "you" | "bot" }>({ value: 1, spin: 0, who: "you" });
  const [botScore, setBotScore] = useState(s.bot);
  const [botTotal, setBotTotal] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const [note, setNote] = useState("Your turn. Roll to start.");
  const seen = useRef<State | null>(null);

  // Animate each server response as a timeline: your roll first, then the bot's turn step by step.
  useEffect(() => {
    if (s === seen.current) return;
    const prevBot = seen.current?.bot ?? 0;
    seen.current = s;
    const events: [number, () => void][] = [];
    if (s.lastRoll) {
      const roll = s.lastRoll;
      events.push([0, () => {
        setDie((d) => ({ value: roll, spin: d.spin + 1, who: "you" }));
        setNote(s.busted ? "Rolled a one. Turn lost." : s.status === "won" ? "That's the game." : `+${roll}. Roll again or hold.`);
      }]);
    }
    const steps = s.botTurn ?? [];
    if (steps.length === 0) {
      events.push([0, () => setBotScore(s.bot)]);
    } else {
      const lead = s.lastRoll ? 650 : 200;
      events.push([0, () => setReplaying(true)]);
      let running = 0;
      steps.forEach((step, i) => {
        if (step.roll) {
          const roll = step.roll;
          running = roll === 1 ? 0 : running + roll;
          const total = running;
          events.push([lead + i * STEP_MS, () => {
            setDie((d) => ({ value: roll, spin: d.spin + 1, who: "bot" }));
            setBotTotal(total);
            setNote(roll === 1 ? "Bot rolled a one." : `Bot rolls ${roll}.`);
          }]);
        } else if (step.hold) {
          const total = running;
          events.push([lead + i * STEP_MS, () => setNote(`Bot holds ${total}.`)]);
        }
      });
      events.push([lead + steps.length * STEP_MS + 200, () => {
        setBotScore(s.bot);
        setBotTotal(0);
        setReplaying(false);
        if (s.status === "playing") setNote(s.bot > prevBot ? "Your turn." : "Your turn. The bot got nothing.");
      }]);
    }
    const timers = events.map(([at, fn]) => window.setTimeout(fn, at));
    return () => timers.forEach(clearTimeout);
  }, [s]);

  const canAct = s.status === "playing" && !replaying && !session.busy;
  useKeydown((e) => {
    if (!canAct) return;
    if (e.key === "r" || e.key === "R") void session.act({ type: "roll" });
    if ((e.key === "h" || e.key === "H") && s.turnTotal > 0) void session.act({ type: "hold" });
  });

  return (
    <StageBody>
      <div className="flex w-full max-w-2xl flex-col items-center gap-6">
        <div className="grid w-full grid-cols-2 gap-3">
          <Player name="You" score={s.you} turn={replaying ? 0 : s.turnTotal} active={!replaying && s.status === "playing"} accent />
          <Player name="Bot" score={botScore} turn={botTotal} active={replaying} />
        </div>

        <m.div
          key={die.spin}
          initial={die.spin ? { rotate: -200, scale: 0.6, y: -30 } : false}
          animate={{ rotate: 0, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 16 }}
          className={cx(
            "grid size-28 place-items-center rounded-[26px] border-2 border-line shadow-[5px_5px_0_var(--shadow)]",
            die.who === "you" ? "bg-[var(--accent)]" : "bg-surface",
            die.value === 1 && die.spin > 0 && "!bg-danger",
          )}
          aria-label={`Die shows ${die.value}`}
        >
          <DieFace n={die.value} />
        </m.div>
        <p className="h-6 text-center font-bold text-ink-2" aria-live="polite">
          {note}
        </p>

        <div className="flex gap-3">
          <Button variant="accent" size="lg" icon={<Dices size={20} />} onClick={() => void session.act({ type: "roll" })} disabled={!canAct} status={session.busy ? "loading" : "idle"}>
            Roll
          </Button>
          <Button variant="secondary" size="lg" icon={<Hand size={20} />} onClick={() => void session.act({ type: "hold" })} disabled={!canAct || s.turnTotal === 0}>
            Hold {s.turnTotal > 0 && !replaying ? s.turnTotal : ""}
          </Button>
        </div>
        <p className="text-xs text-ink-3">R to roll · H to hold · first to {GOAL}</p>
      </div>
    </StageBody>
  );
}

function Player({ name, score, turn, active, accent }: { name: string; score: number; turn: number; active: boolean; accent?: boolean }) {
  return (
    <div className={cx("rounded-2xl border-2 border-line p-4 transition-[transform,box-shadow] duration-300", active ? "-translate-y-1 bg-surface shadow-[4px_5px_0_var(--shadow)]" : "bg-surface-2")}>
      <div className="flex items-baseline justify-between">
        <p className="display-tight text-lg">{name}</p>
        {turn > 0 && <span className="num text-sm font-bold text-ink-2">+{turn}</span>}
      </div>
      <p className="display mt-1 text-5xl">{score}</p>
      <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-line bg-surface-3">
        <m.div
          className={cx("h-full origin-left", accent ? "bg-[var(--accent)]" : "bg-ink-2")}
          animate={{ scaleX: Math.min(1, score / GOAL) }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
        />
      </div>
    </div>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

function DieFace({ n }: { n: number }) {
  return (
    <svg viewBox="0 0 100 100" className="size-[78%]" aria-hidden>
      {PIPS[n].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="9" fill="#17151c" />
      ))}
    </svg>
  );
}
