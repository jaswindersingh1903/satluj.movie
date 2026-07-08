# movie-site

Part A of the single-movie website: a static Next.js frontend that plays a Cloudflare Stream video with placeholder like/dislike UI. Deployable to Cloudflare Pages.

## Local development

```bash
npm install
cp .env.example .env.local     # add your NEXT_PUBLIC_STREAM_VIDEO_ID
npm run dev
```

Visit http://localhost:3000.

Without a video ID the player renders a placeholder card so the layout still shows.

## Content

Edit `src/lib/movie.ts` to set the title, tagline, description, runtime, and year.

## Build (static export)

```bash
npm run build
```

Output lands in `out/`. That directory is what Cloudflare Pages serves.

## Deploy to Cloudflare (Workers Static Assets)

Deployment uses Wrangler with the `wrangler.jsonc` at the repo root — it declares the `out/` directory as static assets and skips OpenNext auto-migration (which would break a static export).

1. Push this repo to GitHub.
2. In the Cloudflare dashboard, connect the repo (Workers & Pages → Create).
3. Set the build settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (default)
   - **Root directory:** `/`
   - Leave "Output directory" blank — `wrangler.jsonc` controls it.
4. Add environment variable: `NEXT_PUBLIC_STREAM_VIDEO_ID = <your Stream video UID>`.
5. Save & deploy. Every push to `main` redeploys.

The Worker name in `wrangler.jsonc` is `satlujmovie`. Change it there if you rename the project in Cloudflare.

## Cloudflare Stream setup

1. In the Cloudflare dashboard, enable **Stream** and upload your MP4.
2. Copy the video **UID** from the video's detail page.
3. Set it as `NEXT_PUBLIC_STREAM_VIDEO_ID` in `.env.local` (dev) and in Pages settings (prod).

The site embeds the Stream player at `https://iframe.videodelivery.net/<UID>`, which handles adaptive HLS encoding, poster, and caption support automatically.

## What's here (Part A)

- Cloudflare Stream iframe player
- Title / tagline / description
- Like / Dislike buttons (local-only — no persistence)
- Mobile-responsive, keyboard-navigable, ARIA-labelled
- Skip-to-player link for screen readers

## What's next (Part B)

Supabase-backed reactions, comments, session tracking, and GA4. See the project plan.
