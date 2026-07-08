import { ReactionButtons } from "@/components/ReactionButtons";
import { VideoPlayer } from "@/components/VideoPlayer";
import { movie } from "@/lib/movie";

export default function Home() {
  return (
    <div className="min-h-full bg-black text-zinc-100">
      <a
        href="#player"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm focus:text-black"
      >
        Skip to player
      </a>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:py-16">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {movie.year} · {movie.runtime}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {movie.title}
          </h1>
          <p className="text-sm text-zinc-400">{movie.tagline}</p>
        </header>

        <section id="player" aria-label="Movie player">
          <VideoPlayer title={movie.title} />
        </section>

        <section aria-label="Reactions" className="flex flex-col gap-3">
          <ReactionButtons />
        </section>

        <section aria-label="About this film" className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-200">About</h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            {movie.description}
          </p>
        </section>

        <footer className="mt-8 border-t border-white/5 pt-6 text-xs text-zinc-500">
          Adaptive streaming via Cloudflare Stream. Comments and live counts
          arrive in Part B.
        </footer>
      </main>
    </div>
  );
}
