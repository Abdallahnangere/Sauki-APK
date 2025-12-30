/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placehold.co', 'picsum.photos'], // Allow external images for products
  },
  // Ensure we don't try to build the static export since we have API routes
  output: 'standalone', 
};

export default nextConfig;