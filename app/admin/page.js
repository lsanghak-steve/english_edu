'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import wordList500Fallback from '../../data/wordsData.js';
import supabase from '../../lib/supabaseClient.js';

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 관리자 대시보드 2대 메인 탭: 'users' (학생/학부모 관리), 'words' (단어 관리)
  const [adminTab, setAdminTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [words, setWords] = useState(wordList500Fallback);
  const [searchQuery, setSearchQuery] = useState('');

  // 신규 학생 등록 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('초등3학년');
  const [dailyWordCount, setDailyWordCount] = useState(10);

  // 학부모 등록/수정 모달 전용 상태
  const [editingUser, setEditingUser] = useState(null);
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editParentPin, setEditParentPin] = useState('1234');

  // 단어 수정/추가 모달 전용 상태
  const [editingWord, setEditingWord] = useState(null);
  const [showWordAddModal, setShowWordAddModal] = useState(false);
  const [wordForm, setWordForm] = useState({
    id: null,
    word: '',
    phonics: '',
    meaning: '',
    category: '가족 & 사람',
    exampleEn: '',
    exampleKo: ''
  });

  useEffect(() => {
    loadUsers();
    loadWords();
  }, []);

  const loadUsers = () => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      setUsers(savedUsers);
    } catch (e) {
      setUsers([]);
    }
  };

  const loadWords = async () => {
    try {
      const { data, error } = await supabase.from('words').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        const formatted = data.map(item => ({
          id: item.id,
          word: item.word,
          phonics: item.phonics || '',
          meaning: item.meaning,
          category: item.category || '기타',
          exampleEn: item.example_en || '',
          exampleKo: item.example_ko || ''
        }));
        setWords(formatted);
      }
    } catch (e) {
      setWords(wordList500Fallback);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin1234') {
      setIsLoggedIn(true);
    } else {
      alert('관리자 비밀번호가 일치하지 않습니다. (기본 암호: admin1234)');
    }
  };

  const getUserDetails = (userId) => {
    const stampKey = `english_stamps_${userId}`;
    const learnedKey = `learned_words_${userId}`;
    const wrongKey = `wrong_answers_${userId}`;

    let stamps = [];
    let learned = [];
    let wrong = [];

    try { stamps = JSON.parse(localStorage.getItem(stampKey) || '[]'); } catch (e) {}
    try { learned = JSON.parse(localStorage.getItem(learnedKey) || '[]'); } catch (e) {}
    try { wrong = JSON.parse(localStorage.getItem(wrongKey) || '[]'); } catch (e) {}

    return { stampsCount: stamps.length, learnedCount: learned.length, wrongCount: wrong.length };
  };

  const handleDeleteUser = (userId, userName) => {
    if (confirm(`정말로 [ ${userName} ] 학생 및 연동 학부모 정보를 삭제하시겠습니까?`)) {
      const updated = users.filter(u => u.id !== userId);
      setUsers(updated);
      localStorage.setItem('english_edu_users', JSON.stringify(updated));
      alert(`${userName} 학생 정보가 삭제되었습니다.`);
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newUser = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      grade,
      dailyWordCount: parseInt(dailyWordCount, 10) || 10,
      parentName: '',
      parentPhone: '',
      parentPin: '1234',
      code: `KID-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));

    setName('');
    setShowAddModal(false);
    alert(`🎉 ${newUser.name} 학생이 새로 등록되었습니다!`);
  };

  const openParentEditModal = (user) => {
    setEditingUser(user);
    setEditParentName(user.parentName || `${user.name} 학부모님`);
    setEditParentPhone(user.parentPhone || '');
    setEditParentPin(user.parentPin || '1234');
  };

  const handleSaveParentInfo = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          parentName: editParentName.trim() || `${u.name} 학부모님`,
          parentPhone: editParentPhone.trim() || '미등록',
          parentPin: editParentPin.trim().length === 4 ? editParentPin.trim() : '1234'
        };
      }
      return u;
    });

    setUsers(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));
    localStorage.setItem(`parent_pin_${editingUser.id}`, editParentPin.trim() || '1234');

    setEditingUser(null);
    alert(`🎉 [ ${editingUser.name} ] 학생의 학부모 정보가 성공적으로 저장되었습니다!`);
  };

  // 📝 단어 수정 모달 열기
  const openWordEditModal = (w) => {
    setEditingWord(w);
    setWordForm({
      id: w.id,
      word: w.word,
      phonics: w.phonics || '',
      meaning: w.meaning,
      category: w.category || '가족 & 사람',
      exampleEn: w.exampleEn || '',
      exampleKo: w.exampleKo || ''
    });
  };

  // 📝 단어 저장/수정 실행
  const handleSaveWord = async (e) => {
    e.preventDefault();
    if (!wordForm.word || !wordForm.meaning) return;

    try {
      const { error } = await supabase.from('words').upsert([{
        id: wordForm.id || undefined,
        word: wordForm.word,
        phonics: wordForm.phonics,
        meaning: wordForm.meaning,
        category: wordForm.category,
        example_en: wordForm.exampleEn,
        example_ko: wordForm.exampleKo
      }]);
      if (error) throw error;
    } catch (e) {
      console.log('Supabase sync skipped, updating local list');
    }

    const updated = words.map(w => (w.id === wordForm.id ? { ...wordForm } : w));
    setWords(updated);
    setEditingWord(null);
    alert(`🎉 [ ${wordForm.word} ] 단어가 성공적으로 수정되었습니다!`);
  };

  // 🗑️ 단어 삭제
  const handleDeleteWord = (wordId, wordStr) => {
    if (confirm(`정말로 [ ${wordStr} ] 단어를 삭제하시겠습니까?`)) {
      const updated = words.filter(w => w.id !== wordId);
      setWords(updated);
      alert(`[ ${wordStr} ] 단어가 삭제되었습니다.`);
    }
  };

  const filteredWords = words.filter(w =>
    w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.meaning.includes(searchQuery)
  );

  if (!isLoggedIn) {
    return (
      <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px 28px', width: '100%', maxWidth: '380px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏫</div>
          <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '22px', fontWeight: '800' }}>교육 앱 통합 관리자 센터</h2>
          <p style={{ fontSize: '13px', color: '#7F8C8D', marginTop: '6px' }}>
            관리자 접속 비밀번호를 입력하세요. (초기 암호: admin1234)
          </p>

          <form onSubmit={handleLogin} style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #3498DB', fontSize: '16px', textAlign: 'center', fontWeight: 'bold' }}
            />
            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#3498DB', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              🔓 관리자 로그인
            </button>
          </form>

          <div style={{ marginTop: '20px' }}>
            <Link href="/" style={{ fontSize: '13px', color: '#7F8C8D', textDecoration: 'none' }}>
              ◀ 메인 학습 화면으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F4F6F9', padding: '20px' }}>
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* 상단 타이틀 및 메인 2대 관리자 탭 */}
        <div style={{ background: 'white', padding: '20px 24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '20px' }}>🏫 원장/선생님 통합 관리자 센터</h2>
              <span style={{ fontSize: '12px', color: '#27AE60', fontWeight: 'bold' }}>
                학생/학부모 관리 및 534개 영단어 DB 통합 컨트롤
              </span>
            </div>
            <Link href="/" style={{ background: '#EBF5FB', color: '#2980B9', padding: '8px 14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', textDecoration: 'none' }}>
              🏠 메인 이동
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setAdminTab('users')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                border: 'none',
                background: adminTab === 'users' ? '#3498DB' : '#F8F9FA',
                color: adminTab === 'users' ? 'white' : '#7F8C8D',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              👨‍👩‍👧‍👦 학생 & 학부모 관리 ({users.length}명)
            </button>
            <button
              onClick={() => setAdminTab('words')}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '12px',
                border: 'none',
                background: adminTab === 'words' ? '#9B59B6' : '#F8F9FA',
                color: adminTab === 'words' ? 'white' : '#7F8C8D',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              📚 500 영단어 DB 관리 ({words.length}개)
            </button>
          </div>
        </div>

        {/* 탭 1: 학생 & 학부모 관리 */}
        {adminTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddModal(true)} style={{ background: '#2ECC71', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
                + 학생 추가
              </button>
            </div>

            {users.map((user) => {
              const stats = getUserDetails(user.id);
              const hasParent = user.parentName && user.parentPhone;

              return (
                <div key={user.id} style={{ background: 'white', borderRadius: '20px', padding: '18px 22px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #E9ECEF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px dashed #E9ECEF' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#3498DB', color: 'white', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                        {user.grade}
                      </span>
                      <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>{user.name}</h3>

                      {!hasParent ? (
                        <button onClick={() => openParentEditModal(user)} style={{ background: '#FADBD8', color: '#C0392B', border: '1px solid #E74C3C', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          + 학부모 등록
                        </button>
                      ) : (
                        <button onClick={() => openParentEditModal(user)} style={{ background: '#E8DAEF', color: '#8E44AD', border: '1px solid #9B59B6', padding: '4px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          ✏️ 학부모 정보 수정
                        </button>
                      )}
                    </div>

                    <button onClick={() => handleDeleteUser(user.id, user.name)} style={{ background: '#F8F9FA', color: '#95A5A6', border: '1px solid #DEE2E6', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer' }}>
                      🗑️ 삭제
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div style={{ background: hasParent ? '#F5EEF8' : '#FDFEFE', padding: '12px', borderRadius: '12px', border: hasParent ? '1px solid #E8DAEF' : '1px dashed #BDC3C7' }}>
                      <span style={{ fontSize: '12px', color: hasParent ? '#8E44AD' : '#7F8C8D', fontWeight: 'bold' }}>👨‍👩‍👧‍👦 1:1 연동 학부모</span>
                      {hasParent ? (
                        <>
                          <div style={{ marginTop: '4px', fontSize: '13px', color: '#2C3E50', fontWeight: 'bold' }}>
                            {user.parentName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#7F8C8D', marginTop: '2px' }}>
                            📱 {user.parentPhone} | 🔑 PIN: {user.parentPin || '1234'}
                          </div>
                        </>
                      ) : (
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#E74C3C', fontWeight: 'bold' }}>
                          ⚠️ 학부모 미등록 상태입니다 (+학부모 등록 버튼을 누르세요)
                        </div>
                      )}
                    </div>

                    <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '12px', border: '1px solid #E9ECEF', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#16A085', fontWeight: 'bold' }}>💮 출석</span>
                        <div style={{ color: '#27AE60', fontWeight: 'bold', fontSize: '16px' }}>{stats.stampsCount}일</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#2980B9', fontWeight: 'bold' }}>📚 학습 완료</span>
                        <div style={{ color: '#3498DB', fontWeight: 'bold', fontSize: '16px' }}>{stats.learnedCount}개</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: 'bold' }}>❌ 오답</span>
                        <div style={{ color: '#E74C3C', fontWeight: 'bold', fontSize: '16px' }}>{stats.wrongCount}개</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 탭 2: 📚 500 영단어 DB 관리 */}
        {adminTab === 'words' && (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 영단어 또는 한글 뜻 검색..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: '12px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '14px', border: '1px solid #E9ECEF', maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #DEE2E6', color: '#2C3E50', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>ID</th>
                    <th style={{ padding: '8px' }}>영단어</th>
                    <th style={{ padding: '8px' }}>발음기호</th>
                    <th style={{ padding: '8px' }}>한글 뜻</th>
                    <th style={{ padding: '8px' }}>카테고리</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #F1F3F5' }}>
                      <td style={{ padding: '8px', color: '#7F8C8D' }}>{w.id}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold', color: '#2C3E50' }}>{w.word}</td>
                      <td style={{ padding: '8px', color: '#3498DB' }}>{w.phonics}</td>
                      <td style={{ padding: '8px', color: '#27AE60', fontWeight: 'bold' }}>{w.meaning}</td>
                      <td style={{ padding: '8px', color: '#8E44AD' }}>{w.category}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => openWordEditModal(w)} style={{ background: '#EBF5FB', color: '#2980B9', border: '1px solid #AED6F1', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginRight: '4px' }}>
                          ✏️ 수정
                        </button>
                        <button onClick={() => handleDeleteWord(w.id, w.word)} style={{ background: '#FDEDEC', color: '#E74C3C', border: '1px solid #FADBD8', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 1. 학생 등록 모달 */}
        {showAddModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '90%', maxWidth: '360px' }}>
              <h3 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>🎒 신규 학생 등록</h3>
              <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="학생 이름" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7' }}>취소</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#2ECC71', color: 'white', fontWeight: 'bold' }}>등록</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. 학부모 정보 등록/수정 모달 */}
        {editingUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '90%', maxWidth: '380px' }}>
              <h3 style={{ margin: '0 0 14px 0', color: '#8E44AD', textAlign: 'center' }}>👨‍👩‍👧‍👦 [ {editingUser.name} ] 학부모 정보</h3>
              <form onSubmit={handleSaveParentInfo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" value={editParentName} onChange={(e) => setEditParentName(e.target.value)} placeholder="학부모 성함" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7' }} />
                <input type="text" value={editParentPhone} onChange={(e) => setEditParentPhone(e.target.value)} placeholder="연락처" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7' }} />
                <input type="password" maxLength={4} value={editParentPin} onChange={(e) => setEditParentPin(e.target.value)} placeholder="PIN 4자리" style={{ padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7', textAlign: 'center' }} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7' }}>취소</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#8E44AD', color: 'white', fontWeight: 'bold' }}>저장</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. 영단어 정보 수정 모달 */}
        {editingWord && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '90%', maxWidth: '400px' }}>
              <h3 style={{ margin: '0 0 14px 0', color: '#9B59B6', textAlign: 'center' }}>✏️ [ {wordForm.word} ] 영단어 정보 수정</h3>
              <form onSubmit={handleSaveWord} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#7F8C8D' }}>영단어 *</label>
                  <input type="text" required value={wordForm.word} onChange={(e) => setWordForm({ ...wordForm, word: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#7F8C8D' }}>발음기호</label>
                    <input type="text" value={wordForm.phonics} onChange={(e) => setWordForm({ ...wordForm, phonics: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#7F8C8D' }}>한글 뜻 *</label>
                    <input type="text" required value={wordForm.meaning} onChange={(e) => setWordForm({ ...wordForm, meaning: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#7F8C8D' }}>영어 예문</label>
                  <input type="text" value={wordForm.exampleEn} onChange={(e) => setWordForm({ ...wordForm, exampleEn: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#7F8C8D' }}>예문 한글 뜻</label>
                  <input type="text" value={wordForm.exampleKo} onChange={(e) => setWordForm({ ...wordForm, exampleKo: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setEditingWord(null)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #BDC3C7' }}>취소</button>
                  <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#9B59B6', color: 'white', fontWeight: 'bold' }}>단어 정보 저장</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
