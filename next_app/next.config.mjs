/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 컨테이너 배포 시에만 standalone 적용, Vercel/로컬에서는 네이티브 배포 지원
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  allowedDevOrigins: [
    '*.trycloudflare.com',
    'localhost:3000',
    '127.0.0.1:3000',
    '100.76.39.12:3000',
    '100.76.39.12',
    '*.ts.net',
    '*.loca.lt',
  ],
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
      // 메인 홈(/) 접속 시 msv1 (스마트 영단어 학습관)으로 바로 직행
      {
        source: '/',
        destination: '/msv1',
        permanent: false,
      },
      // 구주소 보존: 학생 북마크·홈화면 바로가기가 /modern-study 를 가리킨다 (폴더명 msv1 변경, 2026-09-14)
      {
        source: '/modern-study',
        destination: '/msv1',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/word_img/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/audio/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
