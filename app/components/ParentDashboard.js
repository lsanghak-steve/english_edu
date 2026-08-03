'use client';

import { useState, useEffect } from 'react';

export default function ParentDashboard({ currentUser }) {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [parentPin, setParentPin] = useState('1234'); // 기본 PIN 1234

  // 학생별 데이터 로드 상태
  const [stamps, setStamps] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const pinKey = `parent_pin_${currentUser.id}`;
    const savedPin = localStorage.getItem(pinKey) || '1234';
    setParentPin(savedPin);

    // 내 자녀 전용 데이터 로드
    const stampKey = `english_stamps_${currentUser.id}`;
    const learnedKey = `learned_words_${currentUser.id}`;
    const wrongKey = `wrong_answers_${currentUser.id}`;

    try {
      setStamps(JSON.parse(localStorage.getItem(stampKey) || '[]'));
    } catch (e) {
      setStamps([]);
    }

    try {
      setLearnedWords(JSON.parse(localStorage.getItem(learnedKey) || '[]'));
    } catch (e) {
      setLearnedWords([]);
    }

    try {
      setWrongAnswers(JSON.parse(localStorage.getItem(wrongKey) || '[]'));
    } catch (e) {
      setWrongAnswers([]);
    }
  }, [currentUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === parentPin) {
      setIsAuthenticated(true);
    } else {
      alert('비밀번호(PIN)가 일치하지 않습니다. 다시 입력해 주세요.');
    }
  };

  const handleChangePin = () => {
    const newPin = prompt('새로운 학부모 비밀번호 4자리를 입력하세요:', parentPin);
    if (newPin && newPin.length === 4) {
      setParentPin(newPin);
      localStorage.setItem(`parent_pin_${currentUser.id}`, newPin);
      alert('비밀번호가 성공적으로 변경되었습니다!');
    } else if (newPin) {
      alert('비밀번호는 4자리 숫자로 입력해야 합니다.');
    }
  };

  if (!currentUser) {
    return (
      <div className="word-list-section" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <h3>👨‍👩‍👧‍👦 학부모 모드</h3>
        <p style={{ color: '#7F8C8D', marginTop: '8px' }}>상단에서 자녀(학생)를 먼저 선택해 주세요!</p>
      </div>
    );
  }

  // 1. PIN 인증 전 로그인 화면 (오직 내 자녀 데이터만 접근 보호)
  if (!isAuthenticated) {
    return (
      <div className="word-list-section" style={{ textAlign: 'center', padding: '30px 20px' }}>
        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔒</div>
        <h3 style={{ margin: 0, color: '#2C3E50' }}>{currentUser.name} 학생의 학부모 전용 인증</h3>
        <p style={{ fontSize: '13px', color: '#7F8C8D', marginTop: '6px' }}>
          자녀의 학부모 비밀번호 4자리를 입력하세요. (초기 암호: 1234)
        </p>

        <form onSubmit={handleLogin} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="PIN 4자리"
            style={{
              width: '160px',
              padding: '12px',
              borderRadius: '12px',
              border: '2px solid #3498DB',
              fontSize: '22px',
              textAlign: 'center',
              letterSpacing: '6px',
              fontWeight: 'bold'
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '160px', padding: '12px', borderRadius: '12px', fontSize: '15px' }}
          >
            🔓 학부모 로그인
          </button>
        </form>
      </div>
    );
  }

  // 2. 인증 완료 후 학부모 전용 자녀 학습 리포트 대시보드
  return (
    <div className="word-list-section" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px dashed #E9ECEF' }}>
        <div>
          <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
            👨‍👩‍👧‍👦 {currentUser.name} 학생 학부모 대시보드
          </h3>
          <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
            🔒 보안 승인됨 (내 자녀 데이터 독립 조회)
          </span>
        </div>
        <button
          onClick={handleChangePin}
          style={{
            background: '#F8F9FA',
            border: '1px solid #BDC3C7',
            padding: '6px 12px',
            borderRadius: '10px',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          ⚙️ 비밀번호 변경
        </button>
      </div>

      {/* 요약 카드 3종 세트 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: '#E8F8F5', border: '1px solid #A3E4D7', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#16A085', fontWeight: 'bold' }}>💮 총 출석 도장</span>
          <h2 style={{ margin: '4px 0 0 0', color: '#27AE60', fontSize: '24px' }}>{stamps.length}일</h2>
        </div>

        <div style={{ background: '#EBF5FB', border: '1px solid #AED6F1', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#2980B9', fontWeight: 'bold' }}>📚 학습 완료 단어</span>
          <h2 style={{ margin: '4px 0 0 0', color: '#3498DB', fontSize: '24px' }}>{learnedWords.length}개</h2>
        </div>

        <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', borderRadius: '16px', padding: '12px', textAlign: 'center' }}>
          <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: 'bold' }}>❌ 오답 기록 단어</span>
          <h2 style={{ margin: '4px 0 0 0', color: '#E74C3C', fontSize: '24px' }}>{wrongAnswers.length}개</h2>
        </div>
      </div>

      {/* 리포트 섹션 1: 출석 도장 기록 */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', border: '1px solid #E9ECEF', marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📅 최근 출석 날짜 기록 ({stamps.length}회)
        </h4>
        {stamps.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {stamps.map((dateStr, idx) => (
              <span key={idx} style={{ background: '#E8F8F5', color: '#27AE60', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #A3E4D7' }}>
                💮 {dateStr}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#95A5A6', margin: 0 }}>아직 출석 기록이 없습니다.</p>
        )}
      </div>

      {/* 리포트 섹션 2: 배운 단어 누적 목록 */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', border: '1px solid #E9ECEF', marginBottom: '14px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2C3E50', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📖 완수 완료 영단어 리스트 ({learnedWords.length}개)
        </h4>
        {learnedWords.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
            {learnedWords.map((word, idx) => (
              <span key={idx} style={{ background: '#F8F9FA', color: '#2C3E50', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #DEE2E6' }}>
                ✅ {word}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#95A5A6', margin: 0 }}>아직 완료된 단어가 없습니다.</p>
        )}
      </div>

      {/* 리포트 섹션 3: 자녀 집중 점검 오답 노트 */}
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '14px', border: '1px solid #E9ECEF' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#C0392B', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ❌ 자녀 집중 복습 오답 노트 ({wrongAnswers.length}개)
        </h4>
        {wrongAnswers.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {wrongAnswers.map((item, idx) => (
              <div key={idx} style={{ background: '#FDEDEC', padding: '8px 12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                <span style={{ fontWeight: 'bold', color: '#E74C3C' }}>{item.word}</span>
                <span style={{ color: '#7F8C8D' }}>{item.meaning}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '12px', color: '#27AE60', margin: 0 }}>🎉 자녀의 오답 기록이 없습니다! 아주 훌륭합니다!</p>
        )}
      </div>
    </div>
  );
}
