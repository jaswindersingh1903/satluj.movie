"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { hlsSrc } from "@/lib/movie";

// The film is served as ~1000 HLS MPEG-TS segments, not a single file.
// MPEG-TS segments are concatenable, so we fetch the playlist, pull every
// segment in order, join them into one blob, and save it as satluj.ts —
// a single, playable file. No popup, no external tool.
const PLAYLIST_URL = hlsSrc;
const BASE_URL = hlsSrc.slice(0, hlsSrc.lastIndexOf("/") + 1);

type State =
  | { kind: "idle" }
  | { kind: "downloading"; done: number; total: number }
  | { kind: "error" };

export function DownloadButton() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const download = async () => {
    if (state.kind === "downloading") return;
    trackEvent("download_click", { source: "concat_ts" });
    setState({ kind: "downloading", done: 0, total: 0 });

    try {
      const playlist = await fetch(PLAYLIST_URL).then((r) => r.text());
      const segments = playlist
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"));

      if (segments.length === 0) throw new Error("No segments in playlist");

      const parts: BlobPart[] = [];
      for (let i = 0; i < segments.length; i++) {
        const res = await fetch(BASE_URL + segments[i]);
        if (!res.ok) throw new Error(`Segment ${segments[i]} failed`);
        parts.push(await res.arrayBuffer());
        setState({ kind: "downloading", done: i + 1, total: segments.length });
      }

      const blob = new Blob(parts, { type: "video/mp2t" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "satluj.ts";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      trackEvent("download_complete", { segments: segments.length });
      setState({ kind: "idle" });
    } catch {
      trackEvent("download_error", {});
      setState({ kind: "error" });
    }
  };

  const pct =
    state.kind === "downloading" && state.total > 0
      ? Math.round((state.done / state.total) * 100)
      : 0;

  const label =
    state.kind === "downloading"
      ? state.total > 0
        ? `Downloading… ${pct}%`
        : "Preparing…"
      : state.kind === "error"
        ? "Failed — retry"
        : "Download";

  return (
    <button
      type="button"
      onClick={download}
      disabled={state.kind === "downloading"}
      aria-busy={state.kind === "downloading"}
      className="relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-progress"
    >
      {state.kind === "downloading" && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-white/10 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      )}
      <span className="relative flex items-center gap-2">
        <DownloadIcon aria-hidden />
        <span>{label}</span>
      </span>
    </button>
  );
}

function DownloadIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
