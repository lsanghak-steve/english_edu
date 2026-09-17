import "./globals.css";

export const metadata = {
  title: "Steve Voca (스티브 보카) - 초/중/고 5,000개 스마트 영단어 학습",
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
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
