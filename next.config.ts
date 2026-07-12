import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep heavy Node-only report libraries out of the bundler graph.
  serverExternalPackages: ["exceljs", "pdf-lib", "@prisma/client", "bcryptjs"],
};

export default nextConfig;
