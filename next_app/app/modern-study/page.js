'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';
import { playUniversalAudio, initAudioUnlock } from '../../lib/audioPlayer.js';
import { getLocalDateString } from '../../lib/i18n.js';

// 학생/학부모 이름 이모지 제거 헬퍼
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

// 🌐 모던 스터디 6대 언어별 UI 사전
const studyI18n = {
  ko: {
    dashboardTitle: 'Daily Study & Progress',
    dashboardSubtitle: '오늘도 즐겁고 힘차게 단어 정복해 볼까요? ✨',
    dayVocaTitle: 'Day 1 Vocabulary',
    dayVocaSubtitle: '오늘의 단어 학습 — 10단어 완성',
    startStudyBtn: '단어 학습 시작하기 ➔',
    attendanceTitle: 'Attendance Calendar',
    attendanceSubtitle: '연속 출석 달력 — 5일 연속 달성 중 🔥',
    viewCalendarBtn: '출석 달력 보기 ➔',
    quizTitle: '4-Stage Quiz Challenge',
    quizSubtitle: '소리 ➔ 스펠링 ➔ 발음 ➔ 쓰기 4단계 퀴즈 마스터',
    startQuizBtn: '퀴즈 도전하기 ➔',
    soundBtn: '소리듣기',
    micBtn: '발음녹음',
    speedBtn: '속도조절',
    quizBtn: '퀴즈도전',
    flipHint: '👆 카드를 터치하면 뜻과 예문이 뒤집혀요',
    prevBtn: '◀ 이전',
    nextBtn: '다음 ▶',
    streak: '연속 출석',
    todayComplete: '오늘 학습 완료! 💮',
    todayIncomplete: '오늘의 학습 진행 중 ⏳',
    recordingHint: '🎙️ 녹음 중... 마이크에 대고 단어를 읽어주세요!',
    recordingDone: '✅ 녹음 완료! 점수:',
    navHome: '홈',
    navDeck: '단어학습',
    navQuiz: '퀴즈',
    navCalendar: '출석달력',
    navProfile: '내정보',
    logout: '로그아웃'
  },
  zh: {
    dashboardTitle: 'Daily Study & Progress',
    dashboardSubtitle: '今天也元气满满地征服新单词吧！✨',
    dayVocaTitle: 'Day 1 核心词汇',
    dayVocaSubtitle: '今日核心单词学习 — 完成 10 个词',
    startStudyBtn: '开始单词学习 ➔',
    attendanceTitle: '打卡签到日历',
    attendanceSubtitle: '连续签到日历 — 已连续打卡 5 天 🔥',
    viewCalendarBtn: '查看打卡日历 ➔',
    quizTitle: '4阶智能测验挑战',
    quizSubtitle: '听音 ➔ 拼写 ➔ 发音 ➔ 听写 四阶通关',
    startQuizBtn: '进入测验 ➔',
    soundBtn: '发音',
    micBtn: '录音',
    speedBtn: '语速',
    quizBtn: '测验',
    flipHint: '👆 点击卡片翻转查看释义与例句',
    prevBtn: '◀ 上一个',
    nextBtn: '下一个 ▶',
    streak: '连续打卡',
    todayComplete: '今日已完成签到！💮',
    todayIncomplete: '今日学习进行中 ⏳',
    recordingHint: '🎙️ 正在录音... 请对着麦克风大声朗读单词！',
    recordingDone: '✅ 录音完成！评分:',
    navHome: '首页',
    navDeck: '单词卡',
    navQuiz: '测验',
    navCalendar: '日历',
    navProfile: '我的',
    logout: '退出'
  },
  fr: {
    dashboardTitle: 'Daily Study & Progress',
    dashboardSubtitle: 'Prêt pour la session de vocabulaire du jour ? ✨',
    dayVocaTitle: 'Vocabulaire Jour 1',
    dayVocaSubtitle: 'Mots du jour — 10 mots au total',
    startStudyBtn: 'Commencer l\'étude ➔',
    attendanceTitle: 'Calendrier d\'assiduité',
    attendanceSubtitle: 'Série de 5 jours consécutifs 🔥',
    viewCalendarBtn: 'Voir le calendrier ➔',
    quizTitle: 'Défi Quiz 4 Niveaux',
    quizSubtitle: 'Écoute ➔ Orthographe ➔ Prononciation ➔ Écriture',
    startQuizBtn: 'Lancer le Quiz ➔',
    soundBtn: 'Son',
    micBtn: 'Micro',
    speedBtn: 'Vitesse',
    quizBtn: 'Quiz',
    flipHint: '👆 Touchez la carte pour la retourner',
    prevBtn: '◀ Précédent',
    nextBtn: 'Suivant ▶',
    streak: 'Série',
    todayComplete: 'Étude du jour validée ! 💮',
    todayIncomplete: 'Étude en cours ⏳',
    recordingHint: '🎙️ Enregistrement... Lisez le mot à haute voix !',
    recordingDone: '✅ Enregistré ! Score :',
    navHome: 'Accueil',
    navDeck: 'Cartes',
    navQuiz: 'Quiz',
    navCalendar: 'Calendrier',
    navProfile: 'Profil',
    logout: 'Déconnexion'
  },
  ja: {
    dashboardTitle: 'Daily Study & Progress',
    dashboardSubtitle: '今日も楽しく英単語をマスターしましょう！✨',
    dayVocaTitle: 'Day 1 英単語',
    dayVocaSubtitle: '本日の単語学習 — 10単語マスター',
    startStudyBtn: '単語学習を開始 ➔',
    attendanceTitle: '出席カレンダー',
    attendanceSubtitle: '連続出席カレンダー — 5日連続達成中 🔥',
    viewCalendarBtn: '出席カレンダーを見る ➔',
    quizTitle: '4段階クイズチャレンジ',
    quizSubtitle: '音声 ➔ スペル ➔ 発音 ➔ タイピング 4段階マスター',
    startQuizBtn: 'クイズに挑戦 ➔',
    soundBtn: '音声',
    micBtn: '録音',
    speedBtn: '速度',
    quizBtn: 'クイズ',
    flipHint: '👆 カードをタップすると裏面を表示します',
    prevBtn: '◀ 前へ',
    nextBtn: '次へ ▶',
    streak: '連続出席',
    todayComplete: '本日出席完了！💮',
    todayIncomplete: '本日の学習進行中 ⏳',
    recordingHint: '🎙️ 録音中... マイクに向かって単語を発音してください！',
    recordingDone: '✅ 録音完了！スコア:',
    navHome: 'ホーム',
    navDeck: '単語カード',
    navQuiz: 'クイズ',
    navCalendar: 'カレンダー',
    navProfile: 'マイページ',
    logout: 'ログアウト'
  },
  vi: {
    dashboardTitle: 'Daily Study & Progress',
    dashboardSubtitle: 'Cùng chinh phục từ vựng hôm nay nhé! ✨',
    dayVocaTitle: 'Từ vựng Ngày 1',
    dayVocaSubtitle: 'Học từ vựng hôm nay — Hoàn thành 10 từ',
    startStudyBtn: 'Bắt đầu học ➔',
    attendanceTitle: 'Lịch điểm danh',
    attendanceSubtitle: 'Chuỗi 5 ngày liên tiếp 🔥',
    viewCalendarBtn: 'Xem lịch điểm danh ➔',
    quizTitle: 'Thử thách 4 cấp độ',
    quizSubtitle: 'Âm thanh ➔ Đánh vần ➔ Phát âm ➔ Viết từ',
    startQuizBtn: 'Làm bài kiểm tra ➔',
    soundBtn: 'Phát âm',
    micBtn: 'Ghi âm',
    speedBtn: 'Tốc độ',
    quizBtn: 'Quiz',
    flipHint: '👆 Nhấn vào thẻ để lật xem nghĩa và ví dụ',
    prevBtn: '◀ Trước',
    nextBtn: 'Sau ▶',
    streak: 'Chuỗi học',
    todayComplete: 'Đã hoàn thành hôm nay! 💮',
    todayIncomplete: 'Đang tiến hành học ⏳',
    recordingHint: '🎙️ Đang ghi âm... Hãy đọc to từ vựng nhé!',
    recordingDone: '✅ Đã ghi âm! Điểm:',
    navHome: 'Trang chủ',
    navDeck: 'Thẻ từ',
    navQuiz: 'Quiz',
    navCalendar: 'Lịch',
    navProfile: 'Cá nhân',
    logout: 'Đăng xuất'
  },
  hi: {
    dashboardTitle: 'Daily Study & Progress',
    dashboardSubtitle: 'आज की शब्दावली सीखने के लिए तैयार हैं? ✨',
    dayVocaTitle: 'Day 1 शब्दावली',
    dayVocaSubtitle: 'आज का अध्ययन — 10 शब्द पूर्ण',
    startStudyBtn: 'अध्ययन शुरू करें ➔',
    attendanceTitle: 'उपस्थिति कैलेंडर',
    attendanceSubtitle: 'लगातार 5 दिन का स्ट्रीक 🔥',
    viewCalendarBtn: 'कैलेंडर देखें ➔',
    quizTitle: '4-स्तरीय क्विज चुनौती',
    quizSubtitle: 'ध्वनि ➔ स्पेलिंग ➔ उच्चारण ➔ लेखन',
    startQuizBtn: 'क्विज शुरू करें ➔',
    soundBtn: 'ध्वनि',
    micBtn: 'माइक',
    speedBtn: 'गति',
    quizBtn: 'क्विज',
    flipHint: '👆 अर्थ देखने के लिए कार्ड पर टैप करें',
    prevBtn: '◀ पिछला',
    nextBtn: 'अगला ▶',
    streak: 'लगातार',
    todayComplete: 'आज का अध्ययन पूर्ण! 💮',
    todayIncomplete: 'अध्ययन जारी है ⏳',
    recordingHint: '🎙️ रिकॉर्डिंग... कृपया जोर से बोलें!',
    recordingDone: '✅ पूर्ण! स्कोर:',
    navHome: 'होम',
    navDeck: 'कार्ड',
    navQuiz: 'क्विज',
    navCalendar: 'कैलेंडर',
    navProfile: 'प्रोफ़ाइल',
    logout: 'लॉगआउट'
  }
};

