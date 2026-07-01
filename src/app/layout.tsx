import type { Metadata } from "next";
import "./globals.css";

// Fonts are loaded via @import in globals.css rather than next/font/google.
// next/font/google fetches from fonts.googleapis.com at build time, which
// some sandboxed/offline build environments block. The CSS @import approach
// works everywhere and degrades gracefully to the system-font fallbacks
// defined in globals.css if the network request fails at runtime.

export const metadata: Metadata = {
  title: "African Art Showroom — African Art & Sculpture",
  description:
    "A curated showroom for African sculpture and painting. Discover, follow, and collect work directly from the artists who make it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
