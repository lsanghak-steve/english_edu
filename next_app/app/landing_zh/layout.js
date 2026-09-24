// /landing_zh 전용 메타데이터 — 페이지 컴포넌트가 'use client' 라 여기(서버 레이아웃)에 둔다.
// 루트 캐노니컬(홈) 상속 시 "홈의 대체 페이지"로 분류돼 색인에서 빠진다(서치콘솔 실측 2026-09-24).
export const metadata = {
  title: "FlipVoca (翻转单词卡) - 3D智能英语单词学习",
  description:
    "FlipVoca 提供5,000个必备英语单词、3D翻转卡片、AI发音评测、四阶段测验和每日出勤印章的智能英语学习平台",
  alternates: { canonical: "https://www.flipvoca.com/landing_zh" },
  openGraph: { locale: "zh_CN" },
};

export default function LandingZhLayout({ children }) {
  return children;
}
