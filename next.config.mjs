/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizeCss: true,
  },
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
        pathname: '/dcmbwtreb/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    qualities: [75, 90, 100],
  },
  serverExternalPackages: ['cloudinary'],
  async headers() {
    // ✅ AUDIT FIX #2 - Security Headers + CSP
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://accounts.google.com" + (process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ""),
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "img-src 'self' res.cloudinary.com images.unsplash.com data: blob:",
          "font-src 'self' fonts.gstatic.com",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.brevo.com https://api.cloudinary.com https://accounts.google.com api.razorpay.com checkout.razorpay.com https://vitals.vercel-insights.com" + (process.env.NODE_ENV === 'development' ? " ws://localhost:3000" : ""),
          "frame-src https://api.razorpay.com https://accounts.google.com checkout.razorpay.com",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
        ].join('; '),
      },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

