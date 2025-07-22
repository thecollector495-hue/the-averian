
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Add a rule to handle .node files for web-push
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    });

    if (!isServer) {
      // This is to prevent errors from trying to use Node.js modules in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "fs": false,
        "net": false,
        "tls": false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
