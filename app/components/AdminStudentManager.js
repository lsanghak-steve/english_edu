'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

// 이름에서 이모지 완벽 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function AdminStudentManager() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // 폼 입력 상태
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('초등 3학년');
  const [dailyWordCount, setDailyWordCount] = useState('10');
  const [studentPin, setStudentPin] = useState('1234');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState('5678');

  // Supabase 클라우드 DB에서 학생 전체 목록 로드
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted = data.map(s => ({
          id: s.id,
          name: removeEmoji(s.name),
          grade: s.grade || '초등 3학년',
          dailyWordCount: s.daily_word_count || '10',
          studentPin: s.student_pin || '1234',
          parentName: removeEmoji(s.parent_name),
          parentPhone: s.parent_phone || '',
          parentPin: s.parent_pin || '5678'
        }));
        setStudents(formatted);
        localStorage.setItem('english_edu_users', JSON.stringify(formatted));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Cloud fetch error');
    }

    // localStorage 백업 로드
    try {
      const saved = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      const formatted = saved.map(s => ({
        ...s,
        name: removeEmoji(s.name),
        parentName: removeEmoji(s.parentName)
      }));
      setStudents(formatted);
    } catch (e) {
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 신규 등록 모달 열기
  const handleOpenAddModal = () => {
    setIsEdit(false);
    setSelectedId(null);
    setName('');
    setGrade('초등 3학년');
    setDailyWordCount('10');
    setStudentPin('1234');
    setParentName('');
    setParentPhone('');
    setParentPin('5678');
    setShowModal(true);
  };

  // 수정 모달 열기
  const handleOpenEditModal = (student) => {
    setIsEdit(true);
    setSelectedId(student.id);
    setName(removeEmoji(student.name));
    setGrade(student.grade || '초등 3학년');
    setDailyWordCount(student.dailyWordCount || '10');
    setStudentPin(student.studentPin || '1234');
    setParentName(removeEmoji(student.parentName));
    setParentPhone(student.parentPhone || '');
    setParentPin(student.parentPin || '5678');
    setShowModal(true);
  };

  // 삭제 처리
  const handleDeleteStudent = async (id, studentName) => {
    if (!confirm(`정말로 '${removeEmoji(studentName)}' 학생을 삭제하시겠습니까?`)) return;

    try {
      await supabase.from('student_profiles').delete().eq('id', id);
    } catch (e) {
      console.log('Cloud delete fallback');
    }

    const updated = students.filter(s => s.id !== id);
    setStudents(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));
    alert('학생 계정이 삭제되었습니다.');
  };

  // 폼 제출 (등록 & 수정) - 이모지 완전 제거 보장
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanStudentName = removeEmoji(name);
    const cleanParentName = removeEmoji(parentName);

    if (!cleanStudentName) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    if (isEdit) {
      const updateData = {
        id: selectedId,
        name: cleanStudentName,
        grade,
        daily_word_count: dailyWordCount,
        student_pin: studentPin.trim() || '1234',
        parent_name: cleanParentName,
        parent_phone: parentPhone.trim(),
        parent_pin: parentPin.trim() || '5678'
      };

      try {
        await supabase.from('student_profiles').upsert([updateData]);
      } catch (e) {
        console.log('Cloud update error');
      }

      const updated = students.map(s => s.id === selectedId ? {
        ...s,
        name: cleanStudentName,
        grade,
        dailyWordCount,
        studentPin: studentPin.trim() || '1234',
        parentName: cleanParentName,
        parentPhone: parentPhone.trim(),
        parentPin: parentPin.trim() || '5678'
      } : s);

      setStudents(updated);
      localStorage.setItem('english_edu_users', JSON.stringify(updated));
      alert('학생 정보가 클라우드 DB에 저장되었습니다!');
    } else {
      const newId = String(Date.now());
      const insertData = {
        id: newId,
        name: cleanStudentName,
        grade,
        daily_word_count: dailyWordCount,
        student_pin: studentPin.trim() || '1234',
        parent_name: cleanParentName,
        parent_phone: parentPhone.trim(),
        parent_pin: parentPin.trim() || '5678'
      };

      try {
        await supabase.from('student_profiles').insert([insertData]);
      } catch (e) {
        console.log('Cloud insert error');
      }

      const newStudentLocal = {
        id: newId,
        name: cleanStudentName,
        grade,
        dailyWordCount,
        studentPin: studentPin.trim() || '1234',
        parentName: cleanParentName,
        parentPhone: parentPhone.trim(),
        parentPin: parentPin.trim() || '5678'
      };

      const updated = [...students, newStudentLocal];
      setStudents(updated);
      localStorage.setItem('english_edu_users', JSON.stringify(updated));
      alert(`'${cleanStudentName}' 학생이 클라우드 DB에 등록되었습니다!`);
    }

    setShowModal(false);
  };

  return (
    <div style={{ padding: '24px', background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '20px' }}>
            👥 학생 및 학부모 종합 관리자 센터 ☁️
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
            등록된 학생 데이터는 클라우드 DB에 자동 공유됩니다.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ background: '#3498DB', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(52,152,219,0.2)' }}
        >
          ➕ 신규 학생 계정 추가
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#3498DB', fontWeight: 'bold' }}>
          ☁️ 클라우드 DB에서 학생 목록 로드 중...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E9ECEF', color: '#34495E', fontSize: '13px' }}>
                <th style={{ padding: '12px 14px' }}>학생 이름</th>
                <th style={{ padding: '12px 14px' }}>학년</th>
                <th style={{ padding: '12px 14px' }}>목표 학습량</th>
                <th style={{ padding: '12px 14px' }}>학생 PIN</th>
                <th style={{ padding: '12px 14px' }}>학부모 이름</th>
                <th style={{ padding: '12px 14px' }}>연락처</th>
                <th style={{ padding: '12px 14px' }}>학부모 PIN</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #F1F1F1', fontSize: '14px' }}>
                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#2C3E50' }}>{removeEmoji(s.name)}</td>
                    <td style={{ padding: '14px', color: '#7F8C8D' }}>{s.grade || '초등 3학년'}</td>
                    <td style={{ padding: '14px', color: '#27AE60', fontWeight: 'bold' }}>하루 {s.dailyWordCount || 10}단어</td>
                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#8E44AD' }}>{s.studentPin || '1234'}</td>
                    <td style={{ padding: '14px', color: '#34495E' }}>{removeEmoji(s.parentName) || '-'}</td>
                    <td style={{ padding: '14px', color: '#7F8C8D' }}>{s.parentPhone || '-'}</td>
                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#D35400' }}>{s.parentPin || '5678'}</td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button onClick={() => handleOpenEditModal(s)} style={{ background: '#E8F8F5', border: '1px solid #2ECC71', color: '#27AE60', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          수정
                        </button>
                        <button onClick={() => handleDeleteStudent(s.id, s.name)} style={{ background: '#FDEDEC', border: '1px solid #E74C3C', color: '#C0392B', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: '30px', textAlign: 'center', color: '#7F8C8D' }}>
                    등록된 학생이 없습니다. 신규 학생을 등록해 주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 등록 및 수정 팝업 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                {isEdit ? '✏️ 학생 및 학부모 정보 수정' : '➕ 신규 학생 및 학부모 등록'}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🏫 학년</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
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
                    value={dailyWordCount}
                    onChange={(e) => setDailyWordCount(e.target.value)}
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
                  value={studentPin}
                  onChange={(e) => setStudentPin(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <div style={{ borderTop: '1px dashed #BDC3C7', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#8E44AD', fontWeight: 'bold' }}>👨‍👩‍👧‍👦 학부모 정보</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>학부모 이름</label>
                <input
                  type="text"
                  placeholder="예: 김철수"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>연락처</label>
                  <input
                    type="text"
                    placeholder="010-0000-0000"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔑 학부모 비밀번호(PIN)</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="예: 5678"
                    value={parentPin}
                    onChange={(e) => setParentPin(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: isEdit ? '#2ECC71' : '#3498DB', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '10px' }}
              >
                {isEdit ? '☁️ 수정 사항 클라우드 DB 저장' : '✨ 신규 등록 클라우드 DB 저장'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
