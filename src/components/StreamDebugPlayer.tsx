"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

// Debug-only player for /test: plays the given HLS src and shows a live
// on-screen log of hls.js + <video> events so stalls can be diagnosed
// without browser devtools.
export function StreamDebugPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const [stats, setStats] = useState<string>("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const t0 = Date.now();
    const add = (m: string) =>
      setLog((l) => [
        `${((Date.now() - t0) / 1000).toFixed(1)}s  ${m}`,
        ...l,
      ].slice(0, 24));

    if (!Hls.isSupported()) {
      add("Hls.isSupported() = false (native path)");
      video.src = src;
      return;
    }

    const hls = new Hls({ enableWorker: true });
    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => add("MEDIA_ATTACHED"));
    hls.on(Hls.Events.MANIFEST_PARSED, (_e, d) =>
      add(`MANIFEST_PARSED levels=${d.levels.length} audio=${d.audioTracks?.length ?? 0} subs=${d.subtitleTracks?.length ?? 0}`)
    );
    hls.on(Hls.Events.LEVEL_LOADED, (_e, d) =>
      add(`LEVEL_LOADED lvl=${d.level} frags=${d.details.fragments.length}`)
    );
    hls.on(Hls.Events.AUDIO_TRACK_LOADED, () => add("AUDIO_TRACK_LOADED"));
    let frags = 0,
      buffered = 0;
    hls.on(Hls.Events.FRAG_LOADED, () => {
      frags++;
      if (frags <= 3 || frags % 10 === 0) add(`FRAG_LOADED #${frags}`);
    });
    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      buffered++;
      if (buffered <= 3 || buffered % 10 === 0) add(`FRAG_BUFFERED #${buffered}`);
    });
    hls.on(Hls.Events.ERROR, (_e, d) =>
      add(`ERROR ${d.fatal ? "FATAL " : ""}${d.type} / ${d.details}`)
    );

    for (const ev of ["loadedmetadata", "canplay", "playing", "waiting", "stalled", "suspend"]) {
      video.addEventListener(ev, () => add(`<video> ${ev}`));
    }
    video.addEventListener("error", () =>
      add(`<video> error code=${video.error?.code}`)
    );

    const iv = setInterval(() => {
      let end = 0;
      try {
        if (video.buffered.length) end = video.buffered.end(video.buffered.length - 1);
      } catch {}
      setStats(
        `readyState=${video.readyState} networkState=${video.networkState} ` +
          `currentTime=${video.currentTime.toFixed(1)} buffered=${end.toFixed(1)}s ` +
          `frags=${frags} buffered=${buffered}`
      );
    }, 1000);

    return () => {
      clearInterval(iv);
      hls.destroy();
    };
  }, [src]);

  return (
    <div>
      <video
        ref={videoRef}
        controls
        playsInline
        className="aspect-video w-full rounded bg-zinc-900"
      />
      <div className="mt-2 rounded bg-zinc-900 p-2 font-mono text-[10px] text-emerald-400">
        {stats}
      </div>
      <div className="mt-1 max-h-64 overflow-auto rounded bg-zinc-950 p-2 font-mono text-[10px] text-zinc-400">
        {log.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
