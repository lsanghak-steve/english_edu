// 관리자 화면은 검색 색인 대상이 아니다 (robots.js 의 disallow 와 이중 방어).
export const metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
