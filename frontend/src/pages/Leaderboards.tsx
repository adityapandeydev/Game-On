import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Crown } from "lucide-react";
import { Page, PageHeader, Reveal } from "../components/layout/Page";
import { Segmented } from "../components/ui/Segmented";
import { BoardList } from "../components/BoardList";
import { useBoard, useGames, useMe } from "../lib/queries";
import { cx, fmt } from "../lib/format";
import type { BoardEntry, GameId } from "../lib/types";

export default function Leaderboards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: games } = useGames();
  const board = (games?.some((g) => g.id === id) ? id : "global") as GameId | "global";
  const { data, isPending } = useBoard(board);
  const { data: me } = useMe();
  const game = games?.find((g) => g.id === board);

  const options = [{ value: "global", label: "Overall" }, ...(games ?? []).map((g) => ({ value: g.id, label: g.title }))];

  return (
    <Page title="Leaderboards">
      <PageHeader eyebrow="Server-verified" title="Leaderboards" />
      <Reveal className="scrollbar-none -mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Segmented
          look="pill"
          label="Board"
          size="sm"
          value={board}
          onChange={(v) => navigate(v === "global" ? "/leaderboards" : `/leaderboards/${v}`, { replace: true })}
          options={options}
          className="whitespace-nowrap"
        />
      </Reveal>

      <AnimatePresence mode="wait" initial={false}>
        <m.div key={board} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} data-accent={game?.accent ?? "lime"}>
          <p className="mb-6 max-w-xl text-ink-2">
            {board === "global" ? "Everyone ranked by the sum of their best score on each game." : `Best single scores on ${game?.title}. Ties go to whoever got there first.`}
          </p>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <Podium entries={data?.slice(0, 3)} loading={isPending} />
            <div className="chunk p-3">
              <BoardList entries={data} loading={isPending} meId={me?.user?.id} />
            </div>
          </div>
        </m.div>
      </AnimatePresence>
    </Page>
  );
}

const order = [1, 0, 2]; // silver, gold, bronze left to right
const heights = ["h-40", "h-28", "h-20"];

function Podium({ entries, loading }: { entries?: BoardEntry[]; loading: boolean }) {
  return (
    <div className="chunk flex h-80 items-end justify-center gap-3 overflow-hidden bg-[var(--accent)] px-5 pt-6">
      {order.map((slot, i) => {
        const e = entries?.[slot];
        return (
          <div key={slot} className="flex w-1/3 max-w-40 flex-col items-center gap-2">
            <AnimatePresence>
              {e && (
                <m.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="flex w-full flex-col items-center text-center text-[#17151c]"
                >
                  {slot === 0 && <Crown size={22} className="mb-0.5" />}
                  <span className="display-tight w-full truncate">{e.username}</span>
                  <span className="num text-xs font-bold opacity-80">{fmt(e.score)}</span>
                </m.div>
              )}
            </AnimatePresence>
            <m.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: loading ? 0.15 : e ? 1 : 0.3 }}
              transition={{ type: "spring", stiffness: 220, damping: 22, delay: i * 0.08 }}
              style={{ transformOrigin: "bottom" }}
              className={cx("display grid w-full place-items-start justify-center rounded-t-xl border-2 border-b-0 border-[#17151c] bg-[#fffcf5] pt-2 text-3xl text-[#17151c]", heights[slot])}
            >
              {slot + 1}
            </m.div>
          </div>
        );
      })}
    </div>
  );
}
