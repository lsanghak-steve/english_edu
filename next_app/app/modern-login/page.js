'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient.js';
import { t } from '../../lib/i18n.js';

// 학생/학부모 이름 이모지 제거 헬퍼
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function ModernLoginPage() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('ko');
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'parent' | 'signup'
  const [users, setUsers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('');
  const [activeBottomNav, setActiveBottomNav] = useState('Home');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccessToast, setLoginSuccessToast] = useState('');

  // 🎯 기본 학생 목록 (폴백)
  const defaultStudents = [
    { id: 'lsh_20260807_000001', student_id: 'lsh_20260807_000001', name: '이상학', grade: '대학생 및 성인', avatar: '대학생 및 성인', studyGradeLevel: '중등단어', dailyWordCount: '20', studentPin: '0815', parentName: '이상학학부모', parentPin: '0815' },
    { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 5학년', avatar: '초등 5학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0418', parentName: '이승현학부모', parentPin: '0815' },
    { id: 'lsm_20260807_000003', student_id: 'lsm_20260807_000003', name: '이수민', grade: '초등 3학년', avatar: '초등 3학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0809', parentName: '이수민학부모', parentPin: '0815' },
    { id: 'pjh_20260807_000004', student_id: 'pjh_20260807_000004', name: '박재현', grade: '초등 4학년', avatar: '초등 4학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '1234', parentName: '이상학', parentPin: '0815' },
    { id: 'kmc_20260807_000005', student_id: 'kmc_20260807_000005', name: '김민채', grade: '초등 2학년', avatar: '초등 2학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '1234', parentName: '이상학', parentPin: '0815' }
  ];

  // ☁️ Supabase 클라우드 DB 학생 로드
  useEffect(() => {
    async function loadStudents() {
      try {
        const { data: dbData } = await supabase.from('users').select('*').order('created_at', { ascending: true });
        if (dbData && dbData.length > 0) {
          const list = dbData.map(item => ({
            id: item.student_id || item.id,
            db_id: item.id,
            student_id: item.student_id || item.id,
            name: removeEmoji(item.name),
            grade: String(item.avatar || item.grade || '초등단어').replace('[PENDING]', '').replace('[APPROVED]', '').trim(),
            avatar: item.avatar || item.grade || '초등단어',
            studyGradeLevel: item.study_grade_level || '초등단어',
            dailyWordCount: String(item.daily_word_count || 10),
            studentPin: item.pin || '1234',
            parentName: item.parent_name || (item.name + '학부모'),
            parentPin: item.parent_pin || '0815'
          }));
          setUsers(list);
          setSelectedStudent(list[0]);
        } else {
          setUsers(defaultStudents);
          setSelectedStudent(defaultStudents[0]);
        }
      } catch (e) {
        setUsers(defaultStudents);
        setSelectedStudent(defaultStudents[0]);
      }
    }
    loadStudents();
  }, []);

  // 🚀 학생 로그인 처리
  const handleStudentLogin = (studentToLogin = selectedStudent) => {
    if (!studentToLogin) return;
    setIsLoading(true);
    
    // 로컬 스토리지에 로그인 정보 저장
    localStorage.setItem('english_edu_current_user', JSON.stringify({
      id: studentToLogin.id,
      student_id: studentToLogin.student_id,
      name: studentToLogin.name,
      grade: studentToLogin.grade,
      avatar: studentToLogin.avatar,
      studyGradeLevel: studentToLogin.studyGradeLevel,
      study_grade_level: studentToLogin.studyGradeLevel,
      dailyWordCount: studentToLogin.dailyWordCount,
      daily_word_count: parseInt(studentToLogin.dailyWordCount, 10) || 10
    }));

    setLoginSuccessToast(`🎉 ${studentToLogin.name} 학생으로 로그인 성공!`);
    setTimeout(() => {
      router.push('/');
    }, 800);
  };

  // 👨‍👩‍👧 학부모 로그인 처리
  const handleParentLogin = () => {
    if (!parentNameInput.trim()) {
      alert('학부모 성함을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    localStorage.setItem('flipvoca_parent_logged_in', 'true');
    localStorage.setItem('flipvoca_parent_name', parentNameInput.trim());

    setLoginSuccessToast(`👨‍👩‍👧 ${parentNameInput.trim()} 학부모님 환영합니다!`);
    setTimeout(() => {
      router.push('/?tab=parent');
    }, 800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #E0EBFF 0%, #EDE9FE 45%, #FDE2E4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* 📱 모바일 프레임 컨테이너 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        background: '#FFFFFF',
        borderRadius: '38px',
        boxShadow: '0 25px 60px -15px rgba(99, 102, 241, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* 🌟 상단 앱 헤더 */}
        <div style={{
          padding: '24px 24px 16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6EE7B7 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)'
            }}>
              🧑‍🎓
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1E293B', letterSpacing: '-0.3px' }}>
                Daily Study & Progress
              </h2>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#94A3B8' }}>
                FlipVoca 3.0 Smart Learning
              </span>
            </div>
          </div>

          <Link
            href="/"
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#F1F5F9',
              color: '#64748B',
              fontSize: '11px',
              fontWeight: '800',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            기존 화면 ➔
          </Link>
        </div>

        {/* 🔘 역할 전환 세그먼트 (학생 / 학부모 / 신규등록) */}
        <div style={{
          padding: '0 20px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            background: '#F8FAFC',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            gap: '4px'
          }}>
            <button
              onClick={() => setActiveRole('student')}
              style={{
                flex: 1,
                padding: '9px 0',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: activeRole === 'student' ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' : 'transparent',
                color: activeRole === 'student' ? '#FFFFFF' : '#64748B',
                boxShadow: activeRole === 'student' ? '0 4px 12px rgba(255, 107, 107, 0.3)' : 'none'
              }}
            >
              👦 학생 로그인
            </button>
            <button
              onClick={() => setActiveRole('parent')}
              style={{
                flex: 1,
                padding: '9px 0',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: activeRole === 'parent' ? 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)' : 'transparent',
                color: activeRole === 'parent' ? '#FFFFFF' : '#64748B',
                boxShadow: activeRole === 'parent' ? '0 4px 12px rgba(96, 165, 250, 0.3)' : 'none'
              }}
            >
              👨‍👩‍👧 학부모 모드
            </button>
          </div>
        </div>

        {/* 📜 메인 비주얼 카드 영역 (flipvoca_dashboard_ui.jpg 디자인 완벽 재현) */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 220px)',
          paddingBottom: '20px'
        }}>

          {/* 🌸 카드 1: 코랄/피치 그라디언트 카드 (Day 1 Vocabulary) */}
          <div
            onClick={() => {
              if (selectedStudent) handleStudentLogin(selectedStudent);
            }}
            style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              borderRadius: '26px',
              padding: '24px 22px',
              color: '#FFFFFF',
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(255, 107, 107, 0.28)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* 우상단 🌸 플로팅 아이콘 */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '22px',
              fontSize: '26px',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))'
            }}>
              🌸
            </div>

            <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1.25, marginBottom: '6px' }}>
              Day 1<br />
              Vocabulary – {selectedStudent?.dailyWordCount || 10} Words Complete
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🚀 {selectedStudent ? `${selectedStudent.name} (${selectedStudent.grade})` : '학생 선택 후 시작'}</span>
            </div>
          </div>

          {/* 👦 학생 선택 그리드 (학생 모드 활성화 시) */}
          {activeRole === 'student' && (
            <div style={{
              background: '#F8FAFC',
              borderRadius: '22px',
              padding: '16px',
              border: '1.5px solid #E2E8F0'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎯 로그인할 학생을 선택하세요:</span>
                <span style={{ color: '#FF6B6B' }}>{users.length}명 등록됨</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
              }}>
                {users.map((u) => {
                  const isSelected = selectedStudent?.name === u.name;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedStudent(u)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '16px',
                        border: isSelected ? '2px solid #FF6B6B' : '1px solid #E2E8F0',
                        background: isSelected ? '#FFF1F2' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 4px 10px rgba(255, 107, 107, 0.15)' : 'none'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>
                        {u.name === '이상학' ? '👨‍💼' : (u.name.includes('수민') || u.name.includes('민채') ? '👧' : '👦')}
                      </span>
                      <strong style={{ fontSize: '13px', color: isSelected ? '#E11D48' : '#1E293B' }}>
                        {u.name}
                      </strong>
                      <span style={{ fontSize: '10px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {u.grade}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 빠른 원클릭 로그인 버튼 */}
              <button
                onClick={() => handleStudentLogin(selectedStudent)}
                disabled={isLoading || !selectedStudent}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(255, 107, 107, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoading ? '⏳ 로그인 중...' : `🚀 ${selectedStudent?.name || '학생'}으로 바로 시작하기`}
              </button>
            </div>
          )}

          {/* 📅 카드 2: 스카이블루/퍼플 그라디언트 카드 (Attendance Calendar) */}
          <div
            onClick={() => setActiveRole('parent')}
            style={{
              background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
              borderRadius: '26px',
              padding: '24px 22px',
              color: '#FFFFFF',
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(96, 165, 250, 0.28)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* 우상단 📅 5 달력 배지 */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '22px',
              background: '#FFFFFF',
              color: '#1E293B',
              borderRadius: '12px',
              padding: '4px 8px',
              fontSize: '14px',
              fontWeight: '900',
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1
            }}>
              <span style={{ fontSize: '9px', color: '#EF4444', fontWeight: '800' }}>AUG</span>
              <span style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B', marginTop: '2px' }}>27</span>
            </div>

            <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1.25, marginBottom: '6px' }}>
              Attendance<br />
              Calendar – 5 Days Streak
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
              📊 학부모 자녀 진도 확인 및 출석 통계
            </div>
          </div>

          {/* 👨‍👩‍👧 학부모 로그인 폼 (학부모 모드 활성화 시) */}
          {activeRole === 'parent' && (
            <div style={{
              background: '#F8FAFC',
              borderRadius: '22px',
              padding: '18px',
              border: '1.5px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>
                👨‍👩‍👧 학부모 성함을 입력하세요:
              </div>
              <input
                type="text"
                placeholder="예: 이상학 (또는 이상학학부모)"
                value={parentNameInput}
                onChange={(e) => setParentNameInput(e.target.value)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleParentLogin}
                disabled={isLoading}
                style={{
                  padding: '14px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(96, 165, 250, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isLoading ? '⏳ 로그인 중...' : '📊 학부모 대시보드 입장'}
              </button>
            </div>
          )}

          {/* ⭐ 카드 3: 인디고/바이올렛 그라디언트 카드 (4-Stage Quiz Challenge) */}
          <div
            onClick={() => {
              if (selectedStudent) {
                handleStudentLogin(selectedStudent);
                setTimeout(() => router.push('/?tab=quiz'), 900);
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #3730A3 0%, #1E1B4B 100%)',
              borderRadius: '26px',
              padding: '24px 22px',
              color: '#FFFFFF',
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(55, 48, 163, 0.3)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {/* 우상단 ⭐ 골든스타 아이콘 */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '22px',
              fontSize: '26px',
              filter: 'drop-shadow(0 2px 8px rgba(251, 191, 36, 0.6))'
            }}>
              ⭐
            </div>

            <div style={{ fontSize: '20px', fontWeight: '900', lineHeight: 1.25, marginBottom: '6px' }}>
              4-Stage Quiz<br />
              Challenge
            </div>
            <div style={{ fontSize: '13px', opacity: 0.85, fontWeight: '600' }}>
              🧩 소리 ➔ 스펠링 ➔ 발음 ➔ 쓰기 4단계 마스터
            </div>
          </div>

        </div>

        {/* 📱 하단 플로팅 글래스 내비게이션 바 (Home, Words, Quiz, Profile) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #F1F5F9',
          padding: '12px 24px 18px 24px',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {[
            { id: 'Home', label: 'Home', icon: '🏠', path: '/modern-login' },
            { id: 'Words', label: 'Words', icon: '📖', path: '/' },
            { id: 'Quiz', label: 'Quiz', icon: '☑️', path: '/?tab=quiz' },
            { id: 'Profile', label: 'Profile', icon: '👤', path: '/?tab=parent' },
          ].map((tab) => {
            const isActive = activeBottomNav === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveBottomNav(tab.id);
                  if (tab.id !== 'Home') router.push(tab.path);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  color: isActive ? '#3B82F6' : '#94A3B8',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '20px' }}>{tab.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: isActive ? '900' : '600' }}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 🔔 로그인 성공 토스트 메시지 */}
        {loginSuccessToast && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            left: '20px',
            right: '20px',
            background: '#10B981',
            color: '#FFFFFF',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {loginSuccessToast}
          </div>
        )}

      </div>
    </div>
  );
}
