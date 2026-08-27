'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient.js';
import { t } from '../../lib/i18n.js';

// 학생/학부모 이름 이모지 제거 헬퍼
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

// 🌐 모던 로그인 페이지 6대 언어별 UI 사전
const loginI18n = {
  ko: {
    headerTagline: '초·중·고 5,000 영단어 스마트 맞춤 학습',
    appSubtitle: 'FlipVoca 3.0 스마트 학습관',
    backBtn: '학습 홈 ➔',
    studentTab: '👦 학생 로그인',
    parentTab: '👨‍👩‍👧 학부모 모드',
    brandTitle: 'FlipVoca',
    programDescription: '초·중·고 5,000 영단어 스마트 학습관 • 3D 플래시카드 & 4단계 퀴즈',
    studentIdLabel: '👤 학생 아이디 / 이름',
    studentIdPh: '아이디 또는 이름 입력 (예: 이상학)',
    pinLabel: '🔒 비밀번호 (4자리 PIN)',
    pinPh: '비밀번호 입력 (기본: 1234 또는 0815)',
    rememberId: '아이디 저장',
    defaultPinHint: '초기 비밀번호: 1234',
    studentLoginBtn: '🚀 로그인 & 오늘의 단어 학습 시작',
    parentNameLabel: '👨‍👩‍👧 학부모 성함 / 아이디',
    parentNamePh: '예: 이상학 (또는 이상학학부모)',
    parentPinLabel: '🔒 학부모 비밀번호',
    parentPinPh: '비밀번호 입력 (기본: 0815)',
    parentLoginBtn: '📊 학부모 대시보드 입장',
    errNoId: '아이디(또는 이름)를 입력해주세요.',
    errNoPin: '비밀번호(또는 4자리 PIN)를 입력해주세요.',
    errNotFound: '등록되지 않은 학생 아이디/이름입니다. 다시 확인해주세요.',
    errWrongPin: '비밀번호가 올바르지 않습니다. (기본 PIN: 1234 또는 0815)',
    errNoParentName: '학부모 성함을 입력해주세요.',
    errWrongParentPin: '학부모 비밀번호가 올바르지 않습니다. (기본: 0815)',
    loginSuccess: '학생 로그인 성공!',
    parentLoginSuccess: '학부모님 환영합니다!'
  },
  zh: {
    headerTagline: '中小学 5,000 核心英语词汇智能学习馆',
    appSubtitle: 'FlipVoca 3.0 智能词汇学习馆',
    backBtn: '学习主页 ➔',
    studentTab: '👦 学生登录',
    parentTab: '👨‍👩‍👧 家长模式',
    brandTitle: 'FlipVoca',
    programDescription: '小学/初中/高中 5,000 核心词汇 • 3D 翻转卡片与 4 阶智能测验',
    studentIdLabel: '👤 学生账号 / 姓名',
    studentIdPh: '请输入学生姓名或账号 (例: 李明)',
    pinLabel: '🔒 密码 (4位 PIN)',
    pinPh: '请输入密码 (默认: 1234 或 0815)',
    rememberId: '记住账号',
    defaultPinHint: '初始密码: 1234',
    studentLoginBtn: '🚀 登录并开始今日单词学习',
    parentNameLabel: '👨‍👩‍👧 家长姓名 / 账号',
    parentNamePh: '例: 李明家长',
    parentPinLabel: '🔒 家长密码',
    parentPinPh: '请输入家长密码 (默认: 0815)',
    parentLoginBtn: '📊 进入家长控制台',
    errNoId: '请输入学生账号或姓名。',
    errNoPin: '请输入密码。',
    errNotFound: '未找到该学生信息，请重新核对。',
    errWrongPin: '密码不正确。(默认 PIN: 1234 或 0815)',
    errNoParentName: '请输入家长姓名。',
    errWrongParentPin: '家长密码不正确。(默认: 0815)',
    loginSuccess: '同学登录成功！',
    parentLoginSuccess: '家长欢迎您！'
  },
  fr: {
    headerTagline: '5 000 Mots Anglais • Apprentissage Intelligent',
    appSubtitle: 'FlipVoca 3.0 Smart Learning',
    backBtn: 'Accueil ➔',
    studentTab: '👦 Connexion Élève',
    parentTab: '👨‍👩‍👧 Mode Parents',
    brandTitle: 'FlipVoca',
    programDescription: '5 000 Mots Anglais • Flashcards 3D & Quiz Intelligent 4 Niveaux',
    studentIdLabel: '👤 Identifiant / Nom de l\'élève',
    studentIdPh: 'Entrez votre nom ou ID (Ex: Paul)',
    pinLabel: '🔒 Mot de passe (Code PIN 4 chiffres)',
    pinPh: 'Code PIN (Défaut: 1234 ou 0815)',
    rememberId: 'Se souvenir de moi',
    defaultPinHint: 'PIN par défaut: 1234',
    studentLoginBtn: '🚀 Connexion & Démarrer l\'Étude',
    parentNameLabel: '👨‍👩‍👧 Nom du Parent',
    parentNamePh: 'Ex: M. Dupont',
    parentPinLabel: '🔒 Code PIN Parent',
    parentPinPh: 'Code PIN (Défaut: 0815)',
    parentLoginBtn: '📊 Accéder au Tableau de Bord',
    errNoId: 'Veuillez saisir votre nom ou identifiant.',
    errNoPin: 'Veuillez saisir votre code PIN.',
    errNotFound: 'Élève non trouvé. Veuillez vérifier.',
    errWrongPin: 'Code PIN incorrect (Défaut: 1234 ou 0815).',
    errNoParentName: 'Veuillez saisir le nom du parent.',
    errWrongParentPin: 'Code PIN parent incorrect (Défaut: 0815).',
    loginSuccess: 'Connexion réussie !',
    parentLoginSuccess: 'Bienvenue sur l\'espace parents !'
  },
  ja: {
    headerTagline: '小・中・高 5,000英単語スマート学習館',
    appSubtitle: 'FlipVoca 3.0 スマート英語学習館',
    backBtn: '学習ホーム ➔',
    studentTab: '👦 生徒ログイン',
    parentTab: '👨‍👩‍👧 保護者モード',
    brandTitle: 'FlipVoca',
    programDescription: '小・中・高 5,000英単語 • 3Dフラッシュカード＆4段階クイズ学習館',
    studentIdLabel: '👤 生徒ID / お名前',
    studentIdPh: 'お名前またはID入力 (例: 田中)',
    pinLabel: '🔒 暗証番号 (4桁 PIN)',
    pinPh: 'PIN番号入力 (初期値: 1234 または 0815)',
    rememberId: 'IDを保存',
    defaultPinHint: '初期暗証番号: 1234',
    studentLoginBtn: '🚀 ログインして本日の単語学習を開始',
    parentNameLabel: '👨‍👩‍👧 保護者のお名前',
    parentNamePh: '例: 田中保護者',
    parentPinLabel: '🔒 保護者暗証番号',
    parentPinPh: '暗証番号入力 (初期値: 0815)',
    parentLoginBtn: '📊 保護者ダッシュボードへ入場',
    errNoId: 'お名前または生徒IDを入力してください。',
    errNoPin: '暗証番号を入力してください。',
    errNotFound: '登録されていない生徒です。再確認してください。',
    errWrongPin: '暗証番号が正しくありません。(初期値: 1234 または 0815)',
    errNoParentName: '保護者のお名前を入力してください。',
    errWrongParentPin: '保護者暗証番号が正しくありません。(初期値: 0815)',
    loginSuccess: '生徒ログイン成功！',
    parentLoginSuccess: '保護者様、ようこそ！'
  },
  vi: {
    headerTagline: 'Học 5.000 từ vựng tiếng Anh thông minh',
    appSubtitle: 'FlipVoca 3.0 Học Từ Vựng Thông Minh',
    backBtn: 'Trang chủ học ➔',
    studentTab: '👦 Đăng nhập Học sinh',
    parentTab: '👨‍👩‍👧 Chế độ Phụ huynh',
    brandTitle: 'FlipVoca',
    programDescription: '5.000 Từ vựng tiếng Anh • Flashcard 3D & Trắc nghiệm 4 cấp độ',
    studentIdLabel: '👤 Tên học sinh / ID',
    studentIdPh: 'Nhập tên hoặc mã ID (VD: Minh)',
    pinLabel: '🔒 Mật khẩu (Mã PIN 4 số)',
    pinPh: 'Nhập mã PIN (Mặc định: 1234 hoặc 0815)',
    rememberId: 'Ghi nhớ tài khoản',
    defaultPinHint: 'Mã PIN ban đầu: 1234',
    studentLoginBtn: '🚀 Đăng nhập & Bắt đầu học hôm nay',
    parentNameLabel: '👨‍👩‍👧 Tên phụ huynh',
    parentNamePh: 'VD: Phụ huynh Minh',
    parentPinLabel: '🔒 Mã PIN phụ huynh',
    parentPinPh: 'Nhập mã PIN (Mặc định: 0815)',
    parentLoginBtn: '📊 Vào Bảng điều khiển Phụ huynh',
    errNoId: 'Vui lòng nhập tên học sinh hoặc ID.',
    errNoPin: 'Vui lòng nhập mã PIN.',
    errNotFound: 'Không tìm thấy học sinh. Vui lòng kiểm tra lại.',
    errWrongPin: 'Mã PIN không đúng. (Mặc định: 1234 hoặc 0815)',
    errNoParentName: 'Vui lòng nhập tên phụ huynh.',
    errWrongParentPin: 'Mã PIN phụ huynh không đúng (Mặc định: 0815).',
    loginSuccess: 'Đăng nhập học sinh thành công!',
    parentLoginSuccess: 'Chào mừng quý phụ huynh!'
  },
  hi: {
    headerTagline: '5,000 अंग्रेजी शब्दावली स्मार्ट लर्निंग हब',
    appSubtitle: 'FlipVoca 3.0 स्मार्ट लर्निंग प्लेटफॉर्म',
    backBtn: 'अध्ययन होम ➔',
    studentTab: '👦 विद्यार्थी लॉगिन',
    parentTab: '👨‍👩‍👧 अभिभावक मोड',
    brandTitle: 'FlipVoca',
    programDescription: '5,000 अंग्रेजी शब्दावली • 3D फ्लैशकार्ड और 4-स्तरीय स्मार्ट क्विज',
    errNoId: 'कृपया विद्यार्थी का नाम या आईडी दर्ज करें।',
    errNoPin: 'कृपया पासवर्ड पिन दर्ज करें।',
    errNotFound: 'विद्यार्थी नहीं मिला। कृपया पुनः जाँचें।',
    errWrongPin: 'पिन गलत है। (डिफ़ॉल्ट PIN: 1234 या 0815)',
    errNoParentName: 'कृपया अभिभावक का नाम दर्ज करें।',
    errWrongParentPin: 'अभिभावक पिन गलत है (डिफ़ॉल्ट: 0815)।',
    loginSuccess: 'विद्यार्थी लॉगिन सफल!',
    parentLoginSuccess: 'अभिभावक का स्वागत है!'
  }
};

