/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Prevent ESLint interactive prompt or lint checks from halting Vercel builds
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
