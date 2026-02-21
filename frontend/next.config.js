/** @type {import('next').NextConfig} */
const nextConfig = {
  // Excalidraw uses dynamic imports with no SSR
  transpilePackages: ["@excalidraw/excalidraw"],
};

module.exports = nextConfig;
