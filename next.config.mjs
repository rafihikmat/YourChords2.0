/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // ====================================================================
  // SERVER GUARD LAYER 2: REWRITES DEFENSE IN DEPTH FOR HIDDEN PATHS
  // ====================================================================
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/.git/:path*',
          destination: '/404',
        },
        {
          source: '/.git',
          destination: '/404',
        },
        {
          source: '/.env/:path*',
          destination: '/404',
        },
        {
          source: '/.env',
          destination: '/404',
        },
        {
          source: '/.config/:path*',
          destination: '/404',
        },
        {
          source: '/.vscode/:path*',
          destination: '/404',
        },
        {
          source: '/.idea/:path*',
          destination: '/404',
        },
      ],
    };
  },

  // ====================================================================
  // HTTP SECURITY HEADERS CONFIGURATION
  // ====================================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: wss:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
