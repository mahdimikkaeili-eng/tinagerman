import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // بسته‌های خارجی سرور - Server external packages
  // Prisma باید در محیط standalone به صورت خارجی بارگذاری شود
  serverExternalPackages: ['@prisma/client', 'sharp'],

  // تنظیمات تصاویر - Images configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tinagerman.com',
      },
      {
        protocol: 'https',
        hostname: 'www.tinagerman.com',
      },
    ],
  },

  // نادیده گرفتن خطاهای تایپ‌اسکریپت در بیلد - Ignore TypeScript errors in build
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,
};

export default nextConfig;
