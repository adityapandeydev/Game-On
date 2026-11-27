import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { MessageSquareText, Send, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { StarInput, StarRow } from "./ui/Stars";
import { Empty, Skeleton } from "./ui/Misc";
import { toast } from "../lib/toast";
import { useAction } from "../lib/useAction";
import { useGames, useMe, useReviewMutations, useReviews } from "../lib/queries";
import { ApiError } from "../lib/api";
import { ago, cx } from "../lib/format";

const MAX = 1000;

export function ReviewComposer({ gameId, compact }: { gameId: string; compact?: boolean }) {
  const { data: me } = useMe();
  const { save } = useReviewMutations();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = useAction(async () => {
    try {
      await save.mutateAsync({ gameId, rating, body });
      setBody("");
      setRating(0);
      setErrors({});
    } catch (e) {
      const err = e as ApiError;
      setErrors(err.fields ?? {});
      if (!err.fields) toast(err.message);
      throw e;
    }
  });

  if (!me?.user)
    return (
      <p className="rounded-2xl border-2 border-dashed border-line-soft p-4 text-sm text-ink-2">
        <Link to="/login" className="font-bold text-ink underline decoration-2 underline-offset-2">
          Sign in
        </Link>{" "}
        to leave a review.
      </p>
    );

  return (
    <form
      className={cx("flex flex-col gap-3", !compact && "chunk p-5")}
      onSubmit={(e) => {
        e.preventDefault();
        if (rating === 0) {
          setErrors({ rating: "Pick a star rating" });
          submit.setStatus("error");
          setTimeout(() => submit.setStatus("idle"), 900);
          return;
        }
        void submit.run();
      }}
    >
      <div>
        <p className="mb-1 text-sm font-bold">Your rating</p>
        <StarInput value={rating} onChange={(v) => (setRating(v), setErrors((x) => ({ ...x, rating: "" })))} error={!!errors.rating} />
      </div>
      <div className="relative">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          rows={compact ? 3 : 4}
          placeholder="What did you think? Re-submitting edits your review."
          aria-label="Review"
          className={cx(
            "w-full resize-none rounded-[var(--radius-btn)] border-2 bg-surface p-3 text-sm outline-none transition-shadow focus:shadow-[3px_3px_0_var(--shadow)]",
            errors.body ? "border-danger" : "border-line",
          )}
        />
        <span className="num absolute right-3 bottom-2.5 text-[0.65rem] text-ink-3">
          {body.length}/{MAX}
        </span>
      </div>
      {(errors.rating || errors.body) && <p className="text-sm font-semibold text-danger">{errors.rating || errors.body}</p>}
      <Button type="submit" variant="primary" status={submit.status} doneLabel="Posted" iconRight={<Send size={16} />} disabled={!body.trim()} className="self-start">
        Post review
      </Button>
    </form>
  );
}

export function ReviewList({ game, compact }: { game: string; compact?: boolean }) {
  const { data, isPending } = useReviews(game);
  const { data: games } = useGames();
  const { data: me } = useMe();
  const { remove } = useReviewMutations();
  const title = (id: string) => (id === "platform" ? "Game-On" : games?.find((g) => g.id === id)?.title ?? id);

  if (isPending)
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  if (!data?.reviews.length) return <Empty icon={<MessageSquareText size={22} />} title="No reviews yet" body="Played it? Tell everyone what you thought." />;

  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {data.reviews.map((r, i) => (
          <m.li
            key={r.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.03 } }}
            exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
            className={cx("rounded-2xl border-2 p-4", compact ? "border-line-soft" : "chunk border-line")}
          >
            <div className="mb-2 flex items-center gap-2.5">
              <span className="display-tight grid size-8 place-items-center rounded-lg border-2 border-line bg-[var(--a-sky)] text-sm text-[#17151c] uppercase">{r.username.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.username}</p>
                <p className="text-xs text-ink-3">
                  {!compact && <>{title(r.gameId)} · </>}
                  {ago(r.updatedAt)}
                </p>
              </div>
              <StarRow value={r.rating} />
              {me?.user?.id === r.userId && (
                <button
                  onClick={() => remove.mutate(r.id, { onError: (e) => toast((e as Error).message) })}
                  aria-label="Delete your review"
                  className="grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-danger active:scale-90"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-2">{r.body}</p>
          </m.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
