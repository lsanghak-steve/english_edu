'use client';

import { useState, useEffect, useCallback } from 'react';
import wordList500 from '../../data/wordsData.js';

export default function QuizSection({ currentUser }) {
    const [quizLevel, setQuizLevel] = useState(1); // 1: 소리 퀴즈, 2: 스펠링 퀴즈
    const [quizData, setQuizData] = useState(null);
    const [options, setOptions] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [spellingInput, setSpellingInput] = useState('');
    const [wrongWords, setWrongWords] = useState([]);
    const [activeTab, setActiveTab] = useState('quiz'); // 'quiz' or 'wrong'

    const getWrongWordsKey = useCallback(() => {
        return currentUser ? `english_wrong_words_${currentUser.id}` : 'english_wrong_words';
    }, [currentUser]);

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

    // 퀴즈 문제 생성
    const generateQuiz = useCallback(() => {
        if (!wordList500 || wordList500.length === 0) return;
        setSelectedAnswer(null);
        setIsCorrect(null);
        setSpellingInput('');

        const randomIndex = Math.floor(Math.random() * wordList500.length);
        const correctWord = wordList500[randomIndex];
        setQuizData(correctWord);

        // 1단계 (소리 퀴즈) 일 경우 문제 생성 시 바로 소리 자동 재생
        if (quizLevel === 1) {
            setTimeout(() => {
                playWordAudio(correctWord.word);
            }, 300);

            const wrongOpts = [];
            while (wrongOpts.length < 3) {
                const rand = Math.floor(Math.random() * wordList500.length);
                if (rand !== randomIndex && !wrongOpts.includes(wordList500[rand])) {
                    wrongOpts.push(wordList500[rand]);
                }
            }
            const allOpts = [correctWord, ...wrongOpts].sort(() => Math.random() - 0.5);
            setOptions(allOpts);
        }
    }, [quizLevel, playWordAudio]);

    useEffect(() => {
        generateQuiz();
    }, [quizLevel, generateQuiz]);

    // 1단계 (소리 퀴즈) 답안 제출
    const handleLevel1AnswerSelect = (opt) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(opt);

        const correct = opt.word === quizData.word;
        setIsCorrect(correct);

        if (!correct) {
            if (!wrongWords.some(w => w.word === quizData.word)) {
                const updated = [...wrongWords, quizData];
                saveWrongWords(updated);
            }
        }

        setTimeout(() => {
            generateQuiz();
        }, 1500);
    };

    // 2단계 (스펠링 퀴즈) 답안 제출
    const handleLevel2Submit = (e) => {
        e.preventDefault();
        if (!spellingInput.trim() || selectedAnswer !== null) return;

        const userInputStr = spellingInput.trim().toLowerCase();
        const correctStr = quizData.word.trim().toLowerCase();
        const correct = userInputStr === correctStr;

        setSelectedAnswer(spellingInput);
        setIsCorrect(correct);

        if (!correct) {
            if (!wrongWords.some(w => w.word === quizData.word)) {
                const updated = [...wrongWords, quizData];
                saveWrongWords(updated);
            }
        }

        setTimeout(() => {
            generateQuiz();
        }, 1800);
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
                    {/* 1단계 / 2단계 레벨 선택기 */}
                    <div className="quiz-level-selector">
                        <button
                            className={`quiz-level-btn ${quizLevel === 1 ? 'active' : ''}`}
                            onClick={() => setQuizLevel(1)}
                        >
                            🔊 1단계: 소리 퀴즈 (듣고 맞추기)
                        </button>
                        <button
                            className={`quiz-level-btn ${quizLevel === 2 ? 'active' : ''}`}
                            onClick={() => setQuizLevel(2)}
                        >
                            ✍️ 2단계: 스펠링 퀴즈 (철자 쓰기)
                        </button>
                    </div>

                    {quizData ? (
                        <>
                            {/* 1단계 소리 퀴즈 */}
                            {quizLevel === 1 && (
                                <>
                                    <div className="quiz-question-box">
                                        <span className="quiz-emoji" style={{ fontSize: '40px' }}>🎧</span>
                                        <h2 className="quiz-word-en" style={{ fontSize: '24px', color: '#7F8C8D' }}>
                                            [ 🔒 소리를 듣고 뜻을 맞추세요 ]
                                        </h2>
                                        <button
                                            className="audio-btn"
                                            style={{ margin: '10px auto' }}
                                            onClick={() => playWordAudio(quizData.word)}
                                        >
                                            🔊 다시 듣기
                                        </button>
                                    </div>
                                    <div className="options-grid">
                                        {options.map((opt, idx) => {
                                            let btnStyle = {};
                                            if (selectedAnswer) {
                                                if (opt.word === quizData.word) {
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
                                                    onClick={() => handleLevel1AnswerSelect(opt)}
                                                >
                                                    {idx + 1}. {opt.meaning}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}

                            {/* 2단계 스펠링 퀴즈 */}
                            {quizLevel === 2 && (
                                <div className="quiz-question-box">
                                    <span className="quiz-emoji" style={{ fontSize: '40px' }}>✍️</span>
                                    <h2 className="meaning-kr" style={{ margin: '10px 0' }}>{quizData.meaning}</h2>
                                    <p className="quiz-phonics" style={{ fontSize: '15px', color: '#3498DB' }}>{quizData.phonics}</p>
                                    <button
                                        className="audio-btn"
                                        style={{ margin: '6px auto 14px' }}
                                        onClick={() => playWordAudio(quizData.word)}
                                    >
                                        🔊 발음 듣기
                                    </button>

                                    <form onSubmit={handleLevel2Submit}>
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
                                            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
                                            disabled={selectedAnswer !== null}
                                        >
                                            정답 확인
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* 피드백 메시지 */}
                            {selectedAnswer && (
                                <div className="quiz-feedback">
                                    {isCorrect ? (
                                        <span style={{ color: '#2ECC71', fontWeight: 'bold' }}>⭕ 정답입니다! 정답: {quizData.word}</span>
                                    ) : (
                                        <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>❌ 오답입니다! (정답: {quizData.word}) - 오답노트 저장</span>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <p>퀴즈를 불러오는 중입니다...</p>
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
