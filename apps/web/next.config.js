/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/calculations', '@repo/database', '@repo/validation'],
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
