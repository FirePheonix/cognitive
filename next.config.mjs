/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  // No static export — pages render on-demand via Vercel SSR and are
  // cached at the edge. This avoids pre-building hundreds of HTML files
  // which exhausts Vercel's build-time disk space.
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  typescript: {
    // Type-check separately with `npm run typecheck`; skip during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'shiki', 'mermaid'],
  },
};

export default nextConfig;
