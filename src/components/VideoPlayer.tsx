import { streamVideoId } from "@/lib/movie";

type Props = {
  title: string;
};

export function VideoPlayer({ title }: Props) {
  if (!streamVideoId) {
    return (
      <div
        role="img"
        aria-label="Video placeholder — set NEXT_PUBLIC_STREAM_VIDEO_ID to enable playback"
        className="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-zinc-800 via-zinc-900 to-black ring-1 ring-white/10"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-zinc-300">
            Preview
          </div>
          <p className="max-w-md text-sm text-zinc-400">
            Set <code className="rounded bg-black/40 px-1.5 py-0.5 text-zinc-200">NEXT_PUBLIC_STREAM_VIDEO_ID</code> to
            embed the Cloudflare Stream player.
          </p>
        </div>
      </div>
    );
  }

  const src = `https://iframe.videodelivery.net/${streamVideoId}?poster=https%3A%2F%2Fvideodelivery.net%2F${streamVideoId}%2Fthumbnails%2Fthumbnail.jpg%3Ftime%3D%26height%3D720`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
      <iframe
        title={`${title} — video player`}
        src={src}
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
