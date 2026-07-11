"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { hlsSrc } from "@/lib/movie";

const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://satluj.movie";

export function DownloadButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"ffmpeg" | "ytdlp" | null>(null);

  const absoluteHls =
    typeof window !== "undefined"
      ? new URL(hlsSrc, window.location.origin).toString()
      : `https://satluj.movie${hlsSrc}`;

  const ffmpegCmd = `ffmpeg -i "${absoluteHls}" -c copy satluj.mp4`;
  const ytdlpCmd = `yt-dlp "${absoluteHls}" -o satluj.mp4`;

  const handleOpen = () => {
    trackEvent("download_click", { source: SITE_URL });
    setOpen(true);
  };

  const copy = async (which: "ffmpeg" | "ytdlp") => {
    const text = which === "ffmpeg" ? ffmpegCmd : ytdlpCmd;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      trackEvent("download_command_copied", { tool: which });
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <DownloadIcon aria-hidden />
        <span>Download</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-zinc-950 p-6 text-sm text-zinc-100 ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <h3 id="download-title" className="text-lg font-medium">
                  Download the film
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  We stream via HLS. Save it to a single MP4 with either tool
                  below — no signup, no watermark.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Snippet
              label="ffmpeg"
              hint="Install via brew install ffmpeg (mac) / apt install ffmpeg (linux)"
              command={ffmpegCmd}
              onCopy={() => copy("ffmpeg")}
              copied={copied === "ffmpeg"}
            />

            <Snippet
              label="yt-dlp"
              hint="Install via brew install yt-dlp / pip install yt-dlp"
              command={ytdlpCmd}
              onCopy={() => copy("ytdlp")}
              copied={copied === "ytdlp"}
            />

            <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
              <p className="text-xs text-zinc-400">
                On mobile or no CLI? Open the HLS URL in{" "}
                <strong>VLC → Media → Open Network Stream</strong>:
              </p>
              <code className="rounded-md bg-black/60 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
                {absoluteHls}
              </code>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Snippet({
  label,
  hint,
  command,
  onCopy,
  copied,
}: {
  label: string;
  hint: string;
  command: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-zinc-200">{label}</span>
          <span className="text-zinc-500">{hint}</span>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-300 ring-1 ring-white/10 hover:bg-white/10"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <code className="overflow-x-auto rounded-md bg-black/60 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
        {command}
      </code>
    </div>
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
