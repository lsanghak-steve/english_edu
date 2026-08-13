'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../../lib/supabaseClient.js';

export default function QuizSection({ currentUser, activeWords, onQuizLevelComplete, onLoadNextWordSet, initialQuizLevel = 1 }) {
  const [quizLevel, setQuizLevel] = useState(initialQuizLevel || 1); // 1: 소리, 2: 선택, 3: 발음 녹음(75점+), 4: 직접 입력
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedInput, setTypedInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  // 🎙️ 3단계 녹음 퀴즈 전용 상태값
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const safeWords = activeWords && activeWords.length > 0 ? activeWords : [];
  const currentQuiz = safeWords[currentIndex] || safeWords[0];
  const cleanWordStr = (currentQuiz?.word || '').replace(/\.png/gi, '').trim();

  useEffect(() => {
    if (initialQuizLevel) {
      setQuizLevel(initialQuizLevel);
    }
  }, [initialQuizLevel]);

  // 🔊 TTS 음성 재생
  const playAudio = useCallback((textToPlay) => {
    const text = textToPlay || cleanWordStr;
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [cleanWordStr]);

  // 🎯 레벤슈타인 거리 기반 발음 유사도 점수(0~100점) 계산
  const calculateMatchScore = (targetStr, spokenStr) => {
    if (!targetStr) return 0;
    const cleanTarget = targetStr.toLowerCase().replace(/[^a-z]/g, '');
    const cleanSpoken = (spokenStr || '').toLowerCase().replace(/[^a-z]/g, '');

    if (!cleanSpoken || cleanSpoken.trim() === '') return 15;
    if (cleanTarget === cleanSpoken) return 100;

    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      const ratio = Math.min(cleanTarget.length, cleanSpoken.length) / Math.max(cleanTarget.length, cleanSpoken.length);
      return Math.round(ratio * 90);
    }

    let m = cleanTarget.length, n = cleanSpoken.length;
    let dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (cleanTarget[i - 1] === cleanSpoken[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    const distance = dp[m][n];
    const maxLen = Math.max(m, n);
    const scoreVal = Math.round(((maxLen - distance) / maxLen) * 100);
    return Math.max(0, Math.min(100, scoreVal));
  };

  // 🤖 AI 발음 교정 가이드 팁 분석 엔진
  const getAIPronunciationGuideTip = (targetWordStr, score) => {
    if (!targetWordStr) return null;
    const cleanWord = targetWordStr.toLowerCase().trim();

    if (score !== null && score !== undefined) {
      if (score >= 90) {
        return {
          icon: '🎉',
          title: '🤖 AI 발음 완벽 칭찬!',
          text: `[${targetWordStr}] 원어민 수준의 완벽한 혀 위치와 입모양입니다! 억양과 발음이 아주 부드럽고 훌륭합니다. 👏`,
          color: '#27AE60',
          bg: '#E8F8F5',
          border: '#A3E4D7'
        };
      }
    }

    if (cleanWord.includes('r')) {
      return {
        icon: '👅',
        title: '🤖 AI 혀 위치 교정 팁 [R 발음]',
        text: `R 발음 시 혀끝을 입천장에 대지 않고 입 안쪽으로 살짝 구부려 '우-' 소리를 입안에서 웅얼거리듯 굴려보세요!`,
        color: '#D35400',
        bg: '#FEF9E7',
        border: '#F9E79F'
      };
    }

    if (cleanWord.includes('l')) {
      return {
        icon: '👅',
        title: '🤖 AI 혀 위치 교정 팁 [L 발음]',
        text: `L 발음 시 혀끝을 윗니 바로 뒤 입천장에 꾹 대었다가 '얼-' 소리를 내며 상큼하게 떼어보세요!`,
        color: '#2980B9',
        bg: '#EBF5FB',
        border: '#AED6F1'
      };
    }

    if (cleanWord.includes('th')) {
      return {
        icon: '👄',
        title: '🤖 AI 입모양 교정 팁 [TH 발음]',
        text: `혀끝을 윗니와 아랫니 사이에 살짝 물었다가 바람을 뿜어내며 '쓰-' 또는 '뜨-' 소리를 내보세요!`,
        color: '#8E44AD',
        bg: '#F5EEF8',
        border: '#D7BDE2'
      };
    }

    if (cleanWord.includes('v') || cleanWord.includes('f')) {
      return {
        icon: '👄',
        title: '🤖 AI 입모양 교정 팁 [V / F 발음]',
        text: `윗니로 아랫입술을 가볍게 지그시 누르고 공기를 스치듯이 '쁘-' 또는 '프-' 바람 소리를 불어내보세요!`,
        color: '#C0392B',
        bg: '#FADBD8',
        border: '#F5B7B1'
      };
    }

    if (cleanWord.includes('sh') || cleanWord.includes('ch')) {
      return {
        icon: '👄',
        title: '🤖 AI 입모양 교정 팁 [SH / CH 발음]',
        text: `입술을 앞으로 동그랗게 모으고 공기를 밀어내며 '쉬-' 또는 '치-' 소리를 강하게 만들어보세요!`,
        color: '#16A085',
        bg: '#E8F8F5',
        border: '#A3E4D7'
      };
    }

    return {
      icon: '💡',
      title: '🤖 AI 원어민 억양 교정 팁',
      text: `상단의 🐢 0.7x 슬로우 배속으로 원어민 발음을 들으면서 강세(Accent)가 들어가는 음절을 높여 읽어보세요!`,
      color: '#2980B9',
      bg: '#EBF5FB',
      border: '#AED6F1'
    };
  };

  // 4지선다 보기 무작위 생성
  const generateOptions = useCallback((targetWord) => {
    if (!targetWord || safeWords.length === 0) return [];
    let choices = [targetWord];
    const others = safeWords.filter(w => (w.word || w) !== (targetWord.word || targetWord));
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
      choices.push(shuffledOthers[i]);
    }
    return choices.sort(() => Math.random() - 0.5);
  }, [safeWords]);

  useEffect(() => {
    if (currentQuiz) {
      const generated = generateOptions(currentQuiz);
      setOptions(generated);
      setSelectedAnswer(null);
      setTypedInput('');
      setIsCorrect(null);
      setSpokenText('');
      setPronunciationScore(null);
      setIsRecording(false);

      if (quizLevel === 1) {
        const timer = setTimeout(() => {
          playAudio(cleanWordStr);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentQuiz, quizLevel, generateOptions, playAudio, cleanWordStr]);

  // ❌ 오답 발생 시 Supabase 클라우드 DB & LocalStorage 오답노트에 저장
  const saveWrongAnswer = async (wordObj) => {
    if (!currentUser || !wordObj) return;
    const wordStr = (wordObj.word || wordObj).replace(/\.png/gi, '').trim();
    const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
    const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    try {
      const payloadMap = new Map();
      payloadMap.set(studentIdToUse, {
        student_id: studentIdToUse,
        word: wordStr,
        meaning: wordObj.meaning || '뜻 정보 없음',
        phonics: wordObj.phonics || '',
        category: wordObj.category || '기초 단어'
      });
      if (studentNameClean) {
        payloadMap.set(studentNameClean, {
          student_id: studentNameClean,
          word: wordStr,
          meaning: wordObj.meaning || '뜻 정보 없음',
          phonics: wordObj.phonics || '',
          category: wordObj.category || '기초 단어'
        });
      }
      await supabase.from('wrong_words').insert(Array.from(payloadMap.values()));
    } catch (e) {}

    const wrongKey = `wrong_answers_${currentUser.id}`;
    let wrongList = [];
    try {
      wrongList = JSON.parse(localStorage.getItem(wrongKey) || '[]');
    } catch (e) {
      wrongList = [];
    }

    const isAlreadyIn = wrongList.some(item => (item.word || item) === wordStr);
    if (!isAlreadyIn) {
      const newWrongItem = {
        id: wordObj.id || Date.now(),
        word: wordStr,
        meaning: wordObj.meaning || '뜻 정보 없음',
        phonics: wordObj.phonics || '',
        category: wordObj.category || '기타',
        addedAt: new Date().toISOString().split('T')[0]
      };
      wrongList.push(newWrongItem);
      localStorage.setItem(wrongKey, JSON.stringify(wrongList));
    }
  };

  const timerRef = useRef(null);
  const isMovingRef = useRef(false);

  // 1, 2단계 4지선다 정답 선택
  const handleAnswerSelect = (optionItem) => {
    if (selectedAnswer !== null || isMovingRef.current) return;
    setSelectedAnswer(optionItem);
    const optionStr = (optionItem.word || optionItem).replace(/\.png/gi, '').trim();

    if (optionStr === cleanWordStr) {
      setIsCorrect(true);
      setScore(prev => prev + 1);
    } else {
      setIsCorrect(false);
      saveWrongAnswer(currentQuiz);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  };

  // 🎙️ 3단계 마이크 발음 녹음 시작 / 종료 및 75점+ 심사
  const startRecordingQuiz = async () => {
    try {
      setIsRecording(true);
      setPronunciationScore(null);
      setSpokenText('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      let recognizedSpokenText = '';
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          if (event.results && event.results[0] && event.results[0][0]) {
            recognizedSpokenText = event.results[0][0].transcript || '';
            setSpokenText(recognizedSpokenText);
          }
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        const finalScore = calculateMatchScore(cleanWordStr, recognizedSpokenText);
        setPronunciationScore(finalScore);

        if (finalScore >= 75) {
          setIsCorrect(true);
          setSelectedAnswer('recorded_pass');
          setScore(prev => prev + 1);

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            handleNextQuestion();
          }, 1500);
        } else {
          setIsCorrect(false);
          setSelectedAnswer('recorded_fail');
          saveWrongAnswer(currentQuiz);
        }
      };

      mediaRecorderRef.current.start();
    } catch (e) {
      alert('🎙️ 마이크 권한을 허용해 주세요!');
      setIsRecording(false);
    }
  };

  const stopRecordingQuiz = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  // 4단계 주관식 입력 제출
  const handleTypedSubmit = (e) => {
    e.preventDefault();
    if (selectedAnswer !== null || !typedInput.trim() || isMovingRef.current) return;

    const userInput = typedInput.trim().toLowerCase();
    const targetWordLower = cleanWordStr.toLowerCase();

    setSelectedAnswer(userInput);
    if (userInput === targetWordLower) {
      setIsCorrect(true);
      setScore(prev => prev + 1);
    } else {
      setIsCorrect(false);
      saveWrongAnswer(currentQuiz);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 1200);
  };

  const handleNextQuestion = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isMovingRef.current) return;
    isMovingRef.current = true;

    setSelectedAnswer(null);
    setIsCorrect(null);
    setTypedInput('');
    setSpokenText('');
    setPronunciationScore(null);

    if (currentIndex + 1 >= safeWords.length) {
      if (quizLevel === 1) {
        alert('🎉 1단계 소리 퀴즈 완료! 필수 완수를 위해 2단계 스펠링 선택 퀴즈로 바로 이동합니다!');
        handleRestart(2);
      } else if (quizLevel === 2) {
        if (onQuizLevelComplete) onQuizLevelComplete(2);
        setIsQuizEnded(true);
        alert('🎉 [오늘 필수 학습 완수!] 2단계 스펠링 선택 퀴즈 완료로 출석 도장(💮)을 받았습니다! 🌟\n\n추가 도전을 원하시면 [3단계 마이크 녹음]이나 [4단계 직접쓰기]를 선택하여 자유롭게 공부하세요!');
      } else if (quizLevel === 3) {
        if (onQuizLevelComplete) onQuizLevelComplete(3);
        setIsQuizEnded(true);
      } else {
        setIsQuizEnded(true);
        if (onQuizLevelComplete) onQuizLevelComplete(4);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }

    setTimeout(() => {
      isMovingRef.current = false;
    }, 300);
  };

  const handleRestart = (level) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isMovingRef.current = false;
    setQuizLevel(level);
    setCurrentIndex(0);
    setScore(0);
    setIsQuizEnded(false);
    setSelectedAnswer(null);
    setTypedInput('');
    setIsCorrect(null);
    setSpokenText('');
    setPronunciationScore(null);
  };

  if (!currentQuiz) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>퀴즈 단어 데이터를 로딩 중입니다...</div>;
  }

  return (
    <div className="quiz-section-card" style={{ padding: '24px', background: '#FFFFFF', borderRadius: '24px', border: '2px solid #E5E5E5', borderBottom: '5px solid #CECECE', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      {/* 4대 퀴즈 레벨 탭 (Level 1~2: 필수, Level 3~4: 선택 심화) */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleRestart(1)}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 1 ? '2px solid #1899D6' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 1 ? '4px solid #1899D6' : '4px solid #CECECE',
            background: quizLevel === 1 ? '#1CB0F6' : '#FFFFFF',
            color: quizLevel === 1 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔊 1단계 소리 (필수)
        </button>
        <button
          onClick={() => handleRestart(2)}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 2 ? '2px solid #46A302' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 2 ? '4px solid #46A302' : '4px solid #CECECE',
            background: quizLevel === 2 ? '#58CC02' : '#FFFFFF',
            color: quizLevel === 2 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🧩 2단계 선택 (필수💮)
        </button>
        <button
          onClick={() => handleRestart(3)}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 3 ? '2px solid #E67E22' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 3 ? '4px solid #D35400' : '4px solid #CECECE',
            background: quizLevel === 3 ? '#FF9600' : '#FFFFFF',
            color: quizLevel === 3 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🎙️ 3단계 녹음 (선택⭐)
        </button>
        <button
          onClick={() => handleRestart(4)}
          style={{
            flex: 1,
            minWidth: '80px',
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 4 ? '2px solid #B75DFF' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 4 ? '4px solid #8E44AD' : '4px solid #CECECE',
            background: quizLevel === 4 ? '#CE82FF' : '#FFFFFF',
            color: quizLevel === 4 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ✍️ 4단계 직접쓰기 (선택⭐)
        </button>
      </div>

      {!isQuizEnded ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '900', color: '#777777', fontSize: '13px' }}>
              문제 {currentIndex + 1} / {safeWords.length}
            </span>
            <span style={{ fontWeight: '900', color: '#58CC02', fontSize: '14px', background: '#E5F8D0', padding: '4px 10px', borderRadius: '10px', border: '1px solid #46A302' }}>
              🔥 점수: {score}점
            </span>
          </div>

          {/* 레벨 1: 소리 퀴즈 */}
          {quizLevel === 1 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F7F7F7', borderRadius: '20px', marginBottom: '20px', border: '2px solid #E5E5E5' }}>
              <button
                onClick={() => playAudio(cleanWordStr)}
                style={{ background: '#1CB0F6', color: 'white', border: 'none', borderBottom: '4px solid #1899D6', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '10px' }}
              >
                🔊 발음 다시 듣기
              </button>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', color: '#3C3C3C' }}>{cleanWordStr}</h3>
              <p style={{ margin: '2px 0 0 0', color: '#777777', fontSize: '14px', fontWeight: 'bold' }}>{currentQuiz.phonics}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#FF9600', fontWeight: '900' }}>
                💡 소리를 듣고 올바른 한글 뜻을 선택하세요!
              </p>
            </div>
          )}

          {/* 레벨 2: 스펠링 선택 퀴즈 */}
          {quizLevel === 2 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F7F7F7', borderRadius: '20px', marginBottom: '20px', border: '2px solid #E5E5E5' }}>
              <span style={{ fontSize: '12px', color: '#58CC02', fontWeight: '900', background: '#E5F8D0', padding: '2px 10px', borderRadius: '8px' }}>스펠링 퀴즈 (필수)</span>
              <h2 style={{ margin: '8px 0', fontSize: '28px', color: '#FF4B4B', fontWeight: '900' }}>
                {currentQuiz.meaning}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#777777', fontWeight: 'bold' }}>
                💡 아래 보기에서 올바른 영어 단어를 선택하세요!
              </p>
            </div>
          )}

          {/* 🚀 [3번 신규 기능] 레벨 3: 마이크 발음 녹음 퀴즈 (75점 이상 합격) */}
          {quizLevel === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 14px', background: '#FFF8F0', borderRadius: '20px', marginBottom: '20px', border: '2px solid #FFE4C4' }}>
              <span style={{ fontSize: '12px', color: '#D35400', fontWeight: '900', background: '#FEF5E7', padding: '4px 10px', borderRadius: '10px', border: '1px solid #FADBD8' }}>
                🎙️ 3단계 신규 마이크 발음 녹음 퀴즈 (75점 이상 합격)
              </span>
              <h2 style={{ margin: '10px 0 4px 0', fontSize: '28px', color: '#2C3E50', fontWeight: '900' }}>
                {currentQuiz.meaning}
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#E67E22', fontWeight: 'bold' }}>
                💡 아래 마이크 버튼을 누르고 영단어 [<strong style={{ color: '#2980B9' }}>{cleanWordStr}</strong>] 발음을 크게 말해보세요!
              </p>

              {/* 녹음 조작 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
                {!isRecording ? (
                  <button
                    onClick={startRecordingQuiz}
                    disabled={selectedAnswer !== null}
                    style={{
                      background: '#FF9600',
                      color: 'white',
                      border: 'none',
                      borderBottom: '4px solid #D35400',
                      padding: '12px 28px',
                      borderRadius: '16px',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🎙️ 녹음 시작
                  </button>
                ) : (
                  <button
                    onClick={stopRecordingQuiz}
                    style={{
                      background: '#FF4B4B',
                      color: 'white',
                      border: 'none',
                      borderBottom: '4px solid #EA2B2B',
                      padding: '12px 28px',
                      borderRadius: '16px',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      animation: 'pulse 1s infinite'
                    }}
                  >
                    ⏹️ 녹음 완료 및 평가
                  </button>
                )}

                <button
                  onClick={() => playAudio(cleanWordStr)}
                  style={{ background: '#1CB0F6', color: 'white', border: 'none', borderBottom: '4px solid #1899D6', padding: '12px 18px', borderRadius: '16px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
                  title="정답 발음 들어보기"
                >
                  🔊 정답 발음 듣기
                </button>
              </div>

              {/* 발음 분석 결과 표시 */}
              {pronunciationScore !== null && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: pronunciationScore >= 75 ? '#E5F8D0' : '#FFDFDF',
                  border: pronunciationScore >= 75 ? '2px solid #46A302' : '2px solid #FF4B4B',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: pronunciationScore >= 75 ? '#46A302' : '#EA2B2B' }}>
                    {pronunciationScore >= 75 ? `🎉 [${pronunciationScore}점] 75점 이상 합격! 🌟` : `❌ [${pronunciationScore}점] 75점 미만 (재도전 필요) 💡`}
                  </div>
                  {spokenText && (
                    <span style={{ fontSize: '12px', color: '#555555' }}>
                      인식된 발음: "{spokenText}" (목표 단어: {cleanWordStr})
                    </span>
                  )}
                </div>
              )}

              {/* 🤖 AI 발음 교정 가이드 팁 카드 */}
              {(() => {
                const aiTip = getAIPronunciationGuideTip(cleanWordStr, pronunciationScore);
                if (!aiTip) return null;
                return (
                  <div
                    style={{
                      margin: '12px 0 6px 0',
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
            </div>
          )}

          {/* 레벨 4: 스펠링 직접 입력 퀴즈 */}
          {quizLevel === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F5EEF8', borderRadius: '20px', marginBottom: '20px', border: '2px solid #E8DAEF' }}>
              <span style={{ fontSize: '12px', color: '#8E44AD', fontWeight: '900', background: '#E8DAEF', padding: '2px 10px', borderRadius: '8px' }}>✍️ 4단계 주관식 스펠링 직접 쓰기</span>
              <h2 style={{ margin: '8px 0', fontSize: '28px', color: '#2C3E50', fontWeight: '900' }}>
                {currentQuiz.meaning}
              </h2>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#8E44AD', fontWeight: 'bold' }}>
                💡 영어 단어 스펠링을 아래 입력란에 직접 입력하세요!
              </p>

              <form onSubmit={handleTypedSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '320px', margin: '0 auto' }}>
                <input
                  type="text"
                  placeholder="예: flashlight"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={selectedAnswer !== null}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', border: '2px solid #CE82FF', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={selectedAnswer !== null || !typedInput.trim()}
                  style={{ background: '#CE82FF', color: 'white', border: 'none', borderBottom: '4px solid #8E44AD', padding: '12px 18px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}
                >
                  제출
                </button>
              </form>
            </div>
          )}

          {/* 1단계 & 2단계 4지선다 보임 선택 */}
          {(quizLevel === 1 || quizLevel === 2) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {options.map((optionItem, idx) => {
                const optStr = (optionItem.word || optionItem).replace(/\.png/gi, '').trim();
                const isSelected = selectedAnswer && (selectedAnswer.word || selectedAnswer).replace(/\.png/gi, '').trim() === optStr;

                let btnBg = '#FFFFFF';
                let btnBorder = '2px solid #E5E5E5';
                let btnBorderBottom = '4px solid #CECECE';
                let btnColor = '#3C3C3C';

                if (selectedAnswer !== null) {
                  if (optStr === cleanWordStr) {
                    btnBg = '#E5F8D0';
                    btnBorder = '2px solid #46A302';
                    btnBorderBottom = '4px solid #46A302';
                    btnColor = '#46A302';
                  } else if (isSelected) {
                    btnBg = '#FFDFDF';
                    btnBorder = '2px solid #FF4B4B';
                    btnBorderBottom = '4px solid #EA2B2B';
                    btnColor = '#EA2B2B';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(optionItem)}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '16px',
                      background: btnBg,
                      border: btnBorder,
                      borderBottom: btnBorderBottom,
                      color: btnColor,
                      fontWeight: '900',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    {quizLevel === 1 ? (optionItem.meaning || optStr) : optStr}
                  </button>
                );
              })}
            </div>
          )}

          {/* 정답/오답 결과 메시지 */}
          {selectedAnswer !== null && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {isCorrect ? (
                <div style={{ color: '#58CC02', fontWeight: '900', fontSize: '18px' }}>
                  🎉 정답입니다! 아주 훌륭해요! 🌟
                </div>
              ) : (
                <div style={{ color: '#FF4B4B', fontWeight: '900', fontSize: '16px' }}>
                  ❌ 아쉽네요 오답입니다! (정답: {cleanWordStr} - {currentQuiz.meaning})
                  <br />
                  <span style={{ fontSize: '12px', color: '#D35400', background: '#FEF5E7', padding: '3px 10px', borderRadius: '8px', marginTop: '6px', display: 'inline-block', border: '1px solid #FADBD8' }}>
                    ☁️ 틀린 단어가 클라우드 DB 오답노트에 자동 저장되었습니다!
                  </span>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                style={{ marginTop: '14px', background: '#3C3C3C', color: 'white', border: 'none', borderBottom: '4px solid #1A1A1A', padding: '12px 28px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                {currentIndex + 1 === safeWords.length ? '다음 단계로 ➔' : '다음 문제 ➔'}
              </button>
            </div>
          )}
        </>
      ) : (
        /* 퀴즈 결과 화면 */
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <h2 style={{ color: '#3C3C3C', margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900' }}>
            {quizLevel === 2 ? '🎉 필수 학습 완수! 출석 도장(💮) 획득! 🏆' : `🎉 ${quizLevel}단계 퀴즈 완수 축하합니다! 🏆`}
          </h2>
          <p style={{ fontSize: '20px', fontWeight: '900', color: '#58CC02', margin: '0 0 14px 0' }}>
            최종 점수: {score} / {safeWords.length}점
          </p>

          {quizLevel === 2 && (
            <p style={{ fontSize: '13px', color: '#D35400', background: '#FEF5E7', padding: '8px 14px', borderRadius: '12px', display: 'inline-block', border: '1px solid #FADBD8', marginBottom: '20px', fontWeight: 'bold' }}>
              🌟 2단계 퀴즈까지 완료하여 오늘 필수 학습 도장이 찍혔습니다!<br />
              더 공부하고 싶다면 아래 선택 심화 퀴즈(3단계 녹음 / 4단계 직접쓰기)에 도전해보세요!
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onLoadNextWordSet && (
              <button
                onClick={onLoadNextWordSet}
                style={{ background: '#58CC02', color: 'white', border: 'none', borderBottom: '4px solid #46A302', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                🚀 다음 10단어 학습 ➔
              </button>
            )}

            {quizLevel <= 2 && (
              <button
                onClick={() => handleRestart(3)}
                style={{ background: '#FF9600', color: 'white', border: 'none', borderBottom: '4px solid #D35400', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                🎙️ 3단계 마이크 녹음 도전 (선택⭐) ➔
              </button>
            )}

            {quizLevel <= 3 && (
              <button
                onClick={() => handleRestart(4)}
                style={{ background: '#CE82FF', color: 'white', border: 'none', borderBottom: '4px solid #8E44AD', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                ✍️ 4단계 주관식 쓰기 도전 (선택⭐) ➔
              </button>
            )}

            <button
              onClick={() => handleRestart(quizLevel)}
              style={{ background: '#1CB0F6', color: 'white', border: 'none', borderBottom: '4px solid #1899D6', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
            >
              🔄 다시 풀기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
