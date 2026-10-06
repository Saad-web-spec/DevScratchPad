import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Applebot",
          "DuckDuckBot",
          "Baiduspider",
          "YandexBot",
          "Slurp",
          "GPTBot",
          "ChatGPT-User",
          "OAI-SearchBot",
          "PerplexityBot",
          "ClaudeBot",
          "anthropic-ai",
          "Cohere-ai",
          "facebookexternalhit",
          "Twitterbot",
          "LinkedInBot",
        ],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: "https://www.devscratchpad.tech/sitemap.xml",
    host: "https://www.devscratchpad.tech",
  };
}
