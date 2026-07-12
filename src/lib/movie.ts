export type CastMember = {
  name: string;
  role?: string;
};

export const movie = {
  title: "Satluj",
  alternateTitles: ["Punjab '95", "Ghallughara"],
  tagline: "The truth Jaswant Singh Khalra died for.",
  description:
    "A biographical drama that follows human rights activist Jaswant Singh Khalra as he investigates the enforced disappearances and extrajudicial killings carried out by the Punjab Police during the insurgency of the early 1990s.",
  year: 2026,
  runtime: "2h 43m",
  releaseDate: "July 3, 2026",
  platform: "ZEE5",
  language: "Punjabi / Hindi",
  genres: ["Biography", "Crime", "Drama"],
  director: "Honey Trehan",
  producers: ["Ronnie Screwvala", "Abhishek Chaubey", "Honey Trehan"],
  studios: ["RSVP Movies", "MacGuffin Pictures"],
  imdbUrl: "https://www.imdb.com/title/tt28089784/",
  cast: [
    { name: "Diljit Dosanjh", role: "Jaswant Singh Khalra" },
    { name: "Arjun Rampal" },
    { name: "Kanwaljit Singh" },
    { name: "Suvinder Vicky" },
    { name: "Geetika Vidya Ohlyan" },
  ] as CastMember[],
};

export const streamVideoId =
  process.env.NEXT_PUBLIC_STREAM_VIDEO_ID ??
  "8c7069f9c6fbbf6fd64776720d667de7";

// Self-hosted HLS under public/movie — the known-working live source.
export const localHlsSrc = "/movie/index.m3u8";

// Cloudflare Stream adaptive HLS (canonical customer-subdomain URL).
// Under evaluation on /test before promoting to the main page.
export const streamHlsSrc = `https://customer-x5qvltm7pjj69m59.cloudflarestream.com/${streamVideoId}/manifest/video.m3u8`;

// Main page plays from Cloudflare Stream. To roll back to the self-hosted
// files (still shipped as a fallback), set this to localHlsSrc.
export const hlsSrc = streamHlsSrc;
