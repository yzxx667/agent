import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化配置
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'lucide-react'],
  },

  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 压缩配置
  compress: true,

  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',

  // 页面扩展名
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
