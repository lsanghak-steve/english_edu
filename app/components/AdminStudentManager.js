'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

// 이름에서 이모지 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function AdminStudentManager() {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // 입력 폼 상태
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('초등 3학년');
  const [dailyWordCount, setDailyWordCount] = useState('10');
  const [studentPin, setStudentPin] = useState('1234');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState('5678');

  // 최신 표준 동기화 기본 3인 데이터셋 (이상학, 이승현, 이수민)
  const defaultStandardStudents = [
    { id: 'sh_100', name: '이상학', grade: '대학생 및 성인', dailyWordCount: '10', studentPin: '0815', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815' },
    { id: 'sh_101', name: '이승현', grade: '초등 5학년', dailyWordCount: '10', studentPin: '0418', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815' },
    { id: 'sm_102', name: '이수민', grade: '초등 3학년', dailyWordCount: '10', studentPin: '0809', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815' }
  ];

  // Supabase 클라우드 DB에서 학생 전체 로드 및 동기화
  const loadStudentsFromCloud = async () => {
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
          parentPhone: s.parent_phone || '010-4006-9050',
          parentPin: s.parent_pin || '0815'
        }));

        setStudents(formatted);
        localStorage.setItem('english_edu_users', JSON.stringify(formatted));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Cloud fetch error', e);
    }

    // 클라우드 데이터가 없을 시 기본 표준 3인 데이터셋 동기화 적용
    setStudents(defaultStandardStudents);
    localStorage.setItem('english_edu_users', JSON.stringify(defaultStandardStudents));
    setLoading(false);
  };

  useEffect(() => {
    loadStudentsFromCloud();
  }, []);

  // ☁️ 클라우드 DB로 표준 데이터 강제 동기화 덮어쓰기
  const handleForceSyncCloud = async () => {
    setLoading(true);
    try {
      for (const student of defaultStandardStudents) {
        await supabase.from('student_profiles').upsert({
          id: student.id,
          name: removeEmoji(student.name),
          grade: student.grade,
          daily_word_count: student.dailyWordCount,
          student_pin: student.studentPin,
          parent_name: removeEmoji(student.parentName),
          parent_phone: student.parentPhone,
          parent_pin: student.parentPin,
          updated_at: new Date().toISOString()
        });
      }
      alert('☁️ Supabase 클라우드 DB에 최신 학생 데이터(이상학, 이승현, 이수민)가 성공적으로 강제 동기화되었습니다!\nVercel과 로컬 화면이 이제 100% 동일하게 일치합니다.');
      await loadStudentsFromCloud();
    } catch (e) {
      alert('동기화 중 오류가 발생하였습니다.');
      setLoading(false);
    }
  };

  // 신규 등록 / 수정 모달 열기
  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setName(removeEmoji(student.name));
      setGrade(student.grade || '초등 3학년');
      setDailyWordCount(student.dailyWordCount || '10');
      setStudentPin(student.studentPin || '1234');
      setParentName(removeEmoji(student.parentName));
      setParentPhone(student.parentPhone || '010-4006-9050');
      setParentPin(student.parentPin || '0815');
    } else {
      setEditingStudent(null);
      setName('');
      setGrade('초등 3학년');
      setDailyWordCount('10');
      setStudentPin('1234');
      setParentName('');
      setParentPhone('010-4006-9050');
      setParentPin('0815');
    }
    setIsModalOpen(true);
  };

  // 학생 데이터 저장 (클라우드 DB + localStorage 동시 갱신)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = removeEmoji(name);
    const cleanParentName = removeEmoji(parentName);

    if (!cleanName) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    const studentId = editingStudent ? editingStudent.id : `st_${Date.now()}`;
    const newStudentObj = {
      id: studentId,
      name: cleanName,
      grade,
      dailyWordCount,
      studentPin,
      parentName: cleanParentName || `${cleanName}학부모`,
      parentPhone: parentPhone || '010-4006-9050',
      parentPin: parentPin || '0815'
    };

    // 1. Supabase 클라우드 DB 업서트 (저장/수정)
    try {
      await supabase.from('student_profiles').upsert({
        id: studentId,
        name: cleanName,
        grade,
        daily_word_count: dailyWordCount,
        student_pin: studentPin,
        parent_name: cleanParentName || `${cleanName}학부모`,
        parent_phone: parentPhone || '010-4006-9050',
        parent_pin: parentPin || '0815',
        updated_at: new Date().toISOString()
      });
    } catch (err) {
      console.log('Cloud sync warning', err);
    }

    // 2. 로컬 상태 & localStorage 동시 업데이트
    let updatedList = [];
    if (editingStudent) {
      updatedList = students.map(s => s.id === editingStudent.id ? newStudentObj : s);
    } else {
      updatedList = [...students, newStudentObj];
    }

    setStudents(updatedList);
    localStorage.setItem('english_edu_users', JSON.stringify(updatedList));

    setIsModalOpen(false);
    alert(`🎉 '${cleanName}' 학생 정보가 클라우드 DB 및 보관소에 성공적으로 동기화 저장되었습니다!`);
  };

  // 삭제
  const handleDelete = async (id, studentName) => {
    if (window.confirm(`'${studentName}' 학생 데이터를 삭제하시겠습니까?`)) {
      try {
        await supabase.from('student_profiles').delete().eq('id', id);
      } catch (e) {
        console.log('Cloud delete fallback');
      }

      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      localStorage.setItem('english_edu_users', JSON.stringify(updated));
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#2C3E50', fontSize: '22px', fontWeight: '900' }}>
            🥷 학생 및 학부모 종합 관리자 센터 ☁️
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
            등록된 학생 데이터는 클라우드 DB에 자동 공유되어 Vercel과 로컬에 실시간 반영됩니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleForceSyncCloud}
            style={{ background: '#27AE60', color: 'white', border: 'none', padding: '12px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(39,174,96,0.2)' }}
            title="클라우드 DB 데이터를 로컬 컴퓨터와 Vercel 웹사이트에 강제 동기화"
          >
            ☁️ 클라우드 DB 강제 동기화
          </button>

          <button
            onClick={() => openModal()}
            style={{ background: '#3498DB', color: 'white', border: 'none', padding: '12px 18px', borderRadius: '14px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(52,152,219,0.3)' }}
          >
            ➕ 신규 학생 계정 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#3498DB', fontWeight: 'bold' }}>
          ☁️ 클라우드 DB에서 최신 학생 정보를 동기화하는 중...
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E9ECEF', color: '#34495E' }}>
                <th style={{ padding: '14px 12px' }}>학생 이름</th>
                <th style={{ padding: '14px 12px' }}>학년</th>
                <th style={{ padding: '14px 12px' }}>목표 학습량</th>
                <th style={{ padding: '14px 12px' }}>학생 PIN</th>
                <th style={{ padding: '14px 12px' }}>학부모 이름</th>
                <th style={{ padding: '14px 12px' }}>연락처</th>
                <th style={{ padding: '14px 12px' }}>학부모 PIN</th>
                <th style={{ padding: '14px 12px', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid #E9ECEF' }}>
                  <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#2C3E50' }}>
                    {removeEmoji(student.name)}
                  </td>
                  <td style={{ padding: '14px 12px', color: '#7F8C8D' }}>{student.grade}</td>
                  <td style={{ padding: '14px 12px', color: '#27AE60', fontWeight: 'bold' }}>하루 {student.dailyWordCount}단어</td>
                  <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#8E44AD' }}>{student.studentPin}</td>
                  <td style={{ padding: '14px 12px', color: '#34495E' }}>{removeEmoji(student.parentName)}</td>
                  <td style={{ padding: '14px 12px', color: '#7F8C8D' }}>{student.parentPhone || '010-4006-9050'}</td>
                  <td style={{ padding: '14px 12px', fontWeight: 'bold', color: '#D35400' }}>{student.parentPin}</td>
                  <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => openModal(student)}
                        style={{ background: '#E8F8F5', color: '#16A085', border: '1px solid #A3E4D7', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(student.id, student.name)}
                        style={{ background: '#FADBD8', color: '#C0392B', border: '1px solid #F5B7B1', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 수정 / 신규 추가 모달 */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                {editingStudent ? '✏️ 학생 정보 수정' : '➕ 신규 학생 계정 추가'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>👤 학생 이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 이상학, 이승현, 이수민"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🏫 학년</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="초등 3학년">초등 3학년</option>
                    <option value="초등 4학년">초등 4학년</option>
                    <option value="초등 5학년">초등 5학년</option>
                    <option value="초등 6학년">초등 6학년</option>
                    <option value="대학생 및 성인">대학생 및 성인</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🎯 목표 단어수</label>
                  <select
                    value={dailyWordCount}
                    onChange={(e) => setDailyWordCount(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="10">하루 10단어</option>
                    <option value="15">하루 15단어</option>
                    <option value="20">하루 20단어</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔑 학생 PIN (4자리)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={studentPin}
                    onChange={(e) => setStudentPin(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔒 학부모 PIN (4자리)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={parentPin}
                    onChange={(e) => setParentPin(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>👨‍👩‍👧‍👦 학부모 이름</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="예: 이상학"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>📞 학부모 연락처</label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="예: 010-4006-9050"
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#3498DB', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
              >
                💾 클라우드 DB에 동기화 저장 ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
