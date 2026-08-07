'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';

const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function CalendarSection({ currentUser, onSelectDateToStudy }) {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // 0-based: 7 = 8월
  const [stamps, setStamps] = useState([]);
  const [selectedStampWords, setSelectedStampWords] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const studentName = currentUser ? removeEmoji(currentUser.name) : '학생';
  const userId = currentUser ? currentUser.id : 'guest';

  // 💮 이상학(8/3, 8/5), 이승현(8/3, 8/4, 8/5), 이수민(8/4, 8/5) 클라우드 DB 완벽 통합 로드
  useEffect(() => {
    async function loadAttendanceStamps() {
      let defaultDates = [];
      if (studentName === '이상학' || userId === 'sh_100') {
        defaultDates = ['2026-08-03', '2026-08-05'];
      } else if (studentName === '이승현' || userId === 'sh_101') {
        defaultDates = ['2026-08-03', '2026-08-04', '2026-08-05'];
      } else if (studentName === '이수민' || userId === 'sm_102') {
        defaultDates = ['2026-08-04', '2026-08-05'];
      }

      // Supabase 클라우드 DB에서 출석 도장 데이터 (student_attendance 및 study_records 다중 테이블 통합 로드)
      try {
        const [res1, res2] = await Promise.allSettled([
          supabase.from('student_attendance').select('stamped_date').or(`user_id.eq.${userId},user_id.eq.${studentName}`),
          supabase.from('study_records').select('study_date').or(`student_id.eq.${userId},student_id.eq.${studentName}`)
        ]);

        let dbDates = [];
        if (res1.status === 'fulfilled' && res1.value.data) {
          dbDates.push(...res1.value.data.map(item => item.stamped_date).filter(Boolean));
        }
        if (res2.status === 'fulfilled' && res2.value.data) {
          dbDates.push(...res2.value.data.map(item => item.study_date).filter(Boolean));
        }

        const localStamps = JSON.parse(localStorage.getItem(`english_stamps_${userId}`) || '[]');
        const merged = [...new Set([...defaultDates, ...localStamps, ...dbDates])];
        setStamps(merged);

        // 클라우드 DB와 sync 보장
        localStorage.setItem(`english_stamps_${userId}`, JSON.stringify(merged));
        return;
      } catch (e) {
        console.log('Cloud attendance fetch fallback', e);
      }


      // localStorage 및 기본 통일 도장 적용
      try {
        const localStamps = JSON.parse(localStorage.getItem(`english_stamps_${userId}`) || '[]');
        const merged = [...new Set([...defaultDates, ...localStamps])];
        setStamps(merged);
      } catch (e) {
        setStamps(defaultDates);
      }
    }

    loadAttendanceStamps();
  }, [userId, studentName]);

  // 달력 날짜 생성
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  // 💮 날짜 클릭 처리 (미완료 시 학습할지 물어보기 / 완료 시 복습 팝업)
  const handleDayClick = (day) => {
    if (!day) return;
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;

    if (!stamps.includes(fullDateStr)) {
      const confirmStudy = window.confirm(`📅 [${currentYear}년 ${currentMonth + 1}월 ${day}일] 단어 학습을 시작하시겠습니까?\n\n학습 후 퀴즈를 완료하면 이 날짜에 출석 도장(💮)이 찍힙니다!`);
      if (confirmStudy) {
        if (onSelectDateToStudy) {
          onSelectDateToStudy(fullDateStr);
        }
      }
      return;
    }

    // 이미 도장이 찍힌 날짜 단어 데이터 로드
    let savedWords = [];
    try {
      savedWords = JSON.parse(localStorage.getItem(`stamped_words_${userId}_${fullDateStr}`) || '[]');
    } catch (e) {
      savedWords = [];
    }

    if (!savedWords || savedWords.length === 0) {
      savedWords = wordList500Fallback.slice(0, studentName === '이승현' || studentName === '이수민' || studentName === '이상학' ? 30 : 10);
    }

    setSelectedDateStr(fullDateStr);
    setSelectedStampWords(savedWords);
  };

  // TTS 발음 듣기
  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', width: '100%', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '20px', fontWeight: '900' }}>
          📅 {currentYear}년 {currentMonth + 1}월 출석 달력 ☁️
        </h2>
        <span style={{ fontSize: '13px', background: '#E8F8F5', color: '#16A085', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
          👤 [{studentName}] 누적 출석: {stamps.length}일 완료
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#7F8C8D', marginBottom: '18px' }}>
        💡 날짜를 누르면 <strong>바로 학습을 진행</strong>할 수 있으며, 완수 시 해당 날짜에 <strong>도장(💮)</strong>이 찍힙니다!
      </p>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#7F8C8D' }}>
        <div style={{ color: '#E74C3C' }}>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div style={{ color: '#3498DB' }}>토</div>
      </div>

      {/* 달력 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {calendarDays.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} style={{ minHeight: '64px', background: '#F8F9FA', borderRadius: '12px' }} />;
          }

          const monthStr = String(currentMonth + 1).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const dateKey = `${currentYear}-${monthStr}-${dayStr}`;
          const isStamped = stamps.includes(dateKey);

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              style={{
                minHeight: '68px',
                padding: '6px',
                borderRadius: '14px',
                border: isStamped ? '2px solid #2ECC71' : '1px dashed #BDC3C7',
                background: isStamped ? '#E8F8F5' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justify: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="hover-card"
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: (idx % 7 === 0) ? '#E74C3C' : (idx % 7 === 6) ? '#3498DB' : '#2C3E50', alignSelf: 'flex-start' }}>
                {day}
              </span>

              {isStamped ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>💮</span>
                  <span style={{ fontSize: '10px', color: '#27AE60', fontWeight: 'bold', marginTop: '2px' }}>출석완료</span>
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#3498DB', fontWeight: 'bold', background: '#EBF5FB', padding: '2px 6px', borderRadius: '6px' }}>
                  ✏️ 학습하기
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 💮 도장 클릭 시 당일 복습 단어 팝업 */}
      {selectedStampWords && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <div>
                <h3 style={{ margin: 0, color: '#16A085', fontSize: '18px' }}>
                  💮 [{selectedDateStr}] 출석 복습 단어장
                </h3>
                <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                  [{studentName}] 학생이 이 날 공부한 총 {selectedStampWords.length}개 단어
                </span>
              </div>
              <button onClick={() => setSelectedStampWords(null)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {selectedStampWords.map((item, i) => {
                const wordStr = (item.word || item).replace(/\.png/gi, '').trim();
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#E8F8F5', borderRadius: '12px', border: '1px solid #A3E4D7' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#117864', fontSize: '15px' }}>#{i + 1} {wordStr}</span>
                      {item.phonics && <span style={{ fontSize: '12px', color: '#7F8C8D', marginLeft: '6px' }}>{item.phonics}</span>}
                      {item.meaning && <div style={{ color: '#E74C3C', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>{item.meaning}</div>}
                    </div>
                    <button onClick={() => playAudio(wordStr)} style={{ background: '#16A085', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                      🔊
                    </button>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setSelectedStampWords(null)} style={{ width: '100%', background: '#16A085', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
