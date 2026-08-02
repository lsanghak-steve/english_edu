'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import wordList500 from '../data/wordsData.js';
import UserManager from './components/UserManager.js';
import QuizSection from './components/QuizSection.js';
import WordListSection from './components/WordListSection.js';
import CalendarSection from './components/CalendarSection.js';

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [mainTab, setMainTab] = useState('flashcard'); // 'flashcard', 'wordlist', 'quiz', 'calendar'
  const [category, setCategory] = useState('전체');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 미션 상태: 1차 녹음 수행 및 퀴즈 2단계 완수 추적
  const [hasRecorded, setHasRecorded] = useState(false);
  const [completedQuizLevels, setCompletedQuizLevels] = useState([]);
  const [isTodayComplete, setIsTodayComplete] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentUser) return;
    const recKey = `record_mission_${currentUser.id}_${todayStr}`;
    const quizKey = `quiz_mission_${currentUser.id}_${todayStr}`;

    setHasRecorded(localStorage.getItem(recKey) === 'true');
    try {
      const storedQuiz = JSON.parse(localStorage.getItem(quizKey) || '[]');
      setCompletedQuizLevels(storedQuiz);
    } catch (e) {
      setCompletedQuizLevels([]);
    }
  }, [currentUser, todayStr]);

  const categories = ['전체', ...new Set(wordList500.map(w => w.category))];

  const filteredWords = wordList500.filter(w => {
    if (category === '전체') return true;
    return w.category === category;
  });

  const activeWords = filteredWords.slice(0, currentUser ? parseInt(currentUser.dailyWordCount || 10) : 10);
  const currentWord = activeWords[currentIndex] || activeWords[0] || wordList500[0];

  const playAudio = useCallback((textToPlay) => {
    const text = textToPlay || currentWord?.word;
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentWord]);

  // 플래시카드가 보일 때(카드 전환, 탭 이동 등) 자동으로 발음 소리 재생!
  useEffect(() => {
    if (mainTab === 'flashcard' && currentWord) {
      const timer = setTimeout(() => {
        playAudio(currentWord.word);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [mainTab, currentIndex, category, currentWord, playAudio]);

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('.audio-btn') || e.target.closest('.record-btn')) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setRecordedAudioUrl(null);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : activeWords.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setRecordedAudioUrl(null);
    setCurrentIndex(prev => (prev < activeWords.length - 1 ? prev + 1 : 0));
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setRecordedAudioUrl(null);
    const rand = Math.floor(Math.random() * activeWords.length);
    setCurrentIndex(rand);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // 1차 발음 녹음 미션 성공 기록!
        if (currentUser) {
          setHasRecorded(true);
          localStorage.setItem(`record_mission_${currentUser.id}_${todayStr}`, 'true');
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecordedAudio = () => {
    if (recordedAudioUrl) {
      const audio = new Audio(recordedAudioUrl);
      audio.play();
    }
  };

  // 퀴즈 레벨 완수 처리
  const handleQuizLevelComplete = (level) => {
    if (!currentUser) return;
    const updated = [...new Set([...completedQuizLevels, level])];
    setCompletedQuizLevels(updated);
    localStorage.setItem(`quiz_mission_${currentUser.id}_${todayStr}`, JSON.stringify(updated));
  };

  // 학습 완료 조건 달성 여부 (녹음 1회 이상 + 퀴즈 1단계/2단계 완수)
  const isQuizL2Done = completedQuizLevels.includes(1) && completedQuizLevels.includes(2);
  const canShowCompleteBtn = hasRecorded && isQuizL2Done;

  // 출석 도장 쾅 찍기
  const handleStampAttendance = () => {
    if (!currentUser) return;
    const stampKey = `english_stamps_${currentUser.id}`;
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
    setIsTodayComplete(true);
    alert('🎉 참잘했어요 도장이 출석 달력에 등록되었습니다! 💮');
    setMainTab('calendar');
  };

  return (
    <main className="app-container">
      {/* 상단 학생 헤더 바 및 모달 제어 */}
      <UserManager currentUser={currentUser} setCurrentUser={setCurrentUser} />

      {/* 학습 완료 조건 만족 시 자동으로 등장하는 축하 버튼 */}
      {canShowCompleteBtn && (
        <div style={{ width: '100%', animation: 'pulse 1.5s infinite' }}>
          <button
            onClick={handleStampAttendance}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '20px',
              border: 'none',
              background: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(46, 204, 113, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🎉 오늘 미션 완료! 💮 참잘했어요 도장 찍기
          </button>
        </div>
      )}

      {/* 실시간 미션 가이드 바 */}
      <div style={{ width: '100%', background: '#F8F9FA', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '10px 14px', fontSize: '12px', display: 'flex', justifyContent: 'space-around' }}>
        <span style={{ color: hasRecorded ? '#27AE60' : '#7F8C8D', fontWeight: 'bold' }}>
          {hasRecorded ? '✅ 발음 녹음 완료' : '🎙️ 1차 녹음 미션'}
        </span>
        <span style={{ color: isQuizL2Done ? '#27AE60' : '#7F8C8D', fontWeight: 'bold' }}>
          {isQuizL2Done ? '✅ 퀴즈 2단계 완수' : '🧩 퀴즈 2단계 미션'}
        </span>
      </div>

      {/* 메인 4대 탭 메뉴 */}
      <nav className="main-tab-nav">
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
          ❓ 퀴즈 & 오답
        </button>
        <button
          className={`main-tab-btn ${mainTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setMainTab('calendar')}
        >
          📅 출석 달력
        </button>
      </nav>

      {/* 탭 1: 플래시카드 학습 */}
      {mainTab === 'flashcard' && (
        <>
          <header className="app-header">
            <h1 className="app-title">초등 필수 영단어 500</h1>
            <div className="controls-row">
              <select
                className="select-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
              <button className="btn-action" onClick={handleShuffle}>🎲 섞기</button>
            </div>
          </header>

          <div className="card-scene" onClick={handleCardClick}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
              {/* 앞면 카드 */}
              <div className="card-face card-front">
                <div className="card-img-wrapper">
                  <img
                    src={`/word_img/${currentWord.word}.png`}
                    alt={currentWord.word}
                    className="card-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/word_img/Apple.png';
                    }}
                  />
                </div>
                <div className="word-info-right">
                  <h2 className="word-en">{currentWord.word}</h2>
                  <p className="word-phonics">{currentWord.phonics}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                    <button
                      className="audio-btn"
                      onClick={(e) => { e.stopPropagation(); playAudio(currentWord.word); }}
                      title="원어민 발음 듣기"
                    >
                      🔊
                    </button>
                    <button
                      className={`record-btn ${isRecording ? 'recording' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        isRecording ? stopRecording() : startRecording();
                      }}
                      title="내 발음 녹음하기"
                    >
                      🎙️
                    </button>
                  </div>
                  {recordedAudioUrl && (
                    <button
                      className="btn-play-my-audio"
                      onClick={(e) => { e.stopPropagation(); playRecordedAudio(); }}
                    >
                      ▶️ 내 녹음 듣기
                    </button>
                  )}
                </div>
                <div className="flip-hint-bottom">👆 터치하여 뜻 보기</div>
              </div>

              {/* 뒷면 카드 */}
              <div className="card-face card-back">
                <h2 className="meaning-kr">{currentWord.meaning}</h2>
                <div className="example-box">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <p className="example-en" style={{ margin: 0 }}>{currentWord.exampleEn}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); playAudio(currentWord.exampleEn); }}
                      style={{
                        background: '#E8F8F5',
                        border: '1px solid #2ECC71',
                        color: '#27AE60',
                        borderRadius: '12px',
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                      title="예문 원어민 소리 듣기"
                    >
                      🔊 예문 듣기
                    </button>
                  </div>
                  <p className="example-ko">{currentWord.exampleKo}</p>
                </div>
                <div className="flip-hint-bottom">👆 터치하면 앞면으로 돌아갑니다</div>
              </div>
            </div>
          </div>

          <div className="nav-controls">
            <button className="btn-nav" onClick={handlePrev}>◀</button>
            <span className="progress-text">{currentIndex + 1} / {activeWords.length}</span>
            <button className="btn-nav" onClick={handleNext}>▶</button>
          </div>
        </>
      )}

      {/* 탭 2: 단어 리스트 보기 */}
      {mainTab === 'wordlist' && (
        <WordListSection activeWords={activeWords} playAudio={playAudio} />
      )}

      {/* 탭 3: 퀴즈 & 오답노트 */}
      {mainTab === 'quiz' && (
        <QuizSection
          currentUser={currentUser}
          activeWords={activeWords}
          onQuizLevelComplete={handleQuizLevelComplete}
        />
      )}

      {/* 탭 4: 출석 달력 */}
      {mainTab === 'calendar' && (
        <CalendarSection currentUser={currentUser} />
      )}
    </main>
  );
}
