/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.onrender.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/be-a-guest',
        destination: '/nominate-a-leader',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://www.gravatar.com https://*.gravatar.com https://i.ytimg.com https://img.youtube.com https://*.amazonaws.com https://*.google-analytics.com https://*.supabase.co https://*.onrender.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "frame-src 'self' https://www.youtube-nocookie.com",
              "connect-src 'self' http://localhost:3000 http://127.0.0.1:3000 ws: wss: https://www.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self' http://localhost:3000 http://127.0.0.1:3000",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
