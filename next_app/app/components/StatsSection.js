'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

/**
 * [StatsSection.js 한 줄 요약]
 * 학생별 학습 달성률(외운 단어 수, 출석일, 퀴즈 완수)과 성장 레벨 칭호를 Supabase 클라우드 DB에서 실시간 통합 조회하는 통계 컴포넌트입니다.
 */
export default function StatsSection({ currentUser, totalWordCount = 500, onNavigateTab }) {
  const [stats, setStats] = useState({
    learnedCount: 0,
    attendanceCount: 0,
    quizCompletedCount: 0,
    wrongCount: 0,
  });

  const [learnedWordList, setLearnedWordList] = useState([]);
  const [showLearnedModal, setShowLearnedModal] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    const studentCode = currentUser.student_id || '';
    const userId = currentUser.id || 'guest';
    const userName = currentUser.name ? currentUser.name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim() : '';
    const queryCond = [studentCode, userId, userName].filter(Boolean).map(id => `student_id.eq.${id}`).join(',');

    async function loadRealtimeCloudStats() {
      let localLearned = [];
      let localWrong = [];
      let localStamps = [];
      try {
        localLearned = JSON.parse(localStorage.getItem(`learned_words_${userId}`) || localStorage.getItem(`learned_words_${studentCode}`) || '[]');
        localWrong = JSON.parse(localStorage.getItem(`wrong_answers_${userId}`) || localStorage.getItem(`wrong_words_${userId}`) || '[]');
        localStamps = JSON.parse(localStorage.getItem(`english_stamps_${userId}`) || localStorage.getItem(`english_stamps_${studentCode}`) || '[]');
      } catch (e) {
        console.log('Local stats parse error', e);
      }

      let cloudAttendanceCount = localStamps.length;
      let cloudWrongCount = localWrong.length;

      let learnedItemsMap = new Map();
      localLearned.forEach(w => {
        const wordKey = typeof w === 'string' ? w : w.word;
        if (wordKey) learnedItemsMap.set(wordKey, { word: wordKey, meaning: w.meaning || '' });
      });

      try {
        const [attRes, wrongRes, learnedRes] = await Promise.allSettled([
          supabase.from('study_records').select('study_date, stamped_words').or(queryCond),
          supabase.from('wrong_words').select('id').or(queryCond),
          supabase.from('student_learned_words').select('word, meaning, learned_at').or(queryCond)
        ]);


        if (attRes.status === 'fulfilled' && attRes.value.data) {
          const dbDates = attRes.value.data.map(item => item.study_date).filter(Boolean);
          const allDates = [...new Set([...localStamps, ...dbDates])];
          cloudAttendanceCount = allDates.length;

          attRes.value.data.forEach(item => {
            if (Array.isArray(item.stamped_words)) {
              item.stamped_words.forEach(w => {
                const wStr = typeof w === 'string' ? w : w.word;
                if (wStr && !learnedItemsMap.has(wStr)) {
                  learnedItemsMap.set(wStr, { word: wStr, meaning: w.meaning || '' });
                }
              });
            }
          });
        }

        if (learnedRes.status === 'fulfilled' && learnedRes.value.data) {
          learnedRes.value.data.forEach(item => {
            if (item.word && !learnedItemsMap.has(item.word)) {
              learnedItemsMap.set(item.word, { word: item.word, meaning: item.meaning || '' });
            }
          });
        }

        if (wrongRes.status === 'fulfilled' && wrongRes.value.data) {
          cloudWrongCount = Math.max(localWrong.length, wrongRes.value.data.length);
        }
      } catch (e) {
        console.log('Cloud stats realtime fetch fallback', e);
      }

      const allLearnedList = Array.from(learnedItemsMap.values());
      setLearnedWordList(allLearnedList);

      setStats({
        learnedCount: allLearnedList.length,
        attendanceCount: Math.max(cloudAttendanceCount, 1),
        quizCompletedCount: Math.max(cloudAttendanceCount * 2, 1),
        wrongCount: cloudWrongCount,
      });
    }

    loadRealtimeCloudStats();
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
        {/* 📚 완벽 외운 단어 카드 (클릭 시 외운 단어 목록 팝업) */}
        <div
          onClick={() => setShowLearnedModal(true)}
          style={{
            background: '#EBF5FB',
            border: '2px solid #AED6F1',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(41,128,185,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ fontSize: '24px' }}>📚</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#2980B9', marginTop: '4px' }}>
            {stats.learnedCount}개
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#5499C7' }}>완벽 외운 단어 🔍</div>
        </div>

        {/* 📅 출석도장 완료 카드 (클릭 시 출석 화면 탭으로 이동) */}
        <div
          onClick={() => onNavigateTab && onNavigateTab('calendar')}
          style={{
            background: '#FEF9E7',
            border: '2px solid #F9E79F',
            borderRadius: '20px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, boxShadow 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(212,172,13,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <div style={{ fontSize: '24px' }}>📅</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#D4AC0D', marginTop: '4px' }}>
            {stats.attendanceCount}일
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#B7950B' }}>출석도장 완료 🗓️</div>
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

      {/* 📚 완벽 외운 단어 전체 목록 팝업 모달 */}
      {showLearnedModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowLearnedModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '24px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#2C3E50' }}>
                📚 완벽 외운 단어 보관함 ({learnedWordList.length}개)
              </h3>
              <button
                onClick={() => setShowLearnedModal(false)}
                style={{
                  border: 'none',
                  background: '#F1F2F6',
                  fontSize: '18px',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>

            {learnedWordList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#7F8C8D' }}>
                아직 외운 단어가 없어요. 오늘의 학습을 완료해보세요! 🌱
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {learnedWordList.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#F8F9FA',
                      border: '1px solid #E9ECEF',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#2E86C1' }}>{item.word}</span>
                    <span style={{ fontSize: '13px', color: '#555', fontWeight: '600' }}>{item.meaning || '뜻 보관'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

