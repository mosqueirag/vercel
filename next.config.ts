import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()" },
      ],
    }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hfmasofcekigldbysryg.supabase.co", pathname: "/storage/v1/object/public/news-images/**" },
      { protocol: "https", hostname: "www.coopsar.com.ar", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "coopsar.com.ar", pathname: "/wp-content/uploads/**" },
    ],
  },
};
export default nextConfig;
