'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import { t } from '../../lib/i18n.js';

// 학생/학부모 이름 이모지 자동 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function StudentLoginPage({ onLoginSuccess, onParentLoginSuccess, currentLang = 'ko', onLangChange }) {
  const [users, setUsers] = useState([]);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 학부모 로그인 모달 상태
  const [showParentModal, setShowParentModal] = useState(false);
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('');

  // 🎯 신규 학생 회원가입 신청 모달 상태
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpPin, setSignUpPin] = useState('1234');
  const [signUpGrade, setSignUpGrade] = useState('초등 3학년');
  const [signUpStudyGradeLevel, setSignUpStudyGradeLevel] = useState('초등단어');
  const [signUpDailyCount, setSignUpDailyCount] = useState('10');
  const [signUpParentName, setSignUpParentName] = useState('');
  const [signUpParentPhone, setSignUpParentPhone] = useState('');
  const [isSubmittingSignUp, setIsSubmittingSignUp] = useState(false);

  // 🎯 가입 신청 완료 알림 모달 상태
  const [signUpSuccessModal, setSignUpSuccessModal] = useState(false);
  const [signUpSuccessData, setSignUpSuccessData] = useState(null);

  // 기본 학생 세팅 배열 (고유 학생 코드 lsh_20260807_000001 체계 적용)
  const defaultStudents = [
    { id: 'lsh_20260807_000001', student_id: 'lsh_20260807_000001', name: '이상학', grade: '대학생 및 성인', studyGradeLevel: '중등단어', dailyWordCount: '20', studentPin: '0815', parentName: '이상학학부모', parentPhone: '010-0000-0000', parentPin: '5678' },
    { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 3학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0418', parentName: '이승현학부모', parentPhone: '010-1234-5678', parentPin: '5678' },
    { id: 'lsm_20260807_000003', student_id: 'lsm_20260807_000003', name: '이수민', grade: '초등 4학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0809', parentName: '이수민학부모', parentPhone: '010-9876-5432', parentPin: '5678' }
  ];

  // 수파베이스 클라우드 DB에서 학생 전체 목록 로드 (빠른 비동기 백그라운드 연동)
  useEffect(() => {
    // 1. LocalStorage 로컬 캐시 즉시 로드 (0.01초 반응)
    try {
      const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
      if (savedUsers.length > 0) {
        const formatted = savedUsers.map(u => ({ ...u, name: removeEmoji(u.name), parentName: removeEmoji(u.parentName) }));
        setUsers(formatted);
      } else {
        setUsers(defaultStudents);
      }
    } catch (e) {
      setUsers(defaultStudents);
    }

    // 2. Supabase DB 배경 백그라운드 최신 동기화
    async function loadCloudUsersAsync() {
      try {
        const { data: dbData } = await supabase.from('users').select('*').order('created_at', { ascending: true });
        if (dbData && dbData.length > 0) {
          const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
          const savedMap = new Map();
          savedUsers.forEach(u => { if (u.name) savedMap.set(u.name, u); });

          const cloudUsers = dbData.map(item => {
            const cleanN = removeEmoji(item.name);
            const cachedUser = savedMap.get(cleanN);
            return {
              id: item.student_id || item.id,
              db_id: item.id,
              student_id: item.student_id || item.id,
              name: cleanN,
              grade: item.avatar || item.grade || cachedUser?.grade || '초등 3학년',
              avatar: item.avatar || item.grade || cachedUser?.grade || '초등 3학년',
              studyGradeLevel: item.study_grade_level || cachedUser?.studyGradeLevel || '초등단어',
              study_grade_level: item.study_grade_level || cachedUser?.study_grade_level || '초등단어',
              dailyWordCount: String(item.daily_word_count || cachedUser?.dailyWordCount || 10),
              daily_word_count: item.daily_word_count || (cachedUser ? parseInt(cachedUser.dailyWordCount, 10) : 10),
              studentPin: item.pin || cachedUser?.studentPin || '1234',
              parentName: cachedUser?.parentName || (cleanN + '학부모'),
              parentPhone: cachedUser?.parentPhone || '',
              parentPin: cachedUser?.parentPin || '5678'
            };
          });

          const userMap = new Map();
          cloudUsers.forEach(u => { if (u.name) userMap.set(u.name, u); });
          defaultStudents.forEach(d => {
            if (!userMap.has(d.name)) {
              userMap.set(d.name, d);
            }
          });

          const mergedList = Array.from(userMap.values());
          setUsers(mergedList);
          localStorage.setItem('english_edu_users', JSON.stringify(mergedList));
        }
      } catch (e) {}
    }

    loadCloudUsersAsync();
  }, []);

  // 📝 학생 신규 회원가입 신청 제출
  const handleStudentSignUpSubmit = async (e) => {
    e.preventDefault();
    const cleanName = removeEmoji(signUpName).replace(/\(.*?\)/g, '').trim();
    if (!cleanName) {
      alert(currentLang === 'zh' ? '请输入学生姓名。' : currentLang === 'fr' ? "Veuillez saisir le nom de l'élève." : '학생 이름을 입력해 주세요.');
      return;
    }

    if (!signUpPin || signUpPin.length < 4) {
      alert(currentLang === 'zh' ? '请输入4位数字PIN码。' : currentLang === 'fr' ? 'Veuillez saisir un code PIN à 4 chiffres.' : '간편 비밀번호(PIN) 4자리를 입력해 주세요.');
      return;
    }

    // 중복 이름 체크
    const alreadyExists = users.some(u => {
      const dbNameClean = removeEmoji(u.name || '').replace(/\(.*?\)/g, '').trim();
      return dbNameClean.toLowerCase() === cleanName.toLowerCase();
    });

    if (alreadyExists) {
      alert(currentLang === 'zh'
        ? `名为 '${cleanName}' 的学生已存在或已提交申请。`
        : currentLang === 'fr'
        ? `Un élève nommé '${cleanName}' existe déjà ou a déjà postulé.`
        : `'${cleanName}' 이름으로 이미 등록되어 있거나 가입 신청된 학생이 있습니다.\n다른 이름을 사용하시거나 관리자(선생님)에게 문의해 주세요.`);
      return;
    }

    setIsSubmittingSignUp(true);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const newStudentCode = `stu_${dateStr}_${randDigits}`;
    const wordCountInt = parseInt(signUpDailyCount, 10) || 10;
    const pendingAvatar = `[PENDING] ${signUpGrade}`;

    const newStudentObj = {
      id: newStudentCode,
      db_id: newStudentCode,
      student_id: newStudentCode,
      name: cleanName,
      grade: pendingAvatar,
      avatar: pendingAvatar,
      studyGradeLevel: signUpStudyGradeLevel,
      study_grade_level: signUpStudyGradeLevel,
      dailyWordCount: String(wordCountInt),
      daily_word_count: wordCountInt,
      studentPin: signUpPin,
      parentName: signUpParentName ? removeEmoji(signUpParentName) : (cleanName + ' 학부모'),
      parentPhone: signUpParentPhone || '',
      parentPin: '5678'
    };

    try {
      // Supabase users 테이블에 저장
      await supabase.from('users').insert([{
        name: cleanName,
        pin: signUpPin,
        student_id: newStudentCode,
        avatar: pendingAvatar,
        study_grade_level: signUpStudyGradeLevel,
        daily_word_count: wordCountInt
      }]);
    } catch (err) {
      console.log('Supabase signup insert notice:', err);
    }

    // 로컬 상태 및 localStorage 즉시 반영
    const updatedUsers = [...users, newStudentObj];
    setUsers(updatedUsers);
    try {
      localStorage.setItem('english_edu_users', JSON.stringify(updatedUsers));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('study_data_updated'));
      }
    } catch (e) {}

    setIsSubmittingSignUp(false);
    setShowSignUpModal(false);
    setSignUpSuccessData({
      name: cleanName,
      student_id: newStudentCode,
      grade: signUpGrade,
      studyGradeLevel: signUpStudyGradeLevel,
      dailyWordCount: wordCountInt
    });
    setSignUpSuccessModal(true);

    // 폼 초기화
    setSignUpName('');
    setSignUpPin('1234');
    setSignUpParentName('');
    setSignUpParentPhone('');
  };

  // 학생 로그인 제출
  const handleStudentLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedName = removeEmoji(studentNameInput).replace(/\(.*?\)/g, '').trim();
    if (!trimmedName) {
      alert(currentLang === 'zh' ? '请输入学生姓名。' : currentLang === 'fr' ? "Veuillez saisir le nom de l'élève." : '학생 이름을 입력해 주세요.');
      return;
    }

    const student = users.find(u => {
      const dbNameClean = removeEmoji(u.name || '').replace(/\(.*?\)/g, '').trim();
      return dbNameClean === trimmedName || dbNameClean.includes(trimmedName) || trimmedName.includes(dbNameClean);
    });

    if (!student) {
      alert(currentLang === 'zh'
        ? `未找到名为 '${trimmedName}' 的学生，请重新确认姓名。`
        : currentLang === 'fr'
        ? `Aucun élève trouvé avec le nom '${trimmedName}'. Veuillez vérifier.`
        : `'${trimmedName}' 이름으로 등록된 학생을 찾을 수 없습니다.\n이름을 다시 확인하시거나 아래 [학생 회원가입] 버튼으로 신청해 주세요.`);
      return;
    }

    // 🎯 관리자 승인 상태 검사 ([PENDING], [REJECTED])
    const avatarStr = student.avatar || student.grade || '';
    const isPending = avatarStr.startsWith('[PENDING]');
    const isRejected = avatarStr.startsWith('[REJECTED]');

    if (isPending) {
      alert(currentLang === 'zh'
        ? '⏳ [等待审核] 管理员(老师)正在审核您的注册申请。\n审核通过后即可登录学习！'
        : currentLang === 'fr'
        ? "⏳ [En attente d'approbation] Votre inscription est en attente de validation par le professeur.\nVous pourrez vous connecter dès qu'elle sera approuvée !"
        : '⏳ [가입 승인 대기 중]\n관리자(선생님)의 가입 승인을 기다리고 있습니다.\n승인이 완료되면 바로 로그인하여 학습하실 수 있습니다!');
      return;
    }

    if (isRejected) {
      alert(currentLang === 'zh'
        ? '🚫 [申请未通过] 您的注册申请已被拒绝，请联系管理员老师。'
        : currentLang === 'fr'
        ? '🚫 [Demande refusée] Votre inscription a été refusée. Veuillez contacter votre professeur.'
        : '🚫 [가입 반려]\n가입 신청이 반려(미승인) 처리되었습니다.\n학원 또는 관리자 선생님께 문의해 주세요.');
      return;
    }

    const correctPin = student.studentPin || '1234';
    if (pinInput.trim() === correctPin) {
      onLoginSuccess(student);
    } else {
      alert(currentLang === 'zh'
        ? '🔒 学生 PIN 密码不正确，请重新确认。(默认: 1234)'
        : currentLang === 'fr'
        ? '🔒 Code PIN incorrect. Veuillez vérifier. (Par défaut: 1234)'
        : '🔒 학생 비밀번호(PIN)가 올바르지 않습니다. 다시 확인해 주세요. (기본 PIN: 1234)');
    }
  };

  // 학부모 이름으로 로그인 제출 (모든 자녀 매칭)
  const handleParentLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedParentName = removeEmoji(parentNameInput);
    if (!trimmedParentName) {
      alert(currentLang === 'zh' ? '请输入家长姓名。' : currentLang === 'fr' ? 'Veuillez saisir le nom du parent.' : '학부모님 이름을 입력해 주세요.');
      return;
    }

    const matchedChildren = users.filter(u => removeEmoji(u.parentName) === trimmedParentName || removeEmoji(u.name).includes(trimmedParentName));
    if (matchedChildren.length === 0) {
      alert(currentLang === 'zh'
        ? `未找到与 '${trimmedParentName}' 家长关联的子女信息，请重新确认。`
        : currentLang === 'fr'
        ? `Aucun enfant associé au nom de parent '${trimmedParentName}'.`
        : `'${trimmedParentName}' 학부모님 이름으로 등록된 자녀(학생) 정보를 찾을 수 없습니다.\n성함을 다시 확인해 주세요.`);
      return;
    }

    const correctParentPin = matchedChildren[0].parentPin || '5678';
    if (parentPinInput.trim() === correctParentPin) {
      setShowParentModal(false);
      if (onParentLoginSuccess) {
        onParentLoginSuccess(trimmedParentName, matchedChildren);
      }
    } else {
      alert(currentLang === 'zh'
        ? '🔑 家长 PIN 密码不正确，请重新确认。(默认: 5678)'
        : currentLang === 'fr'
        ? '🔑 Code PIN parent incorrect. Veuillez vérifier. (Par défaut: 5678)'
        : '🔑 학부모 비밀번호(PIN)가 올바르지 않습니다. 다시 확인해 주세요. (기본 PIN: 5678)');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #EBF5FB 0%, #E8F8F5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 9999
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '36px 28px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: '2px solid #E9ECEF',
        maxHeight: '92vh',
        overflowY: 'auto',
        margin: 'auto'
      }}>
        {/* 🌐 글로벌 6개 국어 언어 스위처 바 */}
        {onLangChange && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '16px',
            background: '#F8FAFC',
            padding: '6px 8px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748B' }}>🌐</span>
            <button
              type="button"
              onClick={() => onLangChange('ko')}
              style={{
                padding: '4px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: currentLang === 'ko' ? '2px solid #3182CE' : '1px solid #CBD5E0',
                background: currentLang === 'ko' ? '#EBF8FF' : '#FFFFFF',
                color: currentLang === 'ko' ? '#2B6CB0' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🇰🇷 한국어
            </button>
            <button
              type="button"
              onClick={() => onLangChange('zh')}
              style={{
                padding: '4px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: currentLang === 'zh' ? '2px solid #E53E3E' : '1px solid #CBD5E0',
                background: currentLang === 'zh' ? '#FFF5F5' : '#FFFFFF',
                color: currentLang === 'zh' ? '#C53030' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🇨🇳 中文
            </button>
            <button
              type="button"
              onClick={() => onLangChange('fr')}
              style={{
                padding: '4px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: currentLang === 'fr' ? '2px solid #3182CE' : '1px solid #CBD5E0',
                background: currentLang === 'fr' ? '#EBF8FF' : '#FFFFFF',
                color: currentLang === 'fr' ? '#2B6CB0' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🇫🇷 Français
            </button>
            <button
              type="button"
              onClick={() => onLangChange('ja')}
              style={{
                padding: '4px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: currentLang === 'ja' ? '2px solid #E53E3E' : '1px solid #CBD5E0',
                background: currentLang === 'ja' ? '#FFF5F5' : '#FFFFFF',
                color: currentLang === 'ja' ? '#C53030' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🇯🇵 日本語
            </button>
            <button
              type="button"
              onClick={() => onLangChange('vi')}
              style={{
                padding: '4px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: currentLang === 'vi' ? '2px solid #D69E2E' : '1px solid #CBD5E0',
                background: currentLang === 'vi' ? '#FEFCBF' : '#FFFFFF',
                color: currentLang === 'vi' ? '#B7791F' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => onLangChange('hi')}
              style={{
                padding: '4px 6px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 'bold',
                border: currentLang === 'hi' ? '2px solid #DD6B20' : '1px solid #CBD5E0',
                background: currentLang === 'hi' ? '#FEEBC8' : '#FFFFFF',
                color: currentLang === 'hi' ? '#C05621' : '#64748B',
                cursor: 'pointer'
              }}
            >
              🇮🇳 हिन्दी
            </button>
          </div>
        )}

        <div style={{ fontSize: '44px', marginBottom: '6px' }}>🎓</div>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', color: '#2C3E50', fontWeight: '900' }}>
          {t('login_title', currentLang)}
        </h1>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#7F8C8D', fontWeight: 'bold' }}>
          {t('login_subtitle', currentLang)}
        </p>

        {isLoading ? (
          <div style={{ padding: '30px', color: '#3498DB', fontWeight: 'bold', fontSize: '15px' }}>
            ☁️ 클라우드 DB 연동 중...
          </div>
        ) : (
          <form onSubmit={handleStudentLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                👤 {t('input_student_name_ph', currentLang)}
              </label>
              <input
                type="text"
                placeholder={t('input_student_name_ph', currentLang)}
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '2px solid #3498DB',
                  background: '#F4F6F7',
                  color: '#2C3E50',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                🔒 {t('input_pin_ph', currentLang)}
              </label>
              <input
                type="password"
                maxLength={4}
                placeholder={t('input_pin_ph', currentLang)}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '2px solid #9B59B6',
                  fontSize: '18px',
                  textAlign: 'left',
                  fontWeight: 'bold',
                  outline: 'none',
                  letterSpacing: '4px'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(52,152,219,0.3)',
                marginTop: '6px'
              }}
            >
              {t('btn_student_login', currentLang)} ➔
            </button>
          </form>
        )}

        {/* 🎯 하단 회원가입 및 학부모 로그인 버튼 영역 */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #BDC3C7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowSignUpModal(true)}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)',
              border: 'none',
              color: 'white',
              padding: '12px 18px',
              borderRadius: '14px',
              fontWeight: 'bold',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(39,174,96,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            ✨ {currentLang === 'zh' ? '新学生注册申请 ➔' : currentLang === 'fr' ? "Inscription nouvel élève ➔" : '학생 신규 회원가입 신청 ➔'}
          </button>

          <button
            type="button"
            onClick={() => setShowParentModal(true)}
            style={{
              width: '100%',
              background: '#F5EEF8',
              border: '1px solid #9B59B6',
              color: '#8E44AD',
              padding: '10px 18px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {t('btn_parent_login', currentLang)} ➔
          </button>
        </div>
      </div>

      {/* 📝 학생 신규 회원가입 신청 모달 */}
      {showSignUpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 12px 36px rgba(0,0,0,0.25)', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#27AE60', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✨ {currentLang === 'zh' ? '学生新会员注册申请' : currentLang === 'fr' ? "Demande d'inscription élève" : '학생 신규 회원가입 신청'}
              </h3>
              <button onClick={() => setShowSignUpModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#7F8C8D', lineHeight: '1.4' }}>
              {currentLang === 'zh'
                ? '💡 注册申请提交后，经管理员(老师)审核通过即可登录。'
                : currentLang === 'fr'
                ? "💡 Après validation par l'administrateur, vous pourrez vous connecter."
                : '💡 가입 신청 후 관리자(선생님)의 승인이 완료되면 바로 로그인하여 학습하실 수 있습니다.'}
            </p>

            <form onSubmit={handleStudentSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* 1. 학생 이름 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  👤 {currentLang === 'zh' ? '学生姓名 *' : currentLang === 'fr' ? "Nom de l'élève *" : '학생 이름 *'}
                </label>
                <input
                  type="text"
                  placeholder={currentLang === 'zh' ? '例如: 张伟' : currentLang === 'fr' ? 'Ex: Lucas' : '예: 홍길동'}
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #27AE60', fontSize: '14px', fontWeight: 'bold' }}
                />
              </div>

              {/* 2. 간편 비밀번호 PIN (4자리) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  🔒 {currentLang === 'zh' ? '4位简易密码 (PIN) *' : currentLang === 'fr' ? 'Code PIN à 4 chiffres *' : '간편 비밀번호 (PIN 4자리) *'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="1234"
                  value={signUpPin}
                  onChange={(e) => setSignUpPin(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #9B59B6', fontSize: '16px', fontWeight: 'bold', letterSpacing: '4px' }}
                />
              </div>

              {/* 3. 학년 선택 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  🎒 {currentLang === 'zh' ? '年级 *' : currentLang === 'fr' ? 'Niveau scolaire *' : '학년 선택 *'}
                </label>
                <select
                  value={signUpGrade}
                  onChange={(e) => setSignUpGrade(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold', color: '#2C3E50' }}
                >
                  <option value="초등 1학년">초등 1학년</option>
                  <option value="초등 2학년">초등 2학년</option>
                  <option value="초등 3학년">초등 3학년 (기본)</option>
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

              {/* 4. 학습 단어 레벨 */}
              <div style={{ background: '#EBF5FB', padding: '10px', borderRadius: '10px', border: '1px solid #AED6F1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#2980B9', marginBottom: '4px' }}>
                  🎯 {currentLang === 'zh' ? '学习单词级别 *' : currentLang === 'fr' ? 'Niveau de vocabulaire *' : '학습 단어 레벨 *'}
                </label>
                <select
                  value={signUpStudyGradeLevel}
                  onChange={(e) => setSignUpStudyGradeLevel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #3498DB', fontSize: '13px', fontWeight: 'bold' }}
                >
                  <option value="초등단어">🎒 초등 필수단어 (800단어)</option>
                  <option value="중등단어">🏫 중등 필수단어 (1,200단어)</option>
                  <option value="고등단어">🎓 고등/수능 필수단어 (3,000단어)</option>
                  <option value="전체">🌟 전체 통합단어 (5,000단어)</option>
                </select>
              </div>

              {/* 5. 하루 목표 학습량 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  📊 {currentLang === 'zh' ? '每日目标单词数 *' : currentLang === 'fr' ? 'Mots par jour *' : '하루 목표 학습량 *'}
                </label>
                <select
                  value={signUpDailyCount}
                  onChange={(e) => setSignUpDailyCount(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px', fontWeight: 'bold' }}
                >
                  <option value="10">하루 10개 단어 (추천)</option>
                  <option value="20">하루 20개 단어</option>
                  <option value="30">하루 30개 단어</option>
                  <option value="50">하루 50개 단어 (열공)</option>
                </select>
              </div>

              {/* 6. 학부모 연락처 (선택) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  📞 {currentLang === 'zh' ? '家长联系方式 (选填)' : currentLang === 'fr' ? 'Tél. parent (optionnel)' : '학부모 연락처 (선택)'}
                </label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
                  value={signUpParentPhone}
                  onChange={(e) => setSignUpParentPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingSignUp}
                style={{
                  width: '100%',
                  background: isSubmittingSignUp ? '#BDC3C7' : 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '15px',
                  cursor: isSubmittingSignUp ? 'not-allowed' : 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(39,174,96,0.3)'
                }}
              >
                {isSubmittingSignUp
                  ? '⏳ 신청 중...'
                  : (currentLang === 'zh' ? '🚀 提交注册申请 ➔' : currentLang === 'fr' ? "🚀 Soumettre l'inscription ➔" : '🚀 회원가입 신청 완료하기 ➔')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🎉 가입 신청 완료 안내 모달 */}
      {signUpSuccessModal && signUpSuccessData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#27AE60', fontWeight: '900' }}>
              {currentLang === 'zh' ? '注册申请提交成功！' : currentLang === 'fr' ? 'Demande envoyée avec succès !' : '회원가입 신청 접수 완료!'}
            </h3>
            <div style={{ background: '#FEF9E7', padding: '14px', borderRadius: '14px', border: '1px solid #FDEBD0', marginBottom: '16px', textAlign: 'left', fontSize: '13px', lineHeight: '1.6' }}>
              <div>👤 <strong>학생 이름:</strong> {signUpSuccessData.name}</div>
              <div>🎒 <strong>학년/레벨:</strong> {signUpSuccessData.grade} ({signUpSuccessData.studyGradeLevel})</div>
              <div>📊 <strong>하루 목표량:</strong> {signUpSuccessData.dailyWordCount}개</div>
              <div style={{ color: '#D35400', fontWeight: 'bold', marginTop: '6px' }}>
                ⏳ <strong>현재 상태:</strong> 관리자 승인 대기 중
              </div>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#7F8C8D', lineHeight: '1.5' }}>
              {currentLang === 'zh'
                ? '管理员(老师)审核批准后，即可使用姓名和 PIN 码登录学习。'
                : currentLang === 'fr'
                ? 'Dès validation par votre professeur, vous pourrez vous connecter et commencer à apprendre.'
                : '선생님(관리자)의 승인이 완료되면 즉시 이름과 PIN 번호로 로그인하여 학습을 시작할 수 있습니다.'}
            </p>
            <button
              onClick={() => setSignUpSuccessModal(false)}
              style={{
                width: '100%',
                background: '#27AE60',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              확인 ➔
            </button>
          </div>
        </div>
      )}

      {/* 👨‍👩‍👧‍👦 학부모 로그인 모달 */}
      {showParentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', width: '90%', maxWidth: '380px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px dashed #E9ECEF' }}>
              <h3 style={{ margin: 0, color: '#8E44AD', fontSize: '18px' }}>
                {t('parent_modal_title', currentLang)}
              </h3>
              <button onClick={() => setShowParentModal(false)} style={{ background: '#F8F9FA', border: '1px solid #BDC3C7', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleParentLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  {t('input_parent_name_ph', currentLang)}
                </label>
                <input
                  type="text"
                  placeholder={t('input_parent_name_ph', currentLang)}
                  value={parentNameInput}
                  onChange={(e) => setParentNameInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '15px', fontWeight: 'bold' }}
                  autoFocus
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#34495E', marginBottom: '4px' }}>
                  {t('input_parent_pin_ph', currentLang)}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder={t('input_parent_pin_ph', currentLang)}
                  value={parentPinInput}
                  onChange={(e) => setParentPinInput(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #8E44AD', fontSize: '18px', textAlign: 'left', fontWeight: 'bold', letterSpacing: '4px' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#8E44AD', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '6px' }}
              >
                {t('btn_parent_submit', currentLang)} ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
