"use client";

import { useState } from "react";
import { movie } from "@/lib/movie";
import { trackEvent } from "@/lib/analytics";
import { formatTimestamp, playhead } from "@/lib/playhead";

type Status = "idle" | "copied" | "error";

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const buildUrl = (): string => {
    const url = new URL(window.location.href);
    url.search = "";
    if (includeTimestamp && playhead.current > 0) {
      url.searchParams.set("t", String(Math.floor(playhead.current)));
    }
    return url.toString();
  };

  const buildText = (): string => {
    const timeText =
      includeTimestamp && playhead.current > 0
        ? ` — from ${formatTimestamp(playhead.current)}`
        : "";
    return `Watch ${movie.title} (${movie.year})${timeText}`;
  };

  const openLink = (href: string, method: string) => {
    trackEvent("share_click", { method });
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const nativeShare = async () => {
    const url = buildUrl();
    const text = buildText();
    trackEvent("share_click", { method: "native" });

    if (
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" ||
        navigator.canShare({ url, text, title: movie.title }))
    ) {
      try {
        await navigator.share({ url, text, title: movie.title });
        trackEvent("share_success", { method: "native" });
        setOpen(false);
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    await copyLink();
  };

  const copyLink = async () => {
    const url = buildUrl();
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

  const shareOnWhatsApp = () => {
    const href = `https://wa.me/?text=${encodeURIComponent(
      `${buildText()}\n${buildUrl()}`,
    )}`;
    openLink(href, "whatsapp");
  };

  const shareOnX = () => {
    const href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      buildText(),
    )}&url=${encodeURIComponent(buildUrl())}`;
    openLink(href, "x");
  };

  const shareOnFacebook = () => {
    const href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      buildUrl(),
    )}`;
    openLink(href, "facebook");
  };

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <ShareIcon aria-hidden />
        <span>Share</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="absolute left-0 top-full z-20 mt-2 flex w-64 flex-col gap-2 rounded-xl bg-zinc-900 p-3 text-sm text-zinc-100 shadow-lg ring-1 ring-white/10"
          >
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-300 hover:bg-white/5">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="accent-white"
              />
              <span>
                Share from{" "}
                <span className="text-zinc-100">
                  {formatTimestamp(playhead.current)}
                </span>
              </span>
            </label>

            <div className="grid grid-cols-4 gap-2 py-1">
              <IconTile
                label="WhatsApp"
                onClick={shareOnWhatsApp}
                icon={<WhatsAppIcon />}
              />
              <IconTile label="X" onClick={shareOnX} icon={<XIcon />} />
              <IconTile
                label="Facebook"
                onClick={shareOnFacebook}
                icon={<FacebookIcon />}
              />
              <IconTile
                label="More"
                onClick={nativeShare}
                icon={<ShareIcon />}
              />
            </div>

            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
            >
              <LinkIcon aria-hidden />
              <span>Copy link</span>
            </button>
          </div>
        </>
      )}

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
          Couldn&apos;t copy
        </span>
      )}
    </div>
  );
}

function IconTile({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs text-zinc-300 transition hover:bg-white/5"
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-emerald-400">
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6 0-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.4.4-.6.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6 0-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.2 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3M12 22c-1.7 0-3.4-.4-4.9-1.3l-5.4 1.4 1.5-5.3C2.4 15.3 2 13.7 2 12 2 6.5 6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-zinc-100">
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.844l-5.35-6.99L4.7 22H1.44l8.02-9.16L1 2h7.06l4.83 6.4L18.244 2Zm-1.2 18h1.9L7.05 4H5.05l12 16Z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-blue-400">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.6v-2.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.5H7.5V14h2.8v8h3.2Z"/>
    </svg>
  );
}
