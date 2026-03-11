/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'pattern-85d1-khrbwfqay-noldor99.vercel.app' },
      { protocol: 'https', hostname: 'loremflickr.com' },
    ],
  },
}

export default nextConfig
