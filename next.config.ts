import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "" },
          { key: "Content-Security-Policy", value: "frame-ancestors * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src * 'self' data: blob:;" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
