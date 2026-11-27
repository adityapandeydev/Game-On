import { m } from "motion/react";
import { Trophy } from "lucide-react";
import { Empty, Skeleton } from "./ui/Misc";
import { ago, cx, fmt } from "../lib/format";
import type { BoardEntry } from "../lib/types";

const medal = ["bg-[var(--a-amber)]", "bg-[#d6d3cc]", "bg-[#e7a977]"];

/** Ranked list; rows cascade in once when the data arrives. */
export function BoardList({ entries, loading, meId, compact }: { entries?: BoardEntry[]; loading: boolean; meId?: number; compact?: boolean }) {
  if (loading)
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    );
  if (!entries?.length) return <Empty icon={<Trophy size={22} />} title="No scores yet" body="Finish a game while signed in and you'll be first on this board." />;
  return (
    <ol className="space-y-1.5">
      {entries.map((e, i) => (
        <m.li
          key={e.userId}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i, 12) * 0.025, type: "spring", stiffness: 420, damping: 32 }}
          className={cx(
            "flex items-center gap-3 rounded-xl border-2 px-2.5 py-2",
            e.userId === meId ? "border-line bg-brand/25" : "border-transparent odd:bg-surface-2/60",
          )}
        >
          <span className={cx("num grid size-7 shrink-0 place-items-center rounded-lg border-2 border-line text-xs font-bold text-[#17151c]", medal[e.rank - 1] ?? "bg-surface")}>
            {e.rank}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">
              {e.username}
              {e.userId === meId && <span className="ml-1.5 text-xs font-semibold text-ink-3">you</span>}
            </span>
            {!compact && <span className="block text-xs text-ink-3">{e.games ? `${e.games} games · ` : ""}{ago(e.at)}</span>}
          </span>
          <span className="num text-sm font-bold">{fmt(e.score)}</span>
        </m.li>
      ))}
    </ol>
  );
}
