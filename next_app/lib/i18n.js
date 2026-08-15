// 🌐 Steve Voca 다국어 (한국어 🇰🇷 / 중국어 🇨🇳 / 프랑스어 🇫🇷) 전체 UI 번역 사전 (i18n)

export const translations = {
  ko: {
    // 앱 기본 정보
    app_title: "Steve Voca (스티브 보카)",
    app_subtitle: "초/중/고 5,000개 영단어 스마트 학습관",
    lang_label: "🌐 언어:",
    speed_label: "🎛️ 속도:",
    speed_slow: "🐢 0.7x (슬로우)",
    speed_normal: "🚶 1.0x (보통)",
    speed_fast: "🏃 1.4x (빠름)",
    speed_super_fast: "🚀 2.0x (초배속)",

    // 내비게이션 바
    nav_core_course: "📖 핵심 학습 코스",
    nav_flashcard: "🎴 플래시카드",
    nav_wordlist: "📋 단어 리스트",
    nav_quiz: "❓ 1~4단계 퀴즈",
    nav_myvocab: "⭐ 나만의 단어장",
    nav_review_report: "💥 오답·복습·리포트",
    nav_wrongvocab: "❌ 퀴즈 오답노트 ☁️",
    nav_day6: "🗓️ Day 6 주간복습 💮",
    nav_calendar: "📅 출석 달력",
    nav_stats: "📊 학습통계",
    nav_parent: "👨‍👩‍👧‍👦 학부모",
    nav_leaderboard: "🏆 Voca 랭킹 👑",

    // 학생 상단 상태바 & 7단계 로드맵
    student_badge: "학생",
    welcome: "님, 오늘도 힘차게 영단어 마스터해봐요!",
    logout: "로그아웃",
    daily_mission_progress: "오늘의 일일 미션 학습 로드맵 (순서대로 마스터하기)",
    step_1_flashcard: "1️⃣ 🎴 플래시카드",
    step_2_recording: "2️⃣ 🎙️ 발음녹음",
    step_3_quiz1: "3️⃣ 🔊 소리듣기",
    step_4_quiz2: "4️⃣ 🔤 스펠선택",
    step_5_quiz3: "5️⃣ 🎙️ 발음통과",
    step_6_quiz4: "6️⃣ ✍️ 직접쓰기",
    step_7_stamp: "7️⃣ 💮 출석도장",
    done: "완료",
    waiting: "대기",
    study_round_prefix: "제",
    study_round_suffix: "회차",
    today_all_learned_btn: "📖 오늘 누적 학습 단어",
    today_all_modal_title: "📖 오늘 누적 학습 완료 단어 목록",
    reset_daily_btn: "🔄 오늘의 단어 새로고침",
    study_date_picker_label: "📅 학습 날짜:",
    words_count_unit: "개",

    // 플래시카드 섹션
    card_front_meaning_label: "단어 뜻",
    listen_word_audio: "🔊 단어 발음 듣기",
    listen_example_audio: "🔊 예문 문장 발음 듣기",
    recommended_example: "📖 추천 학습 예문",
    flip_to_example_hint: "👆 터치하여 예문 및 예문 발음 보기",
    flip_to_word_hint: "👆 터치하여 영단어 보기",
    btn_prev: "⬅️ 이전 단어",
    btn_next: "다음 단어 ➡️",
    btn_record_start: "🎙️ 녹음 시작 (발음 측정)",
    btn_record_stop: "⏹️ 녹음 완료 및 일치율 확인",
    btn_play_my_record: "▶️ 내 발음 듣기",
    goto_quiz_btn: "🚀 1~4단계 퀴즈로 실력 테스트하기 🎯",
    load_next_round_btn: "⏩ 다음 단어 세트 로딩",
    progress_status_text: "학습 진행도",

    // 단어 리스트 섹션
    wordlist_title: "📋 학습 단어 목록",
    wordlist_subtitle: "공부할 단어들의 영단어, 발음기호, 뜻, 예문과 🎙️ 내 발음 녹음을 들어보세요.",
    wordlist_pdf_btn: "🖨️ 원클릭 PDF 시험지/워크시트 인쇄 (6종)",
    btn_example_audio: "🔊 예문",
    btn_my_audio: "🎙️ 내 녹음",

    // 퀴즈 섹션
    quiz_header_title: "🎯 Steve Voca 단계별 실력 마스터 퀴즈",
    quiz_level_1_name: "1단계: 소리 듣기 퀴즈",
    quiz_level_1_desc: "💡 소리를 듣고 올바른 뜻을 선택하세요!",
    quiz_level_2_name: "2단계: 스펠링 선택 퀴즈 (필수)",
    quiz_level_2_desc: "💡 아래 보기에서 올바른 영어 단어를 선택하세요!",
    quiz_level_3_name: "3단계: 마이크 발음 녹음 퀴즈 (75점 이상 합격)",
    quiz_level_3_desc: "💡 아래 마이크 버튼을 누르고 영단어 발음을 크게 말해보세요!",
    quiz_level_4_name: "4단계: 주관식 스펠링 직접 쓰기",
    quiz_level_4_desc: "💡 영어 단어 스펠링을 아래 입력란에 직접 입력하세요!",
    quiz_submit: "제출",
    quiz_question: "문제",
    quiz_score: "🔥 점수:",
    quiz_score_unit: "점",
    quiz_correct_feedback: "🎉 딩동댕! 정답입니다! 👏",
    quiz_wrong_feedback: "❌ 앗, 아쉬워요! 오답입니다.",
    quiz_correct_answer_is: "정답:",
    quiz_next_problem: "다음 문제로 ➡️",
    quiz_replay_audio: "🔊 발음 다시 듣기",
    quiz_start_record: "🎙️ 녹음 시작",
    quiz_stop_record: "⏹️ 녹음 완료 및 평가",
    quiz_answer_audio: "🔊 정답 발음 듣기",
    quiz_level_completed_title: "🎉 축하합니다! 퀴즈 완료!",
    quiz_score_summary: "최종 획득 점수:",
    quiz_retry_btn: "🔄 다시 풀기",
    quiz_next_level_btn: "다음 단계 도전 🚀",

    // 학년/레벨 번역
    grade_elem: "초등단어",
    grade_mid: "중등단어",
    grade_high: "고등/수능",
    category_basic: "기초",

    // 로그인 페이지
    login_title: "🏫 Steve Voca 스마트 영단어 학습관",
    login_subtitle: "학생 이름을 입력하고 PIN 번호 4자리로 간편하게 입장하세요!",
    input_student_name_ph: "학생 이름 입력 (예: 홍길동)",
    input_pin_ph: "학생 PIN 번호 4자리 (예: 1234)",
    btn_student_login: "🚀 학습 시작하기 (학생 입장)",
    btn_parent_login: "👨‍👩‍👧‍👦 학부모 모니터링 로그인",
    parent_modal_title: "👨‍👩‍👧‍👦 학부모 안심 리포트 & 실시간 모니터링",
    input_parent_name_ph: "학부모 성함 입력 (예: 홍길동학부모)",
    input_parent_pin_ph: "학부모 PIN 번호 4자리 (예: 5678)",
    btn_parent_submit: "학부모 대시보드 입장",
    btn_close: "닫기",
    admin_access_hint: "🔒 학원 관리자 페이지 접속: /admin",
  },

  zh: {
    // 基础信息
    app_title: "Steve Voca (史蒂夫单词)",
    app_subtitle: "小学/初中/高中 5,000词智能英语学习馆",
    lang_label: "🌐 语言:",
    speed_label: "🎛️ 语速:",
    speed_slow: "🐢 0.7x (慢速)",
    speed_normal: "🚶 1.0x (正常)",
    speed_fast: "🏃 1.4x (快速)",
    speed_super_fast: "🚀 2.0x (极速)",

    // 导航栏
    nav_core_course: "📖 核心学习课程",
    nav_flashcard: "🎴 单词卡片",
    nav_wordlist: "📋 单词列表",
    nav_quiz: "❓ 1~4级测验",
    nav_myvocab: "⭐ 我的生词本",
    nav_review_report: "💥 错题·复习·报告",
    nav_wrongvocab: "❌ 错题笔记本 ☁️",
    nav_day6: "🗓️ Day 6 周复习 💮",
    nav_calendar: "📅 出勤日历",
    nav_stats: "📊 学习统计",
    nav_parent: "👨‍👩‍👧‍👦 家长端",
    nav_leaderboard: "🏆 单词排行榜 👑",

    // 学生状态与 7 阶段路线图
    student_badge: "学生",
    welcome: "同学，今天也一起加油掌握新单词吧！",
    logout: "退出登录",
    daily_mission_progress: "今日每日学习通关路线图 (按顺序完成)",
    step_1_flashcard: "1️⃣ 🎴 单词卡片",
    step_2_recording: "2️⃣ 🎙️ 发音录音",
    step_3_quiz1: "3️⃣ 🔊 听音辨意",
    step_4_quiz2: "4️⃣ 🔤 拼写选择",
    step_5_quiz3: "5️⃣ 🎙️ 发音过关",
    step_6_quiz4: "6️⃣ ✍️ 拼写填空",
    step_7_stamp: "7️⃣ 💮 签到印章",
    done: "已完成",
    waiting: "待完成",
    study_round_prefix: "第",
    study_round_suffix: "轮",
    today_all_learned_btn: "📖 今日累计学习单词",
    today_all_modal_title: "📖 今日累计已学单词列表",
    reset_daily_btn: "🔄 刷新今日单词",
    study_date_picker_label: "📅 学习日期:",
    words_count_unit: "个",

    // 单词卡片
    card_front_meaning_label: "中文释义",
    listen_word_audio: "🔊 播放单词发音",
    listen_example_audio: "🔊 播放例句发音",
    recommended_example: "📖 推荐学习例句",
    flip_to_example_hint: "👆 点击查看例句及例句发音",
    flip_to_word_hint: "👆 点击返回单词正面",
    btn_prev: "⬅️ 上一个单词",
    btn_next: "下一个单词 ➡️",
    btn_record_start: "🎙️ 开始录音 (发音评测)",
    btn_record_stop: "⏹️ 完成录音并评分",
    btn_play_my_record: "▶️ 试听我的录音",
    goto_quiz_btn: "🚀 进入 1~4 级测验挑战 🎯",
    load_next_round_btn: "⏩ 加载下一组单词",
    progress_status_text: "学习进度",

    // 单词列表
    wordlist_title: "📋 学习单词列表",
    wordlist_subtitle: "查看所学单词的英文、音标、释义、例句并试听 🎙️ 个人发音录音。",
    wordlist_pdf_btn: "🖨️ 一键生成高清 PDF 练习卷/试卷 (6种)",
    btn_example_audio: "🔊 例句",
    btn_my_audio: "🎙️ 我的录音",

    // 测验
    quiz_header_title: "🎯 Steve Voca 分级能力通关测验",
    quiz_level_1_name: "第 1 关: 听音辨意测验",
    quiz_level_1_desc: "💡 请听发音并选择正确的释义！",
    quiz_level_2_name: "第 2 关: 拼写选择测验 (必做)",
    quiz_level_2_desc: "💡 请在下方选项中选择正确的英语单词！",
    quiz_level_3_name: "第 3 关: 麦克风发音录音测验 (75分以上合格)",
    quiz_level_3_desc: "💡 请按下麦克风按钮并大声朗读该英语单词！",
    quiz_level_4_name: "第 4 关: 主观题拼写直接填空",
    quiz_level_4_desc: "💡 请在下方输入框中直接拼写英语单词！",
    quiz_submit: "提交",
    quiz_question: "题目",
    quiz_score: "🔥 得分:",
    quiz_score_unit: "分",
    quiz_correct_feedback: "🎉 太棒了！回答正确！👏",
    quiz_wrong_feedback: "❌ 哎呀，很遗憾！回答错误。",
    quiz_correct_answer_is: "正确答案:",
    quiz_next_problem: "下一题 ➡️",
    quiz_replay_audio: "🔊 重新听音",
    quiz_start_record: "🎙️ 开始录音",
    quiz_stop_record: "⏹️ 完成录音并评估",
    quiz_answer_audio: "🔊 听取正确发音",
    quiz_level_completed_title: "🎉 恭喜！本关测验全部完成！",
    quiz_score_summary: "最终得分:",
    quiz_retry_btn: "🔄 重新测验",
    quiz_next_level_btn: "挑战下一关 🚀",

    // 年级/等级
    grade_elem: "小学英语",
    grade_mid: "初中英语",
    grade_high: "高中/高考",
    category_basic: "基础",

    // 登录页
    login_title: "🏫 Steve Voca 智能英语单词学习馆",
    login_subtitle: "请输入学生姓名并输入4位 PIN 码便捷登录！",
    input_student_name_ph: "请输入学生姓名 (例: 张三)",
    input_pin_ph: "4位学生 PIN 密码 (例: 1234)",
    btn_student_login: "🚀 开始学习 (学生进入)",
    btn_parent_login: "👨‍👩‍👧‍👦 家长端学情监控登录",
    parent_modal_title: "👨‍👩‍👧‍👦 家长安心报告与实时学情监控",
    input_parent_name_ph: "请输入家长姓名",
    input_parent_pin_ph: "4位家长 PIN 密码 (例: 5678)",
    btn_parent_submit: "进入家长控制台",
    btn_close: "关闭",
    admin_access_hint: "🔒 机构管理员登录: /admin",
  },

  fr: {
    // Informations de base
    app_title: "Steve Voca (Vocabulaire Steve)",
    app_subtitle: "Centre intelligent d'apprentissage de 5 000 mots d'anglais",
    lang_label: "🌐 Langue:",
    speed_label: "🎛️ Vitesse:",
    speed_slow: "🐢 0.7x (Lent)",
    speed_normal: "🚶 1.0x (Normal)",
    speed_fast: "🏃 1.4x (Rapide)",
    speed_super_fast: "🚀 2.0x (Super rapide)",

    // Barre de navigation
    nav_core_course: "📖 Cours d'apprentissage principal",
    nav_flashcard: "🎴 Cartes mémoire",
    nav_wordlist: "📋 Liste de mots",
    nav_quiz: "❓ Quiz Niveaux 1~4",
    nav_myvocab: "⭐ Mon vocabulaire",
    nav_review_report: "💥 Erreurs·Révision·Rapports",
    nav_wrongvocab: "❌ Carnet d'erreurs ☁️",
    nav_day6: "🗓️ Day 6 Révision hebdo 💮",
    nav_calendar: "📅 Calendrier de présence",
    nav_stats: "📊 Statistiques d'étude",
    nav_parent: "👨‍👩‍👧‍👦 Espace Parents",
    nav_leaderboard: "🏆 Classement Voca 👑",

    // Profil & Feuille de route
    student_badge: "Élève",
    welcome: ", maîtrisons les mots d'anglais aujourd'hui !",
    logout: "Déconnexion",
    daily_mission_progress: "Feuille de route quotidienne (À compléter dans l'ordre)",
    step_1_flashcard: "1️⃣ 🎴 Cartes",
    step_2_recording: "2️⃣ 🎙️ Enreg.",
    step_3_quiz1: "3️⃣ 🔊 Écoute",
    step_4_quiz2: "4️⃣ 🔤 Choix",
    step_5_quiz3: "5️⃣ 🎙️ Prononciation",
    step_6_quiz4: "6️⃣ ✍️ Écriture",
    step_7_stamp: "7️⃣ 💮 Présence",
    done: "Fait",
    waiting: "Attente",
    study_round_prefix: "Série",
    study_round_suffix: "",
    today_all_learned_btn: "📖 Mots appris aujourd'hui",
    today_all_modal_title: "📖 Liste des mots cumulés aujourd'hui",
    reset_daily_btn: "🔄 Actualiser les mots du jour",
    study_date_picker_label: "📅 Date d'étude:",
    words_count_unit: "mots",

    // Cartes mémoire
    card_front_meaning_label: "Définition",
    listen_word_audio: "🔊 Écouter le mot",
    listen_example_audio: "🔊 Écouter la phrase exemple",
    recommended_example: "📖 Phrase d'exemple recommandée",
    flip_to_example_hint: "👆 Toucher pour voir l'exemple et l'audio",
    flip_to_word_hint: "👆 Toucher pour voir le mot",
    btn_prev: "⬅️ Mot précédent",
    btn_next: "Mot suivant ➡️",
    btn_record_start: "🎙️ Enregistrer (Évaluation)",
    btn_record_stop: "⏹️ Terminer et évaluer",
    btn_play_my_record: "▶️ Écouter mon enregistrement",
    goto_quiz_btn: "🚀 Passer aux quiz Niveaux 1~4 🎯",
    load_next_round_btn: "⏩ Charger la série suivante",
    progress_status_text: "Progression de l'étude",

    // Liste des mots
    wordlist_title: "📋 Liste des mots d'apprentissage",
    wordlist_subtitle: "Consultez les mots, la phonétique, les définitions, les exemples et vos enregistrements.",
    wordlist_pdf_btn: "🖨️ Imprimer les fiches PDF / tests (6 types)",
    btn_example_audio: "🔊 Exemple",
    btn_my_audio: "🎙️ Mon audio",

    // Quiz
    quiz_header_title: "🎯 Steve Voca Quiz de Maîtrise Progressive",
    quiz_level_1_name: "Niveau 1: Quiz d'écoute sonore",
    quiz_level_1_desc: "💡 Écoutez le son et choisissez la bonne définition !",
    quiz_level_2_name: "Niveau 2: Quiz de sélection d'orthographe (Obligatoire)",
    quiz_level_2_desc: "💡 Choisissez le bon mot anglais parmi les options ci-dessous !",
    quiz_level_3_name: "Niveau 3: Quiz de prononciation au micro (Score 75+ requis)",
    quiz_level_3_desc: "💡 Appuyez sur le micro et prononcez le mot anglais à voix haute !",
    quiz_level_4_name: "Niveau 4: Écriture directe de l'orthographe",
    quiz_level_4_desc: "💡 Saisissez l'orthographe exacte du mot anglais ci-dessous !",
    quiz_submit: "Soumettre",
    quiz_question: "Question",
    quiz_score: "🔥 Score:",
    quiz_score_unit: "pts",
    quiz_correct_feedback: "🎉 Bravo ! Bonne réponse ! 👏",
    quiz_wrong_feedback: "❌ Oups, mauvaise réponse.",
    quiz_correct_answer_is: "Bonne réponse :",
    quiz_next_problem: "Question suivante ➡️",
    quiz_replay_audio: "🔊 Réécouter",
    quiz_start_record: "🎙️ Commencer l'enregistrement",
    quiz_stop_record: "⏹️ Terminer et évaluer",
    quiz_answer_audio: "🔊 Écouter la prononciation correcte",
    quiz_level_completed_title: "🎉 Félicitations ! Quiz terminé !",
    quiz_score_summary: "Score final obtenu :",
    quiz_retry_btn: "🔄 Recommencer",
    quiz_next_level_btn: "Niveau suivant 🚀",

    // Niveaux
    grade_elem: "Primaire",
    grade_mid: "Collège",
    grade_high: "Lycée / Bac",
    category_basic: "Basique",

    // Connexion
    login_title: "🏫 Steve Voca Espace d'Apprentissage Intelligent",
    login_subtitle: "Entrez votre nom et votre code PIN à 4 chiffres pour vous connecter !",
    input_student_name_ph: "Nom de l'élève (ex: Jean Dupont)",
    input_pin_ph: "Code PIN à 4 chiffres (ex: 1234)",
    btn_student_login: "🚀 Commencer à étudier (Connexion élève)",
    btn_parent_login: "👨‍👩‍👧‍👦 Connexion Espace Parents",
    parent_modal_title: "👨‍👩‍👧‍👦 Rapport Parents & Suivi en direct",
    input_parent_name_ph: "Nom du parent",
    input_parent_pin_ph: "Code PIN parent à 4 chiffres (ex: 5678)",
    btn_parent_submit: "Accéder au tableau de bord parents",
    btn_close: "Fermer",
    admin_access_hint: "🔒 Administration de l'académie: /admin",
  }
};

/**
 * 번역 텍스트 반환 헬퍼 함수
 * @param {string} key 번역 키
 * @param {string} lang 언어 코드 ('ko', 'zh', 'fr')
 * @param {string} defaultVal 기본값 (옵션)
 */
export function t(key, lang = 'ko', defaultVal = '') {
  const currentDict = translations[lang] || translations.ko;
  if (currentDict && currentDict[key] !== undefined) {
    return currentDict[key];
  }
  const fallbackDict = translations.ko;
  if (fallbackDict && fallbackDict[key] !== undefined) {
    return fallbackDict[key];
  }
  return defaultVal || key;
}

/**
 * 학년 / 단계 번역 헬퍼
 */
export function translateGradeLevel(gradeStr, lang = 'ko') {
  if (!gradeStr) return t('grade_mid', lang);
  const clean = String(gradeStr).trim();
  if (clean.includes('초등') || clean.toLowerCase().includes('elementary')) {
    return t('grade_elem', lang);
  }
  if (clean.includes('중등') || clean.toLowerCase().includes('middle')) {
    return t('grade_mid', lang);
  }
  if (clean.includes('고등') || clean.includes('수능') || clean.toLowerCase().includes('high')) {
    return t('grade_high', lang);
  }
  return gradeStr;
}
