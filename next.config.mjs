/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8532',
        pathname: '/cid-thumbnail/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8532',
        pathname: '/cid-content/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
