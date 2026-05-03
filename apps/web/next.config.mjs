/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'attractive-curiosity-production-e0ef.up.railway.app',
          },
        ],
        destination: 'https://frontend.r-hub.xyz/:path*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
