import type { Metadata } from"next";
import { Analytics } from"@vercel/analytics/react";
import { ThemeProvider } from"@/lib/theme";
import"./globals.css";

const SITE_URL ="https://www.devscratchpad.tech";

export const metadata: Metadata = {
  title: {
    template: "%s | DevScratchpad",
    default: "DevScratchpad � 100% Offline, Private Developer Tools",
  },
  description:
    "Free online developer tools that work 100% offline. JSON formatter, JWT decoder, Base64 encoder, SSH key generator, Password hashing, and more. Zero server transmission. Your data never leaves your browser.",
  keywords: ["developer tools", "offline tools", "json formatter", "jwt decoder", "base64 encoder", "ssh key generator", "password hash verifier", "x509 cert decoder", "cron expression visualizer", "privacy focused tools"],
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
    title: "DevScratchpad � 100% Offline, Private Developer Tools",
    description: "Free online developer tools that work 100% offline. Zero server transmission.",
    images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevScratchpad � 100% Offline, Private Developer Tools",
    description: "Free online developer tools that work 100% offline. Zero server transmission.",
    images: [`${SITE_URL}/opengraph-image`],
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
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white text-zinc-900">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
