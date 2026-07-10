import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://satluj.movie";

const title = "Satluj Movie – Watch Free | Tribute to Jaswant Singh Khalra";
const description =
  "Watch Satluj online for free on the official website. A tribute to Jaswant Singh Khalra and a powerful story inspired by courage, justice, and human rights.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Satluj.movie",
  keywords: [
    "Satluj",
    "Satluj movie",
    "Satluj film",
    "Satluj Punjabi movie",
    "Watch Satluj online",
    "Watch Satluj free",
    "Satluj full movie",
    "Satluj official website",
    "Punjab '95",
    "Jaswant Singh Khalra",
    "Jaswant Singh Khalra movie",
    "Jaswant Singh Khalra biography",
    "Punjab human rights",
    "Sikh history",
    "Punjabi historical drama",
    "Punjabi movie 2026",
    "Honey Trehan",
    "Diljit Dosanjh",
    "true story Punjabi movie",
    "based on true events",
  ],
  authors: [{ name: "Honey Trehan" }],
  creator: "RSVP Movies · MacGuffin Pictures",
  publisher: "Satluj.movie",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "video.movie",
    url: "/",
    siteName: "Satluj.movie",
    title,
    description,
    locale: "en_US",
    alternateLocale: ["pa_IN", "hi_IN"],
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 502,
        alt: "Satluj (2026) — starring Diljit Dosanjh as Jaswant Singh Khalra",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  category: "Movies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Buy Me a Coffee widget — temporarily hidden.
            Uncomment to re-enable. Must stay a plain <script> tag at
            end-of-body (no async) so its DOMContentLoaded listener
            registers before the event fires.
        <script
          src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
          data-name="BMC-Widget"
          data-cfasync="false"
          data-id="jaswindersingh"
          data-description="Support me on Buy me a coffee!"
          data-message="If this story matters to you, please consider donating to help keep this project online and support future initiatives."
          data-color="#FF813F"
          data-position="Right"
          data-x_margin="18"
          data-y_margin="18"
        />
        */}
      </body>
    </html>
  );
}
