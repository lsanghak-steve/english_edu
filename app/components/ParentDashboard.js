'use client';

import { useState, useEffect } from 'react';

// 이름에서 이모지 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function ParentDashboard({ currentUser }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const [stampedDates, setStampedDates] = useState([]);
  const [wrongCount, setWrongCount] = useState(0);

  // 로컬/클라우드 유저 전체에서 학부모 이름에 매칭되는 자녀들 찾기
  useEffect(() => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      if (currentUser) {
        const curParentName = removeEmoji(currentUser.parentName);
        if (curParentName) {
          const matched = savedUsers.filter(u => removeEmoji(u.parentName) === curParentName);
          if (matched.length > 0) {
            setChildrenList(matched);
            setIsAuthenticated(true); // 이미 학부모 로그인 시 들어옴
            return;
          }
        }
        setChildrenList([currentUser]);
      } else if (savedUsers.length > 0) {
        setChildrenList(savedUsers);
      }
    } catch (e) {
      if (currentUser) setChildrenList([currentUser]);
    }
  }, [currentUser]);

  const activeChild = childrenList[selectedChildIndex] || currentUser || { name: '학생', dailyWordCount: '10' };
  const studentName = removeEmoji(activeChild.name);
  const parentName = removeEmoji(activeChild.parentName) || '학부모';
  const correctPin = activeChild.parentPin || '5678';

  useEffect(() => {
    if (!activeChild || !activeChild.id) return;
    const stampKey = `english_stamps_${activeChild.id}`;
    const wrongKey = `wrong_answers_${activeChild.id}`;

    try {
      const savedStamps = JSON.parse(localStorage.getItem(stampKey) || '[]');
      setStampedDates(savedStamps);
    } catch (e) {
      setStampedDates([]);
    }

    try {
      const savedWrong = JSON.parse(localStorage.getItem(wrongKey) || '[]');
      setWrongCount(savedWrong.length);
    } catch (e) {
      setWrongCount(0);
    }
  }, [activeChild]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput.trim() === correctPin) {
      setIsAuthenticated(true);
    } else {
      alert('비밀번호(PIN)가 올바르지 않습니다. 다시 시도해 주세요.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '30px 20px', border: '1px solid #E9ECEF', textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#8E44AD', fontSize: '20px' }}>
          🔒 학부모 안심 리포트 인증
        </h3>
        <p style={{ fontSize: '14px', color: '#7F8C8D', marginBottom: '20px' }}>
          학부모 성함({parentName})의 자녀 학습 현황을 확인하려면 학부모 비밀번호(4자리 PIN)를 입력해 주세요.
        </p>

        <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', maxWidth: '300px', margin: '0 auto' }}>
          <input
            type="password"
            maxLength={4}
            placeholder="학부모 PIN 4자리 (기본: 5678)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #9B59B6', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
            autoFocus
          />
          <button
            type="submit"
            style={{ width: '100%', background: '#8E44AD', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
          >
            인증하고 리포트 보기
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      {/* 상단 학부모 정보 및 자녀 선택 탭 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px dashed #E9ECEF', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#8E44AD', fontSize: '20px' }}>
            📊 {parentName} 학부모님의 자녀 학습 성취도 리포트
          </h3>
          <span style={{ fontSize: '13px', color: '#27AE60', fontWeight: 'bold' }}>
            👨‍👩‍👧‍👦 등록된 자녀 총 {childrenList.length}명
          </span>
        </div>
        <button onClick={() => setIsAuthenticated(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '6px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
          🔒 잠금
        </button>
      </div>

      {/* 👨‍👩‍👧‍👦 다자녀 선택 탭 스위처 */}
      {childrenList.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7F8C8D', alignSelf: 'center' }}>👤 자녀 선택:</span>
          {childrenList.map((child, idx) => (
            <button
              key={child.id || idx}
              onClick={() => setSelectedChildIndex(idx)}
              style={{
                padding: '8px 16px',
                borderRadius: '12px',
                border: selectedChildIndex === idx ? '2px solid #8E44AD' : '1px solid #BDC3C7',
                background: selectedChildIndex === idx ? '#F5EEF8' : '#F8F9FA',
                color: selectedChildIndex === idx ? '#8E44AD' : '#7F8C8D',
                fontWeight: 'bold',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {removeEmoji(child.name)} ({child.grade || '초등 3학년'})
            </button>
          ))}
        </div>
      )}

      {/* 요약 카드 세트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#E8F8F5', padding: '16px', borderRadius: '16px', border: '1px solid #A3E4D7', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#16A085', fontWeight: 'bold' }}>💮 누적 출석도장</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#117864', fontSize: '26px' }}>{stampedDates.length}회</h2>
        </div>

        <div style={{ background: '#FEF9E7', padding: '16px', borderRadius: '16px', border: '1px solid #F9E79F', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#D4AC0D', fontWeight: 'bold' }}>🎯 하루 목표 단어수</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#7D6608', fontSize: '26px' }}>하루 {activeChild?.dailyWordCount || 10}개</h2>
        </div>

        <div style={{ background: '#FADBD8', padding: '16px', borderRadius: '16px', border: '1px solid #F5B7B1', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#C0392B', fontWeight: 'bold' }}>❌ 오답노트 잔여</span>
          <h2 style={{ margin: '6px 0 0 0', color: '#78281F', fontSize: '26px' }}>{wrongCount}개</h2>
        </div>
      </div>

      <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '16px', border: '1px solid #E9ECEF' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '15px' }}>
          💌 [{studentName}] 자녀를 위한 따뜻한 피드백 코멘트
        </h4>
        <p style={{ margin: 0, fontSize: '13px', color: '#7F8C8D', lineHeight: 1.6 }}>
          {stampedDates.length >= 3
            ? `👍 ${studentName} 학생은 이번 주 꾸준히 학습에 참여하여 아주 훌륭한 성취도를 보이고 있습니다!`
            : `✏️ ${studentName} 학생이 매일 영단어 플래시카드 퀴즈를 풀 수 있도록 가정에서도 따뜻한 응원 부탁드립니다!`}
        </p>
      </div>
    </div>
  );
}
