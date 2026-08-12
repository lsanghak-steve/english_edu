'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

// 학생 이름 이모지 자동 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, '')
    .trim();
};

export default function UserManager({ currentUser, setCurrentUser, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // 등록/수정 폼 입력 상태
  const [nameInput, setNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState('초등 3학년');
  const [studyGradeLevelInput, setStudyGradeLevelInput] = useState('초등단어');
  const [dailyCountInput, setDailyCountInput] = useState('10');
  const [studentPinInput, setStudentPinInput] = useState('1234');
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('5678');

  // Supabase 클라우드 DB에서 학생 목록 로드 (실패 시 localStorage 백업)
  const loadUsersFromCloud = async () => {
    try {
      // 1. users 테이블 로드 (기본 회원 테이블)
      const { data: usersData, error: usersErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (!usersErr && usersData && usersData.length > 0) {
        const formatted = usersData.map(item => ({
          id: item.student_id || item.id,
          name: removeEmoji(item.name),
          grade: item.avatar || item.grade || '초등 3학년',
          studyGradeLevel: item.study_grade_level || (item.avatar && item.avatar.includes('중등') ? '중등단어' : (item.avatar && item.avatar.includes('고등') ? '고등단어' : '초등단어')),
          dailyWordCount: String(item.daily_word_count || '10'),
          studentPin: item.pin || item.student_pin || '1234',
          parentName: removeEmoji(item.parent_name || (item.name + '학부모')),
          parentPhone: item.parent_phone || '',
          parentPin: item.parent_pin || '5678'
        }));
        setUsers(formatted);
        localStorage.setItem('english_edu_users', JSON.stringify(formatted));
        return;
      }
    } catch (e) {
      console.log('Supabase cloud users table fallback');
    }

    // localStorage 백업 로드
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      if (savedUsers.length > 0) {
        const formatted = savedUsers.map(u => ({ ...u, name: removeEmoji(u.name) }));
        setUsers(formatted);
      }
    } catch (e) {
      console.log('Error loading users', e);
    }
  };

  useEffect(() => {
    loadUsersFromCloud();
  }, []);

  // 수정 모달 열기
  const handleOpenEditModal = () => {
    if (!currentUser) return;
    setIsEditMode(true);
    setEditingUserId(currentUser.id);
    setNameInput(removeEmoji(currentUser.name));
    setGradeInput(currentUser.grade || '초등 3학년');
    setStudyGradeLevelInput(currentUser.studyGradeLevel || currentUser.study_grade_level || (currentUser.grade && currentUser.grade.includes('중등') ? '중등단어' : '초등단어'));
    setDailyCountInput(currentUser.dailyWordCount || '10');
    setStudentPinInput(currentUser.studentPin || '1234');
    setParentNameInput(removeEmoji(currentUser.parentName));
    setParentPhoneInput(currentUser.parentPhone || '');
    setParentPinInput(currentUser.parentPin || '5678');
    setShowAddEditModal(true);
  };

  // 폼 제출 (수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanStudentName = removeEmoji(nameInput);
    if (!cleanStudentName) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    const userPayload = {
      id: editingUserId,
      name: cleanStudentName,
      avatar: gradeInput,
      study_grade_level: studyGradeLevelInput,
      daily_word_count: parseInt(dailyCountInput, 10),
      pin: studentPinInput.trim() || '1234'
    };

    try {
      await supabase.from('users').upsert([userPayload]);
      await supabase.from('student_profiles').upsert([{
        id: editingUserId,
        name: cleanStudentName,
        grade: gradeInput,
        study_grade_level: studyGradeLevelInput,
        daily_word_count: dailyCountInput,
        student_pin: studentPinInput.trim() || '1234',
        parent_name: removeEmoji(parentNameInput),
        parent_phone: parentPhoneInput.trim(),
        parent_pin: parentPinInput.trim() || '5678'
      }]);
    } catch (e) {
      console.log('Cloud update fallback to local');
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingUserId) {
        return {
          ...u,
          name: cleanStudentName,
          grade: gradeInput,
          studyGradeLevel: studyGradeLevelInput,
          dailyWordCount: dailyCountInput,
          studentPin: studentPinInput.trim() || '1234',
          parentName: removeEmoji(parentNameInput),
          parentPhone: parentPhoneInput.trim(),
          parentPin: parentPinInput.trim() || '5678'
        };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('english_edu_users', JSON.stringify(updatedUsers));

    const updatedCurrent = updatedUsers.find(u => u.id === editingUserId);
    if (updatedCurrent) {
      setCurrentUser(updatedCurrent);
      localStorage.setItem('english_edu_current_user', JSON.stringify(updatedCurrent));
      window.dispatchEvent(new Event('user_profile_updated'));
    }

    alert(`🎉 학생 정보 및 학습 레벨(${studyGradeLevelInput})이 클라우드 DB에 성공적으로 저장되었습니다!`);
    setShowAddEditModal(false);
  };

  const displayName = currentUser ? removeEmoji(currentUser.name) : '';
  const currentStudyLevel = currentUser ? (currentUser.studyGradeLevel || currentUser.study_grade_level || '초등단어') : '초등단어';
  const currentDailyCount = currentUser ? (currentUser.dailyWordCount || currentUser.daily_word_count || '10') : '10';

  return (
    <div className="user-manager-header-bar">
      {/* 현재 로그인된 학생 정보 */}
      <div className="user-info-group">
        <span className="user-info-label">👤 현재 학습자:</span>
        <span className="user-info-badge">
          {currentUser ? `${displayName} (${currentUser.grade || '초등 3학년'}) • 레벨: ${currentStudyLevel} • 목표 ${currentDailyCount}단어` : '로그인 필요'}
        </span>
      </div>

      {/* 버튼 액션 그룹 (수정 및 로그아웃) */}
      <div className="user-actions-group">
        <button className="btn-user-edit" onClick={handleOpenEditModal}>
          ✏️ 내 정보 수정
        </button>
        <button className="btn-user-logout" onClick={onLogout}>
          🚪 로그아웃 (학생 변경)
        </button>
      </div>

      {/* 수정 팝업 모달 */}
      {showAddEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                ✏️ 학생 정보 수정 (클라우드 DB 동기화)
              </h3>
              <button onClick={() => setShowAddEditModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. 학생 이름 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>👤 학생 이름</label>
                <input
                  type="text"
                  placeholder="예: 김민수"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              {/* 📖 학습할 단어 레벨 선택 (신규) */}
              <div style={{ background: '#F8F9FA', padding: '10px 12px', borderRadius: '12px', border: '1px solid #D4E6F1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2980B9', marginBottom: '4px' }}>
                  📖 학습할 단어 레벨 (난이도 선택)
                </label>
                <select
                  value={studyGradeLevelInput}
                  onChange={(e) => setStudyGradeLevelInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid #3498DB', fontSize: '14px', fontWeight: 'bold', background: '#EBF5FB', color: '#2980B9' }}
                >
                  <option value="초등단어">🎒 초등 영단어 (기초 파닉스 ~ 필수 800단어)</option>
                  <option value="중등단어">🏫 중등 영단어 (중학 내신 ~ 필수 1,200단어)</option>
                  <option value="고등단어">🎓 고등 영단어 (수능/모의고사 대비)</option>
                  <option value="전체">🎒🏫🎓 전체 단어 통합 학습</option>
                </select>
              </div>

              {/* 2. 학년 & 학습 수량 (2열 배치) */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🏫 학년</label>
                  <select
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="초등 1학년">초등 1학년</option>
                    <option value="초등 2학년">초등 2학년</option>
                    <option value="초등 3학년">초등 3학년</option>
                    <option value="초등 4학년">초등 4학년</option>
                    <option value="초등 5학년">초등 5학년</option>
                    <option value="초등 6학년">초등 6학년</option>
                    <option value="중학생 1학년">중학생 1학년</option>
                    <option value="중학생 2학년">중학생 2학년</option>
                    <option value="중학생 3학년">중학생 3학년</option>
                    <option value="고등학생 1학년">고등학생 1학년</option>
                    <option value="고등학생 2학년">고등학생 2학년</option>
                    <option value="고등학생 3학년">고등학생 3학년</option>
                    <option value="대학생 및 성인">대학생 및 성인</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🎯 하루 학습 수량</label>
                  <select
                    value={dailyCountInput}
                    onChange={(e) => setDailyCountInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="5">하루 5단어</option>
                    <option value="10">하루 10단어</option>
                    <option value="15">하루 15단어</option>
                    <option value="20">하루 20단어</option>
                    <option value="30">하루 30단어</option>
                  </select>
                </div>
              </div>

              {/* 3. 학생 비밀번호 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔒 학생 비밀번호 (4자리 PIN)</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="예: 1234"
                  value={studentPinInput}
                  onChange={(e) => setStudentPinInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              {/* 4. 학부모 정보 (구분선) */}
              <div style={{ borderTop: '1px dashed #BDC3C7', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#8E44AD', fontWeight: 'bold' }}>👨‍👩‍👧‍👦 학부모 정보</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>학부모 이름</label>
                <input
                  type="text"
                  placeholder="예: 김철수"
                  value={parentNameInput}
                  onChange={(e) => setParentNameInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>연락처</label>
                  <input
                    type="text"
                    placeholder="010-0000-0000"
                    value={parentPhoneInput}
                    onChange={(e) => setParentPhoneInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔑 학부모 비밀번호(PIN)</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="예: 5678"
                    value={parentPinInput}
                    onChange={(e) => setParentPinInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#2ECC71', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
              >
                ☁️ 클라우드 DB 수정 저장
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
