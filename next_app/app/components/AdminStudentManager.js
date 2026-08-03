'use client';

import { useState, useEffect } from 'react';

export default function AdminStudentManager() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // 폼 입력 상태
  const [nameInput, setNameInput] = useState('');
  const [gradeInput, setGradeInput] = useState('초등 3학년');
  const [dailyCountInput, setDailyCountInput] = useState('10');
  const [studentPinInput, setStudentPinInput] = useState('1234');
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('5678');

  // 로컬스토리지에서 사용자 목록 로드
  const loadUsers = () => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      setUsers(savedUsers);
    } catch (e) {
      console.log('Error loading users in Admin', e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 신규 등록 모달 열기
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setNameInput('');
    setGradeInput('초등 3학년');
    setDailyCountInput('10');
    setStudentPinInput('1234');
    setParentNameInput('');
    setParentPhoneInput('');
    setParentPinInput('5678');
    setShowModal(true);
  };

  // 기존 학생 정보 수정 모달 열기
  const handleOpenEditModal = (user) => {
    setIsEditMode(true);
    setEditingUserId(user.id);
    setNameInput(user.name || '');
    setGradeInput(user.grade || '초등 3학년');
    setDailyCountInput(user.dailyWordCount || '10');
    setStudentPinInput(user.studentPin || '1234');
    setParentNameInput(user.parentName || '');
    setParentPhoneInput(user.parentPhone || '');
    setParentPinInput(user.parentPin || '5678');
    setShowModal(true);
  };

  // 학생 삭제
  const handleDeleteUser = (userId, userName) => {
    if (confirm(`정말로 ${userName} 학생 계정을 삭제하시겠습니까?`)) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('english_edu_users', JSON.stringify(updatedUsers));
      alert(`${userName} 학생이 삭제되었습니다.`);
    }
  };

  // 폼 제출 저장
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    if (isEditMode) {
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
      alert('학생 정보가 성공적으로 수정 저장되었습니다!');
    } else {
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
      alert(`${newUser.name} 학생이 성공적으로 신규 등록되었습니다!`);
    }

    setShowModal(false);
  };

  return (
    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', marginTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '20px' }}>👥 관리자 전용 - 학생 및 학부모 종합 관리</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
            등록된 모든 학생 계정 정보(비밀번호, 학학년, 목표 수량, 학부모 PIN)를 관리합니다.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          style={{ background: '#3498DB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
        >
          ➕ 신규 학생 등록
        </button>
      </div>

      {/* 학생 목록 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E9ECEF', color: '#34495E' }}>
              <th style={{ padding: '12px 10px' }}>학생 이름</th>
              <th style={{ padding: '12px 10px' }}>학년</th>
              <th style={{ padding: '12px 10px' }}>목표 학습량</th>
              <th style={{ padding: '12px 10px' }}>학생 PIN</th>
              <th style={{ padding: '12px 10px' }}>학부모 이름</th>
              <th style={{ padding: '12px 10px' }}>학부모 연락처</th>
              <th style={{ padding: '12px 10px' }}>학부모 PIN</th>
              <th style={{ padding: '12px 10px', textAlign: 'center' }}>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #F1F1F1' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#2C3E50' }}>{u.name}</td>
                  <td style={{ padding: '12px 10px', color: '#7F8C8D' }}>{u.grade || '초등 3학년'}</td>
                  <td style={{ padding: '12px 10px', color: '#2980B9', fontWeight: 'bold' }}>하루 {u.dailyWordCount || 10}단어</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{u.studentPin || '1234'}</td>
                  <td style={{ padding: '12px 10px', color: '#8E44AD', fontWeight: 'bold' }}>{u.parentName || '-'}</td>
                  <td style={{ padding: '12px 10px', color: '#7F8C8D' }}>{u.parentPhone || '-'}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{u.parentPin || '5678'}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenEditModal(u)}
                      style={{ background: '#E8F8F5', border: '1px solid #2ECC71', color: '#27AE60', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', marginRight: '6px' }}
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      style={{ background: '#FADBD8', border: '1px solid #E74C3C', color: '#C0392B', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                    >
                      🗑️ 삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#7F8C8D' }}>
                  등록된 학생이 없습니다. [➕ 신규 학생 등록] 버튼을 눌러 등록하세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 등록 및 수정 팝업 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                {isEditMode ? '✏️ 관리자 - 학생 정보 수정' : '➕ 관리자 - 신규 학생 등록'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

              <div style={{ borderTop: '1px dashed #BDC3C7', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#8E44AD', fontWeight: 'bold' }}>👨‍👩‍👧‍👦 학부모 정보 설정</span>
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
