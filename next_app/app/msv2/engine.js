'use client';

// ═══════════════════════════════════════════════════════════════
// msv2 엔진 — msv1·1세대(/)에서 이식한 데이터·채점 계층
// 테이블: words / student_learned_words / study_records / students
// ═══════════════════════════════════════════════════════════════

import supabase from '../../lib/supabaseClient.js';

// 등록 학생 (modern-login defaultStudents 와 동일)
export const STUDENTS = [
  { id: 'lsh_20260807_000001', name: '이상학', pin: '0815', level: '중등단어', daily: 20 },
  { id: 'lsh_20260807_000002', name: '이승현', pin: '0418', level: '초등단어', daily: 10 },
  { id: 'lsm_20260807_000003', name: '이수민', pin: '0809', level: '초등단어', daily: 10 },
  { id: 'pjh_20260807_000004', name: '박재현', pin: '1234', level: '초등단어', daily: 10 },
  { id: 'kmc_20260807_000005', name: '김민채', pin: '1234', level: '초등단어', daily: 10 },
];

export const localDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── 단어 로딩: 레벨 필터 → 미학습 우선 → 일일 목표 수만큼 (msv1 §단어 배정 로직 이식) ──
export async function loadWordsForUser(user) {
  const level = user?.level || '중등단어';
  const daily = parseInt(user?.daily || 20, 10) || 20;
  let pool = [];
  try {
    let q = supabase.from('words').select('*');
    if (level && level !== '전체') {
      q = q.or(`category.eq.${level},grade_level.eq.${level},grade_level_ko.eq.${level}`);
    }
    const { data } = await q.order('id', { ascending: true }).limit(500);
    if (data && data.length) pool = data;
  } catch (e) {}
  if (!pool.length) {
    try {
      const { data } = await supabase.from('words').select('*').limit(300);
      if (data && data.length) pool = data;
    } catch (e) {}
  }

  const learned = new Set();
  try {
    const { data } = await supabase.from('student_learned_words').select('word').eq('student_id', user.id);
    (data || []).forEach((r) => learned.add((r.word || '').toLowerCase().trim()));
  } catch (e) {}

  const fresh = pool.filter((w) => !learned.has((w.word || '').toLowerCase().trim()));
  const base = fresh.length ? fresh : pool;
  return { words: shuffle(base).slice(0, daily), pool, learnedCount: learned.size };
}

// ── 학습 완료 단어 일괄 저장 (msv1 payload 형식 그대로) ──
export async function saveLearnedWords(user, words) {
  if (!user?.id || !words?.length) return;
  try {
    const payload = words.map((w) => ({
      student_id: user.id,
      word: (w.word || '').replace(/\.png/gi, '').trim(),
      meaning: w.meaning || '',
      learned_at: new Date().toISOString(),
    }));
    await supabase.from('student_learned_words').insert(payload);
  } catch (e) {}
}

// ── 출석 도장: 있으면 update, 없으면 insert (msv1 로직 그대로) ──
export async function stampAttendance(user, dateKey = localDateStr()) {
  if (!user?.id) return false;
  try {
    const { data: existing } = await supabase
      .from('study_records').select('id')
      .eq('student_id', user.id).eq('study_date', dateKey).limit(1);
    if (existing && existing.length) {
      await supabase.from('study_records').update({ is_stamped: true }).eq('id', existing[0].id);
    } else {
      await supabase.from('study_records').insert([{ student_id: user.id, study_date: dateKey, is_stamped: true }]);
    }
    return true;
  } catch (e) { return false; }
}

export async function fetchStamps(user) {
  if (!user?.id) return [];
  try {
    const { data } = await supabase.from('study_records')
      .select('study_date, is_stamped').eq('student_id', user.id);
    return (data || []).filter((r) => r.is_stamped).map((r) => String(r.study_date).slice(0, 10));
  } catch (e) { return []; }
}

export async function fetchWordsOfDate(user, dateStr) {
  if (!user?.id) return [];
  try {
    const { data } = await supabase.from('student_learned_words')
      .select('word, meaning, learned_at')
      .eq('student_id', user.id)
      .gte('learned_at', `${dateStr}T00:00:00`)
      .lte('learned_at', `${dateStr}T23:59:59`);
    return data || [];
  } catch (e) { return []; }
}

