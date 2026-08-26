'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from '../../lib/supabaseClient.js';
import wordList500Fallback from '../../data/wordsData.js';

export default function QuizSection({ currentUser, activeWords, onQuizLevelComplete, onLoadNextWordSet, initialQuizLevel = 1, currentLang = 'ko' }) {
  const [quizLevel, setQuizLevel] = useState(initialQuizLevel || 1); // 1: 소리, 2: 선택, 3: 발음 녹음(75점+), 4: 직접 입력
  const [currentIndex, setCurrentIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [typedInput, setTypedInput] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [isQuizEnded, setIsQuizEnded] = useState(false);

  // 🎙️ 3단계 녹음 퀴즈 전용 상태값
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [pronunciationScore, setPronunciationScore] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const fallbackList = Array.isArray(wordList500Fallback) && wordList500Fallback.length > 0
    ? wordList500Fallback
    : [{ id: 1, word: 'Apple', meaning: '사과', phonics: '/ˈæpəl/', category: '기초' }];

  const safeWords = activeWords && activeWords.length > 0 ? activeWords : fallbackList;

  // 🛡️ 퀴즈 단어 목록 변경 시 인덱스 범위 초과 방지
  useEffect(() => {
    if (safeWords.length > 0 && currentIndex >= safeWords.length) {
      setCurrentIndex(0);
    }
  }, [safeWords.length, currentIndex]);

  const safeIndex = (currentIndex >= 0 && currentIndex < safeWords.length) ? currentIndex : 0;
  const currentQuiz = safeWords[safeIndex] || safeWords[0] || fallbackList[0];
  const cleanWordStr = (typeof currentQuiz === 'string' ? currentQuiz : (currentQuiz?.word || 'Word')).replace(/\.png/gi, '').trim();

  // 🌐 언어별 단어 뜻 추출 헬퍼 (로컬 fallback 사전 연동으로 100% 보장)
  const getOptionMeaning = (item, lang) => {
    if (!item) return '';
    const wordKey = typeof item === 'string' ? item.replace(/\.png/gi, '').trim() : (item.word || '').replace(/\.png/gi, '').trim();

    // 1) item 객체 자체에서 조회
    if (typeof item === 'object') {
      if (lang === 'zh' && (item.meaning_zh || item.meaningZh)) return item.meaning_zh || item.meaningZh;
      if (lang === 'fr' && (item.meaning_fr || item.meaningFr)) return item.meaning_fr || item.meaningFr;
      if (lang === 'ja' && (item.meaning_ja || item.meaningJa)) return item.meaning_ja || item.meaningJa;
      if (lang === 'vi' && (item.meaning_vi || item.meaningVi)) return item.meaning_vi || item.meaningVi;
      if (lang === 'hi' && (item.meaning_hi || item.meaningHi)) return item.meaning_hi || item.meaningHi;
      if (lang === 'ko' && item.meaning) return item.meaning;
    }

    // 2) fallback 로컬 사전에서 매칭 조회
    const matched = wordList500Fallback.find(w => (w.word || '').toLowerCase().trim() === wordKey.toLowerCase());
    if (matched) {
      if (lang === 'zh' && (matched.meaning_zh || matched.meaningZh)) return matched.meaning_zh || matched.meaningZh;
      if (lang === 'fr' && (matched.meaning_fr || matched.meaningFr)) return matched.meaning_fr || matched.meaningFr;
      if (lang === 'ja' && (matched.meaning_ja || matched.meaningJa)) return matched.meaning_ja || matched.meaningJa;
      if (lang === 'vi' && (matched.meaning_vi || matched.meaningVi)) return matched.meaning_vi || matched.meaningVi;
      if (lang === 'hi' && (matched.meaning_hi || matched.meaningHi)) return matched.meaning_hi || matched.meaningHi;
      if (lang === 'ko' && matched.meaning) return matched.meaning;
    }

    if (typeof item === 'object') {
      return item.meaning || item.word || '';
    }
    return item;
  };

  useEffect(() => {
    if (initialQuizLevel) {
      setQuizLevel(initialQuizLevel);
    }
  }, [initialQuizLevel]);

  // 🔊 100% 무조건 들리는 듀얼 엔진 원어민 영어 발음 재생기 (고음질 MP3 스트림 + Web Speech API 2중 보증)
  const currentAudioRef = useRef(null);

  const playAudio = useCallback((textToPlay) => {
    const text = (textToPlay || cleanWordStr || '').replace(/\.png/gi, '').trim();
    if (!text || typeof window === 'undefined') return;

    let speed = 0.9;
    try {
      const saved = localStorage.getItem('steve_voca_tts_speed');
      if (saved) speed = parseFloat(saved) || 0.9;
    } catch (e) {}

    // 1순위: 스튜디오급 고음질 원어민 미국식 발음 즉시 재생 (가장 맑고 자연스러움)
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
      const audio = new Audio(audioUrl);
      audio.playbackRate = speed;
      currentAudioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 브라우저 예외 시 브라우저 내장 TTS로 즉시 대체
          speakWebSpeech(text, speed);
        });
      }
    } catch (e) {
      speakWebSpeech(text, speed);
    }

    // 2순위: 브라우저 내장 Web Speech API 음성 합성기
    function speakWebSpeech(wordText, wordSpeed) {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
          const utterance = new SpeechSynthesisUtterance(wordText);
          utterance.lang = 'en-US';
          utterance.rate = wordSpeed;

          const voices = window.speechSynthesis.getVoices();
          if (voices && voices.length > 0) {
            const enVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('US'))) || voices.find(v => v.lang.startsWith('en'));
            if (enVoice) utterance.voice = enVoice;
          }

          window.speechSynthesis.speak(utterance);
        } catch (err) {}
      }
    }
  }, [cleanWordStr]);

  // 🎯 학생 친화적 발음 유사도 점수(0~100점) 완화 알고리즘 (어린이 및 초보자 친화적 관용 매칭)
  const calculateMatchScore = (targetStr, spokenStr) => {
    if (!targetStr) return 0;
    const cleanTarget = targetStr.toLowerCase().replace(/[^a-z]/g, '');
    const cleanSpoken = (spokenStr || '').toLowerCase().replace(/[^a-z]/g, '');

    // 1. 발음 인식이 아예 안 되거나 마이크 입력이 약한 경우 (기본 격려 점수)
    if (!cleanSpoken || cleanSpoken.trim() === '') return 40;

    // 2. 완전히 일치하는 경우 100점
    if (cleanTarget === cleanSpoken) return 100;

    // 3. 포함 관계이거나 문장 속에 단어가 포함된 경우 (예: "a cat", "the apple", "banana please") 95점 부여
    if (cleanSpoken.includes(cleanTarget) || cleanTarget.includes(cleanSpoken)) {
      return 95;
    }

    // 4. 발음 유사 음운 정규화 매칭 (c/k, ph/f, z/s, v/b, r/l, 모음 변이 관용 인정)
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

    if (normTarget === normSpoken) {
      return 92;
    }
    if (normSpoken.includes(normTarget) || normTarget.includes(normSpoken)) {
      return 88;
    }

    // 5. 레벤슈타인 편집 거리 계산
    let m = cleanTarget.length, n = cleanSpoken.length;
    let dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (cleanTarget[i - 1] === cleanSpoken[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }
    const distance = dp[m][n];

    // 1~2글자 가벼운 발음 차이에 대해 넉넉한 점수 부여
    if (distance === 1) return 88;
    if (distance === 2) return 78;
    if (distance === 3 && Math.max(m, n) >= 5) return 70;

    const maxLen = Math.max(m, n, 1);
    const rawRatio = Math.max(0, (maxLen - distance) / maxLen);
    const boostedScore = Math.round(45 + (rawRatio * 55));
    return Math.max(40, Math.min(100, boostedScore));
  };

  // 🤖 AI 발음 교정 가이드 팁 분석 엔진 (6개 국어 다국어 지원)
  const getAIPronunciationGuideTip = (targetWordStr, score, lang = 'ko') => {
    if (!targetWordStr) return null;
    const cleanWord = targetWordStr.toLowerCase().trim();

    if (score !== null && score !== undefined) {
      if (score >= 85) {
        return {
          icon: '🎉',
          title: lang === 'zh' ? '🤖 AI 发音完美赞赏！' : (lang === 'fr' ? '🤖 Félicitations IA !' : (lang === 'ja' ? '🤖 AI 発音パーフェクト称賛！' : (lang === 'vi' ? '🤖 AI Khen ngợi phát âm hoàn hảo!' : (lang === 'hi' ? '🤖 AI उत्कृष्ट उच्चारण प्रशंसा!' : '🤖 AI 발음 완벽 칭찬!')))),
          text: lang === 'zh'
            ? `[${targetWordStr}] 母语级完美的舌位与唇形！语调与发音极其自然标准。👏`
            : (lang === 'fr'
            ? `[${targetWordStr}] Position de la langue et des lèvres digne d'un locuteur natif ! 👏`
            : (lang === 'ja'
            ? `[${targetWordStr}] ネイティブレベルの完璧な舌の位置と口の形です！👏`
            : (lang === 'vi'
            ? `[${targetWordStr}] Vị trí lưỡi và khẩu hình miệng chuẩn như người bản xứ! 👏`
            : (lang === 'hi'
            ? `[${targetWordStr}] मूल वक्ता स्तर की सही जीभ स्थिति और मुंह का आकार! 👏`
            : `[${targetWordStr}] 원어민 수준의 완벽한 혀 위치와 입모양입니다! 억양과 발음이 아주 부드럽고 훌륭합니다. 👏`)))),
          color: '#27AE60',
          bg: '#E8F8F5',
          border: '#A3E4D7'
        };
      }
    }

    if (cleanWord.includes('r')) {
      return {
        icon: '👅',
        title: lang === 'zh' ? '🤖 AI 舌位纠正贴士 [R 发音]' : (lang === 'fr' ? '🤖 Conseil IA langue [Son R]' : (lang === 'ja' ? '🤖 AI 舌の位置アドバイス [R 発音]' : (lang === 'vi' ? '🤖 Mẹo vị trí lưỡi AI [Âm R]' : (lang === 'hi' ? '🤖 AI जीभ स्थिति सुझाव [R]' : '🤖 AI 혀 위치 교정 팁 [R 발음]')))),
        text: lang === 'zh'
          ? '发 R 音时舌尖切勿触碰上颚，舌头向口腔内轻微卷起，发出圆润卷舌音！'
          : (lang === 'fr'
          ? 'Pour le son R, ne touchez pas le palais avec la langue, reculez-la légèrement !'
          : (lang === 'ja'
          ? 'Rの発音時、舌先を口蓋につけず、奥に少し丸めて「ウー」と響かせましょう！'
          : (lang === 'vi'
          ? 'Khi phát âm R, không chạm đầu lưỡi vào vòm miệng mà uốn nhẹ vào trong!'
          : (lang === 'hi'
          ? 'R बोलते समय जीभ की नोक को तालू से न छुएं, बल्कि मुंह के अंदर हल्का मोड़ें!'
          : 'R 발음 시 혀끝을 입천장에 대지 않고 입 안쪽으로 살짝 구부려 \'우-\' 소리를 굴려보세요!')))),
        color: '#D35400',
        bg: '#FEF9E7',
        border: '#F9E79F'
      };
    }

    if (cleanWord.includes('l')) {
      return {
        icon: '👅',
        title: lang === 'zh' ? '🤖 AI 舌位纠正贴士 [L 发音]' : (lang === 'fr' ? '🤖 Conseil IA langue [Son L]' : (lang === 'ja' ? '🤖 AI 舌の位置アドバイス [L 発音]' : (lang === 'vi' ? '🤖 Mẹo vị trí lưỡi AI [Âm L]' : (lang === 'hi' ? '🤖 AI जीभ स्थिति सुझाव [L]' : '🤖 AI 혀 위치 교정 팁 [L 발음]')))),
        text: lang === 'zh'
          ? '发 L 音时，将舌尖顶住上门牙正后方的齿龈，发出清脆“el-”音并利落地弹开！'
          : (lang === 'fr'
          ? 'Pour le son L, appuyez la pointe de la langue derrière les dents du haut puis relâchez !'
          : (lang === 'ja'
          ? 'Lの発音時、舌先を上の前歯の裏側にしっかりつけてからパッと離しましょう！'
          : (lang === 'vi'
          ? 'Khi phát âm L, hãy đặt đầu lưỡi chạm vào chân răng hàm trên rồi bật nhẹ ra!'
          : (lang === 'hi'
          ? 'L बोलते समय जीभ की नोक को ऊपरी दांतों के पीछे तालू पर दबाएं और अलग करें!'
          : 'L 발음 시 혀끝을 윗니 바로 뒤 입천장에 꾹 대었다가 \'얼-\' 소리를 내며 상큼하게 떼어보세요!')))),
        color: '#2980B9',
        bg: '#EBF5FB',
        border: '#AED6F1'
      };
    }

    if (cleanWord.includes('th')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇齿纠正贴士 [TH 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son TH]' : (lang === 'ja' ? '🤖 AI 口の形アドバイス [TH 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình AI [Âm TH]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा सुझाव [TH]' : '🤖 AI 입모양 교정 팁 [TH 발음]')))),
        text: lang === 'zh'
          ? '将舌尖轻咬在上下门牙之间，呼气摩擦发出清脆的气流音！'
          : (lang === 'fr'
          ? 'Placez le bout de la langue entre les dents du haut et du bas et soufflez !'
          : (lang === 'ja'
          ? '舌先を上下の前歯で軽く挟み、空気を吹き出しながら摩擦音を出しましょう！'
          : (lang === 'vi'
          ? 'Đặt đầu lưỡi nhẹ nhàng giữa hai hàm răng và đẩy luồng hơi ra ngoài!'
          : (lang === 'hi'
          ? 'जीभ की नोक को ऊपरी और निचले दांतों के बीच थोड़ा दबाएं और हवा बाहर निकालें!'
          : '혀끝을 윗니와 아랫니 사이에 살짝 물었다가 바람을 뿜어내며 소리를 내보세요!')))),
        color: '#8E44AD',
        bg: '#F5EEF8',
        border: '#D7BDE2'
      };
    }

    if (cleanWord.includes('v') || cleanWord.includes('f')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇齿纠正贴士 [V / F 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son V / F]' : (lang === 'ja' ? '🤖 AI 口の形アドバイス [V / F 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình AI [Âm V / F]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा सुझाव [V / F]' : '🤖 AI 입모양 교정 팁 [V / F 발음]')))),
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
        color: '#C0392B',
        bg: '#FADBD8',
        border: '#F5B7B1'
      };
    }

    if (cleanWord.includes('sh') || cleanWord.includes('ch')) {
      return {
        icon: '👄',
        title: lang === 'zh' ? '🤖 AI 唇形纠正贴士 [SH / CH 发音]' : (lang === 'fr' ? '🤖 Conseil IA lèvres [Son SH / CH]' : (lang === 'ja' ? '🤖 AI 口の形アドバイス [SH / CH 発音]' : (lang === 'vi' ? '🤖 Mẹo khẩu hình AI [Âm SH / CH]' : (lang === 'hi' ? '🤖 AI मुख मुद्रा सुझाव [SH / CH]' : '🤖 AI 입모양 교정 팁 [SH / CH 발음]')))),
        text: lang === 'zh'
          ? '双唇向前微微嘟起呈圆形，有力地推出气流！'
          : (lang === 'fr'
          ? 'Avancez les lèvres en rond et expulsez l\'air avec force !'
          : (lang === 'ja'
          ? '唇を前に丸く突き出し、息を勢いよく押し出して発音しましょう！'
          : (lang === 'vi'
          ? 'Chu môi tròn về phía trước và đẩy mạnh luồng khí ra ngoài!'
          : (lang === 'hi'
          ? 'होंठों को आगे गोल करें और हवा को ज़ोर से बाहर धकेलें!'
          : '입술을 앞으로 동그랗게 모으고 공기를 밀어내며 소리를 강하게 만들어보세요!')))),
        color: '#16A085',
        bg: '#E8F8F5',
        border: '#A3E4D7'
      };
    }

    return {
      icon: '💡',
      title: lang === 'zh' ? '🤖 AI 原声语调贴士' : (lang === 'fr' ? '🤖 Conseil IA intonation native' : (lang === 'ja' ? '🤖 AI ネイティブイントネーション' : (lang === 'vi' ? '🤖 Mẹo ngữ điệu bản xứ AI' : (lang === 'hi' ? '🤖 AI मूल वक्ता लय सुझाव' : '🤖 AI 원어민 억양 교정 팁')))),
      text: lang === 'zh'
        ? '可使用上方 🐢 0.7x 慢速播放试听，并注意提高带有重音（Accent）的音节！'
        : (lang === 'fr'
        ? 'Écoutez avec le bouton ralenti 🐢 0.7x ci-dessus et accentuez la syllabe tonique !'
        : (lang === 'ja'
        ? '上部の 🐢 0.7x スロー再生を聞きながら、アクセントが入る音節を強調して読んでみましょう！'
        : (lang === 'vi'
        ? 'Nghe ở tốc độ chậm 🐢 0.7x và nhấn mạnh vào âm tiết có trọng âm (Accent)!'
        : (lang === 'hi'
        ? 'ऊपर दिए गए 🐢 0.7x धीमी गति से सुनें और बलाघात (Accent) वाले शब्दांश पर जोर दें!'
        : '상단의 🐢 0.7x 슬로우 배속으로 원어민 발음을 들으면서 강세(Accent)가 들어가는 음절을 높여 읽어보세요!')))),
      color: '#2980B9',
      bg: '#EBF5FB',
      border: '#AED6F1'
    };
  };

  // 4지선다 보기 무작위 생성
  const generateOptions = useCallback((targetWord) => {
    if (!targetWord || safeWords.length === 0) return [];
    let choices = [targetWord];
    const others = safeWords.filter(w => (w.word || w) !== (targetWord.word || targetWord));
    const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
    for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
      choices.push(shuffledOthers[i]);
    }
    return choices.sort(() => Math.random() - 0.5);
  }, [safeWords]);

  useEffect(() => {
    if (currentQuiz) {
      const generated = generateOptions(currentQuiz);
      setOptions(generated);
      setSelectedAnswer(null);
      setTypedInput('');
      setIsCorrect(null);
      setSpokenText('');
      setPronunciationScore(null);
      setIsRecording(false);

      if (quizLevel === 1) {
        const timer = setTimeout(() => {
          playAudio(cleanWordStr);
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, currentQuiz, quizLevel, generateOptions, playAudio, cleanWordStr]);

  // ❌ 오답 발생 시 Supabase 클라우드 DB & LocalStorage 오답노트에 저장
  const saveWrongAnswer = async (wordObj) => {
    if (!currentUser || !wordObj) return;
    const wordStr = (wordObj.word || wordObj).replace(/\.png/gi, '').trim();
    const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
    const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    try {
      const payloadMap = new Map();
      payloadMap.set(studentIdToUse, {
        student_id: studentIdToUse,
        word: wordStr,
        meaning: wordObj.meaning || '뜻 정보 없음',
        phonics: wordObj.phonics || '',
        category: wordObj.category || '기초 단어'
      });
      if (studentNameClean) {
        payloadMap.set(studentNameClean, {
          student_id: studentNameClean,
          word: wordStr,
          meaning: wordObj.meaning || '뜻 정보 없음',
          phonics: wordObj.phonics || '',
          category: wordObj.category || '기초 단어'
        });
      }
      await supabase.from('wrong_words').insert(Array.from(payloadMap.values()));
    } catch (e) {}

    const wrongKey = `wrong_answers_${currentUser.id}`;
    let wrongList = [];
    try {
      wrongList = JSON.parse(localStorage.getItem(wrongKey) || '[]');
    } catch (e) {
      wrongList = [];
    }

    const isAlreadyIn = wrongList.some(item => (item.word || item) === wordStr);
    if (!isAlreadyIn) {
      const newWrongItem = {
        id: wordObj.id || Date.now(),
        word: wordStr,
        meaning: wordObj.meaning || '뜻 정보 없음',
        phonics: wordObj.phonics || '',
        category: wordObj.category || '기타',
        addedAt: new Date().toISOString().split('T')[0]
      };
      wrongList.push(newWrongItem);
      localStorage.setItem(wrongKey, JSON.stringify(wrongList));
    }
  };

  // 📚 정답 맞춘 단어 Supabase DB student_learned_words 및 LocalStorage 실시간 영구 기록
  const saveLearnedWord = async (wordObj) => {
    if (!currentUser || !wordObj) return;
    const wordStr = (wordObj.word || wordObj).replace(/\.png/gi, '').trim();
    const meaningStr = wordObj.meaning || '';
    if (!wordStr) return;

    const studentIdToUse = currentUser.student_id || currentUser.id || 'guest';
    const studentNameClean = (currentUser.name || '').replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '').trim();

    try {
      const payload = [{ student_id: studentIdToUse, word: wordStr, meaning: meaningStr, learned_at: new Date().toISOString() }];
      if (studentNameClean && studentNameClean !== studentIdToUse) {
        payload.push({ student_id: studentNameClean, word: wordStr, meaning: meaningStr, learned_at: new Date().toISOString() });
      }
      await supabase.from('student_learned_words').insert(payload);
    } catch (e) {}

    try {
      const localKey = `learned_words_${currentUser.id}`;
      const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (!existingLocal.some(item => (typeof item === 'string' ? item : item.word) === wordStr)) {
        existingLocal.push({ word: wordStr, meaning: meaningStr, learned_at: new Date().toISOString() });
        localStorage.setItem(localKey, JSON.stringify(existingLocal));
      }
    } catch (e) {}
  };

  const timerRef = useRef(null);
  const isMovingRef = useRef(false);

  // 1, 2단계 4지선다 정답 선택
  const handleAnswerSelect = (optionItem) => {
    if (selectedAnswer !== null || isMovingRef.current) return;
    setSelectedAnswer(optionItem);
    const optionStr = (optionItem.word || optionItem).replace(/\.png/gi, '').trim();

    if (optionStr === cleanWordStr) {
      setIsCorrect(true);
      setScore(prev => prev + 1);
      saveLearnedWord(currentQuiz);
    } else {
      setIsCorrect(false);
      saveWrongAnswer(currentQuiz);
    }

    // 🔊 2단계(및 1단계) 시험 시 답을 클릭하면 다음 단어가 나오기 전에 단어를 영어로 즉시 또박또박 발음 재생!
    playAudio(cleanWordStr);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 1800);
  };

  // 🎙️ 3단계 마이크 발음 녹음 시작 / 종료 및 75점+ 심사
  const startRecordingQuiz = async () => {
    try {
      setIsRecording(true);
      setPronunciationScore(null);
      setSpokenText('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      let recognizedSpokenText = '';
      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
          if (event.results && event.results[0] && event.results[0][0]) {
            recognizedSpokenText = event.results[0][0].transcript || '';
            setSpokenText(recognizedSpokenText);
          }
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {}
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        const finalScore = calculateMatchScore(cleanWordStr, recognizedSpokenText);
        setPronunciationScore(finalScore);

        if (finalScore >= 65) {
          setIsCorrect(true);
          setSelectedAnswer('recorded_pass');
          setScore(prev => prev + 1);
          saveLearnedWord(currentQuiz);

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            handleNextQuestion();
          }, 1500);
        } else {
          setIsCorrect(false);
          setSelectedAnswer('recorded_fail');
          saveWrongAnswer(currentQuiz);
        }
      };

      mediaRecorderRef.current.start();
    } catch (e) {
      alert('🎙️ 마이크 권한을 허용해 주세요!');
      setIsRecording(false);
    }
  };

  const stopRecordingQuiz = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  // 4단계 주관식 입력 제출
  const handleTypedSubmit = (e) => {
    e.preventDefault();
    if (selectedAnswer !== null || !typedInput.trim() || isMovingRef.current) return;

    const userInput = typedInput.trim().toLowerCase();
    const targetWordLower = cleanWordStr.toLowerCase();

    setSelectedAnswer(userInput);
    if (userInput === targetWordLower) {
      setIsCorrect(true);
      setScore(prev => prev + 1);
      saveLearnedWord(currentQuiz);
    } else {
      setIsCorrect(false);
      saveWrongAnswer(currentQuiz);
    }

    // 🔊 주관식 답안 제출 시에도 단어를 영어로 즉시 또박또박 발음 재생
    playAudio(cleanWordStr);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleNextQuestion();
    }, 1400);
  };

  const handleNextQuestion = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isMovingRef.current) return;
    isMovingRef.current = true;

    setSelectedAnswer(null);
    setIsCorrect(null);
    setTypedInput('');
    setSpokenText('');
    setPronunciationScore(null);

    if (currentIndex + 1 >= safeWords.length) {
      if (quizLevel === 1) {
        alert(currentLang === 'zh'
          ? '🎉 第1关听力测验完成！即将直接进入第2关拼写测验！'
          : (currentLang === 'fr'
          ? '🎉 Quiz Niveau 1 terminé ! Passage immédiat au Niveau 2 !'
          : (currentLang === 'ja'
          ? '🎉 第1段階リスニング完了！第2段階スペル選択クイズへ移動します！'
          : (currentLang === 'vi'
          ? '🎉 Hoàn thành Cấp 1! Chuyển sang Cấp 2 ngay!'
          : (currentLang === 'hi'
          ? '🎉 स्तर 1 क्विज पूर्ण! अब स्तर 2 क्विज पर जा रहे हैं!'
          : '🎉 1단계 소리 퀴즈 완료! 필수 완수를 위해 2단계 스펠링 선택 퀴즈로 바로 이동합니다!')))));
        handleRestart(2);
      } else if (quizLevel === 2) {
        if (onQuizLevelComplete) onQuizLevelComplete(2);
        setIsQuizEnded(true);
        alert(currentLang === 'zh'
          ? '🎉 [今日必修任务达成！] 完成第2关测验，已成功获得签到印章(💮)！🌟\n\n如想继续挑战，请点击 [第3关 发音录音] 或 [第4关 单词默写]！'
          : (currentLang === 'fr'
          ? '🎉 [Mission quotidienne accomplie !] Tampon de présence (💮) obtenu avec succès ! 🌟\n\nContinuez avec le Niveau 3 ou le Niveau 4 si vous souhaitez vous entraîner davantage !'
          : (currentLang === 'ja'
          ? '🎉 [本日の必須学習達成！] 第2段階クリアで出席スタンプ(💮)を獲得しました！🌟\n\nさらに挑戦する場合は [第3段階 録音] または [第4段階 記述] を選択してください！'
          : (currentLang === 'vi'
          ? '🎉 [Đã hoàn thành bài học hôm nay!] Bạn đã nhận được con dấu điểm danh (💮)! 🌟\n\nHãy thử sức thêm với [Cấp 3 Ghi âm] hoặc [Cấp 4 Viết từ] nếu bạn muốn luyện tập thêm!'
          : (currentLang === 'hi'
          ? '🎉 [आज का अनिवार्य अध्ययन पूर्ण!] स्तर 2 क्विज पूरा करके उपस्थिति मोहर (💮) प्राप्त की! 🌟\n\nयदि आप और अभ्यास करना चाहते हैं, तो [स्तर 3 रिकॉर्डिंग] या [स्तर 4 लेखन] चुनें!'
          : '🎉 [오늘 필수 학습 완수!] 2단계 스펠링 선택 퀴즈 완료로 출석 도장(💮)을 받았습니다! 🌟\n\n추가 도전을 원하시면 [3단계 마이크 녹음]이나 [4단계 직접쓰기]를 선택하여 자유롭게 공부하세요!')))));
      } else if (quizLevel === 3) {
        if (onQuizLevelComplete) onQuizLevelComplete(3);
        setIsQuizEnded(true);
      } else {
        setIsQuizEnded(true);
        if (onQuizLevelComplete) onQuizLevelComplete(4);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }

    setTimeout(() => {
      isMovingRef.current = false;
    }, 300);
  };

  const handleRestart = (level) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isMovingRef.current = false;
    setQuizLevel(level);
    setCurrentIndex(0);
    setScore(0);
    setIsQuizEnded(false);
    setSelectedAnswer(null);
    setTypedInput('');
    setIsCorrect(null);
    setSpokenText('');
    setPronunciationScore(null);
  };

  if (!currentQuiz) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>퀴즈 단어 데이터를 로딩 중입니다...</div>;
  }

  return (
    <div className="quiz-section-card" style={{ padding: '24px', background: '#FFFFFF', borderRadius: '24px', border: '2px solid #E5E5E5', borderBottom: '5px solid #CECECE', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      {/* 4대 퀴즈 레벨 탭 (Level 1~2: 필수, Level 3~4: 선택 심화) */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleRestart(1)}
          style={{
            flex: 1,
            minHeight: '48px',
            minWidth: '90px',
            padding: '10px 8px',
            borderRadius: '14px',
            border: quizLevel === 1 ? '2px solid #1899D6' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 1 ? '4px solid #1899D6' : '4px solid #CECECE',
            background: quizLevel === 1 ? '#1CB0F6' : '#FFFFFF',
            color: quizLevel === 1 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          🔊 {currentLang === 'zh' ? '第1关 听力' : (currentLang === 'fr' ? 'Niveau 1 Écoute' : (currentLang === 'ja' ? '第1段階 リスニング' : (currentLang === 'vi' ? 'Cấp 1 Nghe' : (currentLang === 'hi' ? 'स्तर 1 श्रवण' : '1단계 소리 (필수)'))))}
        </button>
        <button
          onClick={() => handleRestart(2)}
          style={{
            flex: 1,
            minHeight: '48px',
            minWidth: '90px',
            padding: '10px 8px',
            borderRadius: '14px',
            border: quizLevel === 2 ? '2px solid #46A302' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 2 ? '4px solid #46A302' : '4px solid #CECECE',
            background: quizLevel === 2 ? '#58CC02' : '#FFFFFF',
            color: quizLevel === 2 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          🧩 {currentLang === 'zh' ? '第2关 辨析 (打卡💮)' : (currentLang === 'fr' ? 'Niveau 2 Choix (Tampon💮)' : (currentLang === 'ja' ? '第2段階 選択 (出席💮)' : (currentLang === 'vi' ? 'Cấp 2 Chọn (Điểm danh💮)' : (currentLang === 'hi' ? 'स्तर 2 चयन (उपस्थिति💮)' : '2단계 선택 (필수💮)'))))}
        </button>
        <button
          onClick={() => handleRestart(3)}
          style={{
            flex: 1,
            minHeight: '48px',
            minWidth: '90px',
            padding: '10px 8px',
            borderRadius: '14px',
            border: quizLevel === 3 ? '2px solid #E67E22' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 3 ? '4px solid #D35400' : '4px solid #CECECE',
            background: quizLevel === 3 ? '#FF9600' : '#FFFFFF',
            color: quizLevel === 3 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          🎙️ {currentLang === 'zh' ? '第3关 录音 (选修⭐)' : (currentLang === 'fr' ? 'Niveau 3 Micro (Option⭐)' : (currentLang === 'ja' ? '第3段階 録音 (選択⭐)' : (currentLang === 'vi' ? 'Cấp 3 Ghi âm (Tự chọn⭐)' : (currentLang === 'hi' ? 'स्तर 3 रिकॉर्डिंग (वैकल्पिक⭐)' : '3단계 녹음 (선택⭐)'))))}
        </button>
        <button
          onClick={() => handleRestart(4)}
          style={{
            flex: 1,
            minHeight: '48px',
            minWidth: '90px',
            padding: '10px 8px',
            borderRadius: '14px',
            border: quizLevel === 4 ? '2px solid #B75DFF' : '2px solid #E5E5E5',
            borderBottom: quizLevel === 4 ? '4px solid #8E44AD' : '4px solid #CECECE',
            background: quizLevel === 4 ? '#CE82FF' : '#FFFFFF',
            color: quizLevel === 4 ? 'white' : '#777777',
            fontWeight: '900',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transition: 'all 0.15s ease'
          }}
        >
          ✍️ {currentLang === 'zh' ? '第4关 默写 (进阶)' : (currentLang === 'fr' ? 'Niveau 4 Écriture' : (currentLang === 'ja' ? '第4段階 記述 (応用)' : (currentLang === 'vi' ? 'Cấp 4 Viết (Nâng cao)' : (currentLang === 'hi' ? 'स्तर 4 लेखन (उन्नत)' : '4단계 직접쓰기 (선택⭐)'))))}
        </button>
      </div>

      {!isQuizEnded ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: '900', color: '#777777', fontSize: '13px' }}>
              {currentLang === 'zh' ? `题目 ${currentIndex + 1} / ${safeWords.length}` : (currentLang === 'fr' ? `Question ${currentIndex + 1} / ${safeWords.length}` : (currentLang === 'ja' ? `問題 ${currentIndex + 1} / ${safeWords.length}` : (currentLang === 'vi' ? `Câu hỏi ${currentIndex + 1} / ${safeWords.length}` : (currentLang === 'hi' ? `प्रश्न ${currentIndex + 1} / ${safeWords.length}` : `문제 ${currentIndex + 1} / ${safeWords.length}`))))}
            </span>
            <span style={{ fontWeight: '900', color: '#58CC02', fontSize: '14px', background: '#E5F8D0', padding: '4px 10px', borderRadius: '10px', border: '1px solid #46A302' }}>
              🔥 {currentLang === 'zh' ? `得分: ${score}分` : (currentLang === 'fr' ? `Score: ${score} pts` : (currentLang === 'ja' ? `スコア: ${score}点` : (currentLang === 'vi' ? `Điểm: ${score}` : (currentLang === 'hi' ? `अंक: ${score}` : `점수: ${score}점`))))}
            </span>
          </div>

          {/* 레벨 1: 소리 퀴즈 */}
          {quizLevel === 1 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F7F7F7', borderRadius: '20px', marginBottom: '20px', border: '2px solid #E5E5E5' }}>
              <button
                onClick={() => playAudio(cleanWordStr)}
                style={{ background: '#1CB0F6', color: 'white', border: 'none', borderBottom: '4px solid #1899D6', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '10px' }}
              >
                🔊 {currentLang === 'zh' ? '重播发音' : (currentLang === 'fr' ? 'Réécouter' : (currentLang === 'ja' ? '発音をもう一度' : (currentLang === 'vi' ? 'Nghe lại' : (currentLang === 'hi' ? 'पुनः सुनें' : '발음 다시 듣기'))))}
              </button>
              <h3 style={{ margin: '6px 0 0 0', fontSize: '24px', color: '#3C3C3C' }}>{cleanWordStr}</h3>
              <p style={{ margin: '2px 0 0 0', color: '#777777', fontSize: '14px', fontWeight: 'bold' }}>{currentQuiz.phonics}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: '#FF9600', fontWeight: '900' }}>
                💡 {currentLang === 'zh' ? '请听发音并选择正确的释义！' : (currentLang === 'fr' ? 'Écoutez la prononciation et choisissez la bonne signification !' : (currentLang === 'ja' ? '音声を聞いて正しい意味を選択してください！' : (currentLang === 'vi' ? 'Nghe phát âm và chọn nghĩa đúng!' : (currentLang === 'hi' ? 'उच्चारण सुनें और सही अर्थ चुनें!' : '소리를 듣고 올바른 한글 뜻을 선택하세요!'))))}
              </p>
            </div>
          )}

          {/* 레벨 2: 스펠링 선택 퀴즈 */}
          {quizLevel === 2 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F7F7F7', borderRadius: '20px', marginBottom: '20px', border: '2px solid #E5E5E5' }}>
              <span style={{ fontSize: '12px', color: '#58CC02', fontWeight: '900', background: '#E5F8D0', padding: '2px 10px', borderRadius: '8px' }}>
                {currentLang === 'zh' ? '拼写辨析测验 (必修)' : (currentLang === 'fr' ? 'Quiz Orthographe (Obligatoire)' : (currentLang === 'ja' ? 'スペル選択クイズ (必須)' : (currentLang === 'vi' ? 'Trắc nghiệm chính tả (Bắt buộc)' : (currentLang === 'hi' ? 'वर्तनी चयन क्विज (अनिवार्य)' : '스펠링 퀴즈 (필수)'))))}
              </span>
              <h2 style={{ margin: '8px 0', fontSize: '28px', color: '#FF4B4B', fontWeight: '900' }}>
                {getOptionMeaning(currentQuiz, currentLang)}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#777777', fontWeight: 'bold' }}>
                💡 {currentLang === 'zh' ? '请在下列选项中选择正确的英语单词！(点击选项即朗读单词发音 🔊)' : (currentLang === 'fr' ? 'Choisissez le bon mot anglais ci-dessous ! (Lecture audio au clic 🔊)' : (currentLang === 'ja' ? '下記から正しい英単語を選択してください！(選択時に発音を再生 🔊)' : (currentLang === 'vi' ? 'Chọn từ tiếng Anh đúng dưới đây! (Phát âm khi chọn 🔊)' : (currentLang === 'hi' ? 'नीचे सही अंग्रेजी शब्द चुनें! (क्लिक पर उच्चारण 🔊)' : '아래 보기에서 올바른 영어 단어를 선택하세요! (답을 누르면 단어 소리가 자동 재생됩니다 🔊)'))))}
              </p>
            </div>
          )}

          {/* 🚀 [3번 신규 기능] 레벨 3: 마이크 발음 녹음 퀴즈 (75점 이상 합격) */}
          {quizLevel === 3 && (
            <div style={{ textAlign: 'center', padding: '20px 14px', background: '#FFF8F0', borderRadius: '20px', marginBottom: '20px', border: '2px solid #FFE4C4' }}>
              <span style={{ fontSize: '12px', color: '#D35400', fontWeight: '900', background: '#FEF5E7', padding: '4px 10px', borderRadius: '10px', border: '1px solid #FADBD8' }}>
                🎙️ {currentLang === 'zh' ? '第3关 发音录音评测 (65分以上通过)' : (currentLang === 'fr' ? 'Niveau 3 Test Prononciation Micro (65+ pts)' : (currentLang === 'ja' ? '第3段階 マイク発音録音テスト (65点以上で合格)' : (currentLang === 'vi' ? 'Cấp 3 Kiểm tra phát âm ghi âm (65+ điểm)' : (currentLang === 'hi' ? 'स्तर 3 उच्चारण रिकॉर्डिंग (65+ अंक)' : '3단계 마이크 발음 녹음 퀴즈 (65점 이상 합격)'))))}
              </span>
              <h2 style={{ margin: '10px 0 4px 0', fontSize: '28px', color: '#2C3E50', fontWeight: '900' }}>
                {getOptionMeaning(currentQuiz, currentLang)}
              </h2>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#E67E22', fontWeight: 'bold' }}>
                💡 {currentLang === 'zh' ? `请点击下方麦克风并大声读出单词 [${cleanWordStr}]！` : (currentLang === 'fr' ? `Appuyez sur le micro et prononcez à voix haute [${cleanWordStr}] !` : (currentLang === 'ja' ? `下のマイクボタンを押して英単語 [${cleanWordStr}] の発音を声に出してください！` : (currentLang === 'vi' ? `Nhấn nút micro bên dưới và đọc to từ tiếng Anh [${cleanWordStr}]!` : (currentLang === 'hi' ? `नीचे माइक्रोफ़ोन बटन दबाएं और अंग्रेजी शब्द [${cleanWordStr}] ज़ोर से बोलें!` : `아래 마이크 버튼을 누르고 영단어 [${cleanWordStr}] 발음을 편안하게 말해보세요!`))))}
              </p>

              {/* 녹음 조작 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
                {!isRecording ? (
                  <button
                    onClick={startRecordingQuiz}
                    disabled={selectedAnswer !== null}
                    style={{
                      background: '#FF9600',
                      color: 'white',
                      border: 'none',
                      borderBottom: '4px solid #D35400',
                      padding: '12px 28px',
                      borderRadius: '16px',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🎙️ {currentLang === 'zh' ? '开始录音' : (currentLang === 'fr' ? 'Démarrer l\'enregistrement' : (currentLang === 'ja' ? '録音開始' : (currentLang === 'vi' ? 'Bắt đầu ghi âm' : (currentLang === 'hi' ? 'रिकॉर्डिंग शुरू' : '녹음 시작'))))}
                  </button>
                ) : (
                  <button
                    onClick={stopRecordingQuiz}
                    style={{
                      background: '#FF4B4B',
                      color: 'white',
                      border: 'none',
                      borderBottom: '4px solid #EA2B2B',
                      padding: '12px 28px',
                      borderRadius: '16px',
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      animation: 'pulse 1s infinite'
                    }}
                  >
                    ⏹️ {currentLang === 'zh' ? '结束录音并评分' : (currentLang === 'fr' ? 'Arrêter et évaluer' : (currentLang === 'ja' ? '録音完了・採点' : (currentLang === 'vi' ? 'Dừng và chấm điểm' : (currentLang === 'hi' ? 'समाप्त और स्कोर' : '녹음 완료 및 평가'))))}
                  </button>
                )}

                <button
                  onClick={() => playAudio(cleanWordStr)}
                  style={{ background: '#1CB0F6', color: 'white', border: 'none', borderBottom: '4px solid #1899D6', padding: '12px 18px', borderRadius: '16px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}
                  title="정답 발음 들어보기"
                >
                  🔊 {currentLang === 'zh' ? '听标准发音' : (currentLang === 'fr' ? 'Écouter' : (currentLang === 'ja' ? '正解発音を聞く' : (currentLang === 'vi' ? 'Nghe phát âm chuẩn' : (currentLang === 'hi' ? 'सही उच्चारण' : '정답 발음 듣기'))))}
                </button>
              </div>

              {/* 발음 분석 결과 표시 */}
              {pronunciationScore !== null && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: pronunciationScore >= 65 ? '#E5F8D0' : '#FFDFDF',
                  border: pronunciationScore >= 65 ? '2px solid #46A302' : '2px solid #FF4B4B',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: pronunciationScore >= 65 ? '#46A302' : '#EA2B2B' }}>
                    {pronunciationScore >= 65 ? (currentLang === 'zh' ? `🎉 [${pronunciationScore}分] 65分以上通过! 🌟` : (currentLang === 'fr' ? `🎉 [${pronunciationScore} pts] Validé ! 🌟` : (currentLang === 'ja' ? `🎉 [${pronunciationScore}点] 65点以上合格！🌟` : (currentLang === 'vi' ? `🎉 [${pronunciationScore} điểm] Đạt! 🌟` : (currentLang === 'hi' ? `🎉 [${pronunciationScore} अंक] सफल! 🌟` : `🎉 [${pronunciationScore}점] 발음 퀴즈 통과! 🌟`))))) : (currentLang === 'zh' ? `❌ [${pronunciationScore}分] 低于65分 (需重试) 💡` : (currentLang === 'fr' ? `❌ [${pronunciationScore} pts] Moins de 65 (Rejouer) 💡` : (currentLang === 'ja' ? `❌ [${pronunciationScore}点] 65点未満 (再挑戦必要) 💡` : (currentLang === 'vi' ? `❌ [${pronunciationScore} điểm] Dưới 65 (Thử lại) 💡` : (currentLang === 'hi' ? `❌ [${pronunciationScore} अंक] 65 से कम (पुनः प्रयास करें) 💡` : `❌ [${pronunciationScore}점] 65점 미만 (재도전 필요) 💡`)))))}
                  </div>
                  {spokenText && (
                    <span style={{ fontSize: '12px', color: '#555555' }}>
                      {currentLang === 'zh' ? `识别发音: "${spokenText}" (目标: ${cleanWordStr})` : (currentLang === 'fr' ? `Prononciation: "${spokenText}" (Cible: ${cleanWordStr})` : (currentLang === 'ja' ? `認識発音: "${spokenText}" (目標: ${cleanWordStr})` : (currentLang === 'vi' ? `Phát âm nhận diện: "${spokenText}" (Mục tiêu: ${cleanWordStr})` : (currentLang === 'hi' ? `पहचाना गया: "${spokenText}" (लक्ष्य: ${cleanWordStr})` : `인식된 발음: "${spokenText}" (목표 단어: ${cleanWordStr})`))))}
                    </span>
                  )}
                </div>
              )}

              {/* 🤖 AI 발음 교정 가이드 팁 카드 */}
              {(() => {
                const aiTip = getAIPronunciationGuideTip(cleanWordStr, pronunciationScore, currentLang);
                if (!aiTip) return null;
                return (
                  <div
                    style={{
                      margin: '12px 0 6px 0',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: aiTip.bg,
                      border: `2px solid ${aiTip.border}`,
                      textAlign: 'left',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      animation: 'fadeIn 0.4s ease'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '900', color: aiTip.color, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span>{aiTip.icon}</span>
                      <span>{aiTip.title}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#2C3E50', lineHeight: 1.5, fontWeight: 'bold' }}>
                      {aiTip.text}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 레벨 4: 스펠링 직접 입력 퀴즈 */}
          {quizLevel === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F5EEF8', borderRadius: '20px', marginBottom: '20px', border: '2px solid #E8DAEF' }}>
              <span style={{ fontSize: '12px', color: '#8E44AD', fontWeight: '900', background: '#E8DAEF', padding: '2px 10px', borderRadius: '8px' }}>
                ✍️ {currentLang === 'zh' ? '第4关 英文拼写主观题' : (currentLang === 'fr' ? 'Niveau 4 Dictée & Écriture' : (currentLang === 'ja' ? '第4段階 記述式スペルテスト' : (currentLang === 'vi' ? 'Cấp 4 Viết chính tả' : (currentLang === 'hi' ? 'स्तर 4 वर्तनी लेखन' : '4단계 주관식 스펠링 직접 쓰기'))))}
              </span>
              <h2 style={{ margin: '8px 0', fontSize: '28px', color: '#2C3E50', fontWeight: '900' }}>
                {getOptionMeaning(currentQuiz, currentLang)}
              </h2>
              <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#8E44AD', fontWeight: 'bold' }}>
                💡 {currentLang === 'zh' ? '请在下方输入框直接输入英语单词拼写！' : (currentLang === 'fr' ? 'Saisissez l\'orthographe du mot anglais dans le champ ci-dessous !' : (currentLang === 'ja' ? '下の入力欄に英単語のスペルを直接入力してください！' : (currentLang === 'vi' ? 'Nhập chính tả từ tiếng Anh vào ô dưới đây!' : (currentLang === 'hi' ? 'नीचे दिए गए इनपुट बॉक्स में अंग्रेजी वर्तनी दर्ज करें!' : '영어 단어 스펠링을 아래 입력란에 직접 입력하세요!'))))}
              </p>

              <form onSubmit={handleTypedSubmit} style={{ display: 'flex', gap: '8px', maxWidth: '320px', margin: '0 auto' }}>
                <input
                  type="text"
                  placeholder={currentLang === 'zh' ? '例: apple' : (currentLang === 'fr' ? 'Ex: apple' : (currentLang === 'ja' ? '例: apple' : (currentLang === 'vi' ? 'VD: apple' : (currentLang === 'hi' ? 'उदा: apple' : '예: apple'))))}
                  value={typedInput}
                  onChange={(e) => setTypedInput(e.target.value)}
                  disabled={selectedAnswer !== null}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: '14px', border: '2px solid #CE82FF', fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={selectedAnswer !== null || !typedInput.trim()}
                  style={{ background: '#CE82FF', color: 'white', border: 'none', borderBottom: '4px solid #8E44AD', padding: '12px 18px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer' }}
                >
                  {currentLang === 'zh' ? '提交' : (currentLang === 'fr' ? 'Soumettre' : (currentLang === 'ja' ? '提出' : (currentLang === 'vi' ? 'Nộp bài' : (currentLang === 'hi' ? 'जमा करें' : '제출'))))}
                </button>
              </form>
            </div>
          )}

          {/* 1단계 & 2단계 4지선다 보임 선택 */}
          {(quizLevel === 1 || quizLevel === 2) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {options.map((optionItem, idx) => {
                const optStr = (optionItem.word || optionItem).replace(/\.png/gi, '').trim();
                const isSelected = selectedAnswer && (selectedAnswer.word || selectedAnswer).replace(/\.png/gi, '').trim() === optStr;

                let btnBg = '#FFFFFF';
                let btnBorder = '2px solid #E5E5E5';
                let btnBorderBottom = '4px solid #CECECE';
                let btnColor = '#3C3C3C';

                if (selectedAnswer !== null) {
                  if (optStr === cleanWordStr) {
                    btnBg = '#E5F8D0';
                    btnBorder = '2px solid #46A302';
                    btnBorderBottom = '4px solid #46A302';
                    btnColor = '#46A302';
                  } else if (isSelected) {
                    btnBg = '#FFDFDF';
                    btnBorder = '2px solid #FF4B4B';
                    btnBorderBottom = '4px solid #EA2B2B';
                    btnColor = '#EA2B2B';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(optionItem)}
                    style={{
                      minHeight: '64px',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      background: btnBg,
                      border: btnBorder,
                      borderBottom: btnBorderBottom,
                      color: btnColor,
                      fontWeight: '900',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      lineHeight: 1.35,
                      boxShadow: '0 4px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    {quizLevel === 1 ? getOptionMeaning(optionItem, currentLang) : optStr}
                  </button>
                );
              })}
            </div>
          )}

          {/* 정답/오답 결과 메시지 */}
          {selectedAnswer !== null && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {isCorrect ? (
                <div style={{ color: '#58CC02', fontWeight: '900', fontSize: '18px' }}>
                  {currentLang === 'zh' ? '🎉 回答正确！太棒了！🌟' : (currentLang === 'fr' ? '🎉 Bravo ! Bonne réponse ! 🌟' : (currentLang === 'ja' ? '🎉 正解です！素晴らしい！🌟' : (currentLang === 'vi' ? '🎉 Chính xác! Rất xuất sắc! 🌟' : (currentLang === 'hi' ? '🎉 सही उत्तर! बहुत बढ़िया! 🌟' : '🎉 정답입니다! 아주 훌륭해요! 🌟'))))}
                </div>
              ) : (
                <div style={{ color: '#FF4B4B', fontWeight: '900', fontSize: '16px' }}>
                  {currentLang === 'zh' ? `❌ 很遗憾答错了！(正确答案: ${cleanWordStr} - ${getOptionMeaning(currentQuiz, currentLang)})` : (currentLang === 'fr' ? `❌ Dommage, mauvaise réponse ! (Réponse: ${cleanWordStr} - ${getOptionMeaning(currentQuiz, currentLang)})` : (currentLang === 'ja' ? `❌ 残念、不正解です！(正解: ${cleanWordStr} - ${getOptionMeaning(currentQuiz, currentLang)})` : (currentLang === 'vi' ? `❌ Rất tiếc, sai rồi! (Đáp án: ${cleanWordStr} - ${getOptionMeaning(currentQuiz, currentLang)})` : (currentLang === 'hi' ? `❌ अफ़सोस, गलत उत्तर! (सही: ${cleanWordStr} - ${getOptionMeaning(currentQuiz, currentLang)})` : `❌ 아쉽네요 오답입니다! (정답: ${cleanWordStr} - ${getOptionMeaning(currentQuiz, currentLang)})`))))}
                  <br />
                  <span style={{ fontSize: '12px', color: '#D35400', background: '#FEF5E7', padding: '3px 10px', borderRadius: '8px', marginTop: '6px', display: 'inline-block', border: '1px solid #FADBD8' }}>
                    {currentLang === 'zh' ? '☁️ 错题已自动保存至云端错题笔记本！' : (currentLang === 'fr' ? '☁️ Mot erroné enregistré dans votre carnet d\'erreurs cloud !' : (currentLang === 'ja' ? '☁️ 間違えた単語はクラウド間違いノートに自動保存されました！' : (currentLang === 'vi' ? '☁️ Từ sai đã được tự động lưu vào sổ tay lỗi trên đám mây!' : (currentLang === 'hi' ? '☁️ गलत शब्द क्लाउड नोटबुक में स्वचालित रूप से सहेजा गया!' : '☁️ 틀린 단어가 클라우드 DB 오답노트에 자동 저장되었습니다!'))))}
                  </span>
                </div>
              )}

              {/* 🔊 실시간 영어 단어 발음 청취 상태 안내 뱃지 */}
              <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EBF5FB', border: '1px solid #AED6F1', padding: '6px 16px', borderRadius: '20px' }}>
                <span style={{ fontSize: '16px' }}>🔊</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#2980B9' }}>
                  {cleanWordStr} {currentQuiz.phonics ? `[${currentQuiz.phonics}]` : ''} {currentLang === 'zh' ? '正在朗读发音...' : (currentLang === 'fr' ? 'Lecture audio en cours...' : (currentLang === 'ja' ? 'ネイティブ発音再生中...' : (currentLang === 'vi' ? 'Đang phát âm...' : (currentLang === 'hi' ? 'उच्चारण बज रहा है...' : '원어민 발음 재생 중...'))))}
                </span>
                <button
                  type="button"
                  onClick={() => playAudio(cleanWordStr)}
                  style={{ background: '#2980B9', color: 'white', border: 'none', borderRadius: '8px', padding: '3px 10px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🔊 {currentLang === 'zh' ? '重播' : (currentLang === 'fr' ? 'Réécouter' : (currentLang === 'ja' ? '再再生' : (currentLang === 'vi' ? 'Nghe lại' : (currentLang === 'hi' ? 'पुनः सुनें' : '다시듣기'))))}
                </button>
              </div>

              <button
                onClick={handleNextQuestion}
                style={{ marginTop: '14px', background: '#3C3C3C', color: 'white', border: 'none', borderBottom: '4px solid #1A1A1A', padding: '12px 28px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                {currentIndex + 1 === safeWords.length ? (currentLang === 'zh' ? '进入下一阶段 ➔' : (currentLang === 'fr' ? 'Étape suivante ➔' : (currentLang === 'ja' ? '次の段階へ ➔' : (currentLang === 'vi' ? 'Giai đoạn tiếp theo ➔' : (currentLang === 'hi' ? 'अगला चरण ➔' : '다음 단계로 ➔'))))) : (currentLang === 'zh' ? '下一题 ➔' : (currentLang === 'fr' ? 'Question suivante ➔' : (currentLang === 'ja' ? '次の問題 ➔' : (currentLang === 'vi' ? 'Câu tiếp theo ➔' : (currentLang === 'hi' ? 'अगला प्रश्न ➔' : '다음 문제 ➔')))))}
              </button>
            </div>
          )}
        </>
      ) : (
        /* 퀴즈 결과 화면 */
        <div style={{ textAlign: 'center', padding: '30px 10px' }}>
          <h2 style={{ color: '#3C3C3C', margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900' }}>
            {quizLevel === 2 ? (currentLang === 'zh' ? '🎉 必修任务达成！获得签到印章(💮)！🏆' : (currentLang === 'fr' ? '🎉 Mission validée ! Tampon (💮) obtenu ! 🏆' : (currentLang === 'ja' ? '🎉 必須学習達成！出席スタンプ(💮)獲得！🏆' : (currentLang === 'vi' ? '🎉 Đã đạt bài học! Nhận con dấu (💮)! 🏆' : (currentLang === 'hi' ? '🎉 अनिवार्य अध्ययन पूर्ण! मोहर (💮) प्राप्त! 🏆' : '🎉 필수 학습 완수! 출석 도장(💮) 획득! 🏆'))))) : (currentLang === 'zh' ? `🎉 恭喜完成第${quizLevel}关测验！🏆` : (currentLang === 'fr' ? `🎉 Félicitations pour le Niveau ${quizLevel} ! 🏆` : (currentLang === 'ja' ? `🎉 第${quizLevel}段階クイズ達成おめでとうございます！🏆` : (currentLang === 'vi' ? `🎉 Chúc mừng hoàn thành Cấp ${quizLevel}! 🏆` : (currentLang === 'hi' ? `🎉 स्तर ${quizLevel} पूरा करने पर बधाई! 🏆` : `🎉 ${quizLevel}단계 퀴즈 완수 축하합니다! 🏆`)))))}
          </h2>
          <p style={{ fontSize: '20px', fontWeight: '900', color: '#58CC02', margin: '0 0 14px 0' }}>
            {currentLang === 'zh' ? `最终得分: ${score} / ${safeWords.length}分` : (currentLang === 'fr' ? `Score final: ${score} / ${safeWords.length} pts` : (currentLang === 'ja' ? `最終スコア: ${score} / ${safeWords.length}点` : (currentLang === 'vi' ? `Điểm cuối cùng: ${score} / ${safeWords.length}` : (currentLang === 'hi' ? `अंतिम अंक: ${score} / ${safeWords.length}` : `최종 점수: ${score} / ${safeWords.length}점`))))}
          </p>

          {quizLevel === 2 && (
            <p style={{ fontSize: '13px', color: '#D35400', background: '#FEF5E7', padding: '8px 14px', borderRadius: '12px', display: 'inline-block', border: '1px solid #FADBD8', marginBottom: '20px', fontWeight: 'bold' }}>
              {currentLang === 'zh' ? '🌟 已完成第2关测验并成功盖上今日签到印章！如需强化学习，可继续挑战第3关录音或第4关默写！' : (currentLang === 'fr' ? '🌟 Niveau 2 validé et tampon de présence validé ! Entraînez-vous davantage avec le Niveau 3 ou 4 !' : (currentLang === 'ja' ? '🌟 第2段階まで完了し本日の出席スタンプが押されました！さらに学習する場合は第3段階録音または第4段階記述に挑戦してください！' : (currentLang === 'vi' ? '🌟 Đã hoàn thành Cấp 2 và nhận dấu điểm danh! Hãy thử thêm Cấp 3 hoặc Cấp 4!' : (currentLang === 'hi' ? '🌟 स्तर 2 पूर्ण और उपस्थिति मोहर प्राप्त! आगे अभ्यास के लिए स्तर 3 या 4 आज़माएं!' : '🌟 2단계 퀴즈까지 완료하여 오늘 필수 학습 도장이 찍혔습니다! 더 공부하고 싶다면 아래 선택 심화 퀴즈(3단계 녹음 / 4단계 직접쓰기)에 도전해보세요!'))))}
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {onLoadNextWordSet && (
              <button
                onClick={onLoadNextWordSet}
                style={{
                  background: '#2ECC71',
                  color: 'white',
                  border: 'none',
                  borderBottom: '5px solid #27AE60',
                  padding: '16px 28px',
                  borderRadius: '18px',
                  fontWeight: '900',
                  fontSize: '16px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(46,204,113,0.3)',
                  animation: 'pulse 1.2s infinite'
                }}
              >
                🚀 {currentLang === 'zh' ? '连续学习下组20词 (Next Round ➔)' : (currentLang === 'fr' ? 'Continuer 20 mots suivants (Next Round ➔)' : (currentLang === 'ja' ? '次の20単語を連続学習 (Next Round ➔)' : (currentLang === 'vi' ? 'Học tiếp 20 từ tiếp theo (Next Round ➔)' : (currentLang === 'hi' ? 'अगले 20 शब्द सीखें (Next Round ➔)' : '🚀 다음 20단어 연속 학습 (Next Round ➔)'))))}
              </button>
            )}

            {quizLevel <= 2 && (
              <button
                onClick={() => handleRestart(3)}
                style={{ background: '#FF9600', color: 'white', border: 'none', borderBottom: '4px solid #D35400', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                🎙️ {currentLang === 'zh' ? '挑战第3关发音录音 (选修⭐) ➔' : (currentLang === 'fr' ? 'Niveau 3 Micro Prononciation (Option⭐) ➔' : (currentLang === 'ja' ? '第3段階 マイク録音に挑戦 (選択⭐) ➔' : (currentLang === 'vi' ? 'Thử sức Cấp 3 Ghi âm (Tự chọn⭐) ➔' : (currentLang === 'hi' ? 'स्तर 3 उच्चारण रिकॉर्डिंग (वैकल्पिक⭐) ➔' : '3단계 마이크 녹음 도전 (선택⭐) ➔'))))}
              </button>
            )}

            {quizLevel <= 3 && (
              <button
                onClick={() => handleRestart(4)}
                style={{ background: '#CE82FF', color: 'white', border: 'none', borderBottom: '4px solid #8E44AD', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
              >
                ✍️ {currentLang === 'zh' ? '挑战第4关单词默写 (进阶⭐) ➔' : (currentLang === 'fr' ? 'Niveau 4 Dictée Écriture (Option⭐) ➔' : (currentLang === 'ja' ? '第4段階 スペル記述に挑戦 (選択⭐) ➔' : (currentLang === 'vi' ? 'Thử sức Cấp 4 Viết chính tả (Nâng cao⭐) ➔' : (currentLang === 'hi' ? 'स्तर 4 वर्तनी लेखन (उन्नत⭐) ➔' : '4단계 주관식 쓰기 도전 (선택⭐) ➔'))))}
              </button>
            )}

            <button
              onClick={() => handleRestart(quizLevel)}
              style={{ background: '#1CB0F6', color: 'white', border: 'none', borderBottom: '4px solid #1899D6', padding: '14px 24px', borderRadius: '16px', fontWeight: '900', fontSize: '15px', cursor: 'pointer' }}
            >
              🔄 {currentLang === 'zh' ? '重新作答' : (currentLang === 'fr' ? 'Recommencer' : (currentLang === 'ja' ? 'もう一度解く' : (currentLang === 'vi' ? 'Làm lại' : (currentLang === 'hi' ? 'पुनः प्रयास करें' : '다시 풀기'))))}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
