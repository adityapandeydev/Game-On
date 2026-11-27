import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight, Flame, Play, ShieldCheck, Trophy } from "lucide-react";
import { Page, Reveal } from "../components/layout/Page";
import { GameCard } from "../components/GameCard";
import { GameArt } from "../components/art/GameArt";
import { Segmented } from "../components/ui/Segmented";
import { Button } from "../components/ui/Button";
import { Skeleton } from "../components/ui/Misc";
import { useBoard, useGames, useMe } from "../lib/queries";
import { ago, fmt, fmtCompact } from "../lib/format";
import type { Game, Genre } from "../lib/types";

type Filter = "all" | Genre;
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "arcade", label: "Arcade" },
  { value: "strategy", label: "Strategy" },
  { value: "puzzle", label: "Puzzle" },
  { value: "brain", label: "Brain" },
];

export default function Home() {
  const { data: games, isPending } = useGames();
  const { data: me } = useMe();
  const [filter, setFilter] = useState<Filter>("all");

  const bestById = useMemo(() => new Map(me?.stats?.map((s) => [s.gameId, s.bestScore])), [me]);
  const featured = useMemo(() => (games ? [...games].sort((a, b) => b.playsWeek - a.playsWeek)[0] : undefined), [games]);
  const recent = useMemo(
    () => (me?.stats ?? []).slice(0, 4).flatMap((s) => {
      const g = games?.find((x) => x.id === s.gameId);
      return g ? [{ game: g, stats: s }] : [];
    }),
    [me, games],
  );
  const shown = games?.filter((g) => filter === "all" || g.genre === filter) ?? [];

  return (
    <Page>
      <Hero featured={featured} />

      {recent.length > 0 && (
        <Reveal as="section" className="mt-12">
          <SectionTitle title="Jump back in" />
          <div className="scrollbar-none -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:px-0">
            {recent.map(({ game, stats }) => (
              <Link
                key={game.id}
                to={`/play/${game.id}`}
                data-accent={game.accent}
                className="group chunk flex min-w-[240px] snap-start items-center gap-3 p-2.5 pr-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[5px_6px_0_var(--shadow)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
              >
                <GameArt id={game.id} className="size-14 shrink-0 rounded-xl border-2 border-line" />
                <div className="min-w-0 flex-1">
                  <p className="display-tight truncate">{game.title}</p>
                  <p className="text-xs text-ink-3">{ago(stats.lastPlayedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="label-caps text-ink-3">Best</p>
                  <p className="num text-sm font-bold">{fmt(stats.bestScore)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      )}

      <Reveal as="section" className="mt-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-[clamp(1.6rem,3.2vw,2.2rem)]">All games</h2>
          <Segmented options={filters} value={filter} onChange={setFilter} label="Filter by genre" size="sm" className="scrollbar-none max-w-full overflow-x-auto" />
        </div>
        <m.ul layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isPending &&
            Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <Skeleton className="aspect-[4/3.6]" />
              </li>
            ))}
          <AnimatePresence mode="popLayout" initial={false}>
            {shown.map((g, i) => (
              <m.li
                key={g.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 32, delay: i * 0.03 } }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.14 } }}
              >
                <GameCard game={g} best={bestById.get(g.id)} />
              </m.li>
            ))}
          </AnimatePresence>
        </m.ul>
      </Reveal>

      <Reveal as="section" className="mt-14">
        <TopPlayers />
      </Reveal>
    </Page>
  );
}

