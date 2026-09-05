'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';
import { t, getLocalDateString } from '../../lib/i18n.js';
import { playUniversalAudio } from '../../lib/audioPlayer.js';

// 단어 객체 안전 규격화 헬퍼
const sanitizeWordObject = (item, currentLang = 'ko') => {
  if (!item) return { id: Date.now(), word: 'Apple', meaning: '사과', phonics: '/ˈæpəl/' };
  if (typeof item === 'string') {
    const found = wordList500Fallback.find(w => w.word && w.word.toLowerCase() === item.toLowerCase());
    let meaningText = '의미 확인';
    if (found) {
      if (currentLang === 'zh') meaningText = found.meaning_zh || found.meaningZh || found.meaning;
      else if (currentLang === 'fr') meaningText = found.meaning_fr || found.meaningFr || found.meaning;
      else meaningText = found.meaning;
    }
    return {
      id: Date.now(),
      word: item,
      meaning: meaningText,
      phonics: found ? found.phonics : ''
    };
  }
  const wordStr = item.word || item.cleanWord || 'Apple';
  const found = wordList500Fallback.find(w => w.word && w.word.toLowerCase() === wordStr.toLowerCase());
  let meaningText = item.meaning;
  if (currentLang === 'zh') meaningText = item.meaning_zh || item.meaningZh || (found ? (found.meaning_zh || found.meaningZh || found.meaning) : item.meaning);
  else if (currentLang === 'fr') meaningText = item.meaning_fr || item.meaningFr || (found ? (found.meaning_fr || found.meaningFr || found.meaning) : item.meaning);
  else meaningText = item.meaning || (found ? found.meaning : '의미 확인');

  return {
    id: item.id || Date.now(),
    word: wordStr,
    meaning: meaningText || '의미 확인',
    phonics: item.phonics || (found ? found.phonics : '')
  };
};

