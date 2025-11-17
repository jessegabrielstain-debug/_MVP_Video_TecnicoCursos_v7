const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/estudio_ia_videos/:path*',
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