function Hero({ featured }: { featured?: Game }) {
  const navigate = useNavigate();
  return (
    <Reveal as="section" className="grid items-stretch gap-5 lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col justify-between gap-8 py-2 lg:py-6">
        <div>
          <p className="label-caps mb-4 inline-flex items-center gap-2 rounded-full border-2 border-line bg-surface px-3 py-1.5 text-ink-2">
            <ShieldCheck size={14} className="text-success" />
            Every score verified on the server
          </p>
          <h1 className="display text-[clamp(2.5rem,4.9vw,4.4rem)]">
            <span className="block whitespace-nowrap">Quick games.</span>
            <span className="relative inline-block whitespace-nowrap">
              Real <span className="relative isolate">
                scores.
                <span aria-hidden className="absolute inset-x-[-0.08em] bottom-[0.04em] -z-10 h-[0.34em] -rotate-1 rounded-[3px] bg-brand" />
              </span>
            </span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-2">
            Nine games you can finish on a coffee break. Outplay the bots, beat the clock, and climb boards nobody can fake.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            size="lg"
            icon={<Play size={20} fill="currentColor" />}
            onClick={() => navigate(featured ? `/play/${featured.id}` : "/play/stackfall")}
          >
            Play {featured?.title ?? "now"}
          </Button>
          <Button variant="secondary" size="lg" icon={<Trophy size={20} />} onClick={() => navigate("/leaderboards")}>
            Leaderboards
          </Button>
        </div>
      </div>

      {featured ? (
        <Link
          to={`/play/${featured.id}`}
          data-accent={featured.accent}
          className="group chunk relative flex min-h-[300px] flex-col overflow-hidden !shadow-[7px_7px_0_var(--shadow)] transition-transform duration-300 ease-[var(--ease-snap)] hover:-rotate-[0.6deg] active:scale-[0.99]"
        >
          <GameArt id={featured.id} className="absolute inset-0 size-full transition-transform duration-700 ease-[var(--ease-snap)] group-hover:scale-105" />
          <div className="relative mt-auto m-3 flex items-end justify-between gap-3 rounded-2xl border-2 border-line bg-surface p-4">
            <div className="min-w-0">
              <p className="label-caps mb-1 inline-flex items-center gap-1.5 text-ink-3">
                <Flame size={13} className="text-[var(--a-coral)]" /> {featured.playsWeek > 0 ? "Most played this week" : "Featured game"}
              </p>
              <p className="display text-3xl">{featured.title}</p>
              <p className="mt-1 truncate text-sm text-ink-2">
                {featured.playsWeek > 0 ? `${fmtCompact(featured.playsWeek)} plays this week · ` : ""}~{featured.minutes} min a game
              </p>
            </div>
            <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-line bg-[var(--accent)] text-[#17151c] transition-transform duration-300 ease-[var(--ease-out-back)] group-hover:translate-x-1">
              <ArrowRight size={22} strokeWidth={2.6} />
            </span>
          </div>
        </Link>
      ) : (
        <Skeleton className="min-h-[300px] rounded-[var(--radius-card)]" />
      )}
    </Reveal>
  );
}

function SectionTitle({ title, to, link }: { title: string; to?: string; link?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between">
      <h2 className="display text-[clamp(1.4rem,2.6vw,1.8rem)]">{title}</h2>
      {to && (
        <Link to={to} className="group inline-flex items-center gap-1 text-sm font-bold text-ink-2 hover:text-ink">
          {link}
          <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function TopPlayers() {
  const { data, isPending } = useBoard("global");
  const top = data?.slice(0, 5) ?? [];
  return (
    <>
      <SectionTitle title="Top players" to="/leaderboards" link="Full rankings" />
      <div className="chunk overflow-hidden">
        {isPending && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        )}
        {!isPending && top.length === 0 && <p className="px-5 py-8 text-center text-ink-2">No scores yet. Be the first name on the board.</p>}
        <ol>
          {top.map((e) => (
            <li key={e.userId} className="flex items-center gap-4 border-b-2 border-line-soft px-5 py-3 last:border-b-0">
              <span className={`num grid size-8 place-items-center rounded-lg border-2 border-line text-sm font-bold ${e.rank <= 3 ? "bg-brand text-[#17151c]" : "bg-surface-2"}`}>{e.rank}</span>
              <span className="flex-1 truncate font-bold">{e.username}</span>
              <span className="text-xs text-ink-3">{e.games} games</span>
              <span className="num w-24 text-right font-bold">{fmt(e.score)}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