export default function ModernLoginPage() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('ko');
  const [activeRole, setActiveRole] = useState('student'); // 'student' | 'parent'
  const [userIdInput, setUserIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parentNameInput, setParentNameInput] = useState('');
  const [parentPinInput, setParentPinInput] = useState('');
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccessToast, setLoginSuccessToast] = useState('');

  // 🎯 기본 학생 목록 (폴백용)
  const defaultStudents = [
    { id: 'lsh_20260807_000001', student_id: 'lsh_20260807_000001', name: '이상학', grade: '대학생 및 성인', avatar: '대학생 및 성인', studyGradeLevel: '중등단어', dailyWordCount: '20', studentPin: '0815', parentName: '이상학학부모', parentPin: '0815' },
    { id: 'lsh_20260807_000002', student_id: 'lsh_20260807_000002', name: '이승현', grade: '초등 5학년', avatar: '초등 5학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0418', parentName: '이승현학부모', parentPin: '0815' },
    { id: 'lsm_20260807_000003', student_id: 'lsm_20260807_000003', name: '이수민', grade: '초등 3학년', avatar: '초등 3학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '0809', parentName: '이수민학부모', parentPin: '0815' },
    { id: 'pjh_20260807_000004', student_id: 'pjh_20260807_000004', name: '박재현', grade: '초등 4학년', avatar: '초등 4학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '1234', parentName: '이상학', parentPin: '0815' },
    { id: 'kmc_20260807_000005', student_id: 'kmc_20260807_000005', name: '김민채', grade: '초등 2학년', avatar: '초등 2학년', studyGradeLevel: '초등단어', dailyWordCount: '10', studentPin: '1234', parentName: '이상학', parentPin: '0815' }
  ];

  // 저장된 언어 및 아이디 불러오기
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('steve_voca_lang') || localStorage.getItem('flipvoca_lang');
      if (savedLang && loginI18n[savedLang]) {
        setCurrentLang(savedLang);
      }
      const savedId = localStorage.getItem('flipvoca_saved_login_id');
      if (savedId) {
        setUserIdInput(savedId);
      }
    } catch (e) {}
  }, []);

  // 언어 변경 핸들러
  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    setErrorMessage('');
    try {
      localStorage.setItem('steve_voca_lang', langCode);
      localStorage.setItem('flipvoca_lang', langCode);
    } catch (e) {}
  };

  const currentStrings = loginI18n[currentLang] || loginI18n.ko;

  // 🚀 학생 ID / 비밀번호(PIN) 로그인 처리
  const handleStudentSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanInputId = userIdInput.trim();
    const cleanPin = passwordInput.trim();

    if (!cleanInputId) {
      setErrorMessage(currentStrings.errNoId);
      return;
    }
    if (!cleanPin) {
      setErrorMessage(currentStrings.errNoPin);
      return;
    }

    setIsLoading(true);

    try {
      // 1. Supabase DB에서 사용자 조회
      const { data: dbUsers } = await supabase
        .from('users')
        .select('*');

      let targetUser = null;

      if (dbUsers && dbUsers.length > 0) {
        // 이름 또는 student_id 일치 사용자 검색
        targetUser = dbUsers.find(u => {
          const uName = removeEmoji(u.name || '').toLowerCase();
          const uStudentId = String(u.student_id || u.id || '').toLowerCase();
          const query = cleanInputId.toLowerCase();
          return uName === query || uStudentId === query;
        });
      }

      // DB 검색 실패 시 폴백 기본 학생 목록 검색
      if (!targetUser) {
        targetUser = defaultStudents.find(u => {
          return u.name.toLowerCase() === cleanInputId.toLowerCase() ||
                 u.student_id.toLowerCase() === cleanInputId.toLowerCase() ||
                 u.id.toLowerCase() === cleanInputId.toLowerCase();
        });
      }

      if (!targetUser) {
        setIsLoading(false);
        setErrorMessage(currentStrings.errNotFound);
        return;
      }

      // 비밀번호(PIN) 검증
      const expectedPin = String(targetUser.pin || targetUser.studentPin || '1234').trim();
      const isPinMatch = (cleanPin === expectedPin) || (cleanPin === '1234') || (cleanPin === '0815');

      if (!isPinMatch) {
        setIsLoading(false);
        setErrorMessage(`${currentStrings.errWrongPin} (${expectedPin || '1234'})`);
        return;
      }

      // 아이디 저장 옵션
      if (rememberMe) {
        localStorage.setItem('flipvoca_saved_login_id', cleanInputId);
      } else {
        localStorage.removeItem('flipvoca_saved_login_id');
      }

      // 로그인 성공 정보 생성 및 세션 저장
      const rawGrade = String(targetUser.grade || targetUser.avatar || '초등단어').replace('[PENDING]', '').replace('[APPROVED]', '').trim();
      const userData = {
        id: targetUser.student_id || targetUser.id,
        student_id: targetUser.student_id || targetUser.id,
        name: removeEmoji(targetUser.name),
        grade: rawGrade || '초등단어',
        avatar: targetUser.avatar || targetUser.grade || '초등단어',
        studyGradeLevel: targetUser.study_grade_level || targetUser.studyGradeLevel || '초등단어',
        study_grade_level: targetUser.study_grade_level || targetUser.studyGradeLevel || '초등단어',
        dailyWordCount: String(targetUser.daily_word_count || targetUser.dailyWordCount || 10),
        daily_word_count: parseInt(targetUser.daily_word_count || targetUser.dailyWordCount || 10, 10)
      };

      localStorage.setItem('english_edu_current_user', JSON.stringify(userData));

      setLoginSuccessToast(`🎉 ${userData.name} ${currentStrings.loginSuccess}`);
      setTimeout(() => {
        router.push('/');
      }, 700);

    } catch (err) {
      console.error(err);
      setIsLoading(false);
      setErrorMessage('로그인 중 네트워크 오류가 발생했습니다.');
    }
  };

  // 👨‍👩‍👧 학부모 ID / 비밀번호 로그인 처리
  const handleParentSubmit = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    const cleanParentName = parentNameInput.trim();
    const cleanParentPin = parentPinInput.trim();

    if (!cleanParentName) {
      setErrorMessage(currentStrings.errNoParentName);
      return;
    }

    if (cleanParentPin && cleanParentPin !== '0815' && cleanParentPin !== '1234') {
      setErrorMessage(currentStrings.errWrongParentPin);
      return;
    }

    setIsLoading(true);
    localStorage.setItem('flipvoca_parent_logged_in', 'true');
    localStorage.setItem('flipvoca_parent_name', cleanParentName);

    setLoginSuccessToast(`👨‍👩‍👧 ${cleanParentName} ${currentStrings.parentLoginSuccess}`);
    setTimeout(() => {
      router.push('/?tab=parent');
    }, 700);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #E6FAFC 0%, #E0F2FE 45%, #F0FDF4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 12px',
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* 📱 모바일 스마트폰 컨테이너 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        background: '#FFFFFF',
        borderRadius: '38px',
        boxShadow: '0 25px 60px -15px rgba(0, 168, 191, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* 🌟 상단 앱 헤더 */}
        <div style={{
          padding: '14px 20px 10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid #F1F5F9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.3px' }}>
              Flip<span style={{ color: '#00A8BF' }}>Voca</span>
            </span>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#008294', background: '#E6FAFC', padding: '2px 7px', borderRadius: '8px', border: '1px solid #BAE8EE' }}>
              스마트 학습관
            </span>
          </div>

          <Link
            href="/"
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: '#F1F5F9',
              color: '#475569',
              fontSize: '11px',
              fontWeight: '800',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              border: '1px solid #E2E8F0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            {currentStrings.backBtn}
          </Link>
        </div>

        {/* 🌐 6대 글로벌 다국어 선택 바 (한국어, 中文, Français, 日本語, Tiếng Việt, हिन्दी) */}
        <div style={{
          padding: '0 20px',
          marginBottom: '14px'
        }}>
          <div style={{
            background: '#F8FAFC',
            padding: '10px 12px',
            borderRadius: '20px',
            border: '1.5px solid #E2E8F0',
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

            {/* 3열 x 2행 100% 핏 그리드 (잘림 및 스크롤 완전 해결) */}
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
                const isSelected = currentLang === item.code;
                const activeBg = activeRole === 'student'
                  ? 'linear-gradient(135deg, #E6FAFC 0%, #E0F7FA 100%)'
                  : 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)';
                const activeBorder = activeRole === 'student' ? '1.5px solid #00A8BF' : '1.5px solid #60A5FA';
                const activeColor = activeRole === 'student' ? '#008294' : '#2563EB';
                const activeShadow = activeRole === 'student'
                  ? '0 3px 10px rgba(0, 168, 191, 0.22)'
                  : '0 3px 10px rgba(96, 165, 250, 0.22)';

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleLanguageChange(item.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      padding: '8px 4px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: isSelected ? '900' : '700',
                      border: isSelected ? activeBorder : '1.5px solid #E2E8F0',
                      background: isSelected ? activeBg : '#FFFFFF',
                      color: isSelected ? activeColor : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? activeShadow : '0 1px 3px rgba(0,0,0,0.02)',
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
        </div>

        {/* 🔘 역할 전환 세그먼트 (학생 로그인 / 학부모 로그인) */}
        <div style={{ padding: '0 20px', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            background: '#F8FAFC',
            padding: '4px',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveRole('student'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: activeRole === 'student' ? 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)' : 'transparent',
                color: activeRole === 'student' ? '#FFFFFF' : '#64748B',
                boxShadow: activeRole === 'student' ? '0 4px 12px rgba(0, 168, 191, 0.3)' : 'none'
              }}
            >
              {currentStrings.studentTab}
            </button>
            <button
              type="button"
              onClick={() => { setActiveRole('parent'); setErrorMessage(''); }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: activeRole === 'parent' ? 'linear-gradient(135deg, #38BDF8 0%, #6366F1 100%)' : 'transparent',
                color: activeRole === 'parent' ? '#FFFFFF' : '#64748B',
                boxShadow: activeRole === 'parent' ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none'
              }}
            >
              {currentStrings.parentTab}
            </button>
          </div>
        </div>

        {/* 📜 메인 카드 및 로그인 입력창 영역 */}
        <div style={{
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 220px)',
          paddingBottom: '20px'
        }}>

          {/* 🎴 FlipVoca 공식 로고 & 슬로건 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 0 6px 0',
            gap: '8px'
          }}>
            <img
              src="/image/flipvoca_logo.png"
              alt="FlipVoca - Flip • Learn • Remember"
              style={{
                width: '270px',
                maxWidth: '90%',
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 24px rgba(0, 168, 191, 0.22))'
              }}
            />
            <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#64748B',
              fontWeight: '700',
              letterSpacing: '-0.2px',
              textAlign: 'center'
            }}>
              {currentStrings.programDescription}
            </p>
          </div>

          {/* 🔑 1. 학생 로그인 폼 (ID & 비밀번호) */}
          {activeRole === 'student' && (
            <form
              onSubmit={handleStudentSubmit}
              style={{
                background: '#F8FAFC',
                borderRadius: '26px',
                padding: '22px 20px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.03)'
              }}
            >
              {/* 오류 메시지 */}
              {errorMessage && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #F87171',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 1. 아이디 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  {currentStrings.studentIdLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={currentStrings.studentIdPh}
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#00A8BF'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    👤
                  </span>
                </div>
              </div>

              {/* 2. 비밀번호(PIN) 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  {currentStrings.pinLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={currentStrings.pinPh}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    maxLength={10}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#00A8BF'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0
                    }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* 아이디 저장 체크박스 & 힌트 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#64748B', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#00A8BF' }}
                  />
                  {currentStrings.rememberId}
                </label>
                <span style={{ color: '#94A3B8', fontSize: '11px' }}>
                  {currentStrings.defaultPinHint}
                </span>
              </div>

              {/* 🚀 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 22px rgba(0, 168, 191, 0.38)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                {isLoading ? '⏳ ...' : currentStrings.studentLoginBtn}
              </button>
            </form>
          )}

          {/* 👨‍👩‍👧 2. 학부모 로그인 폼 (성함 & 비밀번호) */}
          {activeRole === 'parent' && (
            <form
              onSubmit={handleParentSubmit}
              style={{
                background: '#F8FAFC',
                borderRadius: '26px',
                padding: '22px 20px',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.03)'
              }}
            >
              {/* 오류 메시지 */}
              {errorMessage && (
                <div style={{
                  background: '#FEE2E2',
                  border: '1px solid #F87171',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* 1. 학부모 성함 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  {currentStrings.parentNameLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder={currentStrings.parentNamePh}
                    value={parentNameInput}
                    onChange={(e) => setParentNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#60A5FA'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    👨‍👩‍👧
                  </span>
                </div>
              </div>

              {/* 2. 학부모 비밀번호 입력창 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  {currentStrings.parentPinLabel}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showParentPassword ? 'text' : 'password'}
                    placeholder={currentStrings.parentPinPh}
                    value={parentPinInput}
                    onChange={(e) => setParentPinInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 44px 14px 42px',
                      borderRadius: '16px',
                      border: '1.5px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: '700',
                      color: '#1E293B',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#60A5FA'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#CBD5E1'; }}
                  />
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>
                    🔒
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: 0
                    }}
                  >
                    {showParentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* 📊 학부모 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 20px rgba(96, 165, 250, 0.35)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                {isLoading ? '⏳ ...' : currentStrings.parentLoginBtn}
              </button>
            </form>
          )}

        </div>

        {/* 🔔 로그인 성공 토스트 메시지 */}
        {loginSuccessToast && (
          <div style={{
            position: 'absolute',
            bottom: '24px',
            left: '20px',
            right: '20px',
            background: '#10B981',
            color: '#FFFFFF',
            padding: '14px',
            borderRadius: '16px',
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            animation: 'fadeIn 0.3s ease'
          }}>
            {loginSuccessToast}
          </div>
        )}

      </div>
    </div>
  );
}
