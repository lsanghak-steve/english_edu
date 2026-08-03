'use client';

import { useState, useEffect } from 'react';

export default function PersonalVocabSection({ currentUser, onPlayAudio }) {
  const [subTab, setSubTab] = useState('myvocab'); // 'myvocab', 'wrong'
  const [myVocabList, setMyVocabList] = useState([]);
  const [wrongList, setWrongList] = useState([]);
  const [newWordInput, setNewWordInput] = useState('');
  const [newMeaningInput, setNewMeaningInput] = useState('');

  // 내 단어장 및 오답노트 로드
  useEffect(() => {
    if (!currentUser) return;

    // 1. 내 단어장 로드
    const myVocabKey = `my_vocab_${currentUser.id}`;
    try {
      const saved = JSON.parse(localStorage.getItem(myVocabKey) || '[]');
      setMyVocabList(saved);
    } catch (e) {
      setMyVocabList([]);
    }

    // 2. 오답노트 로드
    const wrongKey = `wrong_answers_${currentUser.id}`;
    try {
      const savedWrong = JSON.parse(localStorage.getItem(wrongKey) || '[]');
      setWrongList(savedWrong);
    } catch (e) {
      setWrongList([]);
    }
  }, [currentUser, subTab]);

  // 직접 단어 추가
  const handleAddWord = (e) => {
    e.preventDefault();
    if (!newWordInput.trim()) return;

    const newItem = {
      id: Date.now(),
      word: newWordInput.trim(),
      meaning: newMeaningInput.trim() || '뜻 미입력',
      addedAt: new Date().toISOString().split('T')[0]
    };

    const updated = [newItem, ...myVocabList];
    setMyVocabList(updated);
    if (currentUser) {
      localStorage.setItem(`my_vocab_${currentUser.id}`, JSON.stringify(updated));
    }

    setNewWordInput('');
    setNewMeaningInput('');
  };

  // 내 단어 삭제
  const handleDeleteMyWord = (id) => {
    const updated = myVocabList.filter(item => item.id !== id);
    setMyVocabList(updated);
    if (currentUser) {
      localStorage.setItem(`my_vocab_${currentUser.id}`, JSON.stringify(updated));
    }
  };

  // 오답노트 단어 마스터(삭제)
  const handleDeleteWrongWord = (id) => {
    const updated = wrongList.filter(item => item.id !== id);
    setWrongList(updated);
    if (currentUser) {
      localStorage.setItem(`wrong_answers_${currentUser.id}`, JSON.stringify(updated));
    }
  };

  return (
    <div className="word-list-section" style={{ padding: '20px' }}>
      {/* 서브 탭 메뉴 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setSubTab('myvocab')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '14px',
            border: subTab === 'myvocab' ? '2px solid #F1C40F' : '1px solid #BDC3C7',
            background: subTab === 'myvocab' ? '#FEF9E7' : '#F8F9FA',
            color: subTab === 'myvocab' ? '#D4AC0D' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ⭐ 내 단어장 ({myVocabList.length})
        </button>
        <button
          onClick={() => setSubTab('wrong')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '14px',
            border: subTab === 'wrong' ? '2px solid #E74C3C' : '1px solid #BDC3C7',
            background: subTab === 'wrong' ? '#FADBD8' : '#F8F9FA',
            color: subTab === 'wrong' ? '#C0392B' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          ❌ 퀴즈 오답노트 ({wrongList.length})
        </button>
      </div>

      {/* 탭 1: ⭐ 내 단어장 */}
      {subTab === 'myvocab' && (
        <>
          <form onSubmit={handleAddWord} style={{ background: '#F8F9FA', padding: '16px', borderRadius: '16px', border: '1px solid #E9ECEF', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#2C3E50' }}>➕ 나만의 영단어 추가하기</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                placeholder="영단어 (예: Sunshine)"
                value={newWordInput}
                onChange={(e) => setNewWordInput(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7' }}
              />
              <input
                type="text"
                placeholder="한글 뜻 (예: 햇살)"
                value={newMeaningInput}
                onChange={(e) => setNewMeaningInput(e.target.value)}
                style={{ flex: 1, padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7' }}
              />
            </div>
            <button type="submit" style={{ width: '100%', background: '#F1C40F', color: '#7D6608', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              ⭐ 단어장에 저장하기
            </button>
          </form>

          {myVocabList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myVocabList.map((item) => (
                <div key={item.id} style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '16px', border: '1px solid #E9ECEF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#2C3E50' }}>{item.word}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#27AE60', fontWeight: 'bold' }}>{item.meaning}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onPlayAudio && onPlayAudio(item.word)}
                      style={{ background: '#EBF5FB', border: '1px solid #3498DB', color: '#2980B9', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🔊 발음
                    </button>
                    <button
                      onClick={() => handleDeleteMyWord(item.id)}
                      style={{ background: '#FDEDEC', border: '1px solid #E74C3C', color: '#C0392B', padding: '6px 10px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#95A5A6', padding: '40px 0' }}>
              보관된 나만의 단어가 없습니다. 위에서 새로 단어를 추가해 보세요!
            </p>
          )}
        </>
      )}

      {/* 탭 2: ❌ 퀴즈 오답노트 */}
      {subTab === 'wrong' && (
        <>
          <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#C0392B', fontWeight: 'bold' }}>
            📝 퀴즈를 풀다가 틀린 단어가 자동으로 이곳에 모입니다! 복습 후 완수한 단어는 🗑️ 삭제해 보세요!
          </div>

          {wrongList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {wrongList.map((item) => (
                <div key={item.id} style={{ background: '#FFFFFF', padding: '14px 16px', borderRadius: '16px', border: '1px solid #FADBD8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.05)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#C0392B', fontWeight: 'bold' }}>{item.word}</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#2C3E50', fontWeight: 'bold' }}>{item.meaning}</p>
                    <span style={{ fontSize: '11px', color: '#95A5A6' }}>오답 날짜: {item.addedAt || '기록됨'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onPlayAudio && onPlayAudio(item.word)}
                      style={{ background: '#EBF5FB', border: '1px solid #3498DB', color: '#2980B9', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      🔊 발음
                    </button>
                    <button
                      onClick={() => handleDeleteWrongWord(item.id)}
                      style={{ background: '#E8F8F5', border: '1px solid #2ECC71', color: '#27AE60', padding: '6px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                      title="복습 완료 마스터"
                    >
                      ✅ 마스터
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#27AE60', fontWeight: 'bold', padding: '40px 0' }}>
              🎉 오답노트가 깨끗합니다! 틀린 단어가 하나도 없어요!
            </p>
          )}
        </>
      )}
    </div>
  );
}
