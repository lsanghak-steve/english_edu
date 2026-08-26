import "./globals.css";

export const metadata = {
  title: "VocaFlip (보카플립) - 초/중/고 5,000개 3D 플립 스마트 영단어 학습",
  description: "초등, 중등, 고등/수능 필수 영단어 5,000개와 3D 플립 카드, AI 발음 평가, 1~4단계 퀴즈, 매일 출석도장을 제공하는 스마트 영어 학습 플랫폼 VocaFlip (보카플립)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
