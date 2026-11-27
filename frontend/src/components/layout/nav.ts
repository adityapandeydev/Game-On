import { Gamepad2, MessageSquareText, Trophy, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

export const navItems: NavItem[] = [
  { to: "/", label: "Arcade", icon: Gamepad2, match: (p) => p === "/" || p.startsWith("/play") },
  { to: "/leaderboards", label: "Ranks", icon: Trophy, match: (p) => p.startsWith("/leaderboards") },
  { to: "/reviews", label: "Reviews", icon: MessageSquareText, match: (p) => p.startsWith("/reviews") },
  { to: "/me", label: "Profile", icon: UserRound, match: (p) => p.startsWith("/me") || p === "/login" || p === "/signup" },
];
