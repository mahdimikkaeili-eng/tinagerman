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

  // ریدایرکت‌ها - Redirects
  async redirects() {
    return [
      // ریدایرکت www به non-www - Redirect www to non-www
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.tinagerman.com',
          },
        ],
        destination: 'https://tinagerman.com/:path*',
        permanent: true,
      },
      // ریدایرکت HTTP به HTTPS handled by server/proxy
    ];
  },

  // هدرهای امنیتی و سئو - Security and SEO headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
