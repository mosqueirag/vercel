import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "hfmasofcekigldbysryg.supabase.co", pathname: "/storage/v1/object/public/news-images/**" },
      { protocol: "https", hostname: "www.coopsar.com.ar", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "coopsar.com.ar", pathname: "/wp-content/uploads/**" },
    ],
  },
};
export default nextConfig;
