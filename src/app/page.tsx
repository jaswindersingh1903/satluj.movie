import { AnalyticsInit } from "@/components/AnalyticsInit";
import { CommentBox } from "@/components/CommentBox";
import { CommentFeed } from "@/components/CommentFeed";
import { DeveloperBadge } from "@/components/DeveloperBadge";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { ReactionButtons } from "@/components/ReactionButtons";
import { ShareButton } from "@/components/ShareButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { movie } from "@/lib/movie";

export default function Home() {
  return (
    <div className="min-h-full bg-black text-zinc-100">
      <JsonLd />
      <AnalyticsInit />
      <DeveloperBadge />
      <a
        href="#player"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-1.5 focus:text-sm focus:text-black"
      >
        Skip to player
      </a>

      <div
        className="relative"
        style={{
          backgroundImage: "url(/og-image.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pt-14 pb-12 sm:pt-24 sm:pb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            {movie.year} · {movie.runtime} · {movie.language} · {movie.genres.join(" / ")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            {movie.title}
          </h1>
          <p className="max-w-2xl text-base italic text-zinc-300 sm:text-lg">
            &ldquo;{movie.tagline}&rdquo;
          </p>
          <p className="text-sm text-zinc-400">
            Also known as {movie.alternateTitles.map((t) => `“${t}”`).join(", ")} ·
            Directed by {movie.director}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="#player"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              <PlayGlyph aria-hidden />
              <span>Watch now — free</span>
            </a>
            <a
              href="#about-khalra"
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-100 ring-1 ring-white/10 hover:bg-white/10"
            >
              About Jaswant Singh Khalra
            </a>
          </div>
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-12">
        <section id="player" aria-label="Movie player">
          <VideoPlayer title={movie.title} />
        </section>

        <section
          aria-label="Reactions and sharing"
          className="flex flex-wrap items-center gap-3"
        >
          <ReactionButtons />
          <ShareButton />
        </section>

        <section aria-label="Synopsis" className="flex flex-col gap-3">
          <h2 className="text-lg font-medium text-zinc-200">Synopsis</h2>
          <p className="max-w-3xl text-base leading-relaxed text-zinc-300">
            {movie.description}
          </p>
        </section>

        <section
          id="about-khalra"
          aria-label="About Jaswant Singh Khalra"
          className="flex flex-col gap-3 border-t border-white/5 pt-8"
        >
          <h2 className="text-lg font-medium text-zinc-200">
            Who was Jaswant Singh Khalra?
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
            Jaswant Singh Khalra was a Sikh human rights activist from Punjab
            who exposed the enforced disappearances and unlawful cremations of
            more than <strong>25,000 people</strong> by police during the state
            insurgency of the early 1990s. His investigation, cross-referencing
            municipal cremation records with missing-person reports, forced
            India and the world to confront a wave of extrajudicial killings
            that had been dismissed as an internal law-and-order matter. In
            September 1995, he was abducted from outside his home in Amritsar
            and killed in police custody. His work is the moral centre of{" "}
            <em>Satluj</em>.
          </p>
        </section>

        <section
          aria-label="Cast and crew"
          className="grid grid-cols-1 gap-8 border-t border-white/5 pt-8 sm:grid-cols-2"
        >
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-zinc-200">Cast</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {movie.cast.map((c) => (
                <li key={c.name} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-semibold text-zinc-100 ring-1 ring-white/10">
                    {initials(c.name)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-zinc-100">{c.name}</span>
                    {c.role && (
                      <span className="text-xs text-zinc-500">as {c.role}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-medium text-zinc-200">
              Crew &amp; Release
            </h2>
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
                  className="rounded text-amber-300 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  tt28089784
                </a>
              </dd>
            </dl>
          </div>
        </section>

        <Faq />

        <section
          id="comments"
          aria-label="Comments"
          className="flex flex-col gap-5 border-t border-white/5 pt-8"
        >
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium text-zinc-200">Comments</h2>
            <span className="text-xs text-zinc-500">
              Auto-published. Be kind.
            </span>
          </div>
          <CommentBox />
          <CommentFeed />
        </section>

        <footer className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-6 text-xs text-zinc-500">
          <p>
            Streaming HLS via Cloudflare Workers Static Assets. Reactions and
            comments powered by Supabase. Not affiliated with the film&apos;s
            producers or distributors — a fan-made tribute to Jaswant Singh
            Khalra.
          </p>
          <p>
            Built by{" "}
            <a
              href="https://jaswinder.info/"
              target="_blank"
              rel="noopener noreferrer author"
              className="rounded text-zinc-300 underline-offset-4 hover:text-white hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Jaswinder Singh
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}

function PlayGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
