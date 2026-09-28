/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "playwright-core",
      "chromium-bidi",
      "devtools-protocol"
    ]
  }
};

export default nextConfig;
