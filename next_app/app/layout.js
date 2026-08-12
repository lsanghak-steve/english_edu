import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Steve Voca (스티브 보카) - 초/중/고 5,000개 스마트 영단어 학습",
  description: "초등, 중등, 고등/수능 필수 영단어 5,000개와 AI 발음 평가, 1~4단계 퀴즈를 제공하는 스마트 영어 학습 애플리케이션",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
