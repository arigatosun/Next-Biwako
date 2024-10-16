/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // 既存のwoff2ファイルの設定
    config.module.rules.push({
      test: /\.(woff2)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]'
      }
    });

    // .mjsファイルのサポートを追加
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  },
  // ESLintの警告を無視する設定
  eslint: {
    ignoreDuringBuilds: true,
  },
  // experimentalセクションは必要に応じて追加できます
  // experimental: {
  //   someOtherExperimentalOption: true,
  // },
};

module.exports = nextConfig;