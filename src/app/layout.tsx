import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE_URL = "https://tools.saadengineer.works";

export const metadata: Metadata = {
  title: {
    template: "%s – Free Online Developer Utility | DevScratchpad",
    default: "DevScratchpad – Free Online Developer Utilities",
  },
  description:
    "Fast, client-side developer tools. 100% private, zero server transmission. Process JSON, JWT, cURL commands, diffs, and Unix timestamps instantly in your browser.",
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
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col bg-white text-slate-900 overflow-hidden">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
