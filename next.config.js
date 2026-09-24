/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Only ship the drei / postprocessing helpers we actually import.
    optimizePackageImports: ['@react-three/drei', '@react-three/postprocessing'],
  },
};

module.exports = nextConfig;
