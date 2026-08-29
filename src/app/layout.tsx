import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const SITE_URL = "https://tools.saadengineer.works";

export const metadata: Metadata = {
  title: {
    template: "%s | DevScratchpad",
    default: "DevScratchpad – 19+ Free Online Developer Tools | 100% Private",
  },
  description:
    "Free online developer tools — JSON formatter, JWT decoder, Base64 encoder, cURL converter, diff checker, regex tester & more. 100% client-side, zero server transmission. Your data never leaves your browser.",
  keywords: [
    "developer tools",
    "online developer tools",
    "free developer tools",
    "JSON formatter online",
    "JWT decoder online",
    "Base64 encoder decoder",
    "cURL to Python converter",
    "diff checker online",
    "regex tester",
    "SQL formatter",
    "YAML to JSON converter",
    "Unix timestamp converter",
    "hash generator",
    "HMAC generator",
    "CIDR calculator",
    "client-side tools",
    "privacy-first developer tools",
    "DevScratchpad",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "DevScratchpad",
    locale: "en_US",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    // Replace with your actual Google Search Console verification code
    google: "YOUR_GOOGLE_SITE_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
