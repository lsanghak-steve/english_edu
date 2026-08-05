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

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mainTab, setMainTab] = useState('flashcard'); // 'flashcard', 'wordlist', 'quiz', 'myvocab', 'wrongvocab', 'calendar', 'parent'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Supabase 클라우드 DB 연동 단어 데이터 상태
  const [wordList, setWordList] = useState(() =>
    wordList500Fallback.map(w => ({ ...w, gradeLevel: w.gradeLevel || '초등단어' }))
  );
  const [dailyRandomWords, setDailyRandomWords] = useState([]);
  const [studyRound, setStudyRound] = useState(1);

  // 오늘 누적 학습 단어 전체 목록 상태 & 팝업 모달 상태
  const [todayAllLearnedWords, setTodayAllLearnedWords] = useState([]);
  const [showTodayAllModal, setShowTodayAllModal] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 음성 파동/높낮이 실시간 Visualizer 레퍼런스
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // 미션 상태: 1차 녹음 수행 및 퀴즈 2단계 완수 추적
  const [hasRecorded, setHasRecorded] = useState(false);
  const [completedQuizLevels, setCompletedQuizLevels] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  // 세션 세션스토리지 확인 (페이지 새로고침 시에도 유지)
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

  // 학생 로그인 성공 콜백
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

  // 👨‍👩‍👧‍👦 학부모 이름 로그인 성공 콜백 (모든 자녀 리포트로 바로 이동!)
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

  // 로그아웃 콜백
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

  // Supabase 클라우드 DB에서 534개 전체 단어 실시간 로드
  useEffect(() => {
    async function loadWordsFromSupabase() {
      try {
        const { data, error } = await supabase.from('words').select('*').order('id', { ascending: true });
        if (!error && data && data.length > 0) {
          const formatted = data.map(item => ({
            id: item.id,
            word: (item.word || '').replace(/\.png/gi, '').trim(),
            phonics: item.phonics || '',
            meaning: item.meaning,
            category: item.category || '기타',
            gradeLevel: item.grade_level || '초등단어',
            exampleEn: (item.example_en || '').replace(/\.png/gi, '').trim(),
            exampleKo: (item.example_ko || '').replace(/\.png/gi, '').trim(),
            imageUrl: item.image_url || ''
          }));
          setWordList(formatted);
        }
      } catch (e) {
        console.log('Using local fallback word list with 초등단어 tag');
      }
    }
    loadWordsFromSupabase();
  }, []);

  // 미학습 단어 중 무작위(랜덤) 세트 로드
  const generateDailyRandomWords = useCallback((userObj, fullList) => {
    if (!fullList || fullList.length === 0) return [];
    const userId = userObj ? userObj.id : 'guest';
    const dailyCount = userObj ? parseInt(userObj.dailyWordCount || 10, 10) : 10;
    const learnedKey = `learned_words_${userId}`;

    let learnedList = [];
    try {
      learnedList = JSON.parse(localStorage.getItem(learnedKey) || '[]');
    } catch (e) {
      learnedList = [];
    }

    let unlearned = fullList.filter(w => !learnedList.includes(w.word));

    if (unlearned.length < dailyCount) {
      learnedList = [];
      localStorage.setItem(learnedKey, JSON.stringify([]));
      unlearned = [...fullList];
    }

    const shuffled = [...unlearned].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, dailyCount);
  }, []);

  // 학생 선택 시 미학습 무작위 단어 세트 로드 & 미션 상태 로드
  useEffect(() => {
    if (!currentUser || !isLoggedIn) return;
    const recKey = `record_mission_${currentUser.id}_${todayStr}`;
    const quizKey = `quiz_mission_${currentUser.id}_${todayStr}`;
    const dailySetKey = `daily_random_set_${currentUser.id}_${todayStr}`;
    const todayAllKey = `today_all_learned_${currentUser.id}_${todayStr}`;

    setHasRecorded(localStorage.getItem(recKey) === 'true');
    try {
      const storedQuiz = JSON.parse(localStorage.getItem(quizKey) || '[]');
      setCompletedQuizLevels(storedQuiz);
    } catch (e) {
      setCompletedQuizLevels([]);
    }

    // 오늘 누적 학습 단어 객체 리스트 로드
    try {
      const savedTodayAll = JSON.parse(localStorage.getItem(todayAllKey) || '[]');
      setTodayAllLearnedWords(savedTodayAll);
    } catch (e) {
      setTodayAllLearnedWords([]);
    }

    let savedDailySet = [];
    try {
      savedDailySet = JSON.parse(localStorage.getItem(dailySetKey) || '[]');
    } catch (e) {
      savedDailySet = [];
    }

    if (savedDailySet && savedDailySet.length > 0) {
      setDailyRandomWords(savedDailySet);
    } else {
      const newRandomSet = generateDailyRandomWords(currentUser, wordList);
      setDailyRandomWords(newRandomSet);
      localStorage.setItem(dailySetKey, JSON.stringify(newRandomSet));
      // 1회차 세트를 오늘 누적 학습 단어에 기본 등록
      setTodayAllLearnedWords(newRandomSet);
      localStorage.setItem(todayAllKey, JSON.stringify(newRandomSet));
    }
  }, [currentUser, isLoggedIn, todayStr, wordList, generateDailyRandomWords]);

  // 🚀 [다음 단어 학습] 추가 세트 로드 함수 (오늘 누적 학습 단어 목록 확장)
  const handleLoadNextWordSet = () => {
    if (!currentUser) return;
    const userId = currentUser.id;
    const dailyCount = parseInt(currentUser.dailyWordCount || 10, 10);
    const learnedKey = `learned_words_${userId}`;
    const todayAllKey = `today_all_learned_${currentUser.id}_${todayStr}`;

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
    localStorage.setItem(`daily_random_set_${userId}_${todayStr}`, JSON.stringify(nextRandomSet));

    // 오늘 누적 학습 단어 전체 객체 배열 업데이트
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

  const safeActiveWords = dailyRandomWords.length > 0
    ? dailyRandomWords
    : wordList.slice(0, currentUser ? parseInt(currentUser.dailyWordCount || 10, 10) : 10);

  const currentWord = safeActiveWords[currentIndex] || safeActiveWords[0] || wordList[0];

  const cleanWordStr = (currentWord?.word || '').replace(/\.png/gi, '').trim();
  const rawExampleEn = (currentWord?.exampleEn || '').replace(/\.png/gi, '').trim();
  const rawExampleKo = (currentWord?.exampleKo || '').replace(/\.png/gi, '').trim();

  const isRealSentenceEn = rawExampleEn && rawExampleEn.split(/\s+/).length >= 2 && !rawExampleEn.toLowerCase().endsWith('.png');
  const isRealSentenceKo = rawExampleKo && rawExampleKo.split(/\s+/).length >= 2 && !rawExampleKo.toLowerCase().endsWith('.png');

  const displayExampleEn = isRealSentenceEn
    ? rawExampleEn
    : `I see a nice ${cleanWordStr.toLowerCase()}.`;

  const displayExampleKo = isRealSentenceKo
    ? rawExampleKo
    : `나는 멋진 ${currentWord?.meaning || cleanWordStr}을(를) 본다.`;

  // 1. 단어 전용 🔊 TTS 음성 재생 함수
  const playWordAudio = useCallback((wordText) => {
    if ('speechSynthesis' in window) {
      const text = wordText || cleanWordStr;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [cleanWordStr]);

  // 2. 🔊 예문 문장 전용 원어민 TTS 음성 재생 함수
  const playSentenceAudio = useCallback((sentenceText) => {
    if ('speechSynthesis' in window) {
      const textToSpeak = sentenceText || displayExampleEn;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [displayExampleEn]);

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
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : safeActiveWords.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setRecordedAudioUrl(null);

    if (currentIndex + 1 >= safeActiveWords.length) {
      alert('🎉 선택한 세트 단어를 모두 보았습니다! 1단계 소리 퀴즈로 자동 이동합니다!');
      setMainTab('quiz');
      setCurrentIndex(0);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 실시간 음성 높낮이 파동 Visualizer
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

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

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        if (currentUser) {
          setHasRecorded(true);
          localStorage.setItem(`record_mission_${currentUser.id}_${todayStr}`, 'true');
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

  // 💮 클라우드 DB & localStorage 출석 도장 찍기 및 오늘 공부한 전체 단어 세트 저장 함수
  const handleStampAttendance = useCallback(async () => {
    if (!currentUser) return;
    const stampKey = `english_stamps_${currentUser.id}`;
    const stampedWordsKey = `stamped_words_${currentUser.id}_${todayStr}`;
    const wordsToSave = todayAllLearnedWords.length > 0 ? todayAllLearnedWords : safeActiveWords;

    // 1. Supabase 클라우드 DB에 출석도장 및 오늘 학습한 전체 단어 세트 저장
    try {
      await supabase.from('student_attendance').insert([{
        user_id: currentUser.id,
        stamped_date: todayStr,
        stamped_words: wordsToSave
      }]);
    } catch (e) {
      console.log('Cloud attendance save fallback');
    }

    // 2. localStorage 백업 저장
    let stamps = [];
    try {
      stamps = JSON.parse(localStorage.getItem(stampKey) || '[]');
    } catch (e) {
      stamps = [];
    }
    if (!stamps.includes(todayStr)) {
      stamps.push(todayStr);
      localStorage.setItem(stampKey, JSON.stringify(stamps));
    }

    localStorage.setItem(stampedWordsKey, JSON.stringify(wordsToSave));
  }, [currentUser, todayStr, todayAllLearnedWords, safeActiveWords]);

  // 💡 2단계 퀴즈 완수 시 출석 도장 찍기 수행!
  const handleQuizLevelComplete = (level) => {
    if (!currentUser) return;
    const updated = [...new Set([...completedQuizLevels, level])];
    setCompletedQuizLevels(updated);
    localStorage.setItem(`quiz_mission_${currentUser.id}_${todayStr}`, JSON.stringify(updated));

    if (level === 2) {
      handleStampAttendance();
      setTimeout(() => {
        alert(`🎉 축하합니다! 2단계 퀴즈까지 완수하여 오늘 필수 학습 출석 도장이 찍혔습니다! 💮\n(오늘 총 ${todayAllLearnedWords.length || safeActiveWords.length}개 단어 학습 완료!)\n\n더 공부하고 싶다면 [🚀 다음 단어 학습] 버튼을 누르세요!`);
        setMainTab('calendar');
      }, 300);
    }
  };

  const isQuizL2Done = completedQuizLevels.includes(2);

  // 🖼️ 534개 word_img 전용 이미지 주소 생성 로직
  const getWordImgSrc = (wordObj) => {
    if (!wordObj || !wordObj.word) return '/word_img/Apple.png';
    const wordClean = wordObj.word.replace(/\.png/gi, '').trim();
    const wordCap = wordClean.charAt(0).toUpperCase() + wordClean.slice(1);
    return `/word_img/${wordCap}.png`;
  };

  const handleImageError = (e, wordStr) => {
    const target = e.target;
    const currentSrc = target.src;
    const wordLower = wordStr.replace(/\.png/gi, '').toLowerCase().trim();

    if (!currentSrc.includes(`/${wordLower}.png`)) {
      target.src = `/word_img/${wordLower}.png`;
    } else {
      target.style.display = 'none';
    }
  };

  // 🔒 로그인되지 않았을 때는 무조건 [학생/학부모 로그인 관문 페이지]만 표시!
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
      {/* 🧹 학부모 탭일 때는 학생 헤더 바 숨김! */}
      {mainTab !== 'parent' && (
        <UserManager currentUser={currentUser} setCurrentUser={setCurrentUser} onLogout={handleLogout} />
      )}

      {/* 🧹 학부모 탭일 때는 학생용 미션 스마트 버튼 바 숨김! */}
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
              🔥 오늘 {studyRound}회차 학습 중!
            </span>

            <button
              onClick={() => setShowTodayAllModal(true)}
              style={{ background: '#27AE60', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(39,174,96,0.2)' }}
              title="오늘 1회차+2회차 등 지금까지 공부한 모든 단어 리스트 한눈에 보기"
            >
              📖 오늘 총 {todayAllLearnedWords.length || safeActiveWords.length}개 단어 전체 보기
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
                  📖 오늘 학습한 단어 전체 리스트
                </h3>
                <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                  🔥 오늘 제 {studyRound}회차 학습까지 총 {todayAllLearnedWords.length || safeActiveWords.length}개 단어 완수!
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

      {/* 메인 7대 탭 메뉴 */}
      <nav className="main-tab-nav" style={{ gap: '2px' }}>
        <button
          className={`main-tab-btn ${mainTab === 'flashcard' ? 'active' : ''}`}
          onClick={() => setMainTab('flashcard')}
        >
          🎴 플래시카드
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'wordlist' ? 'active' : ''}`}
          onClick={() => setMainTab('wordlist')}
        >
          📋 단어 리스트
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'quiz' ? 'active' : ''}`}
          onClick={() => setMainTab('quiz')}
        >
          ❓ 퀴즈
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'myvocab' ? 'active' : ''}`}
          onClick={() => setMainTab('myvocab')}
        >
          ⭐ 나만의 단어장
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'wrongvocab' ? 'active' : ''}`}
          onClick={() => setMainTab('wrongvocab')}
          style={{ background: mainTab === 'wrongvocab' ? '#E74C3C' : 'transparent', color: mainTab === 'wrongvocab' ? 'white' : '#C0392B', fontWeight: 'bold' }}
        >
          ❌ 퀴즈 오답노트 ☁️
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setMainTab('calendar')}
        >
          📅 출석
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'parent' ? 'active' : ''}`}
          onClick={() => setMainTab('parent')}
          style={{ background: mainTab === 'parent' ? '#9B59B6' : 'transparent', color: mainTab === 'parent' ? 'white' : '#8E44AD' }}
        >
          👨‍👩‍👧‍👦 학부모
        </button>
      </nav>

      {/* 탭 1: 플래시카드 학습 코스 */}
      {mainTab === 'flashcard' && (
        <>
          <header className="app-header">
            <h1 className="app-title" style={{ margin: 0 }}>초등 필수 영단어 500</h1>
          </header>

          <div className="flashcard-wrapper">
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
              {/* 앞면: 그림 + 영단어 + 발음기호 + 한글 뜻 */}
              <div className="card-face card-front">
                <span className="card-category-badge">
                  {currentWord?.gradeLevel || '초등단어'} • {currentWord?.category}
                </span>

                <div style={{ width: '130px', height: '130px', margin: '6px 0', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img
                    src={getWordImgSrc(currentWord)}
                    alt={cleanWordStr}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                    onError={(e) => handleImageError(e, cleanWordStr)}
                  />
                </div>

                <h2 className="word-en" style={{ margin: '4px 0 0 0' }}>{cleanWordStr}</h2>
                <p className="word-phonics" style={{ margin: '2px 0 0 0' }}>{currentWord?.phonics}</p>
                <h3 className="word-ko" style={{ margin: '4px 0 0 0', fontSize: '24px', color: '#FF6B6B' }}>{currentWord?.meaning}</h3>

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

            {/* 마이크 녹음 및 실시간 음성 파동/높낮이 Visualizer 그래프 */}
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

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                {!isRecording ? (
                  <button className="record-btn" onClick={startRecording} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🎙️ 녹음 시작 (음성 높낮이 보기)
                  </button>
                ) : (
                  <button className="record-btn recording" onClick={stopRecording} style={{ background: '#27AE60', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', animation: 'pulse 1s infinite' }}>
                    ⏹️ 녹음 완료
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
        <WordListSection words={safeActiveWords} onPlayAudio={playWordAudio} />
      )}

      {/* 탭 3: 영단어 퀴즈 */}
      {mainTab === 'quiz' && (
        <QuizSection
          currentUser={currentUser}
          activeWords={safeActiveWords}
          onQuizLevelComplete={handleQuizLevelComplete}
          onLoadNextWordSet={handleLoadNextWordSet}
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

      {/* 탭 6: 출석 달력 */}
      {mainTab === 'calendar' && (
        <CalendarSection currentUser={currentUser} onLoadNextWordSet={handleLoadNextWordSet} />
      )}

      {/* 탭 7: 학부모 리포트 */}
      {mainTab === 'parent' && (
        <ParentDashboard currentUser={currentUser} onLogout={handleLogout} />
      )}
    </main>
  );
}
