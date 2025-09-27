/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
  },
  // Enable static optimization
  output: 'standalone',
  // Optimize bundle splitting
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Faster development builds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }
    
    // Optimize for faster compilation
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    
    return config
  },
  // Enable incremental static regeneration for better performance
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig

