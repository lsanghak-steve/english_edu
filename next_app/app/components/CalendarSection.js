'use client';

import { useState, useEffect } from 'react';

export default function CalendarSection({ currentUser }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stamps, setStamps] = useState([]);

  // 선택한 날짜의 공부한 단어 모달 상태
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedDateWords, setSelectedDateWords] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    const stampKey = `english_stamps_${currentUser.id}`;
    try {
      const savedStamps = JSON.parse(localStorage.getItem(stampKey) || '[]');
      setStamps(savedStamps);
    } catch (e) {
      setStamps([]);
    }
  }, [currentUser]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 💮 출석 도장 날짜 클릭 시 해당 날짜에 공부한 단어 리스트 로드
  const handleDateClick = (dateStr) => {
    if (!currentUser) return;
    setSelectedDateStr(dateStr);

    const wordsKey = `stamped_words_${currentUser.id}_${dateStr}`;
    try {
      const savedWords = JSON.parse(localStorage.getItem(wordsKey) || '[]');
      setSelectedDateWords(savedWords);
    } catch (e) {
      setSelectedDateWords([]);
    }
  };

  // TTS 단어 발음 재생
  const playWordAudio = (wordText) => {
    if ('speechSynthesis' in window && wordText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <div className="word-list-section" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={handlePrevMonth} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '8px 14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          ◀ 지난달
        </button>
        <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
          📅 {year}년 {month + 1}월 출석 달력
        </h3>
        <button onClick={handleNextMonth} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '8px 14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          다음달 ▶
        </button>
      </div>

      <div style={{ background: '#E8F8F5', border: '1px solid #A3E4D7', borderRadius: '14px', padding: '10px 14px', marginBottom: '16px', textAlign: 'center', fontSize: '13px', color: '#16A085', fontWeight: 'bold' }}>
        💮 도장(💮)이 찍힌 날짜를 클릭하면 그날 공부한 단어 리스트를 볼 수 있어요!
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center' }}>
        {['일', '월', '화', '수', '목', '금', '토'].map((dayName, idx) => (
          <div key={idx} style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '13px', color: idx === 0 ? '#E74C3C' : idx === 6 ? '#3498DB' : '#7F8C8D' }}>
            {dayName}
          </div>
        ))}

        {days.map((dayNum, index) => {
          if (!dayNum) {
            return <div key={`empty-${index}`} style={{ padding: '14px' }}></div>;
          }

          const monthStr = String(month + 1).padStart(2, '0');
          const dayStr = String(dayNum).padStart(2, '0');
          const fullDateStr = `${year}-${monthStr}-${dayStr}`;

          const isStamped = stamps.includes(fullDateStr);

          return (
            <div
              key={fullDateStr}
              onClick={() => isStamped && handleDateClick(fullDateStr)}
              style={{
                background: isStamped ? '#FFFFFF' : '#F8F9FA',
                border: isStamped ? '2px solid #2ECC71' : '1px solid #E9ECEF',
                borderRadius: '14px',
                padding: '10px 4px',
                minHeight: '64px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justify: 'space-between',
                cursor: isStamped ? 'pointer' : 'default',
                boxShadow: isStamped ? '0 4px 10px rgba(46, 204, 113, 0.15)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2C3E50' }}>{dayNum}</span>
              {isStamped ? (
                <span style={{ fontSize: '20px', animation: 'bounce 0.5s' }} title="공부한 단어 보기">💮</span>
              ) : (
                <span style={{ fontSize: '10px', color: '#BDC3C7' }}>-</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 💮 선택한 날짜의 공부한 단어 리스트 팝업 모달 */}
      {selectedDateStr && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                  📅 {selectedDateStr} 학습 단어
                </h3>
                <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                  💮 출석 도장 완수 ({selectedDateWords.length}개 단어)
                </span>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '6px 12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                닫기 ✖
              </button>
            </div>

            {selectedDateWords.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedDateWords.map((item, idx) => (
                  <div key={idx} style={{ background: '#F8F9FA', padding: '10px 14px', borderRadius: '14px', border: '1px solid #E9ECEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#2C3E50' }}>{item.word || item}</span>
                      {item.meaning && (
                        <span style={{ marginLeft: '10px', fontSize: '13px', color: '#7F8C8D' }}>{item.meaning}</span>
                      )}
                    </div>
                    <button
                      onClick={() => playWordAudio(item.word || item)}
                      style={{ background: '#EBF5FB', border: '1px solid #3498DB', color: '#2980B9', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🔊 발음
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#95A5A6', padding: '20px 0', margin: 0 }}>
                이 날짜의 개별 단어 기록이 아직 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
