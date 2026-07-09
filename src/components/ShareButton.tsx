"use client";

import { useState } from "react";
import { movie } from "@/lib/movie";
import { trackEvent } from "@/lib/analytics";

type Status = "idle" | "copied" | "error";

export function ShareButton() {
  const [status, setStatus] = useState<Status>("idle");

  const handleShare = async () => {
    const url = window.location.href;
    const shareData: ShareData = {
      title: `${movie.title} (${movie.year})`,
      text: movie.tagline,
      url,
    };
    trackEvent("share_click", { url });

    if (
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" || navigator.canShare(shareData))
    ) {
      try {
        await navigator.share(shareData);
        trackEvent("share_success", { method: "native" });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          trackEvent("share_cancelled", { method: "native" });
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      trackEvent("share_success", { method: "clipboard" });
    } catch {
      setStatus("error");
      trackEvent("share_error", { method: "clipboard" });
    }
    window.setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <ShareIcon aria-hidden />
        <span>Share</span>
      </button>
      {status === "copied" && (
        <span
          role="status"
          aria-live="polite"
          className="text-xs text-emerald-300"
        >
          Link copied
        </span>
      )}
      {status === "error" && (
        <span
          role="status"
          aria-live="polite"
          className="text-xs text-rose-300"
        >
          Couldn&apos;t copy — copy from the address bar
        </span>
      )}
    </>
  );
}

function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
