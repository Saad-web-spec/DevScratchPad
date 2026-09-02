import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/lib/theme";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = "https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: {
    template: "%s | DevScratchpad",
    default: "DevScratchpad - 100% Offline, Privacy Backed Developer Tools",
  },
  description:
    "Massive collection of free online developer tools that work 100% offline. JSON formatter, YAML to JSON, cURL to Go, JWT decoder, Base64 encoder, SSH key generator, Password hashing, and more. Zero server transmission, 100% client-side privacy backed scratch pad for developers.",
  keywords: [
    "developer tools",
    "developers",
    "devscratchpad",
    "devscratchpad.tech",
    "scratch pad",
    "developer scratchpad",
    "json formatter",
    "json formatter- privacy backed",
    "yaml to json",
    "curl to go",
    "jwt decoder",
    "base64 encoder",
    "ssh key generator",
    "password hash verifier",
    "x509 cert decoder",
    "cron expression visualizer",
    "privacy focused tools",
    "zero server transmission",
    "100% client-side developer tools"
  ],
  authors: [{ name: "DevScratchpad" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    siteName: "DevScratchpad",
    locale: "en_US",
    url: SITE_URL,
    title: "DevScratchpad - 100% Offline, Privacy Backed Developer Tools",
    description:
      "Massive collection of free online developer tools that work 100% offline. Zero server transmission. Privacy backed scratch pad for developers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DevScratchpad - 100% Offline, Privacy Backed Developer Tools",
    description:
      "Massive collection of free online developer tools that work 100% offline. Zero server transmission. Privacy backed scratch pad for developers.",
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
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        {process.env.NODE_ENV === "development" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                  caches.keys().then(function(names) {
                    for (let name of names) caches.delete(name);
                  });
                }
              `,
            }}
          />
        )}
      </head>
      <body
        className={`antialiased min-h-screen flex flex-col bg-white text-zinc-900 ${inter.className}`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
