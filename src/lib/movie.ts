export const movie = {
  title: "Untitled Feature",
  tagline: "A short film.",
  description:
    "Placeholder synopsis. Replace this with the real movie description in src/lib/movie.ts. Runs at 24fps, adaptive bitrate via Cloudflare Stream.",
  runtime: "12 min",
  year: 2026,
};

export const streamVideoId = process.env.NEXT_PUBLIC_STREAM_VIDEO_ID ?? "";
