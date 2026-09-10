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
      {
        source: "/workspace",
        destination: "/",
        permanent: true,
      },
      {
        source: "/tools/ai-skill-studio",
        destination: "/ai-skill-studio",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/fastapi-ai",
        destination: "/ai-skill-studio/:format/fastapi",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/fastapi-ai-backend",
        destination: "/ai-skill-studio/:format/fastapi",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/claude-auditor",
        destination: "/ai-skill-studio/:format/codebase-auditor",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/nextjs",
        destination: "/ai-skill-studio/:format/nextjs-15",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/nextjs-fullstack-pro",
        destination: "/ai-skill-studio/:format/nextjs-15",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/react",
        destination: "/ai-skill-studio/:format/react-19",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/react-modern-spa",
        destination: "/ai-skill-studio/:format/react-19",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/tailwind",
        destination: "/ai-skill-studio/:format/tailwind-v4",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/tailwind-v4-styling",
        destination: "/ai-skill-studio/:format/tailwind-v4",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/cursor-pro",
        destination: "/ai-skill-studio/:format/cursor-rules-pro",
        permanent: true,
      },
      {
        source: "/ai-skill-studio/:format/postgresql",
        destination: "/ai-skill-studio/:format/postgres",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/tools/base64-decode", destination: "/tools/base64-inspector" },
        { source: "/tools/base64-decoder", destination: "/tools/base64-inspector" },
        { source: "/tools/base64-encode", destination: "/tools/base64-inspector" },
        { source: "/tools/base64-encoder", destination: "/tools/base64-inspector" },
        { source: "/tools/jwt-decode", destination: "/tools/jwt" },
        { source: "/tools/jwt-decoder", destination: "/tools/jwt" },
        { source: "/tools/bcrypt-generator", destination: "/tools/password-hash" },
        { source: "/tools/argon2-hash", destination: "/tools/password-hash" },
        { source: "/tools/sha256-hash", destination: "/tools/hash" },
        { source: "/tools/md5-hash", destination: "/tools/hash" },
        { source: "/tools/sha1-hash", destination: "/tools/hash" },
        { source: "/tools/regex-tester", destination: "/tools/regex" },
        { source: "/tools/regex-checker", destination: "/tools/regex" },
        { source: "/tools/unix-timestamp-converter", destination: "/tools/epoch-converter" },
        { source: "/tools/timestamp-converter", destination: "/tools/epoch-converter" },
        { source: "/tools/text-diff", destination: "/tools/diff" },
        { source: "/tools/code-diff", destination: "/tools/diff" },
        { source: "/tools/diff-checker", destination: "/tools/diff" },
      ],
    };
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
      // 1. Crawler & metadata endpoints: unrestricted access with CORS and caching
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain; charset=utf-8',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=utf-8',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=86400',
          },
        ],
      },
      // 2. Tool routes: allow iframe embedding for the interactive embed feature
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
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectivesEmbed,
          },
        ],
      },
      // 3. All other HTML routes: prevent clickjacking with strict frame-ancestors and X-Frame-Options
      {
        source: '/((?!tools/|_next/|robots\\.txt|sitemap\\.xml|llms\\.txt|llms-full\\.txt).*)',
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
            value: 'camera=(), microphone=(), geolocation=()',
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
