/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['10.10.1.199'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    qualities: [75, 90, 100],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';

    // script-src: add 'unsafe-eval' in dev for webpack HMR + React Refresh
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com"
      : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://accounts.google.com";

    // connect-src: add HMR WebSocket in dev
    const connectSrc = isDev
      ? "connect-src 'self' https://*.supabase.co https://api.brevo.com wss://*.supabase.co https://accounts.google.com ws://localhost:3000"
      : "connect-src 'self' https://*.supabase.co https://api.brevo.com wss://*.supabase.co https://accounts.google.com";

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "img-src 'self' data: res.cloudinary.com images.unsplash.com",
              connectSrc,
              "frame-src https://api.razorpay.com https://accounts.google.com",
              "font-src 'self' https://fonts.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

