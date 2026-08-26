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

  // 🎯 학생 승인 상태 필터 및 모달 상태
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [approvalStatus, setApprovalStatus] = useState('approved'); // 'approved', 'pending', 'rejected'

  // 학생 입력/수정 폼 상태
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('초등 3학년');
  const [studyGradeLevel, setStudyGradeLevel] = useState('초등단어'); // 🎯 핵심 요구사항: 학습 단어 레벨
  const [dailyWordCount, setDailyWordCount] = useState('10');
  const [studentPin, setStudentPin] = useState('1234');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('010-4006-9050');
  const [parentPin, setParentPin] = useState('0815');

  // 🎯 학생 승인 상태 헬퍼 함수
  const getStudentStatus = (student) => {
    if (!student) return 'approved';
    const av = String(student.avatar || student.grade || '');
    if (av.startsWith('[PENDING]')) return 'pending';
    if (av.startsWith('[REJECTED]')) return 'rejected';
    return 'approved';
  };

  const getCleanGrade = (student) => {
    if (!student) return '초등 3학년';
    const av = String(student.grade || student.avatar || '초등 3학년');
    return av.replace('[PENDING]', '').replace('[REJECTED]', '').trim() || '초등 3학년';
  };

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
          db_id: s.id,
          student_id: s.student_id || s.id,
          name: removeEmoji(s.name),
          grade: s.avatar || s.grade || '초등 3학년',
          avatar: s.avatar || s.grade || '초등 3학년',
          studyGradeLevel: s.study_grade_level || s.studyGradeLevel || (s.avatar && s.avatar.includes('중등') ? '중등단어' : (s.avatar && s.avatar.includes('고등') ? '고등단어' : '초등단어')),
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
            grade: u.grade || u.avatar || '초등 3학년',
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
    setApprovalStatus('approved');
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
    setGrade(getCleanGrade(student));
    setApprovalStatus(getStudentStatus(student));
    setStudyGradeLevel(student.studyGradeLevel || student.study_grade_level || '초등단어');
    setDailyWordCount(String(student.dailyWordCount || '10'));
    setStudentPin(student.studentPin || student.pin || '1234');
    setParentName(student.parentName || student.name || '');
    setParentPhone(student.parentPhone || '010-4006-9050');
    setParentPin(student.parentPin || '0815');
    setIsStudentModalOpen(true);
  };

  // ✅ 학생 가입 즉시 승인 처리
  const handleApproveStudent = async (student) => {
    const cleanGradeStr = getCleanGrade(student);
    const updated = students.map(s => {
      if (s.id === student.id || s.student_id === student.student_id) {
        return { ...s, grade: cleanGradeStr, avatar: cleanGradeStr };
      }
      return s;
    });
    setStudents(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));

    try {
      let targetId = student.db_id || student.id;
      if (targetId && String(targetId).includes('-')) {
        await supabase.from('users').update({ avatar: cleanGradeStr }).eq('id', targetId);
      } else if (student.student_id) {
        await supabase.from('users').update({ avatar: cleanGradeStr }).eq('student_id', student.student_id);
      } else {
        await supabase.from('users').update({ avatar: cleanGradeStr }).eq('name', student.name);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('study_data_updated'));
      }
    } catch (e) {}

    alert(`🎉 [${student.name}] 학생의 가입이 정상 승인되었습니다!\n이제 학생이 이름과 PIN 번호로 로그인하여 학습할 수 있습니다.`);
  };

  // ❌ 학생 가입 반려(미승인) 처리
  const handleRejectStudent = async (student) => {
    if (!confirm(`[${student.name}] 학생의 가입 신청을 반려(미승인) 처리할까요?`)) return;
    const cleanGradeStr = getCleanGrade(student);
    const rejectedAvatar = `[REJECTED] ${cleanGradeStr}`;
    const updated = students.map(s => {
      if (s.id === student.id || s.student_id === student.student_id) {
        return { ...s, grade: rejectedAvatar, avatar: rejectedAvatar };
      }
      return s;
    });
    setStudents(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));

    try {
      let targetId = student.db_id || student.id;
      if (targetId && String(targetId).includes('-')) {
        await supabase.from('users').update({ avatar: rejectedAvatar }).eq('id', targetId);
      } else if (student.student_id) {
        await supabase.from('users').update({ avatar: rejectedAvatar }).eq('student_id', student.student_id);
      } else {
        await supabase.from('users').update({ avatar: rejectedAvatar }).eq('name', student.name);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('study_data_updated'));
      }
    } catch (e) {}

    alert(`🚫 [${student.name}] 학생의 가입 신청이 반려 처리되었습니다.`);
  };

  // ⏳ 학생 가입 대기 상태로 전환
  const handleSetPendingStudent = async (student) => {
    const cleanGradeStr = getCleanGrade(student);
    const pendingAvatar = `[PENDING] ${cleanGradeStr}`;
    const updated = students.map(s => {
      if (s.id === student.id || s.student_id === student.student_id) {
        return { ...s, grade: pendingAvatar, avatar: pendingAvatar };
      }
      return s;
    });
    setStudents(updated);
    localStorage.setItem('english_edu_users', JSON.stringify(updated));

    try {
      let targetId = student.db_id || student.id;
      if (targetId && String(targetId).includes('-')) {
        await supabase.from('users').update({ avatar: pendingAvatar }).eq('id', targetId);
      } else if (student.student_id) {
        await supabase.from('users').update({ avatar: pendingAvatar }).eq('student_id', student.student_id);
      } else {
        await supabase.from('users').update({ avatar: pendingAvatar }).eq('name', student.name);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('study_data_updated'));
      }
    } catch (e) {}

    alert(`⏳ [${student.name}] 학생이 승인 대기 상태로 전환되었습니다.`);
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

    // 승인 상태에 따른 avatar 문자열 조합
    let finalAvatar = grade;
    if (approvalStatus === 'pending') finalAvatar = `[PENDING] ${grade}`;
    else if (approvalStatus === 'rejected') finalAvatar = `[REJECTED] ${grade}`;

    const newStudentObj = {
      id: studentIdToUse,
      student_id: editingStudent?.student_id || studentIdToUse,
      name: cleanName,
      grade: finalAvatar,
      avatar: finalAvatar,
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

    // Supabase DB `users` 테이블에 학습 레벨(study_grade_level), 학년(avatar) 및 목표 수량 정밀 저장
    try {
      const payload = {
        name: cleanName,
        pin: studentPin,
        daily_word_count: wordCountInt,
        study_grade_level: studyGradeLevel,
        avatar: finalAvatar
      };

      let existingRow = null;
      if (editingStudent?.id && String(editingStudent.id).includes('-')) {
        const { data } = await supabase.from('users').select('*').eq('id', editingStudent.id).limit(1);
        if (data && data[0]) existingRow = data[0];
      }
      if (!existingRow && (editingStudent?.student_id || studentIdToUse)) {
        const sid = editingStudent?.student_id || studentIdToUse;
        const { data } = await supabase.from('users').select('*').eq('student_id', sid).limit(1);
        if (data && data[0]) existingRow = data[0];
      }
      if (!existingRow) {
        const { data } = await supabase.from('users').select('*').ilike('name', `%${cleanName}%`).limit(1);
        if (data && data[0]) existingRow = data[0];
      }

      if (existingRow) {
        await supabase.from('users').update(payload).eq('id', existingRow.id);
        console.log('☁️ DB 기존 학생 정보 수정 완수:', cleanName, finalAvatar, studyGradeLevel);
      } else {
        payload.student_id = editingStudent?.student_id || studentIdToUse;
        await supabase.from('users').insert(payload);
        console.log('☁️ DB 신규 학생 등록 완수:', cleanName);
      }
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
          if (activeNameClean === cleanName || sessionActive.id === studentIdToUse || sessionActive.student_id === studentIdToUse) {
            const updatedActive = {
              ...sessionActive,
              grade: finalAvatar,
              avatar: finalAvatar,
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
            console.log('⚡ 활성 학생 세션 실시간 레벨/학년 갱신 완수:', updatedActive);
          }
        }
      }
    } catch (e) {}

    alert(`🎉 [${cleanName}] 학생의 정보 및 승인 상태가 성공적으로 저장되었습니다!`);
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
        const cleanName = removeEmoji(student.name);
        const payload = {
          name: cleanName,
          avatar: student.grade || '초등 3학년',
          study_grade_level: student.studyGradeLevel || student.study_grade_level || '초등단어',
          daily_word_count: parseInt(student.dailyWordCount || student.daily_word_count || 10, 10),
          pin: student.studentPin || student.pin || '1234'
        };

        let existingRow = null;
        if (student.id && String(student.id).includes('-')) {
          const { data } = await supabase.from('users').select('*').eq('id', student.id).limit(1);
          if (data && data[0]) existingRow = data[0];
        }
        if (!existingRow && student.student_id) {
          const { data } = await supabase.from('users').select('*').eq('student_id', student.student_id).limit(1);
          if (data && data[0]) existingRow = data[0];
        }
        if (!existingRow && cleanName) {
          const { data } = await supabase.from('users').select('*').ilike('name', `%${cleanName}%`).limit(1);
          if (data && data[0]) existingRow = data[0];
        }

        if (existingRow) {
          await supabase.from('users').update(payload).eq('id', existingRow.id);
        } else {
          payload.student_id = student.student_id || student.id || `user_${Date.now()}`;
          await supabase.from('users').insert(payload);
        }
      }
      alert('☁️ Supabase 클라우드 DB에 모든 학생의 학년 및 학습 레벨 데이터가 성공적으로 강제 동기화되었습니다!');
      await loadStudents();
    } catch (e) {
      alert('동기화 중 오류가 발생했습니다.');
    }
    setLoading(false);
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
              <h3 style={{ margin: 0, color: '#2C3E50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 학생 계정 및 가입 승인 관리자
                {students.filter(s => getStudentStatus(s) === 'pending').length > 0 && (
                  <span style={{ background: '#E74C3C', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                    ⏳ 승인 대기 {students.filter(s => getStudentStatus(s) === 'pending').length}건
                  </span>
                )}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#7F8C8D' }}>
                신규 가입 신청 학생을 <strong>[승인/반려]</strong> 처리하고, 학습 레벨 및 목표 학습량을 맞춤 지정할 수 있습니다.
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

          {/* 🎯 가입 상태별 필터 탭 바 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', background: '#F8F9FA', padding: '6px', borderRadius: '14px', border: '1px solid #E9ECEF' }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: statusFilter === 'all' ? '#2C3E50' : 'transparent',
                color: statusFilter === 'all' ? 'white' : '#64748B',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              전체 학생 ({students.length}명)
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: statusFilter === 'pending' ? '#E67E22' : 'transparent',
                color: statusFilter === 'pending' ? 'white' : (students.filter(s => getStudentStatus(s) === 'pending').length > 0 ? '#D35400' : '#64748B'),
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ⏳ 가입 승인 대기 ({students.filter(s => getStudentStatus(s) === 'pending').length}명)
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: statusFilter === 'approved' ? '#27AE60' : 'transparent',
                color: statusFilter === 'approved' ? 'white' : '#64748B',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ✅ 승인 완료 ({students.filter(s => getStudentStatus(s) === 'approved').length}명)
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                background: statusFilter === 'rejected' ? '#C0392B' : 'transparent',
                color: statusFilter === 'rejected' ? 'white' : '#64748B',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              ❌ 반려/미승인 ({students.filter(s => getStudentStatus(s) === 'rejected').length}명)
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#F8F9FA', borderBottom: '2px solid #E9ECEF' }}>
                  <th style={{ padding: '12px' }}>학생 이름 & 학년</th>
                  <th style={{ padding: '12px' }}>🚦 가입 승인 상태</th>
                  <th style={{ padding: '12px' }}>🎯 학습 단어 레벨</th>
                  <th style={{ padding: '12px' }}>목표 학습량</th>
                  <th style={{ padding: '12px' }}>학생 PIN</th>
                  <th style={{ padding: '12px' }}>학부모 정보</th>
                  <th style={{ padding: '12px' }}>🏆 달란트</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>⚙️ 가입 승인 & 관리</th>
                </tr>
              </thead>
              <tbody>
                {students
                  .filter(s => {
                    const st = getStudentStatus(s);
                    if (statusFilter === 'pending') return st === 'pending';
                    if (statusFilter === 'approved') return st === 'approved';
                    if (statusFilter === 'rejected') return st === 'rejected';
                    return true;
                  })
                  .map(s => {
                    const st = getStudentStatus(s);
                    const cleanGradeStr = getCleanGrade(s);
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
                      <tr key={s.id} style={{ borderBottom: '1px solid #E9ECEF', background: st === 'pending' ? '#FEF9E7' : (st === 'rejected' ? '#FDEDEC' : 'transparent') }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>
                          {s.name} <span style={{ fontSize: '11px', color: '#7F8C8D', fontWeight: 'normal' }}>({cleanGradeStr})</span>
                        </td>

                        {/* 🚦 상태 뱃지 컬럼 */}
                        <td style={{ padding: '12px' }}>
                          {st === 'pending' && (
                            <span style={{ background: '#FDEBD0', color: '#D35400', border: '1px solid #F39C12', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ⏳ 승인 대기
                            </span>
                          )}
                          {st === 'approved' && (
                            <span style={{ background: '#E8F8F5', color: '#27AE60', border: '1px solid #2ECC71', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ✅ 정상 승인
                            </span>
                          )}
                          {st === 'rejected' && (
                            <span style={{ background: '#FADBD8', color: '#C0392B', border: '1px solid #E74C3C', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              🚫 반려/미승인
                            </span>
                          )}
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

                        {/* ⚙️ 액션 버튼 */}
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {st === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveStudent(s)}
                                  style={{ background: '#27AE60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 6px rgba(39,174,96,0.3)' }}
                                >
                                  ✅ 가입 승인
                                </button>
                                <button
                                  onClick={() => handleRejectStudent(s)}
                                  style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  ❌ 반려
                                </button>
                              </>
                            )}

                            {st === 'approved' && (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(s)}
                                  style={{ background: '#3498DB', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  ✏️ 수정
                                </button>
                                <button
                                  onClick={() => handleSetPendingStudent(s)}
                                  style={{ background: '#F39C12', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}
                                  title="승인 대기로 전환"
                                >
                                  ⏳ 대기전환
                                </button>
                                <button
                                  onClick={() => handleAddRewardPoints(s.id, 10)}
                                  style={{ background: '#F1C40F', color: '#7E5109', border: 'none', padding: '6px 8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                                >
                                  +10P
                                </button>
                              </>
                            )}

                            {st === 'rejected' && (
                              <button
                                onClick={() => handleApproveStudent(s)}
                                style={{ background: '#27AE60', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                              >
                                ✅ 재승인
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteStudent(s.id, s.name)}
                              style={{ background: '#95A5A6', color: 'white', border: 'none', padding: '6px 8px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
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
                  {/* 1. 가입 승인 상태 설정 */}
                  <div style={{ background: '#FEF9E7', padding: '12px', borderRadius: '12px', border: '2px solid #F39C12' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#D35400', marginBottom: '6px' }}>
                      🚦 가입 승인 상태 (Login Approval Status)
                    </label>
                    <select
                      value={approvalStatus}
                      onChange={(e) => setApprovalStatus(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #F39C12', fontSize: '14px', fontWeight: 'bold', color: '#2C3E50' }}
                    >
                      <option value="approved">✅ 정상 승인 완료 (즉시 로그인 가능)</option>
                      <option value="pending">⏳ 승인 대기 중 (로그인 대기/차단)</option>
                      <option value="rejected">🚫 가입 반려 (접속 불가)</option>
                    </select>
                  </div>

                  {/* 2. 핵심 요구사항: 학습할 단어 레벨 선택 */}
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

                  {/* 3. 일일 목표 단어 수 */}
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

                  {/* 4. 학생 이름 */}
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

                  {/* 5. 학교 학년 */}
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

                  {/* 6. 학생 PIN 비밀번호 */}
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

                  {/* 7. 학부모 정보 */}
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
