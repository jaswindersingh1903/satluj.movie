import { AnalyticsInit } from "@/components/AnalyticsInit";
import { ReactionButtons } from "@/components/ReactionButtons";
import { ShareButton } from "@/components/ShareButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { movie } from "@/lib/movie";

export default function Home() {
  return (
    <div className="min-h-full bg-black text-zinc-100">
      <AnalyticsInit />
      <a
        href="#player"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm focus:text-black"
      >
        Skip to player
      </a>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-10 sm:py-16">
        <header className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            {movie.year} · {movie.runtime} · {movie.language}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {movie.title}
          </h1>
          <p className="text-sm text-zinc-500">
            Also known as {movie.alternateTitles.map((t) => `“${t}”`).join(", ")}
          </p>
          <p className="max-w-2xl text-base text-zinc-300">{movie.tagline}</p>
          <div
            className="mt-1 flex flex-wrap gap-2"
            aria-label="Genres"
          >
            {movie.genres.map((g) => (
              <span
                key={g}
                className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10"
              >
                {g}
              </span>
            ))}
          </div>
        </header>

        <section id="player" aria-label="Movie player">
          <VideoPlayer title={movie.title} />
        </section>

        <section aria-label="Reactions and sharing" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <ReactionButtons />
            <ShareButton />
          </div>
        </section>

        <section aria-label="Synopsis" className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-200">Synopsis</h2>
          <p className="text-sm leading-relaxed text-zinc-300">
            {movie.description}
          </p>
        </section>

        <section
          aria-label="Cast and crew"
          className="grid grid-cols-1 gap-8 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-zinc-200">Cast</h2>
            <ul className="flex flex-col gap-2 text-sm text-zinc-300">
              {movie.cast.map((c) => (
                <li key={c.name} className="flex flex-col">
                  <span className="text-zinc-100">{c.name}</span>
                  {c.role && (
                    <span className="text-xs text-zinc-500">as {c.role}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium text-zinc-200">Crew &amp; Release</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-zinc-500">Director</dt>
              <dd className="text-zinc-200">{movie.director}</dd>

              <dt className="text-zinc-500">Producers</dt>
              <dd className="text-zinc-200">{movie.producers.join(", ")}</dd>

              <dt className="text-zinc-500">Studios</dt>
              <dd className="text-zinc-200">{movie.studios.join(", ")}</dd>

              <dt className="text-zinc-500">Released</dt>
              <dd className="text-zinc-200">
                {movie.releaseDate} · {movie.platform}
              </dd>

              <dt className="text-zinc-500">IMDb</dt>
              <dd>
                <a
                  href={movie.imdbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-300 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded"
                >
                  tt28089784
                </a>
              </dd>
            </dl>
          </div>
        </section>

        <footer className="mt-4 border-t border-white/5 pt-6 text-xs text-zinc-500">
          Adaptive streaming via Cloudflare Stream. Comments and live counts arrive in Part B.
        </footer>
      </main>
    </div>
  );
}
