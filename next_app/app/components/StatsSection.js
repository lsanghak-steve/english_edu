'use client';

import { useState, useEffect } from 'react';

/**
 * [StatsSection.js 한 줄 요약]
 * 학생별 학습 달성률(외운 단어 수, 출석일, 퀴즈 완수)과 성장 레벨 칭호를 한눈에 보여주는 학습 성취도 통계 컴포넌트입니다.
 */
export default function StatsSection({ currentUser, totalWordCount = 500 }) {
  const [stats, setStats] = useState({
    learnedCount: 0,
    attendanceCount: 0,
    quizCompletedCount: 0,
    wrongCount: 0,
  });

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id || 'guest';

    // 1. 외운 단어 목록 가져오기
    let learnedWords = [];
    try {
      learnedWords = JSON.parse(localStorage.getItem(`learned_words_${userId}`) || '[]');
    } catch (e) {
      learnedWords = [];
    }

    // 2. 출석 도장 날짜 가져오기
    let attendance = [];
    try {
      attendance = JSON.parse(localStorage.getItem(`attendance_${userId}`) || '[]');
    } catch (e) {
      attendance = [];
    }

    // 3. 오답노트 단어 수 가져오기
    let wrongWords = [];
    try {
      wrongWords = JSON.parse(localStorage.getItem(`wrong_words_${userId}`) || '[]');
    } catch (e) {
      wrongWords = [];
    }

    // 4. 퀴즈 완수 기록 가져오기
    let quizProgress = [];
    try {
      quizProgress = JSON.parse(localStorage.getItem(`quiz_completed_${userId}`) || '[]');
    } catch (e) {
      quizProgress = [];
    }

    setStats({
      learnedCount: learnedWords.length,
      attendanceCount: attendance.length,
      quizCompletedCount: quizProgress.length,
      wrongCount: wrongWords.length,
    });
  }, [currentUser]);

  // 달성률 (%) 계산
  const percent = totalWordCount > 0 ? Math.min(100, Math.round((stats.learnedCount / totalWordCount) * 100)) : 0;

  // 외운 단어 수에 따른 성장 칭호 레벨 결정
  const getBadgeInfo = (count) => {
    if (count >= 300) return { title: '🏆 영어 마스터', color: '#F39C12', desc: '초등 영단어의 대장님! 완벽해요!' };
    if (count >= 150) return { title: '⭐ 영어 탐험가', color: '#9B59B6', desc: '영어가 유창해지고 있어요!' };
    if (count >= 50) return { title: '🌿 영어 모험가', color: '#2ECC71', desc: '단어를 무럭무럭 잘 외우고 있네요!' };
    return { title: '🌱 영어 새싹', color: '#3498DB', desc: '매일 조금씩 영어 단어 왕이 되어보아요!' };
  };

  const badge = getBadgeInfo(stats.learnedCount);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 타이틀 및 성장 레벨 칭호 */}
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '2px solid #E9ECEF',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#7F8C8D' }}>
          {currentUser ? `${currentUser.name} 학생의` : '내'} 학습 리포트 📊
        </div>
        <div
          style={{
            fontSize: '26px',
            fontWeight: '900',
            color: badge.color,
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {badge.title}
        </div>
        <div style={{ fontSize: '13px', color: '#555', marginTop: '6px', fontWeight: '600' }}>
          {badge.desc}
        </div>
      </div>

      {/* 진도율 그래픽 바 (Progress Bar) */}
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '2px solid #E9ECEF',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#2C3E50' }}>🎯 단어 정복 달성률</span>
          <span style={{ fontSize: '18px', fontWeight: '900', color: '#4ECDC4' }}>{percent}%</span>
        </div>
        
        {/* 그래프 게이지 바 */}
        <div
          style={{
            width: '100%',
            height: '20px',
            backgroundColor: '#E9ECEF',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4ECDC4 0%, #36B5AC 100%)',
              borderRadius: '10px',
              transition: 'width 0.8s ease-in-out',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: '#95A5A6', textAlign: 'right', marginTop: '6px', fontWeight: 'bold' }}>
          {stats.learnedCount} / {totalWordCount} 단어 완료
        </div>
      </div>

      {/* 4개 성과 카드 그리드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}
      >
        <div
          style={{
            background: '#EBF5FB',
            border: '2px solid #AED6F1',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>📚</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#2980B9', marginTop: '4px' }}>
            {stats.learnedCount}개
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#5499C7' }}>완벽 외운 단어</div>
        </div>

        <div
          style={{
            background: '#FEF9E7',
            border: '2px solid #F9E79F',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>📅</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#D4AC0D', marginTop: '4px' }}>
            {stats.attendanceCount}일
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#B7950B' }}>출석도장 완료</div>
        </div>

        <div
          style={{
            background: '#E8F8F5',
            border: '2px solid #A3E4D7',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>📝</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#16A085', marginTop: '4px' }}>
            {stats.quizCompletedCount}회
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#117A65' }}>퀴즈 통과 횟수</div>
        </div>

        <div
          style={{
            background: '#FDEDEC',
            border: '2px solid #FADBD8',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '24px' }}>✏️</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#E74C3C', marginTop: '4px' }}>
            {stats.wrongCount}개
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#C0392B' }}>복습할 오답단어</div>
        </div>
      </div>
    </div>
  );
}
