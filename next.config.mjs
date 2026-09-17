/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 컨테이너 배포 시에만 standalone 적용, Vercel/로컬에서는 네이티브 배포 지원
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  allowedDevOrigins: ['*.trycloudflare.com', 'localhost:3000'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sqonhhqosyszncjfoxfd.supabase.co',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/msv1',
        permanent: false,
      },
      {
        source: '/modern-study',
        destination: '/msv1',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
