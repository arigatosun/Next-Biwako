/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(woff2)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    });
    return config;
  },
  // ESLintの警告を無視する設定を追加
  eslint: {
    ignoreDuringBuilds: true,
  },
  // experimentalセクションは必要に応じて追加できます
  // experimental: {
  //   someOtherExperimentalOption: true,
  // },
};

module.exports = nextConfig;