import { useEffect, type ReactNode } from "react";
import { m, type Variants } from "motion/react";
import { cx } from "../../lib/format";

const page: Variants = {
  initial: { opacity: 0, y: 14 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.9, 0.1, 1], staggerChildren: 0.045, delayChildren: 0.04 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.14, ease: "easeIn" } },
};

const rise: Variants = {
  initial: { opacity: 0, y: 18 },
  enter: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 32 } },
};

/** Route-level wrapper: fades/rises in, staggers direct <Reveal> children, exits quickly. */
export function Page({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  useEffect(() => {
    document.title = title ? `${title} · Game-On` : "Game-On — Quick games, real leaderboards";
  }, [title]);
  return (
    <m.div variants={page} initial="initial" animate="enter" exit="exit" className={cx("pt-2 md:pt-4", className)}>
      {children}
    </m.div>
  );
}

/** A block that rises into place as part of its page's stagger. */
export function Reveal({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "li" }) {
  const C = m[as];
  return (
    <C variants={rise} className={className}>
      {children}
    </C>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div>
        {eyebrow && <p className="label-caps mb-2 text-ink-3">{eyebrow}</p>}
        <h1 className="display text-[clamp(2.1rem,5vw,3.4rem)]">{title}</h1>
      </div>
      {children}
    </Reveal>
  );
}
