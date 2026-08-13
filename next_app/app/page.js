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

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mainTab, setMainTab] = useState('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    document.title = "Steve Voca - 초/중/고 5,000개 영단어 스마트 학습관";
  }, []);

  // 달력에서 선택한 학습 날짜 (기본: 오늘 날짜 YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [targetStudyDate, setTargetStudyDate] = useState(todayStr);

  // 단어 목록 데이터는 항상 Supabase 클라우드 DB에서 실시간으로 로드
  const [wordList, setWordList] = useState([]);
  const [dailyRandomWords, setDailyRandomWords] = useState([]);
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const testMsg = newSpeed === 0.7 ? "Slow mode" : newSpeed === 1.4 ? "Fast mode" : newSpeed === 2.0 ? "Super fast mode" : "Normal mode";
      const utterance = new SpeechSynthesisUtterance(testMsg);
      utterance.lang = 'en-US';
      utterance.rate = newSpeed;
      window.speechSynthesis.speak(utterance);
    }
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
      supabase.from('study_records').upsert({
        student_id: studentIdToUse,
        study_date: dateForMission,
        last_index: currentProgress.currentIndex,
        last_tab: currentProgress.mainTab,
        quiz_levels: currentProgress.completedQuizLevels,
        detail_stage: detailStageText
      }, { onConflict: 'student_id,study_date' }).then(() => {}).catch(() => {});
    } catch (e) {}
  }, [currentUser, isLoggedIn, targetStudyDate, todayStr, currentIndex, mainTab, completedQuizLevels, hasRecorded, initialQuizLevel]);


  // 🎯 발음 유사도(일치율 %) 정밀 계산 알고리즘 (가짜 보정 제거)
  const calculateMatchScore = (targetStr, spokenStr) => {
    if (!targetStr) return 0;
    const cleanTarget = targetStr.toLowerCase().replace(/[^a-z]/g, '');
    const cleanSpoken = (spokenStr || '').toLowerCase().replace(/[^a-z]/g, '');

    // 1. 발음이 들리지 않거나 음성 인식이 실패한 경우 0점~10점 처리
    if (!cleanSpoken || cleanSpoken.trim() === '') {
      return 15; // 마이크 소리가 거의 안 들리거나 발음 미인식 시 낮은 점수
    }

    // 2. 완전히 일치하는 경우 100점
    if (cleanTarget === cleanSpoken) return 100;

    // 3. 포함 관계인 경우 부분 점수
    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      const ratio = Math.min(cleanTarget.length, cleanSpoken.length) / Math.max(cleanTarget.length, cleanSpoken.length);
      return Math.round(ratio * 90);
    }

    // 4. 레벤슈타인 거리 기반 알파벳 정밀 유사도 산출
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
    const maxLen = Math.max(m, n);
    const score = Math.round(((maxLen - dist) / maxLen) * 100);
    return Math.max(0, Math.min(100, score));
  };



  useEffect(() => {
    try {
      const savedSession = sessionStorage.getItem('english_edu_logged_user');
      const savedTab = sessionStorage.getItem('english_edu_main_tab');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
        if (savedTab) setMainTab(savedTab);
      }
    } catch (e) {
      console.log('Session parse error', e);
    }
  }, []);

  const handleLoginSuccess = (studentObj) => {
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
            category: item.category || '초등단어',
            gradeLevel: item.grade_level || '초등단어',
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
        const { data: dbByCode } = await supabase
          .from('users')
          .select('study_grade_level, daily_word_count')
          .or(`student_id.eq.${studentCode},id.eq.${userId},student_id.eq.${userId}`)
          .limit(1);
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

    const queryCond = [studentCode, userId, userName].filter(Boolean).map(id => `student_id.eq.${id}`).join(',');

    try {
      // 1. Supabase DB에서 해당 학생이 이미 공부한 모든 단어 목록 가져오기 (3중 안전 쿼리)
      const [learnedRes, studyRes] = await Promise.allSettled([
        supabase.from('student_learned_words').select('word').or(queryCond),
        supabase.from('study_records').select('stamped_words').or(queryCond)
      ]);

      let learnedWordSet = new Set();
      if (learnedRes.status === 'fulfilled' && learnedRes.value.data) {
        learnedRes.value.data.forEach(item => {
          if (item.word) learnedWordSet.add(item.word.trim().toLowerCase());
        });
      }
      if (studyRes.status === 'fulfilled' && studyRes.value.data) {
        studyRes.value.data.forEach(item => {
          if (Array.isArray(item.stamped_words)) {
            item.stamped_words.forEach(w => {
              const wStr = typeof w === 'string' ? w : w.word;
              if (wStr) learnedWordSet.add(wStr.trim().toLowerCase());
            });
          }
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
          category: item.category || '초등단어',
          gradeLevel: item.grade_level || item.gradeLevel || (item.category && item.category.includes('중등') ? '중등단어' : (item.id >= 1000 ? '중등단어' : '초등단어')),
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


  // ⚡ [관리자-학생 화면 실시간 레벨 & 단어수 동기화 Engine]
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
            .or(`student_id.eq.${studentIdToSearch},id.eq.${studentIdToSearch},name.ilike.%${studentNameClean}%`)
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
          const cloudLevel = dbUser.study_grade_level || '초등단어';
          const cloudCount = String(dbUser.daily_word_count || '10');

          const curLevel = currentUser.studyGradeLevel || currentUser.study_grade_level || '초등단어';
          const curCount = String(currentUser.dailyWordCount || currentUser.daily_word_count || '10');

          if (cloudLevel !== curLevel || cloudCount !== curCount) {
            console.log(`🔄 [실시간 프로필 동기화] 레벨: ${curLevel} -> ${cloudLevel}, 목표: ${curCount} -> ${cloudCount}`);
            const updatedUser = {
              ...currentUser,
              studyGradeLevel: cloudLevel,
              study_grade_level: cloudLevel,
              dailyWordCount: cloudCount,
              daily_word_count: cloudCount
            };
            setCurrentUser(updatedUser);
            sessionStorage.setItem('english_edu_logged_user', JSON.stringify(updatedUser));
            localStorage.setItem('english_edu_logged_user', JSON.stringify(updatedUser));
            localStorage.setItem('english_edu_current_user', JSON.stringify(updatedUser));
            const newRandoms = await loadDailyRandomWordsFromDB(updatedUser);
            if (newRandoms && newRandoms.length > 0) {
              setDailyRandomWords(newRandoms);
              setWordList(newRandoms);
            }
          }
        }
      } catch (e) {}
    };

    checkAndSyncProfile();
    const interval = setInterval(checkAndSyncProfile, 2000);
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
      setCurrentIndex(savedIdx);

      if (storedQuiz.includes(2)) {
        // 이미 2단계 스펠링 퀴즈 완수
        setResumeNotice(`🎉 [학습 완수] [${dateForMission}] 출석 도장(💮) 수여 완료! 이어서 복습하거나 다음 세트를 공부하세요.`);
      } else if (storedQuiz.includes(1)) {
        // 1단계 소리 퀴즈 완료 ➔ 2단계 스펠링 퀴즈로 자동 이동
        setMainTab('quiz');
        setInitialQuizLevel(2);
        setResumeNotice(`▶ [이어서 학습] 1단계 소리 퀴즈 완료! 2단계 스펠링 선택 퀴즈(필수)로 자동 연결되었습니다. 🧩`);
      } else if (savedProgress.mainTab === 'quiz' || savedIdx >= userDailyCount - 1) {
        // 퀴즈 탭 또는 카드 학습 완료 ➔ 1단계 소리 퀴즈로 자동 이동
        setMainTab('quiz');
        setInitialQuizLevel(1);
        setResumeNotice(`▶ [이어서 학습] 1단계 소리 퀴즈부터 이어서 학습합니다. 🔊`);
      } else {
        // 플래시카드 진행 중
        if (savedProgress.mainTab) setMainTab(savedProgress.mainTab);
        setResumeNotice(`▶ [이어서 학습] 이전 학습 위치 (단어 #${savedIdx + 1})부터 이어서 학습합니다! 🎴`);
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

      // 로컬 세트의 개수가 현재 학생의 목표 수량(예: 20개)과 정확히 일치할 때만 캐시 사용, 다르면 DB 라이브 로드!
      if (savedDailySet && savedDailySet.length === targetCount && savedDailySet.length > 0) {
        setDailyRandomWords(savedDailySet);
        setWordList(savedDailySet);
      } else {
        const newRandomSet = await loadDailyRandomWordsFromDB(currentUser);
        if (newRandomSet && newRandomSet.length > 0) {
          setDailyRandomWords(newRandomSet);
          setWordList(newRandomSet);
          localStorage.setItem(dailySetKey, JSON.stringify(newRandomSet));
          setTodayAllLearnedWords(newRandomSet);
          localStorage.setItem(todayAllKey, JSON.stringify(newRandomSet));
        }
      }
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
    alert(`📅 [${selectedDateStr}] 날짜의 단어 학습을 시작합니다!\n\n플래시카드 단어를 확인하고 2단계 퀴즈를 완수하면 이 날짜에 출석 도장(💮)이 찍힙니다! 🚀`);
  };

  const handleLoadNextWordSet = () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const dailyCount = parseInt(currentUser.dailyWordCount || 10, 10);
    const learnedKey = `learned_words_${userId}`;
    const dateForMission = targetStudyDate || todayStr;
    const todayAllKey = `today_all_learned_${currentUser.id}_${dateForMission}`;

    let learnedList = [];
    try {
      learnedList = JSON.parse(localStorage.getItem(learnedKey) || '[]');
    } catch (e) {
      learnedList = [];
    }

    const currentWordsStr = dailyRandomWords.map(w => w.word);
    const updatedLearned = [...new Set([...learnedList, ...currentWordsStr])];
    localStorage.setItem(learnedKey, JSON.stringify(updatedLearned));

    let unlearned = wordList.filter(w => !updatedLearned.includes(w.word));
    if (unlearned.length < dailyCount) {
      localStorage.setItem(learnedKey, JSON.stringify([]));
      unlearned = [...wordList];
    }

    const nextRandomSet = [...unlearned].sort(() => Math.random() - 0.5).slice(0, dailyCount);

    setDailyRandomWords(nextRandomSet);
    localStorage.setItem(`daily_random_set_${userId}_${dateForMission}`, JSON.stringify(nextRandomSet));

    const updatedTodayAll = [...todayAllLearnedWords, ...nextRandomSet];
    setTodayAllLearnedWords(updatedTodayAll);
    localStorage.setItem(todayAllKey, JSON.stringify(updatedTodayAll));

    setStudyRound(prev => prev + 1);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedQuizLevels([]);
    setMainTab('flashcard');

    alert(`🎉 🚀 다음 단어 학습 세트(제 ${studyRound + 1}회차)를 불러왔습니다!\n오늘 학습한 총 ${updatedTodayAll.length}개 단어는 상단 [📖 오늘 누적 학습 단어] 버튼으로 언제든 다시 복습할 수 있습니다!`);
  };

  const userDailyCount = currentUser ? parseInt(currentUser.dailyWordCount || 10, 10) : 10;
  const fallbackWords = Array.isArray(wordList500Fallback) && wordList500Fallback.length > 0
    ? wordList500Fallback
    : [{ id: 1, word: 'Apple', phonics: '/ˈæpəl/', meaning: '사과', category: '과일/음식 🍎', gradeLevel: '초등단어' }];

  const baseWordsList = (dailyRandomWords && dailyRandomWords.length > 0)
    ? dailyRandomWords
    : ((wordList && wordList.length > 0) ? wordList : fallbackWords);

  const safeActiveWords = (baseWordsList && baseWordsList.length > 0)
    ? baseWordsList.slice(0, userDailyCount)
    : fallbackWords.slice(0, userDailyCount);

  const currentWord = safeActiveWords[currentIndex] || safeActiveWords[0] || fallbackWords[0];


  const cleanWordStr = typeof currentWord === 'string'
    ? currentWord.replace(/\.png/gi, '').trim()
    : (currentWord?.word || 'Word').replace(/\.png/gi, '').trim();

  // 📖 사전(wordList500Fallback)에서 영단어 스펠링 기반 1:1 한글 뜻 및 발음기호 정밀 매칭 보정
  const matchedDictWord = Array.isArray(wordList500Fallback)
    ? wordList500Fallback.find(w => (w.word || '').toLowerCase().replace(/\.png/gi, '').trim() === cleanWordStr.toLowerCase())
    : null;

  const cleanMeaningStr = (typeof currentWord === 'object' && currentWord?.meaning && currentWord.meaning !== '기초 단어')
    ? currentWord.meaning
    : (matchedDictWord?.meaning || '단어 뜻');

  const cleanPhonicsStr = (typeof currentWord === 'object' && currentWord?.phonics && currentWord.phonics !== '')
    ? currentWord.phonics
    : (matchedDictWord?.phonics || matchedDictWord?.category || '');


  const rawExampleEn = (typeof currentWord === 'object' && currentWord?.exampleEn) ? currentWord.exampleEn.replace(/\.png/gi, '').trim() : '';
  const rawExampleKo = (typeof currentWord === 'object' && currentWord?.exampleKo) ? currentWord.exampleKo.replace(/\.png/gi, '').trim() : '';

  const isRealSentenceEn = rawExampleEn && /[a-zA-Z]/.test(rawExampleEn) && !rawExampleEn.includes('제작완료') && !rawExampleEn.toLowerCase().endsWith('.png') && rawExampleEn.split(/\s+/).length >= 2;
  const isRealSentenceKo = rawExampleKo && !rawExampleKo.includes('.png') && !rawExampleKo.includes('제작완료') && rawExampleKo.trim().length >= 2;

  const displayExampleEn = isRealSentenceEn
    ? rawExampleEn
    : `I see a nice ${cleanWordStr.toLowerCase()}.`;

  const displayExampleKo = isRealSentenceKo
    ? rawExampleKo
    : `나는 멋진 ${cleanMeaningStr}을(를) 본다.`;


  const playWordAudio = useCallback((wordText) => {
    if ('speechSynthesis' in window) {
      const text = wordText || cleanWordStr;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = ttsSpeed;
      window.speechSynthesis.speak(utterance);
    }
  }, [cleanWordStr, ttsSpeed]);

  const playSentenceAudio = useCallback((sentenceText) => {
    if ('speechSynthesis' in window) {
      const textToSpeak = sentenceText || displayExampleEn;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = ttsSpeed;
      window.speechSynthesis.speak(utterance);
    }
  }, [displayExampleEn, ttsSpeed]);

  useEffect(() => {
    if (isLoggedIn && mainTab === 'flashcard' && currentWord) {
      const timer = setTimeout(() => {
        playWordAudio(cleanWordStr);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, mainTab, currentIndex, currentWord, playWordAudio, cleanWordStr]);

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

    if (currentIndex + 1 >= safeActiveWords.length) {
      alert('🎉 선택한 세트 단어를 모두 보았습니다! 1단계 소리 퀴즈로 자동 이동합니다!');
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

    const draw = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `hsl(${i * 12 + 160}, 85%, 55%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  }, []);

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
      alert('마이크 접근 권한이 필요합니다.');
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
      alert('저장할 녹음 파일이 없습니다. 먼저 녹음을 진행해 주세요!');
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
    alert(`💾 [${fileName}] 음성 녹음 파일이 내 컴퓨터 다운로드 폴더에 안전하게 저장되었습니다! 📁`);
  };


  // 💮 클라우드 DB & localStorage 출석 도장 찍기 (선택된 날짜 targetStudyDate 에 찍기!)
  const handleStampAttendance = useCallback(async () => {
    if (!currentUser) return;
    const stampDateKey = targetStudyDate || todayStr;
    const stampKey = `english_stamps_${currentUser.id}`;
    const stampedWordsKey = `stamped_words_${currentUser.id}_${stampDateKey}`;
    
    // 1. 단어 목록 2중 3중 안전 정제 (절대 빈 값이 되지 않도록 보장)
    const rawWords = todayAllLearnedWords.length > 0 ? todayAllLearnedWords : (safeActiveWords.length > 0 ? safeActiveWords : dailyRandomWords);
    const wordsToSave = (rawWords && rawWords.length > 0) ? rawWords : [{ word: 'Apple', meaning: '사과' }];
    
    const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
    const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    // 2. Supabase 클라우드 DB study_records 및 student_learned_words 보관함에 100% 즉시 정밀 전송
    try {
      const dbLearnedMap = new Map();
      wordsToSave.forEach(w => {
        const wordVal = typeof w === 'string' ? w : (w.word || '');
        const meaningVal = typeof w === 'string' ? '' : (w.meaning || '');
        if (wordVal) {
          const key1 = `${studentIdToUse}_${wordVal.toLowerCase()}`;
          dbLearnedMap.set(key1, { student_id: studentIdToUse, word: wordVal, meaning: meaningVal });
          if (studentNameClean && studentNameClean !== studentIdToUse) {
            const key2 = `${studentNameClean}_${wordVal.toLowerCase()}`;
            dbLearnedMap.set(key2, { student_id: studentNameClean, word: wordVal, meaning: meaningVal });
          }
        }
      });

      const studyRecordsMap = new Map();
      studyRecordsMap.set(studentIdToUse, { student_id: studentIdToUse, study_date: stampDateKey, is_stamped: true, stamped_words: wordsToSave });
      if (studentNameClean && studentNameClean !== studentIdToUse) {
        studyRecordsMap.set(studentNameClean, { student_id: studentNameClean, study_date: stampDateKey, is_stamped: true, stamped_words: wordsToSave });
      }

      console.log('🚀 DB 학습 단어 및 출석 도장 정밀 전송:', Array.from(dbLearnedMap.values()).length);

      await Promise.allSettled([
        supabase.from('study_records').upsert(Array.from(studyRecordsMap.values()), { onConflict: 'student_id,study_date' }),
        supabase.from('student_learned_words').insert(Array.from(dbLearnedMap.values()))
      ]);
      console.log('✅ DB 학습 데이터 전송 완벽 성공!');
    } catch (e) {
      console.error('Cloud attendance and learned words save error:', e);
    }

    // 3. localStorage 백업 저장
    let stamps = [];
    try {
      stamps = JSON.parse(localStorage.getItem(stampKey) || '[]');
    } catch (e) {
      stamps = [];
    }
    if (!stamps.includes(stampDateKey)) {
      stamps.push(stampDateKey);
      localStorage.setItem(stampKey, JSON.stringify(stamps));
    }

    localStorage.setItem(stampedWordsKey, JSON.stringify(wordsToSave));
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
        alert(`🎉 축하합니다! 2단계 퀴즈까지 완수하여 [${dateForMission}] 출석 도장이 성공적으로 찍혔습니다! 💮\n(오늘 총 ${todayAllLearnedWords.length || safeActiveWords.length}개 단어 학습 완료!)\n\n출석 달력 탭에서 도장을 확인해보세요!`);
        setMainTab('calendar');
      }, 300);
    }
  };

  const isQuizL2Done = completedQuizLevels.includes(2);

  const getWordImgSrc = (wordObj) => {
    if (!wordObj) return '/word_img/Apple.png';
    if (wordObj.image_url && wordObj.image_url.trim() !== '') {
      return wordObj.image_url;
    }
    const wordClean = (wordObj.word || '').replace(/\.png/gi, '').trim();
    if (!wordClean) return '/word_img/Apple.png';
    const wordCap = wordClean.charAt(0).toUpperCase() + wordClean.slice(1);
    return `/word_img/${wordCap}.png`;
  };

  const handleImageError = (e, wordStr) => {
    const target = e.target;
    const currentSrc = target.src;
    const wordClean = (wordStr || '').replace(/\.png/gi, '').trim();
    const wordLower = wordClean.toLowerCase();
    const wordCap = wordClean ? wordClean.charAt(0).toUpperCase() + wordClean.slice(1) : '';

    if (currentSrc && !currentSrc.includes(`/${wordLower}.png`) && !currentSrc.includes(`/${wordCap}.png`)) {
      target.src = `/word_img/${wordLower}.png`;
    } else if (currentSrc && !currentSrc.includes(`/${wordCap}.png`)) {
      target.src = `/word_img/${wordCap}.png`;
    } else {
      // 이미지가 없는 단어일 경우 잘못된 사과(Apple) 대신 깔끔한 단어 알파벳 플레이스홀더 렌더링
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
      />
    );
  }

  return (
    <main className="app-container">
      {mainTab !== 'parent' && (
        <UserManager currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />
      )}

      {mainTab !== 'parent' && (
        <div style={{
          width: '100%',
          background: '#FFFFFF',
          border: '2px solid #EBF5FB',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          justify: 'space-around',
          alignItems: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#E67E22', background: '#FEF5E7', padding: '4px 10px', borderRadius: '10px', border: '1px solid #FADBD8' }}>
              📅 [{targetStudyDate}] 학습 진행 중
            </span>

            <button
              onClick={() => setShowTodayAllModal(true)}
              style={{ background: '#27AE60', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(39,174,96,0.2)' }}
              title="오늘 1회차+2회차 등 지금까지 공부한 모든 단어 리스트 한눈에 보기"
            >
              📖 학습 단어 {todayAllLearnedWords.length || safeActiveWords.length}개 보기
            </button>
          </div>

          <button
            onClick={() => {
              setMainTab('flashcard');
              setTimeout(() => {
                const recElement = document.getElementById('record-mission-section');
                if (recElement) recElement.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: hasRecorded ? '2px solid #2ECC71' : '1px solid #3498DB',
              background: hasRecorded ? '#E8F8F5' : '#EBF5FB',
              color: hasRecorded ? '#27AE60' : '#2980B9',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}
          >
            {hasRecorded ? '✅ 1차 녹음 완료 🎙️' : '🎙️ 1차 녹음 미션 ➔'}
          </button>

          <button
            onClick={() => setMainTab('quiz')}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '8px 12px',
              borderRadius: '12px',
              border: isQuizL2Done ? '2px solid #2ECC71' : '1px solid #9B59B6',
              background: isQuizL2Done ? '#E8F8F5' : '#F5EEF8',
              color: isQuizL2Done ? '#27AE60' : '#8E44AD',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px'
            }}
          >
            {isQuizL2Done ? '✅ 퀴즈 완수 (출석도장💮)' : '🧩 2단계 스펠링 퀴즈 ➔'}
          </button>

          <button
            onClick={handleLoadNextWordSet}
            style={{
              flex: 1,
              minWidth: '140px',
              padding: '8px 14px',
              borderRadius: '12px',
              border: '2px solid #E67E22',
              background: '#FEF5E7',
              color: '#D35400',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(230,126,34,0.2)'
            }}
          >
            🚀 다음 단어 학습 ➔
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
                  📖 [{targetStudyDate}] 학습 단어 리스트
                </h3>
                <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                  🔥 총 {todayAllLearnedWords.length || safeActiveWords.length}개 단어 수강 중!
                </span>
              </div>
              <button onClick={() => setShowTodayAllModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(todayAllLearnedWords.length > 0 ? todayAllLearnedWords : safeActiveWords).map((item, i) => {
                const wordStr = (item.word || item).replace(/\.png/gi, '').trim();
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8F9FA', borderRadius: '12px', border: '1px solid #E9ECEF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#2980B9', fontSize: '13px' }}>#{i + 1}</span>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#2C3E50', fontSize: '16px' }}>{wordStr}</span>
                        {item.phonics && <span style={{ fontSize: '12px', color: '#7F8C8D', marginLeft: '6px' }}>{item.phonics}</span>}
                        {item.meaning && <div style={{ color: '#E74C3C', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{item.meaning}</div>}
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
              닫기
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
                  ⚡ 5단계 진도 저장 중
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#3C3C3C' }}>
                  {resumeNotice || `▶ 현재 학습 위치: 단어 #${currentIndex + 1} / ${safeActiveWords.length}`}
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
                🔄 처음부터 다시 학습
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
                🔥 오늘 목표의 {progressPct}% 완수!
              </span>
            </div>

            {/* 6단계 원클릭 3D 클릭가능 스테퍼 (Clickable Interactive Stepper - 퀴즈 4단계 확장 연동) */}
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
                1️⃣ 🎴 카드 ({currentIndex + 1}/{safeActiveWords.length})
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
                2️⃣ 🎙️ 녹음 {hasRecorded ? '✅' : '⏳'}
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
                3️⃣ 🔊 소리퀴즈 {completedQuizLevels.includes(1) ? '✅' : '⏳'}
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
                4️⃣ 🧩 선택퀴즈 {completedQuizLevels.includes(2) ? '✅' : '⏳'}
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
                5️⃣ 🎙️ 녹음퀴즈 {completedQuizLevels.includes(3) ? '✅' : '⏳'}
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
                6️⃣ ✍️ 직접쓰기 {completedQuizLevels.includes(4) ? '✅' : '⏳'}
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
                7️⃣ 💮 출석도장 {completedQuizLevels.includes(2) ? '완료' : '대기'}
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
            📖 핵심 학습 코스
          </span>
          <button
            className={`nav-pill-btn ${mainTab === 'flashcard' ? 'active' : ''}`}
            onClick={() => setMainTab('flashcard')}
          >
            🎴 플래시카드
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'wordlist' ? 'active' : ''}`}
            onClick={() => setMainTab('wordlist')}
          >
            📋 단어 리스트
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setMainTab('quiz')}
          >
            ❓ 1~4단계 퀴즈
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'myvocab' ? 'active' : ''}`}
            onClick={() => setMainTab('myvocab')}
          >
            ⭐ 나만의 단어장
          </button>
        </div>

        {/* 그룹 2: 💥 오답 & 주간복습 & 학습통계 리포터 */}
        <div className="category-nav-group">
          <span className="category-label" style={{ background: '#F5EEF8', color: '#8E44AD', border: '1px solid #D7BDE2' }}>
            💥 오답·복습·리포트
          </span>
          <button
            className={`nav-pill-btn ${mainTab === 'wrongvocab' ? 'active' : ''}`}
            onClick={() => setMainTab('wrongvocab')}
            style={{ background: mainTab === 'wrongvocab' ? '#E74C3C' : '#FDEDEC', color: mainTab === 'wrongvocab' ? 'white' : '#C0392B', borderColor: '#F5B7B1' }}
          >
            ❌ 퀴즈 오답노트 ☁️
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'day6' ? 'active' : ''}`}
            onClick={() => setMainTab('day6')}
            style={{ background: mainTab === 'day6' ? '#6C5CE7' : '#F5EEF8', color: mainTab === 'day6' ? 'white' : '#8E44AD', borderColor: '#D7BDE2' }}
          >
            🗓️ Day 6 주간복습 💮
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setMainTab('calendar')}
          >
            📅 출석 달력
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'stats' ? 'active' : ''}`}
            onClick={() => setMainTab('stats')}
            style={{ background: mainTab === 'stats' ? '#4ECDC4' : '#E8F8F5', color: mainTab === 'stats' ? 'white' : '#16A085', borderColor: '#A3E4D7' }}
          >
            📊 학습통계
          </button>
          <button
            className={`nav-pill-btn ${mainTab === 'parent' ? 'active' : ''}`}
            onClick={() => setMainTab('parent')}
            style={{ background: mainTab === 'parent' ? '#9B59B6' : '#F5EEF8', color: mainTab === 'parent' ? 'white' : '#8E44AD', borderColor: '#D7BDE2' }}
          >
            👨‍👩‍👧‍👦 학부모
          </button>
        </div>
      </nav>

      {/* 탭 1: 플래시카드 학습 코스 */}
      {mainTab === 'flashcard' && (
        <>
          <header className="app-header">
            <h1 className="app-title" style={{ margin: 0 }}>
              Steve Voca (스티브 보카) {currentUser?.studyGradeLevel || currentUser?.study_grade_level || '중등단어'}
            </h1>
          </header>

          {/* 🎛️ TTS 음성 속도 조율 컨트롤러 (0.7x ~ 2.0x) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            gap: '6px',
            background: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: '20px',
            border: '2px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            margin: '14px auto 16px auto',
            maxWidth: '500px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#4A5568', display: 'flex', alignItems: 'center', gap: '4px' }}>
              🎛️ 발음 속도:
            </span>

            <button
              onClick={() => handleSpeedChange(0.7)}
              style={{
                padding: '5px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: ttsSpeed === 0.7 ? '2px solid #E67E22' : '1px solid #CBD5E0',
                background: ttsSpeed === 0.7 ? '#FEF9E7' : '#FFFFFF',
                color: ttsSpeed === 0.7 ? '#D35400' : '#4A5568',
                cursor: 'pointer',
                boxShadow: ttsSpeed === 0.7 ? '0 2px 6px rgba(230,126,34,0.2)' : 'none'
              }}
            >
              🐢 0.7x (슬로우)
            </button>

            <button
              onClick={() => handleSpeedChange(1.0)}
              style={{
                padding: '5px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: ttsSpeed === 1.0 ? '2px solid #2ECC71' : '1px solid #CBD5E0',
                background: ttsSpeed === 1.0 ? '#E8F8F5' : '#FFFFFF',
                color: ttsSpeed === 1.0 ? '#27AE60' : '#4A5568',
                cursor: 'pointer',
                boxShadow: ttsSpeed === 1.0 ? '0 2px 6px rgba(46,204,113,0.2)' : 'none'
              }}
            >
              🎧 1.0x (표준)
            </button>

            <button
              onClick={() => handleSpeedChange(1.4)}
              style={{
                padding: '5px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: ttsSpeed === 1.4 ? '2px solid #3498DB' : '1px solid #CBD5E0',
                background: ttsSpeed === 1.4 ? '#EBF5FB' : '#FFFFFF',
                color: ttsSpeed === 1.4 ? '#2980B9' : '#4A5568',
                cursor: 'pointer',
                boxShadow: ttsSpeed === 1.4 ? '0 2px 6px rgba(52,152,219,0.2)' : 'none'
              }}
            >
              ⚡ 1.4x (빠르게)
            </button>

            <button
              onClick={() => handleSpeedChange(2.0)}
              style={{
                padding: '5px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold',
                border: ttsSpeed === 2.0 ? '2px solid #9B59B6' : '1px solid #CBD5E0',
                background: ttsSpeed === 2.0 ? '#F5EEF8' : '#FFFFFF',
                color: ttsSpeed === 2.0 ? '#8E44AD' : '#4A5568',
                cursor: 'pointer',
                boxShadow: ttsSpeed === 2.0 ? '0 2px 6px rgba(155,89,182,0.2)' : 'none'
              }}
            >
              🚀 2.0x (초배속)
            </button>
          </div>

          <div className="flashcard-wrapper">
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
              {/* 앞면: 그림 + 영단어 + 발음기호 + 한글 뜻 */}
              <div className="card-face card-front">
                <span className="card-category-badge">
                  {(typeof currentWord === 'object' && (currentWord?.grade_level || currentWord?.gradeLevel)) || currentUser?.studyGradeLevel || currentUser?.study_grade_level || '중등단어'} • {(typeof currentWord === 'object' && currentWord?.category) || '기초'}
                </span>

                <div style={{ width: '130px', height: '130px', margin: '6px 0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getWordImgSrc(currentWord)}
                    alt={cleanWordStr}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                    onError={(e) => handleImageError(e, cleanWordStr)}
                  />
                </div>

                <h2 className="word-en" style={{ margin: '4px 0 0 0', color: '#2C3E50' }}>{cleanWordStr}</h2>
                {cleanPhonicsStr && <p className="word-phonics" style={{ margin: '2px 0 0 0', color: '#3498DB' }}>{cleanPhonicsStr}</p>}
                <h3 className="word-ko" style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#FF6B6B' }}>{cleanMeaningStr}</h3>


                <div style={{ marginTop: '8px' }}>
                  <button className="audio-btn" onClick={(e) => { e.stopPropagation(); playWordAudio(cleanWordStr); }}>
                    🔊 단어 발음 듣기
                  </button>
                </div>

                <div className="flip-hint">👆 터치하여 예문 및 예문 발음 보기</div>
              </div>

              {/* 뒷면: 예문 문장 & 예문 음성 전용 재생기 */}
              <div className="card-face card-back">
                <span className="card-category-badge">
                  {currentWord?.gradeLevel || '초등단어'} • {currentWord?.category}
                </span>

                <div style={{ width: '110px', height: '110px', margin: '4px 0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getWordImgSrc(currentWord)}
                    alt={cleanWordStr}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                    onError={(e) => handleImageError(e, cleanWordStr)}
                  />
                </div>

                <span style={{ fontSize: '12px', color: '#7F8C8D', marginTop: '6px', fontWeight: 'bold' }}>📖 추천 학습 예문</span>
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
                    🔊 예문 문장 발음 듣기
                  </button>
                </div>

                <div className="flip-hint">👆 터치하여 영단어 보기</div>
              </div>
            </div>

            <div className="card-nav-buttons">
              <button className="btn-nav" onClick={handlePrev}>◀ 이전</button>
              <span className="card-counter">
                {currentIndex + 1} / {safeActiveWords.length}
              </span>
              <button className="btn-nav" onClick={handleNext}>
                {currentIndex + 1 === safeActiveWords.length ? '1단계 퀴즈로 ➔' : '다음 ▶'}
              </button>
            </div>

            <div id="record-mission-section" className="voice-recorder-card" style={{ marginTop: '16px', background: '#FFFFFF', borderRadius: '20px', padding: '16px', border: '1px solid #E9ECEF', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#2C3E50' }}>
                🎙️ 내 발음 녹음 & 음성 높낮이 그래프 ({cleanWordStr})
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
                    background: pronunciationScore >= 90 ? '#E8F8F5' : (pronunciationScore >= 75 ? '#FEF9E7' : '#FDEDEC'),
                    border: `2px solid ${pronunciationScore >= 90 ? '#2ECC71' : (pronunciationScore >= 75 ? '#F1C40F' : '#E74C3C')}`,
                    animation: 'fadeIn 0.5s ease',
                  }}
                >
                  <div style={{ fontSize: '15px', fontWeight: '900', color: pronunciationScore >= 90 ? '#27AE60' : (pronunciationScore >= 75 ? '#D4AC0D' : '#C0392B') }}>
                    {pronunciationScore >= 90 ? '🎯 발음 일치율 100% 완벽해요! ⭐⭐⭐' : (pronunciationScore >= 75 ? `👍 발음 일치율 ${pronunciationScore}% 훌륭해요! ⭐⭐` : `🌱 발음 일치율 ${pronunciationScore}% 힘내세요! ⭐`)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', fontWeight: 'bold' }}>
                    {cleanWordStr} 발음 측정 점수: <span style={{ fontSize: '14px', color: '#2980B9' }}>{pronunciationScore}점</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                {!isRecording ? (
                  <button className="record-btn" onClick={startRecording} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🎙️ 녹음 시작 (발음 측정)
                  </button>
                ) : (
                  <button className="record-btn recording" onClick={stopRecording} style={{ background: '#27AE60', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', animation: 'pulse 1s infinite' }}>
                    ⏹️ 녹음 완료 및 일치율 확인
                  </button>
                )}

                {recordedAudioUrl && (
                  <button onClick={playRecordedAudio} style={{ background: '#3498DB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ▶️ 내 발음 듣기
                  </button>
                )}

              </div>

            </div>
          </div>
        </>
      )}

      {/* 탭 2: 전체 단어 리스트 */}
      {mainTab === 'wordlist' && (
        <WordListSection words={safeActiveWords} onPlayAudio={playWordAudio} userAudioRecordings={userAudioRecordings} />
      )}


      {/* 탭 3: 영단어 퀴즈 */}
      {mainTab === 'quiz' && (
        <QuizSection
          currentUser={currentUser}
          activeWords={safeActiveWords}
          onQuizLevelComplete={handleQuizLevelComplete}
          onLoadNextWordSet={handleLoadNextWordSet}
          initialQuizLevel={initialQuizLevel}
        />
      )}

      {/* 탭 4: 나만의 개인 단어장 */}
      {mainTab === 'myvocab' && (
        <PersonalVocabSection currentUser={currentUser} onPlayAudio={playWordAudio} initialTab="custom" />
      )}

      {/* 탭 5: ❌ 퀴즈 오답노트 전용 독립 메인 탭 */}
      {mainTab === 'wrongvocab' && (
        <PersonalVocabSection currentUser={currentUser} onPlayAudio={playWordAudio} initialTab="wrong" />
      )}

      {/* 탭 6: 출석 달력 (날짜 선택 핸들러 연결!) */}
      {mainTab === 'calendar' && (
        <CalendarSection currentUser={currentUser} onSelectDateToStudy={handleSelectDateToStudy} />
      )}

      {/* 탭 7: 학부모 리포트 */}
      {mainTab === 'parent' && (
        <ParentDashboard currentUser={currentUser} onLogout={handleLogout} />
      )}

      {/* 탭 8: 📊 학생 학습 성취도 통계 리포트 */}
      {mainTab === 'stats' && (
        <StatsSection
          currentUser={currentUser}
          totalWordCount={wordList.length || 500}
          onNavigateTab={(tabName) => setMainTab(tabName)}
        />
      )}

      {/* 탭 9: 🗓️ Day 6 주간 종합 오답 복습 데이 */}
      {mainTab === 'day6' && (
        <Day6ReviewSection
          currentUser={currentUser}
          safeActiveWords={safeActiveWords}
          onQuizComplete={fetchStudyRecordsFromDB}
        />
      )}

    </main>
  );
}
