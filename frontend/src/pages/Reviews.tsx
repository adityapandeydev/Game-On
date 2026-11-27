import { useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { Page, PageHeader, Reveal } from "../components/layout/Page";
import { Segmented } from "../components/ui/Segmented";
import { ReviewComposer, ReviewList } from "../components/ReviewBits";
import { StarRow } from "../components/ui/Stars";
import { useGames } from "../lib/queries";

export default function Reviews() {
  const { data: games } = useGames();
  const [game, setGame] = useState("");
  const target = game || "platform";
  const options = [{ value: "", label: "All" }, { value: "platform", label: "Game-On" }, ...(games ?? []).map((g) => ({ value: g.id, label: g.title }))];
  const current = games?.find((g) => g.id === game);

  return (
    <Page title="Reviews">
      <PageHeader eyebrow="From the players" title="Reviews" />
      <Reveal className="scrollbar-none -mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Segmented look="pill" size="sm" label="Filter reviews" value={game} onChange={setGame} options={options} className="whitespace-nowrap" />
      </Reveal>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={game} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {current && current.reviews > 0 && (
              <div className="mb-4 flex items-center gap-3 text-sm text-ink-2">
                <StarRow value={current.rating} size={18} />
                <span className="num font-bold text-ink">{current.rating.toFixed(1)}</span>
                <span>from {current.reviews} review{current.reviews === 1 ? "" : "s"}</span>
              </div>
            )}
            <ReviewList game={game} />
          </m.div>
        </AnimatePresence>
        <Reveal className="lg:sticky lg:top-20">
          <h2 className="display-tight mb-3 text-xl">
            Review {game === "" || game === "platform" ? "Game-On" : current?.title}
          </h2>
          <ReviewComposer key={target} gameId={target} />
        </Reveal>
      </div>
    </Page>
  );
}
