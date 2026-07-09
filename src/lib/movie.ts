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

export const streamVideoId = process.env.NEXT_PUBLIC_STREAM_VIDEO_ID ?? "";
export const hlsSrc = "/movie/index.m3u8";
