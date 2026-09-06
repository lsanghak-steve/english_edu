import Link from 'next/link';

export const metadata = {
  title: '개인정보처리방침 - FlipVoca (플립보카)',
  description: 'FlipVoca 서비스의 개인정보처리방침 및 서비스 이용약관 안내'
};

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      color: '#1E293B',
      lineHeight: 1.7
    }}>
      <div style={{
        maxWidth: '860px',
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: '28px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.06)',
        padding: '40px 32px',
        border: '1px solid #E2E8F0'
      }}>
        {/* 헤더 네비게이션 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid #F1F5F9', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '30px' }}>📜</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>
                개인정보처리방침 및 이용약관
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                FlipVoca (플립보카) 스마트 영단어 학습 플랫폼
              </p>
            </div>
          </div>
          <Link
            href="/modern-login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: '#F1F5F9',
              color: '#334155',
              borderRadius: '14px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '800',
              transition: 'all 0.15s ease'
            }}
          >
            ← 로그인 화면으로
          </Link>
        </div>

        {/* 탭/목차 안내 */}
        <div style={{
          background: '#F8FAFC',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          marginBottom: '32px'
        }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#475569', fontWeight: '700' }}>
            FlipVoca(이하 &apos;서비스&apos;)는 초·중·고 학생 및 학부모님의 소중한 개인정보를 안전하게 보호하며, 
            <strong> 「개인정보 보호법」</strong> 및 <strong>「정보통신망 이용촉진 및 정보보호 등에 관한 법률」</strong>을 준수합니다.
          </p>
          <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#64748B' }}>
            시행일자: 2026년 9월 1일 | 최종 개정일: 2026년 9월 6일
          </div>
        </div>

        {/* 제1조 수집하는 개인정보 항목 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#00A8BF', borderLeft: '4px solid #00A8BF', paddingLeft: '12px', margin: '0 0 12px 0' }}>
            제1조 (수집하는 개인정보 항목 및 수집 방법)
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 10px 0' }}>
            서비스는 학생별 맞춤 학습 진도 관리, 오답노트 저장, 출석 도장 기록 및 학부모 리포트 제공을 위해 최소한의 정보만을 수집합니다.
          </p>
          <div style={{ background: '#FAF5FF', padding: '14px 18px', borderRadius: '14px', border: '1px solid #E9D5FF', fontSize: '13.5px' }}>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#581C87', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>학생 기본 정보</strong>: 학생 이름(닉네임), 학년 구분(초등·중등·고등·성인), 학생 PIN(비밀번호 4자리)</li>
              <li><strong>학습 기록 데이터</strong>: 일일 단어 학습 이력, 퀴즈 채점 결과, 취약 오답 단어, 출석 날짜 및 도장 획득 여부</li>
              <li><strong>음성 발음 평가 데이터</strong>: 학생 발음 평가를 위한 마이크 실시간 음성 녹음 바이너리(선택적 오디오 데이터)</li>
              <li><strong>학부모 연동 정보(선택)</strong>: 학부모 성함, 학부모 비상 연락처(휴대폰 번호), 학부모 전용 조회 PIN(4자리)</li>
            </ul>
          </div>
        </section>

        {/* 제2조 수집 및 이용 목적 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#00A8BF', borderLeft: '4px solid #00A8BF', paddingLeft: '12px', margin: '0 0 12px 0' }}>
            제2조 (개인정보의 수집 및 이용 목적)
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 10px 0' }}>
            수집된 정보는 다음의 명시된 교육 서비스 목적 이외의 용도로는 일절 사용되지 않습니다.
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li><strong>학습자 맞춤형 단어 제공</strong>: 학년 및 개인별 일일 목표 수량(10~20단어)에 최적화된 플래시카드 추출</li>
            <li><strong>스마트 진도 및 복습 체계</strong>: 4단계 퀴즈 자동 채점, 오답노트 자동 분류 및 Day 6 주간 총복습 연동</li>
            <li><strong>AI 발음 코칭 및 피드백</strong>: 녹음된 음성과 정답 단어 음운 비교를 통한 혀 위치, 입모양 개선 팁 안내</li>
            <li><strong>학부모 안심 학습 리포트</strong>: 자녀의 주간 출석률, 일일 학습량 및 오답 극복 지표 종합 리포트 표출</li>
          </ul>
        </section>

        {/* 제3조 보유 및 이용 기간 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#00A8BF', borderLeft: '4px solid #00A8BF', paddingLeft: '12px', margin: '0 0 12px 0' }}>
            제3조 (개인정보의 보유 및 파기 절차)
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 8px 0' }}>
            1. <strong>보유 기간</strong>: 원칙적으로 학생의 회원 탈퇴 또는 학습 종료 요청 시까지 안전하게 보관되며, 탈퇴 요청 시 즉시 복구 불가능한 방법으로 영구 파기됩니다.
          </p>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 8px 0' }}>
            2. <strong>파기 방법</strong>: 전자적 파일 형태로 저장된 데이터베이스 레코드는 영구 삭제 조치하며, 로컬 캐시(브라우저 저장소)는 로그아웃 시 완전 초기화할 수 있습니다.
          </p>
        </section>

        {/* 제4조 제3자 제공 및 위탁 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#00A8BF', borderLeft: '4px solid #00A8BF', paddingLeft: '12px', margin: '0 0 12px 0' }}>
            제4조 (개인정보의 제3자 제공 및 외부 위탁)
          </h2>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '14px', padding: '14px 18px', fontSize: '13.5px', color: '#991B1B' }}>
            <strong>🚫 제3자 무단 제공 절대 금지 원칙</strong><br />
            FlipVoca는 학생 및 학부모님의 동의 없이 어떠한 개인정보도 제3자나 마케팅 광고 업체에 제공하거나 판매하지 않습니다.
          </div>
          <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '10px', marginBottom: 0 }}>
            * 안정적인 클라우드 동기화를 위한 인프라 서비스로 글로벌 인증 보안 규격을 갖춘 Supabase Inc.(클라우드 데이터베이스 인프라 제공)를 이용하고 있습니다.
          </p>
        </section>

        {/* 제5조 정보주체의 권리 및 행사 방법 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#00A8BF', borderLeft: '4px solid #00A8BF', paddingLeft: '12px', margin: '0 0 12px 0' }}>
            제5조 (이용자 및 법정대리인의 권리와 행사 방법)
          </h2>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 8px 0' }}>
            1. 학생 및 만 14세 미만 아동의 법정대리인(학부모)은 언제든지 서비스 내 [내정보 수정] 화면 또는 센터 관리자를 통해 등록된 개인정보를 열람, 정정하거나 삭제를 요구할 수 있습니다.
          </p>
          <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 8px 0' }}>
            2. 학부모 성함, 연락처 및 PIN 번호는 로그인 화면의 [학부모 정보 변경] 또는 학습관 내 [학부모 프로필 수정] 팝업에서 즉시 직접 변경하실 수 있습니다.
          </p>
        </section>

        {/* 제6조 개인정보 보호책임자 및 센터 문의처 */}
        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#00A8BF', borderLeft: '4px solid #00A8BF', paddingLeft: '12px', margin: '0 0 12px 0' }}>
            제6조 (개인정보 보호책임자 및 고객 문의처)
          </h2>
          <div style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '13.5px', color: '#334155' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div><strong>서비스명</strong>: FlipVoca (플립보카) 스마트 영단어관</div>
              <div><strong>개인정보 보호책임자</strong>: 이상학 센터장</div>
              <div><strong>고객 문의처</strong>: 센터 행정지원팀</div>
              <div><strong>안내 연락처</strong>: 010-4006-9050</div>
            </div>
          </div>
        </section>

        {/* 하단 확인 버튼 */}
        <div style={{ textAlign: 'center', marginTop: '36px', paddingTop: '24px', borderTop: '1px solid #F1F5F9' }}>
          <Link
            href="/modern-login"
            style={{
              background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
              color: '#FFFFFF',
              padding: '14px 32px',
              borderRadius: '16px',
              textDecoration: 'none',
              fontWeight: '900',
              fontSize: '15px',
              boxShadow: '0 4px 14px rgba(0, 168, 191, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>확인 완료 (로그인 페이지로 돌아가기)</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
