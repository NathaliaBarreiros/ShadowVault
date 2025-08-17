/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ignore missing modules during build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@aztec/bb.js': false,
    }
    
    // Suppress specific module not found warnings
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@aztec\/bb\.js'/,
      /Module not found: Can't resolve '.*noir-integration'/,
    ]
    
    return config
  },
}

export default nextConfig
