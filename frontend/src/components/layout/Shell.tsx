import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, LogOut, Moon, Search, Sun, UserRound } from "lucide-react";
import { Logo, LogoMark } from "../art/Logo";
import { Button, IconButton } from "../ui/Button";
import { Kbd } from "../ui/Misc";
import { CommandPalette } from "./CommandPalette";
import { navItems } from "./nav";
import { toggleTheme, useTheme } from "../../lib/theme";
import { useAuth, useMe } from "../../lib/queries";
import { useKeydown, isTyping } from "../../lib/hotkeys";
import { cx } from "../../lib/format";
import { toast } from "../../lib/toast";

const navSpring = { type: "spring", stiffness: 480, damping: 36 } as const;

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const inGame = pathname.startsWith("/play/");

  useKeydown((e) => {
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !isTyping(e))) {
      e.preventDefault();
      setPaletteOpen((o) => !o);
    }
  });

  return (
    <div className="min-h-dvh md:pl-[88px]">
      <NavRail pathname={pathname} />
      <TopBar inGame={inGame} onSearch={() => setPaletteOpen(true)} />
      <main id="main" className={cx("mx-auto w-full max-w-[1320px] px-4 md:px-8", inGame ? "pb-4" : "pb-28 md:pb-12")}>
        {children}
      </main>
      {!inGame && <TabBar pathname={pathname} />}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function NavRail({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="fixed inset-y-0 left-0 z-40 hidden w-[88px] flex-col items-center gap-2 border-r-2 border-line bg-surface py-4 md:flex">
      <Link to="/" aria-label="Game-On home" className="mb-4 transition-transform duration-200 hover:-rotate-6 active:scale-90">
        <LogoMark size={44} />
      </Link>
      {navItems.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cx(
              "group relative flex w-[72px] flex-col items-center gap-1 rounded-2xl py-2.5 text-[0.7rem] font-bold transition-colors duration-200",
              active ? "text-[#17151c]" : "text-ink-3 hover:text-ink",
            )}
          >
            {active && (
              <m.span
                layoutId="rail-active"
                transition={navSpring}
                className="absolute inset-0 -z-0 rounded-2xl border-2 border-line bg-brand shadow-[3px_3px_0_var(--shadow)]"
              />
            )}
            <Icon size={22} strokeWidth={2.4} className="relative transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-90" />
            <span className="relative">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function TabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-3 z-40 flex items-stretch justify-around rounded-[20px] border-2 border-line bg-surface p-1.5 shadow-[4px_4px_0_var(--shadow)] md:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {navItems.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={active ? "page" : undefined}
            className={cx("relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[0.68rem] font-bold transition-colors", active ? "text-[#17151c]" : "text-ink-3")}
          >
            {active && <m.span layoutId="tab-active" transition={navSpring} className="absolute inset-0 rounded-2xl bg-brand" />}
            <Icon size={21} strokeWidth={2.4} className="relative" />
            <span className="relative">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function TopBar({ inGame, onSearch }: { inGame: boolean; onSearch: () => void }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-bg/95 md:border-b-0 md:bg-transparent">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 md:px-8">
        {inGame ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />}
            onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate("/"))}
            className="-ml-2"
          >
            Arcade
          </Button>
        ) : (
          <Link to="/" className="md:hidden">
            <Logo />
          </Link>
        )}

        <button
          onClick={onSearch}
          className={cx(
            "group ml-auto flex h-11 items-center gap-2.5 rounded-[var(--radius-btn)] border-2 border-line bg-surface px-3 text-sm text-ink-3",
            "transition-[box-shadow,transform] duration-150 hover:shadow-[3px_3px_0_var(--shadow)] active:translate-y-px md:ml-0 md:w-80",
          )}
        >
          <Search size={18} className="text-ink-2 transition-transform duration-200 group-hover:scale-110" />
          <span className="hidden md:inline">Jump to a game or page</span>
          <span className="ml-auto hidden items-center gap-1 md:flex">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <div className="flex items-center gap-1 md:ml-auto">
          <ThemeToggle />
          <Account />
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const theme = useTheme();
  return (
    <IconButton
      label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        toggleTheme(r.left + r.width / 2, r.top + r.height / 2);
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="grid"
        >
          {theme === "dark" ? <Moon size={20} strokeWidth={2.4} /> : <Sun size={20} strokeWidth={2.4} />}
        </m.span>
      </AnimatePresence>
    </IconButton>
  );
}

function Account() {
  const { data } = useMe();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const user = data?.user;

  if (!user) {
    return (
      <Button variant="primary" size="sm" onClick={() => navigate("/login")} className="ml-1">
        Sign in
      </Button>
    );
  }
  return (
    <div className="relative ml-1" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="display-tight grid size-11 place-items-center rounded-[var(--radius-btn)] border-2 border-line bg-[var(--a-violet)] text-lg text-[#17151c] uppercase transition-transform duration-150 hover:-rotate-3 active:scale-90"
      >
        {user.username.slice(0, 1)}
      </button>
      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            style={{ transformOrigin: "top right" }}
            className="chunk absolute top-[calc(100%+8px)] right-0 z-50 w-56 p-1.5"
          >
            <div className="px-3 pt-2 pb-2.5">
              <p className="display-tight truncate">{user.username}</p>
              <p className="truncate text-xs text-ink-3">{user.email}</p>
            </div>
            <MenuItem icon={<UserRound size={17} />} onClick={() => (setOpen(false), navigate("/me"))}>
              Profile and stats
            </MenuItem>
            <MenuItem
              icon={<LogOut size={17} />}
              onClick={() =>
                logout.mutate(undefined, {
                  onSuccess: () => {
                    setOpen(false);
                    toast("Signed out", "success");
                  },
                })
              }
            >
              Sign out
            </MenuItem>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button role="menuitem" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-surface-2 active:scale-[0.98]">
      <span className="text-ink-2">{icon}</span>
      {children}
    </button>
  );
}
