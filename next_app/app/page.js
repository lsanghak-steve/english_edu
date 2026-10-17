'use client';

// 루트(/) = SEO 랜딩. 크롤러·첫 방문자는 랜딩 콘텐츠를 보고,
// 현재 탭에서 명시적으로 로그인한 학생만 학습관(/msv1)으로 이동한다.
// (종전에는 vercel.json·next.config 리디렉션으로 /msv1 직행 — 그 방식은 루트에
//  색인할 콘텐츠가 없어 구글이 "리디렉션이 포함된 페이지"로 색인을 거부했다. 2026-09-22)
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './landing/page.js';
import { readStudentSession } from '../lib/studentSession.js';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (readStudentSession()) {
        router.replace('/msv1');
      }
    } catch (e) {}
  }, [router]);

  return <LandingPage />;
}
