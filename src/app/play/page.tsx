import type { Metadata } from "next";

import { MovieLanding } from "@/components/MovieLanding";

// /play is the default route; the root path 301-redirects here (see
// public/_redirects), so this page must self-canonicalize rather than
// inherit the layout's canonical of "/".
export const metadata: Metadata = {
  alternates: { canonical: "/play" },
};

export default function Play() {
  return <MovieLanding />;
}
