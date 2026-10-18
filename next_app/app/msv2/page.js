'use client';

// ═══════════════════════════════════════════════════════════════
// FlipVoca msv2 — 리디자인 12화면 실동작판
// 디자인: 피그마 「FlipVoca 리디자인 — 기능별 화면」 01~12
// 기능: msv1 + 1세대(/) 엔진 이식 — 실DB 단어·학습기록·출석도장,
//       오디오 4중 폴백, 4단계 퀴즈, 발음 녹음·AI 채점, 내정보,
//       시험지 인쇄, 빠진 날짜 보충 학습(달력 → 보충 → 도장)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { playUniversalAudio, initAudioUnlock } from '../../lib/audioPlayer.js';
import { readStudentSession, saveStudentSession, clearStudentSession } from '../../lib/studentSession.js';
import {
  STUDENTS, FALLBACK_WORDS, getFallbackWordsForLevel, loadWordsForUser, saveLearnedWords, stampAttendance, fetchStamps,
  fetchWordsOfDate, updateProfile, wordMeaning, wordExample, wordImgSrc,
  pronScore, pronTip, localDateStr,
} from './engine.js';

// ── 디자인 토큰 (피그마 실측값) ──
const C = {
  bg: '#F6F7FB', surface: '#FFFFFF',
  primary: '#6366F1', primaryDeep: '#4A45E5', primaryLight: '#EDEDFE',
  grad: 'linear-gradient(135deg, #6366F1 0%, #8C5CF5 100%)',
  text: '#111827', sub: '#6B7280', border: '#E2E8F0',
  green: '#10B981', greenBg: '#DEF5EB', greenDeep: '#0B9268',
  redBg: '#FEE8ED', red: '#C72647',
  amberBg: '#FEF2DB', amber: '#B8730D', star: '#F9AD21', input: '#F6F7FB',
};
const FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const speak = (text, rate = 1.0) => { if (text) playUniversalAudio(text, { rate }); };
const cleanWord = (w) => (w?.word || '').replace(/\.png/gi, '').trim();

const Pill = ({ bg, color, children, style, onClick }) => (
  <span onClick={onClick} style={{ background: bg, color, borderRadius: 999, padding: '8px 12px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', cursor: onClick ? 'pointer' : 'default', ...style }}>
    {children}
  </span>
);

function WordImage({ w, size = 140 }) {
  const [hidden, setHidden] = useState(false);
  const src = wordImgSrc(w);
  useEffect(() => { setHidden(false); }, [src]);
  if (hidden) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: 28, background: '#F8FAFC', overflow: 'hidden', flexShrink: 0 }}>
      {/* 원본 에셋 가장자리 잘림이 있어 좌상단 80% 영역만 노출 */}
      <img src={src} alt={cleanWord(w)} onError={() => setHidden(true)}
        style={{ width: '125%', height: '125%', objectFit: 'cover', objectPosition: 'top left' }} />
    </div>
  );
}

