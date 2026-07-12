"use client";

import { useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";
import { hlsSrc } from "@/lib/movie";
import {
  clearProgress,
  getSavedProgress,
  saveProgress,
  trackEvent,
} from "@/lib/analytics";
import { playhead, readTimestampParam } from "@/lib/playhead";

type Props = { title: string; src?: string };

type QualityChoice = "auto" | number;

export function VideoPlayer({ title, src }: Props) {
  const source = src ?? hlsSrc;
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [quality, setQuality] = useState<QualityChoice>("auto");
  const [captionsOn, setCaptionsOn] = useState(false);

  useEffect(() => {
    const t = readTimestampParam();
    setResumeAt(t ?? getSavedProgress());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setLevels(data.levels ?? []);
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Playback error — try refreshing the page.");
          trackEvent("video_error", {
            fatal: true,
            type: data.type,
            details: data.details,
          });
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // iOS Safari: no MSE, use native HLS (no manual quality control)
      video.src = source;
    } else {
      setError("Your browser does not support HLS playback.");
    }

    return () => {
      hls?.destroy();
      hlsRef.current = null;
    };
  }, [source]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastSaved = 0;
    let seekFrom: number | null = null;
    let resumed = false;

    const onLoadedMeta = () => {
      const t = readTimestampParam();
      if (t && video.duration && t < video.duration) {
        video.currentTime = t;
        resumed = true;
        trackEvent("video_deeplink", { at: t, duration: video.duration });
        return;
      }
      const saved = getSavedProgress();
      if (
        saved &&
        video.duration &&
        saved > 5 &&
        saved < video.duration - 15
      ) {
        video.currentTime = saved;
        resumed = true;
        trackEvent("video_resume", { at: saved, duration: video.duration });
      }
    };

    const onPlay = () =>
      trackEvent("video_play", { at: video.currentTime, resumed });
    const onPause = () => {
      trackEvent("video_pause", { at: video.currentTime });
      if (video.currentTime > 5)
        saveProgress(video.currentTime, video.duration || undefined);
    };
    const onEnded = () => {
      trackEvent("video_ended", { duration: video.duration });
      clearProgress();
    };
    const onSeeking = () => {
      seekFrom = video.currentTime;
    };
    const onSeeked = () => {
      trackEvent("video_seek", { from: seekFrom, to: video.currentTime });
      seekFrom = null;
    };
    const onTimeUpdate = () => {
      playhead.current = video.currentTime;
      const now = Date.now();
      if (now - lastSaved < 5000) return;
      lastSaved = now;
      saveProgress(video.currentTime, video.duration || undefined);
      if (resumeAt !== null) setResumeAt(null);
    };
    const onVisibility = () => {
      if (document.hidden && video.currentTime > 5) {
        saveProgress(video.currentTime, video.duration || undefined);
      }
    };

    video.addEventListener("loadedmetadata", onLoadedMeta);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("timeupdate", onTimeUpdate);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMeta);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("timeupdate", onTimeUpdate);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [resumeAt]);

  const chooseQuality = (next: QualityChoice) => {
    setQuality(next);
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = next === "auto" ? -1 : next;
    trackEvent("video_quality_change", { to: next });
  };

  const toggleCaptions = () => {
    const video = videoRef.current;
    if (!video) return;
    const track = video.textTracks[0];
    if (!track) return;
    const next = track.mode !== "showing";
    track.mode = next ? "showing" : "disabled";
    setCaptionsOn(next);
    trackEvent("video_captions_toggle", { on: next });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          poster="/poster.png"
          aria-label={`${title} — video player`}
          crossOrigin="anonymous"
          className="absolute inset-0 h-full w-full bg-black object-contain"
        >
          <track
            kind="subtitles"
            src="/movie/en.vtt"
            srcLang="en"
            label="English"
          />
          Your browser does not support the video tag.
        </video>
        {resumeAt !== null && resumeAt > 5 && (
          <div
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-zinc-200 ring-1 ring-white/10 backdrop-blur"
          >
            Resuming at {formatTime(resumeAt)}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="absolute inset-x-0 bottom-0 bg-rose-900/80 px-4 py-2 text-sm text-rose-100"
          >
            {error}
          </div>
        )}
      </div>

      <div
        role="group"
        aria-label="Player controls"
        className="flex flex-wrap items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleCaptions}
          aria-pressed={captionsOn}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            captionsOn
              ? "bg-emerald-500/20 text-emerald-200 ring-emerald-400/50"
              : "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
          }`}
        >
          <CcIcon aria-hidden />
          <span>Subtitles</span>
          <span className="text-[10px] text-zinc-400">EN</span>
        </button>

        {levels.length > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 text-xs ring-1 ring-white/10">
            <QualityPill
              label="Auto"
              active={quality === "auto"}
              onClick={() => chooseQuality("auto")}
            />
            {levels.map((lvl, i) => (
              <QualityPill
                key={i}
                label={qualityLabel(lvl)}
                active={quality === i}
                onClick={() => chooseQuality(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QualityPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 transition ${
        active
          ? "bg-white text-black"
          : "text-zinc-300 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function qualityLabel(lvl: Level): string {
  if (lvl.height) return `${lvl.height}p`;
  if (lvl.bitrate) return `${Math.round(lvl.bitrate / 1000)}kbps`;
  return "Level";
}

function CcIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="currentColor"
      {...props}
    >
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm-9 10a3 3 0 1 1 0-6 3 3 0 0 1 2.7 1.7l-1.4.7A1.5 1.5 0 1 0 12 12.5c.55 0 1.05-.3 1.3-.7l1.4.7A3 3 0 0 1 11 14Zm7 0a3 3 0 1 1 0-6 3 3 0 0 1 2.7 1.7l-1.4.7A1.5 1.5 0 1 0 19 12.5c.55 0 1.05-.3 1.3-.7l1.4.7A3 3 0 0 1 18 14Z" />
    </svg>
  );
}

function formatTime(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}
