"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { hlsSrc } from "@/lib/movie";
import {
  clearProgress,
  getSavedProgress,
  saveProgress,
  trackEvent,
} from "@/lib/analytics";
import { playhead, readTimestampParam } from "@/lib/playhead";

type Props = { title: string };

export function VideoPlayer({ title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  useEffect(() => {
    const t = readTimestampParam();
    setResumeAt(t ?? getSavedProgress());
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsSrc;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
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
    } else {
      setError("Your browser does not support HLS playback.");
    }

    return () => {
      hls?.destroy();
    };
  }, []);

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

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        poster="/poster.png"
        aria-label={`${title} — video player`}
        className="absolute inset-0 h-full w-full bg-black object-contain"
      >
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
