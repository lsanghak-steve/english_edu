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

  // 🇨🇳 중국/글로벌 현지화: 로그인 모드 및 위챗/휴대폰 인증 상태
  const [loginMode, setLoginMode] = useState('account'); // 'account' | 'phone'
  const [phoneCountryCode, setPhoneCountryCode] = useState(currentLang === 'zh' ? '+86' : '+82');
  const [phoneInput, setPhoneInput] = useState('');
  const [smsCodeInput, setSmsCodeInput] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [showWeChatModal, setShowWeChatModal] = useState(false);

  // 기본 학생 세팅 배열 (고유 학생 코드 lsh_20260807_000001 체계 적용)
  const defaultStudents = [
    { id: 'lsh_20260807_000001', student_id: 'lsh_20260807_000001', name: '이상학', grade: '대학생 및 성인', avatar: '대학생 및 성인', studyGradeLevel: '중등단어', dailyWordCount: '20', studentPin: '0815', parentName: '이상학학부모', parentPhone: '010-4006-9050', parentPin: '0815' },
    { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 5학년', avatar: '초등 5학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0418', parentName: '이승현학부모', parentPhone: '010-4006-9050', parentPin: '0815' },
    { id: 'lsm_20260807_000003', student_id: 'lsm_20260807_000003', name: '이수민', grade: '초등 3학년', avatar: '초등 3학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0809', parentName: '이수민학부모', parentPhone: '010-4006-9050', parentPin: '0815' }
  ];

  // 수파베이스 클라우드 DB에서 학생 전체 목록 로드 (빠른 비동기 백그라운드 연동)
  useEffect(() => {
    // 1. LocalStorage 로컬 캐시 즉시 로드
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
            
            // 🎯 DB avatar 컬럼에 저장된 정확한 학년 정보 추출 ([PENDING], [APPROVED] 등 접두사 제거)
            const rawAvatar = String(item.avatar || item.grade || cachedUser?.grade || '').trim();
            const cleanGrade = rawAvatar.replace('[PENDING]', '').replace('[APPROVED]', '').replace('[REJECTED]', '').trim() || cachedUser?.grade || '초등 5학년';

            return {
              id: item.student_id || item.id,
              db_id: item.id,
              student_id: item.student_id || item.id,
              name: cleanN,
              grade: cleanGrade,
              avatar: cleanGrade,
              studyGradeLevel: item.study_grade_level || cachedUser?.studyGradeLevel || '초등단어',
              study_grade_level: item.study_grade_level || cachedUser?.study_grade_level || '초등단어',
              dailyWordCount: String(item.daily_word_count || cachedUser?.dailyWordCount || 10),
              daily_word_count: item.daily_word_count || (cachedUser ? parseInt(cachedUser.dailyWordCount, 10) : 10),
              studentPin: item.pin || cachedUser?.studentPin || '1234',
              parentName: cachedUser?.parentName || (cleanN + '학부모'),
              parentPhone: cachedUser?.parentPhone || '010-4006-9050',
              parentPin: cachedUser?.parentPin || '0815'
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

  // 📱 휴대폰 SMS 인증번호 발송 시뮬레이션
  const handleSendSms = () => {
    if (!phoneInput.trim() || phoneInput.trim().length < 6) {
      alert(currentLang === 'zh' ? '请输入有效的手机号码。' : '올바른 휴대폰 번호를 입력해주세요.');
      return;
    }
    const sampleCode = '6829';
    setSmsCodeInput(sampleCode);
    setSmsCountdown(60);
    alert(currentLang === 'zh'
      ? `📲 [短信验证码已发送] 验证码为: 【${sampleCode}】\n(已自动填入验证码框)`
      : `📲 [인증번호 발송 완료] 인증번호: 【${sampleCode}】\n(인증번호가 자동으로 입력되었습니다)`);

    const timer = setInterval(() => {
      setSmsCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 📱 휴대폰 번호 간편 로그인 제출
  const handlePhoneLoginSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone) {
      alert(currentLang === 'zh' ? '请输入手机号码。' : '휴대폰 번호를 입력해주세요.');
      return;
    }
    if (!smsCodeInput.trim()) {
      alert(currentLang === 'zh' ? '请输入短信验证码。' : '인증번호를 입력해주세요.');
      return;
    }

    // 등록된 학생 전화번호 매칭
    const student = users.find(u => u.parentPhone && u.parentPhone.includes(cleanPhone));
    if (student) {
      onLoginSuccess(student);
    } else {
      // 폰번호 기반 신규 즉시 체험 계정
      const newPhoneUser = {
        id: `phone_${cleanPhone}`,
        student_id: `phone_${cleanPhone}`,
        name: currentLang === 'zh' ? `学员_${cleanPhone.slice(-4)}` : `학생_${cleanPhone.slice(-4)}`,
        grade: '초등 3학년',
        studyGradeLevel: '초등단어',
        dailyWordCount: '10',
        studentPin: '1234',
        parentName: '학부모',
        parentPhone: `${phoneCountryCode}-${cleanPhone}`,
        parentPin: '5678'
      };
      onLoginSuccess(newPhoneUser);
    }
  };

  // 💬 위챗(WeChat) 간편 원클릭 / QR 로그인
  const handleWeChatLogin = () => {
    let wechatUser = users.find(u => (u.name && u.name.includes('微信')) || u.id === 'wechat_demo_student');
    if (!wechatUser) {
      wechatUser = {
        id: 'wechat_demo_student',
        student_id: 'wechat_demo_student',
        name: currentLang === 'zh' ? '微信学员 (WeChat)' : '위챗 학습자',
        grade: '초등 3학년',
        studyGradeLevel: '초등단어',
        dailyWordCount: '10',
        studentPin: '1234',
        parentName: '微信家长',
        parentPhone: '+86-13800000000',
        parentPin: '5678'
      };
    }
    setShowWeChatModal(false);
    onLoginSuccess(wechatUser);
  };

  // 학부모 이름으로 로그인 제출 (모든 자녀 매칭)
  const handleParentLoginSubmit = (e) => {
    e.preventDefault();
    const trimmedParentName = removeEmoji(parentNameInput);
    if (!trimmedParentName) {
      alert(currentLang === 'zh' ? '请输入家长姓名。' : currentLang === 'fr' ? 'Veuillez saisir le nom du parent.' : '학부모님 이름을 입력해 주세요.');
      return;
    }

    const FAMILY_CHILDREN_RELATIONS = {
      '이상학': ['이상학', '이승현', '이수민', '박재현', '김민채'],
      '이승현': ['이상학', '이승현', '이수민', '박재현', '김민채'],
      '이수민': ['이상학', '이승현', '이수민', '박재현', '김민채'],
      '박재현': ['이상학', '이승현', '이수민', '박재현', '김민채'],
      '김민채': ['이상학', '이승현', '이수민', '박재현', '김민채'],
      '조수혁': ['조수혁', '조수아'],
      '조수아': ['조수혁', '조수아'],
      '조수혁학부모': ['조수혁', '조수아'],
      '조수아학부모': ['조수혁', '조수아']
    };

    const allowedFamily = FAMILY_CHILDREN_RELATIONS[trimmedParentName] || [];

    const matchedChildren = users.filter(u => {
      const uName = removeEmoji(u.name);
      const uParent = removeEmoji(u.parentName);
      if (allowedFamily.length > 0) {
        return allowedFamily.includes(uName);
      }
      return uParent === trimmedParentName || uParent.includes(trimmedParentName) || uName === trimmedParentName;
    });

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
        <div style={{
          background: '#F8FAFC',
          padding: '10px 12px',
          borderRadius: '20px',
          border: '1.5px solid #E2E8F0',
          marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            padding: '0 2px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '14px' }}>🌐</span> Language / 언어 선택
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>
              6 Global Languages
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px'
          }}>
            {[
              { code: 'ko', flag: '🇰🇷', label: '한국어' },
              { code: 'zh', flag: '🇨🇳', label: '中文' },
              { code: 'fr', flag: '🇫🇷', label: 'Français' },
              { code: 'ja', flag: '🇯🇵', label: '日本語' },
              { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
              { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' }
            ].map(item => {
              const isSelected = (currentLang || 'ko') === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    if (onLangChange) onLangChange(item.code);
                    try {
                      localStorage.setItem('steve_voca_lang', item.code);
                      localStorage.setItem('flipvoca_lang', item.code);
                    } catch (e) {}
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '8px 4px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? '900' : '700',
                    border: isSelected ? '1.5px solid #FF6B6B' : '1.5px solid #E2E8F0',
                    background: isSelected ? 'linear-gradient(135deg, #FFF5F5 0%, #FFE8E8 100%)' : '#FFFFFF',
                    color: isSelected ? '#E53E3E' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 3px 10px rgba(255, 107, 107, 0.22)' : '0 1px 3px rgba(0,0,0,0.02)',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.flag}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🎴 FlipVoca 3D 프리미엄 글래스 로고 & 브랜딩 헤더 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '10px'
        }}>
          {/* 3D 로고 아이콘 */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 45%, #7C3AED 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 24px rgba(255, 107, 107, 0.35)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 은은한 광택 오버레이 */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '45%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '20px 20px 0 0'
            }} />
            
            {/* 3D 플립 카드 & 반짝이는 골든 스타 벡터 */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="7" y="3" width="13" height="16" rx="3" fill="rgba(255, 255, 255, 0.4)" transform="rotate(10 7 3)" />
              <rect x="3" y="4" width="14" height="17" rx="3.5" fill="#FFFFFF" />
              <path d="M6.5 8.5H13.5M6.5 12H11.5M6.5 15.5H13.5" stroke="#FF6B6B" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18.5 4.5L19.2 6.2L21 6.5L19.5 7.8L20 9.5L18.5 8.5L17 9.5L17.5 7.8L16 6.5L17.8 6.2L18.5 4.5Z" fill="#FDE047" stroke="#EAB308" strokeWidth="0.5" />
            </svg>
          </div>

          {/* 브랜드 명칭 */}
          <h1 style={{
            margin: 0,
            fontSize: '25px',
            fontWeight: '900',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '1px'
          }}>
            <span style={{ color: '#0F172A' }}>Flip</span>
            <span style={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #EA580C 50%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Voca</span>
          </h1>

          {/* 슬로건 서브타이틀 */}
          <p style={{
            margin: 0,
            fontSize: '12.5px',
            color: '#64748B',
            fontWeight: '700',
            letterSpacing: '-0.2px'
          }}>
            {currentLang === 'zh'
              ? '中小学 5,000 核心英语词汇智能学习馆'
              : currentLang === 'fr'
              ? 'Plateforme Intelligente de 5 000 Mots Anglais'
              : currentLang === 'ja'
              ? '小・中・高 5,000英単語スマート学習館'
              : currentLang === 'vi'
              ? 'Học 5.000 từ vựng tiếng Anh thông minh'
              : currentLang === 'hi'
              ? '5,000 अंग्रेजी शब्दावली स्मार्ट लर्निंग हब'
              : '초·중·고 5,000 영단어 스마트 맞춤 학습관'}
          </p>
        </div>

        {/* 🇨🇳 로그인 모드 선택 탭 (이름+PIN vs 📱 휴대폰 번호) */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: '#F1F5F9', padding: '4px', borderRadius: '14px' }}>
          <button
            type="button"
            onClick={() => setLoginMode('account')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '900',
              border: 'none',
              background: loginMode === 'account' ? '#FFFFFF' : 'transparent',
              color: loginMode === 'account' ? '#2C3E50' : '#64748B',
              boxShadow: loginMode === 'account' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            👤 {currentLang === 'zh' ? '账号密码' : '학생 이름/PIN'}
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('phone')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '900',
              border: 'none',
              background: loginMode === 'phone' ? '#FFFFFF' : 'transparent',
              color: loginMode === 'phone' ? '#2C3E50' : '#64748B',
              boxShadow: loginMode === 'phone' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            📱 {currentLang === 'zh' ? '手机快捷登录' : '휴대폰 번호'}
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '30px', color: '#3498DB', fontWeight: 'bold', fontSize: '15px' }}>
            ☁️ 클라우드 DB 연동 중...
          </div>
        ) : loginMode === 'account' ? (
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
        ) : (
          /* 📱 手机号 + 短信验证码 登录 表单 */
          <form onSubmit={handlePhoneLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                📱 {currentLang === 'zh' ? '手机号码' : '휴대폰 번호'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  style={{
                    padding: '12px 10px',
                    borderRadius: '12px',
                    border: '2px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontWeight: '900',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="+86">🇨🇳 +86 (中国)</option>
                  <option value="+82">🇰🇷 +82 (한국)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+84">🇻🇳 +84 (VN)</option>
                </select>
                <input
                  type="tel"
                  placeholder={currentLang === 'zh' ? '请输入11位手机号' : '휴대폰 번호 입력'}
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '2px solid #3498DB',
                    background: '#F4F6F7',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    outline: 'none'
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#34495E', marginBottom: '6px' }}>
                📩 {currentLang === 'zh' ? '短信验证码' : 'SMS 인증번호'}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  maxLength={6}
                  placeholder={currentLang === 'zh' ? '6位验证码' : '인증번호'}
                  value={smsCodeInput}
                  onChange={(e) => setSmsCodeInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '2px solid #9B59B6',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    outline: 'none',
                    letterSpacing: '2px'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendSms}
                  disabled={smsCountdown > 0}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: smsCountdown > 0 ? '#CBD5E1' : '#3B82F6',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '13px',
                    cursor: smsCountdown > 0 ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {smsCountdown > 0 ? `${smsCountdown}s` : (currentLang === 'zh' ? '获取验证码' : '인증번호 받기')}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(37,99,235,0.3)',
                marginTop: '4px'
              }}
            >
              {currentLang === 'zh' ? '📱 手机快捷登录 ➔' : '📱 휴대폰 로그인 ➔'}
            </button>
          </form>
        )}

        {/* 🎯 하단 회원가입 및 학부모 로그인 버튼 영역 */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px dashed #BDC3C7', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

      {/* 💬 微信扫码一键登录 模拟弹窗 */}
      {showWeChatModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px 24px', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>💬</span>
                <h3 style={{ margin: 0, color: '#07C160', fontSize: '18px', fontWeight: '900' }}>
                  {currentLang === 'zh' ? '微信扫码登录' : '위챗(WeChat) 로그인'}
                </h3>
              </div>
              <button
                onClick={() => setShowWeChatModal(false)}
                style={{ background: '#F1F5F9', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✖
              </button>
            </div>

            {/* 微信二维码 UI */}
            <div style={{ background: '#F8FAFC', border: '2px solid #E2E8F0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '160px', height: '160px', background: '#FFFFFF', border: '3px solid #07C160', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="140" height="140" fill="white"/>
                  {/* QR Pattern Simulation */}
                  <rect x="10" y="10" width="40" height="40" fill="#2C3E50"/>
                  <rect x="18" y="18" width="24" height="24" fill="white"/>
                  <rect x="24" y="24" width="12" height="12" fill="#07C160"/>
                  
                  <rect x="90" y="10" width="40" height="40" fill="#2C3E50"/>
                  <rect x="98" y="18" width="24" height="24" fill="white"/>
                  <rect x="104" y="24" width="12" height="12" fill="#07C160"/>

                  <rect x="10" y="90" width="40" height="40" fill="#2C3E50"/>
                  <rect x="18" y="98" width="24" height="24" fill="white"/>
                  <rect x="24" y="104" width="12" height="12" fill="#07C160"/>

                  <circle cx="70" cy="70" r="14" fill="#07C160"/>
                  <text x="70" y="75" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">SV</text>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontWeight: 'bold' }}>
                {currentLang === 'zh' ? '请使用微信扫一扫上方二维码' : '위챗 앱으로 QR코드를 스캔하세요'}
              </p>
            </div>

            {/* 一键快捷登录 (模拟快速授权) */}
            <button
              type="button"
              onClick={handleWeChatLogin}
              style={{
                marginTop: '18px',
                width: '100%',
                background: '#07C160',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(7,193,96,0.35)'
              }}
            >
              ⚡ {currentLang === 'zh' ? '微信一键授权直接进入 ➔' : '위챗 원클릭 체험 로그인 ➔'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
