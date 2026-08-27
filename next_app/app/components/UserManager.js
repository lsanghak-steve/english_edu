'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import { translateStudentGrade, translateGradeLevel } from '../../lib/i18n.js';
import ChinaPaymentModal from './ChinaPaymentModal.js';

// 학생 이름 이모지 자동 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}]/gu, '')
    .trim();
};

export default function UserManager({ currentUser, setCurrentUser, onLogout, currentLang = 'ko' }) {
  const [users, setUsers] = useState([]);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
        const formatted = usersData.map(item => {
          const rawAvatar = String(item.avatar || item.grade || '').trim();
          const cleanGrade = rawAvatar.replace('[PENDING]', '').replace('[APPROVED]', '').replace('[REJECTED]', '').trim() || '초등 5학년';

          return {
            id: item.student_id || item.id,
            db_id: item.id,
            student_id: item.student_id || item.id,
            name: removeEmoji(item.name),
            grade: cleanGrade,
            avatar: cleanGrade,
            studyGradeLevel: item.study_grade_level || (cleanGrade.includes('중등') ? '중등단어' : (cleanGrade.includes('고등') ? '고등단어' : '초등단어')),
            dailyWordCount: String(item.daily_word_count || '10'),
            daily_word_count: item.daily_word_count || 10,
            studentPin: item.pin || item.student_pin || '1234',
            parentName: removeEmoji(item.parent_name || (item.name + '학부모')),
            parentPhone: item.parent_phone || '010-4006-9050',
            parentPin: item.parent_pin || '0815'
          };
        });
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
    const userGradeRaw = currentUser.grade || currentUser.avatar || '';
    const cleanUserGrade = String(userGradeRaw).replace('[PENDING]', '').replace('[APPROVED]', '').replace('[REJECTED]', '').trim() || '초등 5학년';
    setGradeInput(cleanUserGrade);
    setStudyGradeLevelInput(currentUser.studyGradeLevel || currentUser.study_grade_level || (cleanUserGrade.includes('중등') ? '중등단어' : '초등단어'));
    setDailyCountInput(String(currentUser.dailyWordCount || currentUser.daily_word_count || '10'));
    setStudentPinInput(currentUser.studentPin || currentUser.pin || '1234');
    setParentNameInput(removeEmoji(currentUser.parentName));
    setParentPhoneInput(currentUser.parentPhone || '010-4006-9050');
    setParentPinInput(currentUser.parentPin || '0815');
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

    const wordCountInt = parseInt(dailyCountInput, 10) || 10;
    const studentCode = currentUser?.student_id || editingUserId;

    // 1. Supabase 클라우드 DB `users` 테이블에 정밀 반영 (UUID 및 student_id, name 다중 매칭)
    try {
      const userPayload = {
        name: cleanStudentName,
        avatar: gradeInput,
        study_grade_level: studyGradeLevelInput,
        daily_word_count: wordCountInt,
        pin: studentPinInput.trim() || '1234'
      };

      let existingRow = null;
      if (editingUserId && String(editingUserId).includes('-')) {
        const { data } = await supabase.from('users').select('*').eq('id', editingUserId).limit(1);
        if (data && data[0]) existingRow = data[0];
      }
      if (!existingRow && studentCode) {
        const { data } = await supabase.from('users').select('*').eq('student_id', studentCode).limit(1);
        if (data && data[0]) existingRow = data[0];
      }
      if (!existingRow && cleanStudentName) {
        const { data } = await supabase.from('users').select('*').ilike('name', `%${cleanStudentName}%`).limit(1);
        if (data && data[0]) existingRow = data[0];
      }

      if (existingRow) {
        await supabase.from('users').update(userPayload).eq('id', existingRow.id);
        console.log('☁️ DB 사용자 정보 업데이트 완수:', cleanStudentName, gradeInput, studyGradeLevelInput, wordCountInt);
      } else {
        userPayload.student_id = studentCode || `user_${Date.now()}`;
        await supabase.from('users').insert(userPayload);
        console.log('☁️ DB 사용자 신규 등록 완수:', cleanStudentName);
      }
    } catch (e) {
      console.log('Cloud update fallback to local', e);
    }

    const updatedUsers = users.map(u => {
      if (u.id === editingUserId || u.student_id === studentCode) {
        return {
          ...u,
          name: cleanStudentName,
          grade: gradeInput,
          avatar: gradeInput,
          studyGradeLevel: studyGradeLevelInput,
          study_grade_level: studyGradeLevelInput,
          dailyWordCount: String(wordCountInt),
          daily_word_count: wordCountInt,
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

    const updatedCurrent = {
      ...currentUser,
      name: cleanStudentName,
      grade: gradeInput,
      avatar: gradeInput,
      studyGradeLevel: studyGradeLevelInput,
      study_grade_level: studyGradeLevelInput,
      dailyWordCount: String(wordCountInt),
      daily_word_count: wordCountInt,
      studentPin: studentPinInput.trim() || '1234',
      parentName: removeEmoji(parentNameInput),
      parentPhone: parentPhoneInput.trim(),
      parentPin: parentPinInput.trim() || '5678'
    };

    setCurrentUser(updatedCurrent);
    sessionStorage.setItem('english_edu_logged_user', JSON.stringify(updatedCurrent));
    localStorage.setItem('english_edu_logged_user', JSON.stringify(updatedCurrent));
    localStorage.setItem('english_edu_current_user', JSON.stringify(updatedCurrent));
    window.dispatchEvent(new Event('user_profile_updated'));
    window.dispatchEvent(new Event('storage'));

    alert(currentLang === 'zh'
      ? `🎉 学生信息、年级(${gradeInput})和学习级别(${studyGradeLevelInput})已成功保存到云端数据库！`
      : (currentLang === 'fr'
      ? `🎉 Profil, classe (${gradeInput}) et niveau (${studyGradeLevelInput}) enregistrés sur la base cloud !`
      : `🎉 [${cleanStudentName}] 학생의 학년(${gradeInput}), 학습 레벨(${studyGradeLevelInput}), 목표량(${wordCountInt}단어)이 클라우드 DB에 성공적으로 저장되었습니다!`));
    setShowAddEditModal(false);
  };

  const displayName = currentUser ? removeEmoji(currentUser.name) : '';
  const currentStudyLevel = currentUser ? (currentUser.studyGradeLevel || currentUser.study_grade_level || '초등단어') : '초등단어';
  const currentDailyCount = currentUser ? (currentUser.dailyWordCount || currentUser.daily_word_count || '10') : '10';

  const userLabelText = currentLang === 'zh' ? '👤 当前学生:' : (currentLang === 'fr' ? '👤 Élève connecté:' : '👤 현재 학습자:');
  const levelLabelText = currentLang === 'zh' ? '级别:' : (currentLang === 'fr' ? 'Niveau:' : '레벨:');
  const targetLabelText = currentLang === 'zh' ? '目标' : (currentLang === 'fr' ? 'Objectif' : '목표');
  const wordsUnitText = currentLang === 'zh' ? '词' : (currentLang === 'fr' ? 'mots' : '단어');
  const editBtnText = currentLang === 'zh' ? '✏️ 修改信息' : (currentLang === 'fr' ? '✏️ Modifier mon profil' : '✏️ 내 정보 수정');
  const logoutBtnText = currentLang === 'zh' ? '🚪 退出登录 (更换)' : (currentLang === 'fr' ? '🚪 Déconnexion' : '🚪 로그아웃 (학생 변경)');

  return (
    <div className="user-manager-header-bar">
      {/* 현재 로그인된 학생 정보 & 로고 */}
      <div className="user-info-group">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <img
            src="/image/flipvoca_logo.png"
            alt="FlipVoca"
            style={{
              height: '24px',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 4px rgba(0, 166, 251, 0.15))'
            }}
          />
          <span className="user-name-title">
            👤 <strong>{displayName}</strong> <span className="user-grade-tag">({translateStudentGrade(String(currentUser?.grade || currentUser?.avatar || '초등 5학년').replace('[PENDING]', '').replace('[APPROVED]', '').trim(), currentLang)})</span>
          </span>
          <span className="user-study-info-pill">
            🎯 {translateGradeLevel(currentStudyLevel, currentLang)} • {targetLabelText} {currentDailyCount}{wordsUnitText}
          </span>
        </div>
      </div>

      {/* 버튼 액션 그룹 (수정 및 로그아웃) */}
      <div className="user-actions-group">
        <span className="user-free-badge">
          🎁 100% 무료
        </span>
        <button className="btn-user-edit" onClick={handleOpenEditModal}>
          ✏️ <span className="btn-text-hide-mobile">{editBtnText}</span><span className="btn-text-show-mobile">{currentLang === 'zh' ? '修改' : (currentLang === 'fr' ? 'Modifier' : '수정')}</span>
        </button>
        <button className="btn-user-logout" onClick={onLogout}>
          🚪 <span className="btn-text-hide-mobile">{logoutBtnText}</span><span className="btn-text-show-mobile">{currentLang === 'zh' ? '退出' : (currentLang === 'fr' ? 'Sortir' : '로그아웃')}</span>
        </button>
      </div>

      {/* 수정 팝업 모달 */}
      {showAddEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '90%', maxWidth: '440px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#2C3E50', fontSize: '18px' }}>
                ✏️ {currentLang === 'zh' ? '修改学生信息 (云端同步)' : (currentLang === 'fr' ? 'Modifier mon profil' : '학생 정보 수정 (클라우드 DB 동기화)')}
              </h3>
              <button onClick={() => setShowAddEditModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. 학생 이름 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  👤 {currentLang === 'zh' ? '学生姓名' : (currentLang === 'fr' ? 'Nom de l\'élève' : '학생 이름')}
                </label>
                <input
                  type="text"
                  placeholder={currentLang === 'zh' ? '例: 李明' : (currentLang === 'fr' ? 'Ex: Paul' : '예: 김민수')}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              {/* 📖 학습할 단어 레벨 선택 (신규) */}
              <div style={{ background: '#F8F9FA', padding: '10px 12px', borderRadius: '12px', border: '1px solid #D4E6F1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2980B9', marginBottom: '4px' }}>
                  📖 {currentLang === 'zh' ? '学习级别 (难度选择)' : (currentLang === 'fr' ? 'Niveau de vocabulaire' : '학습할 단어 레벨 (난이도 선택)')}
                </label>
                <select
                  value={studyGradeLevelInput}
                  onChange={(e) => setStudyGradeLevelInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid #3498DB', fontSize: '14px', fontWeight: 'bold', background: '#EBF5FB', color: '#2980B9' }}
                >
                  <option value="초등단어">{currentLang === 'zh' ? '🎒 小学英语 (基础自然拼读 ~ 800词)' : (currentLang === 'fr' ? '🎒 Primaire (Phonics ~ 800 mots)' : '🎒 초등 영단어 (기초 파닉스 ~ 필수 800단어)')}</option>
                  <option value="중등단어">{currentLang === 'zh' ? '🏫 初中英语 (中考必背 ~ 1,200词)' : (currentLang === 'fr' ? '🏫 Collège (1 200 mots)' : '🏫 중등 영단어 (중학 내신 ~ 필수 1,200단어)')}</option>
                  <option value="고등단어">{currentLang === 'zh' ? '🎓 高中英语 (高考冲刺 ~ 3,000词)' : (currentLang === 'fr' ? '🎓 Lycée (3 000 mots)' : '🎓 고등 영단어 (수능/모의고사 대비)')}</option>
                  <option value="전체">{currentLang === 'zh' ? '🎒🏫🎓 全部词汇综合学习' : (currentLang === 'fr' ? '🎒🏫🎓 Tous les niveaux combinés' : '🎒🏫🎓 전체 단어 통합 학습')}</option>
                </select>
              </div>

              {/* 2. 학년 & 학습 수량 (2열 배치) */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                    🏫 {currentLang === 'zh' ? '年级' : (currentLang === 'fr' ? 'Classe' : '학년')}
                  </label>
                  <select
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="초등 1학년">{translateStudentGrade('초등 1학년', currentLang)}</option>
                    <option value="초등 2학년">{translateStudentGrade('초등 2학년', currentLang)}</option>
                    <option value="초등 3학년">{translateStudentGrade('초등 3학년', currentLang)}</option>
                    <option value="초등 4학년">{translateStudentGrade('초등 4학년', currentLang)}</option>
                    <option value="초등 5학년">{translateStudentGrade('초등 5학년', currentLang)}</option>
                    <option value="초등 6학년">{translateStudentGrade('초등 6학년', currentLang)}</option>
                    <option value="중학생 1학년">{translateStudentGrade('중학생 1학년', currentLang)}</option>
                    <option value="중학생 2학년">{translateStudentGrade('중학생 2학년', currentLang)}</option>
                    <option value="중학생 3학년">{translateStudentGrade('중학생 3학년', currentLang)}</option>
                    <option value="고등학생 1학년">{translateStudentGrade('고등학생 1학년', currentLang)}</option>
                    <option value="고등학생 2학년">{translateStudentGrade('고등학생 2학년', currentLang)}</option>
                    <option value="고등학생 3학년">{translateStudentGrade('고등학생 3학년', currentLang)}</option>
                    <option value="대학생 및 성인">{translateStudentGrade('대학생 및 성인', currentLang)}</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                    🎯 {currentLang === 'zh' ? '每日目标词数' : (currentLang === 'fr' ? 'Objectif par jour' : '하루 학습 수량')}
                  </label>
                  <select
                    value={dailyCountInput}
                    onChange={(e) => setDailyCountInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  >
                    <option value="5">{currentLang === 'zh' ? '每日 5 词' : (currentLang === 'fr' ? '5 mots/jour' : '하루 5단어')}</option>
                    <option value="10">{currentLang === 'zh' ? '每日 10 词' : (currentLang === 'fr' ? '10 mots/jour' : '하루 10단어')}</option>
                    <option value="15">{currentLang === 'zh' ? '每日 15 词' : (currentLang === 'fr' ? '15 mots/jour' : '하루 15단어')}</option>
                    <option value="20">{currentLang === 'zh' ? '每日 20 词' : (currentLang === 'fr' ? '20 mots/jour' : '하루 20단어')}</option>
                    <option value="30">{currentLang === 'zh' ? '每日 30 词' : (currentLang === 'fr' ? '30 mots/jour' : '하루 30단어')}</option>
                  </select>
                </div>
              </div>

              {/* 3. 학생 비밀번호 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  🔒 {currentLang === 'zh' ? '学生 PIN 密码 (4位)' : (currentLang === 'fr' ? 'Code PIN élève (4 chiffres)' : '학생 비밀번호 (4자리 PIN)')}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="1234"
                  value={studentPinInput}
                  onChange={(e) => setStudentPinInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              {/* 4. 학부모 정보 (구분선) */}
              <div style={{ borderTop: '1px dashed #BDC3C7', paddingTop: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', color: '#8E44AD', fontWeight: 'bold' }}>
                  👨‍👩‍👧‍👦 {currentLang === 'zh' ? '家长信息' : (currentLang === 'fr' ? 'Informations parents' : '학부모 정보')}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  {currentLang === 'zh' ? '家长姓名' : (currentLang === 'fr' ? 'Nom du parent' : '학부모 이름')}
                </label>
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
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                    {currentLang === 'zh' ? '联系电话' : (currentLang === 'fr' ? 'Téléphone' : '연락처')}
                  </label>
                  <input
                    type="text"
                    placeholder="010-0000-0000"
                    value={parentPhoneInput}
                    onChange={(e) => setParentPhoneInput(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                    🔑 {currentLang === 'zh' ? '家长 PIN 密码' : (currentLang === 'fr' ? 'Code PIN parent' : '학부모 비밀번호(PIN)')}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="5678"
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
                ☁️ {currentLang === 'zh' ? '保存修改到云端' : (currentLang === 'fr' ? 'Enregistrer les modifications' : '클라우드 DB 수정 저장')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 💳 微信/支付宝 VIP 支付弹窗 */}
      <ChinaPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        currentLang={currentLang}
        user={currentUser}
        onPaymentSuccess={(data) => {
          alert(`🎉 恭喜！您已成功开通 【${data.planName}】！`);
        }}
      />
    </div>
  );
}
