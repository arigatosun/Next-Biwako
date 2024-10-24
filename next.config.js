// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  

  // 画像に関する設定
  images: {
    domains: ['placeholder.com', 'api.placeholder.com'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  webpack: (config) => {
    // .woff2 ファイルの設定
    config.module.rules.push({
      test: /\.(woff|woff2)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    });

    // .mjs ファイルのサポート
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },

  // ESLint の警告を無視する設定
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
