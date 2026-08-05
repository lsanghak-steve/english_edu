'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

export default function StudentLoginPage({ onLoginSuccess }) {
  const [users, setUsers] = useState([]);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 수파베이스 클라우드 DB에서 학생 전체 목록 로드
  useEffect(() => {
    async function loadCloudUsers() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('student_profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          const formatted = data.map(item => ({
            id: item.id,
            name: item.name,
            grade: item.grade || '초등 3학년',
            dailyWordCount: item.daily_word_count || '10',
            studentPin: item.student_pin || '1234',
            parentName: item.parent_name || '',
            parentPhone: item.parent_phone || '',
            parentPin: item.parent_pin || '5678'
          }));
          setUsers(formatted);
          localStorage.setItem('english_edu_users', JSON.stringify(formatted));
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.log('Cloud user fetch error', e);
      }

      // 수파베이스 데이터가 없을 때 localStorage 백업
      try {
        const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
        if (savedUsers.length > 0) {
          setUsers(savedUsers);
        } else {
          const defaultUsers = [
            { id: '1', name: '김민수', grade: '초등 3학년', dailyWordCount: '10', studentPin: '1234' },
            { id: '2', name: '이영희', grade: '초등 4학년', dailyWordCount: '15', studentPin: '1234' }
          ];
          setUsers(defaultUsers);
        }
      } catch (e) {
        console.log('Local fallback error', e);
      }
      setIsLoading(false);
    }

    loadCloudUsers();
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedName = studentNameInput.trim();
    if (!trimmedName) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    // 이름으로 학생 검색
    const student = users.find(u => (u.name || '').trim() === trimmedName);
    if (!student) {
      alert(`'${trimmedName}' 이름으로 등록된 학생을 찾을 수 없습니다.\n이름을 다시 확인하거나 센터 관리자에게 등록을 요청해 주세요.`);
      return;
    }

    const correctPin = student.studentPin || '1234';
    if (pinInput.trim() === correctPin) {
      alert(`🎉 환영합니다! ${student.name} 학생으로 성공적으로 로그인되었습니다. ☁️`);
      onLoginSuccess(student);
    } else {
      alert('🔒 비밀번호(PIN)가 올바르지 않습니다. 다시 확인해 주세요. (기본 PIN: 1234)');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #EBF5FB 0%, #E8F8F5 100%)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '36px 28px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.08)',
        textAlign: 'center',
        border: '2px solid #E9ECEF'
      }}>
        {/* 상단 로고 아이콘 & 타이틀 */}
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎓</div>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', color: '#2C3E50', fontWeight: '900' }}>
          초등 필수 영단어 500
        </h1>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#7F8C8D', fontWeight: 'bold' }}>
          🔒 이름과 4자리 비밀번호를 입력해 주세요
        </p>

        {isLoading ? (
          <div style={{ padding: '30px', color: '#3498DB', fontWeight: 'bold', fontSize: '15px' }}>
            ☁️ 클라우드 DB 연동 중...
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* 학생 이름 직접 입력 상자 */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                👤 학생 이름 입력
              </label>
              <input
                type="text"
                placeholder="예: 김민수"
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '2px solid #3498DB',
                  background: '#F4F6F7',
                  color: '#2C3E50',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            {/* 4자리 PIN 비밀번호 입력 상자 */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                🔒 학생 비밀번호 (4자리 PIN)
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder="비밀번호 4자리 (기본: 1234)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '2px solid #9B59B6',
                  fontSize: '20px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  outline: 'none',
                  letterSpacing: '6px'
                }}
              />
            </div>

            {/* 학습 시작하기 버튼 */}
            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '17px',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(52,152,219,0.3)',
                marginTop: '10px'
              }}
            >
              🔓 내 계정으로 학습 시작하기 ➔
            </button>
          </form>
        )}

        {/* 하단 서브 메뉴 링크 (관리자 로그인 이동) */}
        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px dashed #BDC3C7', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <a
            href="/admin"
            style={{ fontSize: '13px', color: '#8E44AD', fontWeight: 'bold', textDecoration: 'none' }}
          >
            🏫 Center Admin 관리자 페이지 ➔
          </a>
        </div>
      </div>
    </div>
  );
}
