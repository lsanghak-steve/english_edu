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
      // ※ 루트(/) → /msv1 리디렉션은 제거(2026-09-22): 루트가 SEO 랜딩을 직접 서빙하고,
      //   로그인된 학생은 app/page.js 가 클라이언트에서 /msv1 로 즉시 전환한다.
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
