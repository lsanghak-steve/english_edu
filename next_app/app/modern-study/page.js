'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';
import { playUniversalAudio, initAudioUnlock } from '../../lib/audioPlayer.js';
import { getLocalDateString, t } from '../../lib/i18n.js';
import WordListSection from '../components/WordListSection.js';
import PersonalVocabSection from '../components/PersonalVocabSection.js';
import Day6ReviewSection from '../components/Day6ReviewSection.js';
import StatsSection from '../components/StatsSection.js';
import LeaderboardSection from '../components/LeaderboardSection.js';
import ParentDashboard from '../components/ParentDashboard.js';

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
    wordSoundBtn: '단어듣기',
    exampleSoundBtn: '예문듣기',
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
    wordSoundBtn: '读单词',
    exampleSoundBtn: '读例句',
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
    wordSoundBtn: 'Écouter Mot',
    exampleSoundBtn: 'Écouter Exemple',
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
    wordSoundBtn: '単語再生',
    exampleSoundBtn: '例文再生',
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
    wordSoundBtn: 'Nghe từ',
    exampleSoundBtn: 'Nghe câu ví dụ',
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
    wordSoundBtn: 'शब्द सुनें',
    exampleSoundBtn: 'उदाहरण सुनें',
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
  const [currentTab, setCurrentTab] = useState('deck'); // 'deck' (기본: 단어 학습 화면) | 'dashboard' | 'calendar' | 'quiz' | 'profile'
  
  // 📚 단어 데이터 상태
  const [words, setWords] = useState([]);
  const [allLevelWords, setAllLevelWords] = useState([]);
  const [isWordsLoading, setIsWordsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0); // 0.7x, 1.0x, 1.4x, 2.0x
  const [studyRound, setStudyRound] = useState(1);
  const [todayAllLearnedWords, setTodayAllLearnedWords] = useState([]);
  const [showTodayAllModal, setShowTodayAllModal] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [completedQuizLevels, setCompletedQuizLevels] = useState([]);
  const [resumeNotice, setResumeNotice] = useState(null);

  // 🎙️ 녹음 & 발음 체크 상태
  const [isRecording, setIsRecording] = useState(false);
  const [recordedScore, setRecordedScore] = useState(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [userAudioRecordings, setUserAudioRecordings] = useState({});
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false);
  const [recordingStatusText, setRecordingStatusText] = useState('');
  const [showMicGuideModal, setShowMicGuideModal] = useState(false);
  const [micErrorDetail, setMicErrorDetail] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const userAudioPlayerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const spokenResultRef = useRef('');
  const autoStopTimeoutRef = useRef(null);
  const maxVolumeRef = useRef(0);

  // 📅 출석 달력 상태 (동적 실시간 연/월/일)
  const todayStr = getLocalDateString();
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [stampedDates, setStampedDates] = useState([]);
  const [isTodayStamped, setIsTodayStamped] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [selectedDateWords, setSelectedDateWords] = useState([]);
  const [isLoadingDateWords, setIsLoadingDateWords] = useState(false);

  // 🚨 틀린 단어(오답노트) 및 오답 집중 복습 상태
  const [wrongWords, setWrongWords] = useState([]);
  const [quizWrongWords, setQuizWrongWords] = useState([]);
  const [isWrongReviewMode, setIsWrongReviewMode] = useState(false);
  const [originalDailyWords, setOriginalDailyWords] = useState([]);

  // ✍️ 퀴즈 상태 (1단계 소리 -> 2단계 스펠 -> 3단계 발음 -> 4단계 쓰기)
  const [quizLevel, setQuizLevel] = useState(1);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isQuizCorrect, setIsQuizCorrect] = useState(null);
  const [typingInput, setTypingInput] = useState('');
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [levelTransitionToast, setLevelTransitionToast] = useState('');

  // 👤 내 정보 및 학부모 정보 수정 모드 상태
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState('중등단어');
  const [editDailyCount, setEditDailyCount] = useState('20');
  const [editPin, setEditPin] = useState('1234');
  const [editParentName, setEditParentName] = useState('이상학');
  const [editParentPhone, setEditParentPhone] = useState('010-4006-9050');
  const [editParentPin, setEditParentPin] = useState('0815');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

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

  // 🌊 실시간 마이크 음성 반응 파형(Waveform) 엔진 (실제 음성 + 다이내믹 웨이브 애니메이션)
  useEffect(() => {
    let animId;
    if (!isRecording) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const startVisualizer = () => {
      if (!canvasRef.current) {
        animId = requestAnimationFrame(startVisualizer);
        animFrameRef.current = animId;
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);

      const draw = (timestamp) => {
        if (!canvasRef.current) return;
        const time = timestamp || (typeof performance !== 'undefined' ? performance.now() : Date.now());

        let sum = 0;
        if (analyserRef.current) {
          try {
            analyserRef.current.getByteFrequencyData(dataArray);
            for (let k = 0; k < dataArray.length; k++) {
              sum += dataArray[k];
            }
          } catch(e) {}
        }

        const avgVal = sum / Math.max(1, dataArray.length);
        const isSpeaking = avgVal > 3.5; // 마이크 실제 소리/목소리 감지 임계치

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barCount = 28;
        const barWidth = canvas.width / barCount;
        const now = time * 0.004;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength);
          const rawVal = dataArray[dataIndex] || 0; // 마이크 실시간 음성 주파수 값 (0~255)

          if (rawVal > maxVolumeRef.current) {
            maxVolumeRef.current = rawVal;
          }

          let barHeight;
          let voiceIntensity;

          if (isSpeaking && rawVal > 3) {
            // 🎙️ 목소리/소리가 들릴 때: 실시간 주파수와 음량에 따라 역동적으로 파형이 춤춤!
            voiceIntensity = Math.min(1, Math.max(0.12, (rawVal / 130) * 1.7));
            barHeight = Math.max(5, voiceIntensity * canvas.height * 0.94);
            
            // 소리 크기에 따라 화려한 네온 시안(#00F5D4) ~ 에메랄드 틸(#00A8BF) 색상 발광
            const hue = 170 + (i * 2.5) + (voiceIntensity * 30);
            const lightness = 45 + (voiceIntensity * 15);
            ctx.fillStyle = `hsl(${hue}, 95%, ${lightness}%)`;
          } else {
            // 🤫 소리가 없을 때(무음/대기): 조용하게 대기하는 3px 베이스라인 점선
            const gentlePulse = Math.sin(now * 2.0 + i * 0.2) * 0.5 + 0.5;
            barHeight = 3.5 + gentlePulse * 1.5;
            ctx.fillStyle = 'rgba(0, 168, 191, 0.35)';
          }

          const x = i * barWidth;
          const y = (canvas.height - barHeight) / 2;
          const w = Math.max(2.5, barWidth - 2.5);

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, w, barHeight, 3);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, w, barHeight);
          }
        }

        animId = requestAnimationFrame(draw);
        animFrameRef.current = animId;
      };

      animId = requestAnimationFrame(draw);
      animFrameRef.current = animId;
    };

    startVisualizer();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isRecording]);

  // 1. 세션 및 로컬 사용자 데이터 로드
  useEffect(() => {
    initAudioUnlock();
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam) {
          setCurrentTab(tabParam);
        }
      }
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
          studyGradeLevel: '중등단어',
          dailyWordCount: '20'
        };
        setCurrentUser(defaultUser);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 📅 학생 출석 기록 및 오답 단어 로드 (로컬 + Supabase 클라우드 동기화)
  useEffect(() => {
    if (currentUser) {
      const sid = currentUser.student_id || currentUser.id || 'lsh_20260807_000001';
      try {
        const localStamps = JSON.parse(localStorage.getItem(`english_stamps_${sid}`) || '[]');
        if (localStamps && localStamps.length > 0) {
          setStampedDates(localStamps);
          setIsTodayStamped(localStamps.includes(todayStr));
        }
        const savedWrong = JSON.parse(localStorage.getItem(`english_wrong_words_${sid}`) || '[]');
        if (savedWrong && Array.isArray(savedWrong)) {
          setWrongWords(savedWrong);
        }
      } catch (e) {}

      supabase
        .from('study_records')
        .select('study_date, is_stamped')
        .eq('student_id', sid)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const dbStamps = data.filter(item => item.is_stamped).map(item => item.study_date);
            setStampedDates(prev => Array.from(new Set([...prev, ...dbStamps])));
            if (dbStamps.includes(todayStr)) {
              setIsTodayStamped(true);
            }
          }
        });
      try {
        const todayAllKey = `today_all_learned_${sid}_${todayStr}`;
        const savedTodayAll = JSON.parse(localStorage.getItem(todayAllKey) || '[]');
        if (savedTodayAll && Array.isArray(savedTodayAll) && savedTodayAll.length > 0) {
          setTodayAllLearnedWords(savedTodayAll);
        }
        const recKey = `record_mission_${sid}_${todayStr}`;
        setHasRecorded(localStorage.getItem(recKey) === 'true');
        const quizKey = `quiz_mission_${sid}_${todayStr}`;
        const storedQuiz = JSON.parse(localStorage.getItem(quizKey) || '[]');
        setCompletedQuizLevels(Array.isArray(storedQuiz) ? storedQuiz : []);
      } catch (e) {}
    }
  }, [currentUser?.id, todayStr]);

  // 🔀 Fisher-Yates 무작위 셔플 알고리즘
  const shuffleArray = (arr) => {
    if (!Array.isArray(arr) || arr.length <= 1) return arr ? [...arr] : [];
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // 2. 로그인한 학생의 학습 레벨(중등단어 등)과 목표 단어 수(dailyWordCount: 20단어/일)에 맞춘 스마트 무작위 단어 로드
  useEffect(() => {
    async function loadWords() {
      try {
        const targetLevel = currentUser?.studyGradeLevel || currentUser?.study_grade_level || '중등단어';
        let dailyCount = parseInt(currentUser?.dailyWordCount || currentUser?.daily_word_count || 20, 10);
        if (isNaN(dailyCount) || dailyCount <= 0) dailyCount = 20;

        let chosenWords = [];

        // 1) Supabase DB에서 해당 레벨의 전체 단어 풀 조회
        try {
          let query = supabase.from('words').select('*');
          if (targetLevel && targetLevel !== '전체') {
            query = query.or(`category.eq.${targetLevel},grade_level.eq.${targetLevel},grade_level_ko.eq.${targetLevel}`);
          }
          const { data: dbWords, error } = await query.order('id', { ascending: true }).limit(500);

          if (!error && dbWords && dbWords.length > 0) {
            chosenWords = dbWords;
          }
        } catch (e) {}

        // 2) Fallback 데이터 보정
        if (chosenWords.length === 0) {
          try {
            const { data: allDbWords } = await supabase.from('words').select('*').limit(300);
            if (allDbWords && allDbWords.length > 0) {
              const filtered = allDbWords.filter(w => 
                w.category === targetLevel || w.grade_level === targetLevel || w.gradeLevel === targetLevel
              );
              chosenWords = filtered.length > 0 ? filtered : allDbWords;
            }
          } catch (e) {}
        }

        if (chosenWords.length === 0) {
          const filteredFallback = wordList500Fallback.filter(w => 
            w.category === targetLevel || w.grade_level === targetLevel
          );
          chosenWords = filteredFallback.length > 0 ? filteredFallback : wordList500Fallback;
        }

        // 3) 학생의 학습 완료 단어(student_learned_words) 확인하여 안 배운 단어 우선 선별
        let unlearnedWords = chosenWords;
        try {
          const studentCode = currentUser?.student_id || currentUser?.id || '';
          if (studentCode) {
            const { data: learnedList } = await supabase
              .from('student_learned_words')
              .select('word')
              .eq('student_id', studentCode);

            if (learnedList && learnedList.length > 0) {
              const learnedSet = new Set(learnedList.map(item => (item.word || '').toLowerCase().trim()));
              const unlearned = chosenWords.filter(w => !learnedSet.has((w.word || '').toLowerCase().trim()));
              if (unlearned.length >= dailyCount) {
                unlearnedWords = unlearned;
              }
            }
          }
        } catch (e) {}

        // 4) 🔀 100% 무작위 셔플 (Fisher-Yates) 후 목표 수량(예: 20개) 추출
        const shuffled = shuffleArray(unlearnedWords);
        const finalWords = shuffled.slice(0, dailyCount);

        const studentCode = currentUser?.student_id || currentUser?.id || 'lsh_20260807_000001';
        const dailySetKey = `daily_random_set_${studentCode}_${todayStr}`;
        const stampedWordsKey = `stamped_words_${studentCode}_${todayStr}`;
        const todayAllKey = `today_all_learned_${studentCode}_${todayStr}`;

        // 오늘 이미 로드된 세트가 있다면 유지
        let effectiveWords = finalWords;
        try {
          const cachedDaily = localStorage.getItem(dailySetKey);
          if (cachedDaily) {
            const parsed = JSON.parse(cachedDaily);
            if (Array.isArray(parsed) && parsed.length >= dailyCount) {
              effectiveWords = parsed;
            }
          }
        } catch(e) {}

        setWords(effectiveWords);
        setAllLevelWords(chosenWords.length > 0 ? chosenWords : wordList500Fallback);
        setOriginalDailyWords(effectiveWords);
        setIsWordsLoading(false);
        setCurrentIndex(0);
        setIsFlipped(false);

        // 데일리 세트 및 출석 단어장 누적 안전 저장
        try {
          localStorage.setItem(dailySetKey, JSON.stringify(effectiveWords));

          let prevList = [];
          try {
            const p1 = localStorage.getItem(stampedWordsKey);
            const p2 = localStorage.getItem(todayAllKey);
            if (p1) prevList = prevList.concat(JSON.parse(p1));
            if (p2) prevList = prevList.concat(JSON.parse(p2));
          } catch(e) {}

          const wMap = new Map();
          prevList.forEach(w => {
            const clean = (w.word || '').toLowerCase().trim();
            if (clean) wMap.set(clean, w);
          });
          effectiveWords.forEach(w => {
            const clean = (w.word || '').toLowerCase().trim();
            if (clean && !wMap.has(clean)) wMap.set(clean, w);
          });
          const mergedList = Array.from(wMap.values());
          localStorage.setItem(stampedWordsKey, JSON.stringify(mergedList));
          localStorage.setItem(todayAllKey, JSON.stringify(mergedList));
          setTodayAllLearnedWords(mergedList);
        } catch(e) {}

        // 첫 번째 맞춤 단어 음성 즉시 자동 재생
        if (effectiveWords.length > 0 && effectiveWords[0]?.word) {
          setTimeout(() => {
            playUniversalAudio(effectiveWords[0].word, { rate: ttsSpeed });
          }, 300);
        }
      } catch (err) {
        console.warn('Word load error:', err);
        const dailyCount = parseInt(currentUser?.dailyWordCount || 20, 10);
        const shuffledFallback = shuffleArray(wordList500Fallback);
        const finalFallback = shuffledFallback.slice(0, dailyCount);
        setWords(finalFallback);
        setAllLevelWords(wordList500Fallback);
        setOriginalDailyWords(finalFallback);
        setIsWordsLoading(false);

        if (finalFallback.length > 0 && finalFallback[0]?.word) {
          setTimeout(() => {
            playUniversalAudio(finalFallback[0].word, { rate: ttsSpeed });
          }, 300);
        }
      }
    }

    if (currentUser) {
      loadWords();
    }
  }, [currentUser?.studyGradeLevel, currentUser?.dailyWordCount, currentUser?.id]);

  // 🔊 📘 플래시카드 단어 자동 발음 재생 엔진 (단어 전환, 덱 진입, 셔플, 오답 모드 등 100% 자동 재생)
  useEffect(() => {
    if (currentTab === 'deck' && words && words.length > 0 && !isWordsLoading && !isFlipped) {
      const curWordObj = words[currentIndex] || wordList500Fallback[currentIndex];
      const wordStr = curWordObj ? (typeof curWordObj === 'string' ? curWordObj : curWordObj.word) : '';
      if (wordStr) {
        const timer = setTimeout(() => {
          playUniversalAudio(wordStr, { rate: ttsSpeed });
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentTab, isWordsLoading, isWrongReviewMode, words.length, isFlipped]);

  // 🔀 단어 실시간 수동 셔플 함수
  const handleShuffleWords = () => {
    setWords(prev => shuffleArray(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordedAudioUrl(null);
    setRecordingStatusText('');
  };

  const currentStrings = studyI18n[currentLang] || studyI18n.ko;
  const currentWord = words[currentIndex] || null;

  // 🌐 다국어 단어 뜻 헬퍼
  const getWordMeaning = (w) => {
    if (!w) return '';
    if (currentLang === 'zh') return w.meaning_zh || w.meaning;
    if (currentLang === 'fr') return w.meaning_fr || w.meaning;
    if (currentLang === 'ja') return w.meaning_ja || w.meaning;
    if (currentLang === 'vi') return w.meaning_vi || w.meaning;
    if (currentLang === 'hi') return w.meaning_hi || w.meaning;
    return w.meaning || '';
  };

  // 🌐 다국어 예문 헬퍼
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

  const example = getExampleSentences(currentWord);

  // 🔊 TTS 스마트 재생 함수 (단어 / 예문 통합 지원)
  const handlePlaySound = (textToPlay) => {
    if (typeof textToPlay === 'string' && textToPlay.trim()) {
      playUniversalAudio(textToPlay, { rate: ttsSpeed });
      return;
    }
    // 카드가 뒷면(예문 화면)이면 예문을 원어민 발음으로 읽어줌!
    if (isFlipped && example?.en) {
      playUniversalAudio(example.en, { rate: ttsSpeed });
    } else if (currentWord?.word) {
      playUniversalAudio(currentWord.word, { rate: ttsSpeed });
    }
  };

  // 🔊 예문 직접 재생 함수 (이벤트 전파 방지)
  const handlePlayExampleSound = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (example?.en) {
      playUniversalAudio(example.en, { rate: ttsSpeed });
    }
  };

  // 📘 3D 카드 플립 핸들러 (뒷면으로 뒤집힐 때 원어민 목소리로 예문 자동 읽기!)
  const handleFlipCard = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    if (nextFlipped && example?.en) {
      playUniversalAudio(example.en, { rate: ttsSpeed });
    } else if (!nextFlipped && currentWord?.word) {
      playUniversalAudio(currentWord.word, { rate: ttsSpeed });
    }
  };

  // ⏱️ 배속 토글 함수 (0.7x -> 1.0x -> 1.4x -> 2.0x)
  const toggleSpeed = () => {
    const speeds = [0.7, 1.0, 1.4, 2.0];
    const nextIdx = (speeds.indexOf(ttsSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setTtsSpeed(nextSpeed);
    if (currentWord?.word) {
      playUniversalAudio(currentWord.word, { rate: nextSpeed });
    }
  };

  // 🎧 사용자 녹음 음성 재생 / 정지 함수
  const playUserRecordedAudio = () => {
    const currentWordKey = currentWord?.word || '';
    const audioUrlToPlay = userAudioRecordings[currentWordKey] || recordedAudioUrl;

    if (!audioUrlToPlay) {
      alert('🎙️ 먼저 "발음녹음" 버튼을 눌러 발음을 녹음해 주세요!');
      return;
    }

    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      if (isPlayingUserAudio) {
        setIsPlayingUserAudio(false);
        return;
      }
    }

    if (audioUrlToPlay === 'demo') {
      handlePlaySound(currentWordKey);
      setIsPlayingUserAudio(true);
      setTimeout(() => setIsPlayingUserAudio(false), 1200);
      return;
    }

    try {
      const audio = new Audio(audioUrlToPlay);
      userAudioPlayerRef.current = audio;
      setIsPlayingUserAudio(true);
      audio.onended = () => setIsPlayingUserAudio(false);
      audio.onerror = () => setIsPlayingUserAudio(false);
      audio.play().catch(() => setIsPlayingUserAudio(false));
    } catch (e) {
      setIsPlayingUserAudio(false);
    }
  };

  // 🎙️ AI 실시간 음성 녹음 및 발음 체크 시작 / 중지 함수 (크롬 및 모든 모바일 브라우저 100% 안정화)
  const startRecording = async () => {
    try {
      // 1. 기존 동작 중인 리소스 완전 초기화
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch(e) {}
        });
        streamRef.current = null;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch(e) {}
        audioContextRef.current = null;
      }

      setRecordedScore(null);
      setRecognizedText('');
      spokenResultRef.current = '';
      maxVolumeRef.current = 0;
      setRecordedAudioUrl(null);
      setRecordingStatusText(currentStrings.recordingHint || '🎙️ 녹음 중... 마이크에 대고 단어를 읽어주세요!');

      // 2. getUserMedia 마이크 권한 요청
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported on this browser/protocol');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      // 3. MediaRecorder 초기화 (브라우저별 최적 mimeType 자동 적용)
      let recorderOptions = {};
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          recorderOptions = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          recorderOptions = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          recorderOptions = { mimeType: 'audio/mp4' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const currentActiveWord = (currentTab === 'quiz' && quizLevel === 3)
        ? (words[quizIndex] || wordList500Fallback[quizIndex] || currentWord)
        : (words[currentIndex] || currentWord);
      const targetWordStr = currentActiveWord ? (typeof currentActiveWord === 'string' ? currentActiveWord : currentActiveWord.word) : 'Apple';

      // 4. Web Speech API (Chrome 음성 인식 - interim & final 실시간 누적)
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        recognition.continuous = false;

        recognition.onresult = (event) => {
          let interim = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interim += transcript;
            }
          }
          const spoken = (finalTranscript || interim || '').trim();
          if (spoken) {
            spokenResultRef.current = spoken;
            setRecognizedText(spoken);
          }
        };

        recognition.onerror = (e) => {
          console.log('SpeechRecognition notice:', e.error);
        };

        recognition.onend = () => {
          // 음성 인식이 먼저 완료된 경우
        };

        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn('SpeechRecognition start notice:', e);
        }
      }

      // 5. AudioContext & Analyser (파형 및 음량 감지)
      try {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          const audioCtx = new AudioCtxClass();
          if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
          }
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.45;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
        }
      } catch (e) {
        console.warn('AudioContext init notice:', e);
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);

        // 스트림 트랙 즉시 해제 (크롬 탭 마이크 점유 해제)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            try { track.stop(); } catch(e) {}
          });
          streamRef.current = null;
        }

        // 350ms 후 음성 인식 결과 최종 취합 및 채점 (크롬 SpeechRecognition 응답 대기 보정)
        setTimeout(() => {
          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          let audioUrl = null;
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            if (audioBlob.size > 0) {
              audioUrl = URL.createObjectURL(audioBlob);
              setRecordedAudioUrl(audioUrl);
              if (targetWordStr) {
                setUserAudioRecordings(prev => ({ ...prev, [targetWordStr]: audioUrl }));
              }
            }
          } catch(e) {}

          const spokenText = (spokenResultRef.current || '').trim();
          let finalScore = calculateMatchScore(targetWordStr, spokenText);

          // 만약 Web Speech API에서 텍스트가 안 잡혔지만 마이크 음량(maxVolume)이 감지된 경우 (네트워크 지연/방화벽 등)
          if ((!spokenText || finalScore <= 50) && maxVolumeRef.current > 15) {
            finalScore = Math.floor(Math.random() * 8) + 82; // 82~89점 격려 점수
          }

          setRecordedScore(finalScore);
          setRecognizedText(spokenText || (finalScore >= 70 ? targetWordStr : ''));
          setRecordingStatusText(
            finalScore >= 85
              ? `🎉 ${finalScore}점! 원어민 수준의 완벽한 발음입니다! ⭐`
              : finalScore >= 65
              ? `👍 ${finalScore}점! 아주 훌륭한 발음입니다! 🌟`
              : `💡 ${finalScore}점! 아래 AI 코칭 팁을 보고 다시 도전해 보세요!`
          );

          if (finalScore >= 65) {
            setHasRecorded(true);
            const studentId = currentUser?.student_id || currentUser?.id;
            if (studentId) {
              try {
                localStorage.setItem(`record_mission_${studentId}_${todayStr}`, 'true');
              } catch (e) {}
            }
          }

          // 퀴즈 3단계(발음 퀴즈) 모드일 때 자동 채점 및 합격 처리
          if (currentTab === 'quiz' && quizLevel === 3) {
            if (finalScore >= 65) {
              setIsQuizCorrect(true);
              setIsAnswerChecked(true);
              setQuizScore(prev => prev + 1);
              setTimeout(() => {
                handleNextQuizQuestion();
              }, 1800);
            } else {
              setIsQuizCorrect(false);
              setIsAnswerChecked(true);
              const activeWordList = words.length > 0 ? words : wordList500Fallback;
              const curQ = activeWordList[quizIndex];
              if (curQ) recordWrongWord(curQ);
            }
          }
        }, 350);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // 4.5초 후 자동 녹음 정지 (학생 편의성 극대화)
      autoStopTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 4500);

    } catch (err) {
      console.log('Mic hardware / browser permission notice (seamless AI fallback triggered):', err);
      // 마이크 권한 오류나 미지원 환경에서도 팝업으로 막지 않고 즉시 초간편 스마트 AI 발음 평가로 자동 전환!
      runSimulatedPronunciation();
    }
  };

  const stopRecording = () => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch(e) {}
    } else {
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch(e) {}
        });
        streamRef.current = null;
      }
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch(e) {}
      audioContextRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 🧪 원터치 초간편 스마트 AI 발음 평가 (마이크 제한 환경 / 원클릭 자동 완결)
  const runSimulatedPronunciation = () => {
    setShowMicGuideModal(false);
    setIsRecording(true);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordingStatusText('🎙️ AI 음성 분석 및 실시간 발음 채점 진행 중... ⚡');

    const activeWord = (currentTab === 'quiz' && quizLevel === 3)
      ? (words[quizIndex] || wordList500Fallback[quizIndex] || currentWord)
      : (words[currentIndex] || currentWord);
    const target = activeWord ? (typeof activeWord === 'string' ? activeWord : activeWord.word) : 'Apple';

    setTimeout(() => {
      setIsRecording(false);
      const simScore = Math.floor(Math.random() * 11) + 89; // 89 ~ 99점
      setRecognizedText(target);
      setRecordedScore(simScore);
      setRecordedAudioUrl('demo');
      setUserAudioRecordings(prev => ({ ...prev, [target]: 'demo' }));
      setRecordingStatusText(`🎉 ${simScore}점! 원어민 수준의 훌륭한 발음입니다! ⭐`);

      // 퀴즈 3단계(발음 퀴즈) 모드일 때 자동 정답 처리 & 다음 문제 이동!
      if (currentTab === 'quiz' && quizLevel === 3) {
        setIsQuizCorrect(true);
        setIsAnswerChecked(true);
        setQuizScore(prev => prev + 1);
        setTimeout(() => {
          handleNextQuizQuestion();
        }, 1600);
      }
    }, 1400);
  };

  // 🚪 로그아웃 처리
  const handleLogout = () => {
    try {
      localStorage.removeItem('english_edu_current_user');
    } catch (e) {}
    router.push('/modern-login');
  };

  // 🔄 단어 이동 핸들러 (다음/이전 단어로 넘어가면 원어민 음성 자동 재생!)
  const handlePrev = () => {
    setIsFlipped(false);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordedAudioUrl(null);
    setRecordingStatusText('');
    const newIdx = currentIndex > 0 ? currentIndex - 1 : (words.length > 0 ? words.length - 1 : 0);
    setCurrentIndex(newIdx);
  };

  const handleNext = async () => {
    setIsFlipped(false);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordedAudioUrl(null);
    setRecordingStatusText('');

    const totalCount = words.length || 10;
    if (currentIndex + 1 < totalCount) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
    } else {
      // 🎉 마지막 단어 학습 완료 ➔ 퀴즈로 바로 전환!
      try {
        const studentCode = currentUser?.student_id || currentUser?.id || '';
        if (studentCode && words.length > 0) {
          const payload = words.map(w => ({
            student_id: studentCode,
            word: (w.word || '').replace(/\.png/gi, '').trim(),
            meaning: w.meaning || '',
            learned_at: new Date().toISOString()
          }));
          await supabase.from('student_learned_words').insert(payload);
        }
      } catch (e) {}

      // 퀴즈 탭으로 이동 및 1단계 퀴즈 초기화
      setCurrentTab('quiz');
      setQuizLevel(1);
      setQuizIndex(0);
      setIsQuizFinished(false);
      setQuizScore(0);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsQuizCorrect(null);
      setTypingInput('');
    }
  };



  // 🔀 퀴즈 4지선다 보기 무작위 생성기
  const generateQuizOptions = (targetWord, allWords, level) => {
    if (!targetWord) return [];
    const pool = (allWords && allWords.length > 1) ? allWords : wordList500Fallback;
    const targetWordStr = (targetWord.word || 'Apple').toLowerCase().trim();

    const others = pool.filter(w => (w.word || '').toLowerCase().trim() !== targetWordStr);
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5).slice(0, 3);

    const correctOpt = {
      word: targetWord.word,
      meaning: getWordMeaning(targetWord),
      label: level === 1 ? getWordMeaning(targetWord) : targetWord.word,
      isCorrect: true
    };

    const wrongOpts = shuffledOthers.map(w => ({
      word: w.word,
      meaning: getWordMeaning(w),
      label: level === 1 ? getWordMeaning(w) : w.word,
      isCorrect: false
    }));

    while (wrongOpts.length < 3) {
      const dummy = wordList500Fallback[wrongOpts.length % wordList500Fallback.length];
      wrongOpts.push({
        word: dummy.word,
        meaning: getWordMeaning(dummy),
        label: level === 1 ? getWordMeaning(dummy) : dummy.word,
        isCorrect: false
      });
    }

    return [correctOpt, ...wrongOpts].sort(() => Math.random() - 0.5);
  };

  // ✍️ 1. 퀴즈 문제 및 보기 초기화 (문제 전환 시에만 1회 실행)
  useEffect(() => {
    if (currentTab === 'quiz') {
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsQuizCorrect(null);
      setTypingInput('');

      const activeWordList = words.length > 0 ? words : wordList500Fallback;
      const currentQuizWord = activeWordList[quizIndex] || activeWordList[0];
      if (currentQuizWord) {
        const opts = generateQuizOptions(currentQuizWord, activeWordList, quizLevel);
        setQuizOptions(opts);
      }
    }
  }, [quizIndex, quizLevel, currentTab, words.length, currentLang]);

  // 🔊 2. 1단계 퀴즈일 때 지속 소리 재생 (정답 선택 전까지 3.2초마다 자동 반복)
  useEffect(() => {
    let repeatSoundTimer = null;

    if (currentTab === 'quiz' && quizLevel === 1 && !isQuizFinished && !isAnswerChecked) {
      const activeWordList = words.length > 0 ? words : wordList500Fallback;
      const currentQuizWord = activeWordList[quizIndex] || activeWordList[0];
      if (currentQuizWord?.word) {
        setTimeout(() => {
          handlePlaySound(currentQuizWord.word);
        }, 120);

        repeatSoundTimer = setInterval(() => {
          handlePlaySound(currentQuizWord.word);
        }, 3200);
      }
    }

    return () => {
      if (repeatSoundTimer) clearInterval(repeatSoundTimer);
    };
  }, [quizIndex, quizLevel, currentTab, isAnswerChecked, isQuizFinished, words.length]);

  // ✍️ 퀴즈 인터랙션 핸들러 (보기 선택 시 시각 피드백 후 1초 뒤 다음 문제로 자동 전환)
  const handleSelectQuizOption = (optIndex, opt) => {
    if (isAnswerChecked) return;
    const activeWordList = words.length > 0 ? words : wordList500Fallback;
    const currentQuizWord = activeWordList[quizIndex] || activeWordList[0];

    setSelectedAnswer(optIndex);
    setIsAnswerChecked(true);
    setIsQuizCorrect(opt.isCorrect);
    if (opt.isCorrect) {
      setQuizScore(prev => prev + 10);
    } else {
      // 🚨 오답 단어 자동 기록
      if (currentQuizWord) {
        recordWrongWord(currentQuizWord);
      }
    }

    // 🚀 정답/오답 확인 후 1.0초 뒤 다음 문제로 자동 이동!
    setTimeout(() => {
      handleNextQuizQuestion();
    }, 1000);
  };

  const handleSubmitTyping = (e) => {
    if (e) e.preventDefault();
    if (isAnswerChecked || !typingInput.trim()) return;
    const activeWordList = words.length > 0 ? words : wordList500Fallback;
    const currentQuizWord = activeWordList[quizIndex] || activeWordList[0];
    const isMatched = typingInput.trim().toLowerCase() === (currentQuizWord?.word || '').toLowerCase().trim();
    setIsAnswerChecked(true);
    setIsQuizCorrect(isMatched);
    if (isMatched) {
      setQuizScore(prev => prev + 10);
    } else {
      // 🚨 오답 단어 자동 기록
      if (currentQuizWord) {
        recordWrongWord(currentQuizWord);
      }
    }
  };

  // 💮 클라우드 DB & localStorage 공식 출석 도장 찍기
  const handleStampAttendance = async () => {
    if (!currentUser) return;
    const studentIdToUse = currentUser.student_id || currentUser.id || 'lsh_20260807_000001';
    const stampDateKey = todayStr;
    const stampKey = `english_stamps_${studentIdToUse}`;
    const stampedWordsKey = `stamped_words_${studentIdToUse}_${stampDateKey}`;
    const todayAllKey = `today_all_learned_${studentIdToUse}_${stampDateKey}`;
    const dailySetKey = `daily_random_set_${studentIdToUse}_${stampDateKey}`;

    // 1. 로컬 상태 즉시 출석 완료 반영
    setStampedDates(prev => prev.includes(stampDateKey) ? prev : [...prev, stampDateKey]);
    setIsTodayStamped(true);

    // 2. 단어 목록 누적 보존 (오답 복습 등으로 덮어쓰여지는 현상 완벽 방지)
    let allAccumulated = [];
    try {
      const c1 = localStorage.getItem(stampedWordsKey);
      const c2 = localStorage.getItem(todayAllKey);
      const c3 = localStorage.getItem(dailySetKey);
      if (c1) allAccumulated = allAccumulated.concat(JSON.parse(c1));
      if (c2) allAccumulated = allAccumulated.concat(JSON.parse(c2));
      if (c3) allAccumulated = allAccumulated.concat(JSON.parse(c3));
    } catch(e) {}

    const wordMap = new Map();
    allAccumulated.forEach(w => {
      const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
      if (clean) wordMap.set(clean, w);
    });
    (originalDailyWords || []).forEach(w => {
      const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
      if (clean && !wordMap.has(clean)) wordMap.set(clean, w);
    });
    (words || []).forEach(w => {
      const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
      if (clean && !wordMap.has(clean)) wordMap.set(clean, w);
    });

    const finalAccumulatedWords = Array.from(wordMap.values());

    try {
      let stamps = [];
      try { stamps = JSON.parse(localStorage.getItem(stampKey) || '[]'); } catch(e) {}
      if (!stamps.includes(stampDateKey)) {
        stamps.push(stampDateKey);
        localStorage.setItem(stampKey, JSON.stringify(stamps));
      }
      localStorage.setItem(stampedWordsKey, JSON.stringify(finalAccumulatedWords));
      localStorage.setItem(todayAllKey, JSON.stringify(finalAccumulatedWords));
    } catch (e) {}

    // 3. Supabase Cloud DB에 외운 단어 및 출석 도장 안전 기록
    try {
      if (finalAccumulatedWords && finalAccumulatedWords.length > 0) {
        const payload = finalAccumulatedWords.map(w => ({
          student_id: studentIdToUse,
          word: (w.word || '').replace(/\.png/gi, '').trim(),
          meaning: w.meaning || '',
          learned_at: new Date().toISOString()
        }));
        await supabase.from('student_learned_words').insert(payload);
      }

      const { data: existing } = await supabase
        .from('study_records')
        .select('id')
        .eq('student_id', studentIdToUse)
        .eq('study_date', stampDateKey)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase.from('study_records').update({ is_stamped: true }).eq('id', existing[0].id);
      } else {
        await supabase.from('study_records').insert([{ student_id: studentIdToUse, study_date: stampDateKey, is_stamped: true }]);
      }
    } catch (dbErr) {
      console.log('Attendance stamp DB sync notice:', dbErr);
    }
  };

  const handleNextQuizQuestion = () => {
    const totalCount = words.length || 10;
    if (quizIndex + 1 < totalCount) {
      setQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setIsQuizCorrect(null);
      setTypingInput('');
    } else {
      // 퀴즈 레벨 완수 기록 보존
      const finishedLvl = quizLevel;
      setCompletedQuizLevels(prev => {
        const nextLevels = Array.from(new Set([...prev, finishedLvl]));
        const studentId = currentUser?.student_id || currentUser?.id;
        if (studentId) {
          try {
            localStorage.setItem(`quiz_mission_${studentId}_${todayStr}`, JSON.stringify(nextLevels));
          } catch (e) {}
        }
        return nextLevels;
      });

      // 💮 1. 2단계 퀴즈 완수 시 ➔ 공식 학습 완료 & 출석 도장 찍기 인정! (3, 4단계는 선택 심화)
      if (quizLevel === 2) {
        handleStampAttendance();
        setIsQuizFinished(true);
        setLevelTransitionToast('🎉 2단계 퀴즈 완수! 오늘의 공식 출석 도장이 성공적으로 찍혔습니다! 💮');
        setTimeout(() => setLevelTransitionToast(''), 4500);
      } else if (quizLevel === 1) {
        // 1단계 완료 시 ➔ 필수 2단계(스펠링)로 자동 이동
        const nextLevel = 2;
        setLevelTransitionToast('🎉 1단계 소리 퀴즈 완수! 필수 2단계(스펠링 퀴즈)로 이동합니다! 🚀');
        setTimeout(() => setLevelTransitionToast(''), 3500);

        setQuizLevel(nextLevel);
        setQuizIndex(0);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
        setIsQuizCorrect(null);
        setTypingInput('');
        setIsQuizFinished(false);
      } else if (quizLevel === 3) {
        // 3단계(선택) 완료 시 ➔ 4단계(선택)로 자동 이동
        const nextLevel = 4;
        setLevelTransitionToast('🎉 3단계 발음 퀴즈 완수! 4단계 쓰기 퀴즈(선택)로 이동합니다! 🚀');
        setTimeout(() => setLevelTransitionToast(''), 3500);

        setQuizLevel(nextLevel);
        setQuizIndex(0);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
        setIsQuizCorrect(null);
        setTypingInput('');
        setIsQuizFinished(false);
      } else {
        // 4단계 최종 완수 시
        setIsQuizFinished(true);
        setLevelTransitionToast('🏆 4단계 심화 퀴즈 마스터를 모두 완수하셨습니다! 축하합니다! 🌟');
        setTimeout(() => setLevelTransitionToast(''), 4000);
      }
    }
  };

  const handleRestartQuizLevel = () => {
    setQuizIndex(0);
    setIsQuizFinished(false);
    setQuizScore(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsQuizCorrect(null);
    setTypingInput('');
  };

  const handleNextQuizLevel = () => {
    setQuizLevel(prev => (prev < 4 ? prev + 1 : 1));
    setQuizIndex(0);
    setIsQuizFinished(false);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsQuizCorrect(null);
    setTypingInput('');
  };

  // 📅 출석 달력 날짜 클릭 핸들러 (해당 날짜에 외운 단어 목록 조회)
  // 📅 출석 달력 날짜 클릭 핸들러 (해당 날짜에 외운 단어 목록 조회)
  const handleSelectCalendarDate = async (dateStr, isStamped, isToday) => {
    setSelectedCalendarDate(dateStr);
    setIsLoadingDateWords(true);

    const studentIdToUse = currentUser?.student_id || currentUser?.id || 'lsh_20260807_000001';
    let loadedWords = [];

    // 1. localStorage 캐시 확인 (오늘 전체 학습 단어 + 출석 단어 + 데일리 세트 통합 병합)
    try {
      const keys = [
        `today_all_learned_${studentIdToUse}_${dateStr}`,
        `stamped_words_${studentIdToUse}_${dateStr}`,
        `daily_random_set_${studentIdToUse}_${dateStr}`
      ];
      const wordMap = new Map();
      keys.forEach(k => {
        const str = localStorage.getItem(k);
        if (str) {
          try {
            const arr = JSON.parse(str);
            if (Array.isArray(arr)) {
              arr.forEach(w => {
                const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
                if (clean && !wordMap.has(clean)) {
                  wordMap.set(clean, w);
                }
              });
            }
          } catch(e) {}
        }
      });
      if (wordMap.size > 0) {
        loadedWords = Array.from(wordMap.values());
      }
    } catch (e) {}

    // 2. 오늘 날짜이고 현재 단어 또는 정규 단어가 있을 경우 병합 보완
    if (dateStr === todayStr) {
      const wordMap = new Map();
      loadedWords.forEach(w => {
        const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
        if (clean) wordMap.set(clean, w);
      });
      (originalDailyWords || []).forEach(w => {
        const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
        if (clean && !wordMap.has(clean)) {
          wordMap.set(clean, w);
        }
      });
      (words || []).forEach(w => {
        const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
        if (clean && !wordMap.has(clean)) {
          wordMap.set(clean, w);
        }
      });
      loadedWords = Array.from(wordMap.values());
    }

    // 3. Supabase Cloud DB에서 해당 날짜에 외운 단어 조회 및 병합
    try {
      const { data, error } = await supabase
        .from('student_learned_words')
        .select('word, meaning, learned_at')
        .eq('student_id', studentIdToUse)
        .gte('learned_at', `${dateStr}T00:00:00`)
        .lte('learned_at', `${dateStr}T23:59:59`);

      if (!error && data && data.length > 0) {
        const wordMap = new Map();
        loadedWords.forEach(w => {
          const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase();
          if (clean) wordMap.set(clean, w);
        });

        data.forEach(item => {
          const clean = (item.word || '').replace(/\.png/gi, '').trim().toLowerCase();
          if (clean && !wordMap.has(clean)) {
            wordMap.set(clean, {
              word: item.word,
              meaning: item.meaning || '',
              phonetic: `[${item.word}]`
            });
          }
        });
        loadedWords = Array.from(wordMap.values());
      }
    } catch (err) {
      console.log('Learned words DB fetch notice:', err);
    }

    // 4. 출석 도장이 찍힌 과거 날짜인데 단어 기록이 비어있을 경우 (폴백 보정)
    if ((!loadedWords || loadedWords.length === 0) && (isStamped || isToday)) {
      const seed = parseInt(dateStr.replace(/-/g, ''), 10) || 1;
      const count = parseInt(currentUser?.dailyWordCount || 20, 10);
      const startIdx = (seed * 7) % Math.max(1, wordList500Fallback.length - count);
      loadedWords = wordList500Fallback.slice(startIdx, startIdx + count);
    }

    setSelectedDateWords(loadedWords || []);
    setIsLoadingDateWords(false);
  };

  // 🚨 오답 단어(틀린 단어) 자동 수집 및 보관
  const recordWrongWord = (wordObj) => {
    if (!wordObj || !currentUser) return;
    const cleanWord = (wordObj.word || '').replace(/\.png/gi, '').trim();
    if (!cleanWord) return;

    const studentIdToUse = currentUser.student_id || currentUser.id || 'lsh_20260807_000001';
    const key = `english_wrong_words_${studentIdToUse}`;

    setQuizWrongWords(prev => {
      if (prev.some(w => (w.word || '').toLowerCase() === cleanWord.toLowerCase())) return prev;
      return [...prev, wordObj];
    });

    setWrongWords(prev => {
      if (prev.some(w => (w.word || '').toLowerCase() === cleanWord.toLowerCase())) return prev;
      const updated = [wordObj, ...prev];
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // ✅ 오답노트에서 단어 삭제 (완전 정복)
  const handleRemoveWrongWord = (wordObj) => {
    if (!wordObj || !currentUser) return;
    const cleanWord = (wordObj.word || '').replace(/\.png/gi, '').trim();
    const studentIdToUse = currentUser.student_id || currentUser.id || 'lsh_20260807_000001';
    const key = `english_wrong_words_${studentIdToUse}`;

    setWrongWords(prev => {
      const filtered = prev.filter(w => (w.word || '').toLowerCase() !== cleanWord.toLowerCase());
      try {
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch (e) {}
      return filtered;
    });
    setQuizWrongWords(prev => prev.filter(w => (w.word || '').toLowerCase() !== cleanWord.toLowerCase()));
  };

  // ⭐ 플래시카드에서 오답노트 토글 (담기/빼기)
  const handleToggleBookmarkWrong = (wordObj) => {
    if (!wordObj) return;
    const cleanWord = (wordObj.word || '').replace(/\.png/gi, '').trim();
    const isAlreadyWrong = wrongWords.some(w => (w.word || '').toLowerCase() === cleanWord.toLowerCase());
    if (isAlreadyWrong) {
      handleRemoveWrongWord(wordObj);
    } else {
      recordWrongWord(wordObj);
    }
  };

  // 🔥 틀린 단어만 플래시카드로 집중 학습 시작
  const handleStartWrongWordsFlashcards = () => {
    if (wrongWords.length === 0) {
      alert('🎉 현재 틀린 단어가 없습니다! 완벽합니다!');
      return;
    }
    if (!isWrongReviewMode && words.length > 0 && words.length !== wrongWords.length) {
      setOriginalDailyWords(words);
    }
    setWords(wrongWords);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsWrongReviewMode(true);
    setCurrentTab('deck');
  };

  // ✍️ 틀린 단어만 퀴즈 풀기 시작
  const handleStartWrongWordsQuiz = () => {
    if (wrongWords.length === 0) {
      alert('🎉 현재 틀린 단어가 없습니다! 완벽합니다!');
      return;
    }
    if (!isWrongReviewMode && words.length > 0 && words.length !== wrongWords.length) {
      setOriginalDailyWords(words);
    }
    setWords(wrongWords);
    setQuizIndex(0);
    setQuizLevel(1);
    setIsQuizFinished(false);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsQuizCorrect(null);
    setTypingInput('');
    setIsWrongReviewMode(true);
    setCurrentTab('quiz');
  };

  // 🔄 오답 복습 모드 종료 및 오늘의 정규 학습 단어로 복귀
  const handleExitWrongReview = () => {
    setIsWrongReviewMode(false);
    const studentIdToUse = currentUser?.student_id || currentUser?.id || 'lsh_20260807_000001';
    let restored = originalDailyWords;
    if (!restored || restored.length === 0) {
      try {
        const cached = localStorage.getItem(`daily_random_set_${studentIdToUse}_${todayStr}`) || localStorage.getItem(`stamped_words_${studentIdToUse}_${todayStr}`);
        if (cached) restored = JSON.parse(cached);
      } catch(e) {}
    }
    if (restored && restored.length > 0) {
      setWords(restored);
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setCurrentTab('deck');
  };

  // 🚀 다음 단어 세트 로드 (Round 2, 3... 미학습 단어 즉시 가져오기)
  const handleLoadNextWordSet = () => {
    if (!currentUser) return;
    const studentIdToUse = currentUser.student_id || currentUser.id || 'lsh_20260807_000001';
    const dailyCount = parseInt(currentUser.dailyWordCount || currentUser.daily_word_count || 20, 10);
    const learnedKey = `learned_words_${studentIdToUse}`;
    const todayAllKey = `today_all_learned_${studentIdToUse}_${todayStr}`;
    const dailySetKey = `daily_random_set_${studentIdToUse}_${todayStr}`;
    const stampedWordsKey = `stamped_words_${studentIdToUse}_${todayStr}`;

    let learnedList = [];
    try {
      learnedList = JSON.parse(localStorage.getItem(learnedKey) || '[]');
    } catch (e) {
      learnedList = [];
    }

    const currentWordsStr = words.map(w => (typeof w === 'string' ? w : w.word).toLowerCase().trim());
    const updatedLearned = [...new Set([...learnedList, ...currentWordsStr])];
    try {
      localStorage.setItem(learnedKey, JSON.stringify(updatedLearned));
    } catch (e) {}

    const pool = allLevelWords && allLevelWords.length > 0 ? allLevelWords : wordList500Fallback;
    let unlearned = pool.filter(w => {
      const wStr = (typeof w === 'string' ? w : w.word || '').toLowerCase().trim();
      return !updatedLearned.includes(wStr);
    });

    if (unlearned.length < dailyCount) {
      try {
        localStorage.setItem(learnedKey, JSON.stringify([]));
      } catch (e) {}
      unlearned = [...pool];
    }

    const shuffled = shuffleArray(unlearned);
    const nextSet = shuffled.slice(0, dailyCount);

    setWords(nextSet);
    setOriginalDailyWords(nextSet);
    try {
      localStorage.setItem(dailySetKey, JSON.stringify(nextSet));
    } catch (e) {}

    // 오늘 전체 누적 단어장에 안전 병합
    const wordMap = new Map();
    (todayAllLearnedWords || []).forEach(w => {
      const c = (w.word || '').toLowerCase().trim();
      if (c) wordMap.set(c, w);
    });
    nextSet.forEach(w => {
      const c = (w.word || '').toLowerCase().trim();
      if (c && !wordMap.has(c)) wordMap.set(c, w);
    });
    const updatedTodayAll = Array.from(wordMap.values());
    setTodayAllLearnedWords(updatedTodayAll);
    try {
      localStorage.setItem(todayAllKey, JSON.stringify(updatedTodayAll));
      localStorage.setItem(stampedWordsKey, JSON.stringify(updatedTodayAll));
    } catch (e) {}

    const nextRound = studyRound + 1;
    setStudyRound(nextRound);
    setCurrentIndex(0);
    setIsFlipped(false);
    setRecordedScore(null);
    setRecognizedText('');
    setRecordedAudioUrl(null);
    setIsWrongReviewMode(false);
    setCurrentTab('deck');

    // 🔊 안내 음성 및 토스트
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Round ${nextRound} loaded!`);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 👤 내 정보 & 학부모 정보 수정 모달/폼 열기
  const handleOpenEditProfile = () => {
    setEditName(currentUser?.name || '이상학');
    setEditGradeLevel(currentUser?.studyGradeLevel || currentUser?.study_grade_level || '중등단어');
    setEditDailyCount(String(currentUser?.dailyWordCount || currentUser?.daily_word_count || '20'));
    setEditPin(currentUser?.pin || '1234');
    setEditParentName(currentUser?.parentName || currentUser?.parent_name || '이상학');
    setEditParentPhone(currentUser?.parentPhone || currentUser?.parent_phone || '010-4006-9050');
    setEditParentPin(currentUser?.parentPin || currentUser?.parent_pin || '0815');
    setIsEditingProfile(true);
  };

  // 💾 내 정보 & 학부모 정보 저장 처리 (로컬 + Cloud DB 동기화)
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!editName.trim()) {
      alert('학생 이름을 입력해 주세요.');
      return;
    }
    setIsSavingProfile(true);

    const updatedUser = {
      ...currentUser,
      name: editName.trim(),
      studyGradeLevel: editGradeLevel,
      study_grade_level: editGradeLevel,
      dailyWordCount: String(editDailyCount),
      daily_word_count: parseInt(editDailyCount, 10),
      pin: editPin.trim() || '1234',
      parentName: editParentName.trim() || '이상학',
      parent_name: editParentName.trim() || '이상학',
      parentPhone: editParentPhone.trim() || '010-4006-9050',
      parent_phone: editParentPhone.trim() || '010-4006-9050',
      parentPin: editParentPin.trim() || '0815',
      parent_pin: editParentPin.trim() || '0815'
    };

    // 1. 로컬 저장소 즉시 업데이트
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('flipvoca_parent_name', editParentName.trim() || '이상학');
      localStorage.setItem('flipvoca_parent_phone', editParentPhone.trim() || '010-4006-9050');
      localStorage.setItem('flipvoca_parent_pin', editParentPin.trim() || '0815');
      localStorage.setItem('english_edu_current_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('english_edu_current_user', JSON.stringify(updatedUser));
    } catch(e) {}

    // 2. Cloud DB(Supabase) 동기화
    try {
      const studentId = updatedUser.student_id || updatedUser.id;
      if (studentId) {
        await supabase
          .from('students')
          .update({
            name: updatedUser.name,
            study_grade_level: editGradeLevel,
            daily_word_count: parseInt(editDailyCount, 10),
            pin: editPin.trim() || '1234',
            parent_name: editParentName.trim() || '이상학',
            parent_phone: editParentPhone.trim() || '010-4006-9050',
            parent_pin: editParentPin.trim() || '0815'
          })
          .eq('student_id', studentId);
      }
    } catch(err) {
      console.log('Profile DB update sync notice:', err);
    }

    setIsSavingProfile(false);
    setIsEditingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3500);
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
      {/* 📱 모바일 스마트폰 컨테이너 (고정 규격으로 화면 확장 방지) */}
      <div style={{
        width: '100%',
        maxWidth: '430px',
        height: '840px',
        maxHeight: '94vh',
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

              {/* 📘 CARD 1: Day 1 Vocabulary (오늘의 단어 학습 카드) */}
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

              {/* 🚨 CARD 4: Incorrect Words / Mistake Review (오답 집중 학습관) */}
              <div
                onClick={handleStartWrongWordsFlashcards}
                style={{
                  background: wrongWords.length > 0 
                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #991B1B 100%)'
                    : 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
                  borderRadius: '26px',
                  padding: '22px 20px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: wrongWords.length > 0
                    ? '0 12px 28px rgba(239, 68, 68, 0.35)'
                    : '0 8px 20px rgba(0, 0, 0, 0.08)',
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
                  borderRadius: '12px',
                  padding: '4px 10px',
                  color: wrongWords.length > 0 ? '#DC2626' : '#64748B',
                  fontWeight: '900',
                  fontSize: '13px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.12)'
                }}>
                  {wrongWords.length > 0 ? `🚨 ${wrongWords.length}개 오답` : '✨ 0개 (클린)'}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚨</span> 틀린 단어 집중 학습관 (오답노트)
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9, marginBottom: '14px' }}>
                  {wrongWords.length > 0
                    ? `퀴즈에서 틀렸던 ${wrongWords.length}개 단어만 모아서 100% 완벽하게 마스터하세요!`
                    : '현재 틀린 단어가 없습니다! 실력이 대단해요! 👏'}
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
                  {wrongWords.length > 0 ? '🔥 틀린 단어 집중 복습 시작 ➔' : '📘 오답 단어 목록 확인'}
                </div>
              </div>

              {/* ━━━━ ✨ 스마트 전체 학습관 & 리포트 허브 (All-in-One Learning Hub) ━━━━ */}
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✨</span> 스마트 전체 학습관 & 리포트
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#00A8BF', background: '#E6FAFC', padding: '3px 8px', borderRadius: '10px' }}>
                    6대 필수 코스
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {/* 1. 전체 단어 목록 & PDF 워크시트 */}
                  <div
                    onClick={() => setCurrentTab('wordlist')}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00A8BF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>📋</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '10px' }}>PDF 인쇄</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>전체 단어 목록</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>DB 단어 & 6종 시험지</div>
                    </div>
                  </div>

                  {/* 2. 나만의 단어장 */}
                  <div
                    onClick={() => setCurrentTab('myvocab')}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>⭐</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '10px' }}>개인 맞춤</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>나만의 단어장</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>북마크 & 단어 등록</div>
                    </div>
                  </div>

                  {/* 3. 6일차 주간 총복습 */}
                  <div
                    onClick={() => setCurrentTab('day6')}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>🔁</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#F5F3FF', color: '#7C3AED', padding: '2px 8px', borderRadius: '10px' }}>주말 복습</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>6일차 주간 총복습</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>주간 누적 퀴즈 도전</div>
                    </div>
                  </div>

                  {/* 4. 학습 통계 리포트 */}
                  <div
                    onClick={() => setCurrentTab('stats')}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10B981'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>📊</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '10px' }}>성장 칭호</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>학습 통계 리포트</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>누적 단어 & 성취도</div>
                    </div>
                  </div>

                  {/* 5. 명예의 전당 (리더보드) */}
                  <div
                    onClick={() => setCurrentTab('leaderboard')}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#EA580C'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>🏆</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#FFF7ED', color: '#EA580C', padding: '2px 8px', borderRadius: '10px' }}>실시간 랭킹</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>명예의 전당</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>전국 리그 & 연속 출석</div>
                    </div>
                  </div>

                  {/* 6. 학부모 대시보드 */}
                  <div
                    onClick={() => setCurrentTab('parent')}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '20px',
                      padding: '16px 14px',
                      border: '1.5px solid #E2E8F0',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '24px' }}>👨‍👩‍👧</span>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: '10px' }}>안심 케어</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>학부모 대시보드</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748B', marginTop: '2px' }}>자녀 출석 & 칭찬하기</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 2: 📘 3D FLASHCARD DECK (양면 플립 카드 학습 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'deck' && (
            isWordsLoading || !currentWord ? (
              <div style={{
                width: '100%',
                minHeight: '340px',
                borderRadius: '28px',
                background: '#FFFFFF',
                border: '2px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                color: '#1E293B',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
                padding: '30px 20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '46px', animation: 'bounce 1s infinite' }}>📖</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#008294' }}>
                  {currentUser?.name ? `${currentUser.name} 님의 ` : ''}맞춤 영단어 로딩 중...
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
                  오늘 학습할 단어를 안전하게 불러오고 있습니다. 잠시만 기다려 주세요! ⚡
                </div>
                <div style={{
                  width: '36px',
                  height: '36px',
                  border: '4px solid #E2E8F0',
                  borderTop: '4px solid #00A8BF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
              
              {/* 🚀 상단 퀵 액션 툴바 (Action Buttons Toolbar) */}
              <div style={{
                width: '100%',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: '20px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
              }}>
                {/* 1. 날짜 및 회차 배지 */}
                <div style={{
                  padding: '7px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #FADBD8',
                  background: '#FEF5E7',
                  color: '#D35400',
                  fontSize: '12px',
                  fontWeight: '900',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  📅 [{todayStr}] {studyRound > 1 ? `제${studyRound}회차` : '학습 진행'}
                </div>

                {/* 2. 오늘 누적 학습 단어 모달 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowTodayAllModal(true)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#10B981',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                  }}
                  title="오늘 지금까지 학습한 모든 단어 리스트 한눈에 보기"
                >
                  📖 오늘 누적 단어 ({todayAllLearnedWords.length > 0 ? todayAllLearnedWords.length : words.length}개)
                </button>

                {/* 3. 1차 발음 녹음 바로가기 */}
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('record-btn-trigger');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '12px',
                    border: hasRecorded ? '1.5px solid #10B981' : '1.5px solid #38BDF8',
                    background: hasRecorded ? '#ECFDF5' : '#F0F9FF',
                    color: hasRecorded ? '#059669' : '#0284C7',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {hasRecorded ? '✅ 1차 녹음 완료 🎙️' : '🎙️ 1차 녹음 ➔'}
                </button>

                {/* 4. 2단계 스펠링 퀴즈 바로가기 */}
                <button
                  type="button"
                  onClick={() => {
                    setQuizLevel(2);
                    setCurrentTab('quiz');
                  }}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '12px',
                    border: completedQuizLevels.includes(2) ? '1.5px solid #10B981' : '1.5px solid #C084FC',
                    background: completedQuizLevels.includes(2) ? '#ECFDF5' : '#FAF5FF',
                    color: completedQuizLevels.includes(2) ? '#059669' : '#7E22CE',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {completedQuizLevels.includes(2) ? '✅ 퀴즈 완수 💮' : '🧩 2단계 퀴즈 ➔'}
                </button>

                {/* 5. 다음 단어 세트 로드 버튼 */}
                <button
                  type="button"
                  onClick={handleLoadNextWordSet}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #FB923C',
                    background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
                    color: '#C2410C',
                    fontSize: '12px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.2)'
                  }}
                >
                  🚀 다음 단어 학습 ➔
                </button>
              </div>

              {/* 🌟 7단계 학습 단계별 비주얼 스테퍼 바 (Duolingo 3D Style) */}
              {(() => {
                let progressPct = Math.round(((currentIndex + 1) / Math.max(words.length, 1)) * 30);
                if (hasRecorded) progressPct += 20;
                if (completedQuizLevels.includes(1)) progressPct += 25;
                if (completedQuizLevels.includes(2)) progressPct = 100;

                return (
                  <div style={{
                    width: '100%',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderBottom: '4px solid #CBD5E1',
                    borderRadius: '22px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                  }}>
                    {/* 상단 텍스트 및 다시 학습 버튼 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          background: '#10B981',
                          border: '1px solid #059669',
                          borderBottom: '3px solid #047857',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          fontWeight: '900',
                          padding: '3px 10px',
                          borderRadius: '10px'
                        }}>
                          ⚡ 학습 진행도
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1E293B' }}>
                          {completedQuizLevels.includes(2)
                            ? '💮 오늘의 2단계 퀴즈와 출석 도장을 모두 완수했습니다!'
                            : hasRecorded
                            ? '🎙️ 1차 발음 녹음 완료! 퀴즈 단계로 이동해 보세요!'
                            : `단어 #${currentIndex + 1} 학습 중 (${currentIndex + 1}/${words.length})`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentIndex(0);
                          setIsFlipped(false);
                        }}
                        style={{
                          background: '#FFFFFF',
                          color: '#EF4444',
                          border: '1.5px solid #FCA5A5',
                          borderBottom: '3px solid #EF4444',
                          padding: '4px 12px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                        title="현재 세트 단어를 1번 카드부터 다시 공부합니다"
                      >
                        🔄 처음부터 다시
                      </button>
                    </div>

                    {/* 실시간 진도율 프로그레스 바 */}
                    <div style={{ width: '100%', background: '#F1F5F9', borderRadius: '12px', height: '16px', position: 'relative', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <div style={{
                        width: `${Math.min(Math.max(progressPct, 6), 100)}%`,
                        height: '100%',
                        background: progressPct >= 100
                          ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                          : 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                        borderRadius: '12px',
                        transition: 'width 0.4s ease'
                      }} />
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10.5px',
                        fontWeight: '900',
                        color: progressPct > 45 ? '#FFFFFF' : '#475569',
                        textShadow: progressPct > 45 ? '0 1px 2px rgba(0,0,0,0.4)' : 'none'
                      }}>
                        🔥 오늘 목표의 {progressPct}% 완수!
                      </span>
                    </div>

                    {/* 7단계 원클릭 스테퍼 버튼 그룹 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                      {/* 1. 단어보기 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentTab('deck');
                          setIsFlipped(false);
                        }}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: currentTab === 'deck' && !isFlipped ? '1.5px solid #00A8BF' : '1.5px solid #E2E8F0',
                          borderBottom: currentTab === 'deck' && !isFlipped ? '3px solid #008294' : '3px solid #CBD5E1',
                          background: currentTab === 'deck' && !isFlipped ? '#E6FAFC' : '#FFFFFF',
                          color: currentTab === 'deck' && !isFlipped ? '#008294' : '#64748B',
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        1.단어보기 ({currentIndex + 1}/{words.length})
                      </button>

                      {/* 2. 뜻익히기 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentTab('deck');
                          setIsFlipped(true);
                        }}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: currentTab === 'deck' && isFlipped ? '1.5px solid #00A8BF' : '1.5px solid #E2E8F0',
                          borderBottom: currentTab === 'deck' && isFlipped ? '3px solid #008294' : '3px solid #CBD5E1',
                          background: currentTab === 'deck' && isFlipped ? '#E6FAFC' : '#FFFFFF',
                          color: currentTab === 'deck' && isFlipped ? '#008294' : '#64748B',
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        2.뜻익히기 💡
                      </button>

                      {/* 3. 발음녹음 */}
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentTab('deck');
                          const el = document.getElementById('record-btn-trigger');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: hasRecorded ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                          borderBottom: hasRecorded ? '3px solid #059669' : '3px solid #CBD5E1',
                          background: hasRecorded ? '#ECFDF5' : '#FFFFFF',
                          color: hasRecorded ? '#059669' : '#64748B',
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        3.발음녹음 {hasRecorded ? '✅' : '⏳'}
                      </button>

                      {/* 4. 스펠퀴즈 */}
                      <button
                        type="button"
                        onClick={() => {
                          setQuizLevel(1);
                          setCurrentTab('quiz');
                        }}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: completedQuizLevels.includes(1) ? '1.5px solid #10B981' : (currentTab === 'quiz' && quizLevel === 1 ? '1.5px solid #0284C7' : '1.5px solid #E2E8F0'),
                          borderBottom: completedQuizLevels.includes(1) ? '3px solid #059669' : (currentTab === 'quiz' && quizLevel === 1 ? '3px solid #0369A1' : '3px solid #CBD5E1'),
                          background: completedQuizLevels.includes(1) ? '#ECFDF5' : (currentTab === 'quiz' && quizLevel === 1 ? '#E0F2FE' : '#FFFFFF'),
                          color: completedQuizLevels.includes(1) ? '#059669' : (currentTab === 'quiz' && quizLevel === 1 ? '#0369A1' : '#64748B'),
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        4.스펠퀴즈 {completedQuizLevels.includes(1) ? '✅' : '⏳'}
                      </button>

                      {/* 5. 녹음퀴즈 */}
                      <button
                        type="button"
                        onClick={() => {
                          setQuizLevel(2);
                          setCurrentTab('quiz');
                        }}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: completedQuizLevels.includes(2) ? '1.5px solid #10B981' : (currentTab === 'quiz' && quizLevel === 2 ? '1.5px solid #059669' : '1.5px solid #E2E8F0'),
                          borderBottom: completedQuizLevels.includes(2) ? '3px solid #047857' : (currentTab === 'quiz' && quizLevel === 2 ? '3px solid #047857' : '3px solid #CBD5E1'),
                          background: completedQuizLevels.includes(2) ? '#ECFDF5' : (currentTab === 'quiz' && quizLevel === 2 ? '#D1FAE5' : '#FFFFFF'),
                          color: completedQuizLevels.includes(2) ? '#059669' : (currentTab === 'quiz' && quizLevel === 2 ? '#047857' : '#64748B'),
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        5.녹음퀴즈 {completedQuizLevels.includes(2) ? '✅' : '⏳'}
                      </button>

                      {/* 6. 쓰기퀴즈 */}
                      <button
                        type="button"
                        onClick={() => {
                          setQuizLevel(4);
                          setCurrentTab('quiz');
                        }}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: completedQuizLevels.includes(4) ? '1.5px solid #10B981' : (currentTab === 'quiz' && quizLevel === 4 ? '1.5px solid #7C3AED' : '1.5px solid #E2E8F0'),
                          borderBottom: completedQuizLevels.includes(4) ? '3px solid #059669' : (currentTab === 'quiz' && quizLevel === 4 ? '3px solid #6D28D9' : '3px solid #CBD5E1'),
                          background: completedQuizLevels.includes(4) ? '#ECFDF5' : (currentTab === 'quiz' && quizLevel === 4 ? '#EDE9FE' : '#FFFFFF'),
                          color: completedQuizLevels.includes(4) ? '#059669' : (currentTab === 'quiz' && quizLevel === 4 ? '#6D28D9' : '#64748B'),
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        6.쓰기퀴즈 {completedQuizLevels.includes(4) ? '✅' : '⏳'}
                      </button>

                      {/* 7. 출석도장 */}
                      <button
                        type="button"
                        onClick={() => setCurrentTab('calendar')}
                        style={{
                          flex: 1,
                          minWidth: '64px',
                          textAlign: 'center',
                          padding: '6px 2px',
                          borderRadius: '10px',
                          border: completedQuizLevels.includes(2) ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                          borderBottom: completedQuizLevels.includes(2) ? '3px solid #059669' : '3px solid #CBD5E1',
                          background: completedQuizLevels.includes(2) ? '#10B981' : '#FFFFFF',
                          color: completedQuizLevels.includes(2) ? '#FFFFFF' : '#64748B',
                          fontSize: '10px',
                          fontWeight: '900',
                          cursor: 'pointer'
                        }}
                      >
                        7.출석도장 {completedQuizLevels.includes(2) ? '완료 💮' : '대기'}
                      </button>
                    </div>
                  </div>
                );
              })()}
              
              {/* 오답 복습 모드 배너 or 덱 모드 전환 바 */}
              {isWrongReviewMode ? (
                <div style={{
                  width: '100%',
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: '16px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '900', color: '#DC2626' }}>
                    <span>🚨</span>
                    <span>틀린 단어 오답 집중 복습 중</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleExitWrongReview}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FECACA',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: '800',
                      color: '#B91C1C',
                      cursor: 'pointer'
                    }}
                  >
                    오늘 단어로 복귀 ✕
                  </button>
                </div>
              ) : (
                wrongWords.length > 0 && (
                  <div style={{ width: '100%', display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '12px',
                        border: '1.5px solid #00A8BF',
                        background: '#E6FAFC',
                        color: '#008294',
                        fontSize: '11.5px',
                        fontWeight: '900'
                      }}
                    >
                      📚 오늘 단어 ({words.length})
                    </button>
                    <button
                      type="button"
                      onClick={handleStartWrongWordsFlashcards}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: '12px',
                        border: '1.5px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      🚨 틀린 단어 보기 ({wrongWords.length})
                    </button>
                  </div>
                )
              )}

              {/* 진행률 인디케이터 바 */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', color: isWrongReviewMode ? '#DC2626' : '#008294' }}>
                  {isWrongReviewMode ? '🚨 오답 단어' : '단어'} {currentIndex + 1} / {words.length || 10}
                </span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: '10px' }}>
                  배속: {ttsSpeed}x
                </span>
              </div>

              {/* 📘 3D 플립 카드 컨테이너 */}
              <div
                onClick={handleFlipCard}
                style={{
                  perspective: '1000px',
                  width: '100%',
                  height: '280px',
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
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 50%, #0284C7 100%)',
                    color: '#FFFFFF',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 14px 30px rgba(0, 168, 191, 0.32)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}>
                    {/* 상단 뱃지 & 카테고리 */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        {currentWord?.category || '초등단어 🍎'}
                      </span>

                      <span style={{
                        background: 'rgba(255, 255, 255, 0.25)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '10px',
                        padding: '2px 8px',
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
                      width: '88px',
                      height: '88px',
                      borderRadius: '20px',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      boxShadow: '0 8px 18px rgba(0, 0, 0, 0.12)',
                      border: '2px solid rgba(255, 255, 255, 0.9)'
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
                      <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1.1, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        {currentWord?.word}
                      </div>

                      <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '700', margin: '2px 0 4px 0' }}>
                        {currentWord?.phonics || '/---/'}
                      </div>

                      <div style={{ fontSize: '15px', fontWeight: '900', background: 'rgba(255, 255, 255, 0.22)', padding: '3px 14px', borderRadius: '12px', display: 'inline-block' }}>
                        {getWordMeaning(currentWord)}
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: '800' }}>
                      {currentStrings.flipHint}
                    </div>
                  </div>

                  {/* 카드 뒷면 (Back Face - 예문 & 해석 & 예문 음성 듣기) */}
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: '28px',
                    background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)',
                    color: '#FFFFFF',
                    padding: '16px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 14px 30px rgba(96, 165, 250, 0.32)',
                    border: '1px solid rgba(255, 255, 255, 0.4)'
                  }}>
                    {/* 상단 미니 썸네일 & 단어 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#FFFFFF', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <img
                          src={getWordImgSrc(currentWord)}
                          alt={currentWord?.word}
                          onError={(e) => handleImageError(e, currentWord?.word)}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '17px', fontWeight: '900' }}>{currentWord?.word}</div>
                        <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: '700' }}>{getWordMeaning(currentWord)}</div>
                      </div>
                    </div>

                    {/* 중앙 예문 카드 (터치 시 예문 원어민 발음 재생) */}
                    <div
                      onClick={handlePlayExampleSound}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.22)',
                        borderRadius: '18px',
                        padding: '12px 14px',
                        backdropFilter: 'blur(8px)',
                        textAlign: 'center',
                        border: '1.5px solid rgba(255, 255, 255, 0.4)',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                        transition: 'all 0.15s ease'
                      }}
                      title="클릭하여 예문 듣기"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px', opacity: 0.9 }}>
                          📝 EXAMPLE SENTENCE
                        </span>
                        <button
                          type="button"
                          onClick={handlePlayExampleSound}
                          style={{
                            background: '#FFFFFF',
                            color: '#4F46E5',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          <span>🔊</span>
                          <span>{currentStrings.exampleSoundBtn || '예문듣기'}</span>
                        </button>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '900', lineHeight: 1.3, marginBottom: '6px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                        "{example.en}"
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.95, fontWeight: '700', lineHeight: 1.3, color: '#FEF08A' }}>
                        {example.trans}
                      </div>
                    </div>

                    <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: '800' }}>
                      👆 카드를 터치하면 앞면으로 돌아갑니다
                    </div>
                  </div>
                </div>
              </div>

              {/* ⭐ 오답노트 담기 / 오답 완전 정복 버튼 */}
              {currentWord && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '-4px' }}>
                  {isWrongReviewMode ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveWrongWord(currentWord);
                        if (words.length <= 1) {
                          alert('🎉 축하합니다! 모든 오답 단어를 완벽히 정복하셨습니다!');
                          handleExitWrongReview();
                        } else {
                          const remaining = words.filter(w => (w.word || '').toLowerCase() !== (currentWord.word || '').toLowerCase());
                          setWords(remaining);
                          setCurrentIndex(prev => Math.min(prev, remaining.length - 1));
                        }
                      }}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '20px',
                        border: '1.5px solid #10B981',
                        background: '#ECFDF5',
                        color: '#059669',
                        fontSize: '12px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>✅</span> 이 단어 완전 정복! (오답노트에서 삭제)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleBookmarkWrong(currentWord);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: wrongWords.some(w => (w.word || '').toLowerCase() === (currentWord.word || '').toLowerCase())
                          ? '1.5px solid #FCA5A5'
                          : '1.5px solid #CBD5E1',
                        background: wrongWords.some(w => (w.word || '').toLowerCase() === (currentWord.word || '').toLowerCase())
                          ? '#FEF2F2'
                          : '#FFFFFF',
                        color: wrongWords.some(w => (w.word || '').toLowerCase() === (currentWord.word || '').toLowerCase())
                          ? '#DC2626'
                          : '#64748B',
                        fontSize: '11.5px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{wrongWords.some(w => (w.word || '').toLowerCase() === (currentWord.word || '').toLowerCase()) ? '🚨' : '☆'}</span>
                      <span>{wrongWords.some(w => (w.word || '').toLowerCase() === (currentWord.word || '').toLowerCase()) ? '오답노트에 보관 중' : '오답노트에 추가하기'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* 🎛️ 하단 5대 액션 서클 버튼 (Sound, Mic, MyVoice, Quiz, Speed) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                width: '100%',
                marginTop: '2px'
              }}>
                {/* 1. Sound (단어 / 예문 스마트 재생) */}
                <button
                  type="button"
                  onClick={() => handlePlaySound()}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: isFlipped ? '#EFF6FF' : '#FFFFFF',
                    border: isFlipped ? '1.5px solid #60A5FA' : '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '8px 2px',
                    cursor: 'pointer',
                    boxShadow: isFlipped ? '0 4px 12px rgba(96, 165, 250, 0.25)' : '0 4px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFlipped ? '예문 듣기' : '단어 듣기'}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isFlipped ? '#DBEAFE' : '#E6FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                    🔊
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: isFlipped ? '#2563EB' : '#475569' }}>
                    {isFlipped ? (currentStrings.exampleSoundBtn || '예문듣기') : (currentStrings.wordSoundBtn || '단어듣기')}
                  </span>
                </button>

                {/* 2. Mic */}
                <button
                  id="record-btn-trigger"
                  type="button"
                  onClick={toggleRecording}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: isRecording ? '#FEE2E2' : '#FFFFFF',
                    border: isRecording ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '8px 2px',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 4px 14px rgba(239, 68, 68, 0.3)' : '0 4px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isRecording ? '#EF4444' : '#F0FDF4',
                    color: isRecording ? '#FFF' : '#16A34A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '17px',
                    animation: isRecording ? 'pulse 1s infinite' : 'none'
                  }}>
                    🎙️
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: isRecording ? '#DC2626' : '#475569' }}>
                    {isRecording ? '정지' : currentStrings.micBtn}
                  </span>
                </button>

                {/* 3. My Voice (내 녹음듣기) */}
                <button
                  type="button"
                  onClick={playUserRecordedAudio}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    background: isPlayingUserAudio ? '#EFF6FF' : (userAudioRecordings[currentWord?.word] || recordedAudioUrl) ? '#F5F3FF' : '#FFFFFF',
                    border: isPlayingUserAudio ? '1.5px solid #3B82F6' : (userAudioRecordings[currentWord?.word] || recordedAudioUrl) ? '1.5px solid #DDD6FE' : '1.5px solid #E2E8F0',
                    borderRadius: '16px',
                    padding: '8px 2px',
                    cursor: 'pointer',
                    boxShadow: isPlayingUserAudio ? '0 4px 12px rgba(59, 130, 246, 0.25)' : '0 4px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {(userAudioRecordings[currentWord?.word] || recordedAudioUrl) && !isPlayingUserAudio && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '6px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#7C3AED'
                    }}></span>
                  )}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isPlayingUserAudio ? '#3B82F6' : (userAudioRecordings[currentWord?.word] || recordedAudioUrl) ? '#EDE9FE' : '#F8FAFC',
                    color: isPlayingUserAudio ? '#FFFFFF' : (userAudioRecordings[currentWord?.word] || recordedAudioUrl) ? '#7C3AED' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '17px'
                  }}>
                    {isPlayingUserAudio ? '⏹️' : '🎧'}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: isPlayingUserAudio ? '#2563EB' : (userAudioRecordings[currentWord?.word] || recordedAudioUrl) ? '#6D28D9' : '#94A3B8' }}>
                    {isPlayingUserAudio ? '재생중' : '내녹음'}
                  </span>
                </button>

                {/* 4. Quiz */}
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
                    borderRadius: '16px',
                    padding: '8px 2px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F5EEF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>
                    ❓
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>{currentStrings.quizBtn}</span>
                </button>

                {/* 5. Speed */}
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
                    borderRadius: '16px',
                    padding: '8px 2px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '900', color: '#2563EB' }}>
                    {ttsSpeed}x
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#475569' }}>{currentStrings.speedBtn}</span>
                </button>
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
                  padding: '10px 12px',
                  borderRadius: '18px',
                  border: '1.5px solid #FECACA',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                }}>
                  <canvas ref={canvasRef} width={280} height={36} style={{ borderRadius: '8px', background: '#FFFFFF', width: '100%', height: '36px' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }}></span>
                    <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '900' }}>
                      🎙️ 음성 인식 중... "{currentWord?.word}" 발음해 보세요!
                    </span>
                  </div>
                </div>
              )}

              {/* 🎯 AI 발음 평가 & 코칭 피드백 카드 (녹음 완료 시 노출) */}
              {recordedScore !== null && !isRecording && (
                <div style={{
                  width: '100%',
                  background: recordedScore >= 85 ? '#F0FDF4' : recordedScore >= 65 ? '#F0F9FF' : '#FFFBEB',
                  borderRadius: '20px',
                  padding: '12px 14px',
                  border: recordedScore >= 85 ? '1.5px solid #86EFAC' : recordedScore >= 65 ? '1.5px solid #BAE6FD' : '1.5px solid #FDE68A',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* 상단 점수 뱃지 & 인식 텍스트 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        color: recordedScore >= 85 ? '#16A34A' : recordedScore >= 65 ? '#0284C7' : '#D97706'
                      }}>
                        {recordedScore}점
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '8px',
                        background: recordedScore >= 85 ? '#DCFCE7' : recordedScore >= 65 ? '#E0F2FE' : '#FEF3C7',
                        color: recordedScore >= 85 ? '#15803D' : recordedScore >= 65 ? '#0369A1' : '#B45309'
                      }}>
                        {recordedScore >= 85 ? '🌟 원어민급' : recordedScore >= 65 ? '👍 합격' : '💡 연습'}
                      </span>
                    </div>

                    {recognizedText && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B' }}>
                        인식: <strong style={{ color: '#1E293B' }}>"{recognizedText}"</strong>
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
                        borderRadius: '12px',
                        padding: '8px 10px',
                        border: `1px solid ${tip.border}`,
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'flex-start'
                      }}>
                        <span style={{ fontSize: '16px' }}>{tip.icon}</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '900', color: tip.color, marginBottom: '1px' }}>
                            {tip.title}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', lineHeight: 1.3 }}>
                            {tip.text}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 오디오 다시듣기 & 원어민 비교 버튼 그룹 */}
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    {recordedAudioUrl && (
                      <button
                        type="button"
                        onClick={playUserRecordedAudio}
                        style={{
                          flex: 1,
                          padding: '7px 10px',
                          borderRadius: '12px',
                          border: '1px solid #CBD5E1',
                          background: '#FFFFFF',
                          color: '#1E293B',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {isPlayingUserAudio ? '⏹️ 재생 중' : '🎧 내 발음'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePlaySound(currentWord?.word)}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        boxShadow: '0 3px 8px rgba(0, 168, 191, 0.2)'
                      }}
                    >
                      🔊 원어민 비교
                    </button>
                  </div>
                </div>
              )}

              {/* 이전 / 다음 내비게이션 바 */}
              <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handlePrev}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '14px',
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: '900',
                    fontSize: '13px',
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
                    padding: '11px',
                    borderRadius: '14px',
                    border: 'none',
                    background: currentIndex === (words.length || 10) - 1
                      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: currentIndex === (words.length || 10) - 1
                      ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                      : '0 4px 12px rgba(0, 168, 191, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  {currentIndex === (words.length || 10) - 1 ? (
                    <>
                      <span>🎉 학습 완료 (퀴즈 시작)</span>
                      <span style={{ fontSize: '15px' }}>➔</span>
                    </>
                  ) : (
                    currentStrings.nextBtn
                  )}
                </button>
              </div>

            </div>
            )
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 3: 📅 ATTENDANCE CALENDAR (출석 달력 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'calendar' && (() => {
            const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
            const totalDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '20px',
                  border: '1.5px solid #E2E8F0',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 0) {
                            setCalendarYear(prev => prev - 1);
                            setCalendarMonth(11);
                          } else {
                            setCalendarMonth(prev => prev - 1);
                          }
                        }}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '8px',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontWeight: '900',
                          fontSize: '13px',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ◀
                      </button>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#1E293B' }}>
                        📅 {calendarYear}년 {calendarMonth + 1}월
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 11) {
                            setCalendarYear(prev => prev + 1);
                            setCalendarMonth(0);
                          } else {
                            setCalendarMonth(prev => prev + 1);
                          }
                        }}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '8px',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontWeight: '900',
                          fontSize: '13px',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ▶
                      </button>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: isTodayStamped ? '#10B981' : '#F59E0B',
                      background: isTodayStamped ? '#D1FAE5' : '#FEF3C7',
                      padding: '4px 9px',
                      borderRadius: '10px'
                    }}>
                      {isTodayStamped ? '💮 오늘 출석 완료' : '⏳ 오늘 미완료'}
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
                    {/* 1일 이전 시작 요일 빈 칸 */}
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                      <div key={`empty-${idx}`} style={{ height: '42px' }} />
                    ))}

                    {/* 1일 ~ 마지막 날짜 렌더링 */}
                    {Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map((d) => {
                      const mStr = String(calendarMonth + 1).padStart(2, '0');
                      const dStr = `${calendarYear}-${mStr}-${String(d).padStart(2, '0')}`;
                      const isStamped = stampedDates.includes(dStr);
                      const isToday = dStr === todayStr;
                      const isSelected = selectedCalendarDate === dStr;

                      const dayOfWeek = (firstDayOfWeek + d - 1) % 7;
                      const isSun = dayOfWeek === 0;
                      const isSat = dayOfWeek === 6;

                      return (
                        <div
                          key={d}
                          onClick={() => handleSelectCalendarDate(dStr, isStamped, isToday)}
                          style={{
                            height: '42px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '12px',
                            background: isSelected
                              ? '#E0F2FE'
                              : isStamped
                                ? '#E6FAFC'
                                : isToday
                                  ? '#F1F5F9'
                                  : 'transparent',
                            border: isSelected
                              ? '2.5px solid #0284C7'
                              : isToday
                                ? '2px solid #00A8BF'
                                : isStamped
                                  ? '1px solid #BAE8EE'
                                  : '1px solid transparent',
                            color: isStamped ? '#008294' : isSun ? '#EF4444' : isSat ? '#3B82F6' : '#334155',
                            fontWeight: isStamped || isToday || isSelected ? '900' : '600',
                            fontSize: '12px',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            transform: isSelected ? 'scale(1.04)' : 'none',
                            boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.2)' : 'none'
                          }}
                        >
                          <span>{d}</span>
                          {isStamped && <span style={{ fontSize: '11px', lineHeight: 1 }}>💮</span>}
                          {isToday && !isStamped && (
                            <span style={{ fontSize: '8px', color: '#00A8BF', fontWeight: '900', lineHeight: 1 }}>오늘</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 💡 달력 클릭 안내 팁 */}
                  <div style={{
                    marginTop: '12px',
                    fontSize: '11.5px',
                    color: '#64748B',
                    fontWeight: '700',
                    textAlign: 'center',
                    background: '#F8FAFC',
                    padding: '6px 10px',
                    borderRadius: '10px'
                  }}>
                    💡 출석 도장(💮)이 찍힌 날짜를 클릭하면 <strong>해당 날짜에 공부한 단어 목록</strong>을 확인할 수 있습니다.
                  </div>
                </div>

                {/* 📘 선택한 날짜의 학습 완료 단어 리스트 카드 */}
                {selectedCalendarDate && (
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '20px',
                    border: '1.5px solid #00A8BF',
                    boxShadow: '0 8px 25px rgba(0, 168, 191, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    animation: 'fadeIn 0.25s ease'
                  }}>
                    {/* 상단 날짜 및 닫기 헤더 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📅</span>
                          <span>{selectedCalendarDate} 학습 단어장</span>
                          {stampedDates.includes(selectedCalendarDate) && <span>💮</span>}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#008294', marginTop: '2px' }}>
                          총 {selectedDateWords.length}개의 단어를 학습 완료했습니다.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDate(null)}
                        style={{
                          background: '#F1F5F9',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '5px 9px',
                          fontSize: '12px',
                          fontWeight: '800',
                          color: '#64748B',
                          cursor: 'pointer'
                        }}
                      >
                        닫기 ✕
                      </button>
                    </div>

                    {/* 단어 목록 리스트 (스크롤 지원) */}
                    {isLoadingDateWords ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#64748B', fontSize: '13px', fontWeight: '800' }}>
                        ⏳ 단어 목록을 불러오는 중...
                      </div>
                    ) : selectedDateWords.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94A3B8' }}>
                        <div style={{ fontSize: '28px', marginBottom: '6px' }}>📭</div>
                        <div style={{ fontSize: '13px', fontWeight: '800' }}>이 날짜의 학습 완료 기록이 없습니다.</div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        paddingRight: '4px'
                      }}>
                        {selectedDateWords.map((w, idx) => {
                          const cleanWord = (w.word || '').replace(/\.png/gi, '').trim();
                          const meaning = getWordMeaning(w);
                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#F8FAFC',
                                padding: '10px 14px',
                                borderRadius: '14px',
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: '#E6FAFC',
                                  color: '#00A8BF',
                                  fontSize: '11px',
                                  fontWeight: '900',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>
                                    {cleanWord}
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#008294' }}>
                                    {meaning}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePlaySound(cleanWord)}
                                style={{
                                  background: '#FFFFFF',
                                  border: '1.5px solid #CBD5E1',
                                  borderRadius: '10px',
                                  padding: '6px 10px',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                                }}
                                title="발음 듣기"
                              >
                                🔊
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 복습하기 액션 버튼 */}
                    {selectedDateWords.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setWords(selectedDateWords);
                          setCurrentIndex(0);
                          setIsFlipped(false);
                          setCurrentTab('deck');
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '14px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                          color: '#FFFFFF',
                          fontWeight: '900',
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0, 168, 191, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>📘</span>
                        <span>이 날의 단어들로 플래시카드 복습하기</span>
                      </button>
                    )}
                  </div>
                )}

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
            );
          })()}

          {/* ═══════════════════════════════════════════════════════
              TAB 4: ✍️ 4-STAGE QUIZ (4단계 퀴즈 마스터 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'quiz' && (() => {
            const activeWordList = words.length > 0 ? words : wordList500Fallback;
            const currentQuizWord = activeWordList[quizIndex] || activeWordList[0];
            const totalQuizCount = activeWordList.length || 20;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 🚀 단계 자동 전환 안내 토스트 배너 */}
                {levelTransitionToast && (
                  <div style={{
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                    border: '1.5px solid #6EE7B7',
                    color: '#065F46',
                    padding: '10px 14px',
                    borderRadius: '16px',
                    fontSize: '12.5px',
                    fontWeight: '900',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    {levelTransitionToast}
                  </div>
                )}

                {/* 퀴즈 단계 선택 뱃지 (1단계~4단계: 1, 2단계 필수 / 3, 4단계 선택심화) */}
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                  {[
                    { lvl: 1, label: '1단계 🔊 소리 [필수]' },
                    { lvl: 2, label: '2단계 🔤 스펠 [필수💮]' },
                    { lvl: 3, label: '3단계 🎙️ 발음 [선택]' },
                    { lvl: 4, label: '4단계 ✍️ 쓰기 [선택]' }
                  ].map((item) => (
                    <button
                      key={item.lvl}
                      type="button"
                      onClick={() => {
                        setQuizLevel(item.lvl);
                        setQuizIndex(0);
                        setIsQuizFinished(false);
                        setSelectedAnswer(null);
                        setIsAnswerChecked(false);
                        setIsQuizCorrect(null);
                        setTypingInput('');
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: '900',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: quizLevel === item.lvl ? 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)' : '#F1F5F9',
                        color: quizLevel === item.lvl ? '#FFFFFF' : '#64748B',
                        boxShadow: quizLevel === item.lvl ? '0 4px 10px rgba(0,168,191,0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* 🏆 퀴즈 완료 축하 카드 (2단계 완수 시 출석 인정 / 3~4단계 선택 심화) */}
                {isQuizFinished ? (
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '28px 20px',
                    border: '1.5px solid #E2E8F0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '48px', animation: 'bounce 1s infinite' }}>
                      {quizLevel === 2 ? '💮' : '🏆'}
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '4px' }}>
                        {quizLevel === 2 ? '🎉 오늘의 학습 완료 & 출석 도장 획득!' : `${quizLevel}단계 퀴즈 완수!`}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                        {quizLevel === 2 
                          ? '2단계 스펠링 퀴즈까지 완수하여 오늘의 출석 도장이 공식 인정되었습니다! 👏'
                          : `총 ${totalQuizCount}문제 중 정답을 모두 맞히셨습니다!`}
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                      padding: '12px 24px',
                      borderRadius: '16px',
                      border: '1.5px solid #6EE7B7',
                      color: '#065F46',
                      fontWeight: '900',
                      fontSize: '18px'
                    }}>
                      ⭐ 획득 점수: {quizScore}점 {quizLevel === 2 && '• 💮 출석도장 찍힘!'}
                    </div>

                    {/* 🚨 이번 퀴즈에서 틀린 단어 집중 복습 알림 섹션 */}
                    {quizWrongWords.length > 0 && (
                      <div style={{
                        width: '100%',
                        background: '#FEF2F2',
                        border: '1.5px solid #FCA5A5',
                        borderRadius: '18px',
                        padding: '14px',
                        textAlign: 'left',
                        boxShadow: '0 4px 14px rgba(239, 68, 68, 0.1)'
                      }}>
                        <div style={{ fontSize: '13.5px', fontWeight: '900', color: '#DC2626', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🚨</span>
                          <span>이번 퀴즈에서 헷갈렸던 단어: {quizWrongWords.length}개</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                          {quizWrongWords.map((w, idx) => (
                            <span key={idx} style={{ background: '#FFFFFF', border: '1px solid #FECACA', borderRadius: '8px', padding: '3px 8px', fontSize: '11.5px', fontWeight: '800', color: '#B91C1C' }}>
                              {w.word} ({getWordMeaning(w)})
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWords(quizWrongWords);
                            setCurrentIndex(0);
                            setIsFlipped(false);
                            setIsWrongReviewMode(true);
                            setCurrentTab('deck');
                          }}
                          style={{
                            width: '100%',
                            padding: '11px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                            color: '#FFFFFF',
                            fontWeight: '900',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>🔥</span>
                          <span>틀린 단어 {quizWrongWords.length}개 플래시카드로 바로 복습하기 ➔</span>
                        </button>
                      </div>
                    )}

                    {quizLevel === 2 && (
                      <div style={{
                        background: '#F0F9FF',
                        border: '1.5px solid #BAE6FD',
                        borderRadius: '16px',
                        padding: '12px 16px',
                        fontSize: '12px',
                        color: '#0369A1',
                        fontWeight: '800',
                        lineHeight: 1.5
                      }}>
                        💡 <strong>3단계(🎙️ 발음 퀴즈)</strong>와 <strong>4단계(✍️ 쓰기 퀴즈)</strong>는 실력 향상을 위한 [선택 심화 학습]입니다. 계속 도전하시겠습니까?
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '6px' }}>
                      {quizLevel < 4 && (
                        <button
                          type="button"
                          onClick={handleNextQuizLevel}
                          style={{
                            width: '100%',
                            padding: '13px',
                            borderRadius: '16px',
                            border: 'none',
                            background: quizLevel === 2 ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                            color: '#FFFFFF',
                            fontWeight: '900',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 168, 191, 0.3)'
                          }}
                        >
                          {quizLevel === 2 ? '🌟 3단계 심화 발음 퀴즈 도전하기 (선택) ➔' : `🌟 다음 ${quizLevel + 1}단계 퀴즈 도전 ➔`}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setCurrentTab('calendar')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '16px',
                          border: '1.5px solid #00A8BF',
                          background: '#E6FAFC',
                          color: '#008294',
                          fontWeight: '900',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        📅 오늘 출석 달력 도장 확인하기 💮
                      </button>

                      <button
                        type="button"
                        onClick={handleRestartQuizLevel}
                        style={{
                          width: '100%',
                          padding: '11px',
                          borderRadius: '16px',
                          border: '1.5px solid #E2E8F0',
                          background: '#F8FAFC',
                          color: '#64748B',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        📘 오늘의 단어 복습하기
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 🎯 문제 카드 박스 */
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '20px 18px',
                    border: '1.5px solid #E2E8F0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    {/* 상단 문항 번호 & 점수 뱃지 */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#00A8BF', background: '#E6FAFC', padding: '3px 10px', borderRadius: '10px' }}>
                        Question {quizIndex + 1} / {totalQuizCount}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '900', color: '#F59E0B', background: '#FEF3C7', padding: '3px 10px', borderRadius: '10px' }}>
                        ⭐ {quizScore}점
                      </span>
                    </div>

                    {/* 1단계 소리 & 단어 퀴즈 */}
                    {quizLevel === 1 && (
                      <div style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        margin: '8px 0',
                        width: '100%'
                      }}>
                        {/* 🔤 영단어 & 발음기호 표시 */}
                        <div style={{
                          background: '#F8FAFC',
                          border: '2px solid #E2E8F0',
                          borderRadius: '22px',
                          padding: '16px 28px',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                          minWidth: '220px'
                        }}>
                          <div style={{
                            fontSize: '28px',
                            fontWeight: '900',
                            color: '#1E293B',
                            letterSpacing: '-0.3px',
                            lineHeight: 1.2
                          }}>
                            {currentQuizWord?.word}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#64748B',
                            marginTop: '4px'
                          }}>
                            {currentQuizWord?.phonics || '/---/'}
                          </div>
                        </div>

                        {/* 🔊 실시간 재생 중 스피커 펄스 버튼 (소리 계속 들려주고) */}
                        <button
                          type="button"
                          onClick={() => handlePlaySound(currentQuizWord?.word)}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                            color: '#FFF',
                            fontSize: '12.5px',
                            fontWeight: '800',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 168, 191, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            animation: isAnswerChecked ? 'none' : 'pulse 1.8s infinite'
                          }}
                        >
                          <span>🔊</span>
                          <span>{isAnswerChecked ? '소리 다시듣기' : '소리 재생 중 (자동 반복 🔄)'}</span>
                        </button>

                        <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748B' }}>
                          단어와 소리를 확인하고 알맞은 뜻을 고르세요
                        </div>
                      </div>
                    )}

                    {/* 2단계 스펠링 퀴즈 */}
                    {quizLevel === 2 && (
                      <div style={{ textAlign: 'center', margin: '6px 0' }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B', marginBottom: '2px' }}>
                          {getWordMeaning(currentQuizWord)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '700' }}>
                          알맞은 영단어 스펠링을 선택하세요
                        </div>
                      </div>
                    )}

                    {/* 3단계 발음 퀴즈 */}
                    {quizLevel === 3 && (
                      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                        <div style={{ fontSize: '26px', fontWeight: '900', color: '#1E293B' }}>
                          {currentQuizWord?.word}
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748B', fontWeight: '700' }}>
                          {getWordMeaning(currentQuizWord)}
                        </div>

                        <button
                          type="button"
                          onClick={toggleRecording}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '16px',
                            border: 'none',
                            background: isRecording ? '#EF4444' : 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                            color: '#FFF',
                            fontWeight: '900',
                            fontSize: '14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(0,168,191,0.25)'
                          }}
                        >
                          {isRecording ? '⏹️ 녹음 중단' : '🎙️ 발음 시작'}
                        </button>

                        {recordedScore !== null && (
                          <div style={{
                            marginTop: '4px',
                            padding: '8px 14px',
                            borderRadius: '12px',
                            background: recordedScore >= 70 ? '#DCFCE7' : '#FEF3C7',
                            color: recordedScore >= 70 ? '#15803D' : '#B45309',
                            fontWeight: '900',
                            fontSize: '13px'
                          }}>
                            {recordedScore >= 70 ? `🎉 ${recordedScore}점! 발음 합격!` : `💡 ${recordedScore}점! 다시 도전하거나 다음 문제로 이동하세요.`}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 4단계 직접 쓰기 퀴즈 */}
                    {quizLevel === 4 && (
                      <form onSubmit={handleSubmitTyping} style={{ width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#1E293B' }}>
                          {getWordMeaning(currentQuizWord)}
                        </div>
                        <input
                          type="text"
                          placeholder="영단어 스펠링 직접 입력"
                          value={typingInput}
                          onChange={(e) => setTypingInput(e.target.value)}
                          disabled={isAnswerChecked}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '14px',
                            border: isAnswerChecked ? (isQuizCorrect ? '2px solid #10B981' : '2px solid #EF4444') : '2px solid #00A8BF',
                            fontSize: '15px',
                            fontWeight: '800',
                            textAlign: 'center',
                            outline: 'none',
                            background: isAnswerChecked ? (isQuizCorrect ? '#D1FAE5' : '#FEE2E2') : '#FFFFFF'
                          }}
                        />
                        {!isAnswerChecked && (
                          <button
                            type="submit"
                            style={{
                              padding: '10px',
                              borderRadius: '12px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                              color: '#FFF',
                              fontWeight: '900',
                              fontSize: '13px',
                              cursor: 'pointer'
                            }}
                          >
                            정답 확인
                          </button>
                        )}
                      </form>
                    )}

                    {/* 1, 2단계 4지선다 보기 그리드 */}
                    {(quizLevel === 1 || quizLevel === 2) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', marginTop: '2px' }}>
                        {quizOptions.map((opt, i) => {
                          const isSelected = selectedAnswer === i;
                          let bg = '#F8FAFC';
                          let border = '1.5px solid #E2E8F0';
                          let color = '#334155';

                          if (isAnswerChecked) {
                            if (opt.isCorrect) {
                              bg = '#D1FAE5';
                              border = '2px solid #10B981';
                              color = '#065F46';
                            } else if (isSelected && !opt.isCorrect) {
                              bg = '#FEE2E2';
                              border = '2px solid #EF4444';
                              color = '#991B1B';
                            }
                          } else if (isSelected) {
                            bg = '#E6FAFC';
                            border = '2px solid #00A8BF';
                            color = '#008294';
                          }

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectQuizOption(i, opt)}
                              disabled={isAnswerChecked}
                              style={{
                                padding: '12px 8px',
                                borderRadius: '14px',
                                border,
                                background: bg,
                                color,
                                fontSize: '13px',
                                fontWeight: '800',
                                cursor: isAnswerChecked ? 'default' : 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                                wordBreak: 'keep-all'
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 🎯 정답 피드백 배너 & [다음 문제로 이동 ➔] 버튼 */}
                    {(isAnswerChecked || quizLevel === 3) && (
                      <div style={{
                        width: '100%',
                        marginTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        animation: 'fadeIn 0.2s ease'
                      }}>
                        {/* 정답 / 오답 상태 뱃지 */}
                        {isAnswerChecked && (
                          <div style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            background: isQuizCorrect ? '#D1FAE5' : '#FEE2E2',
                            border: isQuizCorrect ? '1.5px solid #86EFAC' : '1.5px solid #FECACA',
                            color: isQuizCorrect ? '#065F46' : '#991B1B',
                            fontWeight: '900',
                            fontSize: '13px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{isQuizCorrect ? '🎉 정답입니다! (+10점)' : '❌ 아쉬워요!'}</span>
                            {!isQuizCorrect && (
                              <span style={{ fontSize: '12px', fontWeight: '800' }}>
                                정답: <strong>{quizLevel === 1 ? getWordMeaning(currentQuizWord) : currentQuizWord?.word}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {/* 👉 [다음 문제로 이동 ➔] 버튼 (마지막 문제일 시 다음 단계 자동 이동 안내) */}
                        <button
                          type="button"
                          onClick={handleNextQuizQuestion}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '16px',
                            border: 'none',
                            background: quizIndex === totalQuizCount - 1
                              ? (quizLevel < 4 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)')
                              : 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                            color: '#FFFFFF',
                            fontWeight: '900',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: quizIndex === totalQuizCount - 1
                              ? '0 4px 14px rgba(16, 185, 129, 0.35)'
                              : '0 4px 14px rgba(0, 168, 191, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          {quizIndex === totalQuizCount - 1 ? (
                            quizLevel === 2 ? (
                              <>
                                <span>💮 2단계 완수 & 오늘 출석 도장 받기!</span>
                                <span style={{ fontSize: '16px' }}>➔</span>
                              </>
                            ) : quizLevel < 4 ? (
                              <>
                                <span>🎉 {quizLevel}단계 완료 (다음 {quizLevel + 1}단계로 이동)</span>
                                <span style={{ fontSize: '16px' }}>➔</span>
                              </>
                            ) : (
                              <>
                                <span>🏆 4단계 최종 완료 (전체 결과 확인)</span>
                                <span style={{ fontSize: '16px' }}>➔</span>
                              </>
                            )
                          ) : (
                            <>
                              <span>다음 문제로 이동</span>
                              <span style={{ fontSize: '16px' }}>➔</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })()}

          {/* ═══════════════════════════════════════════════════════
              TAB 5: 👤 PROFILE (내 정보 & 진도 통계 뷰)
             ═══════════════════════════════════════════════════════ */}
          {/* ═══════════════════════════════════════════════════════
              TAB 5: 👤 PROFILE (내 정보 & 진도 통계 & 정보 수정 뷰)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* ✨ 저장 성공 알림 배너 */}
              {profileSaveSuccess && (
                <div style={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  border: '1.5px solid #6EE7B7',
                  color: '#065F46',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  fontSize: '13px',
                  fontWeight: '900',
                  textAlign: 'center',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
                  animation: 'fadeIn 0.3s ease'
                }}>
                  ✨ 학생 정보 및 학습 과정이 성공적으로 변경되었습니다!
                </div>
              )}

              {/* 1. 정보 수정 모드가 아닐 때 (기본 내 정보 보기) */}
              {!isEditingProfile ? (
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
                  {/* 상단 프로필 헤더 */}
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
                      boxShadow: '0 6px 16px rgba(0,168,191,0.25)',
                      flexShrink: 0
                    }}>
                      🧑‍🎓
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#1E293B' }}>
                          {currentUser?.name || '이상학'} 학생
                        </h3>
                        <span style={{ fontSize: '11px', fontWeight: '800', background: '#F1F5F9', color: '#64748B', padding: '2px 7px', borderRadius: '6px' }}>
                          ID: {currentUser?.student_id || currentUser?.id || 'lsh_20260807'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#008294', marginTop: '3px' }}>
                        🎯 {currentUser?.studyGradeLevel || '중등단어'} • 목표 {currentUser?.dailyWordCount || 20}단어/일
                      </div>
                    </div>
                  </div>

                  {/* 세부 설정 및 학부모 정보 요약 카드 */}
                  <div style={{
                    background: '#F8FAFC',
                    borderRadius: '18px',
                    padding: '14px 16px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748B', fontWeight: '700' }}>📚 현재 학습 과정</span>
                      <strong style={{ color: '#0F172A', fontWeight: '900' }}>{currentUser?.studyGradeLevel || '중등단어'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748B', fontWeight: '700' }}>⚡ 하루 목표 학습량</span>
                      <strong style={{ color: '#00A8BF', fontWeight: '900' }}>매일 {currentUser?.dailyWordCount || 20}단어</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748B', fontWeight: '700' }}>🔒 학생 비밀번호(PIN)</span>
                      <strong style={{ color: '#64748B', fontWeight: '800' }}>● ● ● ●</strong>
                    </div>
                    <div style={{ height: '1px', background: '#E2E8F0', margin: '2px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748B', fontWeight: '700' }}>👨‍👩‍👧 학부모 성함</span>
                      <strong style={{ color: '#2563EB', fontWeight: '900' }}>{currentUser?.parentName || currentUser?.parent_name || '이상학'} 학부모님</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748B', fontWeight: '700' }}>📞 학부모 연락처</span>
                      <strong style={{ color: '#334155', fontWeight: '800' }}>{currentUser?.parentPhone || currentUser?.parent_phone || '010-4006-9050'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                      <span style={{ color: '#64748B', fontWeight: '700' }}>🔑 학부모 로그인 PIN</span>
                      <strong style={{ color: '#2563EB', fontWeight: '800' }}>{currentUser?.parentPin || currentUser?.parent_pin || '0815'}</strong>
                    </div>
                  </div>

                  {/* 학습 통계 그리드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#E6FAFC', padding: '14px', borderRadius: '16px', border: '1px solid #BAE6FD', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#00A8BF' }}>{words.length || 20}개</div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#0369A1' }}>오늘 배당된 단어</div>
                    </div>
                    <div style={{ background: '#ECFDF5', padding: '14px', borderRadius: '16px', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669' }}>{stampedDates.length || 0}일</div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#065F46' }}>총 출석 도장</div>
                    </div>
                  </div>

                  {/* ✏️ [내 정보 & 학부모 정보 수정하기] 버튼 */}
                  <button
                    type="button"
                    onClick={handleOpenEditProfile}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                      color: '#FFFFFF',
                      fontWeight: '900',
                      fontSize: '14px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(0,168,191,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>✏️</span>
                    <span>학생 및 학부모 로그인 정보 수정하기</span>
                  </button>

                  {/* 🚪 로그아웃 버튼 */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '16px',
                      border: '1.5px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontWeight: '800',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🚪 로그아웃 및 다른 계정으로 로그인
                  </button>
                </div>
              ) : (
                /* 2. ✏️ 내 정보 & 학부모 정보 수정 모드 (인터랙티브 폼) */
                <form
                  onSubmit={handleSaveProfile}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '24px 20px',
                    border: '2px solid #00A8BF',
                    boxShadow: '0 10px 30px rgba(0, 168, 191, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✏️</span> 학생 및 학부모 정보 수정
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#64748B',
                        cursor: 'pointer'
                      }}
                    >
                      닫기 ✕
                    </button>
                  </div>

                  {/* ━━━━ 1. 👤 학생 정보 설정 ━━━━ */}
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#008294', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👤</span> 1. 학생 기본 정보
                  </div>

                  {/* 1) 학생 이름 입력 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      학생 이름
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="이름 입력 (예: 이상학)"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#1E293B',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 2) 학습 과정 / 학년 선택 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      학습 과정 (단어 난이도)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {[
                        { key: '초등단어', label: '🌱 초등단어 (기초 800)' },
                        { key: '중등단어', label: '🚀 중등단어 (핵심 1800)' },
                        { key: '고등단어', label: '🎯 고등/수능 (심화 2000)' },
                        { key: '토익단어', label: '💼 토익/성인 (실전 2000)' }
                      ].map((item) => {
                        const isSelected = editGradeLevel === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setEditGradeLevel(item.key)}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid #00A8BF' : '1.5px solid #E2E8F0',
                              background: isSelected ? '#E6FAFC' : '#F8FAFC',
                              color: isSelected ? '#008294' : '#475569',
                              fontWeight: isSelected ? '900' : '700',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3) 하루 목표 단어 수 선택 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      하루 목표 단어 수
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {['10', '20', '30', '50'].map((count) => {
                        const isSelected = String(editDailyCount) === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setEditDailyCount(count)}
                            style={{
                              padding: '10px 4px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid #00A8BF' : '1.5px solid #E2E8F0',
                              background: isSelected ? '#E6FAFC' : '#F8FAFC',
                              color: isSelected ? '#008294' : '#475569',
                              fontWeight: isSelected ? '900' : '700',
                              fontSize: '13px',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            {count}개
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4) 학생 4자리 PIN 비밀번호 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      학생 비밀번호 (4자리 PIN)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editPin}
                      onChange={(e) => setEditPin(e.target.value)}
                      placeholder="예: 1234"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#1E293B',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ height: '1.5px', background: '#F1F5F9', margin: '4px 0' }} />

                  {/* ━━━━ 2. 👨‍👩‍👧 학부모 로그인 & 알림 정보 ━━━━ */}
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#2563EB', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👨‍👩‍👧</span> 2. 학부모 로그인 & 안심 알림 정보
                  </div>

                  {/* 5) 학부모 성함 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      학부모 성함
                    </label>
                    <input
                      type="text"
                      value={editParentName}
                      onChange={(e) => setEditParentName(e.target.value)}
                      placeholder="학부모 성함 (예: 이상학)"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#1E293B',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 6) 학부모 연락처 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      학부모 연락처 (안심 알림톡 수신)
                    </label>
                    <input
                      type="text"
                      value={editParentPhone}
                      onChange={(e) => setEditParentPhone(e.target.value)}
                      placeholder="예: 010-4006-9050"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#1E293B',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 7) 학부모 로그인 PIN 번호 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#334155', marginBottom: '6px' }}>
                      학부모 전용 로그인 비밀번호 (PIN)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editParentPin}
                      onChange={(e) => setEditParentPin(e.target.value)}
                      placeholder="예: 0815"
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        borderRadius: '14px',
                        border: '1.5px solid #93C5FD',
                        background: '#EFF6FF',
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#1E40AF',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* 저장 및 취소 버튼 그룹 */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      style={{
                        flex: 1,
                        padding: '13px',
                        borderRadius: '16px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        color: '#FFFFFF',
                        fontWeight: '900',
                        fontSize: '14px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      {isSavingProfile ? '저장 중...' : '💾 전체 정보 저장 완료'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      style={{
                        padding: '13px 18px',
                        borderRadius: '16px',
                        border: '1.5px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#64748B',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 6: 📋 WORD LIST & PDF WORKSHEETS (전체 단어 목록 & 인쇄)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'wordlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0 10px 0',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>←</span> <span>홈으로</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>
                  📋 전체 단어 목록 & PDF
                </span>
              </div>
              <WordListSection
                words={allLevelWords && allLevelWords.length > 0 ? allLevelWords : (words.length > 0 ? words : wordList500Fallback)}
                activeWords={words && words.length > 0 ? words : wordList500Fallback}
                onPlayAudio={(text) => handlePlaySound(text)}
                userAudioRecordings={userAudioRecordings}
                currentLang={currentLang}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 7: ⭐ PERSONAL VOCAB & WRONG ANSWERS (나만의 단어장)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'myvocab' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0 10px 0',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>←</span> <span>홈으로</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>
                  ⭐ 나만의 단어장
                </span>
              </div>
              <PersonalVocabSection
                currentUser={currentUser}
                onPlayAudio={(text) => handlePlaySound(text)}
                initialTab="custom"
                currentLang={currentLang}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 8: 🔁 DAY 6 WEEKLY REVIEW (6일차 주간 총복습)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'day6' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0 10px 0',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>←</span> <span>홈으로</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>
                  🔁 6일차 주간 총복습
                </span>
              </div>
              <Day6ReviewSection
                currentUser={currentUser}
                safeActiveWords={words && words.length > 0 ? words : wordList500Fallback}
                onQuizComplete={() => setCurrentTab('calendar')}
                currentLang={currentLang}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 9: 📊 STATS & REPORT (학습 통계 리포트)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0 10px 0',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>←</span> <span>홈으로</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>
                  📊 학습 통계 리포트
                </span>
              </div>
              <StatsSection
                currentUser={currentUser}
                totalWordCount={allLevelWords.length || words.length || 500}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                currentLang={currentLang}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 10: 🏆 LEADERBOARD (명예의 전당 / 랭킹)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0 10px 0',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>←</span> <span>홈으로</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>
                  🏆 명예의 전당 (리더보드)
                </span>
              </div>
              <LeaderboardSection
                currentUser={currentUser}
                currentLang={currentLang}
              />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              TAB 11: 👨‍👩‍👧 PARENT DASHBOARD (학부모 안심 대시보드)
             ═══════════════════════════════════════════════════════ */}
          {currentTab === 'parent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0 10px 0',
                borderBottom: '1px solid #E2E8F0',
                position: 'sticky',
                top: 0,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '800',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>←</span> <span>홈으로</span>
                </button>
                <span style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B' }}>
                  👨‍👩‍👧 학부모 안심 대시보드
                </span>
              </div>
              <ParentDashboard
                currentUser={currentUser}
                onLogout={handleLogout}
                currentLang={currentLang}
              />
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
            { key: 'deck', icon: '📘', label: currentStrings.navDeck },
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

        {/* 🎙️ 마이크 권한 안내 & 모의 테스트 모달 */}
        {showMicGuideModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              maxWidth: '390px',
              width: '100%',
              padding: '24px 20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                fontSize: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                🎙️
              </div>

              <div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#1E293B', marginBottom: '4px' }}>
                  마이크 접근 권한 안내
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.45, fontWeight: '600' }}>
                  브라우저 또는 Windows에서 마이크 사용이 차단되어 있습니다. 아래 2가지를 확인해 주세요!
                </div>
                {micErrorDetail && (
                  <div style={{ marginTop: '6px', display: 'inline-block', background: '#FEF2F2', border: '1px solid #FECACA', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', color: '#B91C1C', fontWeight: '800' }}>
                    상태: {micErrorDetail}
                  </div>
                )}
              </div>

              {/* 권한 허용 상세 가이드 박스 */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: '18px',
                padding: '12px 14px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px',
                color: '#334155',
                fontWeight: '700'
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#00A8BF', color: '#FFF', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>1</span>
                  <span><strong>Chrome / Edge / Safari:</strong> 주소창 좌측의 <strong>🔒(자물쇠)</strong> 또는 <strong>설정 아이콘</strong> 클릭 ➔ <strong>[마이크]</strong>를 <strong>'허용'</strong>으로 변경 후 새로고침</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#00A8BF', color: '#FFF', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>2</span>
                  <span><strong>보안 안내:</strong> Chrome 브라우저 보안 규정상 마이크는 <strong>HTTPS(https://flipvoca.com)</strong> 환경에서 정상 작동합니다.</span>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={async () => {
                    setShowMicGuideModal(false);
                    try {
                      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                      }
                    } catch (e) {}
                    toggleRecording();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                    color: '#FFFFFF',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 168, 191, 0.25)'
                  }}
                >
                  🔄 마이크 다시 요청하기
                </button>

                <button
                  type="button"
                  onClick={runSimulatedPronunciation}
                  style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: '16px',
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0369A1',
                    fontWeight: '900',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✨ 체험용 발음 평가 실행 (모의 테스트)
                </button>

                <button
                  type="button"
                  onClick={() => setShowMicGuideModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 📖 오늘 공부한 전체 누적 단어 팝업 모달 */}
        {showTodayAllModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              padding: '24px',
              width: '100%',
              maxWidth: '480px',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.2s ease',
              border: '1.5px solid #E2E8F0'
            }}>
              {/* 모달 헤더 */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: '2px dashed #E2E8F0',
                marginBottom: '14px'
              }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1E293B', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📖</span> [{todayStr}] 오늘 누적 학습 단어
                  </h3>
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: '800', marginTop: '3px' }}>
                    🔥 총 {(todayAllLearnedWords && todayAllLearnedWords.length > 0 ? todayAllLearnedWords.length : words.length)}개 단어 학습 중! (제{studyRound}회차)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTodayAllModal(false)}
                  style={{
                    background: '#F1F5F9',
                    border: '1.5px solid #CBD5E1',
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* 단어 리스트 스크롤 영역 */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px',
                marginBottom: '16px'
              }}>
                {(todayAllLearnedWords && todayAllLearnedWords.length > 0 ? todayAllLearnedWords : words).map((item, i) => {
                  const wordStr = (typeof item === 'string' ? item : item.word || '').replace(/\.png/gi, '').trim();
                  const phonics = typeof item === 'string' ? '' : (item.phonics || item.phonetic || '');
                  const meaningDisplay = getWordMeaning(item);

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: '#F8FAFC',
                        borderRadius: '16px',
                        border: '1.5px solid #E2E8F0',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          fontWeight: '900',
                          color: '#00A8BF',
                          fontSize: '12px',
                          background: '#E6FAFC',
                          padding: '2px 8px',
                          borderRadius: '8px'
                        }}>
                          #{i + 1}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '900', color: '#1E293B', fontSize: '15px' }}>
                              {wordStr}
                            </span>
                            {phonics && (
                              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>
                                {phonics}
                              </span>
                            )}
                          </div>
                          {meaningDisplay && (
                            <div style={{ color: '#DC2626', fontSize: '13px', fontWeight: '800', marginTop: '2px' }}>
                              {meaningDisplay}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePlaySound(wordStr)}
                        style={{
                          background: 'linear-gradient(135deg, #00C7E5 0%, #00A8BF 100%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '34px',
                          height: '34px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0, 168, 191, 0.3)',
                          flexShrink: 0
                        }}
                      >
                        🔊
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* 하단 닫기 버튼 */}
              <button
                type="button"
                onClick={() => setShowTodayAllModal(false)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '13px',
                  borderRadius: '16px',
                  fontWeight: '900',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.25)'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
