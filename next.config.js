/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For AWS Lambda/serverless deployment
}

module.exports = nextConfig

