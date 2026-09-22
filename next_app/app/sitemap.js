// 표준 URL 은 www (layout.js canonical 과 일치시킨다 — non-www 는 www 로 리디렉션됨).
// 리디렉션 페이지(/modern-study)와 로그인·학습관(앱 화면)은 색인 가치가 없어 넣지 않는다.
export default function sitemap() {
  const baseUrl = 'https://www.flipvoca.com';
  const currentDate = new Date().toISOString();

  return [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/landing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/landing_zh`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
