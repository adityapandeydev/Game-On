import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Page } from "../components/layout/Page";
import { Field } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { GameArt } from "../components/art/GameArt";
import { toast } from "../lib/toast";
import { useAction } from "../lib/useAction";
import { useAuth } from "../lib/queries";
import { ApiError } from "../lib/api";
import type { GameId } from "../lib/types";

const tiles: { id: GameId; accent: string }[] = [
  { id: "stackfall", accent: "lime" },
  { id: "drop-four", accent: "coral" },
  { id: "typestorm", accent: "amber" },
  { id: "pig", accent: "rose" },
];

export default function Auth({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const { login, register } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const signup = mode === "signup";

  const submit = useAction(
    async () => {
      setErrors({});
      try {
        const r = signup ? await register.mutateAsync(form) : await login.mutateAsync({ email: form.email, password: form.password });
        toast(signup ? `Welcome, ${r.user.username}` : `Welcome back, ${r.user.username}`, "success");
        return r;
      } catch (e) {
        const err = e as ApiError;
        if (err.fields) setErrors(err.fields);
        else if (err.code === "invalid_credentials") setErrors({ password: err.message });
        else toast(err.message);
        throw e;
      }
    },
    { successMs: 500 },
  );

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  return (
    <Page title={signup ? "Create account" : "Sign in"}>
      <div className="mx-auto grid max-w-4xl items-stretch gap-0 overflow-hidden md:mt-6 md:grid-cols-2 md:chunk md:!shadow-[7px_7px_0_var(--shadow)]">
        <div className="relative hidden grid-cols-2 grid-rows-2 border-r-2 border-line md:grid">
          {tiles.map((t, i) => (
            <m.div
              key={t.id}
              data-accent={t.accent}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 * i, type: "spring", stiffness: 300, damping: 24 }}
              className="overflow-hidden border-line odd:border-r-2 [&:nth-child(-n+2)]:border-b-2"
            >
              <GameArt id={t.id} className="size-full" />
            </m.div>
          ))}
          <div className="absolute inset-x-6 bottom-6 rounded-2xl border-2 border-line bg-surface p-4">
            <p className="display-tight text-lg">Your scores, everywhere.</p>
            <p className="text-sm text-ink-2">An account keeps your bests, streaks and rank on every board.</p>
          </div>
        </div>

        <form
          className="flex flex-col gap-5 p-1 md:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            void submit.run().then((r) => r && navigate(from, { replace: true }));
          }}
          noValidate
        >
          <div>
            <h1 className="display text-4xl">{signup ? "Create account" : "Sign in"}</h1>
            <p className="mt-2 text-ink-2">
              {signup ? "Already have one? " : "New here? "}
              <Link to={signup ? "/login" : "/signup"} state={location.state} replace className="font-bold text-ink underline decoration-2 underline-offset-2">
                {signup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </div>
          <AnimatePresence initial={false}>
            {signup && (
              <m.div key="username" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <Field label="Username" autoComplete="username" value={form.username} onChange={set("username")} error={errors.username} hint="3-24 letters, numbers, - or _" />
              </m.div>
            )}
          </AnimatePresence>
          <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
          <Field
            label="Password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            hint={signup ? "At least 8 characters" : undefined}
          />
          <Button type="submit" variant="primary" size="lg" status={submit.status} doneLabel="You're in" iconRight={<ArrowRight size={20} />} block>
            {signup ? "Create account" : "Sign in"}
          </Button>
        </form>
      </div>
    </Page>
  );
}
