/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  basePath: process.env.NODE_ENV === 'production' ? '/ArkPalette' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ArkPalette/' : '',
}

export default nextConfig;
