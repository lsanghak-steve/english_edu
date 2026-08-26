'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';
import { t, getLocalDateString } from '../../lib/i18n.js';
import { playUniversalAudio } from '../../lib/audioPlayer.js';

const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function CalendarSection({ currentUser, onSelectDateToStudy, currentLang = 'ko' }) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-based
  const [stamps, setStamps] = useState([]);
  const [selectedStampWords, setSelectedStampWords] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const todayDateStr = getLocalDateString();

  const studentName = currentUser ? removeEmoji(currentUser.name) : (currentLang === 'zh' ? '学生' : (currentLang === 'fr' ? 'Élève' : '학생'));
  const userId = currentUser ? currentUser.id : 'guest';
  const studentCode = currentUser ? (currentUser.student_id || currentUser.id || '') : '';

  // 💮 출석 도장 클라우드 DB & localStorage 실시간 연동 로드
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

      let queryIds = [studentCode, userId, studentName];
      if (studentName.includes('상학') || userId.includes('sh') || studentCode.includes('lsh')) {
        queryIds.push('lsh_20260807_000001', 'sh_100', '이상학');
      } else if (studentName.includes('승현') || studentCode.includes('000002')) {
        queryIds.push('lsh_20260807_000002', 'sh_101', '이승현');
      } else if (studentName.includes('수민') || studentCode.includes('000003')) {
        queryIds.push('lsm_20260807_000003', 'sm_102', '이수민');
      }
      const cleanIds = [...new Set(queryIds.filter(Boolean))];

      // Supabase 클라우드 DB study_records 보관함에서 출석 도장 데이터 통합 로드
      try {
        const { data, error } = await supabase.from('study_records').select('study_date').in('student_id', cleanIds);

        if (!error && data && data.length > 0) {
          const dbDates = data.map(item => item.study_date).filter(Boolean);
          const localStamps = JSON.parse(localStorage.getItem(`english_stamps_${userId}`) || '[]');
          const merged = [...new Set([...defaultDates, ...localStamps, ...dbDates])];
          setStamps(merged);

          localStorage.setItem(`english_stamps_${userId}`, JSON.stringify(merged));
          if (studentCode) localStorage.setItem(`english_stamps_${studentCode}`, JSON.stringify(merged));
          return;
        }
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

    const handleUpdate = () => { loadAttendanceStamps(); };
    window.addEventListener('study_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('study_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId, studentName, studentCode]);

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

  // 💮 날짜 클릭 처리
  const handleDayClick = (day) => {
    if (!day) return;
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDateStr = `${currentYear}-${monthStr}-${dayStr}`;

    if (!stamps.includes(fullDateStr)) {
      const confirmMsg = currentLang === 'zh'
        ? `📅 [${currentYear}年 ${currentMonth + 1}月 ${day}日] 是否开始这天的单词学习？\n\n完成测验后，该日期将被盖上出勤印章(💮)！`
        : (currentLang === 'fr'
        ? `📅 [${day}/${currentMonth + 1}/${currentYear}] Voulez-vous commencer l'apprentissage de cette date ?\n\nAprès validation du quiz, un tampon (💮) sera apposé !`
        : `📅 [${currentYear}년 ${currentMonth + 1}월 ${day}일] 단어 학습을 시작하시겠습니까?\n\n학습 후 퀴즈를 완료하면 이 날짜에 출석 도장(💮)이 찍힙니다!`);

      const confirmStudy = window.confirm(confirmMsg);
      if (confirmStudy) {
        if (onSelectDateToStudy) {
          onSelectDateToStudy(fullDateStr);
        }
      }
      return;
    }

    // 🎯 이미 도장이 찍힌 날짜에 실제 공부한 단어 데이터 정밀 로드
    let savedWords = [];
    try {
      savedWords = JSON.parse(localStorage.getItem(`stamped_words_${userId}_${fullDateStr}`) || localStorage.getItem(`stamped_words_${studentCode}_${fullDateStr}`) || localStorage.getItem(`daily_random_words_${userId}_${fullDateStr}`) || localStorage.getItem(`daily_random_words_${studentCode}_${fullDateStr}`) || '[]');
    } catch (e) {
      savedWords = [];
    }

    // Supabase DB에서 해당 날짜에 저장된 학습 단어 비동기 보정 로드
    if (!savedWords || savedWords.length === 0) {
      const loadDbDateWords = async () => {
        try {
          const queryIds = [userId, studentCode, studentName].filter(Boolean);
          const { data: dbLearned } = await supabase
            .from('student_learned_words')
            .select('word, meaning, learned_at')
            .or(queryIds.map(id => `student_id.eq.${id}`).join(','))
            .gte('learned_at', `${fullDateStr}T00:00:00`)
            .lte('learned_at', `${fullDateStr}T23:59:59`);

          if (dbLearned && dbLearned.length > 0) {
            const map = new Map();
            dbLearned.forEach(item => {
              if (item.word && !map.has(item.word.toLowerCase())) {
                map.set(item.word.toLowerCase(), { word: item.word, meaning: item.meaning || '' });
              }
            });
            const actualList = Array.from(map.values());
            if (actualList.length > 0) {
              setSelectedStampWords(actualList);
              try {
                localStorage.setItem(`stamped_words_${userId}_${fullDateStr}`, JSON.stringify(actualList));
              } catch (e) {}
              return;
            }
          }
        } catch (err) {}
      };
      loadDbDateWords();
    }

    setSelectedDateStr(fullDateStr);
    setSelectedStampWords(savedWords && savedWords.length > 0 ? savedWords : []);
  };

  // TTS 발음 듣기
  const playAudio = (text) => {
    playUniversalAudio(text, { rate: 0.85, lang: 'en' });
  };

  const weekdays = currentLang === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : (currentLang === 'fr' ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] : ['일', '월', '화', '수', '목', '금', '토']);

  const calendarTitle = currentLang === 'zh'
    ? `📅 ${currentYear}年 ${currentMonth + 1}月 出勤日历 ☁️`
    : (currentLang === 'fr'
    ? `📅 Calendrier ${currentMonth + 1}/${currentYear} ☁️`
    : `📅 ${currentYear}년 ${currentMonth + 1}월 출석 달력 ☁️`);

  const attendanceBadgeText = currentLang === 'zh'
    ? `👤 [${studentName}] 累计出勤: ${stamps.length}天完成`
    : (currentLang === 'fr'
    ? `👤 [${studentName}] Présence: ${stamps.length} jours`
    : `👤 [${studentName}] 누적 출석: ${stamps.length}일 완료`);

  const guideText = currentLang === 'zh'
    ? '💡 点击日期可直接进行学习，完成后该日期将盖上印章(💮)！'
    : (currentLang === 'fr'
    ? '💡 Cliquez sur une date pour étudier, un tampon(💮) sera validé après le quiz !'
    : '💡 날짜를 누르면 바로 학습을 진행할 수 있으며, 완수 시 해당 날짜에 도장(💮)이 찍힙니다!');

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', width: '100%', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '20px', fontWeight: '900' }}>
            {calendarTitle}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentYear(prev => prev - 1);
                  setCurrentMonth(11);
                } else {
                  setCurrentMonth(prev => prev - 1);
                }
              }}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              title="이전 달"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentYear(prev => prev + 1);
                  setCurrentMonth(0);
                } else {
                  setCurrentMonth(prev => prev + 1);
                }
              }}
              style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              title="다음 달"
            >
              ▶
            </button>
          </div>
        </div>
        <span style={{ fontSize: '13px', background: '#E8F8F5', color: '#16A085', padding: '6px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
          {attendanceBadgeText}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#7F8C8D', marginBottom: '18px' }}>
        {guideText}
      </p>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: '#7F8C8D' }}>
        <div style={{ color: '#E74C3C' }}>{weekdays[0]}</div>
        <div>{weekdays[1]}</div>
        <div>{weekdays[2]}</div>
        <div>{weekdays[3]}</div>
        <div>{weekdays[4]}</div>
        <div>{weekdays[5]}</div>
        <div style={{ color: '#3498DB' }}>{weekdays[6]}</div>
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
          const isToday = dateKey === todayDateStr;

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              style={{
                minHeight: '68px',
                padding: '6px',
                borderRadius: '14px',
                border: isToday
                  ? '2.5px solid #3498DB'
                  : (isStamped ? '2px solid #2ECC71' : '1px dashed #BDC3C7'),
                background: isStamped ? '#E8F8F5' : (isToday ? '#F0F8FF' : '#FFFFFF'),
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="hover-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: (idx % 7 === 0) ? '#E74C3C' : (idx % 7 === 6) ? '#3498DB' : '#2C3E50' }}>
                  {day}
                </span>
                {isToday && (
                  <span style={{ fontSize: '9px', background: '#3498DB', color: 'white', padding: '1px 4px', borderRadius: '4px', fontWeight: '900' }}>
                    TODAY
                  </span>
                )}
              </div>

              {isStamped ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>💮</span>
                  <span style={{ fontSize: '10px', color: '#27AE60', fontWeight: 'bold', marginTop: '2px' }}>
                    {currentLang === 'zh' ? '已签到' : (currentLang === 'fr' ? 'Validé' : '출석완료')}
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#3498DB', fontWeight: 'bold', background: '#EBF5FB', padding: '2px 6px', borderRadius: '6px' }}>
                  ✏️ {isToday ? (currentLang === 'zh' ? '今日学习' : (currentLang === 'fr' ? "Aujourd'hui" : '오늘학습')) : (currentLang === 'zh' ? '去学习' : (currentLang === 'fr' ? 'Étudier' : '학습하기'))}
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
                  💮 [{selectedDateStr}] {currentLang === 'zh' ? '出勤复习单词本' : (currentLang === 'fr' ? 'Mots révisés du jour' : '출석 복습 단어장')}
                </h3>
                <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                  {currentLang === 'zh' ? `[${studentName}] 学生在此日期学习的共 ${selectedStampWords.length} 个单词` : (currentLang === 'fr' ? `Total ${selectedStampWords.length} mots appris par [${studentName}]` : `[${studentName}] 학생이 이 날 공부한 총 ${selectedStampWords.length}개 단어`)}
                </span>
              </div>
              <button onClick={() => setSelectedStampWords(null)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {selectedStampWords.map((item, i) => {
                const wordStr = (item.word || item).replace(/\.png/gi, '').trim();
                const meaningDisplay = currentLang === 'fr'
                  ? (item.meaning_fr || item.meaningFr || item.meaning)
                  : (currentLang === 'zh' ? (item.meaning_zh || item.meaningZh || item.meaning) : item.meaning);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#E8F8F5', borderRadius: '12px', border: '1px solid #A3E4D7' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#117864', fontSize: '15px' }}>#{i + 1} {wordStr}</span>
                      {item.phonics && <span style={{ fontSize: '12px', color: '#7F8C8D', marginLeft: '6px' }}>{item.phonics}</span>}
                      {meaningDisplay && <div style={{ color: '#E74C3C', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>{meaningDisplay}</div>}
                    </div>
                    <button onClick={() => playAudio(wordStr)} style={{ background: '#16A085', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                      🔊
                    </button>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setSelectedStampWords(null)} style={{ width: '100%', background: '#16A085', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t('btn_close', currentLang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
