import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // بسته‌های خارجی سرور - Server external packages
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

  // بهینه‌سازی بسته‌ها — کاهش قابل توجه حجم JS - Optimize package imports
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'recharts',
      'date-fns',
      '@radix-ui/react-icons',
    ],
  },

  // فشرده‌سازی - Compression
  compress: true,

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
    ];
  },

  // هدرهای امنیتی، سئو و کش - Security, SEO and Cache headers
  async headers() {
    return [
      {
        // کش بلندمدت برای فایل‌های استاتیک Next.js
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // هدرهای امنیتی برای همه صفحات
        source: '/:path*',
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
