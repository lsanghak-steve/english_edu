'use client';

import { useState, useEffect, useCallback } from 'react';
import wordList500 from '../../data/wordsData.js';

export default function QuizSection({ currentUser, activeWords, onQuizLevelComplete }) {
    const [quizLevel, setQuizLevel] = useState(1); // 1: 소리-뜻 퀴즈, 2: 소리-영단어 선택 퀴즈, 3: 스펠링 직접 쓰기 퀴즈
    const [quizPool, setQuizPool] = useState([]); // 오늘 공부하는 전체 단어 리스트
    const [shuffledQuestions, setShuffledQuestions] = useState([]); // 중복 없는 퀴즈 문제 순서 배열
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 문제 번호 (0 ~ total - 1)
    const [score, setScore] = useState(0); // 맞힌 개수
    const [isFinished, setIsFinished] = useState(false); // 퀴즈 완료 여부

    const [options, setOptions] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [spellingInput, setSpellingInput] = useState('');
    const [wrongWords, setWrongWords] = useState([]);
    const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'wrong'

    const getWrongWordsKey = useCallback(() => {
        return currentUser ? `english_wrong_words_${currentUser.id}` : 'english_wrong_words';
    }, [currentUser]);

    // 플래시카드 단어 리스트(activeWords) 수신 및 퀴즈 풀(pool) 확보
    useEffect(() => {
        let pool = [];
        if (Array.isArray(activeWords) && activeWords.length > 0) {
            pool = activeWords;
        } else {
            const count = currentUser ? parseInt(currentUser.dailyWordCount || 10) : 10;
            pool = wordList500.slice(0, count);
        }
        setQuizPool(pool);
    }, [activeWords, currentUser]);

    // 오답 목록 로드
    useEffect(() => {
        const key = getWrongWordsKey();
        const stored = localStorage.getItem(key);
        if (stored) {
            try { setWrongWords(JSON.parse(stored)); } catch (e) { setWrongWords([]); }
        } else {
            setWrongWords([]);
        }
    }, [currentUser, getWrongWordsKey]);

    const saveWrongWords = (newList) => {
        setWrongWords(newList);
        localStorage.setItem(getWrongWordsKey(), JSON.stringify(newList));
    };

    // 소리 재생 (TTS)
    const playWordAudio = useCallback((word) => {
        if ('speechSynthesis' in window && word) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    }, []);

    // 퀴즈 초기화 및 셔플 (중복 문제 방지)
    const initQuizSet = useCallback(() => {
        if (!quizPool || quizPool.length === 0) return;
        const shuffled = [...quizPool].sort(() => Math.random() - 0.5);
        setShuffledQuestions(shuffled);
        setCurrentIndex(0);
        setScore(0);
        setIsFinished(false);
        setSelectedAnswer(null);
        setIsCorrect(null);
        setSpellingInput('');
    }, [quizPool]);

    useEffect(() => {
        initQuizSet();
    }, [quizLevel, quizPool, initQuizSet]);

    // 현재 문제 데이터
    const currentQuestion = shuffledQuestions[currentIndex] || null;

    // 1단계(소리-뜻) & 2단계(소리-영단어 선택) 보기 4개 구성
    useEffect(() => {
        if ((quizLevel === 1 || quizLevel === 2) && currentQuestion && !isFinished) {
            setTimeout(() => {
                playWordAudio(currentQuestion.word);
            }, 300);

            const wrongOpts = [];
            const backupPool = quizPool.length >= 4 ? quizPool : wordList500;
            while (wrongOpts.length < 3) {
                const rand = Math.floor(Math.random() * backupPool.length);
                if (backupPool[rand].word !== currentQuestion.word && !wrongOpts.some(w => w.word === backupPool[rand].word)) {
                    wrongOpts.push(backupPool[rand]);
                }
            }
            const allOpts = [currentQuestion, ...wrongOpts].sort(() => Math.random() - 0.5);
            setOptions(allOpts);
        }
    }, [quizLevel, currentIndex, currentQuestion, quizPool, isFinished, playWordAudio]);

    // 다음 문제로 이동 처리
    const moveToNextQuestion = (correct, questionWordObj) => {
        if (correct) {
            setScore(prev => prev + 1);
        } else {
            if (!wrongWords.some(w => w.word === questionWordObj.word)) {
                const updated = [...wrongWords, questionWordObj];
                saveWrongWords(updated);
            }
        }

        setTimeout(() => {
            if (currentIndex + 1 < shuffledQuestions.length) {
                setCurrentIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
                setSpellingInput('');
            } else {
                setIsFinished(true);
                if (onQuizLevelComplete) {
                    onQuizLevelComplete(quizLevel);
                }
            }
        }, 1500);
    };

    // 객관식 선택 제출 (1단계 소리-뜻 / 2단계 소리-영단어 선택)
    const handleMultipleChoiceSelect = (opt) => {
        if (selectedAnswer !== null || !currentQuestion) return;
        setSelectedAnswer(opt);

        const correct = opt.word === currentQuestion.word;
        setIsCorrect(correct);

        moveToNextQuestion(correct, currentQuestion);
    };

    // 3단계 (스펠링 직접 쓰기) 답안 제출
    const handleLevel3Submit = (e) => {
        e.preventDefault();
        if (!spellingInput.trim() || selectedAnswer !== null || !currentQuestion) return;

        const userInputStr = spellingInput.trim().toLowerCase();
        const correctStr = currentQuestion.word.trim().toLowerCase();
        const correct = userInputStr === correctStr;

        setSelectedAnswer(spellingInput);
        setIsCorrect(correct);

        moveToNextQuestion(correct, currentQuestion);
    };

    const handleRemoveWrongWord = (wordStr) => {
        const updated = wrongWords.filter(w => w.word !== wordStr);
        saveWrongWords(updated);
    };

    return (
        <div className="quiz-container">
            <div className="quiz-tab-buttons">
                <button
                    className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                >
                    ❓ 영단어 퀴즈
                </button>
                <button
                    className={`tab-btn ${activeTab === 'wrong' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wrong')}
                >
                    📖 오답노트 ({wrongWords.length})
                </button>
            </div>

            {activeTab === 'quiz' ? (
                <div className="quiz-card">
                    {/* 퀴즈 상단 단어 리스트 박스 */}
                    <div style={{ background: '#FFF9E6', border: '2px solid #FFE66D', borderRadius: '16px', padding: '12px 14px', marginBottom: '16px', textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#D35400', marginBottom: '8px' }}>
                            📋 오늘 공부하는 단어 리스트 ({quizPool.length}개)
                            <span style={{ fontSize: '11px', color: '#7F8C8D', marginLeft: '6px', fontWeight: 'normal' }}>
                                {quizLevel === 1 ? '(뜻 히든 - 영단어 노출)' : quizLevel === 2 ? '(영단어/뜻 전체 히든)' : '(영단어 히든 - 뜻 노출)'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {quizPool.map((item, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        background: '#FFFFFF',
                                        border: '1px solid #FFE066',
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        color: '#2C3E50',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => playWordAudio(item.word)}
                                    title="클릭 시 발음 듣기"
                                >
                                    {quizLevel === 1 ? `${idx + 1}. ${item.word} 🔊` : quizLevel === 2 ? `${idx + 1}. 🔒 단어 ${idx + 1} 🔊` : `${idx + 1}. ${item.meaning} 🔊`}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 3단계 레벨 선택기 */}
                    <div className="quiz-level-selector" style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <button
                            className={`quiz-level-btn ${quizLevel === 1 ? 'active' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                            onClick={() => setQuizLevel(1)}
                        >
                            🔊 1단계: 소리 퀴즈 (뜻 맞추기)
                        </button>
                        <button
                            className={`quiz-level-btn ${quizLevel === 2 ? 'active' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                            onClick={() => setQuizLevel(2)}
                        >
                            🔤 2단계: 스펠링 선택 (철자 객관식)
                        </button>
                        <button
                            className={`quiz-level-btn ${quizLevel === 3 ? 'active' : ''}`}
                            style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                            onClick={() => setQuizLevel(3)}
                        >
                            ✍️ 3단계: 스펠링 직접 쓰기 (철자 입력)
                        </button>
                    </div>

                    {!isFinished && currentQuestion ? (
                        <>
                            {/* 문제 진행도 표시 바 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA', padding: '8px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold' }}>
                                <span>📝 퀴즈 진행률</span>
                                <span style={{ color: '#27AE60' }}>{currentIndex + 1} / {shuffledQuestions.length} 문제</span>
                            </div>

                            {/* 1단계: 소리 퀴즈 (뜻 4지선다) */}
                            {quizLevel === 1 && (
                                <>
                                    <div className="quiz-question-container">
                                        <span className="quiz-emoji" style={{ fontSize: '42px' }}>🎧</span>
                                        <h2 className="quiz-word-en" style={{ fontSize: '22px', color: '#7F8C8D', margin: '4px 0' }}>
                                            [ 🔒 소리를 듣고 뜻을 맞추세요 ]
                                        </h2>
                                        <button
                                            className="quiz-btn-audio-pill"
                                            onClick={() => playWordAudio(currentQuestion.word)}
                                        >
                                            🔊 다시 듣기
                                        </button>
                                    </div>
                                    <div className="options-grid">
                                        {options.map((opt, idx) => {
                                            let btnStyle = {};
                                            if (selectedAnswer) {
                                                if (opt.word === currentQuestion.word) {
                                                    btnStyle = { backgroundColor: '#2ECC71', color: 'white', borderColor: '#27AE60' };
                                                } else if (opt === selectedAnswer && !isCorrect) {
                                                    btnStyle = { backgroundColor: '#E74C3C', color: 'white', borderColor: '#C0392B' };
                                                }
                                            }
                                            return (
                                                <button
                                                    key={idx}
                                                    className="option-btn"
                                                    style={btnStyle}
                                                    disabled={selectedAnswer !== null}
                                                    onClick={() => handleMultipleChoiceSelect(opt)}
                                                >
                                                    {idx + 1}. {opt.meaning}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* 2단계: 스펠링 선택 퀴즈 (영단어 4지선다) */}
                            {quizLevel === 2 && (
                                <>
                                    <div className="quiz-question-container">
                                        <span className="quiz-emoji" style={{ fontSize: '42px' }}>🔤</span>
                                        <h2 className="meaning-kr" style={{ fontSize: '32px', margin: '4px 0', color: '#3498DB' }}>
                                            [ 🔒 소리를 듣고 알맞은 영단어를 고르세요 ]
                                        </h2>
                                        <p style={{ fontSize: '15px', color: '#7F8C8D' }}>뜻: {currentQuestion.meaning}</p>
                                        <button
                                            className="quiz-btn-audio-pill"
                                            onClick={() => playWordAudio(currentQuestion.word)}
                                        >
                                            🔊 소리 다시 듣기
                                        </button>
                                    </div>
                                    <div className="options-grid">
                                        {options.map((opt, idx) => {
                                            let btnStyle = {};
                                            if (selectedAnswer) {
                                                if (opt.word === currentQuestion.word) {
                                                    btnStyle = { backgroundColor: '#2ECC71', color: 'white', borderColor: '#27AE60' };
                                                } else if (opt === selectedAnswer && !isCorrect) {
                                                    btnStyle = { backgroundColor: '#E74C3C', color: 'white', borderColor: '#C0392B' };
                                                }
                                            }
                                            return (
                                                <button
                                                    key={idx}
                                                    className="option-btn"
                                                    style={{ ...btnStyle, fontSize: '20px', fontWeight: '900' }}
                                                    disabled={selectedAnswer !== null}
                                                    onClick={() => handleMultipleChoiceSelect(opt)}
                                                >
                                                    {idx + 1}. {opt.word}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* 3단계: 스펠링 직접 쓰기 퀴즈 */}
                            {quizLevel === 3 && (
                                <div className="quiz-question-container">
                                    <span className="quiz-emoji" style={{ fontSize: '42px' }}>✍️</span>
                                    <h2 className="meaning-kr" style={{ fontSize: '38px', margin: '4px 0', color: '#FF6B6B' }}>
                                        {currentQuestion.meaning}
                                    </h2>
                                    <p className="word-phonics" style={{ fontSize: '18px', color: '#3498DB', marginBottom: '8px' }}>
                                        {currentQuestion.phonics}
                                    </p>
                                    <button
                                        className="quiz-btn-audio-pill"
                                        type="button"
                                        onClick={() => playWordAudio(currentQuestion.word)}
                                    >
                                        🔊 발음 듣기
                                    </button>

                                    <form onSubmit={handleLevel3Submit} style={{ width: '100%', marginTop: '14px' }}>
                                        <input
                                            type="text"
                                            className="spelling-input"
                                            placeholder="영단어 스펠링 입력..."
                                            value={spellingInput}
                                            onChange={e => setSpellingInput(e.target.value)}
                                            disabled={selectedAnswer !== null}
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            style={{ width: '100%', marginTop: '12px', padding: '14px', fontSize: '16px', borderRadius: '16px' }}
                                            disabled={selectedAnswer !== null}
                                        >
                                            정답 확인
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* 피드백 메시지 */}
                            {selectedAnswer && (
                                <div className="quiz-feedback" style={{ marginTop: '16px', fontSize: '16px' }}>
                                    {isCorrect ? (
                                        <span style={{ color: '#2ECC71', fontWeight: 'bold' }}>⭕ 정답입니다! 정답: {currentQuestion.word} ({currentQuestion.meaning})</span>
                                    ) : (
                                        <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>❌ 오답입니다! (정답: {currentQuestion.word}) - 오답노트 저장</span>
                                    )}
                                </div>
                            )}
                        </>
                    ) : isFinished ? (
                        /* 퀴즈 최종 완료 결과 화면 */
                        <div className="quiz-result-box" style={{ padding: '20px 0', textAlign: 'center' }}>
                            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2C3E50' }}>{quizLevel}단계 퀴즈를 완료했습니다!</h2>
                            <p style={{ fontSize: '18px', margin: '12px 0', color: '#D35400', fontWeight: 'bold' }}>
                                최종 점수: {score} / {shuffledQuestions.length}점
                            </p>
                            <p style={{ fontSize: '14px', color: '#7F8C8D', marginBottom: '20px' }}>
                                {score === shuffledQuestions.length ? '완벽해요! 오늘 공부한 단어를 모두 마스터했습니다! 💯' : '틀린 단어는 오답노트에서 다시 공부해보세요! 💪'}
                            </p>
                            <button
                                className="btn-primary"
                                style={{ padding: '12px 28px', fontSize: '16px', borderRadius: '16px' }}
                                onClick={initQuizSet}
                            >
                                🔄 퀴즈 다시 풀기
                            </button>
                        </div>
                    ) : (
                        <p>퀴즈를 준비 중입니다...</p>
                    )}
                </div>
            ) : (
                <div className="wrong-words-card">
                    <h3>📖 {currentUser ? `${currentUser.name}의 ` : ''}오답노트 목록</h3>
                    {wrongWords.length === 0 ? (
                        <p className="no-wrong-text" style={{ textAlign: 'center', margin: '20px 0', color: '#7F8C8D' }}>틀린 단어가 없습니다! 대단해요! 👍</p>
                    ) : (
                        <ul className="wrong-list">
                            {wrongWords.map((w, idx) => (
                                <li key={idx} className="wrong-item">
                                    <div>
                                        <strong>{w.word}</strong> <span style={{ color: '#3498DB' }}>{w.phonics}</span> : <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>{w.meaning}</span>
                                    </div>
                                    <button className="btn-remove-wrong" onClick={() => handleRemoveWrongWord(w.word)}>알았어요 ✓</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
