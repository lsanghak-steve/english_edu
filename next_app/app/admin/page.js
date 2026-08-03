'use client';

import { useState } from 'react';
import AdminWordManager from '../components/AdminWordManager.js';
import AdminStudentManager from '../components/AdminStudentManager.js';

export default function AdminPage() {
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminTab, setAdminTab] = useState('words'); // 'words', 'students'

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === '0000' || pinInput === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('비밀번호(PIN)가 올바르지 않습니다. (기본 비밀번호: 0000)');
    }
  };

  if (!isAuthenticated) {
    return (
      <main style={{ maxWidth: '400px', margin: '80px auto', padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        <h2 style={{ color: '#2C3E50', marginBottom: '10px' }}>🔒 관리자 비밀번호 인증</h2>
        <p style={{ color: '#7F8C8D', fontSize: '14px', marginBottom: '20px' }}>
          단어 DB 관리 및 학생 계정 관리를 위해 4자리 관리자 비밀번호를 입력하세요.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            maxLength={4}
            placeholder="관리자 PIN (기본: 0000)"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            style={{ padding: '12px', borderRadius: '12px', border: '2px solid #3498DB', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
            autoFocus
          />
          <button
            type="submit"
            style={{ background: '#3498DB', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
          >
            로그인 ➔
          </button>
        </form>

        <a href="/" style={{ display: 'inline-block', marginTop: '16px', color: '#95A5A6', fontSize: '13px', textDecoration: 'none' }}>
          ← 학생 학습 메인 화면으로 돌아가기
        </a>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'white', padding: '16px 24px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#2C3E50' }}>🏫 센터 관리자 페이지</h1>
          <span style={{ fontSize: '13px', color: '#27AE60', fontWeight: 'bold' }}>● 관리자 로그인 중</span>
        </div>
        <a href="/" style={{ background: '#34495E', color: 'white', padding: '10px 18px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          🏠 메인 화면으로 이동
        </a>
      </header>

      {/* 관리자 서브 탭 (단어 DB 관리 vs 학생/학부모 종합 관리) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={() => setAdminTab('words')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '16px',
            border: adminTab === 'words' ? '2px solid #3498DB' : '1px solid #BDC3C7',
            background: adminTab === 'words' ? '#EBF5FB' : '#FFFFFF',
            color: adminTab === 'words' ? '#2980B9' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          📖 534개 영단어 DB 관리자
        </button>

        <button
          onClick={() => setAdminTab('students')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '16px',
            border: adminTab === 'students' ? '2px solid #9B59B6' : '1px solid #BDC3C7',
            background: adminTab === 'students' ? '#F5EEF8' : '#FFFFFF',
            color: adminTab === 'students' ? '#8E44AD' : '#7F8C8D',
            fontWeight: 'bold',
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          👥 학생 및 학부모 종합 관리자
        </button>
      </div>

      {adminTab === 'words' && <AdminWordManager />}
      {adminTab === 'students' && <AdminStudentManager />}
    </main>
  );
}
