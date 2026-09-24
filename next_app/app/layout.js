import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.flipvoca.com"),
  title: "FlipVoca (플립보카) - 5,000단어 3D 스마트 영단어 학습",
  description: "초등부터 수능까지 영단어 5,000개를 3D 플립 카드와 AI 발음 평가, 4단계 퀴즈로 학습하는 플립보카(FlipVoca)",
  keywords: ["FlipVoca", "플립보카", "영어단어", "초등영단어", "중등영단어", "고등영단어", "수능영단어", "영단어학습", "플래시카드", "발음평가"],
  alternates: {
    canonical: "https://www.flipvoca.com",
  },
  openGraph: {
    title: "FlipVoca (플립보카) - 3D 스마트 영단어 학습",
    description: "초등부터 수능까지 5,000단어 3D 플립 암기 & AI 발음 교정 & 매일 출석도장",
    url: "https://www.flipvoca.com",
    siteName: "FlipVoca (플립보카)",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "FlipVoca (플립보카)" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FlipVoca (플립보카) - 3D 스마트 영단어 학습",
    description: "초등부터 수능까지 5,000단어 3D 플립 암기 & AI 발음 교정 & 매일 출석도장",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  verification: {
    google: "dGOGHe5ZIqQtbWuMR2MBVELzXMojaVLXki60_IIHjDk",
    other: {
      "naver-site-verification": "5675d24a9e2959f4d226f3ef6a70d33eabb505d0",
    },
  },
};

// 구조화 데이터(JSON-LD) — 구글이 사이트·앱 정보를 검색 결과에 풍부하게 노출하는 근거
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "FlipVoca (플립보카)",
      alternateName: ["FlipVoca", "플립보카"],
      url: "https://www.flipvoca.com",
    },
    {
      "@type": "SoftwareApplication",
      name: "FlipVoca (플립보카)",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: "https://www.flipvoca.com",
      description:
        "초등부터 수능까지 필수 영단어 5,000개를 3D 플립 카드·AI 발음 평가·4단계 퀴즈·매일 출석도장으로 학습하는 스마트 영어 학습 플랫폼",
      inLanguage: "ko",
      offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <meta name="naver-site-verification" content="5675d24a9e2959f4d226f3ef6a70d33eabb505d0" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
