import { Link, Navigate } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { Page, PageHeader, Reveal } from "../components/layout/Page";
import { GameArt } from "../components/art/GameArt";
import { Empty, Skeleton, Stat } from "../components/ui/Misc";
import { Button } from "../components/ui/Button";
import { useGames, useMe } from "../lib/queries";
import { ago, fmt } from "../lib/format";

export default function Profile() {
  const { data: me, isPending } = useMe();
  const { data: games } = useGames();
  if (isPending) return <Skeleton className="mt-6 h-64" />;
  if (!me?.user) return <Navigate to="/login" replace state={{ from: "/me" }} />;

  const stats = me.stats ?? [];
  const total = stats.reduce((a, s) => a + s.bestScore, 0);
  const plays = stats.reduce((a, s) => a + s.plays, 0);
  const wins = stats.reduce((a, s) => a + s.wins, 0);

  return (
    <Page title="Profile">
      <PageHeader eyebrow={`Member since ${new Date(me.user.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })}`} title={me.user.username} />
      <Reveal className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Overall points" value={fmt(total)} className="bg-brand text-[#17151c] [&_span]:!text-[#17151c]" />
        <Stat label="Games played" value={fmt(plays)} />
        <Stat label="Bot wins" value={fmt(wins)} />
        <Stat label="Games tried" value={`${stats.length}/${games?.length ?? 9}`} />
      </Reveal>

      {stats.length === 0 ? (
        <Reveal>
          <Empty
            icon={<Gamepad2 size={22} />}
            title="No games yet"
            body="Finish any game and your stats show up here."
            action={
              <Link to="/">
                <Button variant="primary">Browse the arcade</Button>
              </Link>
            }
          />
        </Reveal>
      ) : (
        <Reveal as="section">
          <h2 className="display-tight mb-4 text-xl">By game</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => {
              const g = games?.find((x) => x.id === s.gameId);
              if (!g) return null;
              return (
                <li key={s.gameId} data-accent={g.accent}>
                  <Link
                    to={`/play/${g.id}`}
                    className="group chunk flex flex-col overflow-hidden transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[6px_7px_0_var(--shadow)] active:translate-y-px active:shadow-none"
                  >
                    <div className="flex items-center gap-3 border-b-2 border-line bg-[var(--accent)] p-3 text-[#17151c]">
                      <GameArt id={g.id} className="size-10 rounded-lg border-2 border-[#17151c]" />
                      <div className="min-w-0 flex-1">
                        <p className="display-tight truncate">{g.title}</p>
                        <p className="text-xs font-semibold opacity-75">Played {ago(s.lastPlayedAt)}</p>
                      </div>
                      {s.rank && <span className="num rounded-lg border-2 border-[#17151c] bg-[#fffcf5] px-2 py-1 text-xs font-bold">#{s.rank}</span>}
                    </div>
                    <dl className="grid grid-cols-3 gap-2 p-3 text-center">
                      <Mini label="Best" value={fmt(s.bestScore)} />
                      <Mini label="Plays" value={fmt(s.plays)} />
                      <Mini label={g.mode === "vs-bot" ? "W-L" : "Total"} value={g.mode === "vs-bot" ? `${s.wins}-${s.losses}` : fmt(s.totalScore)} />
                    </dl>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Reveal>
      )}
    </Page>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps text-ink-3">{label}</dt>
      <dd className="num mt-0.5 font-bold">{value}</dd>
    </div>
  );
}