// ── 프로필 저장 (msv1: students 테이블 update) ──
export async function updateProfile(user, { level, daily }) {
  try {
    const patch = { study_grade_level: level, daily_word_count: parseInt(daily, 10) };
    const r1 = await supabase.from('students').update(patch).eq('student_id', user.id);
    if (r1.error) await supabase.from('students').update(patch).eq('id', user.id);
  } catch (e) {}
}

// ── 단어 보조 필드 (msv1 헬퍼 이식, 한국어 고정) ──
export const wordMeaning = (w) => (w ? w.meaning || '' : '');
export const wordExample = (w) => ({
  en: (w && (w.example_en || w.exampleEn)) || 'I love learning new words.',
  ko: (w && (w.example_ko || w.exampleKo)) || '나는 새로운 단어를 배우는 것을 좋아해요.',
});
export const wordImgSrc = (w) => {
  if (!w) return '/word_img/apple.png';
  const raw = (w.image_url || w.imageUrl || '').split('/').pop().trim();
  if (raw && raw.toLowerCase().endsWith('.png')) return `/word_img/${raw.toLowerCase().replace(/\s+/g, '_')}`;
  const clean = (w.word || '').replace(/\.png/gi, '').trim().toLowerCase().replace(/\s+/g, '_');
  return clean ? `/word_img/${clean}.png` : '/word_img/apple.png';
};

// ── 발음 유사도 채점 (1세대 / 의 관용 알고리즘 이식) ──
const phonemeNorm = (s) =>
  s.toLowerCase().replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f').replace(/th/g, 't').replace(/c/g, 'k')
    .replace(/z/g, 's').replace(/v/g, 'b').replace(/r/g, 'l')
    .replace(/[aeiou]+/g, 'a');

const levenshtein = (a, b) => {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[m][n];
};

export function pronScore(target, recognized) {
  const t = (target || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const r = (recognized || '').toLowerCase().replace(/[^a-z\s]/g, '').trim();
  if (!r) return 60; // 마이크 입력만으로도 기본 격려 점수
  if (t === r) return 100;
  if (r.includes(t) || t.includes(r)) return 98; // "the apple" 류 포함 관계 관용 인정
  if (phonemeNorm(t) === phonemeNorm(r)) return 95; // c/k, r/l 등 음운 변이 인정
  const d = levenshtein(t.replace(/\s/g, ''), r.replace(/\s/g, ''));
  const maxLen = Math.max(t.length, r.length, 1);
  return Math.max(60, Math.round(100 - (d / maxLen) * 80));
}

// ── 발음 교정 팁 (msv1 getAIPronunciationGuideTip 축약 한국어판) ──
export function pronTip(word, score) {
  const w = (word || '').toLowerCase();
  if (score >= 80) return { icon: '🎉', grade: '원어민급', text: `[${word}] 원어민 수준의 완벽한 발음이에요! 억양도 아주 자연스러워요. 👏`, tone: 'green' };
  if (score >= 55) {
    let hint = '또박또박한 발음이 좋아요. 계속 유지해요!';
    if (/r/.test(w) && /l/.test(w)) hint = 'R은 혀를 말아 올리고, L은 혀끝을 윗니 뒤에 붙여요.';
    else if (/th/.test(w)) hint = 'TH는 혀끝을 이 사이에 살짝 물고 바람을 내보내요.';
    else if (/v|f/.test(w)) hint = 'V·F는 윗니를 아랫입술에 살짝 대고 소리내요.';
    else if (/sh|ch/.test(w)) hint = 'SH는 입술을 둥글게, CH는 혀로 입천장을 쳐요.';
    return { icon: '👍', grade: '합격', text: `[${word}] 55점 합격! ${hint} 🌟`, tone: 'green' };
  }
  return { icon: '💡', grade: '연습', text: `[${word}] 조금만 더! 원어민 소리를 듣고 천천히 따라 말해 보세요.`, tone: 'amber' };
}
