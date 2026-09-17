'use client';

// ═══════════════════════════════════════════════════════════════
// FlipVoca 리디자인 미리보기 (modern-study-v2)
// 피그마 「FlipVoca 리디자인 — 기능별 화면」 8화면을 그대로 구현한 프리뷰.
// 데모 데이터로 동작하며 기존 /modern-study 와 완전히 독립적이다.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';

// ── 디자인 토큰 (피그마 실측값) ──
const C = {
  bg: '#F6F7FB',
  surface: '#FFFFFF',
  primary: '#6366F1',
  primaryDeep: '#4A45E5',
  primaryLight: '#EDEDFE',
  grad: 'linear-gradient(135deg, #6366F1 0%, #8C5CF5 100%)',
  text: '#111827',
  sub: '#6B7280',
  border: '#E2E8F0',
  green: '#10B981',
  greenBg: '#DEF7ED',
  greenDeep: '#088059',
  redBg: '#FEE8ED',
  red: '#C72647',
  amberBg: '#FEF2DB',
  amber: '#B8730D',
  star: '#F9AD21',
  input: '#F6F7FB',
};
const FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

// ── 데모 단어 데이터 ──
const WORDS = [
  { word: 'adventure', mean: '모험', pos: '명사', phon: '[ ədvéntʃər ]', example: 'Life is a great adventure.', trans: '인생은 위대한 모험이다.', wrong: 0, fav: true },
  { word: 'brave', mean: '용감한', pos: '형용사', phon: '[ breiv ]', example: 'She was brave enough to try.', trans: '그녀는 도전할 만큼 용감했다.', wrong: 0, fav: false },
  { word: 'challenge', mean: '도전', pos: '명사', phon: '[ tʃǽlindʒ ]', example: 'I accept the challenge.', trans: '나는 그 도전을 받아들인다.', wrong: 2, fav: true },
  { word: 'discover', mean: '발견하다', pos: '동사', phon: '[ diskʌ́vər ]', example: 'We discover new things every day.', trans: '우리는 매일 새로운 것을 발견한다.', wrong: 0, fav: false },
  { word: 'effort', mean: '노력', pos: '명사', phon: '[ éfərt ]', example: 'Effort never betrays you.', trans: '노력은 배신하지 않는다.', wrong: 2, fav: false },
  { word: 'journey', mean: '여행', pos: '명사', phon: '[ dʒə́ːrni ]', example: 'The journey begins today.', trans: '여행은 오늘 시작된다.', wrong: 0, fav: false },
];
// ── 등록 학생 (modern-login 과 동일 명단) ──
const STUDENTS = [
  { name: '이상학', pin: '0815', level: '중등단어' },
  { name: '이승현', pin: '0418', level: '초등단어' },
  { name: '이수민', pin: '0809', level: '초등단어' },
  { name: '박재현', pin: '1234', level: '초등단어' },
  { name: '김민채', pin: '1234', level: '초등단어' },
];

const QUIZ_OPTS = [
  ['여행', '모험', '용기', '탐험가'],
  ['용감한', '무서운', '지혜로운', '빠른'],
  ['기회', '도전', '변화', '문제'],
  ['발견하다', '결정하다', '도착하다', '배달하다'],
  ['능력', '결과', '노력', '실수'],
  ['여행', '일기', '직업', '휴가'],
];

const speak = (text) => {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) {}
};

// ── 공용 소품 ──
const Pill = ({ bg, color, children, style }) => (
  <span style={{ background: bg, color, borderRadius: 999, padding: '8px 12px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', ...style }}>
    {children}
  </span>
);

