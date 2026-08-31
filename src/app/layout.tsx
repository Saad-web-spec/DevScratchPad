import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: {
    template: "%s | DevScratchpad",
    default: "DevScratchpad – 100% Offline, Private Developer Tools",
  },
  description:
    "Free online developer tools that work 100% offline. JSON formatter, JWT decoder, Base64 encoder, cURL converter & more. Zero server transmission. Your data never leaves your browser.",
  keywords: [
    "developer tools offline",
    "private developer tools",
    "client-side developer tools",
    "zero server transmission",
    "JSON formatter offline",
    "JWT decoder offline",
    "Base64 encoder offline",
    "diff checker private",
    "SQL formatter offline",
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