export default function ModernStudyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentLang, setCurrentLang] = useState('ko');
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'deck' | 'calendar' | 'quiz' | 'profile'
  
  // 📚 단어 데이터 상태
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0); // 0.7x, 1.0x, 1.4x, 2.0x

  // 🎙️ 녹음 & 발음 체크 상태
  const [isRecording, setIsRecording] = useState(false);
  const [recordedScore, setRecordedScore] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [recordingStatusText, setRecordingStatusText] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const userAudioPlayerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);

  // 📅 출석 달력 상태
  const todayStr = getLocalDateString();
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [stampedDates, setStampedDates] = useState([todayStr, '2026-08-26', '2026-08-25', '2026-08-24', '2026-08-23']);
  const [isTodayStamped, setIsTodayStamped] = useState(true);

  // ✍️ 퀴즈 상태 (1단계 소리 -> 2단계 스펠 -> 3단계 발음 -> 4단계 쓰기)
  const [quizLevel, setQuizLevel] = useState(1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(null);
  const [typingInput, setTypingInput] = useState('');

  // 🎯 학생 친화적 발음 유사도 점수(0~100점) 판정 알고리즘
  const calculateMatchScore = (targetStr, spokenStr) => {
    if (!targetStr) return 0;
    const cleanTarget = targetStr.toLowerCase().replace(/[^a-z]/g, '');
    const cleanSpoken = (spokenStr || '').toLowerCase().replace(/[^a-z]/g, '');

    if (!cleanSpoken || cleanSpoken.trim() === '') {
      return 50; // 마이크 감지되었으나 단어 미인식 시 기본 격려 점수
    }

    // 1. 완전 일치
    if (cleanTarget === cleanSpoken) return 100;

    // 2. 포함 관계 (예: "an apple", "the cat")
    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      return 95;
    }

    // 3. 음소 정규화 매칭 (ph/f, ck/k, th/t, z/s 등)
    const normalizePhonetics = (s) => {
      return s
        .replace(/ph/g, 'f')
        .replace(/ck/g, 'k')
        .replace(/c(?=[eiy])/g, 's')
        .replace(/c/g, 'k')
        .replace(/q/g, 'k')
        .replace(/z/g, 's')
        .replace(/x/g, 'ks')
        .replace(/th/g, 't')
        .replace(/[aeiouy]+/g, 'a');
    };

    const normTarget = normalizePhonetics(cleanTarget);
    const normSpoken = normalizePhonetics(cleanSpoken);

    if (normTarget === normSpoken) return 92;
    if (normSpoken.includes(normTarget) || normTarget.includes(normSpoken)) return 88;

    // 4. 레벤슈타인 편집 거리 기반 점수 산출
    let m = cleanTarget.length, n = cleanSpoken.length;
    let dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (cleanTarget[i - 1] === cleanSpoken[j - 1]) dp[i][j] = dp[i - 1][j - 1];
        else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    const dist = dp[m][n];
    if (dist === 1) return 88;
    if (dist === 2) return 78;
    if (dist === 3) return 65;

    const maxLen = Math.max(cleanTarget.length, cleanSpoken.length, 1);
    const similarity = Math.max(0, 1 - dist / maxLen);
    return Math.max(45, Math.round(similarity * 100));
  };

  // 🤖 AI 발음 교정 가이드 팁 엔진 (다국어 지원)
  const getAIPronunciationGuideTip = (targetWordStr, score, lang = 'ko') => {
    if (!targetWordStr) return null;
    const cleanWord = targetWordStr.toLowerCase().trim();

    if (score !== null && score !== undefined) {
      if (score >= 85) {
        return {
          icon: '🎉',
          title: lang === 'zh' ? '🤖 AI 发音完美赞赏！' : (lang === 'fr' ? '🤖 Félicitations IA !' : (lang === 'ja' ? '🤖 AI 発音パーフェクト称賛！' : (lang === 'vi' ? '🤖 AI Khen ngợi phát âm hoàn hảo!' : (lang === 'hi' ? '🤖 AI उत्कृष्ट उच्चारण प्रशंसा!' : '🤖 AI 발음 완벽 칭찬!')))),
          text: lang === 'zh'
            ? `[${targetWordStr}] 母语级完美的舌位与唇形！语调极其自然标准。👏`
            : (lang === 'fr'
            ? `[${targetWordStr}] Position de la langue et des lèvres digne d'un locuteur natif ! 👏`
            : (lang === 'ja'
            ? `[${targetWordStr}] ネイティブレベルの完璧な舌の位置と口の形です！👏`
            : (lang === 'vi'
            ? `[${targetWordStr}] Vị trí lưỡi và khẩu hình chuẩn như người bản xứ! 👏`
            : (lang === 'hi'
            ? `[${targetWordStr}] मूल वक्ता स्तर की सही जीभ स्थिति और उच्चारण! 👏`
            : `[${targetWordStr}] 원어민 수준의 완벽한 혀 위치와 입모양입니다! 억양과 발음이 아주 부드럽고 훌륭합니다. 👏`)))),
          color: '#059669',
          bg: '#ECFDF5',
          border: '#A7F3D0'
        };
      }
      if (score >= 65) {
        return {
          icon: '👍',
          title: lang === 'zh' ? '🤖 AI 发音合格赞赏！' : (lang === 'fr' ? '🤖 Bravo, validé !' : (lang === 'ja' ? '🤖 AI 合格称賛！' : (lang === 'vi' ? '🤖 AI Khen ngợi đạt chuẩn!' : (lang === 'hi' ? '🤖 AI सफल उच्चारण प्रशंसा!' : '🤖 AI 발음 통과 칭찬!')))),
          text: lang === 'zh'
            ? `[${targetWordStr}] 恭喜达到65分以上合格标准！发音清晰响亮，继续保持！🌟`
            : (lang === 'fr'
            ? `[${targetWordStr}] Félicitations pour avoir dépassé 65 points ! Prononciation claire et nette ! 🌟`
            : (lang === 'ja'
            ? `[${targetWordStr}] 65点以上の合格基準達成！発音も明瞭で素晴らしいです！🌟`
            : (lang === 'vi'
            ? `[${targetWordStr}] Chúc mừng đạt trên 65 điểm! Phát âm rõ ràng và tự tin! 🌟`
            : (lang === 'hi'
            ? `[${targetWordStr}] 65 से अधिक अंक प्राप्त करने पर बधाई! अच्छा उच्चारण! 🌟`
            : `[${targetWordStr}] 65점 이상 합격 기준을 멋지게 달성했어요! 자신감 있는 또박또박한 발음이 아주 좋습니다. 🌟`)))),
          color: '#0284C7',
          bg: '#F0F9FF',
          border: '#BAE6FD'
        };
      }
    }

    // 음소별 (R/L, TH, V/F, SH/CH) 맞춤 혀위치 & 입모양 피드백
    if (cleanWord.includes('r')) {
      return {
        icon: '👅',
        title: lang === 'zh' ? '🤖 AI 舌位纠正 [R 发音]' : (lang === 'fr' ? '🤖 Conseil IA langue [Son R]' : (lang === 'ja' ? '🤖 AI 舌の位置 [R 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình [Âm R]' : (lang === 'hi' ? '🤖 AI जीभ स्थिति [R]' : '🤖 AI 혀 위치 교정 [R 발음]')))),
        text: lang === 'zh'
          ? '发 R 音时舌尖切勿触碰上颚，舌头向口腔内轻微卷起发出圆润卷舌音！'
          : (lang === 'fr'
          ? 'Pour le son R, ne touchez pas le palais avec la langue, reculez-la légèrement !'
          : (lang === 'ja'
          ? 'Rの発音時、舌先を口蓋につけず、奥に少し丸めて「ウー」と響かせましょう！'
          : (lang === 'vi'
          ? 'Khi phát âm R, không chạm đầu lưỡi vào vòm miệng mà uốn nhẹ vào trong!'
          : (lang === 'hi'
          ? 'R बोलते समय जीभ की नोक को तालू से न छुएं, बल्कि मुंह के अंदर हल्का मोड़ें!'
          : 'R 발음 시 혀끝을 입천장에 대지 않고 입 안쪽으로 살짝 구부려 소리를 굴려보세요!')))),
        color: '#D97706',
        bg: '#FFFBEB',
        border: '#FDE68A'
      };
    }

    if (cleanWord.includes('l')) {
      return {
        icon: '👅',
        title: lang === 'zh' ? '🤖 AI 舌位纠正 [L 发音]' : (lang === 'fr' ? '🤖 Conseil IA langue [Son L]' : (lang === 'ja' ? '🤖 AI 舌の位置 [L 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình [Âm L]' : (lang === 'hi' ? '🤖 AI जीभ स्थिति [L]' : '🤖 AI 혀 위치 교정 [L 발음]')))),
        text: lang === 'zh'
          ? '发 L 音时，将舌尖顶住上门牙正后方的齿龈并清脆弹开！'
          : (lang === 'fr'
          ? 'Pour le son L, appuyez la pointe de la langue derrière les dents du haut puis relâchez !'
          : (lang === 'ja'
          ? 'Lの発音時、舌先を上の前歯の裏側にしっかりつけてから離しましょう！'
          : (lang === 'vi'
          ? 'Khi phát âm L, hãy đặt đầu lưỡi chạm vào chân răng hàm trên rồi bật nhẹ ra!'
          : (lang === 'hi'
          ? 'L बोलते समय जीभ की नोक को ऊपरी दांतों के पीछे तालू पर दबाएं!'
          : 'L 발음 시 혀끝을 윗니 바로 뒤 입천장에 꾹 대었다가 \'얼-\' 소리를 내며 떼어보세요!')))),
        color: '#0284C7',
        bg: '#F0F9FF',
        border: '#BAE6FD'
      };
    }

    if (cleanWord.includes('th')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇齿纠正 [TH 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son TH]' : (lang === 'ja' ? '🤖 AI 口の形 [TH 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình [Âm TH]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा [TH]' : '🤖 AI 입모양 교정 [TH 발음]')))),
        text: lang === 'zh'
          ? '将舌尖轻咬在上下门牙之间，呼气摩擦发出清脆气流音！'
          : (lang === 'fr'
          ? 'Placez le bout de la langue entre les dents du haut et du bas et soufflez !'
          : (lang === 'ja'
          ? '舌先を上下の前歯で軽く挟み、空気を吹き出しながら摩擦音を出しましょう！'
          : (lang === 'vi'
          ? 'Đặt đầu lưỡi nhẹ nhàng giữa hai hàm răng và đẩy luồng hơi ra ngoài!'
          : (lang === 'hi'
          ? 'जीभ की नोक को ऊपरी और निचले दांतों के बीच थोड़ा दबाएं और हवा बाहर निकालें!'
          : '혀끝을 윗니와 아랫니 사이에 살짝 물었다가 바람을 뿜어내며 소리를 내보세요!')))),
        color: '#7C3AED',
        bg: '#F5F3FF',
        border: '#DDD6FE'
      };
    }

    if (cleanWord.includes('v') || cleanWord.includes('f')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇齿纠正 [V / F 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son V / F]' : (lang === 'ja' ? '🤖 AI 口の形 [V / F 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình [Âm V / F]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा [V / F]' : '🤖 AI 입모양 교정 [V / F 발음]')))),
        text: lang === 'zh'
          ? '用上门牙轻轻咬住下嘴唇内侧，缓缓送出摩擦气流！'
          : (lang === 'fr'
          ? 'Posez les dents supérieures sur la lèvre inférieure et soufflez doucement !'
          : (lang === 'ja'
          ? '上の前歯で下唇を軽く押さえ、すき間から息をこするように音を出しましょう！'
          : (lang === 'vi'
          ? 'Dùng răng cửa trên chạm nhẹ vào môi dưới và thổi luồng hơi ra!'
          : (lang === 'hi'
          ? 'ऊपरी दांतों से निचले होंठ को हल्का दबाएं और हवा को बाहर निकालें!'
          : '윗니로 아랫입술을 가볍게 지그시 누르고 공기를 스치듯이 바람 소리를 불어내보세요!')))),
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FECACA'
      };
    }

    return {
      icon: '💡',
      title: lang === 'zh' ? '🤖 AI 原声语调建议' : (lang === 'fr' ? '🤖 Conseil IA intonation' : (lang === 'ja' ? '🤖 AI イントネーション' : (lang === 'vi' ? '🤖 Mẹo ngữ điệu AI' : (lang === 'hi' ? '🤖 AI लय सुझाव' : '🤖 AI 원어민 억양 교정 팁')))),
      text: lang === 'zh'
        ? '可使用 0.7x 慢速播放试听，并注意提高带有重音（Accent）的音节！'
        : (lang === 'fr'
        ? 'Écoutez en 0.7x ralenti et accentuez la syllabe tonique !'
        : (lang === 'ja'
        ? '0.7x スロー再生を聞きながら、アクセントが入る音節を強調して読んでみましょう！'
        : (lang === 'vi'
        ? 'Nghe ở tốc độ 0.7x và nhấn mạnh vào âm tiết có trọng âm (Accent)!'
        : (lang === 'hi'
        ? '0.7x धीमी गति से सुनें और बलाघात (Accent) वाले शब्दांश पर जोर दें!'
        : '0.7x 슬로우 배속으로 원어민 발음을 들으면서 강세(Accent)가 들어가는 음절을 높여 읽어보세요!')))),
      color: '#0284C7',
      bg: '#F0F9FF',
      border: '#BAE6FD'
    };
  };

  // 1. 세션 및 로컬 사용자 데이터 로드
  useEffect(() => {
    initAudioUnlock();
    try {
      const savedLang = localStorage.getItem('steve_voca_lang') || localStorage.getItem('flipvoca_lang');
      if (savedLang && studyI18n[savedLang]) {
        setCurrentLang(savedLang);
      }
      const savedUserStr = localStorage.getItem('english_edu_current_user');
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr);
        setCurrentUser(parsed);
      } else {
        const defaultUser = {
          id: 'lsh_20260807_000001',
          name: '이상학',
          grade: '대학생 및 성인',
          studyGradeLevel: '초등단어',
          dailyWordCount: '10'
        };
        setCurrentUser(defaultUser);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 2. 단어 데이터 로드 (Supabase 우선, fallback wordsData)
  useEffect(() => {
    async function loadWords() {
      try {
        const { data: dbWords, error } = await supabase
          .from('words')
          .select('*')
          .limit(50);
        
        if (!error && dbWords && dbWords.length > 0) {
          setWords(dbWords);
        } else {
          setWords(wordList500Fallback.slice(0, 30));
        }
      } catch (err) {
        setWords(wordList500Fallback.slice(0, 30));
      }
    }
    loadWords();
  }, []);

  const currentStrings = studyI18n[currentLang] || studyI18n.ko;
  const currentWord = words[currentIndex] || wordList500Fallback[0];

  // 🔊 TTS 재생 함수
  const handlePlaySound = (wordToPlay) => {
    const target = wordToPlay || currentWord?.word || 'Apple';
    playUniversalAudio(target, { rate: ttsSpeed });
  };

  // ⏱️ 배속 토글 함수 (0.7x -> 1.0x -> 1.4x -> 2.0x)
  const toggleSpeed = () => {
    const speeds = [0.7, 1.0, 1.4, 2.0];
    const nextIdx = (speeds.indexOf(ttsSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setTtsSpeed(nextSpeed);
    playUniversalAudio(currentWord?.word || 'Apple', { rate: nextSpeed });
  };

  // 🎧 사용자 녹음 음성 재생 함수
  const playUserRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
    }
    const audio = new Audio(recordedAudioUrl);
    userAudioPlayerRef.current = audio;
    setIsPlayingUserAudio(true);
    audio.onended = () => setIsPlayingUserAudio(false);
    audio.play();
  };

  // 🎙️ AI 실시간 음성 녹음 및 발음 체크 시작 / 중지 함수
  const toggleRecording = async () => {
    if (isRecording) {
      // 녹음 중단
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    } else {
      // 녹음 시작
      try {
        setRecordedScore(null);
        setRecognizedText('');
        setRecordedAudioUrl(null);
        setRecordingStatusText(currentStrings.recordingHint);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        const targetWordStr = currentWord?.word || 'Apple';
        let spokenResult = '';

        // 1. Web Speech API 음성 인식 활성화
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          recognition.onresult = (event) => {
            if (event.results && event.results[0] && event.results[0][0]) {
              spokenResult = event.results[0][0].transcript || '';
              setRecognizedText(spokenResult);
            }
          };

          recognition.onerror = (e) => {
            console.log('Speech recognition event', e);
          };

          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {}
        }

        // 2. MediaRecorder 음성 바이너리 캡처
        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);

          // 🎯 발음 일치율 % 계산
          const finalScore = calculateMatchScore(targetWordStr, spokenResult);
          setRecordedScore(finalScore);
          setRecordingStatusText(
            finalScore >= 85
              ? `🎉 ${finalScore}점! 원어민 수준의 완벽한 발음입니다! ⭐`
              : finalScore >= 65
              ? `👍 ${finalScore}점! 아주 훌륭한 발음입니다! 🌟`
              : `💡 ${finalScore}점! 아래 AI 코칭 팁을 보고 다시 도전해 보세요!`
          );
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);

        // 3. 실시간 오디오 파형 시각화
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const drawWave = () => {
          if (!canvasRef.current || !analyserRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / bufferLength) * 2.2;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            ctx.fillStyle = `hsl(${i * 12 + 165}, 90%, 45%)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1.5, barHeight);
            x += barWidth;
          }
          animFrameRef.current = requestAnimationFrame(drawWave);
        };
        drawWave();

      } catch (err) {
        alert('마이크 접근 권한이 필요합니다.');
        setIsRecording(false);
      }
    }
  };

  // 단어 이동 핸들러
  const handlePrev = () => {
    setIsFlipped(false);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordedAudioUrl(null);
    setRecordingStatusText('');
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : words.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordedAudioUrl(null);
    setRecordingStatusText('');
    setCurrentIndex((prev) => (prev < words.length - 1 ? prev + 1 : 0));
  };

  // 🚪 로그아웃 처리
  const handleLogout = () => {
    try {
      localStorage.removeItem('english_edu_current_user');
    } catch (e) {}
    router.push('/modern-login');
  };

  // 다국어 뜻 헬퍼
  const getWordMeaning = (w) => {
    if (!w) return '';
    if (currentLang === 'zh') return w.meaning_zh || w.meaning;
    if (currentLang === 'fr') return w.meaning_fr || w.meaning;
    if (currentLang === 'ja') return w.meaning_ja || w.meaning;
    if (currentLang === 'vi') return w.meaning_vi || w.meaning;
    if (currentLang === 'hi') return w.meaning_hi || w.meaning;
    return w.meaning || '';
  };

  const getExampleSentences = (w) => {
    if (!w) return { en: '', trans: '' };
    const en = w.example_en || w.exampleEn || 'I love learning new words.';
    let trans = w.example_ko || w.exampleKo || '나는 새로운 단어를 배우는 것을 좋아해요.';
    if (currentLang === 'zh') trans = w.example_zh || trans;
    if (currentLang === 'fr') trans = w.example_fr || trans;
    if (currentLang === 'ja') trans = w.example_ja || trans;
    if (currentLang === 'vi') trans = w.example_vi || trans;
    if (currentLang === 'hi') trans = w.example_hi || trans;
    return { en, trans };
  };

  // 🖼️ 고화질 단어 이미지 로드 및 스마트 폴백 시스템
  const getWordImgSrc = (wordObj) => {
    if (!wordObj) return '/word_img/apple.png';
    const rawFile = (wordObj.image_url || wordObj.imageUrl || '').split('/').pop().trim();
    if (rawFile && rawFile.endsWith('.png')) {
      const cleanRaw = rawFile.toLowerCase().replace(/\s+/g, '_');
      return `/word_img/${cleanRaw}`;
    }
    const wordClean = (wordObj.word || '').replace(/\.png/gi, '').trim();
    if (!wordClean) return '/word_img/apple.png';
    const wordLower = wordClean.toLowerCase().replace(/\s+/g, '_');
    return `/word_img/${wordLower}.png`;
  };

  const handleImageError = (e, wordStr) => {
    const target = e.target;
    const currentSrc = target.src || '';
    const wordClean = (wordStr || '').replace(/\.png/gi, '').trim();
    const wordLower = wordClean.toLowerCase();
    const wordUnder = wordLower.replace(/ /g, '_');
    const wordNoSpace = wordLower.replace(/[\s\-_]/g, '');
    const wordCap = wordClean ? wordClean.charAt(0).toUpperCase() + wordClean.slice(1) : '';

    if (!currentSrc.includes(`/${wordUnder}.png`)) {
      target.src = `/word_img/${wordUnder}.png`;
    } else if (!currentSrc.includes(`/${wordNoSpace}.png`)) {
      target.src = `/word_img/${wordNoSpace}.png`;
    } else if (!currentSrc.includes(`/${wordCap}.png`)) {
      target.src = `/word_img/${wordCap}.png`;
    } else if (!currentSrc.includes('supabase.co')) {
      target.src = `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${wordLower}.png`;
    } else {
      const firstLetter = wordCap ? wordCap.charAt(0).toUpperCase() : '📖';
      target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="100%" height="100%" fill="%23FFFFFF" rx="20"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%2300A8BF">${encodeURIComponent(firstLetter)}</text><text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="%2364748B">${encodeURIComponent(wordClean || 'Word')}</text></svg>`;
      target.onerror = null;
    }
  };

  const example = getExampleSentences(currentWord);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #E6FAFC 0%, #E0F2FE 45%, #F0FDF4 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px 10px',
      fontFamily: '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* 📱 모바일 스마트폰 컨테이너 */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: '740px',
        background: '#FFFFFF',
        borderRadius: '36px',
        boxShadow: '0 25px 60px -15px rgba(0, 168, 191, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* 🌟 상단 앱 헤더 (로고 & 학생 프로필 & 로그아웃) */}
        <header style={{
          padding: '14px 18px 10px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid #F1F5F9'
        }}>
          {/* 좌측 로고 & 학생 뱃지 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/image/flipvoca_logo.png"
              alt="FlipVoca"
              onClick={() => setCurrentTab('dashboard')}
              style={{
                height: '32px',
                width: 'auto',
                objectFit: 'contain',
                cursor: 'pointer',
                filter: 'drop-shadow(0 2px 4px rgba(0, 166, 251, 0.15))'
              }}
            />
            <div style={{
              background: '#E6FAFC',
              padding: '3px 8px',
              borderRadius: '12px',
              border: '1px solid #BAE8EE',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: '800',
              color: '#008294'
            }}>
              <span>👤 {currentUser?.name || '학생'}</span>
            </div>
          </div>

          {/* 우측 언어 & 로그아웃 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <select
              value={currentLang}
              onChange={(e) => {
                const l = e.target.value;
                setCurrentLang(l);
                try {
                  localStorage.setItem('steve_voca_lang', l);
                  localStorage.setItem('flipvoca_lang', l);
                } catch (err) {}
              }}
              style={{
                padding: '4px 6px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                fontSize: '11px',
                fontWeight: '700',
                color: '#475569',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ko">🇰🇷 한국어</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="ja">🇯🇵 日本語</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="hi">🇮🇳 हिन्दी</option>
            </select>

            <button
              onClick={handleLogout}
              style={{
                padding: '5px 10px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                background: '#F1F5F9',
                color: '#64748B',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              🚪 {currentStrings.logout}
            </button>
          </div>
        </header>

        {/* 📱 메인 인터랙티브 뷰포트 영역 (탭에 따라 전환) */}
        <main style={{
          flex: 1,
          padding: '16px 18px 75px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>

          {/* ═══════════════════════════════════════════════════════
              TAB 1: 🌟 DASHBOARD (Daily Study & Progress 카드 3종)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* 대시보드 헤더 인사말 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 2px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: '0 4px 12px rgba(0, 168, 191, 0.25)',
                  flexShrink: 0
                }}>
                  🧑‍🎓
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#1E293B' }}>
                    {currentStrings.dashboardTitle}
                  </h2>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#64748B' }}>
                    {currentStrings.dashboardSubtitle}
                  </p>
                </div>
              </div>

              {/* 🎴 CARD 1: Day 1 Vocabulary (오늘의 단어 학습 카드) */}
              <div
                onClick={() => { setCurrentTab('deck'); handlePlaySound(currentWord?.word); }}
                style={{
                  background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 50%, #0284C7 100%)',
                  borderRadius: '26px',
                  padding: '22px 20px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 12px 28px rgba(0, 168, 191, 0.32)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: '18px', right: '18px', fontSize: '26px' }}>
                  🌸
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                  {currentStrings.dayVocaTitle}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', opacity: 0.95, marginBottom: '14px' }}>
                  {currentStrings.dayVocaSubtitle}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '900',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}>
                  {currentStrings.startStudyBtn}
                </div>
              </div>

              {/* 📅 CARD 2: Attendance Calendar (출석 달력 카드) */}
              <div
                onClick={() => setCurrentTab('calendar')}
                style={{
                  background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                  borderRadius: '26px',
                  padding: '22px 20px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 12px 28px rgba(96, 165, 250, 0.32)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  position: 'absolute',
                  top: '18px',
                  right: '18px',
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '4px 8px',
                  color: '#2563EB',
                  fontWeight: '900',
                  fontSize: '14px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                  📅 5
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                  {currentStrings.attendanceTitle}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '700', opacity: 0.95, marginBottom: '14px' }}>
                  {currentStrings.attendanceSubtitle}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '900',
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}>
                  {currentStrings.viewCalendarBtn}
                </div>
              </div>

              {/* ⭐ CARD 3: 4-Stage Quiz Challenge (퀴즈 마스터 카드) */}
              <div
                onClick={() => setCurrentTab('quiz')}
                style={{
                  background: 'linear-gradient(135deg, #3730A3 0%, #1E1B4B 100%)',
                  borderRadius: '26px',
                  padding: '22px 20px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: '0 12px 28px rgba(55, 48, 163, 0.32)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: '18px', right: '18px', fontSize: '26px' }}>
                  ⭐
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.3px' }}>
                  {currentStrings.quizTitle}
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, marginBottom: '14px' }}>
                  {currentStrings.quizSubtitle}
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '900',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {currentStrings.startQuizBtn}
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: 🎴 3D FLASHCARD DECK (양면 플립 카드 학습 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'deck' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
              
              {/* 진행률 인디케이터 바 */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#008294' }}>
                  단어 {currentIndex + 1} / {words.length || 10}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '10px' }}>
                  배속: {ttsSpeed}x
                </span>
              </div>

              {/* 🎴 3D 플립 카드 컨테이너 */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                style={{
                  perspective: '1000px',
                  width: '100%',
                  height: '340px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}>
                  {/* 카드 앞면 (Front Face - 고화질 이미지 & 영단어 & 발음기호 & 뜻) */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    borderRadius: '32px',
                    background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 50%, #0284C7 100%)',
                    color: '#FFFFFF',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 18px 36px rgba(0, 168, 191, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}>
                    {/* 상단 뱃지 & 카테고리 */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {currentWord?.category || '초등단어 🍎'}
                      </span>

                      <span style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '11px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>🧠</span> 3D Flip
                      </span>
                    </div>

                    {/* 🖼️ 중앙 고화질 단어 일러스트 이미지 */}
                    <div style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '24px',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px',
                      boxShadow: '0 10px 24px rgba(0, 0, 0, 0.14)',
                      border: '2px solid rgba(255, 255, 255, 0.9)',
                      margin: '2px 0'
                    }}>
                      <img
                        src={getWordImgSrc(currentWord)}
                        alt={currentWord?.word}
                        onError={(e) => handleImageError(e, currentWord?.word)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain'
                        }}
                      />
                    </div>

                    {/* 영단어 & 발음기호 & 뜻 */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1.1, textShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                        {currentWord?.word}
                      </div>

                      <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '700', margin: '2px 0 6px 0' }}>
                        {currentWord?.phonics || '/---/'}
                      </div>

                      <div style={{ fontSize: '17px', fontWeight: '900', background: 'rgba(255, 255, 255, 0.22)', padding: '4px 16px', borderRadius: '14px', display: 'inline-block' }}>
                        {getWordMeaning(currentWord)}
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: '800' }}>
                      {currentStrings.flipHint}
                    </div>
                  </div>

                  {/* 카드 뒷면 (Back Face - 예문 & 해석) */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: '32px',
                    background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                    color: '#FFFFFF',
                    padding: '20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 18px 36px rgba(96, 165, 250, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}>
                    {/* 상단 미니 썸네일 & 단어 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFFFFF', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <img
                          src={getWordImgSrc(currentWord)}
                          alt={currentWord?.word}
                          onError={(e) => handleImageError(e, currentWord?.word)}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: '900' }}>{currentWord?.word}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '700' }}>{getWordMeaning(currentWord)}</div>
                      </div>
                    </div>

                    {/* 중앙 예문 카드 */}
                    <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.18)', borderRadius: '20px', padding: '16px', backdropFilter: 'blur(8px)', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '0.5px', opacity: 0.85, marginBottom: '6px' }}>
                        📝 EXAMPLE SENTENCE
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '900', lineHeight: 1.35, marginBottom: '8px' }}>
                        "{example.en}"
                      </div>
                      <div style={{ fontSize: '13px', opacity: 0.95, fontWeight: '700', lineHeight: 1.35, color: '#FEF08A' }}>
                        {example.trans}
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: '800' }}>
                      👆 카드를 터치하면 앞면으로 돌아갑니다
                    </div>
                  </div>
                </div>
              </div>

              {/* 🎙️ 실시간 파형 캔버스 (녹음 중일 때 표시) */}
              {isRecording && (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#FEF2F2',
                  padding: '12px',
                  borderRadius: '20px',
                  border: '1.5px solid #FECACA',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.12)'
                }}>
                  <canvas ref={canvasRef} width={280} height={40} style={{ borderRadius: '10px', background: '#FFFFFF' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }}></span>
                    <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: '900' }}>
                      🎙️ 음성 녹음 중... "{currentWord?.word}" 발음해 보세요!
                    </span>
                  </div>
                </div>
              )}

              {/* 🎯 AI 발음 평가 & 코칭 피드백 카드 (녹음 완료 시 노출) */}
              {recordedScore !== null && !isRecording && (
                <div style={{
                  width: '100%',
                  background: recordedScore >= 85 ? '#F0FDF4' : recordedScore >= 65 ? '#F0F9FF' : '#FFFBEB',
                  borderRadius: '24px',
                  padding: '16px 18px',
                  border: recordedScore >= 85 ? '2px solid #86EFAC' : recordedScore >= 65 ? '2px solid #BAE6FD' : '2px solid #FDE68A',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {/* 상단 점수 뱃지 & 인식 텍스트 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '22px',
                        fontWeight: '900',
                        color: recordedScore >= 85 ? '#16A34A' : recordedScore >= 65 ? '#0284C7' : '#D97706'
                      }}>
                        {recordedScore}점
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: recordedScore >= 85 ? '#DCFCE7' : recordedScore >= 65 ? '#E0F2FE' : '#FEF3C7',
                        color: recordedScore >= 85 ? '#15803D' : recordedScore >= 65 ? '#0369A1' : '#B45309'
                      }}>
                        {recordedScore >= 85 ? '🌟 원어민급 발음' : recordedScore >= 65 ? '👍 합격 수준' : '💡 연습 필요'}
                      </span>
                    </div>

                    {recognizedText && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                        인식된 발음: <strong style={{ color: '#1E293B' }}>"{recognizedText}"</strong>
                      </span>
                    )}
                  </div>

                  {/* AI 입모양/혀위치 교정 코칭 피드백 */}
                  {(() => {
                    const tip = getAIPronunciationGuideTip(currentWord?.word, recordedScore, currentLang);
                    if (!tip) return null;
                    return (
                      <div style={{
                        background: '#FFFFFF',
                        borderRadius: '16px',
                        padding: '12px',
                        border: `1px solid ${tip.border}`,
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start'
                      }}>
                        <span style={{ fontSize: '20px' }}>{tip.icon}</span>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: tip.color, marginBottom: '2px' }}>
                            {tip.title}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', lineHeight: 1.35 }}>
                            {tip.text}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 오디오 다시듣기 & 원어민 비교 버튼 그룹 */}
                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '2px' }}>
                    {recordedAudioUrl && (
                      <button
                        type="button"
                        onClick={playUserRecordedAudio}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          borderRadius: '14px',
                          border: '1.5px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#1E293B',
                          fontSize: '12px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isPlayingUserAudio ? '⏹️ 재생 중...' : '🎧 내 발음 듣기'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePlaySound(currentWord?.word)}
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 4px 10px rgba(0, 168, 191, 0.25)'
                      }}
                    >
                      🔊 원어민 비교
                    </button>
                  </div>
                </div>
              )}

              {/* 🎛️ 하단 4대 액션 서클 버튼 (Sound, Mic, Quiz, Speed) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                width: '100%',
                marginTop: '4px'
              }}>
                {/* 1. Sound */}
                <button
                  type="button"
                  onClick={() => handlePlaySound(currentWord?.word)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '12px 6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E6FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    🔊
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>{currentStrings.soundBtn}</span>
                </button>

                {/* 2. Mic */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: isRecording ? '#FEE2E2' : '#FFFFFF',
                    border: isRecording ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '12px 6px',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: isRecording ? '#EF4444' : '#F0FDF4', color: isRecording ? '#FFF' : '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    🎙️
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: isRecording ? '#DC2626' : '#475569' }}>
                    {isRecording ? '정지' : currentStrings.micBtn}
                  </span>
                </button>

                {/* 3. Quiz */}
                <button
                  type="button"
                  onClick={() => setCurrentTab('quiz')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '12px 6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    ❓
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>{currentStrings.quizBtn}</span>
                </button>

                {/* 4. Speed */}
                <button
                  type="button"
                  onClick={toggleSpeed}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '20px',
                    padding: '12px 6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: '#2563EB' }}>
                    {ttsSpeed}x
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569' }}>{currentStrings.speedBtn}</span>
                </button>
              </div>

              {/* 이전 / 다음 내비게이션 바 */}
              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    flex: 1,
                    padding: '13px',
                    borderRadius: '16px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {currentStrings.prevBtn}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  style={{
                    flex: 1,
                    padding: '13px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 168, 191, 0.35)'
                  }}
                >
                  {currentStrings.nextBtn}
                </button>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: 📅 ATTENDANCE CALENDAR (출석 달력 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'calendar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '20px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#1E293B' }}>
                    📅 {calendarYear}년 {calendarMonth + 1}월 출석표
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#10B981', background: '#D1FAE5', padding: '3px 8px', borderRadius: '10px' }}>
                    🔥 5일 연속 출석 중
                  </span>
                </div>

                {/* 요일 헤더 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: '800', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
                  <span style={{ color: '#EF4444' }}>일</span>
                  <span>월</span>
                  <span>화</span>
                  <span>수</span>
                  <span>목</span>
                  <span>금</span>
                  <span style={{ color: '#3B82F6' }}>토</span>
                </div>

                {/* 달력 날짜 그리드 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                    const dStr = `2026-08-${String(d).padStart(2, '0')}`;
                    const isStamped = stampedDates.includes(dStr);
                    const isToday = d === 27;

                    return (
                      <div
                        key={d}
                        style={{
                          height: '42px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '12px',
                          background: isStamped ? '#E6FAFC' : isToday ? '#F1F5F9' : 'transparent',
                          border: isToday ? '1.5px solid #00A8BF' : '1px solid transparent',
                          color: isStamped ? '#008294' : '#334155',
                          fontWeight: isStamped || isToday ? '900' : '600',
                          fontSize: '12px'
                        }}
                      >
                        <span>{d}</span>
                        {isStamped && <span style={{ fontSize: '10px' }}>💮</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 출석 도장 안내 카드 */}
              <div style={{
                background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                padding: '16px',
                borderRadius: '20px',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '26px' }}>💮</span>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '15px' }}>{currentStrings.todayComplete}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>매일 단어 10개를 학습하면 도장이 자동으로 찍힙니다.</div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 4: ✍️ 4-STAGE QUIZ (4단계 퀴즈 마스터 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'quiz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* 퀴즈 단계 선택 뱃지 */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                  { lvl: 1, label: '1단계 🔊 소리' },
                  { lvl: 2, label: '2단계 🔤 스펠' },
                  { lvl: 3, label: '3단계 🎙️ 발음' },
                  { lvl: 4, label: '4단계 ✍️ 쓰기' }
                ].map((item) => (
                  <button
                    key={item.lvl}
                    onClick={() => {
                      setQuizLevel(item.lvl);
                      setSelectedAnswer(null);
                      setIsAnswerChecked(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      background: quizLevel === item.lvl ? 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)' : '#F1F5F9',
                      color: quizLevel === item.lvl ? '#FFFFFF' : '#64748B',
                      boxShadow: quizLevel === item.lvl ? '0 4px 10px rgba(0,168,191,0.25)' : 'none'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 퀴즈 카드 박스 */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px 20px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#00A8BF' }}>
                  Question 1 / 5
                </div>

                {/* 1단계 소리 퀴즈 */}
                {quizLevel === 1 && (
                  <>
                    <button
                      onClick={() => handlePlaySound(currentWord?.word)}
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                        color: '#FFF',
                        fontSize: '32px',
                        cursor: 'pointer',
                        boxShadow: '0 8px 20px rgba(0, 168, 191, 0.35)'
                      }}
                    >
                      🔊
                    </button>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#64748B' }}>
                      발음을 듣고 알맞은 뜻을 고르세요
                    </div>
                  </>
                )}

                {/* 2단계 스펠링 퀴즈 */}
                {quizLevel === 2 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '4px' }}>
                      {getWordMeaning(currentWord)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                      알맞은 영단어 스펠링을 선택하세요
                    </div>
                  </div>
                )}

                {/* 3단계 발음 퀴즈 */}
                {quizLevel === 3 && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#1E293B', marginBottom: '6px' }}>
                      {currentWord?.word}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748B', fontWeight: '700', marginBottom: '14px' }}>
                      마이크 버튼을 누르고 정확하게 읽어보세요!
                    </div>
                    <button
                      onClick={toggleRecording}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '20px',
                        border: 'none',
                        background: isRecording ? '#EF4444' : 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                        color: '#FFF',
                        fontWeight: '900',
                        fontSize: '15px',
                        cursor: 'pointer'
                      }}
                    >
                      {isRecording ? '⏹️ 녹음 완료' : '🎙️ 발음 시작'}
                    </button>
                  </div>
                )}

                {/* 4단계 직접 쓰기 퀴즈 */}
                {quizLevel === 4 && (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#1E293B', marginBottom: '12px' }}>
                      {getWordMeaning(currentWord)}
                    </div>
                    <input
                      type="text"
                      placeholder="단어 스펠링 직접 입력"
                      value={typingInput}
                      onChange={(e) => setTypingInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '16px',
                        border: '2px solid #00A8BF',
                        fontSize: '16px',
                        fontWeight: '800',
                        textAlign: 'center',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                {/* 1, 2단계 4지선다 보기 */}
                {(quizLevel === 1 || quizLevel === 2) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '6px' }}>
                    {[
                      { label: quizLevel === 1 ? getWordMeaning(currentWord) : currentWord?.word, isCorrect: true },
                      { label: quizLevel === 1 ? '바나나' : 'Banana', isCorrect: false },
                      { label: quizLevel === 1 ? '학교' : 'School', isCorrect: false },
                      { label: quizLevel === 1 ? '물' : 'Water', isCorrect: false }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedAnswer(i);
                          setIsAnswerChecked(true);
                          setIsQuizCorrect(opt.isCorrect);
                        }}
                        style={{
                          padding: '14px 10px',
                          borderRadius: '14px',
                          border: selectedAnswer === i ? (opt.isCorrect ? '2px solid #10B981' : '2px solid #EF4444') : '1.5px solid #E2E8F0',
                          background: selectedAnswer === i ? (opt.isCorrect ? '#D1FAE5' : '#FEE2E2') : '#F8FAFC',
                          color: selectedAnswer === i ? (opt.isCorrect ? '#065F46' : '#991B1B') : '#334155',
                          fontSize: '14px',
                          fontWeight: '800',
                          cursor: 'pointer'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 5: 👤 PROFILE (내 정보 & 진도 통계 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '24px 20px',
                border: '1.5px solid #E2E8F0',
                boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: '0 6px 16px rgba(0,168,191,0.25)'
                  }}>
                    🧑‍🎓
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1E293B' }}>
                      {currentUser?.name || '이상학'} 학생
                    </h3>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#008294' }}>
                      🎯 {currentUser?.studyGradeLevel || '초등단어'} • 목표 {currentUser?.dailyWordCount || 10}단어/일
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#00A8BF' }}>10</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>오늘 학습 단어</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#10B981' }}>5일</div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>연속 출석 달성</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  🚪 로그아웃 및 다른 학생으로 로그인
                </button>
              </div>
            </div>
          )}

        </main>

        {/* 📱 하단 플로팅 글래스 내비게이션 바 (Home, Deck, Calendar, Quiz, Profile) */}
        <nav style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '66px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px',
          zIndex: 100
        }}>
          {[
            { key: 'dashboard', icon: '🏠', label: currentStrings.navHome },
            { key: 'deck', icon: '🎴', label: currentStrings.navDeck },
            { key: 'calendar', icon: '📅', label: currentStrings.navCalendar },
            { key: 'quiz', icon: '✍️', label: currentStrings.navQuiz },
            { key: 'profile', icon: '👤', label: currentStrings.navProfile }
          ].map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setCurrentTab(item.key);
                  if (item.key === 'deck') handlePlaySound(currentWord?.word);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '12px',
                  color: isActive ? '#00A8BF' : '#94A3B8',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '20px', transform: isActive ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.15s' }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? '900' : '700' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

      </div>
    </div>
  );
}
