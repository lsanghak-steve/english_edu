'use client';

import { useState, useEffect, useCallback } from 'react';

export default function QuizSection({ currentUser, activeWords, onQuizLevelComplete, onLoadNextWordSet }) {
  const [quizLevel, setQuizLevel] = useState(1); // 1: 소리퀴즈, 2: 스펠링 선택, 3: 스펠링 직접 입력
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedInput, setTypedInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  const safeWords = activeWords && activeWords.length > 0 ? activeWords : [];
  const currentQuiz = safeWords[currentIndex] || safeWords[0];

  const cleanWordStr = (currentQuiz?.word || '').replace(/\.png/gi, '').trim();

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

      if (quizLevel === 1) {
        const timer = setTimeout(() => {
          playAudio(cleanWordStr);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentQuiz, quizLevel, generateOptions, playAudio, cleanWordStr]);

  // ❌ 오답 발생 시 localStorage 오답노트에 자동 저장
  const saveWrongAnswer = (wordObj) => {
    if (!currentUser || !wordObj) return;
    const wrongKey = `wrong_answers_${currentUser.id}`;
    let wrongList = [];
    try {
      wrongList = JSON.parse(localStorage.getItem(wrongKey) || '[]');
    } catch (e) {
      wrongList = [];
    }

    const wordStr = (wordObj.word || wordObj).replace(/\.png/gi, '').trim();
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

  // 1, 2단계 정답 제출
  const handleAnswerSelect = (optionItem) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(optionItem);
    const optionStr = (optionItem.word || optionItem).replace(/\.png/gi, '').trim();

    if (optionStr === cleanWordStr) {
      setIsCorrect(true);
      setScore(prev => prev + 1);
    } else {
      setIsCorrect(false);
      saveWrongAnswer(currentQuiz);
    }
  };

  // 3단계 직접 입력 제출
  const handleTypedSubmit = (e) => {
    e.preventDefault();
    if (selectedAnswer !== null || !typedInput.trim()) return;

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
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= safeWords.length) {
      if (quizLevel === 1) {
        alert('🎉 1단계 소리 퀴즈 완료! 필수 학습 완수를 위해 2단계 스펠링 선택 퀴즈로 바로 이동합니다!');
        handleRestart(2);
      } else if (quizLevel === 2) {
        setIsQuizEnded(true);
        if (onQuizLevelComplete) {
          onQuizLevelComplete(2);
        }
      } else {
        setIsQuizEnded(true);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleRestart = (level) => {
    setQuizLevel(level);
    setCurrentIndex(0);
    setScore(0);
    setIsQuizEnded(false);
    setSelectedAnswer(null);
    setTypedInput('');
    setIsCorrect(null);
  };

  if (!currentQuiz) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>퀴즈 단어 데이터를 로딩 중입니다...</div>;
  }

  return (
    <div className="quiz-section-card" style={{ padding: '20px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      {/* 3대 퀴즈 레벨 탭 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        <button
          onClick={() => handleRestart(1)}
          style={{
            flex: 1,
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 1 ? '2px solid #3498DB' : '1px solid #BDC3C7',
            background: quizLevel === 1 ? '#EBF5FB' : '#F8F9FA',
            color: quizLevel === 1 ? '#2980B9' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔊 1단계 소리
        </button>
        <button
          onClick={() => handleRestart(2)}
          style={{
            flex: 1,
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 2 ? '2px solid #9B59B6' : '1px solid #BDC3C7',
            background: quizLevel === 2 ? '#F5EEF8' : '#F8F9FA',
            color: quizLevel === 2 ? '#8E44AD' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🧩 2단계 선택 (필수완수)
        </button>
        <button
          onClick={() => handleRestart(3)}
          style={{
            flex: 1,
            padding: '10px 4px',
            borderRadius: '14px',
            border: quizLevel === 3 ? '2px solid #E67E22' : '1px solid #BDC3C7',
            background: quizLevel === 3 ? '#FEF5E7' : '#F8F9FA',
            color: quizLevel === 3 ? '#D35400' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          ✍️ 3단계 직접쓰기
        </button>
      </div>

      {!isQuizEnded ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold', color: '#7F8C8D', fontSize: '13px' }}>
              문제 {currentIndex + 1} / {safeWords.length}
            </span>
            <span style={{ fontWeight: 'bold', color: '#27AE60', fontSize: '13px' }}>
              점수: {score}점
            </span>
          </div>

          {/* 레벨 1: 소리 퀴즈 */}
          {quizLevel === 1 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F8F9FA', borderRadius: '18px', marginBottom: '20px' }}>
              <button
                onClick={() => playAudio(cleanWordStr)}
                style={{ background: '#3498DB', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '10px' }}
              >
                🔊 다시 듣기
              </button>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '22px', color: '#2C3E50' }}>{cleanWordStr}</h3>
              <p style={{ margin: '2px 0 0 0', color: '#7F8C8D', fontSize: '14px' }}>{currentQuiz.phonics}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#E67E22', fontWeight: 'bold' }}>
                💡 올바른 한글 뜻을 선택하세요!
              </p>
            </div>
          )}

          {/* 레벨 2: 스펠링 선택 퀴즈 */}
          {quizLevel === 2 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F8F9FA', borderRadius: '18px', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: '#9B59B6', fontWeight: 'bold' }}>스펠링 퀴즈 (필수)</span>
              <h2 style={{ margin: '6px 0', fontSize: '28px', color: '#E74C3C', fontWeight: 'bold' }}>
                {currentQuiz.meaning}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#7F8C8D', fontWeight: 'bold' }}>
                💡 아래에서 알맞은 영어 단어를 선택하세요!
              </p>
            </div>
          )}

          {/* 레벨 3: 스펠링 직접 입력 퀴즈 */}
          {quizLevel === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#FEF5E7', borderRadius: '18px', marginBottom: '20px', border: '1px solid #FADBD8' }}>
              <span style={{ fontSize: '12px', color: '#D35400', fontWeight: 'bold' }}>✍️ 최고 난이도 스펠링 직접 쓰기</span>
              <h2 style={{ margin: '8px 0', fontSize: '28px', color: '#2C3E50', fontWeight: 'bold' }}>
                {currentQuiz.meaning}
              </h2>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#E67E22', fontWeight: 'bold' }}>
                💡 영어 단어 스펠링을 아래 상자에 직접 입력하세요!
              </p>

              <form onSubmit={handleTypedSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '320px', margin: '0 auto' }}>
                <input
                  type="text"
                  placeholder="예: flashlight"
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={selectedAnswer !== null}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '12px', border: '2px solid #E67E22', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={selectedAnswer !== null || !typedInput.trim()}
                  style={{ background: '#E67E22', color: 'white', border: 'none', padding: '12px 18px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
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
                let btnBorder = '1px solid #BDC3C7';
                let btnColor = '#2C3E50';

                if (selectedAnswer !== null) {
                  if (optStr === cleanWordStr) {
                    btnBg = '#D4EFDF';
                    btnBorder = '2px solid #2ECC71';
                    btnColor = '#196F3D';
                  } else if (isSelected) {
                    btnBg = '#FADBD8';
                    btnBorder = '2px solid #E74C3C';
                    btnColor = '#78281F';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(optionItem)}
                    style={{
                      padding: '14px 10px',
                      borderRadius: '16px',
                      background: btnBg,
                      border: btnBorder,
                      color: btnColor,
                      fontWeight: 'bold',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
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
                <div style={{ color: '#27AE60', fontWeight: 'bold', fontSize: '16px' }}>
                  🎉 정답입니다! 아주 잘했어요!
                </div>
              ) : (
                <div style={{ color: '#E74C3C', fontWeight: 'bold', fontSize: '15px' }}>
                  ❌ 아쉽네요 오답입니다! (정답: {cleanWordStr} - {currentQuiz.meaning})
                  <br />
                  <span style={{ fontSize: '12px', color: '#C0392B', background: '#FADBD8', padding: '2px 8px', borderRadius: '6px', marginTop: '4px', display: 'inline-block' }}>
                    📝 틀린 단어가 오답노트에 자동 저장되었습니다!
                  </span>
                </div>
              )}

              <button
                onClick={handleNextQuestion}
                style={{ marginTop: '14px', background: '#2C3E50', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                {currentIndex + 1 === safeWords.length && quizLevel === 1 ? '2단계 퀴즈로 ➔' : '다음 문제 ➔'}
              </button>
            </div>
          )}
        </>
      ) : (
        /* 퀴즈 결과 화면 및 🚀 [다음 단어 학습] 버튼 */
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <h2 style={{ color: '#2C3E50', margin: '0 0 10px 0' }}>
            🎉 {quizLevel === 2 ? '2단계 스펠링 선택 퀴즈 완료!' : '3단계 스펠링 직접 입력 퀴즈 완료!'}
          </h2>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#27AE60', margin: '0 0 20px 0' }}>
            최종 점수: {score} / {safeWords.length}점
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onLoadNextWordSet && (
              <button
                onClick={onLoadNextWordSet}
                style={{ background: '#E67E22', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                🚀 다음 단어 학습 ➔
              </button>
            )}

            {quizLevel === 2 && (
              <button
                onClick={() => handleRestart(3)}
                style={{ background: '#9B59B6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
              >
                ✍️ 3단계 스펠링 직접 쓰기 도전 ➔
              </button>
            )}

            <button
              onClick={() => handleRestart(quizLevel)}
              style={{ background: '#3498DB', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}
            >
              🔄 다시 풀기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
