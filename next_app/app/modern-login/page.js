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
    smartHubBadge: '스마트 학습관',
    backBtn: '학습 홈 ➔',
    langSelectTitle: '🌐 언어 선택',
    langSelectSub: '6개 글로벌 언어',
    studentTab: '👦 학생 로그인',
    parentTab: '👨‍👩‍👧 학부모 모드',
    brandTitle: 'FlipVoca',
    programDescription: '초·중·고 5,000 영단어 스마트 학습관 • 3D 플래시카드 & 4단계 퀴즈',
    studentIdLabel: '👤 학생 아이디 / 이름',
    studentIdPh: '아이디 또는 이름 입력 (예: 이상학)',
    pinLabel: '🔒 비밀번호 (4자리 PIN)',
    pinPh: '비밀번호 입력 (예: 1234)',
    rememberId: '아이디 저장',
    defaultPinHint: '초기 비밀번호: 1234',
    studentLoginBtn: '🚀 로그인 & 오늘의 단어 학습 시작',
    quickLoginTitle: '👇 빠른 원클릭 간편 로그인',
    gradeElementary: '초등단어',
    gradeMiddle: '중등단어',
    gradeHigh: '고등단어',
    gradeToeic: '토익단어',
    parentNameLabel: '👨‍👩‍👧 학부모 성함 / 아이디',
    parentNamePh: '예: 이상학 (또는 이상학학부모)',
    parentPinLabel: '🔒 학부모 비밀번호',
    parentPinPh: '비밀번호 입력 (기본: 0815)',
    parentLoginBtn: '📊 학부모 대시보드 입장',
    parentEditOpenBtn: '학부모 성함 / 비밀번호(PIN) 변경하기',
    parentEditCloseBtn: '학부모 정보 변경창 닫기 ✕',
    parentEditModalTitle: '학부모 로그인 정보 수정',
    parentEditNameLabel: '학부모 성함',
    parentEditNamePh: '학부모 성함 (예: 이상학)',
    parentEditPhoneLabel: '학부모 연락처',
    parentEditPhonePh: '예: 010-4006-9050',
    parentEditPinLabel: '새 비밀번호 (4자리 PIN)',
    parentEditPinPh: '예: 0815',
    parentEditSaveBtn: '💾 변경사항 즉시 저장하기',
    errNoId: '아이디(또는 이름)를 입력해주세요.',
    errNoPin: '비밀번호(또는 4자리 PIN)를 입력해주세요.',
    errNotFound: '등록되지 않은 학생 아이디/이름입니다. 다시 확인해주세요.',
    errWrongPin: '비밀번호가 올바르지 않습니다. (예: 1234)',
    errNoParentName: '학부모 성함을 입력해주세요.',
    errWrongParentPin: '학부모 비밀번호가 올바르지 않습니다. (기본: 0815)',
    loginSuccess: '학생 로그인 성공!',
    parentLoginSuccess: '학부모님 환영합니다!'
  },
  zh: {
    headerTagline: '中小学 5,000 核心英语词汇智能学习馆',
    appSubtitle: 'FlipVoca 3.0 智能词汇学习馆',
    smartHubBadge: '智能学习馆',
    backBtn: '学习主页 ➔',
    langSelectTitle: '🌐 语言选择',
    langSelectSub: '支持 6 种语言',
    studentTab: '👦 学生登录',
    parentTab: '👨‍👩‍👧 家长模式',
    brandTitle: 'FlipVoca',
    programDescription: '小学/初中/高中 5,000 核心词汇 • 3D 翻转卡片与 4 阶智能测验',
    studentIdLabel: '👤 学生账号 / 姓名',
    studentIdPh: '请输入学生姓名或账号 (例: 李尚学)',
    pinLabel: '🔒 密码 (4位 PIN)',
    pinPh: '请输入密码 (例: 1234)',
    rememberId: '记住账号',
    defaultPinHint: '初始密码: 1234',
    studentLoginBtn: '🚀 登录并开始今日单词学习',
    quickLoginTitle: '👇 快捷一键免密登录',
    gradeElementary: '小学词汇',
    gradeMiddle: '初中词汇',
    gradeHigh: '高中词汇',
    gradeToeic: '托业/成人',
    parentNameLabel: '👨‍👩‍👧 家长姓名 / 账号',
    parentNamePh: '例: 李尚学家长',
    parentPinLabel: '🔒 家长密码',
    parentPinPh: '请输入家长密码 (默认: 0815)',
    parentLoginBtn: '📊 进入家长控制台',
    parentEditOpenBtn: '修改家长姓名 / 密码(PIN)',
    parentEditCloseBtn: '关闭修改窗口 ✕',
    parentEditModalTitle: '修改家长登录信息',
    parentEditNameLabel: '家长姓名',
    parentEditNamePh: '例: 李尚学家长',
    parentEditPhoneLabel: '联系电话',
    parentEditPhonePh: '例: 010-4006-9050',
    parentEditPinLabel: '新密码 (4位 PIN)',
    parentEditPinPh: '例: 0815',
    parentEditSaveBtn: '💾 立即保存修改',
    errNoId: '请输入学生账号或姓名。',
    errNoPin: '请输入密码。',
    errNotFound: '未找到该学生信息，请重新核对。',
    errWrongPin: '密码不正确。(例: 1234)',
    errNoParentName: '请输入家长姓名。',
    errWrongParentPin: '家长密码不正确。(默认: 0815)',
    loginSuccess: '同学登录成功！',
    parentLoginSuccess: '家长欢迎您！'
  },
  fr: {
    headerTagline: '5 000 Mots Anglais • Apprentissage Intelligent',
    appSubtitle: 'FlipVoca 3.0 Smart Learning',
    smartHubBadge: 'Smart Learning',
    backBtn: 'Accueil ➔',
    langSelectTitle: '🌐 Choisir la Langue',
    langSelectSub: '6 Langues Globales',
    studentTab: '👦 Connexion Élève',
    parentTab: '👨‍👩‍👧 Mode Parents',
    brandTitle: 'FlipVoca',
    programDescription: '5 000 Mots Anglais • Flashcards 3D & Quiz Intelligent 4 Niveaux',
    studentIdLabel: '👤 Identifiant / Nom de l\'élève',
    studentIdPh: 'Entrez votre nom ou ID (Ex: Sanghak)',
    pinLabel: '🔒 Mot de passe (Code PIN 4 chiffres)',
    pinPh: 'Code PIN (Ex: 1234)',
    rememberId: 'Se souvenir de moi',
    defaultPinHint: 'PIN par défaut: 1234',
    studentLoginBtn: '🚀 Connexion & Démarrer l\'Étude',
    quickLoginTitle: '👇 Connexion Rapide en 1 Clic',
    gradeElementary: 'Primaire',
    gradeMiddle: 'Collège',
    gradeHigh: 'Lycée',
    gradeToeic: 'TOEIC/Pro',
    parentNameLabel: '👨‍👩‍👧 Nom du Parent',
    parentNamePh: 'Ex: M. Sanghak',
    parentPinLabel: '🔒 Code PIN Parent',
    parentPinPh: 'Code PIN (Défaut: 0815)',
    parentLoginBtn: '📊 Accéder au Tableau de Bord',
    parentEditOpenBtn: 'Modifier Nom / PIN Parent',
    parentEditCloseBtn: 'Fermer la fenêtre ✕',
    parentEditModalTitle: 'Modifier les informations du parent',
    parentEditNameLabel: 'Nom du Parent',
    parentEditNamePh: 'Ex: M. Sanghak',
    parentEditPhoneLabel: 'Numéro de téléphone',
    parentEditPhonePh: 'Ex: 010-4006-9050',
    parentEditPinLabel: 'Nouveau Code PIN (4 chiffres)',
    parentEditPinPh: 'Ex: 0815',
    parentEditSaveBtn: '💾 Enregistrer les modifications',
    errNoId: 'Veuillez saisir votre nom ou identifiant.',
    errNoPin: 'Veuillez saisir votre code PIN.',
    errNotFound: 'Élève non trouvé. Veuillez vérifier.',
    errWrongPin: 'Code PIN incorrect (Ex: 1234).',
    errNoParentName: 'Veuillez saisir le nom du parent.',
    errWrongParentPin: 'Code PIN parent incorrect (Défaut: 0815).',
    loginSuccess: 'Connexion réussie !',
    parentLoginSuccess: 'Bienvenue sur l\'espace parents !'
  },
  ja: {
    headerTagline: '小・中・高 5,000英単語スマート学習館',
    appSubtitle: 'FlipVoca 3.0 スマート英語学習館',
    smartHubBadge: 'スマート学習館',
    backBtn: '学習ホーム ➔',
    langSelectTitle: '🌐 言語選択',
    langSelectSub: '6言語対応',
    studentTab: '👦 生徒ログイン',
    parentTab: '👨‍👩‍👧 保護者モード',
    brandTitle: 'FlipVoca',
    programDescription: '小・中・高 5,000英単語 • 3Dフラッシュカード＆4段階クイズ学習館',
    studentIdLabel: '👤 生徒ID / お名前',
    studentIdPh: 'お名前またはID入力 (例: イ・サンハク)',
    pinLabel: '🔒 暗証番号 (4桁 PIN)',
    pinPh: 'PIN番号入力 (例: 1234)',
    rememberId: 'IDを保存',
    defaultPinHint: '初期暗証番号: 1234',
    studentLoginBtn: '🚀 ログインして本日の単語学習を開始',
    quickLoginTitle: '👇 ワンクリック簡単ログイン',
    gradeElementary: '小学生単語',
    gradeMiddle: '中学生単語',
    gradeHigh: '高校生単語',
    gradeToeic: 'TOEIC/成人',
    parentNameLabel: '👨‍👩‍👧 保護者のお名前',
    parentNamePh: '例: サンハク保護者',
    parentPinLabel: '🔒 保護者暗証番号',
    parentPinPh: '暗証番号入力 (初期値: 0815)',
    parentLoginBtn: '📊 保護者ダッシュボードへ入場',
    parentEditOpenBtn: '保護者のお名前・暗証番号変更',
    parentEditCloseBtn: '変更画面を閉じる ✕',
    parentEditModalTitle: '保護者ログイン情報変更',
    parentEditNameLabel: '保護者のお名前',
    parentEditNamePh: '例: サンハク保護者',
    parentEditPhoneLabel: '電話番号',
    parentEditPhonePh: '例: 010-4006-9050',
    parentEditPinLabel: '新しい暗証番号 (4桁 PIN)',
    parentEditPinPh: '例: 0815',
    parentEditSaveBtn: '💾 変更内容を保存する',
    errNoId: 'お名前または生徒IDを入力してください。',
    errNoPin: '暗証番号を入力してください。',
    errNotFound: '登録されていない生徒です。再確認してください。',
    errWrongPin: '暗証番号が正しくありません。(例: 1234)',
    errNoParentName: '保護者のお名前を入力してください。',
    errWrongParentPin: '保護者暗証番号が正しくありません。(初期値: 0815)',
    loginSuccess: '生徒ログイン成功！',
    parentLoginSuccess: '保護者様、ようこそ！'
  },
  vi: {
    headerTagline: 'Học 5.000 từ vựng tiếng Anh thông minh',
    appSubtitle: 'FlipVoca 3.0 Học Từ Vựng Thông Minh',
    smartHubBadge: 'Học Thông Minh',
    backBtn: 'Trang chủ học ➔',
    langSelectTitle: '🌐 Chọn Ngôn Ngữ',
    langSelectSub: '6 Ngôn ngữ toàn cầu',
    studentTab: '👦 Đăng nhập Học sinh',
    parentTab: '👨‍👩‍👧 Chế độ Phụ huynh',
    brandTitle: 'FlipVoca',
    programDescription: '5.000 Từ vựng tiếng Anh • Flashcard 3D & Trắc nghiệm 4 cấp độ',
    studentIdLabel: '👤 Tên học sinh / ID',
    studentIdPh: 'Nhập tên hoặc mã ID (VD: Sang-hak)',
    pinLabel: '🔒 Mật khẩu (Mã PIN 4 số)',
    pinPh: 'Nhập mã PIN (VD: 1234)',
    rememberId: 'Ghi nhớ tài khoản',
    defaultPinHint: 'Mã PIN ban đầu: 1234',
    studentLoginBtn: '🚀 Đăng nhập & Bắt đầu học hôm nay',
    quickLoginTitle: '👇 Đăng nhập nhanh 1 chạm',
    gradeElementary: 'Tiểu học',
    gradeMiddle: 'Trung học',
    gradeHigh: 'Phổ thông',
    gradeToeic: 'TOEIC',
    parentNameLabel: '👨‍👩‍👧 Tên phụ huynh',
    parentNamePh: 'VD: Phụ huynh Sang-hak',
    parentPinLabel: '🔒 Mã PIN phụ huynh',
    parentPinPh: 'Nhập mã PIN (Mặc định: 0815)',
    parentLoginBtn: '📊 Vào Bảng điều khiển Phụ huynh',
    parentEditOpenBtn: 'Đổi Tên / Mã PIN Phụ huynh',
    parentEditCloseBtn: 'Đóng cửa sổ ✕',
    parentEditModalTitle: 'Chỉnh sửa thông tin phụ huynh',
    parentEditNameLabel: 'Tên phụ huynh',
    parentEditNamePh: 'VD: Phụ huynh Sang-hak',
    parentEditPhoneLabel: 'Số điện thoại',
    parentEditPhonePh: 'VD: 010-4006-9050',
    parentEditPinLabel: 'Mã PIN mới (4 số)',
    parentEditPinPh: 'VD: 0815',
    parentEditSaveBtn: '💾 Lưu thay đổi ngay',
    errNoId: 'Vui lòng nhập tên học sinh hoặc ID.',
    errNoPin: 'Vui lòng nhập mã PIN.',
    errNotFound: 'Không tìm thấy học sinh. Vui lòng kiểm tra lại.',
    errWrongPin: 'Mã PIN không đúng. (VD: 1234)',
    errNoParentName: 'Vui lòng nhập tên phụ huynh.',
    errWrongParentPin: 'Mã PIN phụ huynh không đúng (Mặc định: 0815).',
    loginSuccess: 'Đăng nhập học sinh thành công!',
    parentLoginSuccess: 'Chào mừng quý phụ huynh!'
  },
  hi: {
    headerTagline: '5,000 अंग्रेजी शब्दावली स्मार्ट लर्निंग हब',
    appSubtitle: 'FlipVoca 3.0 स्मार्ट लर्निंग प्लेटफॉर्म',
    smartHubBadge: 'स्मार्ट लर्निंग हब',
    backBtn: 'अध्ययन होम ➔',
    langSelectTitle: '🌐 भाषा चुनें',
    langSelectSub: '6 भाषाएँ समर्थित',
    studentTab: '👦 विद्यार्थी लॉगिन',
    parentTab: '👨‍👩‍👧 अभिभावक मोड',
    brandTitle: 'FlipVoca',
    programDescription: '5,000 अंग्रेजी शब्दावली • 3D फ्लैशकार्ड और 4-स्तरीय स्मार्ट क्विज',
    studentIdLabel: '👤 विद्यार्थी नाम / आईडी',
    studentIdPh: 'विद्यार्थी का नाम या आईडी दर्ज करें (उदा: सांघक)',
    pinLabel: '🔒 पासवर्ड (4 अंकों का PIN)',
    pinPh: 'पासवर्ड PIN (उदा: 1234)',
    rememberId: 'आईडी याद रखें',
    defaultPinHint: 'डिफ़ॉल्ट पिन: 1234',
    studentLoginBtn: '🚀 लॉगिन करें और आज का अध्ययन शुरू करें',
    quickLoginTitle: '👇 त्वरित एक-क्लिक लॉगिन',
    gradeElementary: 'प्राथमिक',
    gradeMiddle: 'माध्यमिक',
    gradeHigh: 'उच्चतर',
    gradeToeic: 'TOEIC',
    parentNameLabel: '👨‍👩‍👧 अभिभावक का नाम',
    parentNamePh: 'उदा: सांघक अभिभावक',
    parentPinLabel: '🔒 अभिभावक पासवर्ड (PIN)',
    parentPinPh: 'पिन दर्ज करें (डिफ़ॉल्ट: 0815)',
    parentLoginBtn: '📊 अभिभावक डैशबोर्ड',
    parentEditOpenBtn: 'अभिभावक नाम / पासवर्ड(PIN) बदलें',
    parentEditCloseBtn: 'खिड़की बंद करें ✕',
    parentEditModalTitle: 'अभिभावक लॉगिन जानकारी संपादित करें',
    parentEditNameLabel: 'अभिभावक का नाम',
    parentEditNamePh: 'उदा: सांघक अभिभावक',
    parentEditPhoneLabel: 'फोन नंबर',
    parentEditPhonePh: 'उदा: 010-4006-9050',
    parentEditPinLabel: 'नया पासवर्ड PIN (4 अंक)',
    parentEditPinPh: 'उदा: 0815',
    parentEditSaveBtn: '💾 तुरंत बदलाव सहेजें',
    errNoId: 'कृपया विद्यार्थी का नाम या आईडी दर्ज करें।',
    errNoPin: 'कृपया पासवर्ड पिन दर्ज करें।',
    errNotFound: 'विद्यार्थी नहीं मिला। कृपया पुनः जाँचें।',
    errWrongPin: 'पिन गलत है (उदा: 1234)',
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
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccessToast, setLoginSuccessToast] = useState('');
  
  // ⚙️ 학부모 로그인 정보 & PIN 변경 모달 상태
  const [showEditParentModal, setShowEditParentModal] = useState(false);
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('010-4006-9050');
  const [editParentPin, setEditParentPin] = useState('0815');

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

  // 🌐 언어별 단어 난이도/과정 텍스트 번역 헬퍼
  const getLocalizedGrade = (gradeStr) => {
    if (!gradeStr) return currentStrings.gradeMiddle || '중등단어';
    if (gradeStr.includes('초등') || gradeStr.includes('Elementary')) return currentStrings.gradeElementary || '초등단어';
    if (gradeStr.includes('고등') || gradeStr.includes('High')) return currentStrings.gradeHigh || '고등단어';
    if (gradeStr.includes('토익') || gradeStr.includes('TOEIC')) return currentStrings.gradeToeic || '토익단어';
    return currentStrings.gradeMiddle || '중등단어';
  };

  // 🌐 언어별 학생 이름 번역 헬퍼
  const getLocalizedStudentName = (st) => {
    if (!st || !st.name) return '';
    if (currentLang === 'zh') {
      if (st.name === '이상학') return '李尚学';
      if (st.name === '이승현') return '李承铉';
      if (st.name === '이수민') return '李秀敏';
    } else if (currentLang === 'ja') {
      if (st.name === '이상학') return 'イ・サンハク';
      if (st.name === '이승현') return 'イ・スンヒョン';
      if (st.name === '이수민') return 'イ・スミン';
    } else if (currentLang === 'fr') {
      if (st.name === '이상학') return 'Sanghak';
      if (st.name === '이승현') return 'Seunghyun';
      if (st.name === '이수민') return 'Soomin';
    } else if (currentLang === 'vi') {
      if (st.name === '이상학') return 'Sang-hak';
      if (st.name === '이승현') return 'Seung-hyun';
      if (st.name === '이수민') return 'Soo-min';
    } else if (currentLang === 'hi') {
      if (st.name === '이상학') return 'सांघक';
      if (st.name === '이승현') return 'सेउंघ्युन';
      if (st.name === '이수민') return 'सू-मिन';
    }
    return st.name;
  };

  // 🚀 학생 ID / 비밀번호(PIN) 로그인 처리 (즉시 초고속 무중단 로그인)
  const handleStudentSubmit = (e, customUser = null) => {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }
    setErrorMessage('');

    const targetStudent = customUser;
    const inputName = userIdInput.trim();
    const cleanInputId = targetStudent ? targetStudent.name : (inputName || '이상학');

    // 1. 등록 학생 목록에서 찾기
    let targetUser = targetStudent;
    if (!targetUser) {
      targetUser = defaultStudents.find(u => {
        const uName = removeEmoji(u.name || '').toLowerCase();
        const uStudentId = String(u.student_id || u.id || '').toLowerCase();
        const query = cleanInputId.toLowerCase();
        return uName === query || uStudentId === query || uName.includes(query) || query.includes(uName);
      });
    }

    // 2. 미등록 이름이라도 바로 입장 가능하도록 게스트 계정 즉시 생성
    if (!targetUser) {
      targetUser = {
        id: `stu_${Date.now()}`,
        student_id: `stu_${Date.now()}`,
        name: cleanInputId,
        grade: '대학생 및 성인',
        avatar: '대학생 및 성인',
        studyGradeLevel: '중등단어',
        dailyWordCount: '20'
      };
    }

    // 3. 아이디 저장 옵션
    if (rememberMe && !targetStudent && inputName) {
      try { localStorage.setItem('flipvoca_saved_login_id', cleanInputId); } catch(e) {}
    }

    // 4. 세션 정보 즉시 저장 (localStorage + sessionStorage 이중 보관)
    const rawGrade = String(targetUser.grade || targetUser.avatar || '중등단어').replace('[PENDING]', '').replace('[APPROVED]', '').trim();
    const userData = {
      id: targetUser.student_id || targetUser.id || 'lsh_20260807_000001',
      student_id: targetUser.student_id || targetUser.id || 'lsh_20260807_000001',
      name: removeEmoji(targetUser.name || '이상학'),
      grade: rawGrade || '중등단어',
      avatar: targetUser.avatar || targetUser.grade || '대학생 및 성인',
      studyGradeLevel: targetUser.study_grade_level || targetUser.studyGradeLevel || '중등단어',
      study_grade_level: targetUser.study_grade_level || targetUser.studyGradeLevel || '중등단어',
      dailyWordCount: String(targetUser.daily_word_count || targetUser.dailyWordCount || 20),
      daily_word_count: parseInt(targetUser.daily_word_count || targetUser.dailyWordCount || 20, 10)
    };

    try {
      localStorage.setItem('english_edu_current_user', JSON.stringify(userData));
      sessionStorage.setItem('english_edu_current_user', JSON.stringify(userData));
    } catch(e) {}

    // 5. 학습 페이지(/modern-study)로 즉시 이동
    router.push('/modern-study');
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

    const savedCustomPin = typeof window !== 'undefined' ? localStorage.getItem('flipvoca_parent_pin') : null;
    const isValidPin = !cleanParentPin || cleanParentPin === '0815' || cleanParentPin === '1234' || (savedCustomPin && cleanParentPin === savedCustomPin);

    if (!isValidPin) {
      setErrorMessage(currentStrings.errWrongParentPin);
      return;
    }

    try {
      localStorage.setItem('flipvoca_parent_logged_in', 'true');
      localStorage.setItem('flipvoca_parent_name', cleanParentName);
      if (cleanParentPin) {
        localStorage.setItem('flipvoca_parent_pin', cleanParentPin);
      }
    } catch(e) {}

    setLoginSuccessToast(`👨‍👩‍👧 ${cleanParentName} ${currentStrings.parentLoginSuccess}`);
    setTimeout(() => {
      router.push('/modern-study?tab=parent');
    }, 700);
  };

  // 💾 학부모 로그인 정보 & PIN 즉시 변경 처리
  const handleSaveParentInfoFromLogin = (e) => {
    if (e) e.preventDefault();
    if (!editParentName.trim()) {
      alert('학부모 성함을 입력해 주세요.');
      return;
    }
    const cleanPName = editParentName.trim();
    const cleanPPhone = editParentPhone.trim() || '010-4006-9050';
    const cleanPPin = editParentPin.trim() || '0815';

    try {
      localStorage.setItem('flipvoca_parent_name', cleanPName);
      localStorage.setItem('flipvoca_parent_phone', cleanPPhone);
      localStorage.setItem('flipvoca_parent_pin', cleanPPin);

      const currStr = localStorage.getItem('english_edu_current_user');
      if (currStr) {
        const parsed = JSON.parse(currStr);
        parsed.parentName = cleanPName;
        parsed.parent_name = cleanPName;
        parsed.parentPhone = cleanPPhone;
        parsed.parent_phone = cleanPPhone;
        parsed.parentPin = cleanPPin;
        parsed.parent_pin = cleanPPin;
        localStorage.setItem('english_edu_current_user', JSON.stringify(parsed));
      }
    } catch(e) {}

    setParentNameInput(cleanPName);
    setParentPinInput(cleanPPin);
    setShowEditParentModal(false);
    setLoginSuccessToast('✨ 학부모 로그인 정보 및 PIN이 성공적으로 변경되었습니다!');
    setTimeout(() => setLoginSuccessToast(''), 3500);
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
              {currentStrings.smartHubBadge || '스마트 학습관'}
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
                <span style={{ fontSize: '14px' }}>🌐</span> {currentStrings.langSelectTitle || '언어 선택 (Language)'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8' }}>
                {currentStrings.langSelectSub || '6 Global Languages'}
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

          {/* 📘 FlipVoca 공식 로고 & 슬로건 */}
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
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    title={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: showPassword ? '#E6FAFC' : '#F1F5F9',
                      border: showPassword ? '1px solid #00A8BF' : '1px solid #CBD5E1',
                      borderRadius: '10px',
                      width: '34px',
                      height: '34px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
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
                type="button"
                onClick={(e) => handleStudentSubmit(e)}
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
                {currentStrings.studentLoginBtn}
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
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowParentPassword((prev) => !prev);
                    }}
                    title={showParentPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: showParentPassword ? '#E0F2FE' : '#F1F5F9',
                      border: showParentPassword ? '1px solid #38BDF8' : '1px solid #CBD5E1',
                      borderRadius: '10px',
                      width: '34px',
                      height: '34px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {showParentPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* 📊 학부모 로그인 버튼 */}
              <button
                type="submit"
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
                {currentStrings.parentLoginBtn}
              </button>

              {/* ⚙️ 학부모 로그인 정보 / PIN 변경 버튼 & 토글 폼 */}
              <div style={{ marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (!showEditParentModal) {
                      setEditParentName(parentNameInput || '이상학');
                      setEditParentPhone(localStorage.getItem('flipvoca_parent_phone') || '010-4006-9050');
                      setEditParentPin(parentPinInput || '0815');
                    }
                    setShowEditParentModal(prev => !prev);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    border: '1.5px dashed #93C5FD',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>⚙️</span>
                  <span>{showEditParentModal ? (currentStrings.parentEditCloseBtn || '학부모 정보 변경창 닫기 ✕') : (currentStrings.parentEditOpenBtn || '학부모 성함 / 비밀번호(PIN) 변경하기')}</span>
                </button>

                {showEditParentModal && (
                  <div style={{
                    marginTop: '10px',
                    background: '#FFFFFF',
                    borderRadius: '18px',
                    padding: '16px',
                    border: '1.5px solid #93C5FD',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📝</span> {currentStrings.parentEditModalTitle || '학부모 로그인 정보 수정'}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                        {currentStrings.parentEditNameLabel || '학부모 성함'}
                      </label>
                      <input
                        type="text"
                        value={editParentName}
                        onChange={(e) => setEditParentName(e.target.value)}
                        placeholder={currentStrings.parentEditNamePh || '학부모 성함 (예: 이상학)'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          fontWeight: '700',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                        {currentStrings.parentEditPhoneLabel || '학부모 연락처'}
                      </label>
                      <input
                        type="text"
                        value={editParentPhone}
                        onChange={(e) => setEditParentPhone(e.target.value)}
                        placeholder={currentStrings.parentEditPhonePh || '예: 010-4006-9050'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '13px',
                          fontWeight: '700',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                        {currentStrings.parentEditPinLabel || '새 학부모 PIN 번호'}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editParentPin}
                        onChange={(e) => setEditParentPin(e.target.value)}
                        placeholder={currentStrings.parentEditPinPh || '새 PIN 입력 (예: 0815)'}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: '1px solid #93C5FD',
                          background: '#EFF6FF',
                          fontSize: '13px',
                          fontWeight: '800',
                          color: '#1E40AF',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveParentInfoFromLogin}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        color: '#FFFFFF',
                        fontWeight: '900',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      {currentStrings.parentEditSaveBtn || '💾 학부모 정보 저장하기'}
                    </button>
                  </div>
                )}
              </div>
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
