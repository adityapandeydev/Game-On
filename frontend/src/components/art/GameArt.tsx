import type { GameId } from "../../lib/types";

const INK = "#17151c";
const PAPER = "#fffcf5";
const SHADE = "rgba(23,21,28,0.16)";
const S = { stroke: INK, strokeWidth: 3, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/**
 * Hand-built geometric illustration per game, drawn on the game's accent
 * colour. Static SVG: crisp at any size and a few hundred bytes each.
 */
export function GameArt({ id, className }: { id: GameId; className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="160" height="100" fill="var(--accent)" />
      <g>{art[id]}</g>
    </svg>
  );
}

const block = (x: number, y: number, fill: string, key?: string | number) => (
  <rect key={key ?? `${x}-${y}`} x={x} y={y} width="14" height="14" rx="2.5" fill={fill} {...S} strokeWidth={2.5} />
);

const art: Record<GameId, React.ReactNode> = {
  stackfall: (
    <>
      <path d="M48 12v80h64V12" fill={SHADE} {...S} />
      {/* settled stack */}
      {[
        [50, 76, PAPER], [64, 76, PAPER], [78, 76, INK], [92, 76, PAPER],
        [50, 62, INK], [64, 62, PAPER], [92, 62, PAPER],
        [50, 48, PAPER], [92, 48, INK],
      ].map(([x, y, f]) => block(x as number, y as number, f as string))}
      {/* falling T piece */}
      {block(71, 22, INK, "t1")}
      {block(85, 22, INK, "t2")}
      {block(57, 22, INK, "t3")}
      {block(71, 36, INK, "t4")}
      <path d="M78 6v8M72 9l6 6 6-6" fill="none" {...S} strokeWidth={2.5} />
    </>
  ),
  "drop-four": (
    <>
      <rect x="30" y="24" width="100" height="70" rx="8" fill={PAPER} {...S} />
      {[0, 1, 2, 3, 4].map((c) =>
        [0, 1, 2].map((r) => {
          const filled = (r === 2 && c < 4) || (r === 1 && (c === 1 || c === 3)) || (r === 0 && c === 2);
          const ink = (r + c) % 2 === 0;
          return (
            <circle key={`${c}-${r}`} cx={46 + c * 17} cy={44 + r * 19} r="6.5" fill={filled ? (ink ? INK : "var(--accent)") : SHADE} {...S} strokeWidth={2.5} />
          );
        }),
      )}
      <circle cx="114" cy="12" r="6.5" fill={INK} {...S} strokeWidth={2.5} />
      <path d="M114 22v6" {...S} strokeWidth={2.5} />
    </>
  ),
  "tic-tac-toe": (
    <>
      <g {...S} strokeWidth={4}>
        <path d="M66 18v66M94 18v66M44 40h72M44 62h72" />
      </g>
      <g {...S} strokeWidth={5}>
        <path d="M49 23l12 12M61 23l-12 12" />
        <path d="M77 45l12 12M89 45l-12 12" />
        <path d="M105 67l12 12M117 67l-12 12" />
      </g>
      <circle cx="111" cy="29" r="7" fill="none" {...S} strokeWidth={5} />
      <circle cx="55" cy="73" r="7" fill="none" {...S} strokeWidth={5} />
      <path d="M44 18l78 66" stroke={PAPER} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  "sliding-puzzle": (
    <>
      <rect x="46" y="10" width="68" height="80" rx="8" fill={SHADE} {...S} />
      {[1, 2, 3, 4, 5, 6, 7, 0, 8].map((n, i) => {
        if (n === 0) return null;
        const x = 52 + (i % 3) * 20 + (n === 8 ? -6 : 0);
        const y = 16 + Math.floor(i / 3) * 24;
        return (
          <g key={n}>
            <rect x={x} y={y} width="17" height="21" rx="3" fill={n === 8 ? INK : PAPER} {...S} strokeWidth={2.5} />
            <text x={x + 8.5} y={y + 15} textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)" fill={n === 8 ? PAPER : INK}>
              {n}
            </text>
          </g>
        );
      })}
      <path d="M122 76h14M131 71l5 5-5 5" fill="none" {...S} strokeWidth={2.5} />
    </>
  ),
  typestorm: (
    <>
      <rect x="22" y="44" width="116" height="44" rx="8" fill={SHADE} {...S} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={28 + i * 18} y="50" width="14" height="14" rx="3" fill={i === 2 ? INK : PAPER} {...S} strokeWidth={2.5} />
      ))}
      <rect x="46" y="68" width="68" height="14" rx="3" fill={PAPER} {...S} strokeWidth={2.5} />
      <path d="M86 6L70 26h12l-6 14 18-22H82l4-12z" fill={PAPER} {...S} strokeWidth={2.5} />
      <path d="M30 22h28M30 31h20M104 22h26M110 31h20" {...S} strokeWidth={3} />
    </>
  ),
  "geo-quest": (
    <>
      <circle cx="80" cy="54" r="34" fill={PAPER} {...S} />
      <ellipse cx="80" cy="54" rx="14" ry="34" fill="none" {...S} strokeWidth={2.5} />
      <path d="M46 54h68M51 37h58M51 71h58" fill="none" {...S} strokeWidth={2.5} />
      <path d="M104 8c-8 0-13 6-13 12 0 9 13 21 13 21s13-12 13-21c0-6-5-12-13-12z" fill={INK} {...S} />
      <circle cx="104" cy="20" r="4" fill="var(--accent)" />
    </>
  ),
  "quantum-guess": (
    <>
      {[
        [26, 22, "7", PAPER], [58, 22, "×", INK], [90, 22, "8", PAPER],
        [42, 56, "=", INK], [74, 56, "56", PAPER],
      ].map(([x, y, t, f]) => (
        <g key={`${x}-${y}`}>
          <rect x={x as number} y={y as number} width={t === "56" ? 44 : 28} height="28" rx="5" fill={f as string} {...S} strokeWidth={2.5} />
          <text x={(x as number) + (t === "56" ? 22 : 14)} y={(y as number) + 20} textAnchor="middle" fontSize="17" fontWeight="800" fontFamily="var(--font-mono)" fill={f === INK ? PAPER : INK}>
            {t}
          </text>
        </g>
      ))}
      <circle cx="132" cy="30" r="12" fill="none" {...S} />
      <path d="M132 23v7l5 3" fill="none" {...S} strokeWidth={2.5} />
    </>
  ),
  "guess-number": (
    <>
      <rect x="56" y="18" width="48" height="64" rx="8" fill={PAPER} {...S} />
      <text x="80" y="66" textAnchor="middle" fontSize="44" fontWeight="900" fontFamily="var(--font-sans)" fill={INK}>
        ?
      </text>
      <path d="M30 46l10-12 10 12M40 34v26" fill="none" {...S} />
      <path d="M110 54l10 12 10-12M120 66V40" fill="none" {...S} />
    </>
  ),
  pig: (
    <>
      <g transform="rotate(-12 58 52)">
        <rect x="34" y="28" width="48" height="48" rx="10" fill={PAPER} {...S} />
        {[[46, 40], [70, 40], [58, 52], [46, 64], [70, 64]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill={INK} />
        ))}
      </g>
      <g transform="rotate(14 106 56)">
        <rect x="84" y="34" width="44" height="44" rx="10" fill={INK} {...S} />
        <circle cx="106" cy="56" r="5" fill={PAPER} />
      </g>
      <path d="M118 16l4 8M130 24l-8 2M108 14l2 9" fill="none" {...S} strokeWidth={2.5} />
    </>
  ),
};
