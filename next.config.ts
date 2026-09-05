import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/learn",
        destination: "/blog",
        permanent: true,
      },
      {
        source: "/guides",
        destination: "/blog",
        permanent: true,
      },
    ];
  },
  async headers() {
    const commonCspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://cdn.jsdelivr.net",
      "connect-src 'self' https://vitals.vercel-insights.com https://cdn.jsdelivr.net",
      "worker-src 'self' blob: data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    const cspDirectivesStrict = [...commonCspDirectives, "frame-ancestors 'self'"].join("; ");
    const cspDirectivesEmbed = [...commonCspDirectives, "frame-ancestors *"].join("; ");

    return [
      // 1. Tool routes: allow iframe embedding for the interactive embed feature
      {
        source: '/tools/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectivesEmbed,
          },
        ],
      },
      // 2. All other routes: prevent clickjacking with strict frame-ancestors and X-Frame-Options
      {
        source: '/((?!tools/).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectivesStrict,
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withSerwist(nextConfig));
