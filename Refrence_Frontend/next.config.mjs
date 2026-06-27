/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Fix cross-origin WebSocket issues
  allowedDevOrigins: ['192.168.1.66'],
  
  // Fix workspace root warning
  turbopack: {
    root: '.'
  },
}

export default nextConfig
