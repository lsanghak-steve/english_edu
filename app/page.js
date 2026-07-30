'use client';

import { useState, useEffect, useRef } from 'react';
import wordList500 from '../data/wordsData.js';
import UserManager from './components/UserManager';
import QuizSection from './components/QuizSection';
import CalendarSection from './components/CalendarSection';

export default function Home() {
    const [mainTab, setMainTab] = useState('flashcard'); // 'flashcard', 'quiz', 'calendar'
    const [currentUser, setCurrentUser] = useState(null);

    // 플래시카드 상태
    const [words, setWords] = useState([]);
    const [filteredWords, setFilteredWords] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('전체 보기');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // 음성 녹음 상태 (MediaRecorder)
    const [isRecording, setIsRecording] = useState(false);
    const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        const initialWords = Array.isArray(wordList500) ? wordList500 : (wordList500.default || []);
        setWords(initialWords);
        setFilteredWords(initialWords);

        const cats = ['전체 보기', ...new Set(initialWords.map(w => w.category).filter(Boolean))];
        setCategories(cats);
    }, []);

    useEffect(() => {
        if (currentUser && currentUser.dailyWordCount && words.length > 0) {
            const count = parseInt(currentUser.dailyWordCount);
            if (selectedCategory === '전체 보기') {
                setFilteredWords(words.slice(0, count));
            }
        }
    }, [currentUser, words, selectedCategory]);

    const handleCategoryChange = (e) => {
        const cat = e.target.value;
        setSelectedCategory(cat);
        setCurrentIndex(0);
        setIsFlipped(false);
        setRecordedAudioUrl(null);

        if (cat === '전체 보기') {
            const count = currentUser ? parseInt(currentUser.dailyWordCount || 10) : words.length;
            setFilteredWords(words.slice(0, count));
        } else {
            setFilteredWords(words.filter(w => w.category === cat));
        }
    };

    const handleShuffle = () => {
        const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
        setFilteredWords(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setRecordedAudioUrl(null);
    };

    const handlePrev = () => {
        if (filteredWords.length === 0) return;
        setIsFlipped(false);
        setRecordedAudioUrl(null);
        setCurrentIndex(prev => (prev === 0 ? filteredWords.length - 1 : prev - 1));
    };

    const handleNext = () => {
        if (filteredWords.length === 0) return;
        setIsFlipped(false);
        setRecordedAudioUrl(null);
        setCurrentIndex(prev => (prev === filteredWords.length - 1 ? 0 : prev + 1));
    };

    const handleCardClick = () => {
        setIsFlipped(prev => !prev);
    };

    // 정식 발음 재생 (TTS)
    const handleAudio = (e, word) => {
        e.stopPropagation();
        if ('speechSynthesis' in window && word) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    };

    // 내 발음 녹음 시작 / 중지 토글
    const handleToggleRecord = async (e) => {
        e.stopPropagation();
        if (isRecording) {
            // 녹음 중지
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            // 녹음 시작
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const url = URL.createObjectURL(audioBlob);
                    setRecordedAudioUrl(url);
                    stream.getTracks().forEach(track => track.stop()); // 마이크 끄기
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                alert('마이크 접근 권한이 필요합니다.');
            }
        }
    };

    // 내 녹음 소리 재생
    const handlePlayMyAudio = (e) => {
        e.stopPropagation();
        if (recordedAudioUrl) {
            const audio = new Audio(recordedAudioUrl);
            audio.play();
        }
    };

    const currentWord = filteredWords[currentIndex] || {};
    const imgPath = currentWord.word ? `/p_img/${currentWord.word}.png` : '/p_img/apple.png';

    return (
        <div className="app-container">
            {/* 상단 다중 학생 & 관리자 시스템 */}
            <UserManager currentUser={currentUser} setCurrentUser={setCurrentUser} />

            {/* 메인 탭 네비게이션 */}
            <div className="main-tab-nav">
                <button
                    className={`main-tab-btn ${mainTab === 'flashcard' ? 'active' : ''}`}
                    onClick={() => setMainTab('flashcard')}
                >
                    🎴 3D 플래시카드
                </button>
                <button
                    className={`main-tab-btn ${mainTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setMainTab('quiz')}
                >
                    ❓ 퀴즈 & 오답노트
                </button>
                <button
                    className={`main-tab-btn ${mainTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setMainTab('calendar')}
                >
                    📅 출석 달력
                </button>
            </div>

            {/* 탭별 화면 렌더링 */}
            {mainTab === 'flashcard' && (
                <>
                    {/* 상단 컨트롤 */}
                    <header className="app-header">
                        <h1 className="app-title">✨ 초등 영단어 500선</h1>
                        <div className="controls-row">
                            <select
                                className="select-category"
                                value={selectedCategory}
                                onChange={handleCategoryChange}
                            >
                                {categories.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <button className="btn-action" onClick={handleShuffle}>🎲 셔플</button>
                        </div>
                    </header>

                    {/* 3D 플래시카드 영역 (녹음 🎙️ 및 들어보기 ▶️) */}
                    <main className="card-scene" onClick={handleCardClick}>
                        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                            {/* 앞면 */}
                            <div className="card-face card-front">
                                <div className="card-img-wrapper">
                                    <img
                                        className="card-img"
                                        src={imgPath}
                                        alt={currentWord.word || '단어 이미지'}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Word+Image'; }}
                                    />
                                </div>
                                <div className="word-info-right">
                                    <h2 className="word-en">{currentWord.word || 'Apple'}</h2>
                                    <p className="word-phonics">{currentWord.phonics || '[æpl]'}</p>
                                    
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                                        <button
                                            className="audio-btn"
                                            title="원어민 발음 듣기"
                                            onClick={(e) => handleAudio(e, currentWord.word)}
                                        >
                                            🔊
                                        </button>
                                        <button
                                            className={`record-btn ${isRecording ? 'recording' : ''}`}
                                            title={isRecording ? '녹음 중지' : '내 발음 녹음하기'}
                                            onClick={handleToggleRecord}
                                        >
                                            {isRecording ? '⏹️' : '🎙️'}
                                        </button>
                                    </div>

                                    {recordedAudioUrl && (
                                        <button className="btn-play-my-audio" onClick={handlePlayMyAudio}>
                                            ▶️ 내 발음 듣기
                                        </button>
                                    )}
                                </div>
                                <p className="flip-hint-bottom">👆 카드를 터치하면 뒤집혀요!</p>
                            </div>

                            {/* 뒷면 */}
                            <div className="card-face card-back">
                                <h2 className="meaning-kr">{currentWord.meaning || '사과'}</h2>
                                <div className="example-box">
                                    <p className="example-en">{currentWord.exampleEn || 'I eat an apple.'}</p>
                                    <p className="example-ko">{currentWord.exampleKo || '나는 사과를 먹어요.'}</p>
                                </div>
                                <p className="flip-hint-bottom">👆 터치하면 앞면으로 돌아갑니다</p>
                            </div>
                        </div>
                    </main>

                    {/* 하단 탐색 버튼 */}
                    <footer className="nav-controls">
                        <button className="btn-nav" title="이전 단어" onClick={handlePrev}>◀</button>
                        <span className="progress-text">
                            {filteredWords.length > 0 ? `${currentIndex + 1} / ${filteredWords.length}` : '0 / 0'}
                        </span>
                        <button className="btn-nav" title="다음 단어" onClick={handleNext}>▶</button>
                    </footer>
                </>
            )}

            {mainTab === 'quiz' && <QuizSection currentUser={currentUser} />}

            {mainTab === 'calendar' && <CalendarSection currentUser={currentUser} />}
        </div>
    );
}
