'use client';

import { useState, useEffect } from 'react';

export default function UserManager({ currentUser, setCurrentUser }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // 폼 입력 상태
  const [nameInput, setNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState('3학년');
  const [dailyCountInput, setDailyCountInput] = useState('10');
  const [studentPinInput, setStudentPinInput] = useState('1234');
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('5678');

  // 사용자 목록 로드
  useEffect(() => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      if (savedUsers.length === 0) {
        const defaultUsers = [
          { id: '1', name: '김민수', grade: '3학년', dailyWordCount: '10', studentPin: '1234', parentName: '김철수', parentPhone: '010-1234-5678', parentPin: '5678' },
          { id: '2', name: '이영희', grade: '4학년', dailyWordCount: '15', studentPin: '1234', parentName: '이영수', parentPhone: '010-9876-5432', parentPin: '5678' }
        ];
        localStorage.setItem('english_edu_users', JSON.stringify(defaultUsers));
        setUsers(defaultUsers);
        if (!currentUser) setCurrentUser(defaultUsers[0]);
      } else {
        setUsers(savedUsers);
        if (!currentUser && savedUsers.length > 0) {
          setCurrentUser(savedUsers[0]);
        }
      }
    } catch (e) {
      console.log('Error loading users', e);
    }
  }, [currentUser, setCurrentUser]);

  // 등록 모달 열기
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setNameInput('');
    setGradeInput('3학년');
    setDailyCountInput('10');
    setStudentPinInput('1234');
    setParentNameInput('');
    setParentPhoneInput('');
    setParentPinInput('5678');
    setShowModal(true);
  };

  // 수정 모달 열기
  const handleOpenEditModal = () => {
    if (!currentUser) return;
    setIsEditMode(true);
    setEditingUserId(currentUser.id);
    setNameInput(currentUser.name || '');
    setGradeInput(currentUser.grade || '3학년');
    setDailyCountInput(currentUser.dailyWordCount || '10');
    setStudentPinInput(currentUser.studentPin || '1234');
    setParentNameInput(currentUser.parentName || '');
    setParentPhoneInput(currentUser.parentPhone || '');
    setParentPinInput(currentUser.parentPin || '5678');
    setShowModal(true);
  };

  // 폼 제출 (등록 및 수정)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    if (isEditMode) {
      // 수정 처리
      const updatedUsers = users.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: nameInput.trim(),
            grade: gradeInput,
            dailyWordCount: dailyCountInput,
            studentPin: studentPinInput.trim() || '1234',
            parentName: parentNameInput.trim(),
            parentPhone: parentPhoneInput.trim(),
            parentPin: parentPinInput.trim() || '5678'
          };
        }
        return u;
      });

      setUsers(updatedUsers);
      localStorage.setItem('english_edu_users', JSON.stringify(updatedUsers));

      const updatedCurrent = updatedUsers.find(u => u.id === editingUserId);
      if (updatedCurrent) setCurrentUser(updatedCurrent);

      alert('학생 정보가 성공적으로 수정되었습니다!');
    } else {
      // 등록 처리
      const newUser = {
        id: String(Date.now()),
        name: nameInput.trim(),
        grade: gradeInput,
        dailyWordCount: dailyCountInput,
        studentPin: studentPinInput.trim() || '1234',
        parentName: parentNameInput.trim(),
        parentPhone: parentPhoneInput.trim(),
        parentPin: parentPinInput.trim() || '5678'
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('english_edu_users', JSON.stringify(updatedUsers));
      setCurrentUser(newUser);

      alert(`${newUser.name} 학생이 성공적으로 등록되었습니다!`);
    }

    setShowModal(false);
  };

  // 학생 선택 변경
  const handleSelectUser = (userId) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '12px 18px', borderRadius: '20px', border: '1px solid #E9ECEF', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '14px' }}>
      {/* 학생 드롭다운 선택 및 정보 표시 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#7F8C8D' }}>👤 학생:</span>
        <select
          value={currentUser ? currentUser.id : ''}
          onChange={(e) => handleSelectUser(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: '12px',
            border: '2px solid #3498DB',
            background: '#F4F6F7',
            color: '#2C3E50',
            fontWeight: 'bold',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.grade || '3학년'}) • 목표 {u.dailyWordCount || 10}단어
            </option>
          ))}
        </select>

        {/* ✏️ 정보 수정 버튼 */}
        <button
          onClick={handleOpenEditModal}
          style={{ background: '#E8F8F5', border: '1px solid #2ECC71', color: '#27AE60', padding: '6px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
        >
          ✏️ 정보 수정
        </button>
      </div>

      {/* ➕ 신규 학생 등록 버튼 */}
      <button
        onClick={handleOpenAddModal}
        style={{ background: '#3498DB', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
      >
        ➕ 학생 등록
      </button>

      {/* 팝업 모달 (등록 & 수정 공용) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                {isEditMode ? '✏️ 학생 정보 수정' : '➕ 신규 학생 등록'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
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

              {/* 2. 학년 & 학습 수량 (2열 배치) */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🏫 학년</label>
                  <select
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="1학년">1학년</option>
                    <option value="2학년">2학년</option>
                    <option value="3학년">3학년</option>
                    <option value="4학년">4학년</option>
                    <option value="5학년">5학년</option>
                    <option value="6학년">6학년</option>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔒 학생 비밀번호 (4자리)</label>
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
                style={{ width: '100%', background: isEditMode ? '#2ECC71' : '#3498DB', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
              >
                {isEditMode ? '💾 수정 사항 저장하기' : '✨ 신규 학생 등록 완료'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
