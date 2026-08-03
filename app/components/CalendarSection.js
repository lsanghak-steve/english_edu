'use client';

import { useState, useEffect, useCallback } from 'react';
import supabase from '../../lib/supabaseClient.js';

export default function CalendarSection({ currentUser, onLoadNextWordSet }) {
  const [stampedDates, setStampedDates] = useState([]);
  const [selectedDateWords, setSelectedDateWords] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [showModal, setShowModal] = useState(false);

  const userId = currentUser ? currentUser.id : 'guest';

  // 클라우드 DB에서 출석 도장 날짜 및 학습 단어 로드
  const loadAttendanceFromCloud = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('user_id', currentUser.id);

      if (!error && data) {
        const dates = data.map(item => item.stamped_date);
        setStampedDates(dates);
        localStorage.setItem(`english_stamps_${currentUser.id}`, JSON.stringify(dates));
        return;
      }
    } catch (e) {
      console.log('Cloud attendance fallback to local');
    }

    try {
      const savedStamps = JSON.parse(localStorage.getItem(`english_stamps_${userId}`) || '[]');
      setStampedDates(savedStamps);
    } catch (e) {
      setStampedDates([]);
    }
  }, [currentUser, userId]);

  useEffect(() => {
    loadAttendanceFromCloud();
  }, [loadAttendanceFromCloud]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const daysArray = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  // 💮 도장 클릭 시 클라우드 DB 또는 localStorage에서 그날 공부한 단어 모달 로드
  const handleStampClick = async (dayNum) => {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDateStr(formattedDate);

    // 1. Supabase 클라우드 DB에서 해당 날짜 출석 기록 조회
    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from('student_attendance')
          .select('stamped_words')
          .eq('user_id', currentUser.id)
          .eq('stamped_date', formattedDate)
          .single();

        if (!error && data && data.stamped_words && data.stamped_words.length > 0) {
          setSelectedDateWords(data.stamped_words);
          setShowModal(true);
          return;
        }
      } catch (e) {
        console.log('Cloud date words lookup fallback');
      }
    }

    // 2. localStorage 백업 조회
    const localWordsKey = `stamped_words_${userId}_${formattedDate}`;
    try {
      const words = JSON.parse(localStorage.getItem(localWordsKey) || '[]');
      setSelectedDateWords(words);
    } catch (e) {
      setSelectedDateWords([]);
    }
    setShowModal(true);
  };

  const playAudio = (textToPlay) => {
    if ('speechSynthesis' in window && textToPlay) {
      const cleanStr = textToPlay.replace(/\.png/gi, '').trim();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanStr);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="calendar-card" style={{ padding: '20px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '20px' }}>
          📅 {currentYear}년 {currentMonth + 1}월 출석 달력 ☁️
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
          💡 도장(💮)을 클릭하면 그날 공부했던 단어 목록을 다시 복습할 수 있습니다!
        </p>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#7F8C8D', marginBottom: '10px' }}>
        <span style={{ color: '#E74C3C' }}>일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span style={{ color: '#3498DB' }}>토</span>
      </div>

      {/* 날짜 그리스 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {daysArray.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} style={{ padding: '12px', background: 'transparent' }} />;
          }

          const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isStamped = stampedDates.includes(formattedDate);
          const isTodayDay = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

          return (
            <div
              key={day}
              onClick={() => isStamped && handleStampClick(day)}
              style={{
                aspectRatio: '1',
                borderRadius: '14px',
                background: isTodayDay ? '#EBF5FB' : '#F8F9FA',
                border: isTodayDay ? '2px solid #3498DB' : '1fr solid #E9ECEF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justify: 'center',
                position: 'relative',
                cursor: isStamped ? 'pointer' : 'default',
                transition: 'transform 0.1s ease'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: isTodayDay ? '#2980B9' : '#34495E' }}>
                {day}
              </span>

              {isStamped && (
                <span style={{ fontSize: '20px', animation: 'bounce 0.5s', marginTop: '2px' }} title="클릭하여 학습 단어 복습">
                  💮
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 💮 도장 클릭 시 공부한 단어 모달 팝업 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '17px' }}>
                📖 {selectedDateStr} 학습 단어 리스트
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {selectedDateWords && selectedDateWords.length > 0 ? (
                selectedDateWords.map((item, i) => {
                  const wordStr = (item.word || item).replace(/\.png/gi, '').trim();
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #E9ECEF' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#2C3E50', fontSize: '15px' }}>{wordStr}</span>
                        {item.meaning && <span style={{ color: '#E74C3C', marginLeft: '10px', fontSize: '14px', fontWeight: 'bold' }}>{item.meaning}</span>}
                      </div>
                      <button onClick={() => playAudio(wordStr)} style={{ background: '#3498DB', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}>
                        🔊
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#7F8C8D' }}>
                  이 날짜에 기록된 개별 단어가 없습니다.
                </div>
              )}
            </div>

            {onLoadNextWordSet && (
              <button
                onClick={() => {
                  setShowModal(false);
                  onLoadNextWordSet();
                }}
                style={{ width: '100%', background: '#E67E22', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                🚀 다음 단어 학습하기 ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
