import { readFileSync } from 'fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: false },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });
    // Keep JS minification on; only drop the CSS minimizer, which chokes on
    // Tailwind data-attribute selector escapes.
    // Keep JS (Terser) minification on; only drop Next's CSS minimizer, which
    // chokes on Tailwind data-attribute selector escapes. Next wraps each
    // minimizer as a `(compiler) => {}` closure, so match it by source.
    if (config.optimization?.minimizer) {
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (plugin) =>
          !(typeof plugin === 'function' && /CssMinimizerPlugin/.test(plugin.toString()))
      );
    }
    return config;
  },
};

export default nextConfig;
