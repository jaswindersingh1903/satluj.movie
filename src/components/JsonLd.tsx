import { faq } from "@/lib/faq";
import { movie } from "@/lib/movie";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://satluj.movie";
const posterAbsolute = `${siteUrl}/og-image.jpg`;
const hlsAbsolute = `${siteUrl}/movie/index.m3u8`;

// ISO-8601 duration: 2h 43m -> PT2H43M
function isoDuration(runtime: string): string {
  const match = runtime.match(/(\d+)\s*h\s*(\d+)?\s*m?/i);
  if (!match) return "PT0S";
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  return `PT${h}H${m}M`;
}

const graph = [
  {
    "@type": "Movie",
    "@id": `${siteUrl}/#movie`,
    name: movie.title,
    alternateName: movie.alternateTitles,
    description: movie.description,
    image: posterAbsolute,
    url: siteUrl,
    genre: movie.genres,
    inLanguage: ["pa", "hi"],
    countryOfOrigin: { "@type": "Country", name: "India" },
    dateCreated: String(movie.year),
    datePublished: "2026-07-03",
    duration: isoDuration(movie.runtime),
    director: {
      "@type": "Person",
      name: movie.director,
    },
    productionCompany: movie.studios.map((s) => ({
      "@type": "Organization",
      name: s,
    })),
    actor: movie.cast.map((c) => ({
      "@type": "Person",
      name: c.name,
      ...(c.role ? { characterName: c.role } : {}),
    })),
    sameAs: [movie.imdbUrl, "https://en.wikipedia.org/wiki/Satluj_(film)"],
    keywords: [
      "Satluj",
      "Punjab '95",
      "Jaswant Singh Khalra",
      "human rights",
      "Punjab",
      "Sikh history",
    ].join(", "),
  },
  {
    "@type": "VideoObject",
    "@id": `${siteUrl}/#video`,
    name: `${movie.title} (${movie.year})`,
    description: movie.description,
    thumbnailUrl: [posterAbsolute],
    uploadDate: "2026-07-03",
    duration: isoDuration(movie.runtime),
    contentUrl: hlsAbsolute,
    embedUrl: siteUrl,
    encodingFormat: "application/vnd.apple.mpegurl",
    inLanguage: ["pa", "hi"],
    isFamilyFriendly: false,
    publisher: {
      "@type": "Organization",
      name: "Satluj.movie",
      url: siteUrl,
    },
  },
  {
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Satluj.movie",
    url: siteUrl,
    logo: `${siteUrl}/og-image.jpg`,
    description:
      "The official free streaming home for Satluj (2026), a tribute to human rights activist Jaswant Singh Khalra.",
  },
  {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: "Satluj.movie",
    url: siteUrl,
    inLanguage: "en",
    publisher: { "@id": `${siteUrl}/#organization` },
    about: { "@id": `${siteUrl}/#movie` },
  },
  {
    "@type": "BreadcrumbList",
    "@id": `${siteUrl}/#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: `${movie.title} (${movie.year})`,
        item: `${siteUrl}/`,
      },
    ],
  },
  {
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": graph,
};

export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
