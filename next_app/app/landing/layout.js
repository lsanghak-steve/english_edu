// /landing 전용 메타데이터 — 페이지 컴포넌트가 'use client' 라 여기(서버 레이아웃)에 둔다.
export const metadata = {
  title: "플립보카 소개 - 초등·중등·수능 영단어 3D 학습 | FlipVoca",
  description:
    "플립보카(FlipVoca)는 초등부터 수능까지 필수 영단어 5,000개를 3D 플립 카드로 암기하고, AI 발음 평가와 4단계 퀴즈로 복습하는 영어 학습 서비스입니다. 학부모 대시보드와 매일 출석도장으로 학습 습관을 만들어 줍니다.",
  alternates: { canonical: "https://www.flipvoca.com/landing" },
};

export default function LandingLayout({ children }) {
  return children;
}
