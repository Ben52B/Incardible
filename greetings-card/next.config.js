const path = require('path');

module.exports = {
  reactStrictMode: false,
  compress: true,
  // The shared AR renderer lives outside this app (packages/incardible-ar) and
  // ships as ESM; its bare imports must resolve from this app's node_modules.
  transpilePackages: ['incardible-ar'],
  webpack: (config) => {
    // Alias to the ESM build explicitly: resolving the package directory lets the
    // server bundle pick the CommonJS build, which webpack cannot tree-shake and
    // then rejects named imports from ("'CanvasTexture' is not exported").
    config.resolve.alias = { ...(config.resolve.alias || {}), three$: path.resolve(__dirname, 'node_modules/three/build/three.module.js') };
    config.resolve.modules = [...(config.resolve.modules || []), path.resolve(__dirname, 'node_modules')];
    return config;
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
