'use client';

import { useState, useCallback, useRef } from 'react';
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

  return (
    <main className="app-container">
      {/* 상단 학생 헤더 바 및 모달 제어 */}
      <UserManager currentUser={currentUser} setCurrentUser={setCurrentUser} />

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

              {/* 뒷면 카드 (예문 🔊 소리 듣기 버튼 장착) */}
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
        <QuizSection currentUser={currentUser} activeWords={activeWords} />
      )}

      {/* 탭 4: 출석 달력 */}
      {mainTab === 'calendar' && (
        <CalendarSection currentUser={currentUser} />
      )}
    </main>
  );
}
