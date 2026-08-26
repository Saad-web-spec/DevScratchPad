import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production will be served at tools.saadengineer.works
  // No basePath needed since it's a dedicated subdomain
  devIndicators: false,
};

export default nextConfig;
