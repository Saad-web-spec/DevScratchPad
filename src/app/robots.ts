import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
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
      },
    ],
    sitemap: "https://www.devscratchpad.tech/sitemap.xml",
    host: "https://www.devscratchpad.tech",
  };
}
