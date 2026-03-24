/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // We handle type safety ourselves; this prevents build failures from
    // Supabase's inferred types conflicting with our manual types.
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
