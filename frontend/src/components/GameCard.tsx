import { Link } from "react-router-dom";
import { Bot, Clock3, Play, UserRound } from "lucide-react";
import { GameArt } from "./art/GameArt";
import { StarRow } from "./ui/Stars";
import { cx, fmtCompact } from "../lib/format";
import type { Game } from "../lib/types";

const genreLabel = { strategy: "Strategy", puzzle: "Puzzle", arcade: "Arcade", brain: "Brain" } as const;

/**
 * A game "cartridge". All hover and press motion is CSS transforms on the
 * compositor; nothing here runs JavaScript per frame.
 */
export function GameCard({ game, best, className }: { game: Game; best?: number; className?: string }) {
  return (
    <Link
      to={`/play/${game.id}`}
      data-accent={game.accent}
      className={cx(
        "group chunk flex h-full flex-col overflow-hidden",
        "transition-[transform,box-shadow] duration-200 ease-[var(--ease-snap)]",
        "hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-[6px_7px_0_var(--shadow)]",
        "active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--shadow)] active:duration-75",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-line">
        <GameArt id={game.id} className="size-full transition-transform duration-500 ease-[var(--ease-snap)] group-hover:scale-[1.06]" />
        <span className="label-caps absolute top-3 left-3 rounded-lg border-2 border-line bg-surface px-2 py-1 text-ink">{genreLabel[game.genre]}</span>
        <span className="absolute right-3 bottom-3 grid size-11 translate-y-2 scale-90 place-items-center rounded-full border-2 border-[#17151c] bg-[#17151c] text-[var(--accent)] opacity-0 transition-[transform,opacity] duration-200 ease-[var(--ease-out-back)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Play size={18} fill="currentColor" className="translate-x-px" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="display-tight text-xl">{game.title}</h3>
          {best ? <span className="num shrink-0 text-xs font-bold text-ink-2">Best {fmtCompact(best)}</span> : null}
        </div>
        <p className="text-sm leading-snug text-ink-2">{game.tagline}</p>
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs font-semibold text-ink-3">
          <span className="inline-flex items-center gap-1">
            {game.mode === "vs-bot" ? <Bot size={14} /> : <UserRound size={14} />}
            {game.mode === "vs-bot" ? "vs bot" : "solo"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 size={14} />~{game.minutes} min
          </span>
          {game.reviews > 0 ? (
            <span className="ml-auto inline-flex items-center gap-1.5">
              <StarRow value={game.rating} size={12} />
              <span className="num">{game.rating.toFixed(1)}</span>
            </span>
          ) : (
            <span className="ml-auto num">{fmtCompact(game.playsWeek)} plays/wk</span>
          )}
        </div>
      </div>
    </Link>
  );
}
