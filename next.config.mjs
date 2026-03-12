/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'pattern-85d1-khrbwfqay-noldor99.vercel.app' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: '**.rozetka.com.ua', pathname: '/**' },
      {
        protocol: 'https',
        hostname: 'content.rozetka.com.ua',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
