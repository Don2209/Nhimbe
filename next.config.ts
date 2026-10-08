import type { NextConfig } from "next";

// Every page is per-user and reads the session, so the app renders dynamically
// on each request; Cache Components is left off to keep data access simple.
const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/admin/projects", destination: "/projects", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
