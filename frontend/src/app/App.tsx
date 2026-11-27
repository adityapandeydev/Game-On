import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { Shell } from "../components/layout/Shell";
import { Toaster } from "../components/ui/Toast";
import { Spinner } from "../components/ui/Spinner";
import Home from "../pages/Home";

// Everything except the landing page is split into its own chunk.
const Play = lazy(() => import("../pages/Play"));
const Leaderboards = lazy(() => import("../pages/Leaderboards"));
const Reviews = lazy(() => import("../pages/Reviews"));
const Profile = lazy(() => import("../pages/Profile"));
const Auth = lazy(() => import("../pages/Auth"));
const NotFound = lazy(() => import("../pages/NotFound"));

/** Section key: transitions run between sections, not on in-page param changes. */
function sectionOf(path: string) {
  const seg = path.split("/")[1] ?? "";
  if (seg === "play") return path; // each game is its own page
  if (seg === "login" || seg === "signup") return "auth";
  return seg;
}

export function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <Shell>
      <Suspense fallback={<RouteFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={sectionOf(location.pathname)}>
            <Route path="/" element={<Home />} />
            <Route path="/play/:id" element={<Play />} />
            <Route path="/leaderboards/:id?" element={<Leaderboards />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/me" element={<Profile />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/signup" element={<Auth mode="signup" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      <Toaster />
    </Shell>
  );
}

function RouteFallback() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-ink-3">
      <Spinner size={28} />
    </div>
  );
}
