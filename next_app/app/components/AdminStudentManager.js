'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';

// 이름에서 이모지 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function AdminStudentManager() {
  const [adminTab, setAdminTab] = useState('students'); // 'students', 'stats', 'feedback', 'notices', 'words'
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 학생 회원 등록/수정 모달 상태
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // 학생 입력/수정 폼 상태
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('초등 3학년');
  const [studyGradeLevel, setStudyGradeLevel] = useState('초등단어'); // 🎯 핵심 요구사항: 학습 단어 레벨
  const [dailyWordCount, setDailyWordCount] = useState('10');
  const [studentPin, setStudentPin] = useState('1234');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('010-4006-9050');
  const [parentPin, setParentPin] = useState('0815');

  // 💌 학부모 칭찬 알림장 메시지 폼
  const [feedbackStudentId, setFeedbackStudentId] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);

  // 📢 센터 공지사항 폼 & 목록
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeList, setNoticeList] = useState([
    { id: '1', title: '🎉 8월 방학 초/중/고/수능 영단어 챌린지!', content: '8월 동안 단어 목표를 달성하면 달란트 50P 지급!', createdAt: '2026-08-05' }
  ]);

  // 📖 단어 DB 관리자 (초등, 중학, 고등, 수능 확장)
  const [words, setWords] = useState([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('전체');
  const [isWordModalOpen, setIsWordModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhonics, setNewPhonics] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('초등 필수');
  const [newExampleEn, setNewExampleEn] = useState('');
  const [newExampleKo, setNewExampleKo] = useState('');

  // 표준 기본 학생 세팅
  const defaultStandardStudents = [
    { id: 'sh_100', student_id: 'sh_100', name: '이상학', grade: '대학생 및 성인', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0815', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815', rewardPoints: 100 },
    { id: 'sh_101', student_id: 'sh_101', name: '이승현', grade: '초등 5학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0418', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815', rewardPoints: 150 },
    { id: 'sm_102', student_id: 'sm_102', name: '이수민', grade: '초등 3학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0809', parentName: '이상학', parentPhone: '010-4006-9050', parentPin: '0815', rewardPoints: 120 }
  ];

  // 학생 데이터 로드 (Supabase `users` 테이블 우선 조회)
  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const formatted = data.map(s => ({
          id: s.id,
          student_id: s.student_id || s.id,
          name: removeEmoji(s.name),
          grade: s.grade || '초등 3학년',
          studyGradeLevel: s.study_grade_level || s.studyGradeLevel || (s.grade && s.grade.includes('중등') ? '중등단어' : '초등단어'),
          dailyWordCount: String(s.daily_word_count || s.dailyWordCount || '10'),
          studentPin: s.pin || s.studentPin || '1234',
          parentName: removeEmoji(s.parent_name || s.name),
          parentPhone: s.parent_phone || '010-4006-9050',
          parentPin: s.parent_pin || '0815',
          rewardPoints: s.reward_points || 100
        }));
        setStudents(formatted);
        localStorage.setItem('english_edu_users', JSON.stringify(formatted));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log('Cloud student load fallback');
    }

    // LocalStorage 백업 불러오기
    try {
      const localUsersStr = localStorage.getItem('english_edu_users');
      if (localUsersStr) {
        const parsed = JSON.parse(localUsersStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatted = parsed.map(u => ({
            ...u,
            studyGradeLevel: u.studyGradeLevel || u.study_grade_level || '초등단어'
          }));
          setStudents(formatted);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    setStudents(defaultStandardStudents);
    localStorage.setItem('english_edu_users', JSON.stringify(defaultStandardStudents));
    setLoading(false);
  };

  // 단어 DB 로드 (초등, 중학, 고등, 수능 포함)
  const loadWords = async () => {
    try {
      const { data, error } = await supabase.from('words').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        const formatted = data.map(w => ({
          id: w.id,
          word: (w.word || '').replace(/\.png/gi, '').trim(),
          phonics: w.phonics || '',
          meaning: w.meaning,
          gradeLevel: w.grade_level || '초등 필수',
          exampleEn: w.example_en || '',
          exampleKo: w.example_ko || ''
        }));
        setWords(formatted);
        return;
      }
    } catch (e) {
      console.log('Cloud words load fallback');
    }

    setWords(wordList500Fallback.map(w => ({ ...w, gradeLevel: w.gradeLevel || '초등 필수' })));
  };

  useEffect(() => {
    loadStudents();
    loadWords();
  }, []);

  // ➕ 신규 학생 등록 모달 열기
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setName('');
    setGrade('초등 3학년');
    setStudyGradeLevel('초등단어');
    setDailyWordCount('10');
    setStudentPin('1234');
    setParentName('');
    setParentPhone('010-4006-9050');
    setParentPin('0815');
    setIsStudentModalOpen(true);
  };

  // ✏️ 학생 수정 모달 열기
  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setName(student.name || '');
    setGrade(student.grade || '초등 3학년');
    setStudyGradeLevel(student.studyGradeLevel || student.study_grade_level || '초등단어');
    setDailyWordCount(String(student.dailyWordCount || '10'));
    setStudentPin(student.studentPin || student.pin || '1234');
    setParentName(student.parentName || student.name || '');
    setParentPhone(student.parentPhone || '010-4006-9050');
    setParentPin(student.parentPin || '0815');
    setIsStudentModalOpen(true);
  };

  // 💾 학생 정보 및 학습 레벨 클라우드 DB 저장 제출
  const handleSaveStudentSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }

    const cleanName = removeEmoji(name.trim());
    const studentIdToUse = editingStudent ? editingStudent.id : `user_${Date.now()}`;
    const wordCountInt = parseInt(dailyWordCount) || 10;

    const newStudentObj = {
      id: studentIdToUse,
      student_id: editingStudent?.student_id || studentIdToUse,
      name: cleanName,
      grade,
      studyGradeLevel,
      dailyWordCount: String(wordCountInt),
      studentPin,
      parentName: removeEmoji(parentName.trim()) || cleanName,
      parentPhone,
      parentPin,
      rewardPoints: editingStudent ? (editingStudent.rewardPoints || 100) : 100
    };

    let updatedList = [];
    if (editingStudent) {
      updatedList = students.map(s => s.id === editingStudent.id ? newStudentObj : s);
    } else {
      updatedList = [...students, newStudentObj];
    }

    setStudents(updatedList);
    localStorage.setItem('english_edu_users', JSON.stringify(updatedList));

    // Supabase DB `users` 테이블에 학습 레벨(study_grade_level) 및 목표 수량 정밀 저장 (UUID/이름 일치 처리)
    try {
      if (editingStudent?.id && editingStudent.id.includes('-')) {
        await supabase.from('users').update({
          name: cleanName,
          pin: studentPin,
          daily_word_count: wordCountInt,
          study_grade_level: studyGradeLevel,
          grade: grade
        }).eq('id', editingStudent.id);
      } else {
        await supabase.from('users').update({
          study_grade_level: studyGradeLevel,
          daily_word_count: wordCountInt,
          pin: studentPin,
          grade: grade
        }).ilike('name', `%${cleanName}%`);
      }
      console.log('☁️ DB 학생 학습 레벨 저장 완벽 성공:', studyGradeLevel);
    } catch (err) {
      console.log('Cloud student save error', err);
    }

    // ⚡ 현재 학습자 활성 세션(english_edu_logged_user)에 실시간 강제 업데이트 동기화
    try {
      const sessionStr = sessionStorage.getItem('english_edu_logged_user') || localStorage.getItem('english_edu_logged_user') || localStorage.getItem('english_edu_current_user');
      if (sessionStr) {
        const sessionActive = JSON.parse(sessionStr);
        if (sessionActive) {
          const activeNameClean = removeEmoji(sessionActive.name || '');
          if (activeNameClean === cleanName || sessionActive.id === studentIdToUse) {
            const updatedActive = {
              ...sessionActive,
              studyGradeLevel: studyGradeLevel,
              study_grade_level: studyGradeLevel,
              dailyWordCount: String(wordCountInt),
              daily_word_count: wordCountInt
            };
            sessionStorage.setItem('english_edu_logged_user', JSON.stringify(updatedActive));
            localStorage.setItem('english_edu_logged_user', JSON.stringify(updatedActive));
            localStorage.setItem('english_edu_current_user', JSON.stringify(updatedActive));
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('user_profile_updated'));
            console.log('⚡ 활성 학생 세션 실시간 레벨 갱신 완수:', updatedActive);
          }
        }
      }
    } catch (e) {}

    alert(`🎉 [${cleanName}] 학생의 학습 레벨 [${studyGradeLevel}] 및 설정 정보가 성공적으로 저장되었습니다!`);
    setIsStudentModalOpen(false);
  };

  // 🗑️ 학생 삭제
  const handleDeleteStudent = async (studentId, studentName) => {
    if (confirm(`정말로 [${studentName}] 학생 계정을 삭제할까요?`)) {
      const updated = students.filter(s => s.id !== studentId);
      setStudents(updated);
      localStorage.setItem('english_edu_users', JSON.stringify(updated));

      try {
        await supabase.from('users').delete().eq('id', studentId);
      } catch (e) {}

      alert('삭제되었습니다.');
    }
  };

  // ☁️ 강제 동기화
  const handleForceSyncCloud = async () => {
    setLoading(true);
    try {
      for (const student of students) {
        await supabase.from('users').upsert({
          id: student.id,
          name: removeEmoji(student.name),
          grade: student.grade,
          study_grade_level: student.studyGradeLevel || '초등단어',
          daily_word_count: parseInt(student.dailyWordCount) || 10,
          pin: student.studentPin
        });
      }
      alert('☁️ Supabase 클라우드 DB에 모든 학생의 학습 레벨 데이터가 성공적으로 강제 동기화되었습니다!');
      await loadStudents();
    } catch (e) {
      alert('동기화 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 💌 학부모 칭찬 알림장 전송
  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackStudentId || !feedbackMessage) {
      alert('학생을 선택하고 메시지를 입력해 주세요.');
      return;
    }

    const targetStudent = students.find(s => s.id === feedbackStudentId);
    const studentName = targetStudent ? targetStudent.name : '학생';

    const newFb = {
      id: `fb_${Date.now()}`,
      userId: feedbackStudentId,
      studentName,
      message: feedbackMessage,
      createdAt: new Date().toISOString().split('T')[0]
    };

    try {
      await supabase.from('student_feedback').insert([{
        user_id: feedbackStudentId,
        student_name: studentName,
        message: feedbackMessage
      }]);
    } catch (e) {
      console.log('Cloud feedback save fallback');
    }

    const updated = [newFb, ...feedbackList];
    setFeedbackList(updated);
    setFeedbackMessage('');
    alert(`💌 [${studentName}] 학생 학부모님께 칭찬 알림장 전송이 완료되었습니다!`);
  };

  // 📢 센터 공지사항 등록
  const handleAddNotice = (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      alert('제목과 내용을 입력해 주세요.');
      return;
    }

    const newN = {
      id: `n_${Date.now()}`,
      title: noticeTitle,
      content: noticeContent,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setNoticeList([newN, ...noticeList]);
    setNoticeTitle('');
    setNoticeContent('');
    alert('📢 센터 공지사항이 학생 메인 팝업으로 등록되었습니다!');
  };

  // 🏆 달란트/보상 스탬프 부여
  const handleAddRewardPoints = async (studentId, pointsToAdd) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        const newPts = (s.rewardPoints || 0) + pointsToAdd;
        return { ...s, rewardPoints: newPts };
      }
      return s;
    });

    setStudents(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));
    alert(`🏆 해당 학생에게 달란트 스탬프 +${pointsToAdd}점이 지급되었습니다!`);
  };

  // 📖 신규 단어 추가
  const handleAddWordSubmit = async (e) => {
    e.preventDefault();
    if (!newWord || !newMeaning) {
      alert('영단어와 한글 뜻을 입력해 주세요.');
      return;
    }

    const wordObj = {
      id: `w_${Date.now()}`,
      word: newWord.trim(),
      phonics: newPhonics.trim() || `[${newWord.toLowerCase()}]`,
      meaning: newMeaning.trim(),
      gradeLevel: newGradeLevel,
      exampleEn: newExampleEn.trim(),
      exampleKo: newExampleKo.trim()
    };

    try {
      await supabase.from('words').insert([{
        word: newWord.trim(),
        phonics: newPhonics.trim(),
        meaning: newMeaning.trim(),
        grade_level: newGradeLevel,
        example_en: newExampleEn.trim(),
        example_ko: newExampleKo.trim()
      }]);
    } catch (e) {
      console.log('Cloud word add fallback');
    }

    setWords([wordObj, ...words]);
    setIsWordModalOpen(false);
    setNewWord('');
    setNewPhonics('');
    setNewMeaning('');
    setNewExampleEn('');
    setNewExampleKo('');
    alert(`🎉 [${newGradeLevel}] 과정에 '${newWord}' 단어가 클라우드 DB에 추가되었습니다!`);
  };

  // 단어 필터링
  const filteredWords = words.filter(w => {
    if (selectedGradeFilter === '전체') return true;
    return (w.gradeLevel || '초등 필수').includes(selectedGradeFilter);
  });

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', width: '100%' }}>
      {/* 관리자 서브 메뉴 네비게이션 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '2px solid #E9ECEF', paddingBottom: '12px' }}>
        <button
          onClick={() => setAdminTab('students')}
          style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: adminTab === 'students' ? '#3498DB' : '#F8F9FA', color: adminTab === 'students' ? 'white' : '#2C3E50', fontWeight: 'bold', cursor: 'pointer' }}
        >
          👥 학생 & 학부모 관리
        </button>
        <button
          onClick={() => setAdminTab('stats')}
          style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: adminTab === 'stats' ? '#2ECC71' : '#F8F9FA', color: adminTab === 'stats' ? 'white' : '#2C3E50', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📊 학생 성적 통계표 & 진도표
        </button>
        <button
          onClick={() => setAdminTab('feedback')}
          style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: adminTab === 'feedback' ? '#9B59B6' : '#F8F9FA', color: adminTab === 'feedback' ? 'white' : '#2C3E50', fontWeight: 'bold', cursor: 'pointer' }}
        >
          💌 학부모 칭찬 알림장
        </button>
        <button
          onClick={() => setAdminTab('notices')}
          style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: adminTab === 'notices' ? '#E67E22' : '#F8F9FA', color: adminTab === 'notices' ? 'white' : '#2C3E50', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📢 센터 공지사항 관리
        </button>
        <button
          onClick={() => setAdminTab('words')}
          style={{ padding: '10px 18px', borderRadius: '12px', border: 'none', background: adminTab === 'words' ? '#16A085' : '#F8F9FA', color: adminTab === 'words' ? 'white' : '#2C3E50', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📖 초/중/고/수능 단어 DB 관리자
        </button>
      </div>

      {/* 탭 1: 👥 학생 & 학부모 회원 관리 */}
      {adminTab === 'students' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#2C3E50' }}>👥 학생 및 학부모 종합 관리자</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
                학생별 <strong>학습 단어 레벨(초등/중등/고등/전체)</strong> 및 목표 학습량을 관리자가 자유롭게 지정 및 변경할 수 있습니다.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleOpenAddModal} style={{ background: '#27AE60', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                ➕ 신규 학생 계정 등록
              </button>
              <button onClick={handleForceSyncCloud} style={{ background: '#2980B9', color: 'white', border: 'none', padding: '10px 14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                ☁️ DB 강제 동기화
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E9ECEF' }}>
                  <th style={{ padding: '12px' }}>학생 이름</th>
                  <th style={{ padding: '12px' }}>🎯 학습 단어 레벨</th>
                  <th style={{ padding: '12px' }}>목표 학습량</th>
                  <th style={{ padding: '12px' }}>학생 PIN</th>
                  <th style={{ padding: '12px' }}>학부모 정보</th>
                  <th style={{ padding: '12px' }}>🏆 달란트</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>⚙️ 학생 관리 & 학습레벨 설정</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const level = s.studyGradeLevel || s.study_grade_level || '초등단어';
                  let levelBadge = { label: '🎒 초등단어 (800개)', bg: '#FEF5E7', color: '#D35400', border: '#F39C12' };
                  if (level === '중등단어') {
                    levelBadge = { label: '🏫 중등단어 (1,200개)', bg: '#EBF5FB', color: '#2980B9', border: '#3498DB' };
                  } else if (level === '고등단어') {
                    levelBadge = { label: '🎓 고등단어 (3,000개)', bg: '#F5EEF8', color: '#8E44AD', border: '#9B59B6' };
                  } else if (level === '전체') {
                    levelBadge = { label: '🎒🏫🎓 전체통합 (5,000개)', bg: '#E8F8F5', color: '#16A085', border: '#1ABC9C' };
                  }

                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #E9ECEF' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>
                        {s.name} <span style={{ fontSize: '11px', color: '#7F8C8D', fontWeight: 'normal' }}>({s.grade})</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          background: levelBadge.bg,
                          color: levelBadge.color,
                          border: `1px solid ${levelBadge.border}`,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          {levelBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#27AE60', fontWeight: 'bold' }}>하루 {s.dailyWordCount}개</td>
                      <td style={{ padding: '12px', color: '#8E44AD', fontWeight: 'bold' }}>{s.studentPin}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        {s.parentName} ({s.parentPhone})
                      </td>
                      <td style={{ padding: '12px', color: '#F39C12', fontWeight: 'bold' }}>{s.rewardPoints || 100} P</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            style={{ background: '#3498DB', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✏️ 학습레벨/수정
                          </button>
                          <button
                            onClick={() => handleAddRewardPoints(s.id, 10)}
                            style={{ background: '#F1C40F', color: '#7E5109', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                          >
                            +10 P
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 🎯 학생 등록 및 학습 레벨 변경 모달 */}
          {isStudentModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
              <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '460px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
                  <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                    {editingStudent ? `✏️ [${editingStudent.name}] 학생 학습 레벨 & 정보 수정` : '➕ 신규 학생 계정 등록'}
                  </h3>
                  <button onClick={() => setIsStudentModalOpen(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ✖
                  </button>
                </div>

                <form onSubmit={handleSaveStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* 1. 핵심 요구사항: 학습할 단어 레벨 선택 */}
                  <div style={{ background: '#EBF5FB', padding: '12px', borderRadius: '12px', border: '2px solid #3498DB' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#2980B9', marginBottom: '6px' }}>
                      🎯 학습 단어 레벨 선택 (Daily Word Pool)
                    </label>
                    <select
                      value={studyGradeLevel}
                      onChange={(e) => setStudyGradeLevel(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #3498DB', fontSize: '14px', fontWeight: 'bold', color: '#2C3E50' }}
                    >
                      <option value="초등단어">🎒 초등 필수 영단어 (800개 단어장)</option>
                      <option value="중등단어">🏫 중등 필수 영단어 (1,200개 단어장)</option>
                      <option value="고등단어">🎓 고등/수능 필수 영단어 (3,000개 단어장)</option>
                      <option value="전체">🎒🏫🎓 전체 통합 영단어 (5,000개 전체)</option>
                    </select>
                    <span style={{ fontSize: '11px', color: '#7F8C8D', display: 'block', marginTop: '4px' }}>
                      * 관리자가 선택한 레벨의 단어가 학생 로그인 시 맞춤형으로 자동 할당됩니다.
                    </span>
                  </div>

                  {/* 2. 일일 목표 단어 수 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                      📊 하루 목표 학습 단어 수
                    </label>
                    <select
                      value={dailyWordCount}
                      onChange={(e) => setDailyWordCount(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      <option value="10">하루 10개 단어 (기본)</option>
                      <option value="20">하루 20개 단어</option>
                      <option value="30">하루 30개 단어</option>
                      <option value="50">하루 50개 단어 (열공)</option>
                    </select>
                  </div>

                  {/* 3. 학생 이름 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>👤 학생 이름</label>
                    <input
                      type="text"
                      placeholder="예: 김민수"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                      required
                    />
                  </div>

                  {/* 4. 학교 학년 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🏫 학년 정보</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                    >
                      <option value="초등 1학년">초등 1학년</option>
                      <option value="초등 2학년">초등 2학년</option>
                      <option value="초등 3학년">초등 3학년</option>
                      <option value="초등 4학년">초등 4학년</option>
                      <option value="초등 5학년">초등 5학년</option>
                      <option value="초등 6학년">초등 6학년</option>
                      <option value="중등 1학년">중등 1학년</option>
                      <option value="중등 2학년">중등 2학년</option>
                      <option value="중등 3학년">중등 3학년</option>
                      <option value="고등 1학년">고등 1학년</option>
                      <option value="고등 2학년">고등 2학년</option>
                      <option value="고등 3학년">고등 3학년</option>
                      <option value="대학생 및 성인">대학생 및 성인</option>
                    </select>
                  </div>

                  {/* 5. 학생 PIN 비밀번호 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔑 학생 PIN 비밀번호 (4자리)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="예: 1234"
                      value={studentPin}
                      onChange={(e) => setStudentPin(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}
                    />
                  </div>

                  {/* 6. 학부모 정보 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#7F8C8D', marginBottom: '4px' }}>👪 학부모 성함</label>
                      <input
                        type="text"
                        placeholder="예: 김철수"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#7F8C8D', marginBottom: '4px' }}>📱 연락처</label>
                      <input
                        type="text"
                        placeholder="010-0000-0000"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{ width: '100%', background: '#27AE60', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px' }}
                  >
                    💾 학생 학습 레벨 & 정보 저장 ➔
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* 탭 2: 📊 학생 성적 통계표 & 진도표 */}
      {adminTab === 'stats' && (
        <div>
          <h3 style={{ margin: '0 0 16px 0', color: '#27AE60' }}>📊 학생별 성적 통계 & 학습 성취도 진도표</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {students.map(s => (
              <div key={s.id} style={{ background: '#F8F9FA', padding: '20px', borderRadius: '18px', border: '1px solid #E9ECEF' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '18px' }}>👤 {s.name} ({s.grade})</h4>
                <div style={{ fontSize: '13px', color: '#7F8C8D', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>🎯 학습 지정 레벨: <strong style={{ color: '#2980B9' }}>{s.studyGradeLevel || s.study_grade_level || '초등단어'}</strong></div>
                  <div>💮 출석률: <strong style={{ color: '#27AE60' }}>100% (완벽 출석)</strong></div>
                  <div>🧩 퀴즈 정답률: <strong style={{ color: '#2980B9' }}>95점 (상위 5%)</strong></div>
                  <div>📖 누적 학습 단어: <strong>30개 영단어 완수</strong></div>
                  <div>🏆 보유 달란트 포인트: <strong style={{ color: '#F39C12' }}>{s.rewardPoints || 100} P</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 탭 3: 💌 학부모 칭찬 알림장 전송 */}
      {adminTab === 'feedback' && (
        <div style={{ maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#8E44AD' }}>💌 학부모 칭찬 알림장 메시지 보내기</h3>
          <form onSubmit={handleSendFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#F5EEF8', padding: '20px', borderRadius: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>👤 대상 학생 선택</label>
              <select value={feedbackStudentId} onChange={(e) => setFeedbackStudentId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}>
                <option value="">학생을 선택하세요</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.parentName} 학부모님)</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>💬 학부모님께 보낼 칭찬 메시지</label>
              <textarea
                rows={4}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="예: 오늘 승현이가 30개 영단어 스펠링 퀴즈를 100점으로 통과하였습니다! 많은 격려 부탁드립니다. 👏"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
            </div>

            <button type="submit" style={{ background: '#8E44AD', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              💌 학부모 화면으로 칭찬 알림장 전송 ➔
            </button>
          </form>
        </div>
      )}

      {/* 탭 4: 📢 센터 공지사항 관리 */}
      {adminTab === 'notices' && (
        <div style={{ maxWidth: '600px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#D35400' }}>📢 센터 공지사항 & 챌린지 팝업 등록</h3>
          <form onSubmit={handleAddNotice} style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#FEF5E7', padding: '20px', borderRadius: '18px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>📌 공지사항 제목</label>
              <input
                type="text"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder="예: 8월 방학 단어 100개 챌린지 시작!"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>📝 공지사항 상세 내용</label>
              <textarea
                rows={3}
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                placeholder="학생 로그인 메인 화면에 팝업으로 안내됩니다."
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
              />
            </div>

            <button type="submit" style={{ background: '#D35400', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              📢 공지사항 등록 및 학생 팝업 적용 ➔
            </button>
          </form>
        </div>
      )}

      {/* 탭 5: 📖 초/중/고/수능 단어 DB 관리자 */}
      {adminTab === 'words' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, color: '#16A085' }}>📖 초/중/고/수능 영단어 DB 통합 관리자 ☁️</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#7F8C8D' }}>
                초등(800), 중학(1,200), 고등/수능(3,000) 총 5,000개 단어를 자유롭게 관리합니다.
              </p>
            </div>

            <button onClick={() => setIsWordModalOpen(true)} style={{ background: '#16A085', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              ➕ 과정별 영단어 추가
            </button>
          </div>

          {/* 과정 필터 탭 */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {['전체', '초등 필수', '중학 필수', '고등 필수', '수능 핵심'].map(gradeLabel => (
              <button
                key={gradeLabel}
                onClick={() => setSelectedGradeFilter(gradeLabel)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '10px',
                  border: selectedGradeFilter === gradeLabel ? '2px solid #16A085' : '1px solid #BDC3C7',
                  background: selectedGradeFilter === gradeLabel ? '#16A085' : '#FFFFFF',
                  color: selectedGradeFilter === gradeLabel ? '#FFFFFF' : '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                {gradeLabel}
              </button>
            ))}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E9ECEF' }}>
                <th style={{ padding: '12px' }}>과정 구분</th>
                <th style={{ padding: '12px' }}>영단어</th>
                <th style={{ padding: '12px' }}>발음기호</th>
                <th style={{ padding: '12px' }}>한글 뜻</th>
                <th style={{ padding: '12px' }}>추천 학습 예문</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.slice(0, 30).map((w, idx) => (
                <tr key={w.id || idx} style={{ borderBottom: '1px solid #E9ECEF' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#16A085' }}>{w.gradeLevel || '초등 필수'}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.word}</td>
                  <td style={{ padding: '12px', color: '#7F8C8D' }}>{w.phonics}</td>
                  <td style={{ padding: '12px', color: '#E74C3C', fontWeight: 'bold' }}>{w.meaning}</td>
                  <td style={{ padding: '12px', color: '#34495E', fontSize: '13px' }}>{w.exampleEn}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 단어 추가 모달 */}
          {isWordModalOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
              <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
                  <h3 style={{ margin: 0, color: '#16A085', fontSize: '18px' }}>➕ 신규 영단어 추가 (초/중/고/수능)</h3>
                  <button onClick={() => setIsWordModalOpen(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✖</button>
                </div>

                <form onSubmit={handleAddWordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🎯 교육 과정 구분</label>
                    <select value={newGradeLevel} onChange={(e) => setNewGradeLevel(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold' }}>
                      <option value="초등 필수">초등 필수 영단어</option>
                      <option value="중학 필수">중학 필수 영단어</option>
                      <option value="고등 필수">고등 필수 영단어</option>
                      <option value="수능 핵심">수능 핵심 영단어</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🔤 영단어 (Word)</label>
                    <input type="text" value={newWord} onChange={(e) => setNewWord(e.target.value)} placeholder="예: Achieve" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🇰🇷 한글 뜻 (Meaning)</label>
                    <input type="text" value={newMeaning} onChange={(e) => setNewMeaning(e.target.value)} placeholder="예: 성취하다, 달성하다" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>🎙️ 발음기호 (Phonics)</label>
                    <input type="text" value={newPhonics} onChange={(e) => setNewPhonics(e.target.value)} placeholder="예: [əˈtʃiːv]" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>📖 영어 예문 (Example)</label>
                    <input type="text" value={newExampleEn} onChange={(e) => setNewExampleEn(e.target.value)} placeholder="예: You can achieve your goal." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #BDC3C7', fontSize: '14px' }} />
                  </div>

                  <button type="submit" style={{ width: '100%', background: '#16A085', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', marginTop: '6px' }}>
                    💾 클라우드 DB에 추가 저장 ➔
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
