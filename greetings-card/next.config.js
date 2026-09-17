const path = require('path');

module.exports = {
  reactStrictMode: false,
  compress: true,
  // The shared AR renderer lives outside this app (packages/incardible-ar) and
  // ships as ESM; its bare imports must resolve from this app's node_modules.
  transpilePackages: ['incardible-ar'],
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias || {}), three: path.resolve(__dirname, 'node_modules/three') };
    config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, 'node_modules')];
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
