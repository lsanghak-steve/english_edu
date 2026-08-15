'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';
import { t } from '../../lib/i18n.js';

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
  const [wrongWordsList, setWrongWordsList] = useState([]);
  const [quizMode, setQuizMode] = useState('review_start'); // 'review_start', 'quiz_active', 'quiz_completed'
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isWeeklyMasterDone, setIsWeeklyMasterDone] = useState(false);

  const studentCode = currentUser?.student_id || currentUser?.id || 'guest';
  const studentName = (currentUser?.name || '').replace(/\(.*?\)/g, '').trim();

  // 1. 최근 5일간 오답 및 학습 이력 DB에서 집계
  useEffect(() => {
    let isMounted = true;

    async function loadDay6Data() {
      setLoading(true);
      try {
        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ timeout: true }), 1500));

        const fetchPromise = (async () => {
          const [wrongRes, recordsRes] = await Promise.allSettled([
            supabase.from('wrong_words').select('*').eq('student_id', studentCode),
            supabase.from('study_records').select('*').eq('student_id', studentCode)
          ]);
          return { wrongRes, recordsRes };
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

          if (combined.length === 0) {
            combined = wordList500Fallback.slice(0, 10).map(w => sanitizeWordObject(w, currentLang));
          }

          setWeeklyWords(combined);
        }
      } catch (e) {
        console.log('Day 6 data load error', e);
        if (isMounted) {
          const fallback = (safeActiveWords && safeActiveWords.length > 0)
            ? safeActiveWords.map(w => sanitizeWordObject(w, currentLang))
            : wordList500Fallback.slice(0, 10).map(w => sanitizeWordObject(w, currentLang));
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

  // 2. Day 6 퀴즈 문제 생성
  const startDay6Quiz = () => {
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
        word: target.word,
        phonics: target.phonics || '',
        meaning: target.meaning,
        options: options,
        correctMeaning: target.meaning
      };
    });

    setQuizQuestions(generated);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setQuizMode('quiz_active');
  };

  // 3. 답변 선택 처리
  const handleSelectOption = (opt) => {
    if (isAnswerChecked) return;
    setSelectedOption(opt);
  };

  // 4. 정답 확인
  const handleCheckAnswer = () => {
    if (!selectedOption || isAnswerChecked) return;
    const currentQ = quizQuestions[currentQIndex];
    const correct = selectedOption === currentQ.correctMeaning;
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
      setIsAnswerChecked(false);
    } else {
      setQuizMode('quiz_completed');
      setIsWeeklyMasterDone(true);

      const finalScorePct = Math.round((score / quizQuestions.length) * 100);

      // Supabase DB study_records에 주간 종합 복습 왕도장(🏵️) 기록 저장
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('study_records').upsert({
          student_id: studentCode,
          study_date: todayStr,
          detail_stage: `🗓️ Day 6 주간 종합 오답 복습 완수 (🏵️ 주간 왕도장 획득 - ${finalScorePct}점)`,
          score: finalScorePct
        }, { onConflict: 'student_id,study_date' });
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E9ECEF' }}>
              <div style={{ fontSize: '12px', color: '#7F8C8D', fontWeight: 'bold' }}>
                📚 {currentLang === 'zh' ? '本周学习单词' : (currentLang === 'fr' ? 'Mots appris' : '주간 공부 단어')}
              </div>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#2C3E50', marginTop: '4px' }}>
                {weeklyWords.length}{currentLang === 'zh' ? '个' : (currentLang === 'fr' ? ' mots' : '개')}
              </div>
            </div>
            <div style={{ background: '#FDEDEC', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid #FADBD8' }}>
              <div style={{ fontSize: '12px', color: '#E74C3C', fontWeight: 'bold' }}>
                💥 {currentLang === 'zh' ? '重点攻克错题' : (currentLang === 'fr' ? 'Erreurs ciblées' : '주간 집중 오답')}
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
                {isWeeklyMasterDone ? (currentLang === 'zh' ? '已获得 💮' : (currentLang === 'fr' ? 'Obtenu 💮' : '획득 완료 💮')) : (currentLang === 'zh' ? '可挑战' : (currentLang === 'fr' ? 'Disponible' : '도전 가능'))}
              </div>
            </div>
          </div>

          {/* 복습 설명 안내 */}
          <div style={{ background: '#EBF5FB', padding: '18px', borderRadius: '18px', border: '1px solid #AED6F1', marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2980B9', fontSize: '16px', fontWeight: 'bold' }}>
              💡 {currentLang === 'zh' ? '什么是 Day 6 周综合错题日？' : (currentLang === 'fr' ? "Qu'est-ce que le Day 6 de révision ?" : 'Day 6 주간 종합 오답 데이란?')}
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#34495E', lineHeight: '1.6' }}>
              <li>{currentLang === 'zh' ? '自动提取过去 5 天学习中经常出错的单词作为第一优先级。' : (currentLang === 'fr' ? "Extrait en priorité les mots sur lesquels vous avez fait des erreurs ces 5 derniers jours." : '최근 5일간 공부한 누적 단어 중 자주 틀렸던 오답 단어를 1순위로 자동 추출합니다.')}</li>
              <li>{currentLang === 'zh' ? '通关复习测验后，将获得 🏵️ [Day 6 周错题脱出金牌王印]！' : (currentLang === 'fr' ? "En validant le quiz, vous recevrez le 🏵️ [Grand Tampon d'Or de Révision Day 6] !" : '복습 퀴즈를 통과하면 🏵️ [Day 6 주간 오답 탈출 왕도장]을 수여받게 됩니다!')}</li>
            </ul>
          </div>

          {/* 퀴즈 시작 버튼 */}
          <button
            onClick={startDay6Quiz}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6C5CE7 0%, #8E44AD 100%)',
              color: 'white',
              border: 'none',
              padding: '18px',
              borderRadius: '20px',
              fontSize: '18px',
              fontWeight: '900',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(108,92,231,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            🚀 {currentLang === 'zh' ? '开始 Day 6 周错题脱出测验 (10题) ➔' : (currentLang === 'fr' ? 'Commencer le Quiz Day 6 (10 questions) ➔' : 'Day 6 주간 종합 오답 탈출 퀴즈 시작하기 (10문항) ➔')}
          </button>
        </div>
      )}

      {/* 퀴즈 진행 중 화면 */}
      {quizMode === 'quiz_active' && quizQuestions.length > 0 && (
        <div>
          {/* 프로그레스 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#6C5CE7' }}>
              {currentLang === 'zh' ? `第 ${currentQIndex + 1} / ${quizQuestions.length} 题` : (currentLang === 'fr' ? `Question ${currentQIndex + 1} / ${quizQuestions.length}` : `문제 ${currentQIndex + 1} / ${quizQuestions.length}`)}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#27AE60' }}>
              {currentLang === 'zh' ? `当前得分: ${score}分` : (currentLang === 'fr' ? `Score: ${score} pts` : `현재 점수: ${score}점`)}
            </span>
          </div>

          <div style={{ width: '100%', height: '10px', background: '#E9ECEF', borderRadius: '5px', overflow: 'hidden', marginBottom: '24px' }}>
            <div style={{
              width: `${((currentQIndex + 1) / quizQuestions.length) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6C5CE7 0%, #8E44AD 100%)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* 문제 카드 */}
          <div style={{ background: '#FFFFFF', padding: '30px 20px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.06)', border: '2px solid #EBF5FB', marginBottom: '20px' }}>
            <span style={{ fontSize: '12px', background: '#FADBD8', color: '#C0392B', padding: '4px 10px', borderRadius: '10px', fontWeight: 'bold' }}>
              💥 {currentLang === 'zh' ? '周错题重点复习单词' : (currentLang === 'fr' ? 'Mot clé à réviser' : '주간 오답 집중 복습 단어')}
            </span>
            <h1 style={{ margin: '14px 0 6px 0', fontSize: '36px', color: '#2C3E50', fontWeight: '900' }}>
              {quizQuestions[currentQIndex].word}
            </h1>
            {quizQuestions[currentQIndex].phonics && (
              <p style={{ margin: 0, fontSize: '16px', color: '#3498DB', fontWeight: 'bold' }}>
                {quizQuestions[currentQIndex].phonics}
              </p>
            )}
          </div>

          {/* 4지선다 보기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {quizQuestions[currentQIndex].options.map((opt, oIdx) => {
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
                transition: 'all 0.2s ease'
              };

              if (selectedOption === opt) {
                btnStyle.border = '2px solid #6C5CE7';
                btnStyle.background = '#F5EEF8';
                btnStyle.color = '#8E44AD';
              }

              if (isAnswerChecked) {
                if (opt === quizQuestions[currentQIndex].correctMeaning) {
                  btnStyle.border = '2px solid #2ECC71';
                  btnStyle.background = '#E8F8F5';
                  btnStyle.color = '#27AE60';
                } else if (selectedOption === opt) {
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
                  {oIdx + 1}. {opt}
                </button>
              );
            })}
          </div>

          {/* 하단 제어 버튼 */}
          {!isAnswerChecked ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                background: selectedOption ? '#6C5CE7' : '#BDC3C7',
                color: 'white',
                border: 'none',
                fontSize: '17px',
                fontWeight: 'bold',
                cursor: selectedOption ? 'pointer' : 'not-allowed'
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
                : (currentLang === 'zh' ? '🏵️ 领取 Day 6 周复习王印 ➔' : (currentLang === 'fr' ? '🏵️ Recevoir le Grand Tampon ➔' : '🏵️ Day 6 주간 오답 복습 완수 도장 받기 ➔'))}
            </button>
          )}
        </div>
      )}

      {/* 퀴즈 최종 완료 세레머니 */}
      {quizMode === 'quiz_completed' && (
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>🏵️</div>
          <h2 style={{ fontSize: '26px', color: '#2C3E50', fontWeight: '900', margin: '0 0 10px 0' }}>
            {currentLang === 'zh' ? '🎉 恭喜！Day 6 周错题复习圆满完成！' : (currentLang === 'fr' ? '🎉 Félicitations ! Révision Day 6 terminée !' : '축하합니다! Day 6 주간 오답 복습 완수!')}
          </h2>
          <p style={{ fontSize: '16px', color: '#7F8C8D', margin: '0 0 20px 0' }}>
            {currentLang === 'zh' ? `最终得分: ` : (currentLang === 'fr' ? `Score final : ` : `최종 점수: `)}
            <strong style={{ color: '#6C5CE7', fontSize: '20px' }}>{Math.round((score / quizQuestions.length) * 100)}{currentLang === 'zh' ? '分' : (currentLang === 'fr' ? ' pts' : '점')}</strong> ({score} / {quizQuestions.length} {currentLang === 'zh' ? '正解' : (currentLang === 'fr' ? 'correctes' : '정답')})
          </p>

          <div style={{ background: '#FEF9E7', padding: '20px', borderRadius: '20px', border: '2px solid #FDEBD0', marginBottom: '24px' }}>
            <span style={{ fontSize: '32px' }}>💮 ➔ 🏵️</span>
            <h4 style={{ margin: '8px 0 4px 0', color: '#D35400', fontSize: '18px', fontWeight: 'bold' }}>
              {currentLang === 'zh' ? '[Day 6 周错题脱出金牌王印] 授予完成！' : (currentLang === 'fr' ? '[Grand Tampon d\'Or Day 6] attribué avec succès !' : '[Day 6 주간 오답 탈출 골드 왕도장] 수여 완료!')}
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#7F8C8D' }}>
              {currentLang === 'zh' ? '已记录到云端数据库，下一轮周学习将无缝延续。' : (currentLang === 'fr' ? 'Enregistré sur la base cloud, la suite du programme est prête.' : '클라우드 DB에 기록되었으며, 다음 회차 주간 학습이 연속으로 이어집니다.')}
            </p>
          </div>

          <button
            onClick={() => setQuizMode('review_start')}
            style={{
              background: '#6C5CE7',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🔄 {currentLang === 'zh' ? '返回周复习主页' : (currentLang === 'fr' ? 'Retour au menu Day 6' : '주간 복습 메인으로 돌아가기')}
          </button>
        </div>
      )}
    </div>
  );
}
