import { VideoPlayer } from "@/components/VideoPlayer";
import { movie, streamHlsSrc, streamVideoId } from "@/lib/movie";

export const metadata = {
  title: "Stream test — Satluj",
  robots: { index: false, follow: false },
};

export default function StreamTest() {
  return (
    <div className="min-h-full bg-black text-zinc-100">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-1 text-lg font-semibold">Cloudflare Stream test</h1>
        <p className="mb-4 text-xs text-zinc-500">
          Isolated page playing the movie from Cloudflare Stream. The live home
          page still uses the self-hosted video. Not indexed.
        </p>

        <div id="player">
          <VideoPlayer title={movie.title} src={streamHlsSrc} />
        </div>

        <dl className="mt-6 space-y-1 text-[11px] text-zinc-500">
          <div>
            <span className="text-zinc-400">Video ID:</span> {streamVideoId}
          </div>
          <div className="break-all">
            <span className="text-zinc-400">HLS source:</span> {streamHlsSrc}
          </div>
          <div>
            <span className="text-zinc-400">Build:</span> v
            {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
          </div>
        </dl>
      </main>
    </div>
  );
}
