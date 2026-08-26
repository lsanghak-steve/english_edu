import "./globals.css";

export const metadata = {
  title: "PopVoca (팝보카) - 초/중/고 5,000개 3D 스마트 영단어 학습",
  description: "초등, 중등, 고등/수능 필수 영단어 5,000개와 AI 발음 평가, 1~4단계 퀴즈, 매일 출석도장을 제공하는 3D 스마트 영어 학습 플랫폼 PopVoca (팝보카)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