export default function Day6ReviewSection({ currentUser, safeActiveWords, onQuizComplete, currentLang = 'ko' }) {
  const [weeklyWords, setWeeklyWords] = useState([]);
  const [learnedWordsList, setLearnedWordsList] = useState([]);
  const [wrongWordsList, setWrongWordsList] = useState([]);
  const [selectedMode, setSelectedMode] = useState('random20'); // 'random20' | 'wrong_focus'
  const [quizMode, setQuizMode] = useState('review_start'); // 'review_start', 'quiz_active', 'quiz_completed'
  const [activeQuizType, setActiveQuizType] = useState('random20'); // 'random20' | 'wrong_focus'
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [typedSpelling, setTypedSpelling] = useState('');
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isWeeklyMasterDone, setIsWeeklyMasterDone] = useState(false);

  const studentCode = currentUser?.student_id || currentUser?.id || 'guest';
  const studentName = (currentUser?.name || '').replace(/\(.*?\)/g, '').trim();

  // 1. 최근 학습 단어(student_learned_words), 주간 오답(wrong_words) 및 이력 DB에서 집계
  useEffect(() => {
    let isMounted = true;

    async function loadDay6Data() {
      setLoading(true);
      try {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 2000));

        const queryIds = [studentCode, currentUser?.id, studentName].filter(Boolean);
        const fetchPromise = (async () => {
          let wrongQ = supabase.from('wrong_words').select('*');
          let recQ = supabase.from('study_records').select('*');
          let learnedQ = supabase.from('student_learned_words').select('*');

          if (queryIds.length > 1) {
            wrongQ = wrongQ.or(queryIds.map(id => `student_id.eq.${id}`).join(','));
            recQ = recQ.or(queryIds.map(id => `student_id.eq.${id}`).join(','));
            learnedQ = learnedQ.or(queryIds.map(id => `student_id.eq.${id}`).join(','));
          } else if (queryIds.length === 1) {
            wrongQ = wrongQ.eq('student_id', queryIds[0]);
            recQ = recQ.eq('student_id', queryIds[0]);
            learnedQ = learnedQ.eq('student_id', queryIds[0]);
          }
          const [wrongRes, recordsRes, learnedRes] = await Promise.allSettled([wrongQ, recQ, learnedQ]);
          return { wrongRes, recordsRes, learnedRes };
        })();

        const result = await Promise.race([fetchPromise, timeoutPromise]);

        if (isMounted) {
          let wrongMap = new Map();
          if (result && !result.timeout && result.wrongRes && result.wrongRes.status === 'fulfilled' && result.wrongRes.value.data) {
            result.wrongRes.value.data.forEach(item => {
              if (item.word) wrongMap.set(item.word.trim().toLowerCase(), item);
            });
          }

          if (result && !result.timeout && result.recordsRes && result.recordsRes.status === 'fulfilled' && result.recordsRes.value.data) {
            result.recordsRes.value.data.forEach(rec => {
              if (rec.detail_stage && rec.detail_stage.includes('주간 복습 완수')) {
                setIsWeeklyMasterDone(true);
              }
            });
          }

          let learnedList = [];
          if (result && !result.timeout && result.learnedRes && result.learnedRes.status === 'fulfilled' && result.learnedRes.value.data) {
            const learnedMap = new Map();
            result.learnedRes.value.data.forEach(item => {
              if (item.word) learnedMap.set(item.word.trim().toLowerCase(), item);
            });
            learnedList = Array.from(learnedMap.values());
            setLearnedWordsList(learnedList);
          }

          const wrongList = Array.from(wrongMap.values());
          setWrongWordsList(wrongList);

          const safeActiveFormatted = (safeActiveWords || []).map(w => sanitizeWordObject(w, currentLang));
          let combined = [...safeActiveFormatted];
          wrongList.forEach(w => {
            const sanitizedW = sanitizeWordObject(w, currentLang);
            if (!combined.some(c => c.word.toLowerCase() === sanitizedW.word.toLowerCase())) {
              combined.push(sanitizedW);
            }
          });
          learnedList.forEach(w => {
            const sanitizedW = sanitizeWordObject(w, currentLang);
            if (!combined.some(c => c.word.toLowerCase() === sanitizedW.word.toLowerCase())) {
              combined.push(sanitizedW);
            }
          });

          if (combined.length === 0) {
            combined = wordList500Fallback.slice(0, 25).map(w => sanitizeWordObject(w, currentLang));
          }

          setWeeklyWords(combined);
        }
      } catch (e) {
        console.log('Day 6 data load error', e);
        if (isMounted) {
          const fallback = (safeActiveWords && safeActiveWords.length > 0)
            ? safeActiveWords.map(w => sanitizeWordObject(w, currentLang))
            : wordList500Fallback.slice(0, 25).map(w => sanitizeWordObject(w, currentLang));
          setWeeklyWords(fallback);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDay6Data();

    return () => {
      isMounted = false;
    };
  }, [studentCode, safeActiveWords, currentLang]);

  // 🔀 무작위 셔플 헬퍼
  const shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // 2-1. 모드 1: 주간 20단어 랜덤 총복습 퀴즈 (한글 뜻 퀴즈 + 스펠링 퀴즈 복합)
  const startRandom20Quiz = () => {
    setActiveQuizType('random20');
    // 학습한 단어 풀 우선 구성: learnedWordsList + weeklyWords + fallback
    const candidateMap = new Map();
    (learnedWordsList || []).forEach(w => {
      const s = sanitizeWordObject(w, currentLang);
      candidateMap.set(s.word.toLowerCase(), s);
    });
    (weeklyWords || []).forEach(w => {
      const s = sanitizeWordObject(w, currentLang);
      if (!candidateMap.has(s.word.toLowerCase())) {
        candidateMap.set(s.word.toLowerCase(), s);
      }
    });
    (safeActiveWords || []).forEach(w => {
      const s = sanitizeWordObject(w, currentLang);
      if (!candidateMap.has(s.word.toLowerCase())) {
        candidateMap.set(s.word.toLowerCase(), s);
      }
    });

    let pool = Array.from(candidateMap.values());
    if (pool.length < 20) {
      wordList500Fallback.forEach(w => {
        const s = sanitizeWordObject(w, currentLang);
        if (!candidateMap.has(s.word.toLowerCase()) && pool.length < 30) {
          candidateMap.set(s.word.toLowerCase(), s);
          pool.push(s);
        }
      });
    }

    // 20단어 무작위 선정
    const shuffledPool = shuffle(pool);
    const selected20 = shuffledPool.slice(0, Math.min(20, shuffledPool.length));

    // 문제 생성 (한글 뜻 맞추기 10문항, 스펠링 체크 퀴즈 10문항 번갈아 출제)
    const questions = selected20.map((target, idx) => {
      // 짝수 인덱스는 한글 뜻 퀴즈 ('meaning'), 홀수 인덱스는 스펠링 체크 ('spelling')
      const qType = idx % 2 === 0 ? 'meaning' : 'spelling';

      if (qType === 'meaning') {
        // 영단어 제시 -> 한글 뜻 4지선다
        let wrongMeanings = pool
          .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
          .map(w => w.meaning);
        if (wrongMeanings.length < 3) {
          const fallbackOpts = wordList500Fallback
            .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
            .map(w => sanitizeWordObject(w, currentLang).meaning);
          wrongMeanings = [...wrongMeanings, ...fallbackOpts];
        }
        const shuffledWrong = shuffle(wrongMeanings).slice(0, 3);
        const options = shuffle([...shuffledWrong, target.meaning]);

        return {
          id: target.id || idx,
          type: 'meaning',
          word: target.word,
          meaning: target.meaning,
          phonics: target.phonics || '',
          prompt: target.word,
          correctAnswer: target.meaning,
          options: options
        };
      } else {
        // 한글 뜻 제시 -> 영어 스펠링 4지선다 + 직접입력 지원
        let wrongWords = pool
          .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
          .map(w => w.word);
        if (wrongWords.length < 3) {
          const fallbackOpts = wordList500Fallback
            .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
            .map(w => w.word);
          wrongWords = [...wrongWords, ...fallbackOpts];
        }
        const shuffledWrong = shuffle(wrongWords).slice(0, 3);
        const options = shuffle([...shuffledWrong, target.word]);

        return {
          id: target.id || idx,
          type: 'spelling',
          word: target.word,
          meaning: target.meaning,
          phonics: target.phonics || '',
          prompt: target.meaning,
          correctAnswer: target.word,
          options: options
        };
      }
    });

    setQuizQuestions(questions);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedOption(null);
    setTypedSpelling('');
    setIsAnswerChecked(false);
    setQuizMode('quiz_active');
  };

  // 2-2. 모드 2: 기존 주간 오답 집중 탈출 퀴즈 (10문항)
  const startDay6Quiz = () => {
    setActiveQuizType('wrong_focus');
    const sanitizedWeekly = (weeklyWords && weeklyWords.length > 0 ? weeklyWords : safeActiveWords || []).map(w => sanitizeWordObject(w, currentLang));
    const sanitizedWrong = wrongWordsList.map(w => sanitizeWordObject(w, currentLang));

    let pool = [...sanitizedWeekly];
    if (pool.length === 0) {
      pool = wordList500Fallback.slice(0, 10).map(w => sanitizeWordObject(w, currentLang));
    }

    const sortedPool = pool.sort((a, b) => {
      const aIsWrong = sanitizedWrong.some(w => w.word.toLowerCase() === a.word.toLowerCase());
      const bIsWrong = sanitizedWrong.some(w => w.word.toLowerCase() === b.word.toLowerCase());
      return bIsWrong - aIsWrong;
    });

    const targetPool = sortedPool.slice(0, 10);

    const generated = targetPool.map((target, idx) => {
      let wrongOptions = pool
        .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
        .map(w => w.meaning);

      if (wrongOptions.length < 3) {
        const extraOptions = wordList500Fallback
          .filter(w => w.word.toLowerCase() !== target.word.toLowerCase())
          .map(w => {
            if (currentLang === 'zh') return w.meaning_zh || w.meaningZh || w.meaning;
            if (currentLang === 'fr') return w.meaning_fr || w.meaningFr || w.meaning;
            return w.meaning;
          });
        wrongOptions = [...wrongOptions, ...extraOptions];
      }

      const shuffledWrong = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...shuffledWrong, target.meaning].sort(() => Math.random() - 0.5);

      return {
        id: target.id || idx,
        type: 'meaning',
        word: target.word,
        phonics: target.phonics || '',
        meaning: target.meaning,
        prompt: target.word,
        options: options,
        correctAnswer: target.meaning,
        correctMeaning: target.meaning
      };
    });

    setQuizQuestions(generated);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedOption(null);
    setTypedSpelling('');
    setIsAnswerChecked(false);
    setQuizMode('quiz_active');
  };

  // 3. 답변 선택 처리 (4지선다 클릭)
  const handleSelectOption = (opt) => {
    if (isAnswerChecked) return;
    setSelectedOption(opt);
    setTypedSpelling(opt);
  };

  // 4. 정답 확인
  const handleCheckAnswer = () => {
    if (isAnswerChecked) return;
    const currentQ = quizQuestions[currentQIndex];
    if (!currentQ) return;

    let userAns = selectedOption;
    if (currentQ.type === 'spelling') {
      userAns = (typedSpelling || selectedOption || '').trim();
    }

    if (!userAns) return;

    let correct = false;
    if (currentQ.type === 'spelling') {
      correct = userAns.toLowerCase() === currentQ.correctAnswer.toLowerCase();
    } else {
      correct = userAns === currentQ.correctAnswer || userAns === currentQ.correctMeaning;
    }

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  // 5. 다음 문제 이동 또는 최종 주간 왕도장(🏵️) 수여 완료
  const handleNextQuestion = async () => {
    if (currentQIndex + 1 < quizQuestions.length) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setTypedSpelling('');
      setIsAnswerChecked(false);
    } else {
      setQuizMode('quiz_completed');
      setIsWeeklyMasterDone(true);

      const finalScorePct = Math.round((score / quizQuestions.length) * 100);

      // Supabase DB study_records에 주간 종합 복습 왕도장(🏵️) 기록 저장
      try {
        const todayStr = getLocalDateString();
        const syncDay6Record = async (sid) => {
          if (!sid) return;
          const { data: existing } = await supabase.from('study_records').select('id, detail_stage').eq('student_id', sid).eq('study_date', todayStr).limit(1);
          const stageTitle = activeQuizType === 'random20' ? '주간 복습 완수 (20단어 랜덤 퀴즈)' : '주간 복습 완수 (오답 집중 탈출)';
          if (existing && existing.length > 0) {
            await supabase.from('study_records').update({ is_stamped: true, detail_stage: stageTitle, score: finalScorePct }).eq('id', existing[0].id);
          } else {
            await supabase.from('study_records').insert([{ student_id: sid, study_date: todayStr, is_stamped: true, detail_stage: stageTitle, score: finalScorePct }]);
          }
        };
        await syncDay6Record(studentCode);
        if (studentName && studentName !== studentCode) {
          await syncDay6Record(studentName);
        }

        // localStorage 동기화
        const stampKey = `english_stamps_${currentUser?.id || studentCode}`;
        let localStamps = JSON.parse(localStorage.getItem(stampKey) || '[]');
        if (!localStamps.includes(todayStr)) {
          localStamps.push(todayStr);
          localStorage.setItem(stampKey, JSON.stringify(localStamps));
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('study_data_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {}

      if (onQuizComplete) {
        onQuizComplete();
      }
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#F8F9FA', borderRadius: '24px' }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>🗓️</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6C5CE7' }}>
          {currentLang === 'zh' ? '正在汇总 Day 6 周错题数据...' : (currentLang === 'fr' ? 'Chargement des données de révision Day 6...' : 'Day 6 주간 오답 데이터를 집계 중입니다...')}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F6FA 100%)',
      borderRadius: '28px',
      padding: '28px',
      boxShadow: '0 10px 30px rgba(108,92,231,0.12)',
      border: '2px solid #A29BFE',
      maxWidth: '700px',
      margin: '0 auto'
    }}>
      {/* 헤더 타이틀 */}
      <div style={{
        background: 'linear-gradient(135deg, #6C5CE7 0%, #8E44AD 100%)',
        borderRadius: '20px',
        padding: '20px 24px',
        color: 'white',
        textAlign: 'center',
        marginBottom: '24px',
        boxShadow: '0 6px 18px rgba(108,92,231,0.3)'
      }}>
        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold', letterSpacing: '1px' }}>
          WEEKLY REVIEW DAY 6
        </span>
        <h2 style={{ margin: '10px 0 6px 0', fontSize: '24px', fontWeight: '900' }}>
          🗓️ {currentLang === 'zh' ? 'Day 6 周综合错题复习测验' : (currentLang === 'fr' ? 'Day 6 Quiz de Révision Hebdomadaire' : 'Day 6 주간 종합 오답 복습 퀴즈 데이')}
        </h2>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          {currentLang === 'zh' ? '集中攻克本周所学错题，彻底消灭记忆盲区的专属复习日！' : (currentLang === 'fr' ? 'Journée spéciale pour réviser et éliminer toutes les erreurs de la semaine !' : '월~금 5일간 공부한 누적 단어 중 오답 단어를 콕 찍어 탈출하는 주간 검증 데이!')}
        </p>
      </div>

      {/* 상태별 화면 처리 */}
      {quizMode === 'review_start' && (
        <div>
          {/* 주간 학업 현황 지표 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E9ECEF' }}>
              <div style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 'bold' }}>
                📚 {currentLang === 'zh' ? '已学单词库' : (currentLang === 'fr' ? 'Mots appris' : '학습 단어 풀')}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#2C3E50', marginTop: '4px' }}>
                {Math.max(weeklyWords.length, learnedWordsList.length)}{currentLang === 'zh' ? '个' : (currentLang === 'fr' ? ' mots' : '개')}
              </div>
            </div>
            <div style={{ background: '#FDEDEC', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid #FADBD8' }}>
              <div style={{ fontSize: '12px', color: '#E74C3C', fontWeight: 'bold' }}>
                💥 {currentLang === 'zh' ? '重点攻克错题' : (currentLang === 'fr' ? 'Erreurs ciblées' : '주간 오답 단어')}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#C0392B', marginTop: '4px' }}>
                {wrongWordsList.length}{currentLang === 'zh' ? '个' : (currentLang === 'fr' ? ' mots' : '개')}
              </div>
            </div>
            <div style={{ background: '#FEF9E7', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid #FDEBD0' }}>
              <div style={{ fontSize: '12px', color: '#D35400', fontWeight: 'bold' }}>
                🏵️ {currentLang === 'zh' ? '周金牌王印' : (currentLang === 'fr' ? 'Grand tampon' : '주간 왕도장')}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#E67E22', marginTop: '4px' }}>
                {isWeeklyMasterDone ? (currentLang === 'zh' ? '已获得 💮' : (currentLang === 'fr' ? 'Obtenu 💮' : '획득 완료 💮')) : (currentLang === 'zh' ? '도전 가능' : (currentLang === 'fr' ? 'Disponible' : '도전 가능'))}
              </div>
            </div>
          </div>

          {/* 🎯 모드 선택 안내 및 탭 (1. 랜덤 20단어 총복습 vs 2. 오답 집중 탈출) */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '15px', fontWeight: '900', color: '#2C3E50', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎯</span>
              <span>{currentLang === 'zh' ? '请选择 Day 6 复习模式' : (currentLang === 'fr' ? 'Choisissez le mode de révision' : 'Day 6 복습 방식을 선택해 주세요')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* 모드 1: 20단어 랜덤 퀴즈 카드 */}
              <div
                onClick={() => setSelectedMode('random20')}
                style={{
                  padding: '18px 14px',
                  borderRadius: '18px',
                  border: selectedMode === 'random20' ? '3px solid #6C5CE7' : '2px solid #E0E0E0',
                  background: selectedMode === 'random20' ? '#F5EEF8' : '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: selectedMode === 'random20' ? '0 6px 16px rgba(108,92,231,0.2)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {selectedMode === 'random20' && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#6C5CE7', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                    ✓
                  </span>
                )}
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🎲</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2C3E50', marginBottom: '4px' }}>
                  1. 20단어 랜덤 총복습
                </div>
                <div style={{ fontSize: '12px', color: '#6C5CE7', fontWeight: 'bold', marginBottom: '6px' }}>
                  한글 뜻 + 영단어 스펠링 체크
                </div>
                <div style={{ fontSize: '12px', color: '#7F8C8D', lineHeight: 1.4 }}>
                  공부한 단어 풀에서 20개를 랜덤 추출하여 뜻과 스펠링을 종합 점검합니다.
                </div>
              </div>

              {/* 모드 2: 기존 오답 집중 탈출 카드 */}
              <div
                onClick={() => setSelectedMode('wrong_focus')}
                style={{
                  padding: '18px 14px',
                  borderRadius: '18px',
                  border: selectedMode === 'wrong_focus' ? '3px solid #E74C3C' : '2px solid #E0E0E0',
                  background: selectedMode === 'wrong_focus' ? '#FDEDEC' : '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: selectedMode === 'wrong_focus' ? '0 6px 16px rgba(231,76,60,0.2)' : 'none',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {selectedMode === 'wrong_focus' && (
                  <span style={{ position: 'absolute', top: '10px', right: '10px', background: '#E74C3C', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>
                    ✓
                  </span>
                )}
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🚨</div>
                <div style={{ fontSize: '16px', fontWeight: '900', color: '#2C3E50', marginBottom: '4px' }}>
                  2. 주간 오답 집중 탈출
                </div>
                <div style={{ fontSize: '12px', color: '#C0392B', fontWeight: 'bold', marginBottom: '6px' }}>
                  기존 오답 우선 복습 (10문항)
                </div>
                <div style={{ fontSize: '12px', color: '#7F8C8D', lineHeight: 1.4 }}>
                  최근 5일간 틀렸던 오답 단어를 1순위로 선별하여 약점을 집중 공략합니다.
                </div>
              </div>
            </div>
          </div>

          {/* 복습 설명 안내 */}
          <div style={{ background: selectedMode === 'random20' ? '#F4F6F7' : '#EBF5FB', padding: '16px', borderRadius: '18px', border: selectedMode === 'random20' ? '1px solid #D5DBDB' : '1px solid #AED6F1', marginBottom: '22px' }}>
            <h4 style={{ margin: '0 0 6px 0', color: selectedMode === 'random20' ? '#34495E' : '#2980B9', fontSize: '15px', fontWeight: 'bold' }}>
              💡 {selectedMode === 'random20' ? '🎲 20단어 랜덤 총복습 안내' : '🚨 오답 집중 복습 안내'}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#34495E', lineHeight: '1.5' }}>
              {selectedMode === 'random20' ? (
                <>
                  <li>공부한 단어들 중 무작위 20단어가 출제됩니다.</li>
                  <li><strong>한글 뜻 선택 퀴즈</strong>와 <strong>영어 스펠링 체크 퀴즈</strong>가 번갈아 출제됩니다.</li>
                  <li>스펠링 퀴즈는 보기 클릭 또는 직접 입력창을 통해 손쉽게 정답을 맞힐 수 있습니다.</li>
                  <li>완수 시 🏵️ <strong>[Day 6 주간 복습 완수 왕도장]</strong>이 수여됩니다.</li>
                </>
              ) : (
                <>
                  <li>최근 5일간 공부하며 틀렸던 단어를 1순위로 10문제 자동 출제합니다.</li>
                  <li>오답을 완벽히 교정하여 취약한 단어를 내 것으로 만듭니다.</li>
                  <li>완수 시 🏵️ <strong>[Day 6 주간 오답 탈출 골드 왕도장]</strong>이 수여됩니다.</li>
                </>
              )}
            </ul>
          </div>

          {/* 퀴즈 시작 버튼 */}
          <button
            onClick={selectedMode === 'random20' ? startRandom20Quiz : startDay6Quiz}
            style={{
              width: '100%',
              background: selectedMode === 'random20' ? 'linear-gradient(135deg, #6C5CE7 0%, #8E44AD 100%)' : 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
              color: 'white',
              border: 'none',
              padding: '18px',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: selectedMode === 'random20' ? '0 8px 20px rgba(108,92,231,0.3)' : '0 8px 20px rgba(231,76,60,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {selectedMode === 'random20'
              ? '🎲 20단어 랜덤 퀴즈 시작하기 (한글 뜻 & 스펠링) ➔'
              : '🚨 주간 오답 집중 탈출 퀴즈 시작하기 (10문항) ➔'}
          </button>
        </div>
      )}

      {/* 퀴즈 진행 중 화면 */}
      {quizMode === 'quiz_active' && quizQuestions.length > 0 && (
        <div>
          {/* 모드 배지 및 프로그레스 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                background: activeQuizType === 'random20' ? '#6C5CE7' : '#E74C3C',
                color: 'white',
                padding: '4px 10px',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                {activeQuizType === 'random20' ? '🎲 20단어 랜덤 총복습' : '🚨 오답 집중 탈출'}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2C3E50' }}>
                {currentLang === 'zh' ? `第 ${currentQIndex + 1} / ${quizQuestions.length} 题` : (currentLang === 'fr' ? `Question ${currentQIndex + 1} / ${quizQuestions.length}` : `문제 ${currentQIndex + 1} / ${quizQuestions.length}`)}
              </span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#27AE60', background: '#E8F8F5', padding: '4px 12px', borderRadius: '12px' }}>
              {currentLang === 'zh' ? `当前得分: ${score}分` : (currentLang === 'fr' ? `Score: ${score} pts` : `현재 점수: ${score}점`)}
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: '#E9ECEF', borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{
              width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%`,
              height: '100%',
              background: activeQuizType === 'random20' ? 'linear-gradient(90deg, #6C5CE7 0%, #8E44AD 100%)' : 'linear-gradient(90deg, #E74C3C 0%, #C0392B 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* 문제 카드 (한글 뜻 퀴즈 vs 스펠링 체크 퀴즈) */}
          {(() => {
            const currentQ = quizQuestions[currentQIndex];
            const isSpelling = currentQ.type === 'spelling';

            return (
              <div>
                <div style={{
                  background: '#FFFFFF',
                  padding: '24px 20px',
                  borderRadius: '20px',
                  textAlign: 'center',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
                  border: isSpelling ? '2px solid #D7BDE2' : '2px solid #EBF5FB',
                  marginBottom: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '12px',
                      background: isSpelling ? '#F4ECF7' : '#E8F8F5',
                      color: isSpelling ? '#8E44AD' : '#27AE60',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      border: isSpelling ? '1px solid #D2B4DE' : '1px solid #A3E4D7'
                    }}>
                      {isSpelling ? '✍️ [스펠링 체크 퀴즈] 알맞은 영어 철자를 선택하세요' : '📖 [한글 뜻 퀴즈] 단어의 알맞은 의미를 고르세요'}
                    </span>
                    <button
                      onClick={() => playUniversalAudio(currentQ.word)}
                      style={{
                        background: '#3498DB',
                        color: 'white',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="발음 듣기"
                    >
                      🔊 발음
                    </button>
                  </div>

                  {/* 문제 제시어 */}
                  <h1 style={{
                    margin: '8px 0 4px 0',
                    fontSize: isSpelling ? '30px' : '36px',
                    color: isSpelling ? '#8E44AD' : '#2C3E50',
                    fontWeight: '900',
                    letterSpacing: isSpelling ? '0.5px' : 'normal'
                  }}>
                    {isSpelling ? currentQ.meaning : currentQ.word}
                  </h1>

                  {currentQ.phonics && (
                    <p style={{ margin: 0, fontSize: '15px', color: '#3498DB', fontWeight: 'bold' }}>
                      {currentQ.phonics}
                    </p>
                  )}

                  {/* 스펠링 직접 입력창 (스펠링 퀴즈일 때 추가 편의 제공) */}
                  {isSpelling && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px', maxWidth: '360px', margin: '16px auto 0 auto' }}>
                      <input
                        type="text"
                        placeholder="스펠링 직접 타이핑 또는 아래 보기 클릭"
                        value={typedSpelling}
                        onChange={(e) => {
                          if (!isAnswerChecked) {
                            setTypedSpelling(e.target.value);
                            setSelectedOption(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (!isAnswerChecked && (typedSpelling.trim() || selectedOption)) {
                              handleCheckAnswer();
                            }
                          }
                        }}
                        disabled={isAnswerChecked}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '2px solid #8E44AD',
                          fontSize: '15px',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* 4지선다 보기 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = selectedOption === opt || (isSpelling && typedSpelling.trim().toLowerCase() === opt.toLowerCase());

                    let btnStyle = {
                      padding: '16px',
                      borderRadius: '16px',
                      border: '2px solid #BDC3C7',
                      background: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: '#2C3E50',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    };

                    if (isSelected) {
                      btnStyle.border = '2px solid #6C5CE7';
                      btnStyle.background = '#F5EEF8';
                      btnStyle.color = '#8E44AD';
                    }

                    if (isAnswerChecked) {
                      const isTargetCorrect = isSpelling
                        ? opt.toLowerCase() === currentQ.correctAnswer.toLowerCase()
                        : opt === currentQ.correctAnswer;

                      if (isTargetCorrect) {
                        btnStyle.border = '2px solid #2ECC71';
                        btnStyle.background = '#E8F8F5';
                        btnStyle.color = '#27AE60';
                      } else if (isSelected) {
                        btnStyle.border = '2px solid #E74C3C';
                        btnStyle.background = '#FDEDEC';
                        btnStyle.color = '#C0392B';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectOption(opt)}
                        style={btnStyle}
                      >
                        <span>{oIdx + 1}. {opt}</span>
                        {isSpelling && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              playUniversalAudio(opt);
                            }}
                            style={{ fontSize: '14px', padding: '2px 8px', borderRadius: '8px', background: '#EBEDEF', color: '#555' }}
                          >
                            🔊
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 정답/오답 실시간 피드백 */}
                {isAnswerChecked && (
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: isCorrect ? '#E8F8F5' : '#FDEDEC',
                    border: isCorrect ? '2px solid #2ECC71' : '2px solid #E74C3C',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: isCorrect ? '#27AE60' : '#C0392B', marginBottom: '4px' }}>
                      {isCorrect ? '🎉 정답입니다! 완벽해요! 👏' : '❌ 아쉬워요! 올바른 답을 확인하세요.'}
                    </div>
                    <div style={{ fontSize: '14px', color: '#2C3E50', fontWeight: 'bold' }}>
                      정답: <span style={{ color: '#27AE60', fontSize: '16px' }}>{currentQ.correctAnswer}</span> ({currentQ.word} = {currentQ.meaning})
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 하단 제어 버튼 */}
          {!isAnswerChecked ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption && !typedSpelling.trim()}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: (selectedOption || typedSpelling.trim()) ? '#6C5CE7' : '#BDC3C7',
                color: 'white',
                border: 'none',
                fontSize: '17px',
                fontWeight: 'bold',
                cursor: (selectedOption || typedSpelling.trim()) ? 'pointer' : 'not-allowed'
              }}
            >
              {currentLang === 'zh' ? '确认答案 ➔' : (currentLang === 'fr' ? 'Vérifier la réponse ➔' : '정답 확인 ➔')}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: '#2ECC71',
                color: 'white',
                border: 'none',
                fontSize: '17px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {currentQIndex + 1 < quizQuestions.length
                ? (currentLang === 'zh' ? '下一道复习题 ➔' : (currentLang === 'fr' ? 'Question suivante ➔' : '다음 복습 문제로 이동 ➔'))
                : (currentLang === 'zh' ? '🏵️ 领取 Day 6 周复习王印 ➔' : (currentLang === 'fr' ? '🏵️ Recevoir le Grand Tampon ➔' : '🏵️ Day 6 주간 복습 완수 도장 받기 ➔'))}
            </button>
          )}
        </div>
      )}

      {/* 퀴즈 최종 완료 세레머니 */}
      {quizMode === 'quiz_completed' && (
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>🏵️</div>
          <h2 style={{ fontSize: '26px', color: '#2C3E50', fontWeight: '900', margin: '0 0 10px 0' }}>
            {activeQuizType === 'random20'
              ? '🎉 축하합니다! Day 6 주간 20단어 랜덤 총복습 완수!'
              : '🎉 축하합니다! Day 6 주간 오답 집중 탈출 완수!'}
          </h2>
          <p style={{ fontSize: '16px', color: '#7F8C8D', margin: '0 0 20px 0' }}>
            {currentLang === 'zh' ? `最终得分: ` : (currentLang === 'fr' ? `Score final : ` : `최종 점수: `)}
            <strong style={{ color: '#6C5CE7', fontSize: '22px' }}>{Math.round((score / quizQuestions.length) * 100)}점</strong> ({score} / {quizQuestions.length} 정답)
          </p>

          <div style={{ background: '#FEF9E7', padding: '20px', borderRadius: '20px', border: '2px solid #FDEBD0', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>💮 ➔ 🏵️</span>
            <h4 style={{ margin: '8px 0 4px 0', color: '#D35400', fontSize: '18px', fontWeight: 'bold' }}>
              {activeQuizType === 'random20'
                ? '[Day 6 주간 20단어 총복습 왕도장] 수여 완료!'
                : '[Day 6 주간 오답 탈출 골드 왕도장] 수여 완료!'}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#7F8C8D' }}>
              {currentLang === 'zh' ? '已记录到云端数据库，下一轮周学习将无缝延续。' : (currentLang === 'fr' ? 'Enregistré sur la base cloud, la suite du programme est prête.' : '클라우드 DB에 기록되었으며, 6일차 복습 도장이 안전하게 등록되었습니다.')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => setQuizMode('review_start')}
              style={{
                background: '#6C5CE7',
                color: 'white',
                border: 'none',
                padding: '16px 24px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              🔄 {currentLang === 'zh' ? '返回周复习主页' : (currentLang === 'fr' ? 'Retour au menu Day 6' : '다른 모드도 도전하기')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