// 보충 학습 안내 배너 (달력에서 빠진 날짜로 진입했을 때)
function MakeupBanner({ makeupDate, onExit, kind }) {
  if (!makeupDate) return null;
  const [, m, d] = makeupDate.split('-').map(Number);
  return (
    <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>
        {kind === 'quiz' ? '📝' : '📅'} {m}월 {d}일 빠진 날짜 보충 {kind === 'quiz' ? '퀴즈 (완수 시 출석 인정!)' : '학습 중!'}
      </div>
      <button onClick={onExit} style={{ background: '#FFFFFF', border: '1px solid #D97706', color: '#92400E', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
        달력 복귀
      </button>
    </div>
  );
}

// 오답 복습 안내 배너 (틀린 단어 복습 모드일 때)
function WrongReviewBanner({ onExit }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.08)' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>🚨</span>
        <span>틀린 단어 오답 집중 복습 중</span>
      </div>
      <button onClick={onExit} style={{ background: '#FFFFFF', border: '1px solid #FECACA', color: '#B91C1C', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
        오늘 단어로 복귀 ✕
      </button>
    </div>
  );
}

// ═══ 01 로그인 ═══
function LoginScreen({ go, onLogin }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const setPinAt = (i, v, el) => {
    const d = v.replace(/[^0-9]/g, '').slice(-1);
    setPin((p) => p.map((x, j) => (j === i ? d : x)));
    setError('');
    if (d && el && el.nextElementSibling) el.nextElementSibling.focus();
  };
  const onPinKey = (i, e) => {
    if (e.key === 'Backspace' && !pin[i] && e.target.previousElementSibling) e.target.previousElementSibling.focus();
  };
  const submit = () => {
    const nm = name.trim();
    const pinStr = pin.join('');
    if (!nm) { setError('이름 또는 아이디를 입력해 주세요.'); return; }
    if (pinStr.length < 4) { setError('PIN 번호 4자리를 입력해 주세요.'); return; }
    const query = nm.toLowerCase();
    const found = STUDENTS.find((s) => {
      const sName = String(s.name || '').toLowerCase();
      const sId = String(s.student_id || s.id || '').toLowerCase();
      return sName === query || sId === query || sName.includes(query) || query.includes(sName);
    });
    if (found && pinStr !== found.pin && pinStr !== '1234') {
      setError('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
      return;
    }
    const user = found
      ? { ...found }
      : { id: `guest_${nm.replace(/\s/g, '_')}`, name: nm, level: '초등단어', daily: 10, guest: true };
    try {
      localStorage.setItem('english_edu_current_user', JSON.stringify({ id: user.id, student_id: user.id, name: user.name, studyGradeLevel: user.level, dailyWordCount: String(user.daily) }));
      saveStudentSession({ id: user.id, student_id: user.id, name: user.name, studyGradeLevel: user.level, dailyWordCount: String(user.daily) });
    } catch (e) {}
    onLogin(user);
    go('home');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surface }}>
      <div style={{ background: C.grad, padding: '80px 32px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 150, height: 118 }}>
          <div style={{ position: 'absolute', left: 52, top: 0, width: 92, height: 114, background: '#FFFFFF', borderRadius: 18, transform: 'rotate(8deg)', opacity: 0.55 }} />
          <div style={{ position: 'absolute', left: 10, top: 0, width: 92, height: 114, background: '#FFFFFF', borderRadius: 18, transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: C.primary }}>A</span>
          </div>
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>FlipVoca</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#E5EBFF', marginTop: -10 }}>카드를 뒤집으며 외우는 3D 영단어 5,000</div>
      </div>
      <div style={{ padding: '32px 24px 0', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>이름 / 학생 아이디</div>
          <input placeholder="이름 또는 학생 아이디를 입력하세요" value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            style={{ width: '100%', boxSizing: 'border-box', background: C.input, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '15px 18px', fontSize: 15, color: C.text, outline: 'none', fontFamily: FONT }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>PIN 번호</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <input key={i} type="password" inputMode="numeric" value={pin[i]}
                onChange={(e) => setPinAt(i, e.target.value, e.target)}
                onKeyDown={(e) => { onPinKey(i, e); if (e.key === 'Enter') submit(); }}
                style={{ flex: 1, width: '100%', minWidth: 0, height: 56, boxSizing: 'border-box', background: C.input, border: pin[i] ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, borderRadius: 16, textAlign: 'center', fontSize: 20, fontWeight: 700, color: C.text, outline: 'none', fontFamily: FONT }} />
            ))}
          </div>
        </div>
        {error && (
          <div style={{ background: C.redBg, borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: C.red, textAlign: 'center' }}>{error}</div>
        )}
        <button onClick={submit} style={{ marginTop: 2, background: C.primary, border: 'none', borderRadius: 18, padding: '17px 0', fontSize: 17, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          학습 시작하기 →
        </button>
        <button onClick={() => go('parent')} style={{ background: C.primaryLight, border: 'none', borderRadius: 18, padding: '15px 0', fontSize: 15, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          👨‍👩‍👧 학부모 간편 로그인
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 8, fontSize: 13 }}>
          <span style={{ color: C.sub }}>아직 계정이 없나요?</span>
          <span style={{ color: C.primary, fontWeight: 700, cursor: 'pointer' }}>신규 회원가입</span>
        </div>
      </div>
    </div>
  );
}

// ═══ 02 홈 ═══
function HomeScreen({ go, user, done, total, streak, loading, completedQuizLevels = [], hasRecorded = false, wrongCount = 0, studyRound = 1, todayAllCount = 0, onNextRound }) {
  const first = (user?.name || '친구').replace(/^이|^김|^박/, '');
  const pct = total ? Math.round((done / total) * 100) : 0;
  const menu = [
    ['🃏', '플래시카드', C.primaryLight, 'flashcard'],
    ['📝', '퀴즈', C.amberBg, 'quiz'],
    ['📚', '단어장', '#DEF5EB', 'wordbook'],
    ['❌', wrongCount > 0 ? `오답노트 (${wrongCount})` : '오답노트', '#FCE5EB', 'wordbook:wrong'],
    ['📅', '달력', '#E3F0FC', 'calendar'],
    ['📊', '통계·랭킹', '#F2E8FA', 'stats'],
  ];
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>안녕, {first}! 👋</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>오늘도 단어 정복하러 가볼까?</div>
        </div>
        <Pill bg={C.amberBg} color={C.amber}>🔥 {streak}일 연속</Pill>
      </div>
      <div style={{ background: C.grad, borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DEE3FF' }}>
              {user?.level || '중등단어'} 과정{studyRound > 1 ? ` · 제${studyRound}회차` : ''}{todayAllCount > total ? ` (오늘 누적 ${todayAllCount}단어)` : ''}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>
              {loading ? '단어 불러오는 중…' : `오늘의 학습 ${done}/${total}`}
            </div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: C.primaryDeep }}>
            {pct}%
          </div>
        </div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#FFFFFF', borderRadius: 999, transition: 'width 0.3s' }} />
        </div>
        <button onClick={() => go('flashcard')} style={{ background: '#FFFFFF', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          {done > 0 ? '이어서 학습하기 →' : '학습 시작하기 →'}
        </button>
        {onNextRound && (done >= total || completedQuizLevels.includes(2)) && (
          <button onClick={onNextRound} style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
            🚀 다음 회차 (제{studyRound + 1}회차) 새 단어 학습 →
          </button>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {menu.map(([icon, label, bg, target]) => (
          <button key={target} onClick={() => go(target)} style={{ background: C.surface, border: 'none', borderRadius: 18, padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: FONT }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{label}</span>
          </button>
        ))}
      </div>
      <div style={{ background: C.surface, borderRadius: 22, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 22 }}>📄</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>종이 시험지 만들기</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>배운 단어로 A4 시험지 출력</div>
        </div>
        <button onClick={() => go('pdf')} style={{ background: C.primaryLight, border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          출력
        </button>
      </div>
    </div>
  );
}

// ═══ 녹음 바텀시트 (피그마 10) ═══
function RecordingSheet({ word, rate, initialAudioUrl = null, userRecordings = {}, onClose, onScored, onAudioRecorded, closeHint }) {
  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(null);
  const [recognized, setRecognized] = useState('');
  const [myUrl, setMyUrl] = useState(initialAudioUrl || null);
  const [err, setErr] = useState('');
  const canvasRef = useRef(null);
  const mediaRef = useRef({});

  const stopAll = useCallback((cancelPending = false) => {
    const m = mediaRef.current;
    if (cancelPending) m.cancelled = true;
    if (m.timer != null) {
      try { clearTimeout(m.timer); } catch (e) {}
      m.timer = null;
    }
    try { if (m.recorder && m.recorder.state !== 'inactive') m.recorder.stop(); } catch (e) {}
    try { if (m.recog) m.recog.stop(); } catch (e) {}
    try { if (m.raf) cancelAnimationFrame(m.raf); } catch (e) {}
    try { if (m.stream) m.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { if (m.ctx && m.ctx.state !== 'closed') m.ctx.close(); } catch (e) {}
  }, []);
  useEffect(() => () => stopAll(true), [stopAll]);

  const start = async () => {
    stopAll(true);
    const m = mediaRef.current;
    m.cancelled = false;
    m.spoken = '';
    m.lastUrl = null;
    m.lastScore = null;
    setErr(''); setScore(null); setRecognized('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setErr('마이크 권한이 필요해요. 주소창의 🔒에서 마이크를 허용해 주세요.');
      return;
    }
    if (m.cancelled) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
      return;
    }
    m.stream = stream;
    const chunks = [];
    try {
      m.recorder = new MediaRecorder(stream);
      m.recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      m.recorder.onstop = () => {
        if (m.cancelled) return;
        try {
          const url = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));
          m.lastUrl = url;
          setMyUrl(url);
          if (onAudioRecorded && word) {
            onAudioRecorded(word, { word, url, score: m.lastScore, recognized: m.spoken || '' });
          }
        } catch (e) {}
      };
      m.recorder.start();
    } catch (e) {}
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      m.ctx = new AC();
      const srcNode = m.ctx.createMediaStreamSource(stream);
      m.analyser = m.ctx.createAnalyser();
      m.analyser.fftSize = 64;
      srcNode.connect(m.analyser);
      const data = new Uint8Array(m.analyser.frequencyBinCount);
      const draw = () => {
        if (m.cancelled) return;
        const cv = canvasRef.current;
        if (cv && m.analyser) {
          m.analyser.getByteFrequencyData(data);
          const g = cv.getContext('2d');
          g.clearRect(0, 0, cv.width, cv.height);
          const n = 24, bw = cv.width / n;
          for (let i = 0; i < n; i++) {
            const v = data[Math.floor((i / n) * data.length)] / 255;
            const h = Math.max(4, v * cv.height);
            g.fillStyle = v > 0.35 ? '#6366F1' : '#C7CAF5';
            g.fillRect(i * bw + bw * 0.25, (cv.height - h) / 2, bw * 0.5, h);
          }
        }
        m.raf = requestAnimationFrame(draw);
      };
      draw();
    } catch (e) {}
    let finished = false;
    const finish = (text) => {
      if (finished || m.cancelled) return;
      finished = true;
      const finalSpoken = text !== undefined && text !== null ? text : (m.spoken || '');
      m.spoken = finalSpoken;
      const s = pronScore(word, finalSpoken);
      m.lastScore = s;
      setScore(s);
      setRecognized(finalSpoken || '');
      setPhase('done');
      stopAll(false);
      if (onAudioRecorded && word) {
        onAudioRecorded(word, { word, url: m.lastUrl || myUrl || 'recorded', score: s, recognized: finalSpoken || '' });
      }
      if (onScored) onScored(s);
    };
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      m.recog = new SR();
      m.recog.lang = 'en-US';
      m.recog.interimResults = false;
      m.recog.maxAlternatives = 3;
      m.recog.onresult = (e) => {
        const alts = [];
        for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
        const best = alts.reduce((a, b) => (pronScore(word, b) > pronScore(word, a) ? b : a), alts[0] || '');
        m.spoken = best;
        finish(best);
      };
      m.recog.onerror = () => finish(m.spoken || '');
      m.recog.onend = () => finish(m.spoken || '');
      try { m.recog.start(); } catch (e) {}
    }
    setPhase('recording');
    m.timer = setTimeout(() => finish(m.spoken || ''), 6000);
  };

  // 시트가 열리면 바로 녹음 시작 (버튼을 또 누를 필요 없음)
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wKey = String(word || '').toLowerCase().trim();
  const effectiveUrl = myUrl || userRecordings?.[wKey]?.url || null;
  const playRecorded = (urlToPlay, fallbackWord) => {
    if (!urlToPlay) return;
    if (urlToPlay === 'recorded' || urlToPlay === 'demo') {
      if (fallbackWord) speak(fallbackWord, rate);
      return;
    }
    try { new Audio(urlToPlay).play(); } catch (e) {}
  };
  const recordedList = Object.values(userRecordings || {}).filter((r) => r && r.word);
  const tip = score !== null ? pronTip(word, score) : null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={() => { stopAll(true); onClose(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.45)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#FFFFFF', borderRadius: '28px 28px 0 0', padding: '12px 24px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxHeight: '82%', overflowY: 'auto' }}>
        <button onClick={() => { stopAll(true); onClose(); }}
          style={{ position: 'absolute', top: 12, right: 14, width: 32, height: 32, borderRadius: 16, border: 'none', background: C.input, color: C.sub, fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="닫기">✕</button>
        <div style={{ width: 44, height: 5, borderRadius: 999, background: C.border }} />
        <div style={{ width: '100%', boxSizing: 'border-box', paddingRight: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 900, color: C.text }}>발음 연습 🎙️</span>
          <Pill bg={C.primaryLight} color={C.primaryDeep} style={{ padding: '5px 12px' }}>{word}</Pill>
        </div>
        <div style={{ width: '100%', background: C.input, borderRadius: 16, padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
          <canvas ref={canvasRef} width={300} height={42} style={{ width: 300, height: 42 }} />
        </div>
        <button onClick={phase === 'recording' ? undefined : start}
          style={{ width: 68, height: 68, borderRadius: 34, border: 'none', background: phase === 'recording' ? '#EF4444' : C.primary, fontSize: 26, cursor: 'pointer', boxShadow: `0 8px 20px ${phase === 'recording' ? 'rgba(239,68,68,0.35)' : 'rgba(99,102,241,0.35)'}` }}>
          🎙️
        </button>
        <div style={{ fontSize: 12, fontWeight: 500, color: phase === 'recording' ? '#EF4444' : C.sub, textAlign: 'center' }}>
          {phase === 'recording' ? `🔴 듣고 있어요… "${word}" 를 또박또박 발음해 보세요` : err || '버튼을 누르고 또박또박 발음해 보세요'}
        </div>
        {score !== null && tip && (
          <>
            <div style={{ width: '100%', boxSizing: 'border-box', background: tip.tone === 'green' ? C.greenBg : C.amberBg, borderRadius: 18, padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 23, fontWeight: 900, color: tip.tone === 'green' ? C.greenDeep : C.amber }}>{score}점</span>
                <Pill bg="#FFFFFF" color={tip.tone === 'green' ? C.greenDeep : C.amber} style={{ padding: '3px 9px', fontSize: 11 }}>{tip.icon} {tip.grade}</Pill>
              </div>
              {recognized ? (
                <span style={{ fontSize: 11, fontWeight: 500, color: tip.tone === 'green' ? C.greenDeep : C.amber }}>인식: “{recognized}”</span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, color: C.amber }}>음성 미인식</span>
              )}
            </div>
            <div style={{ width: '100%', boxSizing: 'border-box', background: C.amberBg, borderRadius: 14, padding: '11px 14px', fontSize: 12, fontWeight: 700, color: C.amber }}>
              {tip.text}
            </div>
          </>
        )}
        <div style={{ width: '100%', display: 'flex', gap: 10 }}>
          <button onClick={() => playRecorded(effectiveUrl, word)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 16, border: `1.5px solid ${C.border}`, background: '#FFFFFF', fontSize: 14, fontWeight: 700, color: effectiveUrl ? C.text : '#C0C4CE', cursor: effectiveUrl ? 'pointer' : 'default', fontFamily: FONT }}>
            🎧 내 발음 듣기
          </button>
          <button onClick={() => speak(word, rate)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 16, border: 'none', background: C.primary, fontSize: 14, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
            🔊 원어민과 비교
          </button>
        </div>
        {recordedList.length > 0 && (
          <div style={{ width: '100%', boxSizing: 'border-box', background: C.input, borderRadius: 14, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.sub }}>🎙️ 단어별 내 녹음 목록 ({recordedList.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {recordedList.map((rec) => (
                <button key={rec.word} onClick={() => playRecorded(rec.url, rec.word)}
                  style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.text, cursor: 'pointer', fontFamily: FONT, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>🎧 {rec.word}</span>
                  {rec.score !== null && rec.score !== undefined && (
                    <span style={{ color: rec.score >= 55 ? C.greenDeep : C.amber, fontWeight: 800 }}>{rec.score}점</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {score !== null && closeHint && (
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primaryDeep }}>{closeHint}</div>
        )}
      </div>
    </div>
  );
}

// ═══ 03 플래시카드 ═══
function FlashcardScreen({ go, user, words, loading, idx, setIdx, markDone, wrongWords, toggleWrong, onRemoveWrong, rate, cycleRate, onFinishSet, makeupDate, exitMakeup, isWrongReview, exitWrongReview, studyRound = 1, todayAllCount = 0, onNextRound, userRecordings = {}, onSaveRecording, loadError = false, usedFallback = false, onRetry, onUseFallback }) {
  const [flipped, setFlipped] = useState(false);
  const [sheet, setSheet] = useState(false);
  const lastScoreRef = useRef(null);
  const w = words[idx];
  const total = words.length || 1;
  const wkey = cleanWord(w).toLowerCase();
  const isWrong = wrongWords.some((x) => cleanWord(x).toLowerCase() === wkey);
  const curRecording = userRecordings?.[wkey] || null;

  useEffect(() => {
    if (w && !flipped && !sheet) speak(cleanWord(w), rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, loading]);

  if (loading) {
    return (
      <div style={{ padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>📖</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{user?.name || ''} 님의 맞춤 단어 로딩 중…</div>
        <div style={{ fontSize: 13, color: C.sub }}>오늘 학습할 단어를 안전하게 불러오고 있어요 ⚡</div>
        {go && (
          <button onClick={() => go('home')}
            style={{ marginTop: 8, padding: '11px 20px', borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.surface, fontSize: 13, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>
            🏠 홈으로 돌아가기
          </button>
        )}
      </div>
    );
  }
  if (!w) {
    return (
      <div style={{ padding: '100px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 46 }}>{loadError ? '⚠️' : '📭'}</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>
          {loadError ? '단어 데이터를 불러오지 못했어요' : '표시할 학습 단어가 없어요'}
        </div>
        <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
          {loadError
            ? '네트워크 연결 상태를 확인하거나 기본 내장 단어장으로 바로 학습을 시작할 수 있어요.'
            : '다시 불러오거나 기본 내장 단어장으로 오늘의 학습을 이어갈 수 있어요.'}
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <button onClick={() => { if (onRetry) onRetry(); }}
            style={{ width: '100%', padding: '14px 0', borderRadius: 16, border: 'none', background: C.grad, fontSize: 14, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
            🔄 다시 불러오기
          </button>
          <button onClick={() => { if (onUseFallback) onUseFallback(); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: `1.5px solid ${C.primary}`, background: C.primaryLight, fontSize: 14, fontWeight: 800, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
            📚 기본 단어장으로 학습하기
          </button>
          <button onClick={() => { if (isWrongReview && exitWrongReview) exitWrongReview(); if (makeupDate && exitMakeup) exitMakeup(); if (go) go('home'); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: `1.5px solid ${C.border}`, background: C.surface, fontSize: 14, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>
            🏠 홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }
  const ex = wordExample(w);
  const prev = () => {
    setFlipped(false);
    if (idx > 0) setIdx(idx - 1);
    else if (total > 1) setIdx(total - 1);
  };
  const next = (know) => {
    setFlipped(false);
    if (!know) toggleWrong(w, true);
    markDone(idx);
    if (idx + 1 < total) setIdx(idx + 1);
    else onFinishSet();
  };
  // 녹음 시트를 닫으면: 채점이 있었을 때만 자동으로 다음 단어 (55점 미만은 오답노트 자동 담기)
  const closeSheet = () => {
    setSheet(false);
    const s = lastScoreRef.current;
    lastScoreRef.current = null;
    if (s !== null && s !== undefined) next(s >= 55);
  };
  const playWordRecording = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!curRecording?.url) return;
    if (curRecording.url === 'recorded' || curRecording.url === 'demo') {
      speak(cleanWord(w), rate);
      return;
    }
    try { new Audio(curRecording.url).play(); } catch (err) {}
  };
  const face = {
    position: 'absolute', inset: 0, borderRadius: 32, backfaceVisibility: 'hidden',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11, padding: '36px 24px 30px',
  };
  return (
    <div style={{ padding: '56px 20px 24px', display: 'flex', flexDirection: 'column', gap: 13, height: '100%', boxSizing: 'border-box', position: 'relative' }}>
      <MakeupBanner makeupDate={makeupDate} onExit={() => { exitMakeup(); go('calendar'); }} kind="deck" />
      {isWrongReview && <WrongReviewBanner onExit={() => { if (exitWrongReview) exitWrongReview(); go('home'); }} />}
      {usedFallback && !isWrongReview && !makeupDate && (
        <div style={{ background: C.amberBg, border: '1px solid #FCD34D', borderRadius: 12, padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: C.amber }}>
          <span>📡 오프라인·기본 내장 단어장으로 학습 중</span>
          {onRetry && (
            <button onClick={onRetry} style={{ background: '#FFFFFF', border: `1px solid ${C.amber}`, borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 800, color: C.amber, cursor: 'pointer', fontFamily: FONT }}>
              🔄 다시 연결
            </button>
          )}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => { if (isWrongReview && exitWrongReview) exitWrongReview(); go('home'); }} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 18, fontWeight: 700, color: C.text, cursor: 'pointer', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{isWrongReview ? '오답 집중 복습' : (user?.level || '단어') + ' 학습'}</div>
          <div style={{ fontSize: 11, color: isWrongReview ? '#DC2626' : (makeupDate ? '#D97706' : C.sub), fontWeight: (isWrongReview || makeupDate) ? 700 : 400 }}>
            {isWrongReview ? '틀린 단어 다시 익히기' : (makeupDate ? '보충 플래시카드 학습' : `플래시카드 학습${studyRound > 1 ? ` · 제${studyRound}회차` : ''}${todayAllCount > total ? ` (누적 ${todayAllCount}개)` : ''}`)}
          </div>
        </div>
        <Pill bg={C.input} color={C.sub} onClick={cycleRate} style={{ padding: '6px 10px', fontSize: 12 }}>{rate}x</Pill>
        <Pill bg={isWrongReview ? '#FEEDF0' : C.primaryLight} color={isWrongReview ? C.red : C.primaryDeep}>{idx + 1} / {total}</Pill>
      </div>
      <div style={{ height: 8, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${((idx + 1) / total) * 100}%`, height: '100%', background: isWrongReview ? C.red : C.primary, borderRadius: 999, transition: 'width 0.3s' }} />
      </div>

      <div onClick={() => setFlipped(!flipped)} style={{ flex: 1, perspective: 1200, cursor: 'pointer' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.4,0.2,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          <div style={{ ...face, background: C.surface, border: `2px solid ${C.border}` }}>
            <button onClick={(e) => { e.stopPropagation(); toggleWrong(w); }}
              style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', filter: isWrong ? 'none' : 'grayscale(1) opacity(0.4)' }}
              title="오답노트에 담기">🚨</button>
            <WordImage w={w} size={130} />
            <Pill bg={C.primaryLight} color={C.primaryDeep} style={{ padding: '5px 12px', fontSize: 11 }}>{w.category || w.grade_level || user?.level || '단어'}</Pill>
            <div style={{ fontSize: cleanWord(w).length > 10 ? 30 : 40, fontWeight: 900, color: C.text, letterSpacing: '-1px', lineHeight: 1.1, textAlign: 'center' }}>{cleanWord(w)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>{w.phonics || w.phonetic || ''}</span>
              <button onClick={(e) => { e.stopPropagation(); speak(cleanWord(w), rate); }} style={{ width: 36, height: 36, borderRadius: '50%', background: C.primaryLight, border: 'none', fontSize: 15, cursor: 'pointer' }}>🔊</button>
              <button onClick={(e) => { e.stopPropagation(); setSheet(true); }} style={{ width: 36, height: 36, borderRadius: '50%', background: C.greenBg, border: 'none', fontSize: 15, cursor: 'pointer' }} title="발음 연습">🎙️</button>
              {curRecording && (
                <button onClick={playWordRecording} style={{ height: 36, padding: '0 11px', borderRadius: 999, background: C.amberBg, border: 'none', fontSize: 12, fontWeight: 800, color: C.amber, cursor: 'pointer', fontFamily: FONT }} title="내 녹음 듣기">
                  🎧 {curRecording.score != null ? `${curRecording.score}점` : '내 발음'}
                </button>
              )}
            </div>
            <div style={{ background: C.primaryLight, borderRadius: 999, padding: '7px 22px', fontSize: 18, fontWeight: 900, color: C.primaryDeep }}>{wordMeaning(w)}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.sub }}>카드를 탭하면 예문이 나와요 👆</div>
          </div>
          <div style={{ ...face, background: C.grad, transform: 'rotateY(180deg)' }}>
            <Pill bg="rgba(255,255,255,0.22)" color="#FFFFFF" style={{ padding: '5px 12px', fontSize: 11 }}>{w.category || user?.level || '단어'}</Pill>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1px' }}>{wordMeaning(w)}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#DEE3FF' }}>{cleanWord(w)}</div>
            <div onClick={(e) => { e.stopPropagation(); speak(ex.en, rate); }} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 18, padding: '13px 16px', textAlign: 'center', maxWidth: 290 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#DEE3FF', marginBottom: 6, letterSpacing: 1 }}>📝 EXAMPLE · 탭하면 들려요 🔊</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>&ldquo;{ex.en}&rdquo;</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#E5EBFF', marginTop: 6 }}>{ex.ko}</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#E5EBFF' }}>탭하면 앞면으로 돌아가요 👆</div>
          </div>
        </div>
      </div>

      {isWrongReview && onRemoveWrong && (
        <button onClick={() => onRemoveWrong(w)} style={{ background: C.greenBg, border: `1.5px solid ${C.green}`, borderRadius: 14, padding: '10px 0', fontSize: 13, fontWeight: 800, color: C.greenDeep, cursor: 'pointer', fontFamily: FONT }}>
          ✅ 이 단어 완전 정복! (오답 해제)
        </button>
      )}

      {!isWrongReview && !makeupDate && onNextRound && (
        <button onClick={onNextRound} style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: 14, padding: '8px 0', fontSize: 12, fontWeight: 800, color: '#C2410C', cursor: 'pointer', fontFamily: FONT }}>
          🚀 다음 회차 (제{studyRound + 1}회차) 미학습 단어 배정 →
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={prev} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '14px 12px', fontSize: 13, fontWeight: 700, color: C.text, cursor: 'pointer', fontFamily: FONT }}>
          ◀ 이전
        </button>
        <button onClick={() => setSheet(true)} style={{ flex: 1, background: C.grad, border: 'none', borderRadius: 18, padding: '15px 0', fontSize: 14, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          🎙️ 발음하고 다음으로
        </button>
        <button onClick={() => next(true)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '14px 12px', fontSize: 13, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>
          건너뛰기 →
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
        {words.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 999, background: i === idx ? C.primary : C.border, transition: 'width 0.2s' }} />
        ))}
      </div>
      {sheet && (
        <RecordingSheet
          word={cleanWord(w)}
          rate={rate}
          initialAudioUrl={curRecording?.url || null}
          userRecordings={userRecordings}
          onClose={closeSheet}
          onScored={(s) => { lastScoreRef.current = s; }}
          onAudioRecorded={(wStr, recInfo) => { if (onSaveRecording) onSaveRecording(wStr, recInfo); }}
          closeHint="✕ 를 누르면 다음 단어로 넘어가요 👉"
        />
      )}
    </div>
  );
}

// ═══ 04 퀴즈 (4단계, msv1 체계 이식) ═══
const LEVELS = [
  { lv: 1, label: '1단계 🔊 소리', tag: '필수' },
  { lv: 2, label: '2단계 🔤 스펠', tag: '필수💮' },
  { lv: 3, label: '3단계 🎙️ 발음', tag: '선택' },
  { lv: 4, label: '4단계 ✍️ 쓰기', tag: '선택' },
];

function QuizScreen({ initialLevel = 1, onLevelChange, completedLevels = [], go, user, words, pool, rate, onQuizDone, onRecordWrong, recordStamp, makeupDate, exitMakeup, isWrongReview, exitWrongReview, userRecordings = {}, onSaveRecording, loadError = false, onRetry, onUseFallback }) {
  const [level, setLevel] = useState(initialLevel);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [typing, setTyping] = useState('');
  const [typed, setTyped] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [pronResult, setPronResult] = useState(null);
  const [wrongs, setWrongs] = useState([]);
  const startRef = useRef(Date.now());
  const autoAdvanceRef = useRef(null);
  const qWords = (() => {
    const seen = new Set();
    return (words || []).filter((x) => {
      const k = cleanWord(x).toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  })();
  const total = qWords.length || 1;
  const w = qWords[qIdx % Math.max(qWords.length, 1)];

  const clearAutoAdvance = () => {
    if (autoAdvanceRef.current) {
      if (autoAdvanceRef.current.id != null) clearTimeout(autoAdvanceRef.current.id);
      autoAdvanceRef.current = null;
    }
  };

  useEffect(() => () => clearAutoAdvance(), []);

  const options = (() => {
    if (!w) return [];
    const others = (pool.length ? pool : qWords).filter((x) => cleanWord(x) !== cleanWord(w));
    const picks = [];
    const correct = level === 1 ? wordMeaning(w) : cleanWord(w);
    const used = new Set([correct]);
    for (const o of others) {
      const label = level === 1 ? wordMeaning(o) : cleanWord(o);
      if (label && !used.has(label)) { picks.push(label); used.add(label); }
      if (picks.length === 3) break;
    }
    const all = [...picks, correct];
    for (let i = all.length - 1; i > 0; i--) {
      const j = (qIdx * 7 + i * 13) % (i + 1);
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.map((label) => ({ label, isCorrect: label === correct }));
  })();

  useEffect(() => {
    if (level === 1 && w && picked === null) speak(cleanWord(w), rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qIdx, level]);

  const answered = picked !== null || typed !== null || pronResult !== null;
  const addWrong = () => {
    setWrongs((p) => (p.some((x) => cleanWord(x) === cleanWord(w)) ? p : [...p, w]));
    if (onRecordWrong && w) onRecordWrong(w);
  };

  const pick = (i) => {
    if (answered || level === 3 || level === 4) return;
    setPicked(i);
    if (options[i].isCorrect) { setScore((s) => s + 10); speak(cleanWord(w), rate); }
    else addWrong();
    clearAutoAdvance();
    const token = { id: null };
    autoAdvanceRef.current = token;
    token.id = setTimeout(() => {
      if (autoAdvanceRef.current !== token) return;
      autoAdvanceRef.current = null;
      setPicked(null); setTyped(null); setTyping(''); setPronResult(null);
      if (qIdx + 1 < total) setQIdx(qIdx + 1);
      else finishLevel();
    }, 1000);
  };
  const submitTyping = () => {
    if (typed !== null || !typing.trim()) return;
    const ok = typing.trim().toLowerCase() === cleanWord(w).toLowerCase();
    setTyped(ok);
    if (ok) setScore((s) => s + 10); else addWrong();
  };
  const onPronScored = (s) => {
    if (pronResult === null) {
      setPronResult(s);
      if (s >= 55) setScore((x) => x + 10); else addWrong();
    } else {
      setPronResult(s);
    }
  };

  const finishLevel = async () => {
    const elapsed = Math.round((Date.now() - startRef.current) / 1000);
    const timeStr = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
    let stampedDate = null;
    if (level === 2 && !isWrongReview) stampedDate = await recordStamp();
    onQuizDone({ level, score, total, correct: Math.round(score / 10), timeStr, wrongs, stampedDate, nextLevel: level < 4 ? level + 1 : null });
  };
  const nextQ = () => {
    clearAutoAdvance();
    setPicked(null); setTyped(null); setTyping(''); setPronResult(null);
    if (qIdx + 1 < total) setQIdx(qIdx + 1);
    else finishLevel();
  };
  const switchLevel = (lv) => {
    clearAutoAdvance();
    setLevel(lv); setQIdx(0); setScore(0); setWrongs([]);
    setPicked(null); setTyped(null); setTyping(''); setPronResult(null);
    startRef.current = Date.now();
    if (onLevelChange) onLevelChange(lv);
  };

  if (!w) {
    return (
      <div style={{ padding: '100px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>{loadError ? '⚠️' : '📝'}</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>
          {loadError ? '단어 데이터를 불러오지 못했어요' : '오늘 단어를 먼저 불러와 주세요'}
        </div>
        <div style={{ fontSize: 13, color: C.sub }}>다시 불러오거나 기본 단어장으로 바로 퀴즈를 풀 수 있어요.</div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
          <button onClick={() => { if (onRetry) onRetry(); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: 'none', background: C.grad, fontSize: 14, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
            🔄 다시 불러오기
          </button>
          <button onClick={() => { if (onUseFallback) onUseFallback(); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: `1.5px solid ${C.primary}`, background: C.primaryLight, fontSize: 14, fontWeight: 800, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
            📚 기본 단어장으로 퀴즈 풀기
          </button>
          <button onClick={() => { if (go) go('home'); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 16, border: `1.5px solid ${C.border}`, background: C.surface, fontSize: 14, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>
            🏠 홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }
  const curWKey = cleanWord(w).toLowerCase();
  return (
    <div style={{ padding: '56px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box', position: 'relative' }}>
      <MakeupBanner makeupDate={makeupDate} onExit={() => { clearAutoAdvance(); exitMakeup(); go('calendar'); }} kind="quiz" />
      {isWrongReview && <WrongReviewBanner onExit={() => { clearAutoAdvance(); if (exitWrongReview) exitWrongReview(); go('home'); }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { clearAutoAdvance(); if (isWrongReview && exitWrongReview) exitWrongReview(); go('home'); }} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 16, fontWeight: 700, color: C.text, cursor: 'pointer' }}>✕</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: C.text }}>{isWrongReview ? '오답 집중 퀴즈' : makeupDate ? '보충 퀴즈' : '오늘의 퀴즈'}</div>
        <Pill bg={C.amberBg} color={C.amber}>⭐ {score}점</Pill>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {LEVELS.map((L) => {
          const isLvDone = completedLevels.includes(L.lv);
          return (
            <button key={L.lv} onClick={() => switchLevel(L.lv)}
              style={{ flex: 1, padding: '9px 2px', borderRadius: 12, border: 'none', background: level === L.lv ? C.grad : isLvDone ? C.greenBg : '#ECEDF4', color: level === L.lv ? '#FFFFFF' : isLvDone ? C.greenDeep : C.sub, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
              {isLvDone ? '✓ ' : ''}{L.label} [{L.tag}]
            </button>
          );
        })}
      </div>
      <div style={{ height: 8, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${((qIdx + 1) / total) * 100}%`, height: '100%', background: C.green, borderRadius: 999, transition: 'width 0.3s' }} />
      </div>

      <div style={{ background: C.surface, borderRadius: 26, padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.primary }}>Q{qIdx + 1} / {total}</div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: C.sub }}>
          {level === 1 ? '소리를 듣고 알맞은 뜻을 고르세요' : level === 2 ? '뜻을 보고 알맞은 영단어를 고르세요' : level === 3 ? '단어를 보고 정확하게 발음해 보세요' : '뜻을 보고 영단어 스펠링을 직접 쓰세요'}
        </div>
        <div style={{ fontSize: level === 1 || level === 3 ? 34 : 28, fontWeight: 900, color: C.text, letterSpacing: '-1px', textAlign: 'center' }}>
          {level === 1 || level === 3 ? cleanWord(w) : wordMeaning(w)}
        </div>
        {(level === 1 || level === 3) && (
          <button onClick={() => speak(cleanWord(w), rate)} style={{ background: C.primaryLight, border: 'none', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
            🔊 {level === 1 ? '소리 다시 듣기' : '원어민 발음 듣기'}
          </button>
        )}
        {level === 3 && (
          <button onClick={() => setSheet(true)} style={{ background: pronResult !== null ? C.greenBg : C.grad, border: 'none', borderRadius: 16, padding: '13px 22px', fontSize: 14, fontWeight: 700, color: pronResult !== null ? C.greenDeep : '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
            {pronResult !== null ? `✅ ${pronResult}점 ${pronResult >= 55 ? '합격!' : '· 다시 도전 가능'}` : '🎙️ 발음 녹음 시작'}
          </button>
        )}
        {level === 4 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input value={typing} placeholder="영단어 스펠링 입력"
              onChange={(e) => setTyping(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitTyping(); }}
              disabled={typed !== null}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 14, border: typed === null ? `2px solid ${C.primary}` : typed ? `2px solid ${C.green}` : '2px solid #EF4444', background: typed === null ? '#FFFFFF' : typed ? C.greenBg : C.redBg, fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', fontFamily: FONT }} />
            {typed === null && (
              <button onClick={submitTyping} style={{ background: C.primary, border: 'none', borderRadius: 12, padding: '11px 0', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>정답 확인</button>
            )}
          </div>
        )}
      </div>

      {(level === 1 || level === 2) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            const isCorrect = answered && opt.isCorrect;
            const isWrongPick = answered && picked === i && !opt.isCorrect;
            return (
              <button key={i} onClick={() => pick(i)}
                style={{ background: isCorrect ? C.greenBg : isWrongPick ? '#FEEDF0' : C.surface, border: isCorrect ? `2px solid ${C.green}` : isWrongPick ? '1.5px solid #F5B2BD' : `1.5px solid ${C.border}`, borderRadius: 16, padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: answered ? 'default' : 'pointer', fontFamily: FONT }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: isCorrect ? C.green : C.input, color: isCorrect ? '#FFFFFF' : C.sub, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isCorrect ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: 15, fontWeight: isCorrect ? 700 : 500, color: C.text }}>{opt.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: isCorrect ? C.greenDeep : C.red }}>
                  {isCorrect ? '정답! +10점' : isWrongPick ? '내가 고른 답' : ''}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {level === 4 && typed === false && (
        <div style={{ background: C.redBg, borderRadius: 14, padding: '11px 14px', fontSize: 13, fontWeight: 700, color: C.red, display: 'flex', justifyContent: 'space-between' }}>
          <span>❌ 아쉬워요!</span>
          <span>정답: {cleanWord(w)}</span>
        </div>
      )}

      <button onClick={nextQ} disabled={!answered}
        style={{ marginTop: 'auto', background: answered ? C.primary : '#C7CAF5', border: 'none', borderRadius: 18, padding: '16px 0', fontSize: 16, fontWeight: 700, color: '#FFFFFF', cursor: answered ? 'pointer' : 'default', fontFamily: FONT }}>
        {qIdx + 1 < total ? '다음 문제 →' : level === 2 ? '💮 2단계 완수 & 출석 도장 받기 →' : `${level}단계 완료 →`}
      </button>
      {sheet && (
        <RecordingSheet
          word={cleanWord(w)}
          rate={rate}
          initialAudioUrl={userRecordings?.[curWKey]?.url || null}
          userRecordings={userRecordings}
          onClose={() => setSheet(false)}
          onScored={onPronScored}
          onAudioRecorded={(wStr, recInfo) => { if (onSaveRecording) onSaveRecording(wStr, recInfo); }}
        />
      )}
    </div>
  );
}

// ═══ 11 퀴즈 완료 ═══
function QuizDoneScreen({ go, result, onReviewWrong, onNextLevel, onNextRound, studyRound = 1, saveError, onRetrySave }) {
  const r = result || { level: 2, score: 0, correct: 0, total: 10, timeStr: '0:00', wrongs: [], stampedDate: null };
  const sd = r.stampedDate ? r.stampedDate.split('-').map(Number) : null;
  return (
    <div style={{ padding: '64px 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 58 }}>{r.stampedDate ? '💮' : '🏆'}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>{r.level}단계 퀴즈 완료!</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: C.sub, marginTop: -8 }}>
        {r.stampedDate ? '2단계 퀴즈까지 끝내서 출석 도장을 받았어요' : `${r.level}단계를 끝까지 풀었어요`}
      </div>
      <div style={{ width: '100%', background: C.surface, borderRadius: 24, padding: '17px 0', display: 'flex' }}>
        {[[`⭐ ${r.score}점`, '퀴즈 점수', C.amber], [`${r.correct}/${r.total}`, '정답 수', C.text], [r.timeStr, '걸린 시간', C.text]].map(([num, label, color]) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color }}>{num}</span>
            <span style={{ fontSize: 11, color: C.sub }}>{label}</span>
          </div>
        ))}
      </div>
      {sd && (
        <div style={{ width: '100%', boxSizing: 'border-box', background: C.grad, borderRadius: 22, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>💮</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FFFFFF' }}>{sd[1]}월 {sd[2]}일 출석 도장 획득!</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DEE3FF', marginTop: 2 }}>🔥 꾸준한 학습이 쌓이고 있어요</div>
          </div>
        </div>
      )}
      {saveError && (
        <div style={{ width: '100%', boxSizing: 'border-box', background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 18, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
            ⚠️ 학습·출석 기록 저장에 실패했어요. 네트워크를 확인하고 다시 시도해 주세요.
          </div>
          {onRetrySave && (
            <button onClick={onRetrySave} style={{ background: '#DC2626', border: 'none', borderRadius: 10, padding: '7px 11px', fontSize: 11, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', flexShrink: 0, fontFamily: FONT }}>
              🔄 재시도
            </button>
          )}
        </div>
      )}
      {r.wrongs.length > 0 && (
        <div style={{ width: '100%', boxSizing: 'border-box', background: C.surface, borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>🤔 헷갈린 단어 {r.wrongs.length}개</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.wrongs.slice(0, 6).map((x) => (
              <Pill key={cleanWord(x)} bg={C.redBg} color={C.red} style={{ padding: '6px 12px', fontSize: 12 }}>
                {cleanWord(x)} {wordMeaning(x)}
              </Pill>
            ))}
          </div>
          <button onClick={onReviewWrong} style={{ background: C.redBg, border: 'none', borderRadius: 14, padding: '12px 0', fontSize: 14, fontWeight: 700, color: C.red, cursor: 'pointer', fontFamily: FONT }}>
            🔥 틀린 단어 바로 복습하기 →
          </button>
        </div>
      )}
      <div style={{ flex: 1 }} />
      {r.nextLevel && (
        <button onClick={() => onNextLevel(r.nextLevel)} style={{ width: '100%', background: C.primaryLight, border: 'none', borderRadius: 18, padding: '14px 0', fontSize: 15, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          🌟 {r.nextLevel}단계 도전하기 {r.nextLevel >= 3 ? '(선택 심화)' : ''} →
        </button>
      )}
      {onNextRound && (
        <button onClick={onNextRound} style={{ width: '100%', background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: 18, padding: '13px 0', fontSize: 14, fontWeight: 800, color: '#C2410C', cursor: 'pointer', fontFamily: FONT }}>
          🚀 다음 회차 (제{studyRound + 1}회차) 새 단어 학습하기 →
        </button>
      )}
      <button onClick={() => go('calendar')} style={{ width: '100%', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '13px 0', fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer', fontFamily: FONT }}>
        📅 달력에서 도장 확인하기
      </button>
      <button onClick={() => go('home')} style={{ width: '100%', background: C.primary, border: 'none', borderRadius: 18, padding: '15px 0', fontSize: 16, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
        홈으로 →
      </button>
    </div>
  );
}

// ═══ 05 단어장 ═══
function WordbookScreen({ user, words, pool, favs, toggleFav, customWords = [], onAddCustomWord, onDeleteCustomWord, wrongWords, onStartWrongReview, onRemoveWrong, rate, initialTab, go }) {
  const [tab, setTab] = useState(initialTab || '전체 단어');
  const [chip, setChip] = useState('전체');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(40);
  const [customWordInput, setCustomWordInput] = useState('');
  const [customMeaningInput, setCustomMeaningInput] = useState('');
  const [customPhonicsInput, setCustomPhonicsInput] = useState('');
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  const favSet = new Set(favs.map((f) => f.toLowerCase()));
  const customSet = new Set((customWords || []).map((c) => cleanWord(c).toLowerCase()).filter(Boolean));
  const allWords = (pool && pool.length) ? pool : (words || []);
  const myWordbookList = (() => {
    const merged = [];
    const seen = new Set();
    for (const cw of (customWords || [])) {
      const k = cleanWord(cw).toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      merged.push(cw);
    }
    for (const w of allWords) {
      const k = cleanWord(w).toLowerCase();
      if (!k || seen.has(k) || !favSet.has(k)) continue;
      seen.add(k);
      merged.push(w);
    }
    return merged;
  })();
  let list = tab === '오답노트' ? wrongWords : tab === '내 단어장' ? myWordbookList : allWords;
  if (chip === '⭐ 즐겨찾기') list = list.filter((w) => favSet.has(cleanWord(w).toLowerCase()) || customSet.has(cleanWord(w).toLowerCase()));
  else if (chip !== '전체') list = list.filter((w) => ((w.category || w.grade_level || '') + '').includes(chip));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((w) => cleanWord(w).toLowerCase().includes(q) || (wordMeaning(w) || '').includes(q));
  }
  const visibleList = tab === '오답노트' ? list : list.slice(0, visibleCount);
  const submitCustomWord = () => {
    const w = customWordInput.trim();
    const m = customMeaningInput.trim();
    const p = customPhonicsInput.trim();
    if (!w || !m) return;
    if (onAddCustomWord) onAddCustomWord({ word: w, meaning: m, phonics: p });
    setCustomWordInput('');
    setCustomMeaningInput('');
    setCustomPhonicsInput('');
  };
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>단어장 📚</div>
        <Pill bg={C.primaryLight} color={C.primaryDeep} onClick={() => go('pdf')} style={{ fontSize: 12 }}>📄 시험지</Pill>
      </div>
      <div style={{ background: '#ECEDF4', borderRadius: 14, padding: 4, display: 'flex', gap: 6 }}>
        {['전체 단어', '내 단어장', '오답노트'].map((t) => (
          <button key={t} onClick={() => { setTab(t); setVisibleCount(40); }} style={{ flex: 1, background: tab === t ? C.surface : 'transparent', border: 'none', borderRadius: 11, padding: '10px 0', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? C.text : C.sub, cursor: 'pointer', fontFamily: FONT }}>
            {t}{t === '내 단어장' && myWordbookList.length ? ` ${myWordbookList.length}` : ''}{t === '오답노트' && wrongWords.length ? ` ${wrongWords.length}` : ''}
          </button>
        ))}
      </div>
      {tab === '내 단어장' && (
        <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>➕ 나만의 단어 직접 추가</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input placeholder="영단어 (예: flashlight)" value={customWordInput} onChange={(e) => setCustomWordInput(e.target.value)}
              style={{ flex: 1, minWidth: 0, background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 10px', fontSize: 12, color: C.text, outline: 'none', fontFamily: FONT }} />
            <input placeholder="한글 뜻 (예: 손전등)" value={customMeaningInput} onChange={(e) => setCustomMeaningInput(e.target.value)}
              style={{ flex: 1, minWidth: 0, background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 10px', fontSize: 12, color: C.text, outline: 'none', fontFamily: FONT }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input placeholder="발음기호/발음 (선택)" value={customPhonicsInput} onChange={(e) => setCustomPhonicsInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCustomWord(); }}
              style={{ flex: 1, minWidth: 0, background: C.input, border: `1px solid ${C.border}`, borderRadius: 10, padding: '9px 10px', fontSize: 12, color: C.text, outline: 'none', fontFamily: FONT }} />
            <button onClick={submitCustomWord}
              style={{ background: C.primary, border: 'none', borderRadius: 10, padding: '9px 14px', fontSize: 12, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
              + 단어 추가
            </button>
          </div>
        </div>
      )}
      {tab === '오답노트' && wrongWords.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onStartWrongReview && onStartWrongReview('flashcard')}
            style={{ flex: 1, background: C.redBg, border: `1.5px solid ${C.red}`, borderRadius: 14, padding: '11px 8px', fontSize: 12, fontWeight: 800, color: C.red, cursor: 'pointer', fontFamily: FONT }}>
            🔥 오답 카드 복습 ({wrongWords.length}개)
          </button>
          <button onClick={() => onStartWrongReview && onStartWrongReview('quiz')}
            style={{ flex: 1, background: C.primaryLight, border: `1.5px solid ${C.primary}`, borderRadius: 14, padding: '11px 8px', fontSize: 12, fontWeight: 800, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
            📝 오답 집중 퀴즈 ({wrongWords.length}개)
          </button>
        </div>
      )}
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <input placeholder="단어를 검색해보세요" value={search} onChange={(e) => { setSearch(e.target.value); setVisibleCount(40); }}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C.text, fontFamily: FONT, background: 'transparent' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['전체', '초등', '중등', '⭐ 즐겨찾기'].map((c) => (
            <button key={c} onClick={() => { setChip(c); setVisibleCount(40); }} style={{ background: chip === c ? C.primary : C.surface, border: chip === c ? 'none' : `1.5px solid ${C.border}`, borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: chip === c ? '#FFFFFF' : C.sub, cursor: 'pointer', fontFamily: FONT }}>
              {c}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, flexShrink: 0 }}>총 {list.length}개</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
        {visibleList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.sub, fontSize: 13, fontWeight: 500 }}>
            {tab === '오답노트' ? '오답 단어가 없어요! 대단해요 👏' : '단어가 없어요'}
          </div>
        )}
        {visibleList.map((w, i) => {
          const key = cleanWord(w).toLowerCase();
          const isWrong = wrongWords.some((x) => cleanWord(x).toLowerCase() === key);
          const isCustom = customSet.has(key) || Boolean(w.isCustom) || w.category === '나만의 단어';
          return (
            <div key={key + i} style={{ background: C.surface, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => speak(cleanWord(w), rate)} style={{ width: 38, height: 38, borderRadius: 12, background: C.primaryLight, border: 'none', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>🔊</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{cleanWord(w)}</span>
                  {isCustom && <Pill bg={C.amberBg} color={C.amber} style={{ padding: '2px 8px', fontSize: 10 }}>나만의 단어</Pill>}
                  {isWrong && <Pill bg="#FEEDF0" color={C.red} style={{ padding: '2px 8px', fontSize: 10 }}>오답</Pill>}
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  {wordMeaning(w)}{w.phonics ? ` [${w.phonics}]` : ''}{(w.category || w.grade_level) ? ` · ${w.category || w.grade_level}` : ''}
                </div>
              </div>
              {isCustom && onDeleteCustomWord && (
                <button onClick={() => onDeleteCustomWord(w.id ?? cleanWord(w))} style={{ background: '#FEEDF0', border: '1px solid #FCA5A5', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: C.red, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                  🗑️ 삭제
                </button>
              )}
              {isWrong && onRemoveWrong && (
                <button onClick={() => onRemoveWrong(w)} style={{ background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800, color: C.greenDeep, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>
                  ✅ 마스터
                </button>
              )}
              <span onClick={() => toggleFav(cleanWord(w))} style={{ fontSize: 18, cursor: 'pointer', filter: favSet.has(key) ? 'none' : 'grayscale(1) opacity(0.45)' }}>⭐</span>
            </div>
          );
        })}
        {visibleList.length < list.length && (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setVisibleCount((c) => c + 40)}
              style={{ flex: 1, background: C.primaryLight, border: 'none', borderRadius: 14, padding: '12px 0', fontSize: 13, fontWeight: 800, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
              더보기 ({visibleList.length} / {list.length}) ↓
            </button>
            <button onClick={() => setVisibleCount(list.length)}
              style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '12px 14px', fontSize: 12, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>
              전체 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ 06 달력 (보충 학습 흐름 포함) ═══
function CalendarScreen({ go, user, stamps, pool = [], onRestudy, startMakeup, rate }) {
  const now = new Date();
  const [ym, setYm] = useState([now.getFullYear(), now.getMonth()]);
  const [sel, setSel] = useState(null); // 'YYYY-MM-DD'
  const [selWords, setSelWords] = useState([]);
  const [selLoading, setSelLoading] = useState(false);
  const [year, month] = ym;
  const firstDow = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const todayStr = localDateStr();
  const key = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const monthCount = stamps.filter((s) => s.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length;

  const clickDay = async (d) => {
    const k = key(d);
    setSel(k);
    if (stamps.includes(k)) {
      setSelLoading(true);
      setSelWords(await fetchWordsOfDate(user, k, pool));
      setSelLoading(false);
    } else {
      setSelWords([]);
    }
  };
  const move = (dir) => {
    setSel(null);
    setYm(([y, m]) => (m + dir < 0 ? [y - 1, 11] : m + dir > 11 ? [y + 1, 0] : [y, m + dir]));
  };
  const selState = sel
    ? stamps.includes(sel) ? 'done' : sel === todayStr ? 'today' : sel < todayStr ? 'missed' : 'future'
    : null;
  const selDay = sel ? parseInt(sel.split('-')[2], 10) : null;
  const selMonth = sel ? parseInt(sel.split('-')[1], 10) : null;

  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>학습 달력 📅</div>
        <Pill bg={C.amberBg} color={C.amber} style={{ fontSize: 12 }}>🔥 이번 달 {monthCount}일 완료</Pill>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: '20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span onClick={() => move(-1)} style={{ fontSize: 15, color: C.sub, cursor: 'pointer', padding: '0 10px' }}>‹</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: C.text }}>{year}년 {month + 1}월</span>
          <span onClick={() => move(1)} style={{ fontSize: 15, color: C.sub, cursor: 'pointer', padding: '0 10px' }}>›</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#E85D75' : i === 6 ? '#5B8DEF' : C.sub, padding: '6px 0' }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} />;
            const k = key(d);
            const dChecked = stamps.includes(k);
            const dToday = k === todayStr;
            const dMissed = !dChecked && !dToday && k < todayStr;
            const isSel = sel === k;
            return (
              <div key={i} onClick={() => clickDay(d)}
                style={{ padding: '5px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 46, cursor: 'pointer', borderRadius: 12, background: isSel ? '#EFF6FF' : 'transparent', border: isSel ? `2px solid ${C.primary}` : '2px solid transparent', boxSizing: 'border-box', transition: 'all 0.15s ease' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: dToday ? C.primary : dChecked ? C.greenBg : dMissed ? '#FEF3C7' : 'transparent', color: dToday ? '#FFFFFF' : dChecked ? C.greenDeep : dMissed ? '#B45309' : C.text, fontSize: 13, fontWeight: dToday || dChecked || dMissed ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {d}
                </div>
                {dChecked && <span style={{ fontSize: 9, color: C.greenDeep, fontWeight: 900 }}>✓</span>}
                {dToday && !dChecked && <span style={{ fontSize: 8, fontWeight: 900, color: C.primary }}>오늘</span>}
                {dMissed && <span style={{ fontSize: 8, fontWeight: 900, color: '#D97706', background: '#FEF3C7', padding: '1px 3px', borderRadius: 4 }}>보충</span>}
              </div>
            );
          })}
        </div>
      </div>

      {sel && (
        <div style={{ background: C.surface, borderRadius: 24, padding: 18, display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 16, border: selState === 'missed' ? '1.5px solid #FCD34D' : `1px solid ${C.border}` }}>
          {selState === 'missed' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{selMonth}월 {selDay}일 · 빠진 학습</div>
                  <div style={{ fontSize: 12, color: '#D97706', fontWeight: 700, marginTop: 2 }}>지금 보충 학습하고 출석 도장(✓)을 채워요!</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startMakeup(sel, 'flashcard')}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
                  🔥 빠진 단어 학습하기
                </button>
                <button onClick={() => startMakeup(sel, 'quiz')}
                  style={{ flex: 1, background: C.primaryLight, border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 13.5, fontWeight: 800, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
                  📝 퀴즈 바로 풀기
                </button>
              </div>
            </>
          )}
          {selState === 'done' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{selMonth}월 {selDay}일 · 학습 완료</div>
                    <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{selLoading ? '단어 불러오는 중…' : `${selWords.length}개 단어 학습 · 출석 도장 완료`}</div>
                  </div>
                </div>
                <span onClick={() => setSel(null)} style={{ fontSize: 12, fontWeight: 700, color: C.sub, cursor: 'pointer', background: C.input, borderRadius: 8, padding: '4px 9px' }}>✕</span>
              </div>
              {!selLoading && selWords.length > 0 && (
                <>
                  <div className="msv2-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {selWords.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.input, borderRadius: 14, padding: '9px 14px' }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{(w.word || '').replace(/\.png/gi, '')}</span>
                          <span style={{ fontSize: 12, color: C.sub, marginLeft: 8 }}>{w.meaning}</span>
                        </div>
                        <button onClick={() => speak((w.word || '').replace(/\.png/gi, ''), rate)} style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 10, padding: '5px 9px', fontSize: 12, cursor: 'pointer' }}>🔊</button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => onRestudy(selWords)} style={{ background: C.primaryLight, border: 'none', borderRadius: 14, padding: '12px 0', fontSize: 14, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
                    📘 이 날 단어 다시 복습하기
                  </button>
                </>
              )}
            </>
          )}
          {selState === 'today' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏳</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{selMonth}월 {selDay}일 · 오늘 학습</div>
                  <div style={{ fontSize: 12, color: C.primary, fontWeight: 700, marginTop: 2 }}>오늘 단어를 학습하고 출석 도장을 받으세요!</div>
                </div>
              </div>
              <button onClick={() => go('flashcard')} style={{ background: C.primary, border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
                오늘의 학습 시작하기 →
              </button>
            </>
          )}
          {selState === 'future' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{selMonth}월 {selDay}일 · 예정된 학습</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>그날이 되면 새 단어가 열려요.</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ 07 통계·랭킹 ═══
function StatsScreen({ user, learnedTotal, repeatCount = 0, stamps, lastScore, streak }) {
  const weekBars = (() => {
    const bars = [];
    const now = new Date();
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const k = localDateStr(d);
      bars.push([['월', '화', '수', '목', '금', '토', '일'][i], stamps.includes(k), k === localDateStr()]);
    }
    return bars;
  })();
  const first = (user?.name || '상학').replace(/^이|^김|^박/, '');
  const rank = [
    ['🥇', '서', '서연', 486, false],
    ['🥈', first.slice(0, 1), `${first} (나)`, 452, true],
    ['🥉', '민', '민준', 430, false],
    ['4', '지', '지우', 402, false],
  ];
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>나의 학습 리포트 📊</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[[`${learnedTotal.toLocaleString()}`, repeatCount > 1 ? `배운 단어 (${repeatCount}회 완료)` : '배운 단어', C.primaryLight, C.primaryDeep], [lastScore !== null ? `${lastScore}점` : '—', '최근 퀴즈', C.greenBg, C.greenDeep], [`${streak}일`, '연속 학습', C.amberBg, C.amber]].map(([num, label, bg, color]) => (
          <div key={label} style={{ background: bg, borderRadius: 18, padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 21, fontWeight: 900, color }}>{num}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>이번 주 출석</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>💮 {weekBars.filter((b) => b[1]).length}일 완료</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 110, gap: 8 }}>
          {weekBars.map(([day, stamped, isToday]) => (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', maxWidth: 30, height: stamped ? 90 : 18, background: stamped ? C.primary : C.primaryLight, borderRadius: 8, transition: 'height 0.3s' }} />
              <span style={{ fontSize: 11, fontWeight: isToday ? 900 : 500, color: isToday ? C.primary : C.sub }}>{day}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>🏆 이번 주 랭킹</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.sub }}>데모 순위</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rank.map(([medal, initial, name, count, me]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 16, background: me ? C.primaryLight : 'transparent', border: me ? `2px solid ${C.primary}` : '2px solid transparent' }}>
              <span style={{ fontSize: String(medal).length > 1 ? 13 : 18, fontWeight: 700, color: C.sub, width: 22, textAlign: 'center' }}>{medal}</span>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: me ? C.primary : '#E8EAF2', color: me ? '#FFFFFF' : C.sub, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initial}</div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: me ? 900 : 500, color: C.text }}>{name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: me ? C.primaryDeep : C.sub }}>{count}단어</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ 08 학부모 ═══
function ParentScreen({ user, done, total, stamps, learnedTotal }) {
  const [toggles, setToggles] = useState([true, true, false]);
  const flip = (i) => setToggles((t) => t.map((v, j) => (j === i ? !v : v)));
  const first = (user?.name || '자녀').replace(/^이|^김|^박/, '');
  const pct = total ? Math.round((done / total) * 100) : 0;
  const acts = [
    ['✅', C.greenBg, `오늘 플래시카드 ${done}단어`, done > 0 ? '지금 학습 진행 중이에요' : '아직 오늘 학습 전이에요'],
    ['📚', C.primaryLight, `누적 학습 ${learnedTotal.toLocaleString()}단어`, '전체 기간 합계'],
    ['💮', C.amberBg, `출석 ${stamps.length}일`, '지금까지 받은 도장'],
  ];
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>학부모 대시보드</div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>자녀의 학습을 한눈에 확인하세요</div>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.amberBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧒</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{first} · {user?.level || '중등단어'} 과정</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>오늘 {done}단어 학습</div>
          </div>
          <Pill bg={C.greenBg} color={C.greenDeep} style={{ fontSize: 11, padding: '6px 10px' }}>● 학습 중</Pill>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>오늘 목표 진행률</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.primaryDeep }}>{pct}%</span>
          </div>
          <div style={{ height: 10, background: '#ECEDF4', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: C.primary, borderRadius: 999 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[[`${done}/${total}`, '오늘 단어'], [`${stamps.length}일`, '총 출석'], [`${learnedTotal.toLocaleString()}`, '누적 단어']].map(([num, label]) => (
          <div key={label} style={{ background: C.surface, borderRadius: 18, padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{num}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.sub, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 14 }}>학습 현황</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {acts.map(([icon, bg, title, sub]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{title}</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 14 }}>알림 설정</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['학습 완료 시 알림 받기', '3일 이상 미학습 시 알림', '주간 리포트 이메일'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{label}</span>
              <button onClick={() => flip(i)} style={{ width: 48, height: 28, borderRadius: 999, border: 'none', background: toggles[i] ? C.primary : '#D8DAE5', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', top: 3, left: toggles[i] ? 23 : 3, width: 22, height: 22, borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══ 09 내정보 ═══
function ProfileScreen({ user, onSaveProfile, onLogout, learnedTotal, stamps, go, wordsTotal }) {
  const [editing, setEditing] = useState(false);
  const [level, setLevel] = useState(user?.level || '중등단어');
  const [daily, setDaily] = useState(String(user?.daily || 20));
  const [saved, setSaved] = useState(false);
  const save = async () => {
    await onSaveProfile({ level, daily: parseInt(daily, 10) });
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 13 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>내 정보 👤</div>
      {saved && (
        <div style={{ background: C.greenBg, borderRadius: 14, padding: '11px 14px', fontSize: 13, fontWeight: 700, color: C.greenDeep, textAlign: 'center' }}>
          ✨ 학습 설정이 저장되었어요! 새 단어 세트에 바로 적용됩니다.
        </div>
      )}
      <div style={{ background: C.surface, borderRadius: 24, padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🧑‍🎓</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{user?.name || '학생'}</span>
            {user?.guest && <Pill bg={C.input} color={C.sub} style={{ padding: '2px 8px', fontSize: 10 }}>게스트</Pill>}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.primaryDeep, marginTop: 3 }}>🎯 {user?.level} · 목표 {user?.daily}단어/일</div>
        </div>
      </div>
      {!editing ? (
        <div style={{ background: C.surface, borderRadius: 24, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['📚 학습 과정', user?.level || '중등단어', C.text], ['⚡ 하루 목표', `${user?.daily || 20}단어`, C.primaryDeep], ['🔒 내 PIN 번호', '● ● ● ●', C.sub], ['📈 누적 학습', `${learnedTotal.toLocaleString()}단어`, C.text], ['💮 총 출석', `${stamps.length}일`, C.greenDeep]].map(([label, val, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.sub }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color }}>{val}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: C.surface, borderRadius: 24, padding: 18, display: 'flex', flexDirection: 'column', gap: 12, border: `2px solid ${C.primary}` }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>학습 과정</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {['초등단어', '중등단어', '고등단어', '전체'].map((l) => (
              <button key={l} onClick={() => setLevel(l)} style={{ padding: '11px 0', borderRadius: 12, border: level === l ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: level === l ? C.primaryLight : C.input, fontSize: 12.5, fontWeight: level === l ? 900 : 500, color: level === l ? C.primaryDeep : C.sub, cursor: 'pointer', fontFamily: FONT }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>하루 목표 단어 수</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {['10', '20', '30', '50'].map((n) => (
              <button key={n} onClick={() => setDaily(n)} style={{ padding: '11px 0', borderRadius: 12, border: daily === n ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: daily === n ? C.primaryLight : C.input, fontSize: 13, fontWeight: daily === n ? 900 : 500, color: daily === n ? C.primaryDeep : C.sub, cursor: 'pointer', fontFamily: FONT }}>
                {n}개
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} style={{ flex: 1, background: C.green, border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>💾 저장</button>
            <button onClick={() => setEditing(false)} style={{ padding: '13px 18px', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 14, fontSize: 13, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>취소</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: C.primaryLight, borderRadius: 18, padding: '15px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 21, fontWeight: 900, color: C.primaryDeep }}>{wordsTotal}개</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primaryDeep }}>오늘 단어</div>
        </div>
        <div style={{ flex: 1, background: C.greenBg, borderRadius: 18, padding: '15px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 21, fontWeight: 900, color: C.greenDeep }}>{stamps.length}일</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.greenDeep }}>출석 도장</div>
        </div>
      </div>
      {!editing && (
        <button onClick={() => setEditing(true)} style={{ background: C.primary, border: 'none', borderRadius: 18, padding: '15px 0', fontSize: 15, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          ✏️ 학습 설정 수정하기
        </button>
      )}
      <button onClick={() => go('parent')} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '13px 0', fontSize: 14, fontWeight: 700, color: C.text, cursor: 'pointer', fontFamily: FONT }}>
        👨‍👩‍👧 학부모 대시보드
      </button>
      <button onClick={onLogout} style={{ background: C.redBg, border: 'none', borderRadius: 18, padding: '13px 0', fontSize: 14, fontWeight: 700, color: C.red, cursor: 'pointer', fontFamily: FONT, marginBottom: 16 }}>
        🚪 로그아웃
      </button>
    </div>
  );
}

// ═══ 12 시험지 출력 (6종 유형 + 학생용 문제지 / 별도 채점용 정답지 분리) ═══
function PdfScreen({ go, user, words, pool }) {
  const [range, setRange] = useState('오늘 단어');
  const [count, setCount] = useState('20문항');
  const [mode, setMode] = useState('영→한 뜻쓰기');
  const [withAnswers, setWithAnswers] = useState(true);
  const types = [
    ['🔤', '영→한 뜻쓰기', '영단어 보고 뜻 적기'],
    ['✍️', '한→영 스펠링', '뜻 보고 영단어 쓰기'],
    ['🧩', '스펠링 빈칸', 'a _ p _ e 채우기'],
    ['📝', '예문 빈칸', '예문 속 핵심 단어 채우기'],
    ['🗂️', '휴대용 깜빡이장', 'A4 2열 암기 워크시트'],
    ['💮', '채점용 정답지', '선생님·학부모 채점용'],
  ];
  const blankify = (w) => {
    if (!w || w.length <= 2) return '_ _ _';
    return w.split('').map((c, i) => (i === 0 || i === w.length - 1 ? c : i % 2 ? '_' : c)).join(' ');
  };
  const sentenceBlank = (x) => {
    const base = x.exEn || `I learn the word '${x.word}' every day.`;
    try {
      const escaped = x.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'gi');
      if (re.test(base)) return base.replace(re, '( ________________ )');
    } catch (e) {}
    return `${base} ➔ ( ________________ )`;
  };
  const print = () => {
    const src = range === '오늘 단어' && words.length ? words : (pool.length ? pool : words);
    const n = parseInt(count, 10) || 20;
    const list = src.slice(0, n).map((w) => {
      const ex = wordExample(w);
      return {
        word: cleanWord(w),
        mean: wordMeaning(w),
        phonics: w.phonics || w.phonetic || '',
        exEn: ex.en,
        exKo: ex.ko,
      };
    }).filter((x) => x.word);
    if (!list.length) {
      if (typeof alert === 'function') alert('출제할 단어가 없어요. 홈에서 단어를 먼저 불러와 주세요.');
      return null;
    }
    const isAnswerOnly = mode === '채점용 정답지';
    const isPocket = mode === '휴대용 깜빡이장';
    const rowOf = (x) => {
      if (mode === '영→한 뜻쓰기') {
        return `<td class="q">${x.word}${x.phonics ? ` <span class="hint">${x.phonics}</span>` : ''}</td><td class="blank"></td>`;
      }
      if (mode === '한→영 스펠링') {
        return `<td class="q">${x.mean}</td><td class="blank"></td>`;
      }
      if (mode === '스펠링 빈칸') {
        return `<td class="q">${blankify(x.word)} <span class="hint">(${x.mean})</span></td><td class="blank"></td>`;
      }
      if (mode === '예문 빈칸') {
        return `<td class="q">${sentenceBlank(x)}<div class="hint">${x.exKo} (${x.mean} · 힌트: ${x.word[0] || ''}...)</div></td><td class="blank"></td>`;
      }
      if (isPocket) {
        return `<td class="q">${x.word}${x.phonics ? ` <span class="hint">${x.phonics}</span>` : ''}</td><td class="pocket-ans">${x.mean}</td>`;
      }
      return `<td class="q">${x.word}${x.phonics ? ` <span class="hint">${x.phonics}</span>` : ''}</td><td class="ans-cell">${x.mean}</td>`;
    };
    const dateLabel = new Date().toLocaleDateString('ko-KR');
    const colHeader = isPocket ? '<th>영단어</th><th>한글 뜻 (접어서 암기)</th>' : isAnswerOnly ? '<th>영단어</th><th>채점 정답 (뜻)</th>' : '<th>문제</th><th>답안 작성란 (학생용)</th>';
    const separateAnswerKey = (withAnswers && !isAnswerOnly && !isPocket)
      ? `<div class="page-break"></div>
      <section class="answer-key-sheet">
        <h1>FlipVoca 채점용 정답지 (Answer Key) — ${mode}</h1>
        <div class="meta">${user?.level || ''} · ${dateLabel} · ${list.length}문항 채점 기준표 (선생님·학부모용)</div>
        <table class="answer-table"><tr><th class="num">No</th><th>출제 단어</th><th>채점 정답</th></tr>
        ${list.map((x, i) => `<tr><td class="num">${i + 1}</td><td class="q">${x.word}${x.phonics ? ` <span class="hint">${x.phonics}</span>` : ''}</td><td class="ans-cell">${mode === '영→한 뜻쓰기' ? x.mean : `${x.word} (${x.mean})`}</td></tr>`).join('')}
        </table>
      </section>`
      : '';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>FlipVoca 시험지</title><style>
      @page { size: A4; margin: 18mm; }
      body { font-family: 'Malgun Gothic', 'Pretendard', sans-serif; color: #111; margin: 0; }
      h1 { font-size: 20px; margin: 0 0 4px; } .meta { font-size: 12px; color: #555; margin-bottom: 14px; }
      .info { display: flex; gap: 24px; border: 1.5px solid #111; padding: 8px 14px; font-size: 13px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; } td, th { border: 1px solid #999; padding: 9px 10px; font-size: 14px; }
      th { background: #f0f0f5; font-size: 12px; } .num { width: 36px; text-align: center; color: #666; }
      .q { font-weight: 700; } .blank { width: 42%; height: 22px; } .hint { font-weight: 400; color: #666; font-size: 11px; margin-top: 2px; }
      .pocket-ans { width: 45%; background: #fafafa; color: #222; font-weight: 600; border-left: 1.5px dashed #666; }
      .ans-cell { width: 45%; color: #4338ca; font-weight: 700; font-size: 13px; }
      .page-break { page-break-before: always; break-before: page; height: 1px; margin: 28px 0; }
    </style></head><body>
      <section class="student-question-sheet">
        <h1>FlipVoca 영단어 시험지 — ${mode}</h1>
        <div class="meta">${user?.level || ''} · ${dateLabel} · ${list.length}문항${withAnswers && !isAnswerOnly && !isPocket ? ' · 별도 채점용 정답지 포함' : ''}</div>
        <div class="info"><span>이름: ${user?.name || '_________'}</span><span>점수: ______ / ${list.length}</span></div>
        <table><tr><th class="num">No</th>${colHeader}</tr>
        ${list.map((x, i) => `<tr><td class="num">${i + 1}</td>${rowOf(x)}</tr>`).join('')}
        </table>
      </section>
      ${separateAnswerKey}
    </body></html>`;
    if (typeof window !== 'undefined' && typeof window.open === 'function') {
      const win = window.open('', '_blank');
      if (!win) {
        if (typeof alert === 'function') alert('팝업이 차단되어 있어요. 팝업을 허용해 주세요.');
        return html;
      }
      win.document.write(html);
      win.document.close();
      if (typeof win.focus === 'function') win.focus();
      setTimeout(() => { if (typeof win.print === 'function') win.print(); }, 300);
    }
    return html;
  };
  const chip = (label, active, onClick) => (
    <button key={label} onClick={onClick} style={{ padding: '7px 12px', borderRadius: 999, border: active ? 'none' : `1.5px solid ${C.border}`, background: active ? C.primary : C.surface, fontSize: 12, fontWeight: 700, color: active ? '#FFFFFF' : C.sub, cursor: 'pointer', fontFamily: FONT }}>
      {label}
    </button>
  );
  return (
    <div style={{ padding: '56px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {go && (
          <button onClick={() => go('home')} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 18, fontWeight: 700, color: C.text, cursor: 'pointer', flexShrink: 0 }} title="홈으로 돌아가기">←</button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>시험지 출력 📄</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>배운 단어로 A4 6종 시험지·워크시트를 출력해요</div>
        </div>
      </div>
      <div style={{ background: C.surface, borderRadius: 20, padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: C.text }}>출제 범위</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['오늘 단어', '전체'].map((r) => chip(r, range === r, () => setRange(r)))}
        </div>
        <div style={{ fontSize: 12, fontWeight: 900, color: C.text }}>문항 수</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['10문항', '20문항', '30문항', '50문항'].map((n) => chip(n, count === n, () => setCount(n)))}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>시험 유형 (6종)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {types.map(([ic, title, sub]) => {
          const active = mode === title;
          return (
            <button key={title} onClick={() => setMode(title)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 16, border: active ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: active ? C.primaryLight : C.surface, cursor: 'pointer', fontFamily: FONT }}>
              <div style={{ fontSize: 17 }}>{ic} <span style={{ fontSize: 12.5, fontWeight: 900, color: active ? C.primaryDeep : C.text }}>{title}</span></div>
              <div style={{ fontSize: 10.5, fontWeight: 500, color: C.sub, marginTop: 3 }}>{sub}</div>
            </button>
          );
        })}
      </div>
      <div onClick={() => setWithAnswers(!withAnswers)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surface, borderRadius: 16, padding: '11px 15px', cursor: 'pointer' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>✅ 별도 채점용 정답지 함께 출력 (학생 답란은 빈칸 유지)</span>
        <div style={{ width: 44, height: 26, borderRadius: 999, background: withAnswers ? C.primary : '#D8DAE5', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <span style={{ position: 'absolute', top: 3, left: withAnswers ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {go && (
          <button onClick={() => go('home')} style={{ padding: '15px 16px', background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, fontSize: 14, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT }}>
            🏠 홈으로
          </button>
        )}
        <button onClick={print} style={{ flex: 1, background: C.primary, border: 'none', borderRadius: 18, padding: '15px 0', fontSize: 15, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          🖨️ PDF 시험지 만들기
        </button>
      </div>
      <div style={{ fontSize: 11, color: C.sub, textAlign: 'center' }}>A4 규격 · 학생용 문제지와 채점용 정답지 자동 분리 출력</div>
    </div>
  );
}

// ═══ 루트 ═══
export default function Msv2Page() {
  const [screen, setScreen] = useState('login');
  const [scale, setScale] = useState(1);
  const [user, setUser] = useState(null);
  const [words, setWords] = useState([]);
  const [pool, setPool] = useState([]);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [idx, setIdx] = useState(0);
  const [doneSet, setDoneSet] = useState(new Set());
  const [stamps, setStamps] = useState([]);
  const [learnedTotal, setLearnedTotal] = useState(0);
  const [repeatCount, setRepeatCount] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [wrongWords, setWrongWords] = useState([]);
  const [favs, setFavs] = useState([]);
  const [customWords, setCustomWords] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [quizKey, setQuizKey] = useState(0);
  const [quizLevel, setQuizLevel] = useState(1);
  const [wordbookTab, setWordbookTab] = useState(null);
  const [makeupDate, setMakeupDate] = useState(null); // 보충 학습 대상 날짜 'YYYY-MM-DD'
  const [isWrongReview, setIsWrongReview] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [completedQuizLevels, setCompletedQuizLevels] = useState([]);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [studyRound, setStudyRound] = useState(1);
  const [todayAllLearned, setTodayAllLearned] = useState([]);
  const [userRecordings, setUserRecordings] = useState({});
  const [wordsLoadError, setWordsLoadError] = useState(false);
  const [usedFallbackWords, setUsedFallbackWords] = useState(false);
  const isSpecialDeckRef = useRef(false);
  const savedDatesRef = useRef(new Set());
  const learnedWordsSetRef = useRef(new Set());
  const originalDailyWordsRef = useRef([]);
  const originalDailyDoneSetRef = useRef(new Set());
  const originalDailyIdxRef = useRef(0);

  const saveDailyProgress = useCallback((uid, dateStr, patch) => {
    if (!uid || !dateStr) return;
    try {
      const key = `msv2_progress_${uid}_${dateStr}`;
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...prev, ...patch }));
    } catch (e) {}
  }, []);

  const mergeCumulativeWordsForDate = useCallback((uid, dateStr, extraWords = []) => {
    if (!uid || !dateStr) return extraWords || [];
    const merged = [];
    const seen = new Set();
    const pushItem = (item) => {
      if (!item) return;
      const wText = cleanWord(item).trim();
      const wKey = wText.toLowerCase();
      if (!wKey || seen.has(wKey)) return;
      seen.add(wKey);
      merged.push({
        ...item,
        word: wText,
        meaning: wordMeaning(item),
      });
    };
    const keys = [
      `today_all_learned_${uid}_${dateStr}`,
      `stamped_words_${uid}_${dateStr}`,
    ];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) arr.forEach(pushItem);
      } catch (e) {}
    }
    if (Array.isArray(extraWords)) extraWords.forEach(pushItem);
    try {
      if (merged.length > 0) {
        const json = JSON.stringify(merged);
        localStorage.setItem(`today_all_learned_${uid}_${dateStr}`, json);
        localStorage.setItem(`stamped_words_${uid}_${dateStr}`, json);
      }
    } catch (e) {}
    return merged;
  }, []);

  const restoreDailySet = useCallback(() => {
    let restored = originalDailyWordsRef.current;
    if ((!restored || !restored.length) && user) {
      try {
        const today = localDateStr();
        const cached = localStorage.getItem(`daily_random_set_${user.id}_${today}`) || localStorage.getItem(`daily_set_${user.id}_${today}`);
        if (cached) restored = JSON.parse(cached);
      } catch (e) {}
    }
    if (restored && restored.length > 0) {
      originalDailyWordsRef.current = restored;
      setWords(restored);
      setDoneSet(new Set(originalDailyDoneSetRef.current));
      setIdx(originalDailyIdxRef.current);
    }
  }, [user]);

  const exitWrongReview = useCallback(() => {
    setIsWrongReview(false);
    isSpecialDeckRef.current = false;
    restoreDailySet();
  }, [restoreDailySet]);

  const exitMakeup = useCallback(() => {
    setMakeupDate(null);
    isSpecialDeckRef.current = false;
    restoreDailySet();
  }, [restoreDailySet]);

  const getWordsForMakeupDate = useCallback((dateKey) => {
    const uid = user?.id || 'guest';
    try {
      const saved = localStorage.getItem(`daily_set_${uid}_${dateKey}`) || localStorage.getItem(`daily_random_set_${uid}_${dateKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const count = parseInt(user?.daily || 20, 10) || 20;
    const srcPool = (pool && pool.length >= count) ? pool : (originalDailyWordsRef.current.length ? originalDailyWordsRef.current : words);
    if (!srcPool || !srcPool.length) return [];
    const seed = parseInt(String(dateKey || '').replace(/-/g, ''), 10) || 1;
    const maxOffset = Math.max(1, srcPool.length - count);
    const startIdx = maxOffset > 1 ? ((seed * 11) % (maxOffset - 1)) + 1 : 0;
    const selected = srcPool.slice(startIdx, startIdx + count);
    try {
      if (selected.length) {
        localStorage.setItem(`daily_set_${uid}_${dateKey}`, JSON.stringify(selected));
        localStorage.setItem(`daily_random_set_${uid}_${dateKey}`, JSON.stringify(selected));
      }
    } catch (e) {}
    return selected;
  }, [user, pool, words]);

  const persistWrongWords = (uid, list) => {
    if (!uid) return;
    try {
      const json = JSON.stringify(list);
      localStorage.setItem(`english_wrong_words_${uid}`, json);
      localStorage.setItem(`msv2_wrong_${uid}`, json);
    } catch (e) {}
  };

  const loadWrongWordsFromStorage = (uid) => {
    if (!uid) return [];
    const merged = [];
    const seen = new Set();
    const keys = [
      `english_wrong_words_${uid}`,
      `msv2_wrong_${uid}`,
      `wrong_answers_${uid}`,
      `wrong_words_${uid}`,
    ];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
          const wKey = cleanWord(item).toLowerCase();
          if (!wKey || seen.has(wKey)) continue;
          seen.add(wKey);
          merged.push({
            ...item,
            word: cleanWord(item),
            meaning: wordMeaning(item),
            category: item.category || item.grade_level,
          });
        }
      } catch (e) {}
    }
    if (merged.length > 0) {
      persistWrongWords(uid, merged);
    }
    return merged;
  };

  const persistCustomWords = (uid, list) => {
    if (!uid) return;
    try {
      const json = JSON.stringify(list);
      localStorage.setItem(`my_vocab_${uid}`, json);
      localStorage.setItem(`msv2_custom_${uid}`, json);
    } catch (e) {}
  };

  const loadCustomWordsFromStorage = (uid) => {
    if (!uid) return [];
    const merged = [];
    const seen = new Set();
    const keys = [`my_vocab_${uid}`, `msv2_custom_${uid}`];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) continue;
        for (const item of arr) {
          const wText = cleanWord(item).trim();
          const wKey = wText.toLowerCase();
          if (!wKey || seen.has(wKey)) continue;
          seen.add(wKey);
          merged.push({
            id: item.id || Date.now() + merged.length,
            word: wText,
            meaning: wordMeaning(item).trim(),
            phonics: item.phonics || item.pronunciation || '',
            category: '나만의 단어',
            isCustom: true,
            addedAt: item.addedAt || new Date().toISOString(),
          });
        }
      } catch (e) {}
    }
    if (merged.length > 0) {
      persistCustomWords(uid, merged);
    }
    return merged;
  };

  const go = (target) => {
    if (target === 'wordbook:wrong') {
      if (isWrongReview) exitWrongReview();
      setWordbookTab('오답노트');
      setScreen('wordbook');
      return;
    }
    if (target === 'wordbook') setWordbookTab(null);
    if (target === 'quiz') setQuizLevel(1);
    if (target !== 'flashcard' && target !== 'quiz' && target !== 'quizdone' && isWrongReview) {
      exitWrongReview();
    }
    if (target !== 'flashcard' && target !== 'quiz' && target !== 'quizdone') {
      if (makeupDate || isSpecialDeckRef.current) {
        exitMakeup();
      }
    }
    setScreen(target);
  };

  const loadAll = useCallback(async (u, forceNewSet = false) => {
    setWordsLoading(true);
    setWordsLoadError(false);
    const uid = u?.id;
    const today = localDateStr();
    const dailyCount = parseInt(u?.daily || 20, 10) || 20;
    const [{ words: fetchedWords, pool: pl, learnedCount, learnedWords, usedFallback, loadError }, st] = await Promise.all([
      loadWordsForUser(u),
      fetchStamps(u),
    ]);
    let ws = fetchedWords || [];
    if (!forceNewSet && uid) {
      try {
        const cached = localStorage.getItem(`daily_random_set_${uid}_${today}`) || localStorage.getItem(`daily_set_${uid}_${today}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0 && (!ws.length || parsed.length === dailyCount)) {
            ws = parsed;
          }
        }
      } catch (e) {}
    }
    let restoredDoneSet = new Set();
    let restoredIdx = 0;
    let restoredQuizLevels = [];
    let restoredHasRecorded = false;
    let restoredStudyRound = 1;
    let localStamps = [];
    let cumulativeToday = ws || [];
    if (uid) {
      try {
        if (ws && ws.length) {
          localStorage.setItem(`daily_set_${uid}_${today}`, JSON.stringify(ws));
          localStorage.setItem(`daily_random_set_${uid}_${today}`, JSON.stringify(ws));
        }
        cumulativeToday = mergeCumulativeWordsForDate(uid, today, ws);
        const prog = JSON.parse(localStorage.getItem(`msv2_progress_${uid}_${today}`) || '{}');
        const maxLen = ws.length || dailyCount;
        if (Array.isArray(prog.doneIndices)) {
          restoredDoneSet = new Set(prog.doneIndices.filter((i) => typeof i === 'number' && i >= 0 && i < maxLen));
        }
        if (typeof prog.idx === 'number' && prog.idx >= 0 && prog.idx < maxLen) {
          restoredIdx = prog.idx;
        }
        if (typeof prog.studyRound === 'number' && prog.studyRound >= 1) {
          restoredStudyRound = prog.studyRound;
        }
        const qMission = JSON.parse(localStorage.getItem(`quiz_mission_${uid}_${today}`) || 'null');
        if (Array.isArray(qMission)) restoredQuizLevels = qMission;
        else if (Array.isArray(prog.completedQuizLevels)) restoredQuizLevels = prog.completedQuizLevels;
        restoredHasRecorded = localStorage.getItem(`record_mission_${uid}_${today}`) === 'true' || Boolean(prog.hasRecorded);
        const ls = JSON.parse(localStorage.getItem(`english_stamps_${uid}`) || '[]');
        if (Array.isArray(ls)) localStamps = ls;
      } catch (e) {}
    }
    const mergedStamps = Array.from(new Set([...(st || []), ...localStamps]));
    originalDailyWordsRef.current = ws || [];
    originalDailyDoneSetRef.current = new Set(restoredDoneSet);
    originalDailyIdxRef.current = restoredIdx;
    savedDatesRef.current = new Set();
    learnedWordsSetRef.current = new Set((learnedWords || []).map((w) => String(w).toLowerCase().trim()).filter(Boolean));
    isSpecialDeckRef.current = false;
    setIsWrongReview(false);
    setMakeupDate(null);
    setSaveError(null);
    setRepeatCount(0);
    setStudyRound(restoredStudyRound);
    setTodayAllLearned(cumulativeToday);
    setCompletedQuizLevels(restoredQuizLevels);
    setHasRecorded(restoredHasRecorded);
    setWordsLoadError(Boolean(loadError));
    setUsedFallbackWords(Boolean(usedFallback));
    setWords(ws);
    setPool(pl);
    setLearnedTotal(learnedCount);
    setStamps(mergedStamps);
    setIdx(restoredIdx);
    setDoneSet(restoredDoneSet);
    setWordsLoading(false);
  }, [mergeCumulativeWordsForDate]);

  const applyFallbackWords = useCallback(() => {
    const lv = user?.level || '중등단어';
    const cnt = parseInt(user?.daily || 20, 10) || 20;
    const fbWords = getFallbackWordsForLevel(lv, cnt);
    originalDailyWordsRef.current = fbWords;
    originalDailyDoneSetRef.current = new Set();
    originalDailyIdxRef.current = 0;
    setWords(fbWords);
    setPool(FALLBACK_WORDS);
    setUsedFallbackWords(true);
    setWordsLoadError(false);
    setWordsLoading(false);
    setIdx(0);
    setDoneSet(new Set());
  }, [user]);

  const handleLogin = useCallback((u) => {
    setUser(u);
    setWrongWords([]);
    setFavs([]);
    setCustomWords([]);
    setUserRecordings({});
    setDoneSet(new Set());
    setIdx(0);
    setStudyRound(1);
    setTodayAllLearned([]);
    setCompletedQuizLevels([]);
    setHasRecorded(false);
    setQuizResult(null);
    try {
      setWrongWords(loadWrongWordsFromStorage(u.id));
      setFavs(JSON.parse(localStorage.getItem(`msv2_fav_${u.id}`) || '[]'));
      setCustomWords(loadCustomWordsFromStorage(u.id));
    } catch (e) {}
    loadAll(u);
  }, [loadAll]);

  useEffect(() => {
    initAudioUnlock();
    const fit = () => setScale(Math.min(1, (window.innerHeight - 24) / 844, (window.innerWidth - 16) / 390));
    fit();
    window.addEventListener('resize', fit);
    const savedSession = readStudentSession();
    if (savedSession) {
      const uid = savedSession.student_id || savedSession.id;
      const found = STUDENTS.find((s) => s.id === uid || s.name === savedSession.name);
      const restoredUser = {
        ...(found || {}),
        id: uid,
        student_id: uid,
        name: savedSession.name,
        level: savedSession.studyGradeLevel || savedSession.study_grade_level || savedSession.level || found?.level || '중등단어',
        daily: parseInt(savedSession.dailyWordCount || savedSession.daily_word_count || savedSession.daily || found?.daily || 20, 10) || 20,
        guest: found ? false : Boolean(savedSession.guest),
      };
      handleLogin(restoredUser);
      setScreen('home');
    }
    return () => window.removeEventListener('resize', fit);
  }, [handleLogin]);

  const toggleWrong = (w, forceAdd) => {
    if (!w) return;
    setWrongWords((prev) => {
      const key = cleanWord(w).toLowerCase();
      if (!key) return prev;
      const exists = prev.some((x) => cleanWord(x).toLowerCase() === key);
      let next;
      if (exists && !forceAdd) next = prev.filter((x) => cleanWord(x).toLowerCase() !== key);
      else if (exists) next = prev;
      else next = [{ ...w, word: cleanWord(w), meaning: wordMeaning(w), category: w.category || w.grade_level }, ...prev];
      if (user?.id) persistWrongWords(user.id, next);
      return next;
    });
  };
  const removeWrongWord = (w) => {
    if (!w) return;
    const key = cleanWord(w).toLowerCase();
    if (!key) return;
    setWrongWords((prev) => {
      const next = prev.filter((x) => cleanWord(x).toLowerCase() !== key);
      if (user?.id) persistWrongWords(user.id, next);
      return next;
    });
    if (isWrongReview) {
      const remaining = words.filter((x) => cleanWord(x).toLowerCase() !== key);
      if (remaining.length === 0) {
        exitWrongReview();
        setScreen('home');
      } else {
        setWords(remaining);
        setIdx((prevIdx) => Math.min(prevIdx, remaining.length - 1));
      }
    }
  };
  const toggleFav = (word) => {
    setFavs((prev) => {
      const k = word.toLowerCase();
      const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
      try { if (user) localStorage.setItem(`msv2_fav_${user.id}`, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  const addCustomWord = ({ word, meaning, phonics }) => {
    const wText = String(word || '').trim();
    const mText = String(meaning || '').trim();
    const pText = String(phonics || '').trim();
    if (!wText || !mText) return;
    const wKey = wText.toLowerCase();
    setCustomWords((prev) => {
      const filtered = prev.filter((x) => cleanWord(x).toLowerCase() !== wKey);
      const entry = {
        id: Date.now(),
        word: wText,
        meaning: mText,
        phonics: pText,
        category: '나만의 단어',
        isCustom: true,
        addedAt: new Date().toISOString(),
      };
      const next = [entry, ...filtered];
      if (user?.id) persistCustomWords(user.id, next);
      return next;
    });
  };
  const deleteCustomWord = (idOrWord) => {
    if (idOrWord === undefined || idOrWord === null) return;
    setCustomWords((prev) => {
      const targetStr = String(idOrWord).toLowerCase().trim();
      const next = prev.filter((x) => x.id !== idOrWord && cleanWord(x).toLowerCase() !== targetStr);
      if (user?.id) persistCustomWords(user.id, next);
      return next;
    });
  };
  const markDone = (i) => setDoneSet((p) => {
    const next = new Set([...p, i]);
    if (!isWrongReview && !makeupDate && !isSpecialDeckRef.current) {
      originalDailyDoneSetRef.current = next;
      if (user?.id) saveDailyProgress(user.id, localDateStr(), { doneIndices: Array.from(next) });
    }
    return next;
  });
  const cycleRate = () => setRate((r) => (r === 1.0 ? 1.25 : r === 1.25 ? 0.75 : 1.0));

  // 고유 학습 단어 저장 및 카운트 갱신 헬퍼 (중복 DB 저장 및 learnedTotal 부풀림 방지)
  const persistLearnedSet = async (targetWords, dateKey, makeupDateArg) => {
    if (!user || !targetWords?.length) return true;
    const seenInBatch = new Set();
    const unlearned = targetWords.filter((w) => {
      const k = cleanWord(w).toLowerCase();
      if (!k || seenInBatch.has(k) || learnedWordsSetRef.current.has(k)) return false;
      seenInBatch.add(k);
      return true;
    });
    const alreadySavedForDate = savedDatesRef.current.has(dateKey);
    const wordsToSave = !alreadySavedForDate ? targetWords : unlearned;
    if (wordsToSave.length > 0) {
      const ok = await saveLearnedWords(user, wordsToSave, makeupDateArg);
      if (ok === false) return false;
    }
    savedDatesRef.current.add(dateKey);
    if (unlearned.length > 0) {
      unlearned.forEach((w) => {
        const k = cleanWord(w).toLowerCase();
        if (k) learnedWordsSetRef.current.add(k);
      });
      setLearnedTotal((n) => n + unlearned.length);
    }
    if (user?.id && dateKey) {
      const cum = mergeCumulativeWordsForDate(user.id, dateKey, targetWords);
      if (dateKey === localDateStr()) setTodayAllLearned(cum);
    }
    return true;
  };

  // 다음 회차(Round 2+) 미학습 단어 세트 배정 및 당일 누적 학습 기록 보존
  const startNextRound = async () => {
    const uid = user?.id;
    const today = localDateStr();
    const dailyCount = parseInt(user?.daily || 20, 10) || 20;

    if (user && words.length && !isWrongReview && !makeupDate) {
      await persistLearnedSet(words, today, null);
    }

    const excluded = new Set([...learnedWordsSetRef.current]);
    todayAllLearned.forEach((w) => {
      const k = cleanWord(w).toLowerCase();
      if (k) excluded.add(k);
    });
    words.forEach((w) => {
      const k = cleanWord(w).toLowerCase();
      if (k) excluded.add(k);
    });

    const srcPool = (pool && pool.length) ? pool : words;
    const unlearnedPool = srcPool.filter((w) => {
      const k = cleanWord(w).toLowerCase();
      return k && !excluded.has(k);
    });

    let nextSet = unlearnedPool.slice(0, dailyCount);
    if (nextSet.length < dailyCount && srcPool.length > 0) {
      const pickedKeys = new Set(nextSet.map((w) => cleanWord(w).toLowerCase()));
      for (const w of srcPool) {
        if (nextSet.length >= dailyCount) break;
        const k = cleanWord(w).toLowerCase();
        if (k && !pickedKeys.has(k)) {
          pickedKeys.add(k);
          nextSet.push(w);
        }
      }
    }
    if (!nextSet.length) return;

    const nextRound = studyRound + 1;
    setStudyRound(nextRound);
    isSpecialDeckRef.current = false;
    setIsWrongReview(false);
    setMakeupDate(null);
    savedDatesRef.current.delete(today);
    originalDailyWordsRef.current = nextSet;
    originalDailyDoneSetRef.current = new Set();
    originalDailyIdxRef.current = 0;
    setWords(nextSet);
    setIdx(0);
    setDoneSet(new Set());

    if (uid) {
      try {
        const json = JSON.stringify(nextSet);
        localStorage.setItem(`daily_set_${uid}_${today}`, json);
        localStorage.setItem(`daily_random_set_${uid}_${today}`, json);
        localStorage.setItem(`learned_words_${uid}`, JSON.stringify(Array.from(learnedWordsSetRef.current)));
      } catch (e) {}
      const cum = mergeCumulativeWordsForDate(uid, today, [...words, ...nextSet]);
      setTodayAllLearned(cum);
      saveDailyProgress(uid, today, { studyRound: nextRound, doneIndices: [], idx: 0 });
    }
    setScreen('flashcard');
  };

  // 세트 완주 → 학습 기록 DB 저장 → 퀴즈로 (오답 복습 완주 시 원래 단어 복귀 후 홈으로)
  const onFinishSet = async () => {
    if (isWrongReview) {
      exitWrongReview();
      try { alert('🎉 오답 복습을 모두 완료했습니다!'); } catch (e) {}
      setScreen('home');
      return;
    }
    const dateKey = makeupDate || localDateStr();
    if (user && words.length) {
      const ok = await persistLearnedSet(words, dateKey, makeupDate);
      if (ok !== false) {
        setSaveError(null);
        setRepeatCount((c) => c + 1);
        try { localStorage.setItem(`record_mission_${user.id}_${dateKey}`, 'true'); } catch (e) {}
        saveDailyProgress(user.id, dateKey, { hasRecorded: true });
        if (!makeupDate) setHasRecorded(true);
      } else {
        setSaveError({ type: 'learned', dateKey, words });
      }
    }
    setQuizLevel(1);
    setQuizKey((k) => k + 1);
    setScreen('quiz');
  };
  // 퀴즈 2단계 완수 → 학습 단어 미저장 시 먼저 저장 보장 후 출석 도장 (보충 모드면 그 날짜에 찍기)
  const recordStamp = async () => {
    if (!user) return null;
    const dateKey = makeupDate || localDateStr();
    if (words.length && !savedDatesRef.current.has(dateKey)) {
      const learnedOk = await persistLearnedSet(words, dateKey, makeupDate);
      if (learnedOk === false) {
        setSaveError({ type: 'stamp', dateKey, words });
        return null;
      }
      setRepeatCount((c) => (c > 0 ? c : 1));
    }
    const ok = await stampAttendance(user, dateKey);
    if (ok) {
      if (words.length) {
        const cum = mergeCumulativeWordsForDate(user.id, dateKey, words);
        if (dateKey === localDateStr()) setTodayAllLearned(cum);
      }
      setStamps((p) => {
        const next = p.includes(dateKey) ? p : [...p, dateKey];
        try {
          localStorage.setItem(`english_stamps_${user.id}`, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      setSaveError(null);
      if (makeupDate) setMakeupDate(null);
      return dateKey;
    }
    setSaveError({ type: 'stamp', dateKey, words });
    return null;
  };
  const retrySave = async () => {
    if (!saveError || !user) return false;
    const { dateKey, words: targetWords, type } = saveError;
    if (!savedDatesRef.current.has(dateKey) && targetWords && targetWords.length) {
      const learnedOk = await persistLearnedSet(targetWords, dateKey, dateKey !== localDateStr() ? dateKey : null);
      if (learnedOk === false) return false;
    }
    if (type === 'stamp') {
      const ok = await stampAttendance(user, dateKey);
      if (!ok) return false;
      setStamps((p) => {
        const next = p.includes(dateKey) ? p : [...p, dateKey];
        try { localStorage.setItem(`english_stamps_${user.id}`, JSON.stringify(next)); } catch (e) {}
        return next;
      });
      setQuizResult((prev) => (prev ? { ...prev, stampedDate: dateKey } : prev));
      if (makeupDate) setMakeupDate(null);
    }
    setSaveError(null);
    return true;
  };
  const onQuizDone = (result) => {
    result.wrongs.forEach((w) => toggleWrong(w, true));
    if (user?.id && result?.level) {
      const dateKey = makeupDate || localDateStr();
      setCompletedQuizLevels((prev) => {
        const next = prev.includes(result.level) ? prev : [...prev, result.level];
        try { localStorage.setItem(`quiz_mission_${user.id}_${dateKey}`, JSON.stringify(next)); } catch (e) {}
        saveDailyProgress(user.id, dateKey, { completedQuizLevels: next });
        return next;
      });
    }
    setQuizResult(result);
    setScreen('quizdone');
  };
  const handleNextQuizLevel = (nextLv) => {
    const targetLv = typeof nextLv === 'number' && nextLv >= 1 && nextLv <= 4 ? nextLv : 1;
    setQuizLevel(targetLv);
    setQuizKey((k) => k + 1);
    setScreen('quiz');
  };
  const startWrongReview = (target = 'flashcard', customList = null) => {
    const list = (Array.isArray(customList) && customList.length ? customList : wrongWords) || [];
    if (!list.length) return;
    if (!isWrongReview && !makeupDate && !isSpecialDeckRef.current) {
      if (words.length > 0) {
        originalDailyWordsRef.current = words;
      }
      originalDailyDoneSetRef.current = doneSet;
      originalDailyIdxRef.current = idx;
    }
    setIsWrongReview(true);
    isSpecialDeckRef.current = true;
    setWords(list);
    setIdx(0);
    setDoneSet(new Set());
    if (target === 'quiz') {
      setQuizLevel(1);
      setQuizKey((k) => k + 1);
      setScreen('quiz');
    } else {
      setScreen('flashcard');
    }
  };
  const reviewWrong = () => {
    const list = quizResult?.wrongs?.length ? quizResult.wrongs : wrongWords;
    startWrongReview('flashcard', list);
  };
  const restudyDate = (dateWords) => {
    if (!Array.isArray(dateWords) || !dateWords.length) return;
    const poolMap = new Map();
    const registerSource = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        const k = cleanWord(item).toLowerCase();
        if (k && !poolMap.has(k)) poolMap.set(k, item);
      }
    };
    registerSource(pool);
    registerSource(originalDailyWordsRef.current);
    registerSource(words);
    registerSource(FALLBACK_WORDS);

    const list = dateWords.map((w) => {
      const wText = cleanWord(w);
      const matched = poolMap.get(wText.toLowerCase()) || {};
      return {
        ...matched,
        ...w,
        word: wText,
        meaning: wordMeaning(w) || wordMeaning(matched),
        phonics: w.phonics || w.phonetic || matched.phonics || matched.phonetic,
        example_en: w.example_en || w.exampleEn || matched.example_en || matched.exampleEn,
        example_ko: w.example_ko || w.exampleKo || matched.example_ko || matched.exampleKo,
        image_url: w.image_url || w.imageUrl || matched.image_url || matched.imageUrl,
        category: w.category || w.grade_level || matched.category || matched.grade_level,
      };
    });
    if (list.length) {
      if (!isWrongReview && !makeupDate && !isSpecialDeckRef.current) {
        if (words.length > 0) {
          originalDailyWordsRef.current = words;
        }
        originalDailyDoneSetRef.current = doneSet;
        originalDailyIdxRef.current = idx;
      }
      isSpecialDeckRef.current = true;
      setWords(list);
      setIdx(0);
      setDoneSet(new Set());
      setScreen('flashcard');
    }
  };
  // 달력 → 빠진 날짜 보충 학습/퀴즈 시작
  const startMakeup = (dateKey, target) => {
    if (!isWrongReview && !makeupDate && !isSpecialDeckRef.current) {
      if (words.length > 0) {
        originalDailyWordsRef.current = words;
      }
      originalDailyDoneSetRef.current = doneSet;
      originalDailyIdxRef.current = idx;
    }
    setIsWrongReview(false);
    isSpecialDeckRef.current = true;
    const makeupWords = getWordsForMakeupDate(dateKey);
    if (makeupWords.length > 0) {
      setWords(makeupWords);
    }
    setMakeupDate(dateKey);
    setIdx(0);
    setDoneSet(new Set());
    if (target === 'quiz') setQuizLevel(1);
    setQuizKey((k) => k + 1);
    setScreen(target);
  };
  const saveProfile = async ({ level, daily }) => {
    const u = { ...user, level, daily };
    setUser(u);
    if (!user.guest) await updateProfile(user, { level, daily });
    try {
      const today = localDateStr();
      localStorage.removeItem(`daily_set_${u.id}_${today}`);
      localStorage.removeItem(`daily_random_set_${u.id}_${today}`);
      localStorage.removeItem(`msv2_progress_${u.id}_${today}`);
      const sessionUser = { id: u.id, student_id: u.id, name: u.name, studyGradeLevel: level, dailyWordCount: String(daily) };
      localStorage.setItem('english_edu_current_user', JSON.stringify(sessionUser));
      saveStudentSession(sessionUser);
    } catch (e) {}
    loadAll(u, true);
  };
  const saveUserRecording = (wordStr, recInfo) => {
    const wText = cleanWord(wordStr).trim();
    const wKey = wText.toLowerCase();
    if (!wKey) return;
    setUserRecordings((prev) => {
      const existing = prev[wKey] || {};
      const nextUrl = recInfo?.url && recInfo.url !== 'recorded' ? recInfo.url : (existing.url || recInfo?.url || 'recorded');
      const nextScore = recInfo?.score !== undefined && recInfo?.score !== null ? recInfo.score : existing.score;
      const nextRecog = recInfo?.recognized !== undefined ? recInfo.recognized : (existing.recognized || '');
      return {
        ...prev,
        [wKey]: {
          word: wText,
          url: nextUrl,
          score: nextScore,
          recognized: nextRecog,
          updatedAt: new Date().toISOString(),
        },
      };
    });
    if (recInfo?.score >= 55 && user?.id && !makeupDate) {
      const today = localDateStr();
      setHasRecorded(true);
      try { localStorage.setItem(`record_mission_${user.id}_${today}`, 'true'); } catch (e) {}
      saveDailyProgress(user.id, today, { hasRecorded: true });
    }
  };
  const logout = () => {
    setUser(null);
    originalDailyWordsRef.current = [];
    originalDailyDoneSetRef.current = new Set();
    originalDailyIdxRef.current = 0;
    savedDatesRef.current = new Set();
    learnedWordsSetRef.current = new Set();
    isSpecialDeckRef.current = false;
    setIsWrongReview(false);
    setSaveError(null);
    setRepeatCount(0);
    setStudyRound(1);
    setTodayAllLearned([]);
    setCompletedQuizLevels([]);
    setHasRecorded(false);
    setWrongWords([]);
    setFavs([]);
    setCustomWords([]);
    setUserRecordings({});
    setWords([]); setPool([]); setStamps([]); setDoneSet(new Set()); setIdx(0); setQuizResult(null); setMakeupDate(null);
    clearStudentSession();
    setScreen('login');
  };

  const streak = (() => {
    const set = new Set(stamps);
    let n = 0;
    const d = new Date();
    if (!set.has(localDateStr(d))) d.setDate(d.getDate() - 1);
    while (set.has(localDateStr(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  })();

  const navItems = [
    ['🏠', '홈', 'home'], ['🃏', '학습', 'flashcard'], ['📝', '퀴즈', 'quiz'], ['📊', '통계', 'stats'], ['👤', 'MY', 'profile'],
  ];
  const showNav = ['home', 'wordbook', 'calendar', 'stats', 'parent', 'profile', 'pdf'].includes(screen);
  const canNextRound = !isWrongReview && !makeupDate;
  const screens = {
    login: <LoginScreen go={go} onLogin={handleLogin} />,
    home: <HomeScreen go={go} user={user} done={doneSet.size} total={words.length || user?.daily || 20} streak={streak} loading={wordsLoading} completedQuizLevels={completedQuizLevels} hasRecorded={hasRecorded} wrongCount={wrongWords.length} studyRound={studyRound} todayAllCount={todayAllLearned.length} onNextRound={canNextRound ? startNextRound : undefined} />,
    flashcard: (
      <FlashcardScreen
        go={go}
        user={user}
        words={words}
        loading={wordsLoading}
        idx={idx}
        setIdx={(newIdx) => {
          setIdx(newIdx);
          if (!isWrongReview && !makeupDate && !isSpecialDeckRef.current) {
            originalDailyIdxRef.current = newIdx;
            if (user?.id) saveDailyProgress(user.id, localDateStr(), { idx: newIdx });
          }
        }}
        markDone={markDone}
        wrongWords={wrongWords}
        toggleWrong={toggleWrong}
        onRemoveWrong={removeWrongWord}
        rate={rate}
        cycleRate={cycleRate}
        onFinishSet={onFinishSet}
        makeupDate={makeupDate}
        exitMakeup={exitMakeup}
        isWrongReview={isWrongReview}
        exitWrongReview={exitWrongReview}
        studyRound={studyRound}
        todayAllCount={todayAllLearned.length}
        onNextRound={canNextRound ? startNextRound : undefined}
        userRecordings={userRecordings}
        onSaveRecording={saveUserRecording}
        loadError={wordsLoadError}
        usedFallback={usedFallbackWords}
        onRetry={() => { if (user) loadAll(user, true); }}
        onUseFallback={applyFallbackWords}
      />
    ),
    quiz: <QuizScreen key={quizKey} initialLevel={quizLevel} onLevelChange={setQuizLevel} completedLevels={completedQuizLevels} go={go} user={user} words={words} pool={pool} rate={rate} onQuizDone={onQuizDone} onRecordWrong={(w) => toggleWrong(w, true)} recordStamp={recordStamp} makeupDate={makeupDate} exitMakeup={exitMakeup} isWrongReview={isWrongReview} exitWrongReview={exitWrongReview} userRecordings={userRecordings} onSaveRecording={saveUserRecording} loadError={wordsLoadError} onRetry={() => { if (user) loadAll(user, true); }} onUseFallback={applyFallbackWords} />,
    quizdone: <QuizDoneScreen go={go} result={quizResult} onReviewWrong={reviewWrong} onNextLevel={handleNextQuizLevel} onNextRound={canNextRound ? startNextRound : undefined} studyRound={studyRound} saveError={saveError} onRetrySave={retrySave} />,
    wordbook: <WordbookScreen user={user} words={words} pool={pool} favs={favs} toggleFav={toggleFav} customWords={customWords} onAddCustomWord={addCustomWord} onDeleteCustomWord={deleteCustomWord} wrongWords={wrongWords} onStartWrongReview={startWrongReview} onRemoveWrong={removeWrongWord} rate={rate} initialTab={wordbookTab} go={go} />,
    calendar: <CalendarScreen go={go} user={user} stamps={stamps} pool={pool} onRestudy={restudyDate} startMakeup={startMakeup} rate={rate} />,
    stats: <StatsScreen user={user} learnedTotal={learnedTotal} repeatCount={repeatCount} stamps={stamps} lastScore={quizResult ? quizResult.score : null} streak={streak} />,
    parent: <ParentScreen user={user} done={doneSet.size} total={words.length || user?.daily || 20} stamps={stamps} learnedTotal={learnedTotal} />,
    profile: <ProfileScreen user={user} onSaveProfile={saveProfile} onLogout={logout} learnedTotal={learnedTotal} stamps={stamps} go={go} wordsTotal={words.length} />,
    pdf: <PdfScreen go={go} user={user} words={words} pool={pool} />,
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', background: 'linear-gradient(180deg, #EEF0FB 0%, #F4F2FC 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <style>{`.msv2-scroll{scrollbar-width:none;-ms-overflow-style:none}.msv2-scroll::-webkit-scrollbar{display:none}`}</style>
      <div style={{ width: 390 * scale, height: 844 * scale, flexShrink: 0 }}>
        <div style={{ width: 390, height: 844, transform: `scale(${scale})`, transformOrigin: 'top left', background: screen === 'login' ? '#FFFFFF' : C.bg, borderRadius: 36, boxShadow: '0 25px 60px -15px rgba(99, 102, 241, 0.25), 0 0 0 1px rgba(255,255,255,0.8) inset', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div className="msv2-scroll" style={{ flex: 1, overflowY: 'auto', paddingBottom: showNav ? 77 : 0 }}>
            {screens[screen]}
          </div>
          {showNav && (
            <nav style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(14px)', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-around', padding: '12px 8px 24px' }}>
              {navItems.map(([icon, label, target]) => {
                const active = screen === target;
                return (
                  <button key={label} onClick={() => go(target)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', padding: '2px 10px', fontFamily: FONT }}>
                    <span style={{ fontSize: 18, filter: active ? 'none' : 'grayscale(0.6) opacity(0.75)' }}>{icon}</span>
                    <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? C.primary : C.sub }}>{label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
