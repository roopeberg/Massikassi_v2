import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lean, self-contained build for the Docker image (docker-compose.yml).
  output: "standalone",
};

export default nextConfig;
