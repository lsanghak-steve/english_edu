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
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'parent'
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [activeBottomNav, setActiveBottomNav] = useState('Home');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccessToast, setLoginSuccessToast] = useState('');

  // 🎯 기본 학생 목록 (폴백용)
  const defaultStudents = [
    { id: 'lsh_20260807_000001', student_id: 'lsh_20260807_000001', name: '이상학', grade: '대학생 및 성인', avatar: '대학생 및 성인', studyGradeLevel: '중등단어', dailyWordCount: '20', studentPin: '0815', parentName: '이상학학부모', parentPin: '0815' },
    { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 5학년', avatar: '초등 5학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0418', parentName: '이승현학부모', parentPin: '0815' },
    { id: 'lsm_20260807_000003', student_id: 'lsm_20260807_000003', name: '이수민', grade: '초등 3학년', avatar: '초등 3학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0809', parentName: '이수민학부모', parentPin: '0815' },
    { id: 'pjh_20260807_000004', student_id: 'pjh_20260807_000004', name: '박재현', grade: '초등 4학년', avatar: '초등 4학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '1234', parentName: '이상학', parentPin: '0815' },
    { id: 'kmc_20260807_000005', student_id: 'kmc_20260807_000005', name: '김민채', grade: '초등 2학년', avatar: '초등 2학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '1234', parentName: '이상학', parentPin: '0815' }
  ];

  // 저장된 아이디 불러오기
  useEffect(() => {
    try {
      const savedId = localStorage.getItem('flipvoca_saved_login_id');
      if (savedId) {
        setUserIdInput(savedId);
      }
    } catch (e) {}
  }, []);

  // 🚀 학생 ID / 비밀번호(PIN) 로그인 처리
  const handleStudentSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanInputId = userIdInput.trim();
    const cleanPin = passwordInput.trim();

    if (!cleanInputId) {
      setErrorMessage('아이디(또는 이름)를 입력해주세요.');
      return;
    }
    if (!cleanPin) {
      setErrorMessage('비밀번호(또는 4자리 PIN)를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase DB에서 사용자 조회
      const { data: dbUsers, error } = await supabase
        .from('users')
        .select('*');

      let targetUser = null;

      if (dbUsers && dbUsers.length > 0) {
        // 이름 또는 student_id 일치 사용자 검색
        targetUser = dbUsers.find(u => {
          const uName = removeEmoji(u.name || '').toLowerCase();
          const uStudentId = String(u.student_id || u.id || '').toLowerCase();
          const query = cleanInputId.toLowerCase();
          return uName === query || uStudentId === query;
        });
      }

      // DB 검색 실패 시 폴백 기본 학생 목록 검색
      if (!targetUser) {
        targetUser = defaultStudents.find(u => {
          return u.name.toLowerCase() === cleanInputId.toLowerCase() ||
                 u.student_id.toLowerCase() === cleanInputId.toLowerCase() ||
                 u.id.toLowerCase() === cleanInputId.toLowerCase();
        });
      }

      if (!targetUser) {
        setIsLoading(false);
        setErrorMessage('등록되지 않은 학생 아이디/이름입니다. 다시 확인해주세요.');
        return;
      }

      // 비밀번호(PIN) 검증
      const expectedPin = String(targetUser.pin || targetUser.studentPin || '1234').trim();
      const isPinMatch = (cleanPin === expectedPin) || (cleanPin === '1234') || (cleanPin === '0815');

      if (!isPinMatch) {
        setIsLoading(false);
        setErrorMessage(`비밀번호가 올바르지 않습니다. (기본 PIN: ${expectedPin || '1234'})`);
        return;
      }

      // 아이디 저장 옵션
      if (rememberMe) {
        localStorage.setItem('flipvoca_saved_login_id', cleanInputId);
      } else {
        localStorage.removeItem('flipvoca_saved_login_id');
      }

      // 로그인 성공 정보 생성 및 세션 저장
      const rawGrade = String(targetUser.grade || targetUser.avatar || '초등단어').replace('[PENDING]', '').replace('[APPROVED]', '').trim();
      const userData = {
        id: targetUser.student_id || targetUser.id,
        student_id: targetUser.student_id || targetUser.id,
        name: removeEmoji(targetUser.name),
        grade: rawGrade || '초등단어',
        avatar: targetUser.avatar || targetUser.grade || '초등단어',
        studyGradeLevel: targetUser.study_grade_level || targetUser.studyGradeLevel || '초등단어',
        study_grade_level: targetUser.study_grade_level || targetUser.studyGradeLevel || '초등단어',
        dailyWordCount: String(targetUser.daily_word_count || targetUser.dailyWordCount || 10),
        daily_word_count: parseInt(targetUser.daily_word_count || targetUser.dailyWordCount || 10, 10)
      };

      localStorage.setItem('english_edu_current_user', JSON.stringify(userData));

      setLoginSuccessToast(`🎉 ${userData.name} 학생 로그인 성공!`);
      setTimeout(() => {
        router.push('/');
      }, 700);

    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMessage('로그인 중 네트워크 오류가 발생했습니다.');
    }
  };

  // 👨‍👩‍👧 학부모 ID / 비밀번호 로그인 처리
  const handleParentSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanParentName = parentNameInput.trim();
    const cleanParentPin = parentPinInput.trim();

    if (!cleanParentName) {
      setErrorMessage('학부모 성함을 입력해주세요.');
      return;
    }

    if (cleanParentPin && cleanParentPin !== '0815' && cleanParentPin !== '1234') {
      setErrorMessage('학부모 비밀번호가 올바르지 않습니다. (기본: 0815)');
      return;
    }

    setIsLoading(true);
    localStorage.setItem('flipvoca_parent_logged_in', 'true');
    localStorage.setItem('flipvoca_parent_name', cleanParentName);

    setLoginSuccessToast(`👨‍👩‍👧 ${cleanParentName} 학부모님 환영합니다!`);
    setTimeout(() => {
      router.push('/?tab=parent');
    }, 700);
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
      {/* 📱 모바일 스마트폰 컨테이너 */}
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

        {/* 🔘 역할 전환 세그먼트 (학생 로그인 / 학부모 로그인) */}
        <div style={{ padding: '0 20px', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            background: '#F8FAFC',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveRole('student'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '900',
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
              type="button"
              onClick={() => { setActiveRole('parent'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '900',
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

        {/* 📜 메인 카드 및 로그인 입력창 영역 */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 220px)',
          paddingBottom: '20px'
        }}>

          {/* 🌸 상단 비주얼 그라디언트 배너 카드 (flipvoca_dashboard_ui.jpg) */}
          <div style={{
            background: activeRole === 'student'
              ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
              : 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
            borderRadius: '26px',
            padding: '22px 20px',
            color: '#FFFFFF',
            position: 'relative',
            boxShadow: activeRole === 'student'
              ? '0 14px 28px rgba(255, 107, 107, 0.28)'
              : '0 14px 28px rgba(96, 165, 250, 0.28)',
            transition: 'all 0.3s ease'
          }}>
            {/* 우상단 플로팅 아이콘 */}
            <div style={{
              position: 'absolute',
              top: '18px',
              right: '20px',
              fontSize: '26px',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))'
            }}>
              {activeRole === 'student' ? '🌸' : '📅'}
            </div>

            <div style={{ fontSize: '19px', fontWeight: '900', lineHeight: 1.25, marginBottom: '4px' }}>
              {activeRole === 'student' ? 'Day 1 Vocabulary' : 'Attendance Calendar'}
            </div>
            <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
              {activeRole === 'student' ? '10 Words Complete • 플립보카 맞춤 학습관' : '5 Days Streak • 자녀 진도 & 출석 리포트'}
            </div>
          </div>

          {/* 🔑 1. 학생 로그인 폼 (ID & 비밀번호) */}
          {activeRole === 'student' && (
            <form
              onSubmit={handleStudentSubmit}
              style={{
                background: '#F8FAFC',
                borderRadius: '26px',
                padding: '22px 20px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.03)'
              }}
            >
              {/* 오류 메시지 */}
              {errorMessage && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #F87171',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 1. 아이디 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  👤 학생 아이디 / 이름
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="아이디 또는 이름 입력 (예: 이상학)"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#FF6B6B'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    👤
                  </span>
                </div>
              </div>

              {/* 2. 비밀번호(PIN) 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  🔒 비밀번호 (4자리 PIN)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호 입력 (기본: 1234 또는 0815)"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#FF6B6B'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* 아이디 저장 체크박스 & 힌트 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#64748B', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#FF6B6B' }}
                  />
                  아이디 저장
                </label>
                <span style={{ color: '#94A3B8', fontSize: '11px' }}>
                  초기 비밀번호: 1234
                </span>
              </div>

              {/* 🚀 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(255, 107, 107, 0.35)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                {isLoading ? '⏳ 확인 중...' : '🚀 로그인 & 오늘의 단어 학습 시작'}
              </button>
            </form>
          )}

          {/* 👨‍👩‍👧 2. 학부모 로그인 폼 (성함 & 비밀번호) */}
          {activeRole === 'parent' && (
            <form
              onSubmit={handleParentSubmit}
              style={{
                background: '#F8FAFC',
                borderRadius: '26px',
                padding: '22px 20px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.03)'
              }}
            >
              {/* 오류 메시지 */}
              {errorMessage && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #F87171',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 1. 학부모 성함 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  👨‍👩‍👧 학부모 성함 / 아이디
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="예: 이상학 (또는 이상학학부모)"
                    value={parentNameInput}
                    onChange={(e) => setParentNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#60A5FA'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    👨‍👩‍👧
                  </span>
                </div>
              </div>

              {/* 2. 학부모 비밀번호 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  🔒 학부모 비밀번호
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showParentPassword ? 'text' : 'password'}
                    placeholder="비밀번호 입력 (기본: 0815)"
                    value={parentPinInput}
                    onChange={(e) => setParentPinInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#60A5FA'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0
                    }}
                  >
                    {showParentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* 📊 학부모 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(96, 165, 250, 0.35)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                {isLoading ? '⏳ 로그인 중...' : '📊 학부모 대시보드 입장'}
              </button>
            </form>
          )}

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
