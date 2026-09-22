'use client';

// 루트(/) = SEO 랜딩. 크롤러·첫 방문자는 랜딩 콘텐츠를 보고,
// 로그인된 학생은 종전(2026-09-14 결정)대로 학습관(/msv1)으로 즉시 직행한다.
// (종전에는 vercel.json·next.config 리디렉션으로 /msv1 직행 — 그 방식은 루트에
//  색인할 콘텐츠가 없어 구글이 "리디렉션이 포함된 페이지"로 색인을 거부했다. 2026-09-22)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './landing/page.js';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (localStorage.getItem('english_edu_current_user')) {
        router.replace('/msv1');
      }
    } catch (e) {}
  }, [router]);

  return <LandingPage />;
}
