'use client';

import { useState, useEffect, useCallback } from 'react';
import supabase from '../../lib/supabaseClient.js';
import { t, getLocalDateString } from '../../lib/i18n.js';

export default function PersonalVocabSection({ currentUser, onPlayAudio, initialTab = 'custom', currentLang = 'ko' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'custom', 'wrong'
  const [myVocabList, setMyVocabList] = useState([]);
  const [wrongAnswersList, setWrongAnswersList] = useState([]);

  // 입력 폼
  const [wordInput, setWordInput] = useState('');
  const [meaningInput, setMeaningInput] = useState('');
  const [phonicsInput, setPhonicsInput] = useState('');

  const userId = currentUser ? currentUser.id : 'guest';

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // 클라우드 DB에서 퀴즈 오답노트 로드
  const loadWrongAnswersFromCloud = useCallback(async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('student_wrong_answers')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('id', { ascending: false });

      if (!error && data) {
        const formatted = data.map(item => ({
          id: item.id,
          word: item.word,
          meaning: item.meaning,
          phonics: item.phonics,
          category: item.category,
          addedAt: item.added_at
        }));
        setWrongAnswersList(formatted);
        localStorage.setItem(`wrong_answers_${currentUser.id}`, JSON.stringify(formatted));
        return;
      }
    } catch (e) {
      console.log('Cloud wrong answers fallback to local');
    }

    try {
      const savedWrong = JSON.parse(localStorage.getItem(`wrong_answers_${userId}`) || '[]');
      setWrongAnswersList(savedWrong);
    } catch (e) {
      setWrongAnswersList([]);
    }
  }, [currentUser, userId]);

  // 개인 단어장 로드
  const loadCustomVocab = useCallback(() => {
    try {
      const savedCustom = JSON.parse(localStorage.getItem(`my_vocab_${userId}`) || '[]');
      setMyVocabList(savedCustom);
    } catch (e) {
      setMyVocabList([]);
    }
  }, [userId]);

  useEffect(() => {
    loadCustomVocab();
    loadWrongAnswersFromCloud();
  }, [loadCustomVocab, loadWrongAnswersFromCloud]);

  // 나만의 단어 추가
  const handleAddCustomWord = (e) => {
    e.preventDefault();
    if (!wordInput.trim() || !meaningInput.trim()) {
      alert(currentLang === 'zh' ? '请输入英文单词和释义。' : (currentLang === 'fr' ? 'Veuillez saisir le mot anglais et sa signification.' : '영어 단어와 한글 뜻을 입력해 주세요.'));
      return;
    }

    const newWordItem = {
      id: Date.now(),
      word: wordInput.trim(),
      meaning: meaningInput.trim(),
      phonics: phonicsInput.trim() || '',
      category: currentLang === 'zh' ? '专属生词' : (currentLang === 'fr' ? 'Mon vocabulaire' : '나만의 단어'),
      addedAt: getLocalDateString()
    };

    const updated = [newWordItem, ...myVocabList];
    setMyVocabList(updated);
    localStorage.setItem(`my_vocab_${userId}`, JSON.stringify(updated));

    setWordInput('');
    setMeaningInput('');
    setPhonicsInput('');
    alert(currentLang === 'zh'
      ? `'${newWordItem.word}' 单词已成功保存到您的生词本中！`
      : (currentLang === 'fr'
      ? `'${newWordItem.word}' a été ajouté à votre carnet personnel !`
      : `'${newWordItem.word}' 단어가 나만의 단어장에 저장되었습니다!`));
  };

  // 나만의 단어 삭제
  const handleDeleteCustomWord = (id) => {
    const updated = myVocabList.filter(item => item.id !== id);
    setMyVocabList(updated);
    localStorage.setItem(`my_vocab_${userId}`, JSON.stringify(updated));
  };

  // ❌ 퀴즈 오답노트 마스터(삭제)
  const handleDeleteWrongAnswer = async (id, wordStr) => {
    try {
      await supabase.from('student_wrong_answers').delete().eq('id', id);
    } catch (e) {
      console.log('Cloud wrong answer delete fallback');
    }

    const updated = wrongAnswersList.filter(item => item.id !== id);
    setWrongAnswersList(updated);
    localStorage.setItem(`wrong_answers_${userId}`, JSON.stringify(updated));
  };

  return (
    <div className="personal-vocab-card" style={{ padding: '20px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      {/* 2대 서브 탭 (⭐ 나만의 단어장 vs ❌ 퀴즈 오답노트) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('custom')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '16px',
            border: activeTab === 'custom' ? '2px solid #F1C40F' : '1px solid #BDC3C7',
            background: activeTab === 'custom' ? '#FEF9E7' : '#F8F9FA',
            color: activeTab === 'custom' ? '#D4AC0D' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {t('myvocab_tab_custom', currentLang)} ({myVocabList.length})
        </button>

        <button
          onClick={() => setActiveTab('wrong')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '16px',
            border: activeTab === 'wrong' ? '2px solid #E74C3C' : '1px solid #BDC3C7',
            background: activeTab === 'wrong' ? '#FADBD8' : '#F8F9FA',
            color: activeTab === 'wrong' ? '#C0392B' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {t('myvocab_tab_wrong', currentLang)} ({wrongAnswersList.length})
        </button>
      </div>

      {/* 탭 1: 나만의 개인 단어장 */}
      {activeTab === 'custom' && (
        <>
          <form onSubmit={handleAddCustomWord} style={{ background: '#F8F9FA', padding: '16px', borderRadius: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0 0 6px 0', color: '#2C3E50', fontSize: '15px' }}>
              ➕ {t('myvocab_add_title', currentLang)}
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder={currentLang === 'zh' ? '英语单词 (例: Flashlight)' : (currentLang === 'fr' ? 'Mot anglais (Ex: Flashlight)' : '영어 단어 (예: Flashlight)')}
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                style={{ flex: 1, minWidth: '130px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
              <input
                type="text"
                placeholder={currentLang === 'zh' ? '中文释义 (例: 手电筒)' : (currentLang === 'fr' ? 'Signification (Ex: Lampe de poche)' : '한글 뜻 (예: 손전등)')}
                value={meaningInput}
                onChange={(e) => setMeaningInput(e.target.value)}
                style={{ flex: 1, minWidth: '130px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
              <input
                type="text"
                placeholder={currentLang === 'zh' ? '音标/发音 (选填)' : (currentLang === 'fr' ? 'Phonétique (optionnel)' : '발음기호/발음 (선택)')}
                value={phonicsInput}
                onChange={(e) => setPhonicsInput(e.target.value)}
                style={{ flex: 1, minWidth: '110px', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
              <button
                type="submit"
                style={{ background: '#F1C40F', color: '#7D6608', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                {t('btn_add', currentLang)}
              </button>
            </div>
          </form>

          {/* 목록 표시 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myVocabList.length > 0 ? (
              myVocabList.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FEF9E7', borderRadius: '16px', border: '1px solid #F9E79F' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2C3E50' }}>{item.word}</span>
                      <button onClick={() => onPlayAudio(item.word)} style={{ background: '#3498DB', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>
                        🔊
                      </button>
                    </div>
                    <div style={{ color: '#E74C3C', fontWeight: 'bold', fontSize: '15px', marginTop: '2px' }}>{item.meaning}</div>
                    {item.phonics && <div style={{ color: '#7F8C8D', fontSize: '12px' }}>{item.phonics}</div>}
                  </div>
                  <button onClick={() => handleDeleteCustomWord(item.id)} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                    {t('btn_delete', currentLang)}
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#7F8C8D', background: '#F8F9FA', borderRadius: '16px' }}>
                {t('myvocab_empty', currentLang)}
              </div>
            )}
          </div>
        </>
      )}

      {/* 탭 2: ❌ 퀴즈 오답노트 */}
      {activeTab === 'wrong' && (
        <div>
          <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#7F8C8D' }}>
            {t('wrongvocab_guide', currentLang)}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wrongAnswersList.length > 0 ? (
              wrongAnswersList.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#FADBD8', borderRadius: '16px', border: '1px solid #F5B7B1' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#78281F' }}>{item.word}</span>
                      <button onClick={() => onPlayAudio(item.word)} style={{ background: '#E74C3C', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '12px' }}>
                        🔊
                      </button>
                    </div>
                    <div style={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '15px', marginTop: '2px' }}>{item.meaning}</div>
                    <div style={{ color: '#7F8C8D', fontSize: '12px' }}>{item.addedAt || (currentLang === 'zh' ? '错题' : (currentLang === 'fr' ? 'Erreur' : '오답'))}</div>
                  </div>
                  <button onClick={() => handleDeleteWrongAnswer(item.id, item.word)} style={{ background: '#27AE60', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                    {t('btn_master_del', currentLang)}
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#27AE60', background: '#E8F8F5', borderRadius: '16px', fontWeight: 'bold' }}>
                {t('wrongvocab_empty', currentLang)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
