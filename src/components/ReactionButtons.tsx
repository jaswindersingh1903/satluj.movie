"use client";

import { useEffect, useState } from "react";
import { getVisitorId, trackEvent } from "@/lib/analytics";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { ensureSessionInDb } from "@/lib/sync";

type Reaction = "like" | "dislike" | null;
type Counts = { likes: number; dislikes: number };

export function ReactionButtons() {
  const [reaction, setReaction] = useState<Reaction>(null);
  const [counts, setCounts] = useState<Counts>({ likes: 0, dislikes: 0 });

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    const visitorId = getVisitorId();
    let mounted = true;

    ensureSessionInDb().catch(() => {});

    client
      .from("counters")
      .select("likes,dislikes")
      .eq("id", "reactions")
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) setCounts({ likes: data.likes, dislikes: data.dislikes });
      });

    client
      .from("reactions")
      .select("value")
      .eq("session_id", visitorId)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted && data) {
          setReaction(data.value === 1 ? "like" : "dislike");
        }
      });

    const channel = client
      .channel("counters-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "counters",
          filter: "id=eq.reactions",
        },
        (payload) => {
          const row = payload.new as Counts;
          if (row) setCounts({ likes: row.likes, dislikes: row.dislikes });
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      client.removeChannel(channel);
    };
  }, []);

  const toggle = async (next: Exclude<Reaction, null>) => {
    const nextValue: Reaction = reaction === next ? null : next;
    const previous = reaction;
    setReaction(nextValue);
    trackEvent(
      nextValue ? `reaction_${nextValue}` : "reaction_cleared",
      { previous },
    );

    const client = getSupabase();
    if (!client) return;
    const visitorId = getVisitorId();

    try {
      await ensureSessionInDb();
    } catch {
      // Roll back the optimistic UI if we can't create the session.
      setReaction(previous);
      return;
    }

    if (nextValue === null) {
      const { error } = await client
        .from("reactions")
        .delete()
        .eq("session_id", visitorId);
      if (error) {
        setReaction(previous);
        console.error("reactions.delete failed", error);
      }
      return;
    }

    const numeric = nextValue === "like" ? 1 : -1;
    const { error } = await client.from("reactions").upsert(
      {
        session_id: visitorId,
        value: numeric,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
    if (error) {
      setReaction(previous);
      console.error("reactions.upsert failed", error);
    }
  };

  const showCounts = isSupabaseConfigured;

  return (
    <div
      role="group"
      aria-label="Reactions"
      className="flex flex-wrap items-center gap-3"
    >
      <button
        type="button"
        onClick={() => toggle("like")}
        aria-pressed={reaction === "like"}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
          ${
            reaction === "like"
              ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/50"
              : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
          }`}
      >
        <ThumbUp aria-hidden />
        <span>Like</span>
        <span className="tabular-nums text-zinc-400" aria-hidden>
          {showCounts ? counts.likes : "—"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => toggle("dislike")}
        aria-pressed={reaction === "dislike"}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-1 transition
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black
          ${
            reaction === "dislike"
              ? "bg-rose-500/20 text-rose-200 ring-rose-400/50"
              : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
          }`}
      >
        <ThumbDown aria-hidden />
        <span>Dislike</span>
        <span className="tabular-nums text-zinc-400" aria-hidden>
          {showCounts ? counts.dislikes : "—"}
        </span>
      </button>
    </div>
  );
}

function ThumbUp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 10v11" />
      <path d="M4 10h3v11H4z" />
      <path d="M7 10l4-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2H7" />
    </svg>
  );
}

function ThumbDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M17 14V3" />
      <path d="M20 14h-3V3h3z" />
      <path d="M17 14l-4 7a2 2 0 0 1-2-2v-4H6a2 2 0 0 1-2-2l2-8a2 2 0 0 1 2-2h9" />
    </svg>
  );
}
