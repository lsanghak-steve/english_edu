'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import wordList500Fallback from '../data/wordsData.js';
import supabase from '../lib/supabaseClient.js';
import StudentLoginPage from './components/StudentLoginPage.js';
import UserManager from './components/UserManager.js';
import QuizSection from './components/QuizSection.js';
import WordListSection from './components/WordListSection.js';
import CalendarSection from './components/CalendarSection.js';
import PersonalVocabSection from './components/PersonalVocabSection.js';
import ParentDashboard from './components/ParentDashboard.js';
import StatsSection from './components/StatsSection.js';
import Day6ReviewSection from './components/Day6ReviewSection.js';
import LeaderboardSection from './components/LeaderboardSection.js';
import { t, translateGradeLevel, getLocalDateString } from '../lib/i18n.js';
import { playUniversalAudio, initAudioUnlock } from '../lib/audioPlayer.js';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mainTab, setMainTab] = useState('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentLang, setCurrentLang] = useState('ko');

  useEffect(() => {
    initAudioUnlock();
    try {
      const savedLang = localStorage.getItem('steve_voca_learning_lang');
      if (savedLang) setCurrentLang(savedLang);
    } catch (e) {}
  }, []);

  useEffect(() => {
    document.title = `${t('app_title', currentLang)} - ${t('app_subtitle', currentLang)}`;
  }, [currentLang]);

  // 📅 달력에서 선택한 학습 날짜 (기본: 로컬 사용자 기준 오늘 날짜 YYYY-MM-DD)
  const todayStr = getLocalDateString();
  const [targetStudyDate, setTargetStudyDate] = useState(todayStr);

  // 단어 목록 데이터는 항상 Supabase 클라우드 DB에서 실시간으로 로드
  const [wordList, setWordList] = useState([]);
  const [dailyRandomWords, setDailyRandomWords] = useState([]);
  const [isWordsLoading, setIsWordsLoading] = useState(true);
  const [studyRound, setStudyRound] = useState(1);

  const [todayAllLearnedWords, setTodayAllLearnedWords] = useState([]);
  const [showTodayAllModal, setShowTodayAllModal] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  const [hasRecorded, setHasRecorded] = useState(false);
  const [completedQuizLevels, setCompletedQuizLevels] = useState([]);

  const handleLangChange = (newLang) => {
    setCurrentLang(newLang);
    try {
      localStorage.setItem('steve_voca_learning_lang', newLang);
    } catch (e) {}
  };

  // 🎛️ TTS 음성 속도 조율 상태 (0.7x ~ 2.0x, 기본 1.0x)
  const [ttsSpeed, setTtsSpeed] = useState(1.0);

  useEffect(() => {
    try {
      const savedSpeed = localStorage.getItem('steve_voca_tts_speed');
      if (savedSpeed) setTtsSpeed(parseFloat(savedSpeed));
    } catch (e) {}
  }, []);

  const handleSpeedChange = (newSpeed) => {
    setTtsSpeed(newSpeed);
    try {
      localStorage.setItem('steve_voca_tts_speed', String(newSpeed));
    } catch (e) {}
    const testMsg = newSpeed === 0.7 ? "Slow mode" : newSpeed === 1.4 ? "Fast mode" : newSpeed === 2.0 ? "Super fast mode" : "Normal mode";
    playUniversalAudio(testMsg, { rate: newSpeed });
  };
  const [pronunciationScore, setPronunciationScore] = useState(null);
  const [userAudioRecordings, setUserAudioRecordings] = useState({});
  const recognitionRef = useRef(null);

  const [initialQuizLevel, setInitialQuizLevel] = useState(1);
  const [resumeNotice, setResumeNotice] = useState(null);
  const [isProgressLoaded, setIsProgressLoaded] = useState(false);

  // 💾 1. [학습 단계별 진도 저장 & 이어서 학습 Engine & 5번 세부 상태 저장]
  const saveStudyProgress = useCallback((overrides = {}) => {
    if (!currentUser || !isLoggedIn) return;
    const dateForMission = targetStudyDate || todayStr;
    const progressKey = `study_progress_${currentUser.id}_${dateForMission}`;

    const curIdx = overrides.currentIndex !== undefined ? overrides.currentIndex : currentIndex;
    const curTab = overrides.mainTab !== undefined ? overrides.mainTab : mainTab;
    const curQuizLevels = overrides.completedQuizLevels !== undefined ? overrides.completedQuizLevels : completedQuizLevels;
    const curHasRec = overrides.hasRecorded !== undefined ? overrides.hasRecorded : hasRecorded;

    // 🎯 [5번 미개발 요구사항] 세부 저장 단계 한국어 명칭 자동 생성
    let detailStageText = `1단계 플래시카드 단어 #${curIdx + 1} 학습 중 🎴`;
    if (curQuizLevels.includes(4)) {
      detailStageText = `4단계 주관식 타이핑 퀴즈 최고 난이도 완수 ✍️`;
    } else if (curQuizLevels.includes(3)) {
      detailStageText = `3단계 마이크 발음 녹음 퀴즈 완수 (75점+) 🎙️`;
    } else if (curQuizLevels.includes(2)) {
      detailStageText = `2단계 필수 스펠링 선택 퀴즈 완료 (출석도장 💮 획득)`;
    } else if (curQuizLevels.includes(1)) {
      detailStageText = `1단계 소리 듣기 퀴즈 완료 🔊`;
    } else if (curHasRec) {
      detailStageText = `2차 녹음 미션 완수 ✅`;
    }

    const currentProgress = {
      currentIndex: curIdx,
      mainTab: curTab,
      completedQuizLevels: curQuizLevels,
      hasRecorded: curHasRec,
      initialQuizLevel: overrides.initialQuizLevel !== undefined ? overrides.initialQuizLevel : initialQuizLevel,
      detailStage: detailStageText,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(progressKey, JSON.stringify(currentProgress));
    } catch (e) {
      console.log('Progress save error', e);
    }

    try {
      const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
      const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

      const syncStudyRecord = async (sid) => {
        if (!sid) return;
        const { data: existing } = await supabase.from('study_records').select('id').eq('student_id', sid).eq('study_date', dateForMission).limit(1);
        if (existing && existing.length > 0) {
          await supabase.from('study_records').update({ is_stamped: true }).eq('id', existing[0].id);
        } else {
          await supabase.from('study_records').insert([{ student_id: sid, study_date: dateForMission, is_stamped: true }]);
        }
      };
      syncStudyRecord(studentIdToUse);
      if (studentNameClean && studentNameClean !== studentIdToUse) {
        syncStudyRecord(studentNameClean);
      }
    } catch (e) {
      console.log('Study record sync error', e);
    }
  }, [currentUser, isLoggedIn, targetStudyDate, todayStr, currentIndex, mainTab, completedQuizLevels, hasRecorded, initialQuizLevel]);


  // 🎯 학생 친화적 발음 유사도 점수(0~100점) 완화 알고리즘 (어린이 및 초보자 친화적 관용 매칭)
  const calculateMatchScore = (targetStr, spokenStr) => {
    if (!targetStr) return 0;
    const cleanTarget = targetStr.toLowerCase().replace(/[^a-z]/g, '');
    const cleanSpoken = (spokenStr || '').toLowerCase().replace(/[^a-z]/g, '');

    // 1. 발음 인식이 아예 안 되거나 마이크 입력이 약한 경우 (기본 격려 점수)
    if (!cleanSpoken || cleanSpoken.trim() === '') {
      return 40;
    }

    // 2. 완전히 일치하는 경우 100점
    if (cleanTarget === cleanSpoken) return 100;

    // 3. 포함 관계이거나 문장 속에 단어가 포함된 경우 (예: "a cat", "the apple", "banana please") 95점 부여
    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      return 95;
    }

    // 4. 발음 유사 음운 정규화 매칭 (c/k, ph/f, z/s, v/b, r/l, 모음 변이 관용 인정)
    const normalizePhonetics = (s) => {
      return s
        .replace(/ph/g, 'f')
        .replace(/ck/g, 'k')
        .replace(/c(?=[eiy])/g, 's')
        .replace(/c/g, 'k')
        .replace(/q/g, 'k')
        .replace(/z/g, 's')
        .replace(/x/g, 'ks')
        .replace(/th/g, 't')
        .replace(/[aeiouy]+/g, 'a');
    };

    const normTarget = normalizePhonetics(cleanTarget);
    const normSpoken = normalizePhonetics(cleanSpoken);

    if (normTarget === normSpoken) {
      return 92;
    }
    if (normSpoken.includes(normTarget) || normTarget.includes(normSpoken)) {
      return 88;
    }

    // 5. 레벤슈타인 편집 거리 기반 관대한 점수 산출
    let m = cleanTarget.length, n = cleanSpoken.length;
    let dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (cleanTarget[i - 1] === cleanSpoken[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    const dist = dp[m][n];

    // 1~2글자 가벼운 발음 차이에 대해 넉넉한 점수 부여
    if (dist === 1) return 88;
    if (dist === 2) return 78;
    if (dist === 3 && Math.max(m, n) >= 5) return 70;

    const maxLen = Math.max(m, n, 1);
    const rawRatio = Math.max(0, (maxLen - dist) / maxLen);
    const boostedScore = Math.round(45 + (rawRatio * 55));
    return Math.max(40, Math.min(100, boostedScore));
  };



  useEffect(() => {
    try {
      const savedSession = sessionStorage.getItem('english_edu_logged_user');
      const savedTab = sessionStorage.getItem('english_edu_main_tab');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const dailySetKey = `daily_random_set_${parsed.id}_${todayStr}`;
        try {
          const cached = JSON.parse(localStorage.getItem(dailySetKey) || '[]');
          const targetCount = parseInt(parsed.dailyWordCount || parsed.daily_word_count || 10, 10);
          if (cached && cached.length === targetCount && cached.length > 0) {
            setDailyRandomWords(cached);
          }
        } catch (e) {}
        setCurrentUser(parsed);
        setIsLoggedIn(true);
        if (savedTab) setMainTab(savedTab);
      }
    } catch (e) {
      console.log('Session parse error', e);
    }
  }, [todayStr]);

  const handleLoginSuccess = (studentObj) => {
    setIsWordsLoading(true);
    const dailySetKey = `daily_random_set_${studentObj.id}_${todayStr}`;
    try {
      const cached = JSON.parse(localStorage.getItem(dailySetKey) || '[]');
      const targetCount = parseInt(studentObj.dailyWordCount || studentObj.daily_word_count || 10, 10);
      if (cached && cached.length === targetCount && cached.length > 0) {
        setDailyRandomWords(cached);
        setTimeout(() => setIsWordsLoading(false), 200);
      }
    } catch (e) {}
    setCurrentUser(studentObj);
    setIsLoggedIn(true);
    setMainTab('flashcard');
    try {
      sessionStorage.setItem('english_edu_logged_user', JSON.stringify(studentObj));
      sessionStorage.setItem('english_edu_main_tab', 'flashcard');
    } catch (e) {
      console.log('Session storage save error', e);
    }
  };

  const handleParentLoginSuccess = (parentName, matchedChildren) => {
    const mainChild = matchedChildren[0] || { name: '자녀', parentName };
    setCurrentUser(mainChild);
    setIsLoggedIn(true);
    setMainTab('parent');
    try {
      sessionStorage.setItem('english_edu_logged_user', JSON.stringify(mainChild));
      sessionStorage.setItem('english_edu_main_tab', 'parent');
    } catch (e) {
      console.log('Session storage save error', e);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    try {
      sessionStorage.removeItem('english_edu_logged_user');
      sessionStorage.removeItem('english_edu_main_tab');
    } catch (e) {
      console.log('Session storage clear error', e);
    }
  };

  // Supabase 클라우드 DB에서 800개 전체 단어 실시간 로드 (100% DB 전용)
  useEffect(() => {
    async function loadWordsFromSupabase() {
      try {
        let allData = [];
        let from = 0;
        const step = 1000;

        while (true) {
          const { data, error } = await supabase
            .from('words')
            .select('*')
            .order('id', { ascending: true })
            .range(from, from + step - 1);

          if (error || !data || data.length === 0) break;
          allData = allData.concat(data);
          if (data.length < step) break;
          from += step;
        }

        if (allData.length > 0) {
          const formatted = allData.map(item => ({
            id: item.id,
            word: (item.word || '').replace(/\.png/gi, '').trim(),
            phonics: item.phonics || '',
            meaning: item.meaning,
            meaning_zh: item.meaning_zh || item.meaningZh || '',
            example_zh: item.example_zh || item.exampleZh || '',
            meaning_fr: item.meaning_fr || item.meaningFr || '',
            example_fr: item.example_fr || item.exampleFr || '',
            meaning_ja: item.meaning_ja || item.meaningJa || '',
            example_ja: item.example_ja || item.exampleJa || '',
            meaning_vi: item.meaning_vi || item.meaningVi || '',
            example_vi: item.example_vi || item.exampleVi || '',
            meaning_hi: item.meaning_hi || item.meaningHi || '',
            example_hi: item.example_hi || item.exampleHi || '',
            meaningZh: item.meaning_zh || item.meaningZh || '',
            exampleZh: item.example_zh || item.exampleZh || '',
            meaningFr: item.meaning_fr || item.meaningFr || '',
            exampleFr: item.example_fr || item.exampleFr || '',
            meaningJa: item.meaning_ja || item.meaningJa || '',
            exampleJa: item.example_ja || item.exampleJa || '',
            meaningVi: item.meaning_vi || item.meaningVi || '',
            exampleVi: item.example_vi || item.exampleVi || '',
            meaningHi: item.meaning_hi || item.meaningHi || '',
            exampleHi: item.example_hi || item.exampleHi || '',
            category: item.category || '초등단어',
            gradeLevel: item.grade_level || '초등단어',
            grade_level: item.grade_level || '초등단어',
            grade_level_ko: item.grade_level_ko || '초등단어',
            grade_level_zh: item.grade_level_zh || '小学英语',
            grade_level_fr: item.grade_level_fr || 'Anglais Primaire',
            grade_level_ja: item.grade_level_ja || '小学生英語',
            grade_level_vi: item.grade_level_vi || 'Tiếng Anh Tiểu học',
            grade_level_hi: item.grade_level_hi || 'प्राथमिक अंग्रेजी',
            exampleEn: (item.example_en || '').replace(/\.png/gi, '').trim(),
            exampleKo: (item.example_ko || '').replace(/\.png/gi, '').trim(),
            imageUrl: item.image_url || ''
          }));
          setWordList(formatted);
        }
      } catch (e) {
        console.log('Supabase cloud words fetch error', e);
      }
    }
    loadWordsFromSupabase();
  }, []);


  // ⚡ 로그인한 학생의 학습 수량(dailyWordCount)만큼 Supabase DB에서 안 외운 단어를 스마트 무작위 콕 찍어 로드
  const loadDailyRandomWordsFromDB = useCallback(async (userObj) => {
    if (!userObj) return [];
    const studentCode = userObj.student_id || '';
    const userId = userObj.id || 'guest';
    const rawName = userObj.name || '';
    const userName = rawName.replace(/\(.*?\)/g, '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    let targetGradeLevel = userObj.studyGradeLevel || userObj.study_grade_level || '초등단어';
    let dailyCount = parseInt(userObj.dailyWordCount || userObj.daily_word_count || 10, 10);

    // ☁️ 100% Supabase DB `users` 테이블에서 최신 학습 레벨 & 일일 목표 단어 수 즉시 라이브 조회
    try {
      let liveUserData = null;
      if (studentCode || userId) {
        let userQuery = supabase.from('users').select('study_grade_level, daily_word_count');
        const validCodes = [studentCode, userId].filter(id => id && /^[a-zA-Z0-9_-]+$/.test(id));
        const uniqueCodes = Array.from(new Set(validCodes));
        if (uniqueCodes.length > 1) {
          userQuery = userQuery.or(uniqueCodes.map(id => `student_id.eq.${id}`).join(','));
        } else if (uniqueCodes.length === 1) {
          userQuery = userQuery.eq('student_id', uniqueCodes[0]);
        }
        const { data: dbByCode } = await userQuery.limit(1);
        if (dbByCode && dbByCode[0]) liveUserData = dbByCode[0];
      }

      if (!liveUserData && userName) {
        const { data: dbByName } = await supabase
          .from('users')
          .select('study_grade_level, daily_word_count')
          .ilike('name', `%${userName}%`)
          .limit(1);
        if (dbByName && dbByName[0]) liveUserData = dbByName[0];
      }

      if (liveUserData) {
        if (liveUserData.study_grade_level) targetGradeLevel = liveUserData.study_grade_level;
        if (liveUserData.daily_word_count) dailyCount = parseInt(liveUserData.daily_word_count, 10);
        console.log(`☁️ [Supabase DB 100% 라이브 조율] 레벨: ${targetGradeLevel}, 목표 단어 수: ${dailyCount}개`);
      }
    } catch (e) {}

    const validStudentIds = [studentCode, userId].filter(id => id && /^[a-zA-Z0-9_-]+$/.test(id));
    const uniqueStudentIds = Array.from(new Set(validStudentIds));

    try {
      // 1. Supabase DB에서 해당 학생이 이미 공부한 모든 단어 목록 가져오기 (3중 안전 쿼리)
      let learnedQuery = supabase.from('student_learned_words').select('word');

      if (uniqueStudentIds.length > 1) {
        const orCond = uniqueStudentIds.map(id => `student_id.eq.${id}`).join(',');
        learnedQuery = learnedQuery.or(orCond);
      } else if (uniqueStudentIds.length === 1) {
        learnedQuery = learnedQuery.eq('student_id', uniqueStudentIds[0]);
      }

      const learnedRes = await learnedQuery;

      let learnedWordSet = new Set();
      if (learnedRes && learnedRes.data) {
        learnedRes.data.forEach(item => {
          if (item.word) learnedWordSet.add(item.word.trim().toLowerCase());
        });
      }

      // LocalStorage 백업 단어 병합
      try {
        const localLearned = JSON.parse(localStorage.getItem(`learned_words_${userId}`) || localStorage.getItem(`learned_words_${studentCode}`) || '[]');
        localLearned.forEach(w => {
          const wStr = typeof w === 'string' ? w : w.word;
          if (wStr) learnedWordSet.add(wStr.trim().toLowerCase());
        });
      } catch (e) {}

      // 2. 학생이 선택한 학습 단어 레벨 (studyGradeLevel: 초등단어 / 중등단어 / 고등단어 / 전체)

      let allWordsData = [];
      let from = 0;
      const step = 1000;
      while (true) {
        const { data, error } = await supabase.from('words').select('*').order('id', { ascending: true }).range(from, from + step - 1);
        if (error || !data || data.length === 0) break;
        allWordsData = allWordsData.concat(data);
        if (data.length < step) break;
        from += step;
      }
      const baseWords = (allWordsData && allWordsData.length > 0) ? allWordsData : wordList500Fallback;

      if (baseWords && baseWords.length > 0) {
        const formatted = baseWords.map(item => ({
          id: item.id,
          word: (item.word || '').replace(/\.png/gi, '').trim(),
          phonics: item.phonics || '',
          meaning: item.meaning,
          meaning_zh: item.meaning_zh || item.meaningZh || '',
          example_zh: item.example_zh || item.exampleZh || '',
          meaning_fr: item.meaning_fr || item.meaningFr || '',
          example_fr: item.example_fr || item.exampleFr || '',
          meaning_ja: item.meaning_ja || item.meaningJa || '',
          example_ja: item.example_ja || item.exampleJa || '',
          meaning_vi: item.meaning_vi || item.meaningVi || '',
          example_vi: item.example_vi || item.exampleVi || '',
          meaning_hi: item.meaning_hi || item.meaningHi || '',
          example_hi: item.example_hi || item.exampleHi || '',
          meaningZh: item.meaning_zh || item.meaningZh || '',
          exampleZh: item.example_zh || item.exampleZh || '',
          meaningFr: item.meaning_fr || item.meaningFr || '',
          exampleFr: item.example_fr || item.exampleFr || '',
          meaningJa: item.meaning_ja || item.meaningJa || '',
          exampleJa: item.example_ja || item.exampleJa || '',
          meaningVi: item.meaning_vi || item.meaningVi || '',
          exampleVi: item.example_vi || item.exampleVi || '',
          meaningHi: item.meaning_hi || item.meaningHi || '',
          exampleHi: item.example_hi || item.exampleHi || '',
          category: item.category || '초등단어',
          gradeLevel: item.grade_level || item.gradeLevel || (item.category && item.category.includes('중등') ? '중등단어' : (item.id >= 1000 ? '중등단어' : '초등단어')),
          grade_level: item.grade_level || item.gradeLevel || '초등단어',
          grade_level_ko: item.grade_level_ko || '초등단어',
          grade_level_zh: item.grade_level_zh || '小学英语',
          grade_level_fr: item.grade_level_fr || 'Anglais Primaire',
          grade_level_ja: item.grade_level_ja || '小学生英語',
          grade_level_vi: item.grade_level_vi || 'Tiếng Anh Tiểu học',
          grade_level_hi: item.grade_level_hi || 'प्राथमिक अंग्रेजी',
          exampleEn: (item.example_en || item.exampleEn || '').replace(/\.png/gi, '').trim(),
          exampleKo: (item.example_ko || item.exampleKo || '').replace(/\.png/gi, '').trim(),
          imageUrl: item.image_url || ''
        }));

        // 학생이 지정한 학습 레벨(초등/중등/고등) 필터링
        let levelFiltered = formatted;
        if (targetGradeLevel !== '전체') {
          levelFiltered = formatted.filter(w => w.gradeLevel === targetGradeLevel);
          if (levelFiltered.length === 0) levelFiltered = formatted; // 수량이 부족할 시 전체 폴백
        }

        // 안 배운 단어만 정밀 추출
        let unlearned = levelFiltered.filter(w => !learnedWordSet.has(w.word.toLowerCase()));

        // 해당 레벨의 단어를 전부 완독한 경우 해당 레벨 전체에서 무작위 셔플 재회독
        if (unlearned.length < dailyCount) {
          unlearned = [...levelFiltered];
        }

        // 무조건 랜덤 셔플
        const shuffled = [...unlearned].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, dailyCount);
      }
    } catch (e) {
      console.log('Daily random words fetch error', e);
    }

    // 폴백 시에도 안 배운 단어 무작위 셔플 추출
    const shuffledFallback = [...wordList500Fallback].sort(() => Math.random() - 0.5);
    return shuffledFallback.slice(0, dailyCount);
  }, []);


  // ⚡ [관리자-학생 화면 실시간 레벨, 학년 & 단어수 동기화 Engine]
  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;

    const checkAndSyncProfile = async () => {
      try {
        const studentIdToSearch = currentUser.student_id || currentUser.id;
        const rawName = currentUser.name || '';
        const studentNameClean = rawName.replace(/\(.*?\)/g, '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

        let dbUser = null;
        if (studentIdToSearch && studentIdToSearch.length > 5) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('student_id', studentIdToSearch)
            .limit(1);
          if (data && data[0]) dbUser = data[0];
        }

        if (!dbUser && studentNameClean) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .ilike('name', `%${studentNameClean}%`)
            .limit(1);
          if (data && data[0]) dbUser = data[0];
        }

        if (dbUser) {
          const rawAvatar = String(dbUser.avatar || dbUser.grade || '').trim();
          const cleanCloudGrade = rawAvatar.replace('[PENDING]', '').replace('[APPROVED]', '').replace('[REJECTED]', '').trim();
          const cloudGrade = cleanCloudGrade || currentUser.grade || currentUser.avatar || '초등 5학년';
          const cloudLevel = dbUser.study_grade_level || '초등단어';
          const cloudCount = String(dbUser.daily_word_count || '10');

          const rawCurGrade = String(currentUser.grade || currentUser.avatar || '').trim();
          const curGrade = rawCurGrade.replace('[PENDING]', '').replace('[APPROVED]', '').replace('[REJECTED]', '').trim() || '초등 5학년';
          const curLevel = currentUser.studyGradeLevel || currentUser.study_grade_level || '초등단어';
          const curCount = String(currentUser.dailyWordCount || currentUser.daily_word_count || '10');

          if (cloudLevel !== curLevel || cloudCount !== curCount || (cleanCloudGrade && cleanCloudGrade !== curGrade)) {
            console.log(`🔄 [실시간 프로필 동기화] 레벨: ${curLevel} -> ${cloudLevel}, 목표: ${curCount} -> ${cloudCount}, 학년: ${curGrade} -> ${cloudGrade}`);
            const updatedUser = {
              ...currentUser,
              grade: cloudGrade,
              avatar: cloudGrade,
              studyGradeLevel: cloudLevel,
              study_grade_level: cloudLevel,
              dailyWordCount: cloudCount,
              daily_word_count: parseInt(cloudCount, 10)
            };
            setCurrentUser(updatedUser);
            sessionStorage.setItem('english_edu_logged_user', JSON.stringify(updatedUser));
            localStorage.setItem('english_edu_logged_user', JSON.stringify(updatedUser));
            localStorage.setItem('english_edu_current_user', JSON.stringify(updatedUser));
            const newRandoms = await loadDailyRandomWordsFromDB(updatedUser);
            if (newRandoms && newRandoms.length > 0) {
              setDailyRandomWords(newRandoms);
              setCurrentIndex(0);
            }
          }
        }
      } catch (e) {}
    };

    checkAndSyncProfile();
    const interval = setInterval(checkAndSyncProfile, 3000);
    window.addEventListener('user_profile_updated', checkAndSyncProfile);
    window.addEventListener('storage', checkAndSyncProfile);

    return () => {
      clearInterval(interval);
      window.removeEventListener('user_profile_updated', checkAndSyncProfile);
      window.removeEventListener('storage', checkAndSyncProfile);
    };
  }, [currentUser, isLoggedIn, loadDailyRandomWordsFromDB]);

  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;
    const dateForMission = targetStudyDate || todayStr;
    const recKey = `record_mission_${currentUser.id}_${dateForMission}`;
    const quizKey = `quiz_mission_${currentUser.id}_${dateForMission}`;
    const dailySetKey = `daily_random_set_${currentUser.id}_${dateForMission}`;
    const todayAllKey = `today_all_learned_${currentUser.id}_${dateForMission}`;
    const progressKey = `study_progress_${currentUser.id}_${dateForMission}`;

    const recStatus = localStorage.getItem(recKey) === 'true';
    setHasRecorded(recStatus);

    let storedQuiz = [];
    try {
      storedQuiz = JSON.parse(localStorage.getItem(quizKey) || '[]');
      setCompletedQuizLevels(storedQuiz);
    } catch (e) {
      setCompletedQuizLevels([]);
    }

    try {
      const savedTodayAll = JSON.parse(localStorage.getItem(todayAllKey) || '[]');
      setTodayAllLearnedWords(savedTodayAll);
    } catch (e) {
      setTodayAllLearnedWords([]);
    }

    // 🚀 [이어서 학습 Engine] 저장된 진도 복원 (Smart Auto-Resume)
    let savedProgress = null;
    try {
      savedProgress = JSON.parse(localStorage.getItem(progressKey) || 'null');
    } catch (e) {
      savedProgress = null;
    }

    const userDailyCount = parseInt(currentUser.dailyWordCount || 10, 10);

    if (savedProgress) {
      const savedIdx = typeof savedProgress.currentIndex === 'number' ? savedProgress.currentIndex : 0;
      setCurrentIndex(Math.min(savedIdx, Math.max(0, userDailyCount - 1)));

      if (storedQuiz.includes(2)) {
        // 이미 2단계 스펠링 퀴즈 완수
        setResumeNotice({ type: 'completed', date: dateForMission });
      } else if (storedQuiz.includes(1)) {
        // 1단계 소리 퀴즈 완료 ➔ 2단계 스펠링 퀴즈로 자동 이동
        setMainTab('quiz');
        setInitialQuizLevel(2);
        setResumeNotice({ type: 'level2_quiz' });
      } else if (savedProgress.mainTab === 'quiz' || savedIdx >= userDailyCount - 1) {
        // 퀴즈 탭 또는 카드 학습 완료 ➔ 1단계 소리 퀴즈로 자동 이동
        setMainTab('quiz');
        setInitialQuizLevel(1);
        setResumeNotice({ type: 'level1_quiz' });
      } else {
        // 플래시카드 진행 중
        if (savedProgress.mainTab) setMainTab(savedProgress.mainTab);
        setResumeNotice({ type: 'resume_word', index: savedIdx + 1 });
      }
    } else {
      setResumeNotice(null);
    }

    setIsProgressLoaded(true);

    async function syncDailyRandomWords() {
      let savedDailySet = [];
      try {
        savedDailySet = JSON.parse(localStorage.getItem(dailySetKey) || '[]');
      } catch (e) {
        savedDailySet = [];
      }

      const targetCount = parseInt(currentUser?.dailyWordCount || currentUser?.daily_word_count || 10, 10);

      let finalLoaded = false;
      // 로컬 세트의 개수가 현재 학생의 목표 수량(예: 20개)과 정확히 일치할 때만 캐시 사용, 다르면 DB 라이브 로드!
      if (savedDailySet && savedDailySet.length === targetCount && savedDailySet.length > 0) {
        const sanitized = savedDailySet.map(w => {
          const rawWord = (w.word || '').replace(/\.png/gi, '').trim();
          const cleanWord = rawWord.toLowerCase();
          return {
            ...w,
            word: cleanWord,
            image_url: `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${cleanWord}.png`,
            imageUrl: `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${cleanWord}.png`
          };
        });
        setDailyRandomWords(sanitized);
        localStorage.setItem(dailySetKey, JSON.stringify(sanitized));
        finalLoaded = true;
      } else {
        const newRandomSet = await loadDailyRandomWordsFromDB(currentUser);
        if (newRandomSet && newRandomSet.length > 0) {
          setDailyRandomWords(newRandomSet);
          localStorage.setItem(dailySetKey, JSON.stringify(newRandomSet));
          setTodayAllLearnedWords(newRandomSet);
          localStorage.setItem(todayAllKey, JSON.stringify(newRandomSet));
          finalLoaded = true;
        }
      }
      setTimeout(() => {
        setIsWordsLoading(false);
      }, 350);
    }

    syncDailyRandomWords();
  }, [currentUser, isLoggedIn, targetStudyDate, todayStr, loadDailyRandomWordsFromDB]);

  // 🔄 처음부터 다시 학습하기
  const handleRestartStudyProgress = () => {
    setCurrentIndex(0);
    setMainTab('flashcard');
    setInitialQuizLevel(1);
    const dateForMission = targetStudyDate || todayStr;
    if (currentUser) {
      const progressKey = `study_progress_${currentUser.id}_${dateForMission}`;
      localStorage.removeItem(progressKey);
    }
    setResumeNotice(`🔄 처음부터 학습을 시작합니다! (단어 #1)`);
  };


  // 📅 출석 달력에서 특정 날짜를 눌렀을 때 학습 시작 핸들러!
  const handleSelectDateToStudy = (selectedDateStr) => {
    setTargetStudyDate(selectedDateStr);
    setMainTab('flashcard');
    setCurrentIndex(0);
    setIsFlipped(false);
    alert(currentLang === 'zh'
      ? `📅 已开启 [${selectedDateStr}] 的单词学习！\n\n掌握单词卡片并通过测验后，该日期将盖上出勤印章(💮)！🚀`
      : `📅 [${selectedDateStr}] 날짜의 단어 학습을 시작합니다!\n\n플래시카드 단어를 확인하고 2단계 퀴즈를 완수하면 이 날짜에 출석 도장(💮)이 찍힙니다! 🚀`);
  };

  const handleLoadNextWordSet = () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const dailyCount = parseInt(currentUser.dailyWordCount || 20, 10);
    const learnedKey = `learned_words_${userId}`;
    const dateForMission = targetStudyDate || todayStr;
    const todayAllKey = `today_all_learned_${currentUser.id}_${dateForMission}`;

    let learnedList = [];
    try {
      learnedList = JSON.parse(localStorage.getItem(learnedKey) || '[]');
    } catch (e) {
      learnedList = [];
    }

    const currentWordsStr = dailyRandomWords.map(w => (typeof w === 'string' ? w : w.word));
    const updatedLearned = [...new Set([...learnedList, ...currentWordsStr])];
    localStorage.setItem(learnedKey, JSON.stringify(updatedLearned));

    let unlearned = wordList.filter(w => !updatedLearned.includes(typeof w === 'string' ? w : w.word));
    if (unlearned.length < dailyCount) {
      // 5,000개 전체 단어를 순환하였을 경우 학습 목록 리셋 후 순차 선택
      localStorage.setItem(learnedKey, JSON.stringify([]));
      unlearned = [...wordList];
    }

    // 다음 20개 단어 순차적 선택 (미학습 단어 순서대로)
    const nextSet = unlearned.slice(0, dailyCount);

    setDailyRandomWords(nextSet);
    localStorage.setItem(`daily_random_set_${userId}_${dateForMission}`, JSON.stringify(nextSet));

    const updatedTodayAll = [...todayAllLearnedWords, ...nextSet];
    setTodayAllLearnedWords(updatedTodayAll);
    localStorage.setItem(todayAllKey, JSON.stringify(updatedTodayAll));

    const nextRound = studyRound + 1;
    setStudyRound(nextRound);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedQuizLevels([]);
    setMainTab('flashcard');

    // 🔊 원어민 안내 TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Round ${nextRound} loaded!`);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    alert(currentLang === 'zh'
      ? `🎉 🚀 已加载下一组单词（第 ${nextRound} 轮 - ${nextSet.length} 个单词）！\n\n今日累计掌握的 ${updatedTodayAll.length} 个单词可在顶部随时复习！👏`
      : `🎉 🚀 다음 단어 세트(제 ${nextRound}회차 - ${nextSet.length}개 단어)를 로딩했습니다!\n\n오늘 연속 마스터한 총 ${updatedTodayAll.length}개 단어는 상단 [📖 오늘 누적 학습 단어]에서 언제든 복습 가능합니다! 👏`);
  };

  const userDailyCount = currentUser ? parseInt(currentUser.dailyWordCount || currentUser.daily_word_count || 10, 10) : 10;

  const safeActiveWords = isWordsLoading
    ? []
    : ((dailyRandomWords && dailyRandomWords.length > 0)
      ? dailyRandomWords.slice(0, userDailyCount)
      : ((wordList && wordList.length > 0) ? wordList.slice(0, userDailyCount) : []));

  // 🛡️ 단어 수 변경 시 인덱스 범위 초과 방지 및 안전 클램핑
  useEffect(() => {
    if (safeActiveWords.length > 0 && currentIndex >= safeActiveWords.length) {
      setCurrentIndex(0);
    }
  }, [safeActiveWords.length, currentIndex]);

  // ⚡ [초고속 이미지 프리로딩 엔진] 오늘 학습 세트(10~20단어)의 모든 고화질 단어 이미지를 백그라운드 브라우저 RAM 캐시에 사전 탑재
  useEffect(() => {
    if (!safeActiveWords || safeActiveWords.length === 0 || typeof window === 'undefined') return;

    // 1. 현재 학습 단어 + 전후 단어 3개 최우선 즉시 프리로드 (High Priority)
    [currentIndex, currentIndex + 1, currentIndex + 2, currentIndex - 1].forEach((idx) => {
      if (idx >= 0 && idx < safeActiveWords.length) {
        const wObj = safeActiveWords[idx];
        const src = getWordImgSrc(wObj);
        if (src) {
          const preImg = new Image();
          preImg.fetchPriority = 'high';
          preImg.decoding = 'async';
          preImg.src = src;
        }
      }
    });

    // 2. 나머지 모든 단어 이미지도 백그라운드에서 병렬 프리로드
    const timer = setTimeout(() => {
      safeActiveWords.forEach((wObj, i) => {
        if (i !== currentIndex) {
          const src = getWordImgSrc(wObj);
          if (src) {
            const preImg = new Image();
            preImg.decoding = 'async';
            preImg.src = src;
          }
        }
      });
    }, 50);

    return () => clearTimeout(timer);
  }, [safeActiveWords, currentIndex]);

  const currentWord = (safeActiveWords && safeActiveWords.length > 0)
    ? (safeActiveWords[currentIndex] || safeActiveWords[0])
    : null;


  const cleanWordStr = typeof currentWord === 'string'
    ? currentWord.replace(/\.png/gi, '').trim()
    : (currentWord?.word || 'Word').replace(/\.png/gi, '').trim();

  // 📖 사전(wordList500Fallback)에서 영단어 스펠링 기반 1:1 한글 뜻 및 발음기호 정밀 매칭 보정
  const matchedDictWord = Array.isArray(wordList500Fallback)
    ? wordList500Fallback.find(w => (w.word || '').toLowerCase().replace(/\.png/gi, '').trim() === cleanWordStr.toLowerCase())
    : null;

  // 🌐 이어서 학습 알림 6개 국어 다국어 변환 헬퍼
  const getResumeNoticeText = (notice, lang, curIdx, totalCount) => {
    if (!notice) {
      if (lang === 'zh') return `▶ 当前位置: 单词 #${curIdx + 1} / ${totalCount}`;
      if (lang === 'fr') return `▶ Position: Mot #${curIdx + 1} / ${totalCount}`;
      if (lang === 'ja') return `▶ 現在の学習位置: 単語 #${curIdx + 1} / ${totalCount}`;
      if (lang === 'vi') return `▶ Vị trí học: Từ #${curIdx + 1} / ${totalCount}`;
      if (lang === 'hi') return `▶ वर्तमान स्थान: शब्द #${curIdx + 1} / ${totalCount}`;
      return `▶ 현재 학습 위치: 단어 #${curIdx + 1} / ${totalCount}`;
    }

    if (typeof notice === 'object') {
      if (notice.type === 'completed') {
        if (lang === 'zh') return `🎉 [学习完成] 已颁发出勤印章(💮)！可继续复习或学习下一组。`;
        if (lang === 'fr') return `🎉 [Session terminée] Tampon de présence (💮) attribué ! Continuez à réviser ou passez au set suivant.`;
        if (lang === 'ja') return `🎉 [学習完了] 出席スタンプ(💮) 授与完了！復習するか次のセットを学習してください。`;
        if (lang === 'vi') return `🎉 [Hoàn thành] Đã cấp con dấu chuyên cần (💮)! Hãy ôn tập hoặc học bộ tiếp theo.`;
        if (lang === 'hi') return `🎉 [अध्ययन पूरा हुआ] उपस्थिति मुहर (💮) प्रदान की गई! समीक्षा जारी रखें या अगला सेट सीखें।`;
        return `🎉 [학습 완수] [${notice.date || ''}] 출석 도장(💮) 수여 완료! 이어서 복습하거나 다음 세트를 공부하세요.`;
      }
      if (notice.type === 'level2_quiz') {
        if (lang === 'zh') return `▶ [继续学习] 第1关声音测验已完成！已自动连接到第2关拼写选择测验(必修)。🧩`;
        if (lang === 'fr') return `▶ [Reprendre] Niveau 1 terminé ! Redirection automatique vers le Quiz Orthographe Niveau 2. 🧩`;
        if (lang === 'ja') return `▶ [続きから学習] 第1段階音声クイズ完了！第2段階スペル選択クイズ(必須)へ自動接続されました。🧩`;
        if (lang === 'vi') return `▶ [Tiếp tục học] Hoàn thành cấp 1! Đã tự động chuyển đến Trắc nghiệm chính tả Cấp 2. 🧩`;
        if (lang === 'hi') return `▶ [अध्ययन जारी रखें] स्तर 1 ध्वनि क्विज पूरा हुआ! स्तर 2 वर्तनी चयन क्विज से स्वचालित रूप से जुड़ा हुआ है। 🧩`;
        return `▶ [이어서 학습] 1단계 소리 퀴즈 완료! 2단계 스펠링 선택 퀴즈(필수)로 자동 연결되었습니다. 🧩`;
      }
      if (notice.type === 'level1_quiz') {
        if (lang === 'zh') return `▶ [继续学习] 从第1关声音测验继续学习。🔊`;
        if (lang === 'fr') return `▶ [Reprendre] Reprise à partir du Niveau 1 Quiz Audio. 🔊`;
        if (lang === 'ja') return `▶ [続きから学習] 第1段階音声クイズから続きを学習します。🔊`;
        if (lang === 'vi') return `▶ [Tiếp tục học] Tiếp tục học từ Trắc nghiệm âm thanh Cấp 1. 🔊`;
        if (lang === 'hi') return `▶ [अध्ययन जारी रखें] स्तर 1 ध्वनि क्विज से सीखना जारी रखें。 🔊`;
        return `▶ [이어서 학습] 1단계 소리 퀴즈부터 이어서 학습합니다. 🔊`;
      }
      if (notice.type === 'resume_word') {
        const num = notice.index || (curIdx + 1);
        if (lang === 'zh') return `▶ [继续学习] 从上次学习位置 (单词 #${num}) 继续学习！🎴`;
        if (lang === 'fr') return `▶ [Reprendre] Reprise depuis la position précédente (Mot #${num}) ! 🎴`;
        if (lang === 'ja') return `▶ [続きから学習] 前回の学習位置 (単語 #${num}) から続きを学習します！🎴`;
        if (lang === 'vi') return `▶ [Tiếp tục học] Tiếp tục từ vị trí trước (Từ #${num})! 🎴`;
        if (lang === 'hi') return `▶ [अध्ययन जारी रखें] पिछले स्थान (शब्द #${num}) से सीखना जारी रखें! 🎴`;
        return `▶ [이어서 학습] 이전 학습 위치 (단어 #${num})부터 이어서 학습합니다! 🎴`;
      }
    }
    return notice;
  };

  // 🌐 언어 세팅(currentLang: 'ko', 'zh', 'fr', 'ja', 'vi', 'hi')에 따른 6개 국어 동적 매칭
  const cleanMeaningStr = 
    currentLang === 'fr' ? ((typeof currentWord === 'object' && (currentWord?.meaning_fr || currentWord?.meaningFr)) || matchedDictWord?.meaning_fr || currentWord?.meaning || 'Signification') :
    currentLang === 'zh' ? ((typeof currentWord === 'object' && (currentWord?.meaning_zh || currentWord?.meaningZh)) || matchedDictWord?.meaning_zh || currentWord?.meaning || '释义') :
    currentLang === 'ja' ? ((typeof currentWord === 'object' && (currentWord?.meaning_ja || currentWord?.meaningJa)) || matchedDictWord?.meaning_ja || currentWord?.meaning || '意味') :
    currentLang === 'vi' ? ((typeof currentWord === 'object' && (currentWord?.meaning_vi || currentWord?.meaningVi)) || matchedDictWord?.meaning_vi || currentWord?.meaning || 'Nghĩa') :
    currentLang === 'hi' ? ((typeof currentWord === 'object' && (currentWord?.meaning_hi || currentWord?.meaningHi)) || matchedDictWord?.meaning_hi || currentWord?.meaning || 'अर्थ') :
    ((typeof currentWord === 'object' && currentWord?.meaning && currentWord.meaning !== '기초 단어')
      ? currentWord.meaning
      : (matchedDictWord?.meaning || '단어 뜻'));

  const cleanPhonicsStr = (typeof currentWord === 'object' && currentWord?.phonics && currentWord.phonics !== '')
    ? currentWord.phonics
    : (matchedDictWord?.phonics || matchedDictWord?.category || '');

  const rawExampleEn = (typeof currentWord === 'object' && (currentWord?.exampleEn || currentWord?.example_en)) ? (currentWord.exampleEn || currentWord.example_en).replace(/\.png/gi, '').trim() : '';
  const rawExampleKo = (typeof currentWord === 'object' && (currentWord?.exampleKo || currentWord?.example_ko)) ? (currentWord.exampleKo || currentWord.example_ko).replace(/\.png/gi, '').trim() : '';
  const rawExampleZh = (typeof currentWord === 'object' && (currentWord?.exampleZh || currentWord?.example_zh)) ? (currentWord.exampleZh || currentWord.example_zh).replace(/\.png/gi, '').trim() : '';
  const rawExampleFr = (typeof currentWord === 'object' && (currentWord?.exampleFr || currentWord?.example_fr)) ? (currentWord.exampleFr || currentWord.example_fr).replace(/\.png/gi, '').trim() : '';
  const rawExampleJa = (typeof currentWord === 'object' && (currentWord?.exampleJa || currentWord?.example_ja)) ? (currentWord.exampleJa || currentWord.example_ja).replace(/\.png/gi, '').trim() : '';
  const rawExampleVi = (typeof currentWord === 'object' && (currentWord?.exampleVi || currentWord?.example_vi)) ? (currentWord.exampleVi || currentWord.example_vi).replace(/\.png/gi, '').trim() : '';
  const rawExampleHi = (typeof currentWord === 'object' && (currentWord?.exampleHi || currentWord?.example_hi)) ? (currentWord.exampleHi || currentWord.example_hi).replace(/\.png/gi, '').trim() : '';

  const isRealSentenceEn = rawExampleEn && /[a-zA-Z]/.test(rawExampleEn) && !rawExampleEn.includes('제작완료') && !rawExampleEn.toLowerCase().endsWith('.png') && rawExampleEn.split(/\s+/).length >= 2;
  const isRealSentenceKo = rawExampleKo && !rawExampleKo.includes('.png') && !rawExampleKo.includes('제작완료') && rawExampleKo.trim().length >= 2;
  const isRealSentenceZh = rawExampleZh && !rawExampleZh.includes('.png') && rawExampleZh.trim().length >= 2;
  const isRealSentenceFr = rawExampleFr && !rawExampleFr.includes('.png') && rawExampleFr.trim().length >= 2;
  const isRealSentenceJa = rawExampleJa && !rawExampleJa.includes('.png') && rawExampleJa.trim().length >= 2;
  const isRealSentenceVi = rawExampleVi && !rawExampleVi.includes('.png') && rawExampleVi.trim().length >= 2;
  const isRealSentenceHi = rawExampleHi && !rawExampleHi.includes('.png') && rawExampleHi.trim().length >= 2;

  const displayExampleEn = isRealSentenceEn
    ? rawExampleEn
    : `I see a nice ${cleanWordStr.toLowerCase()}.`;

  const displayExampleKo = currentLang === 'fr'
    ? (isRealSentenceFr ? rawExampleFr : `Je vois un bon ${cleanMeaningStr}.`)
    : (currentLang === 'zh'
      ? (isRealSentenceZh ? rawExampleZh : `我看到一个很好的 ${cleanMeaningStr}。`)
      : (currentLang === 'ja'
        ? (isRealSentenceJa ? rawExampleJa : `私は素敵な${cleanMeaningStr}を見ます。`)
        : (currentLang === 'vi'
          ? (isRealSentenceVi ? rawExampleVi : `Tôi thấy một ${cleanMeaningStr} đẹp.`)
          : (currentLang === 'hi'
            ? (isRealSentenceHi ? rawExampleHi : `मैं एक अच्छा ${cleanMeaningStr} देखता हूँ।`)
            : (isRealSentenceKo ? rawExampleKo : `나는 멋진 ${cleanMeaningStr}을(를) 본다.`)))));


  const playWordAudio = useCallback((wordText) => {
    const text = (wordText || cleanWordStr || '').replace(/\.png/gi, '').trim();
    if (!text) return;
    playUniversalAudio(text, { rate: ttsSpeed, lang: 'en' });
  }, [cleanWordStr, ttsSpeed]);

  const playSentenceAudio = useCallback((sentenceText) => {
    const textToSpeak = sentenceText || displayExampleEn;
    if (!textToSpeak) return;
    playUniversalAudio(textToSpeak, { rate: ttsSpeed, lang: 'en' });
  }, [displayExampleEn, ttsSpeed]);

  useEffect(() => {
    if (isLoggedIn && mainTab === 'flashcard' && currentWord) {
      const timer = setTimeout(() => {
        playWordAudio(cleanWordStr);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, mainTab, currentIndex, currentWord, playWordAudio, cleanWordStr]);

  // 📚 단어 학습 실시간 Supabase DB & LocalStorage 영구 기록 함수
  const saveSingleLearnedWord = useCallback(async (wordObj) => {
    if (!currentUser || !wordObj) return;
    const wordStr = typeof wordObj === 'string' ? wordObj.replace(/\.png/gi, '').trim() : (wordObj.word || '').replace(/\.png/gi, '').trim();
    const meaningStr = typeof wordObj === 'object' ? (wordObj.meaning || '') : '';
    if (!wordStr) return;

    const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
    const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    try {
      const payload = [{ student_id: studentIdToUse, word: wordStr, meaning: meaningStr, learned_at: new Date().toISOString() }];
      if (studentNameClean && studentNameClean !== studentIdToUse) {
        payload.push({ student_id: studentNameClean, word: wordStr, meaning: meaningStr, learned_at: new Date().toISOString() });
      }
      await supabase.from('student_learned_words').insert(payload);
    } catch (e) {}

    // localStorage 동기화
    try {
      const localKey = `learned_words_${currentUser.id}`;
      const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (!existingLocal.some(item => (typeof item === 'string' ? item : item.word) === wordStr)) {
        existingLocal.push({ word: wordStr, meaning: meaningStr, learned_at: new Date().toISOString() });
        localStorage.setItem(localKey, JSON.stringify(existingLocal));
      }
    } catch (e) {}
  }, [currentUser]);

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('.audio-btn') || e.target.closest('.record-btn')) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setRecordedAudioUrl(null);
    const newIdx = currentIndex > 0 ? currentIndex - 1 : safeActiveWords.length - 1;
    setCurrentIndex(newIdx);
    saveStudyProgress({ currentIndex: newIdx });
  };

  const handleNext = () => {
    setIsFlipped(false);
    setRecordedAudioUrl(null);

    // 📚 방금 본 단어 DB에 실시간 외운 단어로 저장
    if (currentWord) {
      saveSingleLearnedWord(currentWord);
    }

    if (currentIndex + 1 >= safeActiveWords.length) {
      // 모든 세트 단어 일괄 저장
      safeActiveWords.forEach(w => saveSingleLearnedWord(w));
      alert(currentLang === 'zh'
        ? '🎉 这一组单词已全部学完！即将自动进入第 1 阶听力选词测验！'
        : (currentLang === 'fr'
        ? '🎉 Vous avez vu tous les mots de cette série ! Passage au quiz audio !'
        : '🎉 선택한 세트 단어를 모두 보았습니다! 1단계 소리 퀴즈로 자동 이동합니다!'));
      setMainTab('quiz');
      setInitialQuizLevel(1);
      setCurrentIndex(0);
      saveStudyProgress({ mainTab: 'quiz', initialQuizLevel: 1, currentIndex: 0 });
    } else {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      saveStudyProgress({ currentIndex: newIdx });
    }
  };

  const drawAudioVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = (timestamp) => {
      if (!analyserRef.current || !canvasRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let k = 0; k < dataArray.length; k++) sum += dataArray[k];
      const avg = sum / Math.max(1, dataArray.length);
      const isSpeaking = avg > 3.5;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 28;
      const barWidth = canvas.width / barCount;
      const now = (timestamp || Date.now()) * 0.004;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const rawVal = dataArray[dataIndex] || 0;

        let barHeight;
        if (isSpeaking && rawVal > 3) {
          const voiceIntensity = Math.min(1, Math.max(0.12, (rawVal / 130) * 1.7));
          barHeight = Math.max(5, voiceIntensity * canvas.height * 0.94);
          const hue = 170 + (i * 2.5) + (voiceIntensity * 30);
          ctx.fillStyle = `hsl(${hue}, 95%, ${45 + voiceIntensity * 15}%)`;
        } else {
          const gentlePulse = Math.sin(now * 2.0 + i * 0.2) * 0.5 + 0.5;
          barHeight = 3.5 + gentlePulse * 1.5;
          ctx.fillStyle = 'rgba(0, 168, 191, 0.35)';
        }

        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;
        const w = Math.max(2.5, barWidth - 2.5);

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, barHeight, 3);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, w, barHeight);
        }
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, []);

  // 🤖 AI 발음 교정 가이드 팁 분석 엔진 (6개 국어 다국어 지원)
  const getAIPronunciationGuideTip = (targetWordStr, score, lang = 'ko') => {
    if (!targetWordStr) return null;
    const cleanWord = targetWordStr.toLowerCase().trim();

    if (score !== null && score !== undefined) {
      if (score >= 85) {
        return {
          icon: '🎉',
          title: lang === 'zh' ? '🤖 AI 发音完美赞赏！' : (lang === 'fr' ? '🤖 Félicitations IA !' : (lang === 'ja' ? '🤖 AI 発音パーフェクト称賛！' : (lang === 'vi' ? '🤖 AI Khen ngợi phát âm hoàn hảo!' : (lang === 'hi' ? '🤖 AI उत्कृष्ट उच्चारण प्रशंसा!' : '🤖 AI 발음 완벽 칭찬!')))),
          text: lang === 'zh'
            ? `[${targetWordStr}] 母语级完美的舌位与唇形！语调与发音极其自然标准。👏`
            : (lang === 'fr'
            ? `[${targetWordStr}] Position de la langue et des lèvres digne d'un locuteur natif ! 👏`
            : (lang === 'ja'
            ? `[${targetWordStr}] ネイティブレベルの完璧な舌の位置と口の形です！👏`
            : (lang === 'vi'
            ? `[${targetWordStr}] Vị trí lưỡi và khẩu hình miệng chuẩn như người bản xứ! 👏`
            : (lang === 'hi'
            ? `[${targetWordStr}] मूल वक्ता स्तर की सही जीभ स्थिति और मुंह का आकार! 👏`
            : `[${targetWordStr}] 원어민 수준의 완벽한 혀 위치와 입모양입니다! 억양과 발음이 아주 부드럽고 훌륭합니다. 👏`)))),
          color: '#27AE60',
          bg: '#E8F8F5',
          border: '#A3E4D7'
        };
      }
      if (score >= 65) {
        return {
          icon: '👍',
          title: lang === 'zh' ? '🤖 AI 发音合格赞赏！' : (lang === 'fr' ? '🤖 Bravo, validé !' : (lang === 'ja' ? '🤖 AI 合格称賛！' : (lang === 'vi' ? '🤖 AI Khen ngợi đạt chuẩn!' : (lang === 'hi' ? '🤖 AI सफल उच्चारण प्रशंसा!' : '🤖 AI 발음 통과 칭찬!')))),
          text: lang === 'zh'
            ? `[${targetWordStr}] 恭喜达到65分以上合格标准！发音清晰响亮，继续保持！🌟`
            : (lang === 'fr'
            ? `[${targetWordStr}] Félicitations pour avoir dépassé 65 points ! Prononciation claire et nette ! 🌟`
            : (lang === 'ja'
            ? `[${targetWordStr}] 65点以上の合格基準達成おめでとうございます！発音も明瞭で素晴らしいです！🌟`
            : (lang === 'vi'
            ? `[${targetWordStr}] Chúc mừng đạt trên 65 điểm! Phát âm rõ ràng và tự tin! 🌟`
            : (lang === 'hi'
            ? `[${targetWordStr}] 65 से अधिक अंक प्राप्त करने पर बधाई! स्पष्ट और अच्छा उच्चारण! 🌟`
            : `[${targetWordStr}] 65점 이상 합격 기준을 멋지게 달성했어요! 자신감 있는 또박또박한 발음이 아주 훌륭합니다. 🌟`)))),
          color: '#2ECC71',
          bg: '#E5F8D0',
          border: '#46A302'
        };
      }
    }

    // 음소별 (R/L, TH, V/F, SH/CH) 맞춤 혀위치 & 입모양 피드백
    if (cleanWord.includes('r')) {
      return {
        icon: '👅',
        title: lang === 'zh' ? '🤖 AI 舌位纠正贴士 [R 发音]' : (lang === 'fr' ? '🤖 Conseil IA langue [Son R]' : (lang === 'ja' ? '🤖 AI 舌の位置アドバイス [R 発音]' : (lang === 'vi' ? '🤖 Mẹo vị trí lưỡi AI [Âm R]' : (lang === 'hi' ? '🤖 AI जीभ स्थिति सुझाव [R]' : '🤖 AI 혀 위치 교정 팁 [R 발음]')))),
        text: lang === 'zh'
          ? '发 R 音时舌尖切勿触碰上颚，舌头向口腔内轻微卷起，发出圆润卷舌音！'
          : (lang === 'fr'
          ? 'Pour le son R, ne touchez pas le palais avec la langue, reculez-la légèrement !'
          : (lang === 'ja'
          ? 'Rの発音時、舌先を口蓋につけず、奥に少し丸めて「ウー」と響かせましょう！'
          : (lang === 'vi'
          ? 'Khi phát âm R, không chạm đầu lưỡi vào vòm miệng mà uốn nhẹ vào trong!'
          : (lang === 'hi'
          ? 'R बोलते समय जीभ की नोक को तालू से न छुएं, बल्कि मुंह के अंदर हल्का मोड़ें!'
          : 'R 발음 시 혀끝을 입천장에 대지 않고 입 안쪽으로 살짝 구부려 \'우-\' 소리를 굴려보세요!')))),
        color: '#D35400',
        bg: '#FEF9E7',
        border: '#F9E79F'
      };
    }

    if (cleanWord.includes('l')) {
      return {
        icon: '👅',
        title: lang === 'zh' ? '🤖 AI 舌位纠正贴士 [L 发音]' : (lang === 'fr' ? '🤖 Conseil IA langue [Son L]' : (lang === 'ja' ? '🤖 AI 舌の位置アドバイス [L 発音]' : (lang === 'vi' ? '🤖 Mẹo vị trí lưỡi AI [Âm L]' : (lang === 'hi' ? '🤖 AI जीभ स्थिति सुझाव [L]' : '🤖 AI 혀 위치 교정 팁 [L 발음]')))),
        text: lang === 'zh'
          ? '发 L 音时，将舌尖顶住上门牙正后方的齿龈，发出清脆“el-”音并利落地弹开！'
          : (lang === 'fr'
          ? 'Pour le son L, appuyez la pointe de la langue derrière les dents du haut puis relâchez !'
          : (lang === 'ja'
          ? 'Lの発音時、舌先を上の前歯の裏側にしっかりつけてからパッと離しましょう！'
          : (lang === 'vi'
          ? 'Khi phát âm L, hãy đặt đầu lưỡi chạm vào chân răng hàm trên rồi bật nhẹ ra!'
          : (lang === 'hi'
          ? 'L बोलते समय जीभ की नोक को ऊपरी दांतों के पीछे तालू पर दबाएं और अलग करें!'
          : 'L 발음 시 혀끝을 윗니 바로 뒤 입천장에 꾹 대었다가 \'얼-\' 소리를 내며 상큼하게 떼어보세요!')))),
        color: '#2980B9',
        bg: '#EBF5FB',
        border: '#AED6F1'
      };
    }

    if (cleanWord.includes('th')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇齿纠正贴士 [TH 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son TH]' : (lang === 'ja' ? '🤖 AI 口の形アドバイス [TH 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình AI [Âm TH]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा सुझाव [TH]' : '🤖 AI 입모양 교정 팁 [TH 발음]')))),
        text: lang === 'zh'
          ? '将舌尖轻咬在上下门牙之间，呼气摩擦发出清脆的气流音！'
          : (lang === 'fr'
          ? 'Placez le bout de la langue entre les dents du haut et du bas et soufflez !'
          : (lang === 'ja'
          ? '舌先を上下の前歯で軽く挟み、空気を吹き出しながら摩擦音を出しましょう！'
          : (lang === 'vi'
          ? 'Đặt đầu lưỡi nhẹ nhàng giữa hai hàm răng và đẩy luồng hơi ra ngoài!'
          : (lang === 'hi'
          ? 'जीभ की नोक को ऊपरी और निचले दांतों के बीच थोड़ा दबाएं और हवा बाहर निकालें!'
          : '혀끝을 윗니와 아랫니 사이에 살짝 물었다가 바람을 뿜어내며 소리를 내보세요!')))),
        color: '#8E44AD',
        bg: '#F5EEF8',
        border: '#D7BDE2'
      };
    }

    if (cleanWord.includes('v') || cleanWord.includes('f')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇齿纠正贴士 [V / F 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son V / F]' : (lang === 'ja' ? '🤖 AI 口の形アドバイス [V / F 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình AI [Âm V / F]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा सुझाव [V / F]' : '🤖 AI 입모양 교정 팁 [V / F 발음]')))),
        text: lang === 'zh'
          ? '用上门牙轻轻咬住下嘴唇内侧，缓缓送出摩擦气流！'
          : (lang === 'fr'
          ? 'Posez les dents supérieures sur la lèvre inférieure et soufflez doucement !'
          : (lang === 'ja'
          ? '上の前歯で下唇を軽く押さえ、すき間から息をこするように音を出しましょう！'
          : (lang === 'vi'
          ? 'Dùng răng cửa trên chạm nhẹ vào môi dưới và thổi luồng hơi ra!'
          : (lang === 'hi'
          ? 'ऊपरी दांतों से निचले होंठ को हल्का दबाएं और हवा को बाहर निकालें!'
          : '윗니로 아랫입술을 가볍게 지그시 누르고 공기를 스치듯이 바람 소리를 불어내보세요!')))),
        color: '#C0392B',
        bg: '#FADBD8',
        border: '#F5B7B1'
      };
    }

    if (cleanWord.includes('sh') || cleanWord.includes('ch')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇形纠正贴士 [SH / CH 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son SH / CH]' : (lang === 'ja' ? '🤖 AI 口の形アドバイス [SH / CH 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình AI [Âm SH / CH]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा सुझाव [SH / CH]' : '🤖 AI 입모양 교정 팁 [SH / CH 발음]')))),
        text: lang === 'zh'
          ? '双唇向前微微嘟起呈圆形，有力地推出气流！'
          : (lang === 'fr'
          ? 'Avancez les lèvres en rond et expulsez l\'air avec force !'
          : (lang === 'ja'
          ? '唇を前に丸く突き出し、息を勢いよく押し出して発音しましょう！'
          : (lang === 'vi'
          ? 'Chu môi tròn về phía trước và đẩy mạnh luồng khí ra ngoài!'
          : (lang === 'hi'
          ? 'होंठों को आगे गोल करें और हवा को ज़ोर से बाहर धकेलें!'
          : '입술을 앞으로 동그랗게 모으고 공기를 밀어내며 소리를 강하게 만들어보세요!')))),
        color: '#16A085',
        bg: '#E8F8F5',
        border: '#A3E4D7'
      };
    }

    return {
      icon: '💡',
      title: lang === 'zh' ? '🤖 AI 原声语调贴士' : (lang === 'fr' ? '🤖 Conseil IA intonation native' : (lang === 'ja' ? '🤖 AI ネイティブイントネーション' : (lang === 'vi' ? '🤖 Mẹo ngữ điệu bản xứ AI' : (lang === 'hi' ? '🤖 AI मूल वक्ता लय सुझाव' : '🤖 AI 원어민 억양 교정 팁')))),
      text: lang === 'zh'
        ? '可使用上方 🐢 0.7x 慢速播放试听，并注意提高带有重音（Accent）的音节！'
        : (lang === 'fr'
        ? 'Écoutez avec le bouton ralenti 🐢 0.7x ci-dessus et accentuez la syllabe tonique !'
        : (lang === 'ja'
        ? '上部の 🐢 0.7x スロー再生を聞きながら、アクセントが入る音節を強調して読んでみましょう！'
        : (lang === 'vi'
        ? 'Nghe ở tốc độ chậm 🐢 0.7x và nhấn mạnh vào âm tiết có trọng âm (Accent)!'
        : (lang === 'hi'
        ? 'ऊपर दिए गए 🐢 0.7x धीमी गति से सुनें और बलाघात (Accent) वाले शब्दांश पर जोर दें!'
        : '상단의 🐢 0.7x 슬로우 배속으로 원어민 발음을 들으면서 강세(Accent)가 들어가는 음절을 높여 읽어보세요!')))),
      color: '#2980B9',
      bg: '#EBF5FB',
      border: '#AED6F1'
    };
  };

  const startRecording = async () => {
    try {
      setPronunciationScore(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      const currentActiveWord = safeActiveWords[currentIndex];
      const targetWordStr = currentActiveWord ? (typeof currentActiveWord === 'string' ? currentActiveWord : currentActiveWord.word) : '';
      let recognizedSpokenText = '';

      // Web Speech API 브라우저 음성 인식 지원 시 실행
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          if (event.results && event.results[0] && event.results[0][0]) {
            recognizedSpokenText = event.results[0][0].transcript || '';
          }
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // 🎯 발음 일치율 % 계산
        const finalScore = calculateMatchScore(targetWordStr, recognizedSpokenText);
        setPronunciationScore(finalScore);

        if (currentUser) {
          setHasRecorded(true);
          const dateForMission = targetStudyDate || todayStr;
          localStorage.setItem(`record_mission_${currentUser.id}_${dateForMission}`, 'true');
          saveStudyProgress({ hasRecorded: true });

          if (targetWordStr) {
            setUserAudioRecordings(prev => ({ ...prev, [targetWordStr]: url }));
          }


          const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
          const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();
          const cleanWord = targetWordStr ? targetWordStr.replace(/[^a-zA-Z0-9]/g, '') : 'word';
          const fileName = `${studentIdToUse}/${cleanWord}_${Date.now()}.webm`;

          let savedAudioUrl = `recorded_score_${finalScore}pct`;

          // 1. Supabase Storage (audio-recordings 버킷)에 오디오 바이너리 파일 영구 업로드 시도
          try {
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from('audio-recordings')
              .upload(fileName, audioBlob, { contentType: 'audio/webm', upsert: true });

            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabase.storage.from('audio-recordings').getPublicUrl(fileName);
              if (publicUrlData && publicUrlData.publicUrl) {
                savedAudioUrl = publicUrlData.publicUrl;
              }
            }
          } catch (stgErr) {
            console.log('Supabase storage upload fallback', stgErr);
          }

          // 2. Supabase DB audio_records 보관함에 영구 오디오 URL 및 발음 점수 실시간 기록
          try {
            await supabase.from('audio_records').insert([
              { student_id: studentIdToUse, word: targetWordStr || 'Word', audio_url: savedAudioUrl },
              { student_id: studentNameClean, word: targetWordStr || 'Word', audio_url: savedAudioUrl }
            ]);
            console.log('🎙️ 오디오 파일 클라우드 저장 완료:', savedAudioUrl);
          } catch (e) {
            console.log('Cloud audio record save fallback', e);
          }

          // 💾 3. 음성 파일 클라우드 연동 (자동 다운로드는 잠금 설정)
          /* 
          try {
            const autoFileName = `${studentIdToUse}_${cleanWord}_${targetStudyDate || todayStr}.webm`;
            const autoLink = document.createElement('a');
            autoLink.href = url;
            autoLink.download = autoFileName;
            document.body.appendChild(autoLink);
            autoLink.click();
            document.body.removeChild(autoLink);
          } catch (dlErr) {}
          */
        }
      };



      mediaRecorderRef.current.start();
      setIsRecording(true);

      drawAudioVisualizer();
    } catch (err) {
      alert(currentLang === 'zh' ? '请允许浏览器使用麦克风权限。' : '마이크 접근 권한이 필요합니다.');
    }
  };


  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audio.play();
    }
  };

  // 💾 내 컴퓨터 다운로드 폴더에 음성 파일(.webm) 안전 저장
  const downloadRecordedAudio = () => {
    if (!recordedAudioUrl) {
      alert(currentLang === 'zh' ? '没有可保存的录音文件，请先进行发音录音！' : '저장할 녹음 파일이 없습니다. 먼저 녹음을 진행해 주세요!');
      return;
    }
    const studentIdToUse = currentUser ? (currentUser.student_id || currentUser.id || 'guest') : 'guest';
    const cleanWord = currentWord ? (currentWord.word || 'word').replace(/[^a-zA-Z0-9]/g, '') : 'Word';
    const dateStr = targetStudyDate || todayStr;
    const fileName = `${studentIdToUse}_${cleanWord}_${dateStr}.webm`;

    const a = document.createElement('a');
    a.href = recordedAudioUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    alert(currentLang === 'zh'
      ? `💾 [${fileName}] 发音录音文件已成功下载到电脑下载文件夹！📁`
      : `💾 [${fileName}] 음성 녹음 파일이 내 컴퓨터 다운로드 폴더에 안전하게 저장되었습니다! 📁`);
  };


  // 💮 클라우드 DB & localStorage 출석 도장 찍기 (선택된 날짜 targetStudyDate 에 찍기!)
  const handleStampAttendance = useCallback(async () => {
    if (!currentUser) return;
    const stampDateKey = targetStudyDate || todayStr;
    const stampKey = `english_stamps_${currentUser.id}`;
    const stampedWordsKey = `stamped_words_${currentUser.id}_${stampDateKey}`;
    const stampedWordsCodeKey = currentUser.student_id ? `stamped_words_${currentUser.student_id}_${stampDateKey}` : null;
    
    // 🎯 1. 실제 화면에서 공부한 단어(safeActiveWords)를 1순위로 확정 정제
    const currentStudiedWords = (safeActiveWords && safeActiveWords.length > 0) ? safeActiveWords : (dailyRandomWords || []);
    const wordMap = new Map();
    currentStudiedWords.forEach(w => {
      const key = (typeof w === 'string' ? w : (w.word || '')).toLowerCase();
      if (key) wordMap.set(key, w);
    });
    (todayAllLearnedWords || []).forEach(w => {
      const key = (typeof w === 'string' ? w : (w.word || '')).toLowerCase();
      if (key && !wordMap.has(key)) wordMap.set(key, w);
    });
    const wordsToSave = Array.from(wordMap.values());
    
    const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
    const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    // 2. Supabase 클라우드 DB student_learned_words 및 study_records 보관함에 100% 즉시 정밀 전송
    try {
      const learnedPayload = [];
      wordsToSave.forEach(w => {
        const wordVal = typeof w === 'string' ? w : (w.word || '');
        const meaningVal = typeof w === 'string' ? '' : (w.meaning || '');
        if (wordVal) {
          learnedPayload.push({
            student_id: studentIdToUse,
            word: wordVal,
            meaning: meaningVal,
            learned_at: new Date().toISOString()
          });
          if (studentNameClean && studentNameClean !== studentIdToUse) {
            learnedPayload.push({
              student_id: studentNameClean,
              word: wordVal,
              meaning: meaningVal,
              learned_at: new Date().toISOString()
            });
          }
        }
      });

      if (learnedPayload.length > 0) {
        await supabase.from('student_learned_words').insert(learnedPayload);
      }

      // 출석 테이블(study_records)에 안전하게 단일 날짜 도장 저장
      const syncStudyRecord = async (sid) => {
        if (!sid) return;
        const { data: existing } = await supabase.from('study_records').select('id').eq('student_id', sid).eq('study_date', stampDateKey).limit(1);
        if (existing && existing.length > 0) {
          await supabase.from('study_records').update({ is_stamped: true }).eq('id', existing[0].id);
        } else {
          await supabase.from('study_records').insert([{ student_id: sid, study_date: stampDateKey, is_stamped: true }]);
        }
      };

      await syncStudyRecord(studentIdToUse);
      if (studentNameClean && studentNameClean !== studentIdToUse) {
        await syncStudyRecord(studentNameClean);
      }

      console.log('✅ DB 학습 데이터 및 출석 도장 전송 완벽 성공!');
    } catch (e) {
      console.error('Cloud attendance and learned words save error:', e);
    }

    // 3. localStorage 백업 저장 & 실시간 갱신 이벤트 발행
    let stamps = [];
    try {
      stamps = JSON.parse(localStorage.getItem(stampKey) || '[]');
    } catch (e) {
      stamps = [];
    }
    if (!stamps.includes(stampDateKey)) {
      stamps.push(stampDateKey);
      localStorage.setItem(stampKey, JSON.stringify(stamps));
      if (currentUser.student_id) {
        localStorage.setItem(`english_stamps_${currentUser.student_id}`, JSON.stringify(stamps));
      }
    }

    localStorage.setItem(stampedWordsKey, JSON.stringify(wordsToSave));
    if (stampedWordsCodeKey) {
      localStorage.setItem(stampedWordsCodeKey, JSON.stringify(wordsToSave));
    }
    localStorage.setItem(`today_all_learned_${currentUser.id}_${stampDateKey}`, JSON.stringify(wordsToSave));
    if (currentUser.student_id) {
      localStorage.setItem(`today_all_learned_${currentUser.student_id}_${stampDateKey}`, JSON.stringify(wordsToSave));
    }

    setTodayAllLearnedWords(wordsToSave);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('study_data_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  }, [currentUser, targetStudyDate, todayStr, todayAllLearnedWords, safeActiveWords, dailyRandomWords]);

  // 💡 2단계 퀴즈 완수 시 출석 도장 찍기 수행!
  const handleQuizLevelComplete = (level) => {
    if (!currentUser) return;
    const dateForMission = targetStudyDate || todayStr;
    const updated = [...new Set([...completedQuizLevels, level])];
    setCompletedQuizLevels(updated);
    localStorage.setItem(`quiz_mission_${currentUser.id}_${dateForMission}`, JSON.stringify(updated));
    saveStudyProgress({ completedQuizLevels: updated });

    if (level === 2) {
      handleStampAttendance();
      saveStudyProgress({ completedQuizLevels: updated, mainTab: 'calendar' });
      setTimeout(() => {
        alert(currentLang === 'zh'
          ? `🎉 恭喜！您已完成第2关测验，[${dateForMission}] 签到印章已成功盖上！💮\n(今日共完成 ${todayAllLearnedWords.length || safeActiveWords.length} 个单词学习！)\n\n请在出勤日历中查看印章！`
          : currentLang === 'fr'
          ? `🎉 Félicitations ! Vous avez validé le quiz niveau 2. Tampon validé pour le [${dateForMission}] ! 💮\n(Total ${todayAllLearnedWords.length || safeActiveWords.length} mots appris aujourd'hui !)\n\nConsultez votre calendrier de présence !`
          : `🎉 축하합니다! 2단계 퀴즈까지 완수하여 [${dateForMission}] 출석 도장이 성공적으로 찍혔습니다! 💮\n(오늘 총 ${todayAllLearnedWords.length || safeActiveWords.length}개 단어 학습 완료!)\n\n출석 달력 탭에서 도장을 확인해보세요!`);
        setMainTab('calendar');
      }, 300);
    }
  };

  const isQuizL2Done = completedQuizLevels.includes(2);

  const getWordImgSrc = (wordObj) => {
    if (!wordObj) return '/word_img/apple.png';
    const rawFile = (wordObj.image_url || wordObj.imageUrl || '').split('/').pop().trim();
    if (rawFile && rawFile.endsWith('.png')) {
      const cleanRaw = rawFile.toLowerCase().replace(/\s+/g, '_');
      return `/word_img/${cleanRaw}`;
    }
    const wordClean = (wordObj.word || '').replace(/\.png/gi, '').trim();
    if (!wordClean) return '/word_img/apple.png';
    const wordLower = wordClean.toLowerCase().replace(/\s+/g, '_');
    
    // 로컬 Next.js 고화질 소문자 언더바 이미지 1순위 즉시 로드
    return `/word_img/${wordLower}.png`;
  };

  const handleImageError = (e, wordStr) => {
    const target = e.target;
    const currentSrc = target.src || '';
    const wordClean = (wordStr || '').replace(/\.png/gi, '').trim();
    const wordLower = wordClean.toLowerCase();
    const wordUnder = wordLower.replace(/ /g, '_');
    const wordNoSpace = wordLower.replace(/[\s\-_]/g, '');
    const wordCap = wordClean ? wordClean.charAt(0).toUpperCase() + wordClean.slice(1) : '';

    // 1차 폴백: 언더바 파일명 시도 (/word_img/ice_cream.png)
    if (!currentSrc.includes(`/${wordUnder}.png`)) {
      target.src = `/word_img/${wordUnder}.png`;
    }
    // 2차 폴백: 공백 제거 파일명 시도 (/word_img/icecream.png)
    else if (!currentSrc.includes(`/${wordNoSpace}.png`)) {
      target.src = `/word_img/${wordNoSpace}.png`;
    }
    // 3차 폴백: 첫글자 대문자 파일명 시도 (/word_img/Apple.png)
    else if (!currentSrc.includes(`/${wordCap}.png`)) {
      target.src = `/word_img/${wordCap}.png`;
    } 
    // 4차 폴백: Supabase Cloud Storage 원본 이미지 시도
    else if (!currentSrc.includes('supabase.co')) {
      target.src = `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${wordLower}.png`;
    } 
    // 5차 폴백: 단어 이니셜 맞춤형 SVG 일러스트 카드
    else {
      const firstLetter = wordCap ? wordCap.charAt(0).toUpperCase() : '📖';
      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="%23F8F9FA" rx="16"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%233498DB">${encodeURIComponent(firstLetter)}</text><text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="%237F8C8D">${encodeURIComponent(wordClean || 'Word')}</text></svg>`;
      target.onerror = null;
    }
  };

  if (!isLoggedIn || !currentUser) {
    return (
      <StudentLoginPage
        onLoginSuccess={handleLoginSuccess}
        onParentLoginSuccess={handleParentLoginSuccess}
        currentLang={currentLang}
        onLangChange={handleLangChange}
      />
    );
  }

  return (
    <main className="app-container">
      {/* 👤 현재 로그인된 학생 정보 및 계정 관리 헤더 바 */}
      <UserManager
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onLogout={handleLogout}
        currentLang={currentLang}
      />

      {mainTab !== 'parent' && (
        <div className="action-buttons-toolbar">
          {/* 1. 날짜 및 학습 진행 상태 배지 */}
          <div
            className="action-btn-item"
            style={{
              border: '1.5px solid #FADBD8',
              background: '#FEF5E7',
              color: '#D35400'
            }}
          >
            📅 [{targetStudyDate}] {currentLang === 'zh' ? '学习中' : (currentLang === 'fr' ? 'En cours' : (currentLang === 'ja' ? '学習中' : (currentLang === 'vi' ? 'Đang học' : (currentLang === 'hi' ? 'अध्ययन' : '학습 진행'))))}
          </div>

          {/* 2. 오늘 누적 학습 단어 모달 버튼 */}
          <button
            className="action-btn-item"
            onClick={() => setShowTodayAllModal(true)}
            style={{
              border: 'none',
              background: '#27AE60',
              color: 'white',
              boxShadow: '0 2px 6px rgba(39,174,96,0.2)'
            }}
            title="오늘 1회차+2회차 등 지금까지 공부한 모든 단어 리스트 한눈에 보기"
          >
            📖 {t('today_all_learned_btn', currentLang)} ({todayAllLearnedWords.length || safeActiveWords.length}{t('words_count_unit', currentLang)})
          </button>

          {/* 3. 1차 녹음 미션 바로가기 버튼 */}
          <button
            className="action-btn-item"
            onClick={() => {
              setMainTab('flashcard');
              setTimeout(() => {
                const recElement = document.getElementById('record-mission-section');
                if (recElement) recElement.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{
              border: hasRecorded ? '2px solid #2ECC71' : '1.5px solid #3498DB',
              background: hasRecorded ? '#E8F8F5' : '#EBF5FB',
              color: hasRecorded ? '#27AE60' : '#2980B9',
              boxShadow: '0 2px 6px rgba(52,152,219,0.15)'
            }}
          >
            {hasRecorded
              ? (currentLang === 'zh' ? '✅ 录音完成 🎙️' : (currentLang === 'fr' ? '✅ Enreg. fait 🎙️' : (currentLang === 'ja' ? '✅ 録音完了 🎙️' : (currentLang === 'vi' ? '✅ Đã ghi âm 🎙️' : (currentLang === 'hi' ? '✅ रिकॉर्डिंग पूर्ण 🎙️' : '✅ 1차 녹음 완료 🎙️')))))
              : (currentLang === 'zh' ? '🎙️ 1次录音 ➔' : (currentLang === 'fr' ? '🎙️ Enregistrement ➔' : (currentLang === 'ja' ? '🎙️ 1次録音 ➔' : (currentLang === 'vi' ? '🎙️ Ghi âm ➔' : (currentLang === 'hi' ? '🎙️ रिकॉर्डिंग ➔' : '🎙️ 1차 녹음 ➔')))))}
          </button>

          {/* 4. 2단계 스펠링 퀴즈 바로가기 버튼 */}
          <button
            className="action-btn-item"
            onClick={() => setMainTab('quiz')}
            style={{
              border: isQuizL2Done ? '2px solid #2ECC71' : '1.5px solid #9B59B6',
              background: isQuizL2Done ? '#E8F8F5' : '#F5EEF8',
              color: isQuizL2Done ? '#27AE60' : '#8E44AD',
              boxShadow: '0 2px 6px rgba(155,89,182,0.15)'
            }}
          >
            {isQuizL2Done
              ? (currentLang === 'zh' ? '✅ 测验过关 💮' : (currentLang === 'fr' ? '✅ Quiz validé 💮' : (currentLang === 'ja' ? '✅ クイズ合格 💮' : (currentLang === 'vi' ? '✅ Đã đạt 💮' : (currentLang === 'hi' ? '✅ क्विज सफल 💮' : '✅ 퀴즈 완수 💮')))))
              : (currentLang === 'zh' ? '🧩 2关拼写 ➔' : (currentLang === 'fr' ? '🧩 Quiz N2 ➔' : (currentLang === 'ja' ? '🧩 2段階クイズ ➔' : (currentLang === 'vi' ? '🧩 Cấp 2 ➔' : (currentLang === 'hi' ? '🧩 क्विज 2 ➔' : '🧩 2단계 퀴즈 ➔')))))}
          </button>

          {/* 5. 다음 단어 세트 로드 버튼 */}
          <button
            className="action-btn-item action-btn-item-full"
            onClick={handleLoadNextWordSet}
            style={{
              border: '2px solid #E67E22',
              background: 'linear-gradient(135deg, #FEF5E7 0%, #FDEBD0 100%)',
              color: '#D35400',
              fontWeight: '900',
              boxShadow: '0 2px 6px rgba(230,126,34,0.2)'
            }}
          >
            🚀 {currentLang === 'zh' ? '下一组单词 ➔' : (currentLang === 'fr' ? 'Mots suivants ➔' : (currentLang === 'ja' ? '次の単語 ➔' : (currentLang === 'vi' ? 'Từ tiếp theo ➔' : (currentLang === 'hi' ? 'अगला शब्द ➔' : '다음 단어 학습 ➔'))))}
          </button>
        </div>
      )}
      {/* 📖 오늘 공부한 전체 단어 팝업 모달 */}
      {showTodayAllModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2200 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '460px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <div>
                <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                  📖 [{targetStudyDate}] {t('today_all_modal_title', currentLang)}
                </h3>
                <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                  🔥 {currentLang === 'zh' ? `共 ${todayAllLearnedWords.length || safeActiveWords.length} 个单词在学中！` : (currentLang === 'fr' ? `Total ${todayAllLearnedWords.length || safeActiveWords.length} mots en cours !` : (currentLang === 'ja' ? `合計 ${todayAllLearnedWords.length || safeActiveWords.length} 個の単語を学習中！` : (currentLang === 'vi' ? `Tổng cộng ${todayAllLearnedWords.length || safeActiveWords.length} từ đang học!` : (currentLang === 'hi' ? `कुल ${todayAllLearnedWords.length || safeActiveWords.length} शब्द अध्ययन में!` : `총 ${todayAllLearnedWords.length || safeActiveWords.length}개 단어 수강 중!`))))}
                </span>
              </div>
              <button onClick={() => setShowTodayAllModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(todayAllLearnedWords.length > 0 ? todayAllLearnedWords : safeActiveWords).map((item, i) => {
                const wordStr = (item.word || item).replace(/\.png/gi, '').trim();
                const meaningDisplay = currentLang === 'fr'
                  ? (item.meaning_fr || item.meaningFr || item.meaning)
                  : (currentLang === 'zh'
                  ? (item.meaning_zh || item.meaningZh || item.meaning)
                  : (currentLang === 'ja'
                  ? (item.meaning_ja || item.meaningJa || item.meaning)
                  : (currentLang === 'vi'
                  ? (item.meaning_vi || item.meaningVi || item.meaning)
                  : (currentLang === 'hi'
                  ? (item.meaning_hi || item.meaningHi || item.meaning)
                  : item.meaning))));
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #E9ECEF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#2980B9', fontSize: '13px' }}>#{i + 1}</span>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#2C3E50', fontSize: '16px' }}>{wordStr}</span>
                        {item.phonics && <span style={{ fontSize: '12px', color: '#7F8C8D', marginLeft: '6px' }}>{item.phonics}</span>}
                        {meaningDisplay && <div style={{ color: '#E74C3C', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{meaningDisplay}</div>}
                      </div>
                    </div>
                    <button onClick={() => playWordAudio(wordStr)} style={{ background: '#3498DB', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px' }}>
                      🔊
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowTodayAllModal(false)}
              style={{ width: '100%', background: '#2C3E50', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
            >
              {t('btn_close', currentLang)}
            </button>
          </div>
        </div>
      )}

      {/* 🚀 [1번 미개발 기능 보완] 학습 단계별 진도 저장 & 이어서 학습 비주얼 스테퍼 바 (Duolingo 3D Style) */}
      {mainTab !== 'parent' && (() => {
        // 📊 5단계 종합 진도율(%) 계산
        let progressPct = Math.round(((currentIndex + 1) / Math.max(safeActiveWords.length, 1)) * 30);
        if (hasRecorded) progressPct += 20;
        if (completedQuizLevels.includes(1)) progressPct += 25;
        if (completedQuizLevels.includes(2)) progressPct = 100;

        return (
          <div style={{
            width: '100%',
            background: '#FFFFFF',
            border: '2px solid #E5E5E5',
            borderBottom: '5px solid #CECECE',
            borderRadius: '24px',
            padding: '16px 18px',
            marginTop: '8px',
            marginBottom: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            {/* 상단 텍스트 및 이어서 학습 안내 / 다시 학습 버튼 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#58CC02',
                  border: '1px solid #46A302',
                  borderBottom: '3px solid #46A302',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '900',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  whiteSpace: 'nowrap'
                }}>
                  ⚡ {t('progress_status_text', currentLang)}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#3C3C3C' }}>
                  {getResumeNoticeText(resumeNotice, currentLang, currentIndex, safeActiveWords.length)}
                </span>
              </div>

              <button
                onClick={handleRestartStudyProgress}
                style={{
                  background: '#FFFFFF',
                  color: '#FF4B4B',
                  border: '2px solid #FF4B4B',
                  borderBottom: '4px solid #EA2B2B',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
                title="현재 세트 단어를 1번 카드부터 다시 공부합니다"
              >
                🔄 {currentLang === 'zh' ? '从头重新学习' : (currentLang === 'fr' ? 'Recommencer du début' : '처음부터 다시 학습')}
              </button>
            </div>

            {/* 🟢 듀오링고 게이미피케이션 실시간 진도율 프로그레스 바 */}
            <div style={{ width: '100%', background: '#E5E5E5', borderRadius: '12px', height: '18px', position: 'relative', overflow: 'hidden', border: '1px solid #D6D6D6' }}>
              <div style={{
                width: `${Math.min(Math.max(progressPct, 5), 100)}%`,
                height: '100%',
                background: progressPct >= 100 ? 'linear-gradient(180deg, #FFC800 0%, #FF9600 100%)' : 'linear-gradient(180deg, #89E219 0%, #58CC02 100%)',
                borderRadius: '12px',
                transition: 'width 0.4s ease-in-out',
                boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.4)'
              }} />
              <span style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '900',
                color: progressPct > 50 ? '#FFFFFF' : '#4B4B4B',
                textShadow: progressPct > 50 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none'
              }}>
                🔥 {currentLang === 'zh'
                  ? `已完成今日目标的 ${progressPct}%！`
                  : (currentLang === 'fr'
                  ? `${progressPct}% de l'objectif atteint !`
                  : (currentLang === 'ja'
                  ? `今日の目標の ${progressPct}% 達成！`
                  : (currentLang === 'vi'
                  ? `Đã hoàn thành ${progressPct}% mục tiêu hôm nay!`
                  : (currentLang === 'hi'
                  ? `आज के लक्ष्य का ${progressPct}% पूरा हुआ!`
                  : `오늘 목표의 ${progressPct}% 완수!`))))}
              </span>
            </div>

            {/* 7단계 원클릭 3D 클릭가능 스테퍼 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', paddingTop: '4px', flexWrap: 'wrap' }}>
              {/* 1단계: 플래시카드 */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('flashcard');
                  saveStudyProgress({ mainTab: 'flashcard' });
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: mainTab === 'flashcard' ? '2px solid #1899D6' : '2px solid #E5E5E5',
                  borderBottom: mainTab === 'flashcard' ? '4px solid #1899D6' : '4px solid #CECECE',
                  background: mainTab === 'flashcard' ? '#1CB0F6' : '#FFFFFF',
                  color: mainTab === 'flashcard' ? 'white' : '#777777',
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_1_flashcard', currentLang)} ({currentIndex + 1}/{safeActiveWords.length})
              </button>

              <span style={{ color: '#CECECE', fontSize: '9px', fontWeight: 'bold' }}>➔</span>

              {/* 2단계: 녹음 미션 */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('flashcard');
                  saveStudyProgress({ mainTab: 'flashcard' });
                  setTimeout(() => {
                    const el = document.getElementById('record-mission-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: hasRecorded ? '2px solid #46A302' : '2px solid #E5E5E5',
                  borderBottom: hasRecorded ? '4px solid #46A302' : '4px solid #CECECE',
                  background: hasRecorded ? '#E5F8D0' : '#FFFFFF',
                  color: hasRecorded ? '#46A302' : '#777777',
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_2_recording', currentLang)} {hasRecorded ? '✅' : '⏳'}
              </button>

              <span style={{ color: '#CECECE', fontSize: '9px', fontWeight: 'bold' }}>➔</span>

              {/* 3단계: 퀴즈 1단계 소리 */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('quiz');
                  setInitialQuizLevel(1);
                  saveStudyProgress({ mainTab: 'quiz', initialQuizLevel: 1 });
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: completedQuizLevels.includes(1) ? '2px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 1 ? '2px solid #1899D6' : '2px solid #E5E5E5'),
                  borderBottom: completedQuizLevels.includes(1) ? '4px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 1 ? '4px solid #1899D6' : '4px solid #CECECE'),
                  background: completedQuizLevels.includes(1) ? '#E5F8D0' : (mainTab === 'quiz' && initialQuizLevel === 1 ? '#1CB0F6' : '#FFFFFF'),
                  color: completedQuizLevels.includes(1) ? '#46A302' : (mainTab === 'quiz' && initialQuizLevel === 1 ? 'white' : '#777777'),
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_3_quiz1', currentLang)} {completedQuizLevels.includes(1) ? '✅' : '⏳'}
              </button>

              <span style={{ color: '#CECECE', fontSize: '9px', fontWeight: 'bold' }}>➔</span>

              {/* 4단계: 퀴즈 2단계 스펠링 선택 */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('quiz');
                  setInitialQuizLevel(2);
                  saveStudyProgress({ mainTab: 'quiz', initialQuizLevel: 2 });
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: completedQuizLevels.includes(2) ? '2px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 2 ? '2px solid #46A302' : '2px solid #E5E5E5'),
                  borderBottom: completedQuizLevels.includes(2) ? '4px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 2 ? '4px solid #46A302' : '4px solid #CECECE'),
                  background: completedQuizLevels.includes(2) ? '#E5F8D0' : (mainTab === 'quiz' && initialQuizLevel === 2 ? '#58CC02' : '#FFFFFF'),
                  color: completedQuizLevels.includes(2) ? '#46A302' : (mainTab === 'quiz' && initialQuizLevel === 2 ? 'white' : '#777777'),
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_4_quiz2', currentLang)} {completedQuizLevels.includes(2) ? '✅' : '⏳'}
              </button>

              <span style={{ color: '#CECECE', fontSize: '9px', fontWeight: 'bold' }}>➔</span>

              {/* 5단계: 퀴즈 3단계 발음 녹음 (75점+) */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('quiz');
                  setInitialQuizLevel(3);
                  saveStudyProgress({ mainTab: 'quiz', initialQuizLevel: 3 });
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: completedQuizLevels.includes(3) ? '2px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 3 ? '2px solid #D35400' : '2px solid #E5E5E5'),
                  borderBottom: completedQuizLevels.includes(3) ? '4px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 3 ? '4px solid #D35400' : '4px solid #CECECE'),
                  background: completedQuizLevels.includes(3) ? '#E5F8D0' : (mainTab === 'quiz' && initialQuizLevel === 3 ? '#FF9600' : '#FFFFFF'),
                  color: completedQuizLevels.includes(3) ? '#46A302' : (mainTab === 'quiz' && initialQuizLevel === 3 ? 'white' : '#777777'),
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_5_quiz3', currentLang)} {completedQuizLevels.includes(3) ? '✅' : '⏳'}
              </button>

              <span style={{ color: '#CECECE', fontSize: '9px', fontWeight: 'bold' }}>➔</span>

              {/* 6단계: 퀴즈 4단계 주관식 직접 쓰기 */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('quiz');
                  setInitialQuizLevel(4);
                  saveStudyProgress({ mainTab: 'quiz', initialQuizLevel: 4 });
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: completedQuizLevels.includes(4) ? '2px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 4 ? '2px solid #8E44AD' : '2px solid #E5E5E5'),
                  borderBottom: completedQuizLevels.includes(4) ? '4px solid #46A302' : (mainTab === 'quiz' && initialQuizLevel === 4 ? '4px solid #8E44AD' : '4px solid #CECECE'),
                  background: completedQuizLevels.includes(4) ? '#E5F8D0' : (mainTab === 'quiz' && initialQuizLevel === 4 ? '#CE82FF' : '#FFFFFF'),
                  color: completedQuizLevels.includes(4) ? '#46A302' : (mainTab === 'quiz' && initialQuizLevel === 4 ? 'white' : '#777777'),
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_6_quiz4', currentLang)} {completedQuizLevels.includes(4) ? '✅' : '⏳'}
              </button>

              <span style={{ color: '#CECECE', fontSize: '9px', fontWeight: 'bold' }}>➔</span>

              {/* 7단계: 출석 도장 */}
              <button
                type="button"
                onClick={() => {
                  setMainTab('calendar');
                  saveStudyProgress({ mainTab: 'calendar' });
                }}
                style={{
                  flex: 1,
                  minWidth: '70px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '12px',
                  border: completedQuizLevels.includes(2) ? '2px solid #46A302' : '2px solid #E5E5E5',
                  borderBottom: completedQuizLevels.includes(2) ? '4px solid #46A302' : '4px solid #CECECE',
                  background: completedQuizLevels.includes(2) ? '#58CC02' : '#FFFFFF',
                  color: completedQuizLevels.includes(2) ? 'white' : '#777777',
                  fontSize: '10px',
                  fontWeight: '900',
                  cursor: 'pointer'
                }}
              >
                {t('step_7_stamp', currentLang)} {completedQuizLevels.includes(2) ? t('done', currentLang) : t('waiting', currentLang)}
              </button>
            </div>
          </div>
        );
      })()}

      {/* 📂 카테고리 그룹형 스마트 2단 내비게이션 바 (전체 메뉴 100% 한눈에 보이기) */}
      <nav className="category-nav-wrapper">
        {/* 그룹 1: 📖 핵심 단어 학습 코스 */}
        <div className="category-nav-group">
          <span className="category-label" style={{ background: '#E8F8F5', color: '#27AE60', border: '1px solid #A3E4D7' }}>
            {t('nav_core_course', currentLang)}
          </span>
          <button
            className={`nav-pill-btn ${mainTab === 'flashcard' ? 'active' : ''}`}
            onClick={() => setMainTab('flashcard')}
          >
            {t('nav_flashcard', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'wordlist' ? 'active' : ''}`}
            onClick={() => setMainTab('wordlist')}
          >
            {t('nav_wordlist', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setMainTab('quiz')}
          >
            {t('nav_quiz', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'myvocab' ? 'active' : ''}`}
            onClick={() => setMainTab('myvocab')}
          >
            {t('nav_myvocab', currentLang)}
          </button>
        </div>

        {/* 그룹 2: 💥 오답 & 주간복습 & 학습통계 리포터 */}
        <div className="category-nav-group">
          <span className="category-label" style={{ background: '#F5EEF8', color: '#8E44AD', border: '1px solid #D7BDE2' }}>
            {t('nav_review_report', currentLang)}
          </span>
          <button
            className={`nav-pill-btn ${mainTab === 'wrongvocab' ? 'active' : ''}`}
            onClick={() => setMainTab('wrongvocab')}
            style={{ background: mainTab === 'wrongvocab' ? '#E74C3C' : '#FDEDEC', color: mainTab === 'wrongvocab' ? 'white' : '#C0392B', borderColor: '#F5B7B1' }}
          >
            {t('nav_wrongvocab', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'day6' ? 'active' : ''}`}
            onClick={() => setMainTab('day6')}
            style={{ background: mainTab === 'day6' ? '#6C5CE7' : '#F5EEF8', color: mainTab === 'day6' ? 'white' : '#8E44AD', borderColor: '#D7BDE2' }}
          >
            {t('nav_day6', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setMainTab('calendar')}
          >
            {t('nav_calendar', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'stats' ? 'active' : ''}`}
            onClick={() => setMainTab('stats')}
            style={{ background: mainTab === 'stats' ? '#4ECDC4' : '#E8F8F5', color: mainTab === 'stats' ? 'white' : '#16A085', borderColor: '#A3E4D7' }}
          >
            {t('nav_stats', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'parent' ? 'active' : ''}`}
            onClick={() => setMainTab('parent')}
            style={{ background: mainTab === 'parent' ? '#9B59B6' : '#F5EEF8', color: mainTab === 'parent' ? 'white' : '#8E44AD', borderColor: '#D7BDE2' }}
          >
            {t('nav_parent', currentLang)}
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setMainTab('leaderboard')}
            style={{ background: mainTab === 'leaderboard' ? '#D35400' : '#FEF5E7', color: mainTab === 'leaderboard' ? 'white' : '#D35400', borderColor: '#F5CBA7' }}
          >
            {t('nav_leaderboard', currentLang)}
          </button>
        </div>
      </nav>

      {/* 탭 1: 플래시카드 학습 코스 */}
      {mainTab === 'flashcard' && (
        <>
          <header className="app-header">
            <h1 className="app-title" style={{ margin: 0 }}>
              {t('app_title', currentLang)} {translateGradeLevel(currentUser?.studyGradeLevel || currentUser?.study_grade_level || '중등단어', currentLang)}
            </h1>
          </header>

          {/* 🌐 글로벌 학습 언어 선택 & 🎛️ TTS 음성 속도 조율 컨트롤러 */}
          <div className="lang-speed-toolbar">
            {/* 1행: 🌐 6개 국어 학습 언어 스위처 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#2B6CB0', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                🌐 {t('lang_label', currentLang)}
              </span>
              <button
                onClick={() => handleLangChange('ko')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: currentLang === 'ko' ? '2px solid #3182CE' : '1px solid #CBD5E0',
                  background: currentLang === 'ko' ? '#EBF8FF' : '#FFFFFF',
                  color: currentLang === 'ko' ? '#2B6CB0' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇰🇷 한국어
              </button>
              <button
                onClick={() => handleLangChange('zh')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: currentLang === 'zh' ? '2px solid #E53E3E' : '1px solid #CBD5E0',
                  background: currentLang === 'zh' ? '#FFF5F5' : '#FFFFFF',
                  color: currentLang === 'zh' ? '#C53030' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇨🇳 中文
              </button>
              <button
                onClick={() => handleLangChange('fr')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: currentLang === 'fr' ? '2px solid #3182CE' : '1px solid #CBD5E0',
                  background: currentLang === 'fr' ? '#EBF8FF' : '#FFFFFF',
                  color: currentLang === 'fr' ? '#2B6CB0' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇫🇷 Français
              </button>
              <button
                onClick={() => handleLangChange('ja')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: currentLang === 'ja' ? '2px solid #E53E3E' : '1px solid #CBD5E0',
                  background: currentLang === 'ja' ? '#FFF5F5' : '#FFFFFF',
                  color: currentLang === 'ja' ? '#C53030' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇯🇵 日本語
              </button>
              <button
                onClick={() => handleLangChange('vi')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: currentLang === 'vi' ? '2px solid #D69E2E' : '1px solid #CBD5E0',
                  background: currentLang === 'vi' ? '#FEFCBF' : '#FFFFFF',
                  color: currentLang === 'vi' ? '#B7791F' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇻🇳 Tiếng Việt
              </button>
              <button
                onClick={() => handleLangChange('hi')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  border: currentLang === 'hi' ? '2px solid #DD6B20' : '1px solid #CBD5E0',
                  background: currentLang === 'hi' ? '#FEEBC8' : '#FFFFFF',
                  color: currentLang === 'hi' ? '#C05621' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🇮🇳 हिन्दी
              </button>
            </div>

            {/* 2행: 🎛️ 발음 재생 속도 컨트롤러 (밑으로 깔끔하게 배치) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              width: '100%',
              paddingTop: '8px',
              borderTop: '1px dashed #E2E8F0'
            }}>
              <span style={{ fontSize: '13px', fontWeight: '900', color: '#4A5568', display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
                🎛️ {t('speed_label', currentLang)}
              </span>

              <button
                onClick={() => handleSpeedChange(0.7)}
                className={`btn-speed-item ${ttsSpeed === 0.7 ? 'active' : ''}`}
              >
                {t('speed_slow', currentLang)}
              </button>

              <button
                onClick={() => handleSpeedChange(1.0)}
                className={`btn-speed-item ${ttsSpeed === 1.0 ? 'active' : ''}`}
              >
                {t('speed_normal', currentLang)}
              </button>

              <button
                onClick={() => handleSpeedChange(1.4)}
                className={`btn-speed-item ${ttsSpeed === 1.4 ? 'active' : ''}`}
              >
                {t('speed_fast', currentLang)}
              </button>

              <button
                onClick={() => handleSpeedChange(2.0)}
                className={`btn-speed-item ${ttsSpeed === 2.0 ? 'active' : ''}`}
              >
                {t('speed_super_fast', currentLang)}
              </button>
            </div>
          </div>

          {(!currentWord || safeActiveWords.length === 0 || isWordsLoading) ? (
            <div className="flashcard-wrapper">
              <div className="flashcard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', background: '#FFFFFF', borderRadius: '32px', border: '3px solid #E2E8F0', boxShadow: '0 12px 30px rgba(0,0,0,0.06)', padding: '30px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '14px', animation: 'pulse 1.5s infinite' }}>📖</div>
                <h3 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '20px', fontWeight: 'bold' }}>
                  {currentUser?.name ? `${currentUser.name} 님의` : ''} {translateGradeLevel(currentUser?.studyGradeLevel || currentUser?.study_grade_level || '맞춤', currentLang)} 단어 로딩 중...
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#7F8C8D', fontSize: '14px' }}>
                  오늘 학습할 {userDailyCount}개 단어를 안전하게 불러오고 있습니다. 잠시만 기다려 주세요! ⚡
                </p>
                <div style={{
                  width: '36px',
                  height: '36px',
                  border: '4px solid #E2E8F0',
                  borderTop: '4px solid #4F46E5',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                  }
                `}</style>
              </div>
            </div>
          ) : (
          <div className="flashcard-wrapper">
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
              {/* 앞면: 그림 + 영단어 + 발음기호 + 번역 뜻 */}
              <div className="card-face card-front">
                <span className="card-category-badge">
                  {translateGradeLevel((typeof currentWord === 'object' && (currentWord?.grade_level || currentWord?.gradeLevel)) || currentUser?.studyGradeLevel || currentUser?.study_grade_level || '중등단어', currentLang)} • {(typeof currentWord === 'object' && currentWord?.category) || t('category_basic', currentLang)}
                </span>

                <div style={{ width: '130px', height: '130px', margin: '6px 0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getWordImgSrc(currentWord)}
                    alt={cleanWordStr}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', willChange: 'transform' }}
                    onError={(e) => handleImageError(e, cleanWordStr)}
                  />
                </div>

                <h2 className="word-en" style={{ margin: '4px 0 0 0', color: '#2C3E50' }}>{cleanWordStr}</h2>
                {cleanPhonicsStr && <p className="word-phonics" style={{ margin: '2px 0 0 0', color: '#3498DB' }}>{cleanPhonicsStr}</p>}
                <h3 className="word-ko" style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#FF6B6B' }}>{cleanMeaningStr}</h3>

                <div style={{ marginTop: '8px' }}>
                  <button className="audio-btn" onClick={(e) => { e.stopPropagation(); playWordAudio(cleanWordStr); }}>
                    {t('listen_word_audio', currentLang)}
                  </button>
                </div>

                <div className="flip-hint">{t('flip_to_example_hint', currentLang)}</div>
              </div>

              {/* 뒷면: 예문 문장 & 예문 음성 전용 재생기 */}
              <div className="card-face card-back">
                <span className="card-category-badge">
                  {translateGradeLevel(currentWord?.gradeLevel || currentWord?.grade_level || '초등단어', currentLang)} • {currentWord?.category || t('category_basic', currentLang)}
                </span>

                <div style={{ width: '110px', height: '110px', margin: '4px 0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getWordImgSrc(currentWord)}
                    alt={cleanWordStr}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', willChange: 'transform' }}
                    onError={(e) => handleImageError(e, cleanWordStr)}
                  />
                </div>

                <span style={{ fontSize: '12px', color: '#7F8C8D', marginTop: '6px', fontWeight: 'bold' }}>{t('recommended_example', currentLang)}</span>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#2C3E50', margin: '4px 0 0 0', padding: '0 10px', textAlign: 'center' }}>
                  {displayExampleEn}
                </h3>
                <p style={{ fontSize: '15px', fontWeight: 'bold', color: '#27AE60', margin: '4px 0 0 0' }}>
                  {displayExampleKo}
                </p>

                <div style={{ marginTop: '10px' }}>
                  <button
                    className="audio-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      playSentenceAudio(displayExampleEn);
                    }}
                    style={{ background: '#E8F8F5', border: '1px solid #2ECC71', color: '#27AE60' }}
                  >
                    {t('listen_example_audio', currentLang)}
                  </button>
                </div>

                <div className="flip-hint">{t('flip_to_word_hint', currentLang)}</div>
              </div>
            </div>

            <div className="card-nav-buttons">
              <button className="btn-nav" onClick={handlePrev}>{t('btn_prev', currentLang)}</button>
              <span className="card-counter">
                {currentIndex + 1} / {safeActiveWords.length}
              </span>
              <button className="btn-nav" onClick={handleNext}>
                {currentIndex + 1 === safeActiveWords.length ? (currentLang === 'zh' ? '进入第1关测验 ➔' : (currentLang === 'fr' ? 'Quiz Niveau 1 ➔' : (currentLang === 'ja' ? '第1段階クイズへ ➔' : (currentLang === 'vi' ? 'Đến trắc nghiệm Cấp 1 ➔' : (currentLang === 'hi' ? 'स्तर 1 क्विज पर जाएं ➔' : '1단계 퀴즈로 ➔'))))) : t('btn_next', currentLang)}
              </button>
            </div>

            <div id="record-mission-section" className="voice-recorder-card" style={{ marginTop: '16px', background: '#FFFFFF', borderRadius: '20px', padding: '16px', border: '1px solid #E9ECEF', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2C3E50' }}>
                🎙️ {currentLang === 'zh'
                  ? `录音与声调波形图 (${cleanWordStr})`
                  : (currentLang === 'fr'
                  ? `Mon enregistrement & Courbe vocale (${cleanWordStr})`
                  : (currentLang === 'ja'
                  ? `自分の録音＆音声ピッチ波形グラフ (${cleanWordStr})`
                  : (currentLang === 'vi'
                  ? `Ghi âm & Biểu đồ cao độ giọng nói (${cleanWordStr})`
                  : (currentLang === 'hi'
                  ? `मेरी रिकॉर्डिंग और पिच ग्राफ (${cleanWordStr})`
                  : `내 발음 녹음 & 음성 높낮이 그래프 (${cleanWordStr})`))))}
              </h4>

              <div style={{ margin: '8px 0', background: '#2C3E50', borderRadius: '14px', padding: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={50}
                  style={{ borderRadius: '8px', background: '#1A252F', width: '100%', maxHeight: '50px' }}
                />
              </div>

              {/* 🎯 실시간 발음 일치율 (%) 및 별점 성취도 표시 뱃지 */}
              {pronunciationScore !== null && (
                <div
                  style={{
                    margin: '12px 0 6px 0',
                    padding: '12px',
                    borderRadius: '16px',
                    background: pronunciationScore >= 85 ? '#E8F8F5' : (pronunciationScore >= 65 ? '#E5F8D0' : '#FDEDEC'),
                    border: `2px solid ${pronunciationScore >= 85 ? '#2ECC71' : (pronunciationScore >= 65 ? '#46A302' : '#E74C3C')}`,
                    animation: 'fadeIn 0.5s ease',
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: '900', color: pronunciationScore >= 85 ? '#27AE60' : (pronunciationScore >= 65 ? '#46A302' : '#C0392B') }}>
                    {(() => {
                      if (pronunciationScore >= 85) {
                        if (currentLang === 'zh') return `🎉 [${pronunciationScore}分] 完美发音达成！⭐⭐⭐`;
                        if (currentLang === 'fr') return `🎉 [${pronunciationScore} pts] Prononciation Parfaite ! ⭐⭐⭐`;
                        if (currentLang === 'ja') return `🎉 [${pronunciationScore}点] 完璧な発音達成！⭐⭐⭐`;
                        if (currentLang === 'vi') return `🎉 [${pronunciationScore} điểm] Phát âm hoàn hảo! ⭐⭐⭐`;
                        if (currentLang === 'hi') return `🎉 [${pronunciationScore} अंक] उत्कृष्ट उच्चारण! ⭐⭐⭐`;
                        return `🎉 [${pronunciationScore}점] 완벽한 원어민 발음! ⭐⭐⭐`;
                      }
                      if (pronunciationScore >= 65) {
                        if (currentLang === 'zh') return `👍 [${pronunciationScore}分] 65分以上通过！录音任务完成 ⭐⭐`;
                        if (currentLang === 'fr') return `👍 [${pronunciationScore} pts] Validé (65+ pts) ! Bravo ⭐⭐`;
                        if (currentLang === 'ja') return `👍 [${pronunciationScore}点] 65点以上合格！録音完了 ⭐⭐`;
                        if (currentLang === 'vi') return `👍 [${pronunciationScore} điểm] Đạt trên 65 điểm! Xuất sắc ⭐⭐`;
                        if (currentLang === 'hi') return `👍 [${pronunciationScore} अंक] 65 से अधिक सफल! ⭐⭐`;
                        return `👍 [${pronunciationScore}점] 발음 통과 (65점 이상 합격)! 훌륭해요 ⭐⭐`;
                      }
                      if (currentLang === 'zh') return `🌱 [${pronunciationScore}分] 低于65分，请再试一次！⭐`;
                      if (currentLang === 'fr') return `🌱 [${pronunciationScore} pts] Moins de 65, réessayez ! ⭐`;
                      if (currentLang === 'ja') return `🌱 [${pronunciationScore}点] 65点未満、もう一度挑戦してみましょう！⭐`;
                      if (currentLang === 'vi') return `🌱 [${pronunciationScore} điểm] Dưới 65 điểm, hãy thử lại nhé! ⭐`;
                      if (currentLang === 'hi') return `🌱 [${pronunciationScore} अंक] 65 से कम, पुनः प्रयास करें! ⭐`;
                      return `🌱 [${pronunciationScore}점] 조금만 더 크게 읽어보아요! (65점 이상 합격) ⭐`;
                    })()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', fontWeight: 'bold' }}>
                    {cleanWordStr} {currentLang === 'zh' ? '发音测评分数:' : (currentLang === 'fr' ? 'Score de prononciation:' : (currentLang === 'ja' ? '発音測定スコア:' : (currentLang === 'vi' ? 'Điểm phát âm:' : (currentLang === 'hi' ? 'उच्चारण स्कोर:' : '발음 측정 점수:'))))}{' '}
                    <span style={{ fontSize: '14px', color: pronunciationScore >= 65 ? '#46A302' : '#C0392B', fontWeight: '900' }}>
                      {pronunciationScore}{currentLang === 'zh' ? '分' : (currentLang === 'fr' ? ' pts' : (currentLang === 'ja' ? '点' : (currentLang === 'vi' ? ' điểm' : (currentLang === 'hi' ? ' अंक' : '점'))))}
                      {pronunciationScore >= 65 ? ' (합격 💮)' : ' (재도전 필요 💡)'}
                    </span>
                  </div>
                </div>
              )}

              {/* 🤖 AI 발음 교정 가이드 팁 카드 */}
              {(() => {
                const aiTip = getAIPronunciationGuideTip(cleanWordStr, pronunciationScore, currentLang);
                if (!aiTip) return null;
                return (
                  <div
                    style={{
                      margin: '12px 0 10px 0',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: aiTip.bg,
                      border: `2px solid ${aiTip.border}`,
                      textAlign: 'left',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      animation: 'fadeIn 0.4s ease'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '900', color: aiTip.color, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span>{aiTip.icon}</span>
                      <span>{aiTip.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#2C3E50', lineHeight: 1.5, fontWeight: 'bold' }}>
                      {aiTip.text}
                    </p>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                {!isRecording ? (
                  <button className="record-btn" onClick={startRecording} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t('btn_record_start', currentLang)}
                  </button>
                ) : (
                  <button className="record-btn recording" onClick={stopRecording} style={{ background: '#27AE60', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', animation: 'pulse 1s infinite' }}>
                    {t('btn_record_stop', currentLang)}
                  </button>
                )}

                {recordedAudioUrl && (
                  <button onClick={playRecordedAudio} style={{ background: '#3498DB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {t('btn_play_my_record', currentLang)}
                  </button>
                )}
              </div>
            </div>
          </div>
          )}
        </>
      )}

      {/* 탭 2: 전체 단어 리스트 */}
      {mainTab === 'wordlist' && (
        <WordListSection words={safeActiveWords} onPlayAudio={playWordAudio} userAudioRecordings={userAudioRecordings} currentLang={currentLang} />
      )}

      {/* 탭 3: 영단어 퀴즈 */}
      {mainTab === 'quiz' && (
        <QuizSection
          currentUser={currentUser}
          activeWords={safeActiveWords}
          onQuizLevelComplete={handleQuizLevelComplete}
          onLoadNextWordSet={handleLoadNextWordSet}
          initialQuizLevel={initialQuizLevel}
          currentLang={currentLang}
        />
      )}

      {/* 탭 4: 나만의 개인 단어장 */}
      {mainTab === 'myvocab' && (
        <PersonalVocabSection currentUser={currentUser} onPlayAudio={playWordAudio} initialTab="custom" currentLang={currentLang} />
      )}

      {/* 탭 5: ❌ 퀴즈 오답노트 전용 독립 메인 탭 */}
      {mainTab === 'wrongvocab' && (
        <PersonalVocabSection currentUser={currentUser} onPlayAudio={playWordAudio} initialTab="wrong" currentLang={currentLang} />
      )}

      {/* 탭 6: 출석 달력 */}
      {mainTab === 'calendar' && (
        <CalendarSection currentUser={currentUser} onSelectDateToStudy={handleSelectDateToStudy} currentLang={currentLang} />
      )}

      {/* 탭 7: 학부모 리포트 */}
      {mainTab === 'parent' && (
        <ParentDashboard currentUser={currentUser} onLogout={handleLogout} currentLang={currentLang} />
      )}

      {/* 탭 8: 📊 학생 학습 성취도 통계 리포트 */}
      {mainTab === 'stats' && (
        <StatsSection
          currentUser={currentUser}
          totalWordCount={wordList.length || 500}
          onNavigateTab={(tabName) => setMainTab(tabName)}
          currentLang={currentLang}
        />
      )}

      {/* 탭 9: 🗓️ Day 6 주간 종합 오답 복습 데이 */}
      {mainTab === 'day6' && (
        <Day6ReviewSection
          currentUser={currentUser}
          safeActiveWords={safeActiveWords}
          onQuizComplete={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event('study_data_updated'));
              window.dispatchEvent(new Event('storage'));
            }
          }}
          currentLang={currentLang}
        />
      )}

      {/* 탭 10: 🏆 Voca Power 실시간 랭킹 시스템 */}
      {mainTab === 'leaderboard' && (
        <LeaderboardSection currentUser={currentUser} currentLang={currentLang} />
      )}

    </main>
  );
}
