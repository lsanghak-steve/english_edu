'use client';

import { useState, useEffect } from 'react';

export default function UserManager({ currentUser, setCurrentUser }) {
  const [users, setUsers] = useState([]);

  // 로컬 저장소에서 학생 목록 로드
  useEffect(() => {
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      if (savedUsers.length === 0) {
        const defaultUser = {
          id: 'user_default',
          name: '김철수',
          grade: '초등3학년',
          dailyWordCount: 10,
          parentName: '김철수 학부모님',
          parentPhone: '010-1234-5678',
          parentPin: '1234',
          code: 'KID-7788'
        };
        setUsers([defaultUser]);
        setCurrentUser(defaultUser);
        localStorage.setItem('english_edu_users', JSON.stringify([defaultUser]));
      } else {
        setUsers(savedUsers);
        const lastSelectedId = localStorage.getItem('english_edu_current_user_id');
        const found = savedUsers.find(u => u.id === lastSelectedId);
        setCurrentUser(found || savedUsers[0]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [setCurrentUser]);

  const handleSelectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('english_edu_current_user_id', user.id);
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#FFFFFF', padding: '10px 16px', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #E9ECEF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}>
        <span style={{ fontSize: '18px' }}>👤</span>
        <select
          value={currentUser?.id || ''}
          onChange={(e) => {
            const found = users.find(u => u.id === e.target.value);
            if (found) handleSelectUser(found);
          }}
          style={{ width: '100%', maxWidth: '340px', padding: '8px 12px', borderRadius: '12px', border: '1px solid #BDC3C7', fontWeight: 'bold', fontSize: '14px', color: '#2C3E50', textAlign: 'center' }}
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.grade} / 하루 {u.dailyWordCount}개)
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
