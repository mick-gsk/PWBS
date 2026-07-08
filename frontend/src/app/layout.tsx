import "./globals.css";
import "@/styles/a11y.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const plausibleSrc =
  process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

export const metadata: Metadata = {
  title: "PWBS – Personal Knowledge Operating System",
  description:
    "Cognitive infrastructure for knowledge workers: briefings, semantic search, and a knowledge graph.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {plausibleDomain && (
          <Script
            defer
            data-domain={plausibleDomain}
            src={plausibleSrc}
            strategy="afterInteractive"
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
