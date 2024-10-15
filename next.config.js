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
  // experimentalセクションからappDirを削除
  // 必要に応じて他のexperimentalオプションを追加できます
  // 例:
  // experimental: {
  //   someOtherExperimentalOption: true,
  // },
};

module.exports = nextConfig;