function WordImage({ word, size = 150 }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: 28, background: '#F8FAFC', overflow: 'hidden', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', flexShrink: 0 }}>
      {/* 원본 에셋 가장자리 잘림이 있어 좌상단 80% 영역만 노출 (피그마 시안과 동일 크롭) */}
      <img
        src={`/word_img/${word}.png`}
        alt={word}
        onError={() => setHidden(true)}
        style={{ width: '125%', height: '125%', objectFit: 'cover', objectPosition: 'top left' }}
      />
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
    if (e.key === 'Backspace' && !pin[i] && e.target.previousElementSibling) {
      e.target.previousElementSibling.focus();
    }
  };
  const submit = () => {
    const cleanName = name.trim();
    const pinStr = pin.join('');
    if (!cleanName) { setError('이름을 입력해 주세요.'); return; }
    if (pinStr.length < 4) { setError('PIN 번호 4자리를 입력해 주세요.'); return; }
    const found = STUDENTS.find((s) => s.name === cleanName || s.name.includes(cleanName) || cleanName.includes(s.name));
    if (found && pinStr !== found.pin && pinStr !== '1234') {
      setError('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
      return;
    }
    const user = { name: found ? found.name : cleanName, level: found ? found.level : '초등단어', guest: !found };
    try {
      localStorage.setItem('english_edu_current_user', JSON.stringify({ name: user.name, studyGradeLevel: user.level }));
    } catch (e) {}
    onLogin(user);
    go('home');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.surface }}>
      <div style={{ background: C.grad, padding: '84px 32px 44px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 150, height: 118 }}>
          <div style={{ position: 'absolute', left: 52, top: 0, width: 92, height: 114, background: '#FFFFFF', borderRadius: 18, transform: 'rotate(8deg)', opacity: 0.55 }} />
          <div style={{ position: 'absolute', left: 10, top: 0, width: 92, height: 114, background: '#FFFFFF', borderRadius: 18, transform: 'rotate(-4deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: C.primary }}>A</span>
          </div>
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.5px' }}>FlipVoca</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#E5EBFF', marginTop: -10 }}>카드를 뒤집으며 외우는 3D 영단어 5,000</div>
      </div>
      <div style={{ padding: '36px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>이름</div>
          <input
            placeholder="이름을 입력하세요"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            style={{ width: '100%', boxSizing: 'border-box', background: C.input, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '16px 18px', fontSize: 15, color: C.text, outline: 'none', fontFamily: FONT }}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>PIN 번호</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <input
                key={i}
                type="password"
                inputMode="numeric"
                value={pin[i]}
                onChange={(e) => setPinAt(i, e.target.value, e.target)}
                onKeyDown={(e) => { onPinKey(i, e); if (e.key === 'Enter') submit(); }}
                style={{ flex: 1, width: '100%', minWidth: 0, height: 58, boxSizing: 'border-box', background: C.input, border: pin[i] ? `2px solid ${C.primary}` : `1.5px solid ${C.border}`, borderRadius: 16, textAlign: 'center', fontSize: 20, fontWeight: 700, color: C.text, outline: 'none', fontFamily: FONT }}
              />
            ))}
          </div>
        </div>
        {error && (
          <div style={{ background: C.redBg, borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: C.red, textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button onClick={submit} style={{ marginTop: 4, background: C.primary, border: 'none', borderRadius: 18, padding: '18px 0', fontSize: 17, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          학습 시작하기 →
        </button>
        <button onClick={() => go('parent')} style={{ background: C.primaryLight, border: 'none', borderRadius: 18, padding: '16px 0', fontSize: 15, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          👨‍👩‍👧 학부모 간편 로그인
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 10, fontSize: 13 }}>
          <span style={{ color: C.sub }}>아직 계정이 없나요?</span>
          <span style={{ color: C.primary, fontWeight: 700, cursor: 'pointer' }}>신규 회원가입</span>
        </div>
      </div>
    </div>
  );
}

// ═══ 02 홈 ═══
function HomeScreen({ go, user }) {
  const menu = [
    ['🃏', '플래시카드', C.primaryLight, 'flashcard'],
    ['📝', '퀴즈', C.amberBg, 'quiz'],
    ['📚', '단어장', '#DEF5EB', 'wordbook'],
    ['❌', '오답노트', '#FCE5EB', 'wordbook'],
    ['📅', '달력', '#E3F0FC', 'calendar'],
    ['📊', '통계·랭킹', '#F2E8FA', 'stats'],
  ];
  return (
    <div style={{ padding: '64px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>안녕, {(user?.name || '상학').replace(/^이|^김|^박/, '')}! 👋</div>
          <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>오늘도 단어 정복하러 가볼까?</div>
        </div>
        <Pill bg={C.amberBg} color={C.amber}>🔥 12일 연속</Pill>
      </div>

      <div style={{ background: C.grad, borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#DEE3FF' }}>DAY 14 · 중등단어</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', marginTop: 4 }}>오늘의 학습 12/30</div>
          </div>
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: C.primaryDeep }}>
            40%
          </div>
        </div>
        <div style={{ height: 10, background: 'rgba(255,255,255,0.3)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '40%', height: '100%', background: '#FFFFFF', borderRadius: 999 }} />
        </div>
        <button onClick={() => go('flashcard')} style={{ background: '#FFFFFF', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          이어서 학습하기 →
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
        <span style={{ fontSize: 22 }}>⏰</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Day 9 복습할 시간이에요</div>
          <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>6일 전 배운 단어 30개 · 5분이면 충분해요</div>
        </div>
        <button onClick={() => go('flashcard')} style={{ background: C.primaryLight, border: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          복습
        </button>
      </div>
    </div>
  );
}

// ═══ 03 플래시카드 ═══
function FlashcardScreen({ go }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(11); // 오늘 완료 수 (12/30에서 시작)
  const w = WORDS[idx % WORDS.length];
  const next = () => {
    setFlipped(false);
    setIdx((p) => p + 1);
    setDone((p) => Math.min(p + 1, 29));
  };
  const face = {
    position: 'absolute', inset: 0, borderRadius: 32, backfaceVisibility: 'hidden',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '48px 24px 40px',
  };
  return (
    <div style={{ padding: '60px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => go('home')} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 18, fontWeight: 700, color: C.text, cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>DAY 14 · 중등단어</div>
          <div style={{ fontSize: 11, color: C.sub }}>플래시카드 학습</div>
        </div>
        <Pill bg={C.primaryLight} color={C.primaryDeep}>{done + 1} / 30</Pill>
      </div>
      <div style={{ height: 8, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${((done + 1) / 30) * 100}%`, height: '100%', background: C.primary, borderRadius: 999, transition: 'width 0.3s' }} />
      </div>

      <div onClick={() => setFlipped(!flipped)} style={{ flex: 1, perspective: 1200, cursor: 'pointer' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 0.5s cubic-bezier(0.4,0.2,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
          {/* 앞면 */}
          <div style={{ ...face, background: C.surface, border: `2px solid ${C.border}` }}>
            <WordImage word={w.word} />
            <Pill bg={C.primaryLight} color={C.primaryDeep} style={{ padding: '6px 12px', fontSize: 11 }}>{w.pos}</Pill>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.text, letterSpacing: '-1px', lineHeight: 1.1, textAlign: 'center' }}>{w.word}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.sub }}>{w.phon}</span>
              <button onClick={(e) => { e.stopPropagation(); speak(w.word); }} style={{ width: 36, height: 36, borderRadius: '50%', background: C.primaryLight, border: 'none', fontSize: 15, cursor: 'pointer' }}>🔊</button>
            </div>
            <div style={{ background: C.primaryLight, borderRadius: 999, padding: '8px 22px', fontSize: 19, fontWeight: 900, color: C.primaryDeep }}>{w.mean}</div>
            <div style={{ width: 60, height: 4, background: C.border, borderRadius: 999 }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: C.sub }}>카드를 탭하면 뜻이 뒤집혀요 👆</div>
          </div>
          {/* 뒷면 */}
          <div style={{ ...face, background: C.grad, transform: 'rotateY(180deg)' }}>
            <Pill bg="rgba(255,255,255,0.22)" color="#FFFFFF" style={{ padding: '6px 12px', fontSize: 11 }}>{w.pos}</Pill>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1px' }}>{w.mean}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#DEE3FF' }}>{w.word}</div>
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 18, padding: '14px 16px', textAlign: 'center', maxWidth: 280 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>&ldquo;{w.example}&rdquo;</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#E5EBFF', marginTop: 6 }}>{w.trans}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#E5EBFF' }}>탭하면 앞면으로 돌아가요 👆</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={next} style={{ flex: 1, background: C.redBg, border: 'none', borderRadius: 18, padding: '16px 0', fontSize: 15, fontWeight: 700, color: C.red, cursor: 'pointer', fontFamily: FONT }}>
          🤔 아직 몰라요
        </button>
        <button onClick={next} style={{ flex: 1, background: C.green, border: 'none', borderRadius: 18, padding: '16px 0', fontSize: 15, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', fontFamily: FONT }}>
          😎 알아요!
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
        {WORDS.map((_, i) => (
          <div key={i} style={{ width: i === idx % WORDS.length ? 18 : 6, height: 6, borderRadius: 999, background: i === idx % WORDS.length ? C.primary : C.border, transition: 'width 0.2s' }} />
        ))}
      </div>
    </div>
  );
}

// ═══ 04 퀴즈 ═══
function QuizScreen({ go }) {
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(60);
  const w = WORDS[qIdx % WORDS.length];
  const opts = QUIZ_OPTS[qIdx % QUIZ_OPTS.length];
  const correctIdx = opts.indexOf(w.mean);
  const answered = picked !== null;
  const pick = (i) => {
    if (answered) return;
    setPicked(i);
    if (i === correctIdx) setScore((s) => s + 10);
  };
  const next = () => { setPicked(null); setQIdx((p) => p + 1); };
  return (
    <div style={{ padding: '60px 20px 28px', display: 'flex', flexDirection: 'column', gap: 18, height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => go('home')} style={{ width: 40, height: 40, borderRadius: '50%', background: C.surface, border: 'none', fontSize: 16, fontWeight: 700, color: C.text, cursor: 'pointer' }}>✕</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900, color: C.text }}>Day 14 퀴즈</div>
        <Pill bg={C.amberBg} color={C.amber}>⭐ {score}점</Pill>
      </div>
      <div style={{ height: 8, background: C.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${(((qIdx % 10) + 7) / 10) * 100}%`, height: '100%', background: C.green, borderRadius: 999 }} />
      </div>

      <div style={{ background: C.surface, borderRadius: 26, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.primary }}>Q{(qIdx % 10) + 7}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.sub }}>다음 단어의 뜻은 무엇일까요?</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: C.text, letterSpacing: '-1px' }}>{w.word}</div>
        <button onClick={() => speak(w.word)} style={{ background: C.primaryLight, border: 'none', borderRadius: 999, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          🔊 발음 듣기
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((opt, i) => {
          const isCorrect = answered && i === correctIdx;
          const isWrongPick = answered && picked === i && i !== correctIdx;
          const bg = isCorrect ? C.greenBg : isWrongPick ? '#FEEDF0' : C.surface;
          const border = isCorrect ? `2px solid ${C.green}` : isWrongPick ? '1.5px solid #F5B2BD' : `1.5px solid ${C.border}`;
          return (
            <button key={i} onClick={() => pick(i)} style={{ background: bg, border, borderRadius: 16, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: answered ? 'default' : 'pointer', fontFamily: FONT }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: isCorrect ? C.green : C.input, color: isCorrect ? '#FFFFFF' : C.sub, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isCorrect ? '✓' : i + 1}
              </span>
              <span style={{ fontSize: 16, fontWeight: isCorrect ? 700 : 500, color: C.text }}>{opt}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: isCorrect ? C.greenDeep : C.red }}>
                {isCorrect ? '정답! +10점' : isWrongPick ? '내가 고른 답' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <button onClick={next} disabled={!answered} style={{ marginTop: 'auto', background: answered ? C.primary : '#C7CAF5', border: 'none', borderRadius: 18, padding: '18px 0', fontSize: 16, fontWeight: 700, color: '#FFFFFF', cursor: answered ? 'pointer' : 'default', fontFamily: FONT }}>
        다음 문제 →
      </button>
    </div>
  );
}

// ═══ 05 단어장 ═══
function WordbookScreen() {
  const [tab, setTab] = useState('전체 단어');
  const [chip, setChip] = useState('전체');
  const list = tab === '오답노트' ? WORDS.filter((w) => w.wrong > 0) : tab === '내 단어장' ? WORDS.filter((w) => w.fav) : WORDS;
  const days = { adventure: 14, brave: 14, challenge: 13, discover: 13, effort: 12, journey: 12 };
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>단어장 📚</div>
      <div style={{ background: '#ECEDF4', borderRadius: 14, padding: 4, display: 'flex', gap: 6 }}>
        {['전체 단어', '내 단어장', '오답노트'].map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? C.surface : 'transparent', border: 'none', borderRadius: 11, padding: '10px 0', fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? C.text : C.sub, cursor: 'pointer', fontFamily: FONT }}>
            {t}
          </button>
        ))}
      </div>
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14 }}>🔍</span>
        <input placeholder="단어를 검색해보세요" style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: C.text, fontFamily: FONT, background: 'transparent' }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['전체', '초등', '중등', '⭐ 즐겨찾기'].map((c) => (
          <button key={c} onClick={() => setChip(c)} style={{ background: chip === c ? C.primary : C.surface, border: chip === c ? 'none' : `1.5px solid ${C.border}`, borderRadius: 999, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: chip === c ? '#FFFFFF' : C.sub, cursor: 'pointer', fontFamily: FONT }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 16 }}>
        {list.map((w) => (
          <div key={w.word} style={{ background: C.surface, borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => speak(w.word)} style={{ width: 38, height: 38, borderRadius: 12, background: C.primaryLight, border: 'none', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>🔊</button>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{w.word}</span>
                {w.wrong > 0 && <Pill bg="#FEEDF0" color={C.red} style={{ padding: '2px 8px', fontSize: 10 }}>오답 {w.wrong}회</Pill>}
              </div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{w.mean} · {w.pos}  ·  Day {days[w.word]}</div>
            </div>
            <span style={{ fontSize: 18, color: w.fav ? C.star : C.border, filter: w.fav ? 'none' : 'grayscale(1) opacity(0.5)' }}>⭐</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ 06 달력 ═══
function CalendarScreen() {
  const checked = [1, 2, 3, 4, 7, 8, 9, 10];
  const today = 11;
  const firstDow = 2; // 2026-09-01 = 화요일
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: 30 }, (_, i) => i + 1)];
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>학습 달력 📅</div>
        <Pill bg={C.amberBg} color={C.amber} style={{ fontSize: 12 }}>🔥 이번 달 18일 학습</Pill>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: '22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 14, color: C.sub, cursor: 'pointer', padding: '0 8px' }}>‹</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: C.text }}>2026년 9월</span>
          <span style={{ fontSize: 14, color: C.sub, cursor: 'pointer', padding: '0 8px' }}>›</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#E85D75' : i === 6 ? '#5B8DEF' : C.sub, padding: '6px 0' }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            const isChecked = d && checked.includes(d);
            const isToday = d === today;
            return (
              <div key={i} style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minHeight: 48 }}>
                {d && (
                  <>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: isToday ? C.primary : isChecked ? '#DEF5EB' : 'transparent', color: isToday ? '#FFFFFF' : isChecked ? '#0B9268' : C.text, fontSize: 13, fontWeight: isToday || isChecked ? 700 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d}
                    </div>
                    {isChecked && <span style={{ fontSize: 9, color: '#0B9268' }}>✓</span>}
                    {isToday && <span style={{ fontSize: 8, fontWeight: 900, color: C.primary }}>오늘</span>}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#DEF5EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>9월 10일 · Day 13 완료</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>30단어 학습 · 퀴즈 93점 · 오답 2개</div>
          </div>
        </div>
        <button style={{ background: C.primaryLight, border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, color: C.primaryDeep, cursor: 'pointer', fontFamily: FONT }}>
          이 날 단어 다시 복습하기
        </button>
      </div>
    </div>
  );
}

// ═══ 07 통계·랭킹 ═══
function StatsScreen() {
  const bars = [
    ['월', 55, false], ['화', 80, false], ['수', 35, false], ['목', 95, false], ['금', 65, false], ['토', 28, false], ['일', 110, true],
  ];
  const rank = [
    ['🥇', '서', '서연', 486, false],
    ['🥈', '상', '상학 (나)', 452, true],
    ['🥉', '민', '민준', 430, false],
    ['4', '지', '지우', 402, false],
  ];
  return (
    <div style={{ padding: '60px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>나의 학습 리포트 📊</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[['1,248', '배운 단어', C.primaryLight, C.primaryDeep], ['92%', '퀴즈 정답률', '#DEF5EB', '#0B9268'], ['12일', '연속 학습', C.amberBg, C.amber]].map(([num, label, bg, color]) => (
          <div key={label} style={{ background: bg, borderRadius: 18, padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color }}>{num}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color, opacity: 0.75, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>이번 주 학습량</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>총 152단어</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, gap: 8 }}>
          {bars.map(([day, h, active]) => (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: '100%', maxWidth: 30, height: h, background: active ? C.primary : C.primaryLight, borderRadius: 8 }} />
              <span style={{ fontSize: 11, fontWeight: active ? 900 : 500, color: active ? C.primary : C.sub }}>{day}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.text }}>🏆 이번 주 랭킹</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.primary, cursor: 'pointer' }}>전체 보기 ›</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rank.map(([medal, initial, name, count, me]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 16, background: me ? C.primaryLight : 'transparent', border: me ? `2px solid ${C.primary}` : '2px solid transparent' }}>
              <span style={{ fontSize: medal.length > 1 ? 13 : 18, fontWeight: 700, color: C.sub, width: 22, textAlign: 'center' }}>{medal}</span>
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
function ParentScreen({ user }) {
  const [toggles, setToggles] = useState([true, true, false]);
  const flip = (i) => setToggles((t) => t.map((v, j) => (j === i ? !v : v)));
  const acts = [
    ['✅', '#DEF5EB', 'Day 14 플래시카드 완료', '오늘 오후 4:32 · 30단어'],
    ['📝', C.amberBg, 'Day 13 퀴즈 93점', '어제 · 오답 2개 자동 저장'],
    ['⏰', '#FCE5EB', '복습 알림 발송됨', '어제 · Day 8 단어 30개'],
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
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{(user?.name || '상학').replace(/^이|^김|^박/, '')} · {user?.level || '중등단어'} 과정</div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>Day 14 진행 중 · 오늘 12단어 학습</div>
          </div>
          <Pill bg="#DEF5EB" color="#0B9268" style={{ fontSize: 11, padding: '6px 10px' }}>● 학습 중</Pill>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.sub }}>이번 주 목표 진행률</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: C.primaryDeep }}>76%</span>
          </div>
          <div style={{ height: 10, background: '#ECEDF4', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '76%', height: '100%', background: C.primary, borderRadius: 999 }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[['152', '이번 주 단어'], ['91%', '평균 정답률'], ['4.2h', '학습 시간']].map(([num, label]) => (
          <div key={label} style={{ background: C.surface, borderRadius: 18, padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{num}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: C.sub, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, borderRadius: 24, padding: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: C.text, marginBottom: 14 }}>최근 활동</div>
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

// ═══ 루트 ═══
export default function ModernStudyV2Page() {
  const [screen, setScreen] = useState('login');
  const [scale, setScale] = useState(1);
  const [user, setUser] = useState(null);
  const go = (s) => setScreen(s);

  // 뷰포트에 맞춰 폰 프레임을 비율 유지한 채 축소 (내부 스크롤·잘림 방지)
  useEffect(() => {
    const fit = () => {
      const s = Math.min(1, (window.innerHeight - 24) / 844, (window.innerWidth - 16) / 390);
      setScale(s);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const navItems = [
    ['🏠', '홈', 'home'],
    ['🃏', '학습', 'flashcard'],
    ['📝', '퀴즈', 'quiz'],
    ['📊', '통계', 'stats'],
    ['👤', 'MY', 'parent'],
  ];
  const showNav = ['home', 'wordbook', 'calendar', 'stats', 'parent'].includes(screen);
  const screens = {
    login: <LoginScreen go={go} onLogin={setUser} />,
    home: <HomeScreen go={go} user={user} />,
    flashcard: <FlashcardScreen go={go} />,
    quiz: <QuizScreen go={go} />,
    wordbook: <WordbookScreen />,
    calendar: <CalendarScreen />,
    stats: <StatsScreen />,
    parent: <ParentScreen user={user} />,
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
              const active = screen === target || (target === 'home' && screen === 'home');
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
