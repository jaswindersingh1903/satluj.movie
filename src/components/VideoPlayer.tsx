"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { hlsSrc } from "@/lib/movie";

type Props = {
  title: string;
};

export function VideoPlayer({ title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsSrc;
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(hlsSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Playback error — try refreshing the page.");
        }
      });
      return () => hls.destroy();
    }

    setError("Your browser does not support HLS playback.");
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        aria-label={`${title} — video player`}
        className="absolute inset-0 h-full w-full bg-black"
      >
        Your browser does not support the video tag.
      </video>
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
