"use client";

import { useEffect, useState } from "react";
import { getDisplayName, getVisitorId, trackEvent } from "@/lib/analytics";
import { getSupabase } from "@/lib/supabase";
import { ensureSessionInDb } from "@/lib/sync";

const MAX_LEN = 2000;

export function CommentBox() {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [displayName, setDisplayName] = useState("you");

  useEffect(() => {
    setDisplayName(getDisplayName());
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = body.trim();
    if (trimmed.length === 0) return;

    const client = getSupabase();
    if (!client) {
      setError("Comments are not configured yet.");
      return;
    }

    setSubmitting(true);
    try {
      await ensureSessionInDb();
    } catch (sessionErr) {
      setSubmitting(false);
      setError((sessionErr as Error).message);
      return;
    }
    const { error: err } = await client.from("comments").insert({
      session_id: getVisitorId(),
      display_name: getDisplayName(),
      body: trimmed,
    });
    setSubmitting(false);

    if (err) {
      setError(err.message);
      return;
    }
    trackEvent("comment_post", { length: trimmed.length });
    setBody("");
    setSubmitted(true);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="comment-body" className="sr-only">
        Leave a comment
      </label>
      <textarea
        id="comment-body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (submitted) setSubmitted(false);
        }}
        placeholder="Leave a thought…"
        maxLength={MAX_LEN}
        rows={3}
        className="w-full rounded-lg bg-white/5 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      />
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          Posting as{" "}
          <span className="text-zinc-300">{displayName}</span>
        </span>
        <div className="flex items-center gap-3">
          <span aria-live="polite">
            {body.length}/{MAX_LEN}
          </span>
          <button
            type="submit"
            disabled={submitting || body.trim().length === 0}
            className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
      {submitted && !error && (
        <p role="status" className="text-xs text-emerald-300">
          Thanks — your comment is awaiting review and will appear once approved.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </form>
  );
}
