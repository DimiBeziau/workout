import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'better-sqlite3': 'commonjs better-sqlite3' }]
    return config
  },
  output: 'standalone',
}

export default nextConfig
