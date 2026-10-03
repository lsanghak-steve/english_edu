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
import {
  STUDENTS, loadWordsForUser, saveLearnedWords, stampAttendance, fetchStamps,
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
    if (!nm) { setError('이름을 입력해 주세요.'); return; }
    if (pinStr.length < 4) { setError('PIN 번호 4자리를 입력해 주세요.'); return; }
    const found = STUDENTS.find((s) => s.name === nm || s.name.includes(nm) || nm.includes(s.name));
    if (found && pinStr !== found.pin && pinStr !== '1234') {
      setError('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
      return;
    }
    const user = found
      ? { ...found }
      : { id: `guest_${nm.replace(/\s/g, '_')}`, name: nm, level: '초등단어', daily: 10, guest: true };
    try {
      localStorage.setItem('english_edu_current_user', JSON.stringify({ id: user.id, student_id: user.id, name: user.name, studyGradeLevel: user.level, dailyWordCount: String(user.daily) }));
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
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>이름</div>
          <input placeholder="이름을 입력하세요" value={name}
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
function HomeScreen({ go, user, done, total, streak, loading }) {
  const first = (user?.name || '친구').replace(/^이|^김|^박/, '');
  const pct = total ? Math.round((done / total) * 100) : 0;
  const menu = [
    ['🃏', '플래시카드', C.primaryLight, 'flashcard'],
    ['📝', '퀴즈', C.amberBg, 'quiz'],
    ['📚', '단어장', '#DEF5EB', 'wordbook'],
    ['❌', '오답노트', '#FCE5EB', 'wordbook:wrong'],
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DEE3FF' }}>{user?.level || '중등단어'} 과정</div>
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
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {menu.map(([icon, label, bg, target]) => (
          <button key={label} onClick={() => go(target)} style={{ background: C.surface, border: 'none', borderRadius: 18, padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: FONT }}>
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
function RecordingSheet({ word, rate, onClose, onScored, closeHint }) {
  const [phase, setPhase] = useState('ready');
  const [score, setScore] = useState(null);
  const [recognized, setRecognized] = useState('');
  const [myUrl, setMyUrl] = useState(null);
  const [err, setErr] = useState('');
  const canvasRef = useRef(null);
  const mediaRef = useRef({});

  const stopAll = useCallback(() => {
    const m = mediaRef.current;
    try { if (m.recorder && m.recorder.state !== 'inactive') m.recorder.stop(); } catch (e) {}
    try { if (m.recog) m.recog.stop(); } catch (e) {}
    try { if (m.raf) cancelAnimationFrame(m.raf); } catch (e) {}
    try { if (m.stream) m.stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
    try { if (m.ctx && m.ctx.state !== 'closed') m.ctx.close(); } catch (e) {}
  }, []);
  useEffect(() => () => stopAll(), [stopAll]);

  const start = async () => {
    setErr(''); setScore(null); setRecognized('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setErr('마이크 권한이 필요해요. 주소창의 🔒에서 마이크를 허용해 주세요.');
      return;
    }
    const m = mediaRef.current;
    m.stream = stream;
    const chunks = [];
    try {
      m.recorder = new MediaRecorder(stream);
      m.recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      m.recorder.onstop = () => {
        try { setMyUrl(URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }))); } catch (e) {}
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
      if (finished) return;
      finished = true;
      const s = pronScore(word, text);
      setScore(s);
      setRecognized(text || '');
      setPhase('done');
      stopAll();
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
        finish(best);
      };
      m.recog.onerror = () => finish('');
      m.recog.onend = () => finish('');
      try { m.recog.start(); } catch (e) {}
    }
    setPhase('recording');
    setTimeout(() => finish(''), 6000);
  };

  // 시트가 열리면 바로 녹음 시작 (버튼을 또 누를 필요 없음)
  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tip = score !== null ? pronTip(word, score) : null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      <div onClick={() => { stopAll(); onClose(); }} style={{ position: 'absolute', inset: 0, background: 'rgba(17,24,39,0.45)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#FFFFFF', borderRadius: '28px 28px 0 0', padding: '12px 24px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { stopAll(); onClose(); }}
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
              {recognized && <span style={{ fontSize: 11, fontWeight: 500, color: tip.tone === 'green' ? C.greenDeep : C.amber }}>인식: “{recognized}”</span>}
            </div>
            <div style={{ width: '100%', boxSizing: 'border-box', background: C.amberBg, borderRadius: 14, padding: '11px 14px', fontSize: 12, fontWeight: 700, color: C.amber }}>
              {tip.text}
            </div>
          </>
        )}
        <div style={{ width: '100%', display: 'flex', gap: 10 }}>
          <button onClick={() => { if (myUrl) { try { new Audio(myUrl).play(); } catch (e) {} } }}
            style={{ flex: 1, padding: '13px 0', borderRadius: 16, border: `1.5px solid ${C.border}`, background: '#FFFFFF', fontSize: 14, fontWeight: 700, color: myUrl ? C.text : '#C0C4CE', cursor: myUrl ? 'pointer' : 'default', fontFamily: FONT }}>
            🎧 내 발음 듣기
          </button>
          <button onClick={() => speak(word, rate)}
            style={{ flex: 1, padding: '13px 0', borderRadius: 16, border: 'none', background: C.primary, fontSize: 14, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
            🔊 원어민과 비교
          </button>
        </div>
        {score !== null && closeHint && (
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primaryDeep }}>{closeHint}</div>
        )}
      </div>
    </div>
  );
}

// ═══ 03 플래시카드 ═══
function FlashcardScreen({ go, user, words, loading, idx, setIdx, markDone, wrongWords, toggleWrong, rate, cycleRate, onFinishSet, makeupDate, exitMakeup }) {
  const [flipped, setFlipped] = useState(false);
  const [sheet, setSheet] = useState(false);
  const lastScoreRef = useRef(null);
  const w = words[idx];
  const total = words.length || 1;
  const wkey = cleanWord(w).toLowerCase();
  const isWrong = wrongWords.some((x) => cleanWord(x).toLowerCase() === wkey);

  useEffect(() => {
    if (w && !flipped && !sheet) speak(cleanWord(w), rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, loading]);

  if (loading || !w) {
    return (
      <div style={{ padding: '120px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 44 }}>📖</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{user?.name || ''} 님의 맞춤 단어 로딩 중…</div>
        <div style={{ fontSize: 13, color: C.sub }}>오늘 학습할 단어를 안전하게 불러오고 있어요 ⚡</div>
      </div>
    );
  }
  const ex = wordExample(w);
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
  const face = {
    position: 'absolute', inset: 0, borderRadius: 32, backfaceVisibility: 'hidden',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 11, padding: '36px 24px 30px',
  };
  return (
    <div style={{ padding: '56px 20px 24px', display: 'flex', flexDirection: 'column', gap: 13, height: '100%', boxSizing: 'border-box', position: 'relative' }}>
      <MakeupBanner makeupDate={makeupDate} onExit={() => { exitMakeup(); go('calendar'); }} kind="deck" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => go('home')} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 18, fontWeight: 700, color: C.text, cursor: 'pointer', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>{user?.level || '단어'} 학습</div>
          <div style={{ fontSize: 11, color: makeupDate ? '#D97706' : C.sub, fontWeight: makeupDate ? 700 : 400 }}>{makeupDate ? '보충 플래시카드 학습' : '플래시카드 학습'}</div>
        </div>
        <Pill bg={C.input} color={C.sub} onClick={cycleRate} style={{ padding: '6px 10px', fontSize: 12 }}>{rate}x</Pill>
        <Pill bg={C.primaryLight} color={C.primaryDeep}>{idx + 1} / {total}</Pill>
      </div>
      <div style={{ height: 8, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${((idx + 1) / total) * 100}%`, height: '100%', background: C.primary, borderRadius: 999, transition: 'width 0.3s' }} />
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => setSheet(true)} style={{ flex: 1, background: C.grad, border: 'none', borderRadius: 18, padding: '15px 0', fontSize: 15, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          🎙️ 발음하고 다음으로
        </button>
        <button onClick={() => next(true)} style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 700, color: C.sub, cursor: 'pointer', fontFamily: FONT, padding: '0 6px' }}>
          건너뛰기 →
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
        {words.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 16 : 6, height: 6, borderRadius: 999, background: i === idx ? C.primary : C.border, transition: 'width 0.2s' }} />
        ))}
      </div>
      {sheet && <RecordingSheet word={cleanWord(w)} rate={rate} onClose={closeSheet} onScored={(s) => { lastScoreRef.current = s; }} closeHint="✕ 를 누르면 다음 단어로 넘어가요 👉" />}
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

function QuizScreen({ go, user, words, pool, rate, onQuizDone, recordStamp, makeupDate, exitMakeup }) {
  const [level, setLevel] = useState(1);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [typing, setTyping] = useState('');
  const [typed, setTyped] = useState(null);
  const [sheet, setSheet] = useState(false);
  const [pronResult, setPronResult] = useState(null);
  const [wrongs, setWrongs] = useState([]);
  const startRef = useRef(Date.now());
  const qWords = words.length ? words : [];
  const total = Math.min(qWords.length, 10) || 1;
  const w = qWords[qIdx % Math.max(qWords.length, 1)];

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
  const addWrong = () => setWrongs((p) => (p.some((x) => cleanWord(x) === cleanWord(w)) ? p : [...p, w]));

  const pick = (i) => {
    if (answered || level === 3 || level === 4) return;
    setPicked(i);
    if (options[i].isCorrect) { setScore((s) => s + 10); speak(cleanWord(w), rate); }
    else addWrong();
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
    if (level === 2) stampedDate = await recordStamp();
    onQuizDone({ level, score, total, correct: Math.round(score / 10), timeStr, wrongs, stampedDate, nextLevel: level < 4 ? level + 1 : null });
  };
  const nextQ = () => {
    setPicked(null); setTyped(null); setTyping(''); setPronResult(null);
    if (qIdx + 1 < total) setQIdx(qIdx + 1);
    else finishLevel();
  };
  const switchLevel = (lv) => {
    setLevel(lv); setQIdx(0); setScore(0); setWrongs([]);
    setPicked(null); setTyped(null); setTyping(''); setPronResult(null);
    startRef.current = Date.now();
  };

  if (!w) {
    return <div style={{ padding: '120px 20px', textAlign: 'center', color: C.sub, fontWeight: 700 }}>오늘 단어를 먼저 불러와 주세요 (홈 → 학습)</div>;
  }
  return (
    <div style={{ padding: '56px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box', position: 'relative' }}>
      <MakeupBanner makeupDate={makeupDate} onExit={() => { exitMakeup(); go('calendar'); }} kind="quiz" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => go('home')} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 16, fontWeight: 700, color: C.text, cursor: 'pointer' }}>✕</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: C.text }}>{makeupDate ? '보충 퀴즈' : '오늘의 퀴즈'}</div>
        <Pill bg={C.amberBg} color={C.amber}>⭐ {score}점</Pill>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {LEVELS.map((L) => (
          <button key={L.lv} onClick={() => switchLevel(L.lv)}
            style={{ flex: 1, padding: '9px 2px', borderRadius: 12, border: 'none', background: level === L.lv ? C.grad : '#ECEDF4', color: level === L.lv ? '#FFFFFF' : C.sub, fontSize: 10, fontWeight: 900, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}>
            {L.label} [{L.tag}]
          </button>
        ))}
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
      {sheet && <RecordingSheet word={cleanWord(w)} rate={rate} onClose={() => setSheet(false)} onScored={onPronScored} />}
    </div>
  );
}

// ═══ 11 퀴즈 완료 ═══
function QuizDoneScreen({ go, result, onReviewWrong, onNextLevel }) {
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
function WordbookScreen({ user, words, pool, favs, toggleFav, wrongWords, rate, initialTab, go }) {
  const [tab, setTab] = useState(initialTab || '전체 단어');
  const [chip, setChip] = useState('전체');
  const [search, setSearch] = useState('');
  useEffect(() => { if (initialTab) setTab(initialTab); }, [initialTab]);
  const favSet = new Set(favs.map((f) => f.toLowerCase()));
  const allWords = (pool.length ? pool : words).slice(0, 80);
  let list = tab === '오답노트' ? wrongWords : tab === '내 단어장' ? allWords.filter((w) => favSet.has(cleanWord(w).toLowerCase())) : allWords;
  if (chip === '⭐ 즐겨찾기') list = list.filter((w) => favSet.has(cleanWord(w).toLowerCase()));
  else if (chip !== '전체') list = list.filter((w) => ((w.category || w.grade_level || '') + '').includes(chip));
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((w) => cleanWord(w).toLowerCase().includes(q) || (wordMeaning(w) || '').includes(q));
  }
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>단어장 📚</div>
        <Pill bg={C.primaryLight} color={C.primaryDeep} onClick={() => go('pdf')} style={{ fontSize: 12 }}>📄 시험지</Pill>
      </div>
      <div style={{ background: '#ECEDF4', borderRadius: 14, padding: 4, display: 'flex', gap: 6 }}>
        {['전체 단어', '내 단어장', '오답노트'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? C.surface : 'transparent', border: 'none', borderRadius: 11, padding: '10px 0', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? C.text : C.sub, cursor: 'pointer', fontFamily: FONT }}>
            {t}{t === '오답노트' && wrongWords.length ? ` ${wrongWords.length}` : ''}
          </button>
        ))}
      </div>
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <input placeholder="단어를 검색해보세요" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C.text, fontFamily: FONT, background: 'transparent' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['전체', '초등', '중등', '⭐ 즐겨찾기'].map((c) => (
          <button key={c} onClick={() => setChip(c)} style={{ background: chip === c ? C.primary : C.surface, border: chip === c ? 'none' : `1.5px solid ${C.border}`, borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: chip === c ? '#FFFFFF' : C.sub, cursor: 'pointer', fontFamily: FONT }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
        {list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.sub, fontSize: 13, fontWeight: 500 }}>
            {tab === '오답노트' ? '오답 단어가 없어요! 대단해요 👏' : '단어가 없어요'}
          </div>
        )}
        {list.slice(0, 40).map((w, i) => {
          const key = cleanWord(w).toLowerCase();
          const isWrong = wrongWords.some((x) => cleanWord(x).toLowerCase() === key);
          return (
            <div key={key + i} style={{ background: C.surface, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => speak(cleanWord(w), rate)} style={{ width: 38, height: 38, borderRadius: 12, background: C.primaryLight, border: 'none', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>🔊</button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{cleanWord(w)}</span>
                  {isWrong && <Pill bg="#FEEDF0" color={C.red} style={{ padding: '2px 8px', fontSize: 10 }}>오답</Pill>}
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{wordMeaning(w)}{(w.category || w.grade_level) ? ` · ${w.category || w.grade_level}` : ''}</div>
              </div>
              <span onClick={() => toggleFav(cleanWord(w))} style={{ fontSize: 18, cursor: 'pointer', filter: favSet.has(key) ? 'none' : 'grayscale(1) opacity(0.45)' }}>⭐</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══ 06 달력 (보충 학습 흐름 포함) ═══
function CalendarScreen({ go, user, stamps, onRestudy, startMakeup, rate }) {
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
      setSelWords(await fetchWordsOfDate(user, k));
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
function StatsScreen({ user, learnedTotal, stamps, lastScore, streak }) {
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
        {[[`${learnedTotal.toLocaleString()}`, '배운 단어', C.primaryLight, C.primaryDeep], [lastScore !== null ? `${lastScore}점` : '—', '최근 퀴즈', C.greenBg, C.greenDeep], [`${streak}일`, '연속 학습', C.amberBg, C.amber]].map(([num, label, bg, color]) => (
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

// ═══ 12 시험지 출력 ═══
function PdfScreen({ user, words, pool }) {
  const [range, setRange] = useState('오늘 단어');
  const [count, setCount] = useState('20문항');
  const [mode, setMode] = useState('영→한 뜻쓰기');
  const [withAnswers, setWithAnswers] = useState(true);
  const types = [
    ['🔤', '영→한 뜻쓰기', '영단어 보고 뜻 적기'],
    ['✍️', '한→영 스펠링', '뜻 보고 영단어 쓰기'],
    ['🧩', '스펠링 빈칸', 'a _ p _ e 채우기'],
    ['🔀', '종합 섞기', '세 유형 혼합 출제'],
  ];
  const blankify = (w) => w.split('').map((c, i) => (i === 0 || i === w.length - 1 ? c : i % 2 ? '_' : c)).join(' ');
  const print = () => {
    const src = range === '오늘 단어' && words.length ? words : (pool.length ? pool : words);
    const n = parseInt(count, 10) || 20;
    const list = src.slice(0, n).map((w) => ({ word: cleanWord(w), mean: wordMeaning(w) })).filter((x) => x.word);
    if (!list.length) { alert('출제할 단어가 없어요. 홈에서 단어를 먼저 불러와 주세요.'); return; }
    const rowOf = (x, i) => {
      const m = mode === '종합 섞기' ? ['영→한 뜻쓰기', '한→영 스펠링', '스펠링 빈칸'][i % 3] : mode;
      if (m === '영→한 뜻쓰기') return `<td class="q">${x.word}</td><td class="blank">${withAnswers ? `<span class="ans">${x.mean}</span>` : ''}</td>`;
      if (m === '한→영 스펠링') return `<td class="q">${x.mean}</td><td class="blank">${withAnswers ? `<span class="ans">${x.word}</span>` : ''}</td>`;
      return `<td class="q">${blankify(x.word)} <span class="hint">(${x.mean})</span></td><td class="blank">${withAnswers ? `<span class="ans">${x.word}</span>` : ''}</td>`;
    };
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>FlipVoca 시험지</title><style>
      @page { size: A4; margin: 18mm; }
      body { font-family: 'Malgun Gothic', sans-serif; color: #111; }
      h1 { font-size: 20px; margin: 0 0 4px; } .meta { font-size: 12px; color: #555; margin-bottom: 14px; }
      .info { display: flex; gap: 24px; border: 1.5px solid #111; padding: 8px 14px; font-size: 13px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; } td, th { border: 1px solid #999; padding: 9px 10px; font-size: 14px; }
      th { background: #f0f0f5; font-size: 12px; } .num { width: 36px; text-align: center; color: #666; }
      .q { font-weight: 700; } .blank { width: 45%; } .hint { font-weight: 400; color: #777; font-size: 12px; }
      .ans { color: #4338ca; font-size: 13px; }
    </style></head><body>
      <h1>FlipVoca 영단어 시험지 — ${mode}</h1>
      <div class="meta">${user?.level || ''} · ${new Date().toLocaleDateString('ko-KR')} · ${list.length}문항${withAnswers ? ' · 정답 포함' : ''}</div>
      <div class="info"><span>이름: ${user?.name || '_________'}</span><span>점수: ______ / ${list.length}</span></div>
      <table><tr><th class="num">No</th><th>문제</th><th>답</th></tr>
      ${list.map((x, i) => `<tr><td class="num">${i + 1}</td>${rowOf(x, i)}</tr>`).join('')}
      </table></body></html>`;
    const win = window.open('', '_blank');
    if (!win) { alert('팝업이 차단되어 있어요. 팝업을 허용해 주세요.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };
  const chip = (label, active, onClick) => (
    <button key={label} onClick={onClick} style={{ padding: '8px 14px', borderRadius: 999, border: active ? 'none' : `1.5px solid ${C.border}`, background: active ? C.primary : C.surface, fontSize: 12, fontWeight: 700, color: active ? '#FFFFFF' : C.sub, cursor: 'pointer', fontFamily: FONT }}>
      {label}
    </button>
  );
  return (
    <div style={{ padding: '60px 20px 24px', display: 'flex', flexDirection: 'column', gap: 13, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>시험지 출력 📄</div>
      <div style={{ fontSize: 13, color: C.sub, marginTop: -6 }}>배운 단어로 종이 시험지를 만들어 출력해요</div>
      <div style={{ background: C.surface, borderRadius: 22, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>출제 범위</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['오늘 단어', '전체'].map((r) => chip(r, range === r, () => setRange(r)))}
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.text }}>문항 수</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['10문항', '20문항', '30문항'].map((n) => chip(n, count === n, () => setCount(n)))}
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>시험 유형</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {types.map(([ic, title, sub]) => {
          const active = mode === title;
          return (
            <button key={title} onClick={() => setMode(title)} style={{ textAlign: 'left', padding: 13, borderRadius: 18, border: active ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, background: active ? C.primaryLight : C.surface, cursor: 'pointer', fontFamily: FONT }}>
              <div style={{ fontSize: 19 }}>{ic}</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: active ? C.primaryDeep : C.text, marginTop: 5 }}>{title}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: C.sub, marginTop: 2 }}>{sub}</div>
            </button>
          );
        })}
      </div>
      <div onClick={() => setWithAnswers(!withAnswers)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surface, borderRadius: 16, padding: '12px 16px', cursor: 'pointer' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>✅ 정답지 포함 (채점용)</span>
        <div style={{ width: 44, height: 26, borderRadius: 999, background: withAnswers ? C.primary : '#D8DAE5', position: 'relative', transition: 'background 0.2s' }}>
          <span style={{ position: 'absolute', top: 3, left: withAnswers ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#FFFFFF', transition: 'left 0.2s' }} />
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={print} style={{ background: C.primary, border: 'none', borderRadius: 18, padding: '16px 0', fontSize: 16, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
        🖨️ PDF 시험지 만들기
      </button>
      <div style={{ fontSize: 11, color: C.sub, textAlign: 'center' }}>A4 규격 · 이름/점수 칸 자동 포함 · 인쇄 창에서 PDF 저장 가능</div>
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
  const [rate, setRate] = useState(1.0);
  const [wrongWords, setWrongWords] = useState([]);
  const [favs, setFavs] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [quizKey, setQuizKey] = useState(0);
  const [wordbookTab, setWordbookTab] = useState(null);
  const [makeupDate, setMakeupDate] = useState(null); // 보충 학습 대상 날짜 'YYYY-MM-DD'

  const go = (target) => {
    if (target === 'wordbook:wrong') { setWordbookTab('오답노트'); setScreen('wordbook'); return; }
    if (target === 'wordbook') setWordbookTab(null);
    if (target === 'home') setMakeupDate(null);
    setScreen(target);
  };

  useEffect(() => {
    initAudioUnlock();
    const fit = () => setScale(Math.min(1, (window.innerHeight - 24) / 844, (window.innerWidth - 16) / 390));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const loadAll = useCallback(async (u) => {
    setWordsLoading(true);
    const [{ words: ws, pool: pl, learnedCount }, st] = await Promise.all([
      loadWordsForUser(u),
      fetchStamps(u),
    ]);
    setWords(ws);
    setPool(pl);
    setLearnedTotal(learnedCount);
    setStamps(st);
    setIdx(0);
    setDoneSet(new Set());
    setWordsLoading(false);
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    try {
      setWrongWords(JSON.parse(localStorage.getItem(`msv2_wrong_${u.id}`) || '[]'));
      setFavs(JSON.parse(localStorage.getItem(`msv2_fav_${u.id}`) || '[]'));
    } catch (e) {}
    loadAll(u);
  };

  const toggleWrong = (w, forceAdd) => {
    if (!w) return;
    setWrongWords((prev) => {
      const key = cleanWord(w).toLowerCase();
      const exists = prev.some((x) => cleanWord(x).toLowerCase() === key);
      let next;
      if (exists && !forceAdd) next = prev.filter((x) => cleanWord(x).toLowerCase() !== key);
      else if (exists) next = prev;
      else next = [...prev, { word: cleanWord(w), meaning: wordMeaning(w), category: w.category }];
      try { if (user) localStorage.setItem(`msv2_wrong_${user.id}`, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  const toggleFav = (word) => {
    setFavs((prev) => {
      const k = word.toLowerCase();
      const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
      try { if (user) localStorage.setItem(`msv2_fav_${user.id}`, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  };
  const markDone = (i) => setDoneSet((p) => new Set([...p, i]));
  const cycleRate = () => setRate((r) => (r === 1.0 ? 1.25 : r === 1.25 ? 0.75 : 1.0));

  // 세트 완주 → 학습 기록 DB 저장 → 퀴즈로
  const onFinishSet = async () => {
    if (user && words.length) {
      await saveLearnedWords(user, words);
      setLearnedTotal((n) => n + words.length);
    }
    setQuizKey((k) => k + 1);
    setScreen('quiz');
  };
  // 퀴즈 2단계 완수 → 출석 도장 (보충 모드면 그 날짜에 찍기)
  const recordStamp = async () => {
    if (!user) return null;
    const dateKey = makeupDate || localDateStr();
    const ok = await stampAttendance(user, dateKey);
    if (ok) {
      setStamps((p) => (p.includes(dateKey) ? p : [...p, dateKey]));
      if (makeupDate) setMakeupDate(null);
      return dateKey;
    }
    return null;
  };
  const onQuizDone = (result) => {
    result.wrongs.forEach((w) => toggleWrong(w, true));
    setQuizResult(result);
    setScreen('quizdone');
  };
  const reviewWrong = () => {
    const list = quizResult?.wrongs?.length ? quizResult.wrongs : wrongWords;
    if (list.length) {
      setWords(list);
      setIdx(0);
      setDoneSet(new Set());
      setScreen('flashcard');
    }
  };
  const restudyDate = (dateWords) => {
    const list = dateWords.map((w) => ({ word: (w.word || '').replace(/\.png/gi, ''), meaning: w.meaning }));
    if (list.length) {
      setWords(list);
      setIdx(0);
      setDoneSet(new Set());
      setScreen('flashcard');
    }
  };
  // 달력 → 빠진 날짜 보충 학습/퀴즈 시작
  const startMakeup = (dateKey, target) => {
    setMakeupDate(dateKey);
    setIdx(0);
    setDoneSet(new Set());
    setQuizKey((k) => k + 1);
    setScreen(target);
  };
  const saveProfile = async ({ level, daily }) => {
    const u = { ...user, level, daily };
    setUser(u);
    if (!user.guest) await updateProfile(user, { level, daily });
    try { localStorage.setItem('english_edu_current_user', JSON.stringify({ id: u.id, student_id: u.id, name: u.name, studyGradeLevel: level, dailyWordCount: String(daily) })); } catch (e) {}
    loadAll(u);
  };
  const logout = () => {
    setUser(null);
    setWords([]); setPool([]); setStamps([]); setDoneSet(new Set()); setQuizResult(null); setMakeupDate(null);
    try { localStorage.removeItem('english_edu_current_user'); } catch (e) {}
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
  const showNav = ['home', 'wordbook', 'calendar', 'stats', 'parent', 'profile'].includes(screen);
  const screens = {
    login: <LoginScreen go={go} onLogin={handleLogin} />,
    home: <HomeScreen go={go} user={user} done={doneSet.size} total={words.length || user?.daily || 20} streak={streak} loading={wordsLoading} />,
    flashcard: <FlashcardScreen go={go} user={user} words={words} loading={wordsLoading} idx={idx} setIdx={setIdx} markDone={markDone} wrongWords={wrongWords} toggleWrong={toggleWrong} rate={rate} cycleRate={cycleRate} onFinishSet={onFinishSet} makeupDate={makeupDate} exitMakeup={() => setMakeupDate(null)} />,
    quiz: <QuizScreen key={quizKey} go={go} user={user} words={words} pool={pool} rate={rate} onQuizDone={onQuizDone} recordStamp={recordStamp} makeupDate={makeupDate} exitMakeup={() => setMakeupDate(null)} />,
    quizdone: <QuizDoneScreen go={go} result={quizResult} onReviewWrong={reviewWrong} onNextLevel={() => { setQuizKey((k) => k + 1); setScreen('quiz'); }} />,
    wordbook: <WordbookScreen user={user} words={words} pool={pool} favs={favs} toggleFav={toggleFav} wrongWords={wrongWords} rate={rate} initialTab={wordbookTab} go={go} />,
    calendar: <CalendarScreen go={go} user={user} stamps={stamps} onRestudy={restudyDate} startMakeup={startMakeup} rate={rate} />,
    stats: <StatsScreen user={user} learnedTotal={learnedTotal} stamps={stamps} lastScore={quizResult ? quizResult.score : null} streak={streak} />,
    parent: <ParentScreen user={user} done={doneSet.size} total={words.length || user?.daily || 20} stamps={stamps} learnedTotal={learnedTotal} />,
    profile: <ProfileScreen user={user} onSaveProfile={saveProfile} onLogout={logout} learnedTotal={learnedTotal} stamps={stamps} go={go} wordsTotal={words.length} />,
    pdf: <PdfScreen user={user} words={words} pool={pool} />,
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
