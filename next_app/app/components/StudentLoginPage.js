'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

// 학생/학부모 이름 이모지 자동 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function StudentLoginPage({ onLoginSuccess, onParentLoginSuccess }) {
  const [users, setUsers] = useState([]);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 학부모 로그인 모달 상태
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('');

  // 기본 학생 세팅 배열 (고유 학생 코드 lsh_20260807_000001 체계 적용)
  const defaultStudents = [
    { id: 'lsh_20260807_000001', student_id: 'lsh_20260807_000001', name: '이상학', grade: '대학생 및 성인', dailyWordCount: '10', studentPin: '0815', parentName: '이상학학부모', parentPhone: '010-0000-0000', parentPin: '5678' },
    { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 3학년', dailyWordCount: '10', studentPin: '0418', parentName: '이승현학부모', parentPhone: '010-1234-5678', parentPin: '5678' },
    { id: 'lsm_20260807_000003', student_id: 'lsm_20260807_000003', name: '이수민', grade: '초등 4학년', dailyWordCount: '15', studentPin: '0809', parentName: '이수민학부모', parentPhone: '010-9876-5432', parentPin: '5678' }
  ];

  // 수파베이스 클라우드 DB에서 학생 전체 목록 로드 (users 및 student_profiles 통합)
  useEffect(() => {
    async function loadCloudUsers() {
      setIsLoading(true);

      try {
        const [res1, res2] = await Promise.allSettled([
          supabase.from('student_profiles').select('*').order('created_at', { ascending: true }),
          supabase.from('users').select('*').order('created_at', { ascending: true })
        ]);

        let dbUsers = [];
        if (res1.status === 'fulfilled' && res1.value.data) {
          dbUsers.push(...res1.value.data.map(item => ({
            id: item.student_id || item.id,
            student_id: item.student_id || item.id,
            name: removeEmoji(item.name),
            grade: item.grade || '초등 3학년',
            dailyWordCount: item.daily_word_count || '10',
            studentPin: item.student_pin || '1111',
            parentName: removeEmoji(item.parent_name),
            parentPhone: item.parent_phone || '',
            parentPin: item.parent_pin || '5678'
          })));
        }
        if (res2.status === 'fulfilled' && res2.value.data) {
          dbUsers.push(...res2.value.data.map(item => ({
            id: item.student_id || item.id,
            student_id: item.student_id || item.id,
            name: removeEmoji(item.name),
            grade: item.avatar || '초등 3학년',
            dailyWordCount: String(item.daily_word_count || 10),
            studentPin: item.pin || '1111',
            parentName: removeEmoji(item.name) + '학부모',
            parentPhone: '',
            parentPin: '5678'
          })));
        }


        if (dbUsers.length > 0) {
          const merged = [...defaultStudents];
          dbUsers.forEach(u => {
            if (!merged.some(m => m.id === u.id || m.name === u.name)) {
              merged.push(u);
            }
          });
          setUsers(merged);
          localStorage.setItem('english_edu_users', JSON.stringify(merged));
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.log('Cloud user fetch fallback', e);
      }


      // 수파베이스 데이터가 없을 때 localStorage/default 백업
      try {
        const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
        if (savedUsers.length > 0) {
          const formatted = savedUsers.map(u => ({ ...u, name: removeEmoji(u.name), parentName: removeEmoji(u.parentName) }));
          setUsers(formatted);
        } else {
          setUsers(defaultStudents);
          localStorage.setItem('english_edu_users', JSON.stringify(defaultStudents));
        }
      } catch (e) {
        setUsers(defaultStudents);
      }
      setIsLoading(false);
    }

    loadCloudUsers();
  }, []);

  // 학생 로그인 제출
  const handleStudentLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedName = removeEmoji(studentNameInput);
    if (!trimmedName) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    const student = users.find(u => removeEmoji(u.name) === trimmedName);
    if (!student) {
      alert(`'${trimmedName}' 이름으로 등록된 학생을 찾을 수 없습니다.\n이름을 다시 확인해 주세요.`);
      return;
    }

    const correctPin = student.studentPin || '1234';
    if (pinInput.trim() === correctPin) {
      alert(`🎉 환영합니다! ${student.name} 학생으로 성공적으로 로그인되었습니다. ☁️`);
      onLoginSuccess(student);
    } else {
      alert('🔒 학생 비밀번호(PIN)가 올바르지 않습니다. 다시 확인해 주세요. (기본 PIN: 1234)');
    }
  };

  // 학부모 이름으로 로그인 제출 (모든 자녀 매칭)
  const handleParentLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedParentName = removeEmoji(parentNameInput);
    if (!trimmedParentName) {
      alert('학부모님 이름을 입력해 주세요.');
      return;
    }

    const matchedChildren = users.filter(u => removeEmoji(u.parentName) === trimmedParentName || removeEmoji(u.name).includes(trimmedParentName));
    if (matchedChildren.length === 0) {
      alert(`'${trimmedParentName}' 학부모님 이름으로 등록된 자녀(학생) 정보를 찾을 수 없습니다.\n성함을 다시 확인해 주세요.`);
      return;
    }

    const correctParentPin = matchedChildren[0].parentPin || '5678';
    if (parentPinInput.trim() === correctParentPin) {
      alert(`👨‍👩‍👧‍👦 ${trimmedParentName} 학부모님, 환영합니다!\n등록된 자녀 학습 성취도 리포트로 이동합니다. 📊`);
      setShowParentModal(false);
      if (onParentLoginSuccess) {
        onParentLoginSuccess(trimmedParentName, matchedChildren);
      }
    } else {
      alert('🔑 학부모 비밀번호(PIN)가 올바르지 않습니다. 다시 확인해 주세요. (기본 PIN: 5678)');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #EBF5FB 0%, #E8F8F5 100%)',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      padding: '20px',
      zIndex: 9999
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '36px 28px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: '2px solid #E9ECEF',
        maxHeight: '92vh',
        overflowY: 'auto',
        margin: 'auto'
      }}>
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
          <form onSubmit={handleStudentLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                👤 학생 이름 입력 (예: 김철수, 이영희)
              </label>
              <input
                type="text"
                placeholder="예: 김철수 또는 이영희"
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

        <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px dashed #BDC3C7', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setShowParentModal(true)}
            style={{ background: '#F5EEF8', border: '1px solid #9B59B6', color: '#8E44AD', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
          >
            👨‍👩‍👧‍👦 학부모 전용 로그인 ➔
          </button>
        </div>
      </div>

      {showParentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '90%', maxWidth: '380px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#8E44AD', fontSize: '18px' }}>
                👨‍👩‍👧‍👦 학부모 전용 안심 로그인
              </h3>
              <button onClick={() => setShowParentModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#7F8C8D', marginBottom: '16px' }}>
              학부모님 성함과 비밀번호를 입력하면 자녀의 학습 상태 리포트로 이동합니다! 📊
            </p>

            <form onSubmit={handleParentLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>👨‍👩‍👧‍👦 학부모 이름 입력 (예: 김철수, 이영희)</label>
                <input
                  type="text"
                  placeholder="예: 김철수 또는 이영희"
                  value={parentNameInput}
                  onChange={(e) => setParentNameInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '15px', fontWeight: 'bold' }}
                  autoFocus
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔑 학부모 비밀번호 (4자리 PIN)</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="비밀번호 4자리 (기본: 5678)"
                  value={parentPinInput}
                  onChange={(e) => setParentPinInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #8E44AD', fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#8E44AD', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '6px' }}
              >
                🔓 자녀 학습 리포트 보기 ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
