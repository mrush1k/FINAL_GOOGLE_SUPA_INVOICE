/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Compression and caching
  compress: true,
  
  // Static generation optimizations
  generateEtags: true,
  poweredByHeader: false,
  
  // Output optimization
  output: 'standalone'
};

module.exports = nextConfig;
