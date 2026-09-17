import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.flipvoca.com"),
  title: "FlipVoca (플립보카) - 5,000단어 3D 스마트 영단어 학습",
  description: "초등부터 수능까지 필수 영단어 5,000개, 3D 플립 카드, AI 발음 평가, 4단계 퀴즈, 매일 출석도장을 제공하는 스마트 영어 학습 플랫폼 FlipVoca",
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
  },
  verification: {
    google: "dGOGHe5ZIqQtbWuMR2MBVELzXMojaVLXki60_IIHjDk",
    other: {
      "naver-site-verification": "a714d19f81d25031de6b0337b1e0cc59e31e3860",
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <meta name="naver-site-verification" content="a714d19f81d25031de6b0337b1e0cc59e31e3860" />
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
