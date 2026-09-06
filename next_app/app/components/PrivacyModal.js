'use client';

export default function PrivacyModal({ isOpen, onClose, currentLang = 'ko' }) {
  if (!isOpen) return null;

  const title = currentLang === 'zh' ? '隐私政策与服务条款' : (currentLang === 'fr' ? 'Politique de confidentialité' : '개인정보처리방침 및 서비스 이용약관');
  const closeText = currentLang === 'zh' ? '关闭' : (currentLang === 'fr' ? 'Fermer' : '닫기');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        {/* 모달 상단 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>📜</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#E2E8F0',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 모달 본문 스크롤 영역 */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          fontSize: '13.5px',
          color: '#334155',
          lineHeight: 1.7
        }}>
          <div style={{ background: '#F0F9FF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #BAE6FD', marginBottom: '20px', color: '#0369A1', fontWeight: 'bold' }}>
            💡 FlipVoca는 학생과 학부모님의 정보를 안전하게 암호화 관리하며, 교육 목적 외 어떠한 제3자 마케팅에도 이용하지 않습니다.
          </div>

          <h4 style={{ margin: '16px 0 8px 0', color: '#00A8BF', fontSize: '15px', fontWeight: '900' }}>
            1. 수집하는 개인정보 항목
          </h4>
          <p style={{ margin: '0 0 10px 0' }}>
            - <strong>학생 정보</strong>: 이름, 학년(초·중·고), 비밀번호(4자리 PIN), 일일 단어 학습량<br />
            - <strong>학습 데이터</strong>: 단어 암기 이력, 퀴즈 채점 결과, 출석 도장 기록, 발음 녹음 바이너리<br />
            - <strong>학부모 정보(선택)</strong>: 학부모 성함, 비상 연락처, 학부모 전용 조회 PIN
          </p>

          <h4 style={{ margin: '16px 0 8px 0', color: '#00A8BF', fontSize: '15px', fontWeight: '900' }}>
            2. 개인정보의 이용 목적
          </h4>
          <p style={{ margin: '0 0 10px 0' }}>
            - 학생 맞춤 플래시카드 단어 생성 및 진도 관리<br />
            - 4단계 퀴즈 채점, 오답노트 저장 및 Day 6 주간 총복습 제공<br />
            - AI 발음 교정 및 음성 피드백 제공<br />
            - 학부모 대시보드 내 자녀 학습 진도 및 출석 리포트 표출
          </p>

          <h4 style={{ margin: '16px 0 8px 0', color: '#00A8BF', fontSize: '15px', fontWeight: '900' }}>
            3. 보유 및 파기 기간
          </h4>
          <p style={{ margin: '0 0 10px 0' }}>
            - 학생의 학습 종료 및 회원 탈퇴 요청 시 수집된 정보는 데이터베이스에서 즉시 안전하게 영구 파기됩니다.
          </p>

          <h4 style={{ margin: '16px 0 8px 0', color: '#00A8BF', fontSize: '15px', fontWeight: '900' }}>
            4. 정보주체의 권리
          </h4>
          <p style={{ margin: '0 0 10px 0' }}>
            - 학생 및 법정대리인은 언제든지 본인의 개인정보 열람, 수정(이름, PIN, 연락처), 삭제를 요청할 수 있습니다.
          </p>

          <div style={{ marginTop: '20px', padding: '12px 14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12.5px', color: '#64748B' }}>
            <strong>개인정보 보호책임자</strong>: 이상학 센터장 | <strong>연락처</strong>: 010-4006-9050
          </div>
        </div>

        {/* 모달 하단 버튼 */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#F8FAFC'
        }}>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12.5px', color: '#00A8BF', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            전문 페이지에서 크게 보기 ➔
          </a>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0, 168, 191, 0.25)'
            }}
          >
            {closeText}
          </button>
        </div>
      </div>
    </div>
  );
}
