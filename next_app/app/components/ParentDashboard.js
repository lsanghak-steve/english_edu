'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import ParentNotificationManager from './ParentNotificationManager.js';
import { t, translateStudentGrade, getLocalDateString } from '../../lib/i18n.js';
import { playUniversalAudio } from '../../lib/audioPlayer.js';

// 이름에서 이모지 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function ParentDashboard({ currentUser, onLogout, currentLang = 'ko' }) {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stampedDates, setStampedDates] = useState([]);
  const [learnedWordsList, setLearnedWordsList] = useState([]);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // 📅 달력 상태 (연도, 월, 선택한 날짜, 해당 날짜 학습 단어 목록)
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed (0=1월, 7=8월)
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [selectedDateWords, setSelectedDateWords] = useState([]);
  const [isLoadingDateWords, setIsLoadingDateWords] = useState(false);

  // 모달 상태
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [showWrongModal, setShowWrongModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // 1. Supabase 클라우드 DB `users` 테이블에서 현재 학부모에게 등록된 자녀 목록만 필터링 로드
  useEffect(() => {
    async function loadCloudChildren() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const allFormatted = data.map(s => {
            const rawAvatar = String(s.avatar || s.grade || '').trim();
            const cleanGrade = rawAvatar.replace('[PENDING]', '').replace('[APPROVED]', '').replace('[REJECTED]', '').trim() || '초등 5학년';

            return {
              id: s.id,
              db_id: s.id,
              student_id: s.student_id || s.id,
              name: removeEmoji(s.name),
              grade: cleanGrade,
              avatar: cleanGrade,
              studyGradeLevel: s.study_grade_level || (cleanGrade.includes('중등') ? '중등단어' : (cleanGrade.includes('고등') ? '고등단어' : '초등단어')),
              dailyWordCount: String(s.daily_word_count || '10'),
              daily_word_count: s.daily_word_count || 10,
              studentPin: s.pin || '1234',
              parentName: removeEmoji(s.parent_name || (removeEmoji(s.name).includes('조') ? '조수혁학부모' : '이상학')),
              parentPhone: s.parent_phone || '010-4006-9050',
              parentPin: s.parent_pin || '0815'
            };
          });

          // 👨‍👩‍👧‍👦 가족/학부모별 등록 학생(자녀) 매핑 기준
          const FAMILY_CHILDREN_RELATIONS = {
            '이상학': ['이상학', '이승현', '이수민', '박재현', '김민채'],
            '이승현': ['이상학', '이승현', '이수민', '박재현', '김민채'],
            '이수민': ['이상학', '이승현', '이수민', '박재현', '김민채'],
            '박재현': ['이상학', '이승현', '이수민', '박재현', '김민채'],
            '김민채': ['이상학', '이승현', '이수민', '박재현', '김민채'],
            '조수혁': ['조수혁', '조수아'],
            '조수아': ['조수혁', '조수아'],
            '조수혁학부모': ['조수혁', '조수아'],
            '조수아학부모': ['조수혁', '조수아']
          };

          const targetParent = removeEmoji(currentUser?.parentName || '');
          const targetStudent = removeEmoji(currentUser?.name || '');
          const allowedNames = FAMILY_CHILDREN_RELATIONS[targetParent] ||
                               FAMILY_CHILDREN_RELATIONS[targetStudent] ||
                               (targetStudent ? [targetStudent] : []);

          let filtered = allFormatted.filter(s => {
            const sName = removeEmoji(s.name);
            const sParent = removeEmoji(s.parentName);
            if (allowedNames.length > 0) {
              return allowedNames.includes(sName);
            }
            if (targetParent) {
              return sParent === targetParent || sParent.includes(targetParent) || targetParent.includes(sParent);
            }
            return sName === targetStudent;
          });

          if (filtered.length === 0 && currentUser) {
            const currentObj = allFormatted.find(s => removeEmoji(s.name) === targetStudent || s.id === currentUser.id);
            filtered = currentObj ? [currentObj] : [currentUser];
          }

          if (filtered.length > 0) {
            setChildrenList(filtered);
            setSelectedChildIndex(0);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('Cloud child load fallback', e);
      }

      // LocalStorage / 기본 데이터 백업
      if (currentUser) {
        setChildrenList([currentUser]);
      } else {
        const defaultData = [
          { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 5학년', dailyWordCount: '10', studentPin: '0418', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815' }
        ];
        setChildrenList(defaultData);
      }
      setSelectedChildIndex(0);
      setLoading(false);
    }

    loadCloudChildren();
  }, [currentUser]);

  const activeChild = childrenList[selectedChildIndex] || currentUser || { name: '이상학', dailyWordCount: '20' };
  const studentName = removeEmoji(activeChild.name || '');
  const parentName = removeEmoji(activeChild.parentName) || removeEmoji(currentUser?.parentName) || (currentLang === 'zh' ? '家长' : (currentLang === 'fr' ? 'Parent' : '학부모'));
  const childId = activeChild.student_id || activeChild.id || 'guest';
  const childDbId = activeChild.db_id || activeChild.id || childId;

  // 2. 활성화된 자녀의 출석도장, 학습단어, 오답노트 라이브 동기화
  useEffect(() => {
    if (!studentName) return;

    async function fetchChildRealtimeStats() {
      let queryIds = [childId, childDbId, studentName];
      if (studentName.includes('상학') || childId.includes('sh') || childId.includes('lsh')) {
        queryIds.push('lsh_20260807_000001', 'sh_100', '이상학');
      } else if (studentName.includes('승현') || childId.includes('000002')) {
        queryIds.push('lsh_20260807_000002', 'sh_101', '이승현');
      } else if (studentName.includes('수민') || childId.includes('000003')) {
        queryIds.push('lsm_20260807_000003', 'sm_102', '이수민');
      }
      const cleanIds = [...new Set(queryIds.filter(Boolean))];

      try {
        const [attRes, learnedRes, wrongRes] = await Promise.allSettled([
          supabase.from('study_records').select('*').in('student_id', cleanIds),
          supabase.from('student_learned_words').select('*').in('student_id', cleanIds).order('id', { ascending: false }).limit(5000),
          supabase.from('wrong_words').select('*').in('student_id', cleanIds).limit(5000)
        ]);

        let datesSet = new Set();
        let learnedItemsMap = new Map();
        let matchedWrong = [];

        // study_records 매칭
        if (attRes.status === 'fulfilled' && Array.isArray(attRes.value.data)) {
          attRes.value.data.forEach(item => {
            if (item.study_date) datesSet.add(item.study_date);
            if (Array.isArray(item.stamped_words)) {
              item.stamped_words.forEach(w => {
                const wStr = typeof w === 'string' ? w : w.word;
                if (wStr && !learnedItemsMap.has(wStr.toLowerCase())) {
                  learnedItemsMap.set(wStr.toLowerCase(), { word: wStr, meaning: w.meaning || '', phonics: w.phonics || '' });
                }
              });
            }
          });
        }

        // student_learned_words 매칭
        if (learnedRes.status === 'fulfilled' && Array.isArray(learnedRes.value.data)) {
          learnedRes.value.data.forEach(item => {
            const wordKey = (item.word || '').toLowerCase().trim();
            if (wordKey && !learnedItemsMap.has(wordKey)) {
              learnedItemsMap.set(wordKey, { word: item.word, meaning: item.meaning || '', phonics: item.phonics || '' });
            }
          });
        }

        // wrong_words 매칭
        if (wrongRes.status === 'fulfilled' && Array.isArray(wrongRes.value.data)) {
          matchedWrong = wrongRes.value.data;
        }

        // LocalStorage 백업 로컬 캐시 통합
        try {
          const localStamps = JSON.parse(localStorage.getItem(`english_stamps_${childId}`) || '[]');
          localStamps.forEach(d => datesSet.add(d));

          const localLearned = JSON.parse(localStorage.getItem(`learned_words_${childId}`) || '[]');
          localLearned.forEach(w => {
            const wStr = typeof w === 'string' ? w : w.word;
            if (wStr && !learnedItemsMap.has(wStr.toLowerCase())) {
              learnedItemsMap.set(wStr.toLowerCase(), { word: wStr, meaning: w.meaning || '', phonics: w.phonics || '' });
            }
          });

          if (matchedWrong.length === 0) {
            const localWrong = JSON.parse(localStorage.getItem(`wrong_answers_${childId}`) || localStorage.getItem(`wrong_words_${childId}`) || '[]');
            matchedWrong = localWrong;
          }
        } catch (e) {}

        const finalDates = Array.from(datesSet).sort();
        const finalLearnedList = Array.from(learnedItemsMap.values());

        setLearnedWordsList(finalLearnedList);
        setStampedDates(finalDates);
        setWrongAnswers(matchedWrong);
      } catch (e) {
        console.log('Parent stats fetch fallback', e);
      }
    }

    fetchChildRealtimeStats();

    const handleUpdate = () => { fetchChildRealtimeStats(); };
    window.addEventListener('study_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('study_data_updated', handleUpdate);
    };
  }, [studentName, childId, childDbId]);

  // 🔊 TTS 음성 재생 헬퍼
  const playAudio = (text) => {
    playUniversalAudio(text, { rate: 0.85, lang: 'en' });
  };

  // 📅 달력 월 이동 헬퍼
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarYear(prev => prev - 1);
      setCalendarMonth(11);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
    setSelectedDateStr(null);
    setSelectedDateWords([]);
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarYear(prev => prev + 1);
      setCalendarMonth(0);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
    setSelectedDateStr(null);
    setSelectedDateWords([]);
  };

  // 📅 날짜 클릭 핸들러 (해당 날짜에 공부한 단어 상세 로드)
  const handleCalendarDayClick = async (day) => {
    if (!day) return;
    const mStr = String(calendarMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const fullDate = `${calendarYear}-${mStr}-${dStr}`;
    setSelectedDateStr(fullDate);

    if (!stampedDates.includes(fullDate)) {
      setSelectedDateWords([]);
      return;
    }

    setIsLoadingDateWords(true);
    try {
      // 1. LocalStorage 우선 확인
      let localWords = [];
      try {
        localWords = JSON.parse(
          localStorage.getItem(`stamped_words_${childId}_${fullDate}`) ||
          localStorage.getItem(`today_all_learned_${childId}_${fullDate}`) ||
          '[]'
        );
      } catch (e) {}

      if (localWords && localWords.length > 0) {
        setSelectedDateWords(localWords);
        setIsLoadingDateWords(false);
        return;
      }

      // 2. Supabase DB에서 해당 날짜 학습 단어 조회
      const cleanIds = [childId, childDbId, studentName, 'lsh_20260807_000001', '이상학'].filter(Boolean);
      const { data: dbWords } = await supabase
        .from('student_learned_words')
        .select('word, meaning, learned_at')
        .in('student_id', cleanIds)
        .gte('learned_at', `${fullDate}T00:00:00`)
        .lte('learned_at', `${fullDate}T23:59:59`);

      if (dbWords && dbWords.length > 0) {
        const map = new Map();
        dbWords.forEach(w => {
          const key = (w.word || '').toLowerCase().trim();
          if (key && !map.has(key)) map.set(key, { word: w.word, meaning: w.meaning || '' });
        });
        setSelectedDateWords(Array.from(map.values()));
      } else {
        // 백업: learnedWordsList에서 표시
        setSelectedDateWords(learnedWordsList.slice(0, parseInt(activeChild.dailyWordCount || 10, 10)));
      }
    } catch (err) {
      console.log('Error loading day words', err);
    } finally {
      setIsLoadingDateWords(false);
    }
  };

  // 📅 달력 그리드 계산
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const daysArray = [];
  for (let i = 0; i < firstDayOfMonth; i++) daysArray.push(null);
  for (let d = 1; d <= daysInMonth; d++) daysArray.push(d);

  const currentMonthPrefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}`;
  const thisMonthStampedCount = stampedDates.filter(d => d.startsWith(currentMonthPrefix)).length;
  const thisMonthRate = Math.round((thisMonthStampedCount / Math.max(daysInMonth, 1)) * 100);

  const todayStr = getLocalDateString();

  const weekdays = currentLang === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : (currentLang === 'fr' ? ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] : ['일', '월', '화', '수', '목', '금', '토']);

  const headerTitle = currentLang === 'zh'
    ? `👨‍👩‍👧‍👦 ${parentName} 家长的子女学习安心报告 ☁️`
    : (currentLang === 'fr'
    ? `👨‍👩‍👧‍👦 Rapport de suivi parental - ${parentName} ☁️`
    : `👨‍👩‍👧‍👦 ${parentName} 님의 자녀 안심 학습 리포트 ☁️`);

  const linkedChildrenText = currentLang === 'zh'
    ? `实时关联子女: 共 ${childrenList.length}人`
    : (currentLang === 'fr'
    ? `Enfants associés en temps réel : ${childrenList.length}`
    : `실시간 연동 자녀: 총 ${childrenList.length}명`);

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', width: '100%' }}>
      {/* 👨‍👩‍👧‍👦 학부모 전용 상단 헤더 바 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '2px dashed #E9ECEF', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#8E44AD', fontSize: '22px', fontWeight: '900' }}>
            {headerTitle}
          </h2>
          <span style={{ fontSize: '13px', color: '#27AE60', fontWeight: 'bold' }}>
            {linkedChildrenText}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowNotificationModal(true)}
            style={{ background: '#FEE500', color: '#3C1E1E', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
          >
            📲 {currentLang === 'zh' ? '通知与短信中心 💬' : (currentLang === 'fr' ? 'Centre de notifications 💬' : '카카오 알림톡/문자 센터 💬')}
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(231,76,60,0.2)' }}
            >
              🚪 {currentLang === 'zh' ? '前往学生登录页 (退出)' : (currentLang === 'fr' ? 'Connexion élève (Déconnexion)' : '학생 로그인 화면으로 이동 (로그아웃)')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#8E44AD', fontWeight: 'bold' }}>
          {currentLang === 'zh' ? '☁️ 正在从云端数据库加载子女学习数据...' : (currentLang === 'fr' ? "Chargement des données de l'enfant..." : '☁️ 클라우드 DB에서 자녀 학습 데이터를 로드하는 중...')}
        </div>
      ) : (
        <>
          {/* 👤 자녀 선택 탭 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', background: '#F5EEF8', padding: '12px', borderRadius: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#8E44AD' }}>
              👤 {currentLang === 'zh' ? '选择查看的子女:' : (currentLang === 'fr' ? 'Sélectionner l\'enfant :' : '조회할 자녀 선택:')}
            </span>
            {childrenList.map((child, idx) => (
              <button
                key={child.id || idx}
                onClick={() => {
                  setSelectedChildIndex(idx);
                  setSelectedDateStr(null);
                  setSelectedDateWords([]);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: selectedChildIndex === idx ? '2px solid #8E44AD' : '1px solid #BDC3C7',
                  background: selectedChildIndex === idx ? '#8E44AD' : '#FFFFFF',
                  color: selectedChildIndex === idx ? '#FFFFFF' : '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: selectedChildIndex === idx ? '0 4px 10px rgba(142,68,173,0.2)' : 'none'
                }}
              >
                {removeEmoji(child.name)} ({translateStudentGrade(child.grade || '초등 3학년', currentLang)})
              </button>
            ))}
          </div>

          {/* 👆 클릭 가능한 3대 요약 카드 세트 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {/* 카드 1: 출석도장 */}
            <div
              onClick={() => setShowAttendanceModal(true)}
              style={{ background: '#E8F8F5', padding: '18px', borderRadius: '20px', border: '2px solid #A3E4D7', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              className="hover-card"
            >
              <span style={{ fontSize: '13px', color: '#16A085', fontWeight: 'bold' }}>
                💮 {currentLang === 'zh' ? '累计签到 (点击放大)' : (currentLang === 'fr' ? 'Présence cumulée' : '누적 출석도장 (클릭 확대)')}
              </span>
              <h2 style={{ margin: '8px 0 2px 0', color: '#117864', fontSize: '28px', fontWeight: '900' }}>
                {stampedDates.length}{currentLang === 'zh' ? '天' : (currentLang === 'fr' ? ' j' : '일')}
              </h2>
              <span style={{ fontSize: '11px', color: '#27AE60', fontWeight: 'bold' }}>
                👆 {currentLang === 'zh' ? '查看出勤日历 ➔' : (currentLang === 'fr' ? 'Voir calendrier ➔' : '출석 달력 보기 ➔')}
              </span>
            </div>

            {/* 카드 2: 학습 완수 단어수 & 달란트 */}
            <div
              onClick={() => setShowWordsModal(true)}
              style={{ background: '#FEF9E7', padding: '18px', borderRadius: '20px', border: '2px solid #F9E79F', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              className="hover-card"
            >
              <span style={{ fontSize: '13px', color: '#D4AC0D', fontWeight: 'bold' }}>
                📚 {currentLang === 'zh' ? '掌握单词 (🏆 达兰特)' : (currentLang === 'fr' ? 'Mots appris (🏆 Talents)' : '마스터 단어 (🏆 보유 달란트)')}
              </span>
              <h2 style={{ margin: '8px 0 2px 0', color: '#7D6608', fontSize: '24px', fontWeight: '900' }}>
                {currentLang === 'zh' ? `共 ${learnedWordsList.length} 个` : (currentLang === 'fr' ? `Total ${learnedWordsList.length} mots` : `총 ${learnedWordsList.length}개 단어`)}
              </h2>
              <span style={{ fontSize: '11px', color: '#D35400', fontWeight: 'bold' }}>
                🏆 {learnedWordsList.length} P {currentLang === 'zh' ? '· 查看所有单词 ➔' : (currentLang === 'fr' ? '· Voir liste ➔' : '달란트 적립 · 전체 단어 ➔')}
              </span>
            </div>

            {/* 카드 3: 오답노트 */}
            <div
              onClick={() => setShowWrongModal(true)}
              style={{ background: '#FADBD8', padding: '18px', borderRadius: '20px', border: '2px solid #F5B7B1', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              className="hover-card"
            >
              <span style={{ fontSize: '13px', color: '#C0392B', fontWeight: 'bold' }}>
                ❌ {currentLang === 'zh' ? '待攻克错题 (点击)' : (currentLang === 'fr' ? 'Mots en erreur' : '오답노트 잔여 (클릭)')}
              </span>
              <h2 style={{ margin: '8px 0 2px 0', color: '#78281F', fontSize: '28px', fontWeight: '900' }}>
                {wrongAnswers.length}{currentLang === 'zh' ? '个' : (currentLang === 'fr' ? ' mots' : '개')}
              </h2>
              <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: 'bold' }}>
                👆 {currentLang === 'zh' ? '查看错题本 ➔' : (currentLang === 'fr' ? 'Voir carnet d\'erreurs ➔' : '오답노트 단어장 ➔')}
              </span>
            </div>
          </div>

          {/* 📅 [핵심 요청 구현] 자녀 출석도장 대시보드 내장 인터랙티브 월간 달력 */}
          <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '2px solid #E2E8F0', boxShadow: '0 6px 18px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            {/* 달력 헤더 & 월 전환 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📅</span>
                <div>
                  <h3 style={{ margin: 0, color: '#1E293B', fontSize: '19px', fontWeight: '900' }}>
                    [{studentName}] {currentLang === 'zh' ? `${calendarYear}年 ${calendarMonth + 1}月 出勤签到日历` : `${calendarYear}년 ${calendarMonth + 1}월 출석도장 달력 💮`}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 'bold' }}>
                    {currentLang === 'zh'
                      ? `本月打卡 ${thisMonthStampedCount}天 (${thisMonthRate}%) • 累计签到 ${stampedDates.length}天`
                      : `이번 달 출석 ${thisMonthStampedCount}일 (${thisMonthRate}%) • 총 누적 출석 ${stampedDates.length}일`}
                  </span>
                </div>
              </div>

              {/* 월 전환 버튼 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '7px 14px', borderRadius: '10px', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}
                >
                  ◀ {currentLang === 'zh' ? '上个月' : '이전 달'}
                </button>
                <span style={{ fontWeight: '900', fontSize: '14px', color: '#334155', minWidth: '85px', textAlign: 'center' }}>
                  {calendarYear}.{String(calendarMonth + 1).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '7px 14px', borderRadius: '10px', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}
                >
                  {currentLang === 'zh' ? '下个月' : '다음 달'} ▶
                </button>
              </div>
            </div>

            {/* 요일 헤더 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', textAlign: 'center', fontWeight: '900', fontSize: '13px' }}>
              <div style={{ color: '#EF4444' }}>{weekdays[0]}</div>
              <div style={{ color: '#64748B' }}>{weekdays[1]}</div>
              <div style={{ color: '#64748B' }}>{weekdays[2]}</div>
              <div style={{ color: '#64748B' }}>{weekdays[3]}</div>
              <div style={{ color: '#64748B' }}>{weekdays[4]}</div>
              <div style={{ color: '#64748B' }}>{weekdays[5]}</div>
              <div style={{ color: '#3B82F6' }}>{weekdays[6]}</div>
            </div>

            {/* 날짜 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {daysArray.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} style={{ minHeight: '68px', background: 'transparent' }} />;
                }

                const mStr = String(calendarMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const dateStr = `${calendarYear}-${mStr}-${dStr}`;
                const isStamped = stampedDates.includes(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = selectedDateStr === dateStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleCalendarDayClick(day)}
                    style={{
                      minHeight: '68px',
                      background: isStamped ? '#F0FDF4' : (isToday ? '#EFF6FF' : '#FFFFFF'),
                      border: isSelected
                        ? '3px solid #059669'
                        : (isStamped ? '2px solid #86EFAC' : (isToday ? '2px solid #60A5FA' : '1px solid #E2E8F0')),
                      borderRadius: '14px',
                      padding: '6px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isStamped ? '0 2px 6px rgba(34,197,94,0.15)' : 'none',
                      position: 'relative'
                    }}
                  >
                    {/* 날짜 번호 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: isToday || isStamped ? '900' : 'bold',
                        color: isToday ? '#2563EB' : '#475569'
                      }}>
                        {day}
                      </span>
                      {isToday && (
                        <span style={{ fontSize: '9px', background: '#3B82F6', color: 'white', padding: '1px 4px', borderRadius: '4px', fontWeight: '900' }}>
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* 출석 도장 (💮) 렌더링 */}
                    {isStamped ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2px 0' }}>
                        <span style={{ fontSize: '20px', lineHeight: 1 }}>💮</span>
                        <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '900', marginTop: '1px' }}>
                          {currentLang === 'zh' ? '已打卡' : '출석완료'}
                        </span>
                      </div>
                    ) : (
                      <div style={{ height: '22px' }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* 🔍 선택된 날짜의 세부 학습 단어 팝업/확인창 */}
            {selectedDateStr && (
              <div style={{ marginTop: '18px', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px solid #CBD5E1', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#1E293B', fontSize: '15px', fontWeight: '900' }}>
                    📅 [{selectedDateStr}] {currentLang === 'zh' ? '当日掌握单词明细' : '학습 완료 단어 내역'} ({selectedDateWords.length}개)
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setSelectedDateStr(null); setSelectedDateWords([]); }}
                    style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ✖
                  </button>
                </div>

                {isLoadingDateWords ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#3B82F6', fontWeight: 'bold' }}>
                    ☁️ 해당 날짜의 단어 데이터를 클라우드에서 조회 중...
                  </p>
                ) : selectedDateWords.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>
                    {stampedDates.includes(selectedDateStr)
                      ? '💮 출석 도장이 완수된 날짜입니다.'
                      : '이 날짜에는 학습 기록이 없습니다.'}
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {selectedDateWords.map((item, wIdx) => (
                      <div key={wIdx} style={{ background: '#FFFFFF', padding: '8px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: '900', color: '#1E293B', fontSize: '13px' }}>{item.word}</span>
                          <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 'bold' }}>{item.meaning || ''}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => playAudio(item.word)}
                          style={{ background: '#EFF6FF', color: '#3B82F6', border: '1px solid #BFDBFE', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', fontSize: '11px' }}
                        >
                          🔊
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 따뜻한 피드백 코멘트 */}
          <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '16px', border: '1px solid #E9ECEF' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '15px', fontWeight: 'bold' }}>
              💌 {currentLang === 'zh' ? `给 [${studentName}] 同学的鼓励与寄语` : (currentLang === 'fr' ? `Message d'encouragement pour [${studentName}]` : `[${studentName}] 자녀를 위한 따뜻한 피드백 코멘트`)}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#7F8C8D', lineHeight: 1.6 }}>
              {currentLang === 'zh'
                ? `🔥 太棒了！${studentName} 同学已累计打卡 ${stampedDates.length} 天，并成功背诵掌握了 ${learnedWordsList.length} 个英语单词！👏`
                : currentLang === 'fr'
                ? `🔥 Bravo ! ${studentName} a complété ${stampedDates.length} jours de présence et a maîtrisé ${learnedWordsList.length} mots d'anglais ! 👏`
                : `🔥 대단해요! ${studentName} 학생은 출석도장 총 ${stampedDates.length}일을 달성하고, 누적 ${learnedWordsList.length}개 영단어를 완벽하게 암기 마스터하였습니다! 👏`}
            </p>
          </div>
        </>
      )}

      {/* 팝업 1: 💮 출석도장 달력 확대 모달 */}
      {showAttendanceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>💮</span>
                <h3 style={{ margin: 0, color: '#16A085', fontSize: '18px', fontWeight: '900' }}>
                  [{studentName}] {currentLang === 'zh' ? '出勤打卡日历' : '자녀 출석도장 달력'}
                </h3>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            {/* 모달 내 미니 달력 뷰 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <button onClick={handlePrevMonth} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>◀</button>
              <span style={{ fontWeight: '900', fontSize: '15px', color: '#1E293B' }}>{calendarYear}년 {calendarMonth + 1}월</span>
              <button onClick={handleNextMonth} style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>▶</button>
            </div>

            {/* 요일 헤더 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px', textAlign: 'center', fontWeight: '900', fontSize: '12px' }}>
              <div style={{ color: '#EF4444' }}>일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div style={{ color: '#3B82F6' }}>토</div>
            </div>

            {/* 날짜 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '16px' }}>
              {daysArray.map((day, idx) => {
                if (!day) return <div key={`m-empty-${idx}`} style={{ minHeight: '52px' }} />;
                const mStr = String(calendarMonth + 1).padStart(2, '0');
                const dStr = String(day).padStart(2, '0');
                const dateStr = `${calendarYear}-${mStr}-${dStr}`;
                const isStamped = stampedDates.includes(dateStr);

                return (
                  <div
                    key={`m-${dateStr}`}
                    style={{
                      minHeight: '52px',
                      background: isStamped ? '#F0FDF4' : '#F8FAFC',
                      border: isStamped ? '2px solid #86EFAC' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '4px 2px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: isStamped ? '900' : 'normal', color: isStamped ? '#16A34A' : '#64748B' }}>{day}</span>
                    {isStamped && <span style={{ fontSize: '16px' }}>💮</span>}
                  </div>
                );
              })}
            </div>

            <button onClick={() => setShowAttendanceModal(false)} style={{ width: '100%', background: '#16A085', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}>
              {t('btn_close', currentLang)}
            </button>
          </div>
        </div>
      )}

      {/* 팝업 2: 📖 전체 학습 단어 리스트 모달 */}
      {showWordsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '460px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <div>
                <h3 style={{ margin: 0, color: '#D35400', fontSize: '18px' }}>
                  📖 [{studentName}] {currentLang === 'zh' ? '学习单词列表' : (currentLang === 'fr' ? 'Mots appris' : '자녀 학습 영단어 목록')}
                </h3>
                <span style={{ fontSize: '12px', color: '#E67E22', fontWeight: 'bold' }}>
                  {currentLang === 'zh' ? `共掌握 ${learnedWordsList.length} 个单词` : (currentLang === 'fr' ? `Total ${learnedWordsList.length} mots maîtrisés` : `총 ${learnedWordsList.length}개 단어 암기 수강 완료`)}
                </span>
              </div>
              <button onClick={() => setShowWordsModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {learnedWordsList.map((item, i) => {
                const meaningDisplay = currentLang === 'fr'
                  ? (item.meaning_fr || item.meaningFr || item.meaning)
                  : (currentLang === 'zh' ? (item.meaning_zh || item.meaningZh || item.meaning) : item.meaning);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FEF9E7', borderRadius: '12px', border: '1px solid #F9E79F' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#2C3E50', fontSize: '15px' }}>#{i + 1} {item.word}</span>
                      {item.phonics && <span style={{ fontSize: '12px', color: '#7F8C8D', marginLeft: '6px' }}>{item.phonics}</span>}
                      <div style={{ color: '#E74C3C', fontSize: '13px', fontWeight: 'bold' }}>{meaningDisplay}</div>
                    </div>
                    <button onClick={() => playAudio(item.word)} style={{ background: '#F39C12', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                      🔊
                    </button>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setShowWordsModal(false)} style={{ width: '100%', background: '#D35400', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t('btn_close', currentLang)}
            </button>
          </div>
        </div>
      )}

      {/* 팝업 3: ❌ 퀴즈 오답노트 모달 */}
      {showWrongModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#C0392B', fontSize: '18px' }}>
                ❌ [{studentName}] {currentLang === 'zh' ? '错题本单词' : (currentLang === 'fr' ? 'Carnet d\'erreurs' : '자녀 오답노트 단어장')}
              </h3>
              <button onClick={() => setShowWrongModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            {wrongAnswers.length === 0 ? (
              <div style={{ padding: '30px', color: '#27AE60', fontWeight: 'bold' }}>
                {currentLang === 'zh' ? '🎉 太棒了！没有任何待攻克的错题！👏' : (currentLang === 'fr' ? '🎉 Félicitations ! Aucune erreur enregistrée ! 👏' : '🎉 훌륭합니다! 틀린 오답 단어가 하나도 없습니다! 👏')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', maxHeight: '50vh', overflowY: 'auto' }}>
                {wrongAnswers.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#FADBD8', borderRadius: '12px', border: '1px solid #F5B7B1' }}>
                    <div>
                      <span style={{ fontWeight: 'bold', color: '#78281F' }}>{item.word}</span>
                      <div style={{ color: '#C0392B', fontSize: '13px' }}>{item.meaning}</div>
                    </div>
                    <button onClick={() => playAudio(item.word)} style={{ background: '#E74C3C', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>
                      🔊
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setShowWrongModal(false)} style={{ width: '100%', background: '#C0392B', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              {t('btn_close', currentLang)}
            </button>
          </div>
        </div>
      )}

      {/* 팝업 4: 💬 학부모 알림 발송 모달 */}
      {showNotificationModal && (
        <ParentNotificationManager
          currentUser={currentUser}
          activeChild={activeChild}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
}
