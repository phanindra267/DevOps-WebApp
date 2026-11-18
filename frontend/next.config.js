/** @type {import('next').NextConfig} */
// In Docker Compose the backend service is named "backend"; in Kubernetes the
// Service is "cloudops-sentinel-backend". Override with API_UPSTREAM at build
// time (or let the ALB Ingress route /api directly and drop the rewrite).
const apiUpstream = process.env.API_UPSTREAM || 'http://backend:8080'

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiUpstream}/api/:path*`,
      },
    ]
  },
}
module.exports = nextConfig
