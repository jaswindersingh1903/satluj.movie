"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

type Reaction = "like" | "dislike" | null;

export function ReactionButtons() {
  const [reaction, setReaction] = useState<Reaction>(null);

  const toggle = (next: Exclude<Reaction, null>) => {
    setReaction((current) => {
      const nextValue = current === next ? null : next;
      trackEvent(
        nextValue ? `reaction_${nextValue}` : "reaction_cleared",
        { previous: current },
      );
      return nextValue;
    });
  };

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
          —
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
          —
        </span>
      </button>

      <p className="text-xs text-zinc-500" aria-live="polite">
        Reactions are local only until Part B.
      </p>
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
