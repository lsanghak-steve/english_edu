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

// 오프라인·통신 실패 시 즉시 학습을 이어갈 수 있는 내장 기본 단어 풀 (초·중·고등 50단어)
export const FALLBACK_WORDS = [
  { id: 1, word: 'apple', meaning: '사과', phonics: '/ˈæpəl/', category: '초등단어', grade_level: '초등단어', example_en: 'I eat an apple every morning.', example_ko: '나는 매일 아침 사과를 먹어요.' },
  { id: 2, word: 'banana', meaning: '바나나', phonics: '/bəˈnænə/', category: '초등단어', grade_level: '초등단어', example_en: 'Monkeys like sweet bananas.', example_ko: '원숭이는 달콤한 바나나를 좋아해요.' },
  { id: 3, word: 'orange', meaning: '오렌지', phonics: '/ˈɔːrɪndʒ/', category: '초등단어', grade_level: '초등단어', example_en: 'She drank fresh orange juice.', example_ko: '그녀는 신선한 오렌지 주스를 마셨어요.' },
  { id: 4, word: 'family', meaning: '가족', phonics: '/ˈfæməli/', category: '초등단어', grade_level: '초등단어', example_en: 'I love my happy family.', example_ko: '나는 우리 행복한 가족을 사랑해요.' },
  { id: 5, word: 'friend', meaning: '친구', phonics: '/frend/', category: '초등단어', grade_level: '초등단어', example_en: 'He is my best friend.', example_ko: '그는 나의 가장 친한 친구예요.' },
  { id: 6, word: 'school', meaning: '학교', phonics: '/skuːl/', category: '초등단어', grade_level: '초등단어', example_en: 'We walk to school together.', example_ko: '우리는 함께 학교에 걸어가요.' },
  { id: 7, word: 'teacher', meaning: '선생님', phonics: '/ˈtiːtʃər/', category: '초등단어', grade_level: '초등단어', example_en: 'Our English teacher is very kind.', example_ko: '우리 영어 선생님은 매우 친절하세요.' },
  { id: 8, word: 'water', meaning: '물', phonics: '/ˈwɔːtər/', category: '초등단어', grade_level: '초등단어', example_en: 'Please give me a glass of water.', example_ko: '물 한 잔만 주세요.' },
  { id: 9, word: 'happy', meaning: '행복한', phonics: '/ˈhæpi/', category: '초등단어', grade_level: '초등단어', example_en: 'Music makes me feel happy.', example_ko: '음악은 나를 행복하게 만들어요.' },
  { id: 10, word: 'morning', meaning: '아침', phonics: '/ˈmɔːrnɪŋ/', category: '초등단어', grade_level: '초등단어', example_en: 'Good morning, everyone!', example_ko: '여러분, 좋은 아침이에요!' },
  { id: 11, word: 'book', meaning: '책', phonics: '/bʊk/', category: '초등단어', grade_level: '초등단어', example_en: 'I read an interesting book.', example_ko: '나는 재미있는 책을 읽었어요.' },
  { id: 12, word: 'music', meaning: '음악', phonics: '/ˈmjuːzɪk/', category: '초등단어', grade_level: '초등단어', example_en: 'They listen to classical music.', example_ko: '그들은 클래식 음악을 들어요.' },
  { id: 13, word: 'animal', meaning: '동물', phonics: '/ˈænɪməl/', category: '초등단어', grade_level: '초등단어', example_en: 'The lion is a brave animal.', example_ko: '사자는 용감한 동물이에요.' },
  { id: 14, word: 'garden', meaning: '정원', phonics: '/ˈɡɑːrdn/', category: '초등단어', grade_level: '초등단어', example_en: 'Beautiful flowers grow in the garden.', example_ko: '정원에 아름다운 꽃들이 자라요.' },
  { id: 15, word: 'summer', meaning: '여름', phonics: '/ˈsʌmər/', category: '초등단어', grade_level: '초등단어', example_en: 'We go swimming in summer.', example_ko: '우리는 여름에 수영하러 가요.' },
  { id: 16, word: 'winter', meaning: '겨울', phonics: '/ˈwɪntər/', category: '초등단어', grade_level: '초등단어', example_en: 'White snow falls in winter.', example_ko: '겨울에는 하얀 눈이 내려요.' },
  { id: 17, word: 'library', meaning: '도서관', phonics: '/ˈlaɪbreri/', category: '초등단어', grade_level: '초등단어', example_en: 'Let us study at the library.', example_ko: '도서관에서 함께 공부하자.' },
  { id: 18, word: 'picture', meaning: '그림, 사진', phonics: '/ˈpɪktʃər/', category: '초등단어', grade_level: '초등단어', example_en: 'She drew a nice picture.', example_ko: '그녀는 멋진 그림을 그렸어요.' },
  { id: 19, word: 'holiday', meaning: '휴일, 방학', phonics: '/ˈhɑːlədeɪ/', category: '초등단어', grade_level: '초등단어', example_en: 'Have a wonderful holiday!', example_ko: '즐거운 휴일 보내세요!' },
  { id: 20, word: 'travel', meaning: '여행하다', phonics: '/ˈtrævl/', category: '초등단어', grade_level: '초등단어', example_en: 'I want to travel around the world.', example_ko: '나는 세계 일주를 하고 싶어요.' },
  { id: 21, word: 'achieve', meaning: '성취하다, 이루다', phonics: '/əˈtʃiːv/', category: '중등단어', grade_level: '중등단어', example_en: 'Work hard to achieve your goal.', example_ko: '목표를 이루기 위해 열심히 노력하세요.' },
  { id: 22, word: 'believe', meaning: '믿다', phonics: '/bɪˈliːv/', category: '중등단어', grade_level: '중등단어', example_en: 'Believe in yourself.', example_ko: '자기 자신을 믿으세요.' },
  { id: 23, word: 'culture', meaning: '문화', phonics: '/ˈkʌltʃər/', category: '중등단어', grade_level: '중등단어', example_en: 'Every country has a unique culture.', example_ko: '모든 나라는 고유한 문화를 가지고 있어요.' },
  { id: 24, word: 'decide', meaning: '결정하다', phonics: '/dɪˈsaɪd/', category: '중등단어', grade_level: '중등단어', example_en: 'They decided to help each other.', example_ko: '그들은 서로 돕기로 결정했어요.' },
  { id: 25, word: 'environment', meaning: '환경', phonics: '/ɪnˈvaɪrənmənt/', category: '중등단어', grade_level: '중등단어', example_en: 'We must protect the natural environment.', example_ko: '우리는 자연환경을 보호해야 합니다.' },
  { id: 26, word: 'experience', meaning: '경험', phonics: '/ɪkˈspɪriəns/', category: '중등단어', grade_level: '중등단어', example_en: 'Reading gives us great experience.', example_ko: '독서는 우리에게 훌륭한 경험을 줍니다.' },
  { id: 27, word: 'future', meaning: '미래', phonics: '/ˈfjuːtʃər/', category: '중등단어', grade_level: '중등단어', example_en: 'Prepare for a bright future.', example_ko: '밝은 미래를 준비하세요.' },
  { id: 28, word: 'government', meaning: '정부', phonics: '/ˈɡʌvərnmənt/', category: '중등단어', grade_level: '중등단어', example_en: 'The government announced a new plan.', example_ko: '정부가 새로운 계획을 발표했어요.' },
  { id: 29, word: 'history', meaning: '역사', phonics: '/ˈhɪstəri/', category: '중등단어', grade_level: '중등단어', example_en: 'We learn wisdom from history.', example_ko: '우리는 역사에서 지혜를 배웁니다.' },
  { id: 30, word: 'improve', meaning: '향상시키다', phonics: '/ɪmˈpruːv/', category: '중등단어', grade_level: '중등단어', example_en: 'Daily practice will improve your English.', example_ko: '매일 연습하면 영어 실력이 향상될 거예요.' },
  { id: 31, word: 'knowledge', meaning: '지식', phonics: '/ˈnɑːlɪdʒ/', category: '중등단어', grade_level: '중등단어', example_en: 'Knowledge is power.', example_ko: '아는 것이 힘이다.' },
  { id: 32, word: 'language', meaning: '언어', phonics: '/ˈlæŋɡwɪdʒ/', category: '중등단어', grade_level: '중등단어', example_en: 'English is a global language.', example_ko: '영어는 세계 공용어입니다.' },
  { id: 33, word: 'medicine', meaning: '약, 의학', phonics: '/ˈmedɪsn/', category: '중등단어', grade_level: '중등단어', example_en: 'Take this medicine after meals.', example_ko: '식후에 이 약을 드세요.' },
  { id: 34, word: 'nature', meaning: '자연', phonics: '/ˈneɪtʃər/', category: '중등단어', grade_level: '중등단어', example_en: 'We enjoyed the beauty of nature.', example_ko: '우리는 자연의 아름다움을 만끽했어요.' },
  { id: 35, word: 'opinion', meaning: '의견', phonics: '/əˈpɪnjən/', category: '중등단어', grade_level: '중등단어', example_en: 'Please share your honest opinion.', example_ko: '솔직한 의견을 나누어 주세요.' },
  { id: 36, word: 'patient', meaning: '참을성 있는, 환자', phonics: '/ˈpeɪʃnt/', category: '중등단어', grade_level: '중등단어', example_en: 'Be patient and keep trying.', example_ko: '인내심을 갖고 계속 도전하세요.' },
  { id: 37, word: 'quality', meaning: '품질, 질', phonics: '/ˈkwɑːləti/', category: '중등단어', grade_level: '중등단어', example_en: 'This product has high quality.', example_ko: '이 제품은 품질이 뛰어납니다.' },
  { id: 38, word: 'respect', meaning: '존중하다, 존경', phonics: '/rɪˈspekt/', category: '중등단어', grade_level: '중등단어', example_en: 'Respect other people and their ideas.', example_ko: '다른 사람들과 그들의 생각을 존중하세요.' },
  { id: 39, word: 'science', meaning: '과학', phonics: '/ˈsaɪəns/', category: '중등단어', grade_level: '중등단어', example_en: 'Science changes our daily lives.', example_ko: '과학은 우리의 일상을 변화시킵니다.' },
  { id: 40, word: 'tradition', meaning: '전통', phonics: '/trəˈdɪʃn/', category: '중등단어', grade_level: '중등단어', example_en: 'They keep their old tradition alive.', example_ko: '그들은 오랜 전통을 이어가고 있어요.' },
  { id: 41, word: 'abundant', meaning: '풍부한', phonics: '/əˈbʌndənt/', category: '고등단어', grade_level: '고등단어', example_en: 'The region is abundant in natural resources.', example_ko: '그 지역은 천연자원이 풍부합니다.' },
  { id: 42, word: 'beneficial', meaning: '유익한, 이로운', phonics: '/ˌbenɪˈfɪʃl/', category: '고등단어', grade_level: '고등단어', example_en: 'Regular exercise is beneficial to health.', example_ko: '규칙적인 운동은 건강에 유익합니다.' },
  { id: 43, word: 'comprehensive', meaning: '포괄적인, 종합적인', phonics: '/ˌkɑːmprɪˈhensɪv/', category: '고등단어', grade_level: '고등단어', example_en: 'We need a comprehensive review.', example_ko: '우리는 종합적인 복습이 필요합니다.' },
  { id: 44, word: 'determine', meaning: '결정하다, 결심하다', phonics: '/dɪˈtɜːrmɪn/', category: '고등단어', grade_level: '고등단어', example_en: 'Your attitude determines your success.', example_ko: '당신의 태도가 성공을 결정합니다.' },
  { id: 45, word: 'essential', meaning: '필수적인', phonics: '/ɪˈsenʃl/', category: '고등단어', grade_level: '고등단어', example_en: 'Water is essential for all living things.', example_ko: '물은 모든 생명체에게 필수적입니다.' },
  { id: 46, word: 'fundamental', meaning: '근본적인, 핵심의', phonics: '/ˌfʌndəˈmentl/', category: '고등단어', grade_level: '고등단어', example_en: 'Honesty is a fundamental value.', example_ko: '정직은 근본적인 가치입니다.' },
  { id: 47, word: 'generate', meaning: '생성하다, 만들어내다', phonics: '/ˈdʒenəreɪt/', category: '고등단어', grade_level: '고등단어', example_en: 'Solar panels generate clean electricity.', example_ko: '태양광 패널은 깨끗한 전기를 생성합니다.' },
  { id: 48, word: 'hypothesis', meaning: '가설', phonics: '/haɪˈpɑːθəsɪs/', category: '고등단어', grade_level: '고등단어', example_en: 'The scientist tested the hypothesis.', example_ko: '과학자는 그 가설을 검증했습니다.' },
  { id: 49, word: 'inevitable', meaning: '불가피한, 필연적인', phonics: '/ɪnˈevɪtəbl/', category: '고등단어', grade_level: '고등단어', example_en: 'Change is an inevitable part of life.', example_ko: '변화는 삶의 불가피한 일부입니다.' },
  { id: 50, word: 'perspective', meaning: '관점, 시각', phonics: '/pərˈspektɪv/', category: '고등단어', grade_level: '고등단어', example_en: 'Travel broadens our perspective.', example_ko: '여행은 우리의 시각을 넓혀 줍니다.' },
];

export function getFallbackWordsForLevel(level, daily = 20) {
  const count = parseInt(daily || 20, 10) || 20;
  const lv = level || '중등단어';
  const filtered = lv !== '전체'
    ? FALLBACK_WORDS.filter((w) => w.category === lv || w.grade_level === lv)
    : FALLBACK_WORDS;
  const pool = filtered.length >= count ? filtered : [...filtered, ...FALLBACK_WORDS.filter((w) => !filtered.includes(w))];
  return { words: pool.slice(0, count), pool };
}

// ── 단어 로딩: 레벨 필터 → 미학습 우선 → 일일 목표 수만큼 (msv1 §단어 배정 로직 이식 + 오프라인 폴백) ──
export async function loadWordsForUser(user) {
  const level = user?.level || '중등단어';
  const daily = parseInt(user?.daily || 20, 10) || 20;
  let pool = [];
  let loadError = false;
  try {
    let q = supabase.from('words').select('*').not('word', 'ilike', 'cornell');
    if (level && level !== '전체') {
      q = q.or(`category.eq.${level},grade_level.eq.${level},grade_level_ko.eq.${level}`);
    }
    const { data, error } = await q.order('id', { ascending: true }).limit(5000);
    if (error) loadError = true;
    if (data && data.length) pool = data;
  } catch (e) {
    loadError = true;
  }
  if (!pool.length) {
    try {
      const { data, error } = await supabase.from('words').select('*').not('word', 'ilike', 'cornell').limit(5000);
      if (error) loadError = true;
      if (data && data.length) {
        pool = data;
        loadError = false;
      }
    } catch (e) {
      loadError = true;
    }
  }

  let usedFallback = false;
  if (!pool.length) {
    usedFallback = true;
    const fb = getFallbackWordsForLevel(level, daily);
    pool = fb.pool;
  }

  const learned = new Set();
  try {
    const { data } = await supabase.from('student_learned_words').select('word').eq('student_id', user?.id);
    (data || []).forEach((r) => learned.add((r.word || '').toLowerCase().trim()));
  } catch (e) {}

  const today = localDateStr();
  let selectedWords = null;
  if (user?.id && typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem(`daily_random_set_${user.id}_${today}`) || localStorage.getItem(`daily_set_${user.id}_${today}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length === daily) {
          selectedWords = parsed;
        }
      }
    } catch (e) {}
  }
  if (!selectedWords) {
    const fresh = pool.filter((w) => !learned.has((w.word || '').toLowerCase().trim()));
    const base = fresh.length ? fresh : pool;
    selectedWords = shuffle(base).slice(0, daily);
    if (user?.id && selectedWords.length && !usedFallback && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`daily_random_set_${user.id}_${today}`, JSON.stringify(selectedWords));
        localStorage.setItem(`daily_set_${user.id}_${today}`, JSON.stringify(selectedWords));
      } catch (e) {}
    }
  }
  return { words: selectedWords, pool, learnedCount: learned.size, learnedWords: Array.from(learned), usedFallback, loadError };
}

// ── 학습 완료 단어 일괄 저장 (msv1 payload 형식 그대로, 중복 제거·보충 날짜 지정 및 에러 감지 지원) ──
export async function saveLearnedWords(user, words, dateKey) {
  if (!user?.id || !words?.length) return false;
  try {
    const learnedAt = dateKey ? `${dateKey}T12:00:00.000Z` : new Date().toISOString();
    const seen = new Set();
    const uniqueWords = words.filter((w) => {
      const k = (w?.word || '').replace(/\.png/gi, '').trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (!uniqueWords.length) return true;
    const payload = uniqueWords.map((w) => ({
      student_id: user.id,
      word: (w.word || '').replace(/\.png/gi, '').trim(),
      meaning: w.meaning || '',
      learned_at: learnedAt,
    }));
    const res = await supabase.from('student_learned_words').insert(payload);
    if (res && res.error) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// ── 출석 도장: 있으면 update, 없으면 insert (DB 에러 명시적 검증) ──
export async function stampAttendance(user, dateKey = localDateStr()) {
  if (!user?.id) return false;
  try {
    const { data: existing, error: selErr } = await supabase
      .from('study_records').select('id')
      .eq('student_id', user.id).eq('study_date', dateKey).limit(1);
    if (selErr) return false;
    if (existing && existing.length) {
      const { error: updErr } = await supabase.from('study_records').update({ is_stamped: true }).eq('id', existing[0].id);
      if (updErr) return false;
    } else {
      const { error: insErr } = await supabase.from('study_records').insert([{ student_id: user.id, study_date: dateKey, is_stamped: true }]);
      if (insErr) return false;
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
  const merged = [];
  const seen = new Set();
  const addList = (arr) => {
    if (!Array.isArray(arr)) return;
    for (const r of arr) {
      const k = (r?.word || '').replace(/\.png/gi, '').trim().toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      merged.push(r);
    }
  };
  try {
    const keys = [
      `today_all_learned_${user.id}_${dateStr}`,
      `stamped_words_${user.id}_${dateStr}`,
    ];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (raw) addList(JSON.parse(raw));
    }
  } catch (e) {}
  try {
    const { data } = await supabase.from('student_learned_words')
      .select('word, meaning, learned_at')
      .eq('student_id', user.id)
      .gte('learned_at', `${dateStr}T00:00:00`)
      .lte('learned_at', `${dateStr}T23:59:59`);
    if (data && data.length) addList(data);
  } catch (e) {}
  if (merged.length) return merged;
  try {
    const cached = localStorage.getItem(`daily_set_${user.id}_${dateStr}`) || localStorage.getItem(`daily_random_set_${user.id}_${dateStr}`);
    if (cached) addList(JSON.parse(cached));
  } catch (e) {}
  return merged;
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

// ── 발음 유사도 채점 (미인식·무관 발음과 실제 유사 발음 구분) ──
const phonemeNorm = (s) =>
  s.toLowerCase().replace(/[^a-z]/g, '')
    .replace(/ph/g, 'f').replace(/ck/g, 'k').replace(/c(?=[eiy])/g, 's')
    .replace(/th/g, 't').replace(/c/g, 'k').replace(/q/g, 'k')
    .replace(/z/g, 's').replace(/x/g, 'ks').replace(/v/g, 'b').replace(/r/g, 'l')
    .replace(/[aeiouy]+/g, 'a');

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
  if (!t || !r) return 0; // 미인식·무음 입력은 0점 (불합격 처리)
  if (t === r) return 100;
  const tClean = t.replace(/\s/g, '');
  const rClean = r.replace(/\s/g, '');
  if (!tClean || !rClean) return 0;
  if (tClean === rClean) return 100;
  if (tClean.length >= 2 && rClean.includes(tClean)) return 98; // "the apple" 류 포함 관계 관용 인정
  if (rClean.length >= Math.max(2, Math.ceil(tClean.length * 0.65)) && tClean.includes(rClean)) return 92;
  const normT = phonemeNorm(tClean);
  const normR = phonemeNorm(rClean);
  if (normT && normT === normR) return 95; // c/k, r/l 등 음운 변이 인정
  const d = levenshtein(tClean, rClean);
  const maxLen = Math.max(tClean.length, rClean.length, 1);
  const similarity = Math.max(0, (maxLen - d) / maxLen);
  const normD = levenshtein(normT, normR);
  const normMaxLen = Math.max(normT.length, normR.length, 1);
  const normSimilarity = Math.max(0, (normMaxLen - normD) / normMaxLen);
  const bestRatio = Math.max(similarity, normSimilarity * 0.95);
  return Math.max(10, Math.min(100, Math.round(bestRatio * 100)));
}

// ── 발음 교정 팁 (msv1 getAIPronunciationGuideTip 한국어판, 미인식·재도전·합격 구분) ──
export function pronTip(word, score) {
  const w = (word || '').toLowerCase();
  if (score === 0) {
    return { icon: '🎙️', grade: '미인식', text: `[${word}] 음성이 인식되지 않았어요. 마이크 가까이에서 또박또박 다시 발음해 보세요!`, tone: 'amber' };
  }
  if (score >= 80) return { icon: '🎉', grade: '원어민급', text: `[${word}] 원어민 수준의 완벽한 발음이에요! 억양도 아주 자연스러워요. 👏`, tone: 'green' };
  let hint = '원어민 소리를 듣고 강세에 맞춰 또박또박 발음해 보세요.';
  if (/r/.test(w) && /l/.test(w)) hint = 'R은 혀를 말아 올리고, L은 혀끝을 윗니 뒤에 붙여요.';
  else if (/r/.test(w)) hint = 'R은 혀끝을 입천장에 대지 않고 안쪽으로 살짝 말아 소리내요.';
  else if (/l/.test(w)) hint = 'L은 혀끝을 윗니 바로 뒤 입천장에 꾹 대었다가 떼며 소리내요.';
  else if (/th/.test(w)) hint = 'TH는 혀끝을 이 사이에 살짝 물고 바람을 내보내요.';
  else if (/v|f/.test(w)) hint = 'V·F는 윗니를 아랫입술에 살짝 대고 소리내요.';
  else if (/sh|ch/.test(w)) hint = 'SH는 입술을 둥글게, CH는 혀로 입천장을 쳐요.';
  if (score >= 55) {
    return { icon: '👍', grade: '합격', text: `[${word}] ${score}점 합격! ${hint} 🌟`, tone: 'green' };
  }
  return { icon: '💡', grade: '재도전', text: `[${word}] ${score}점 · 조금만 더! ${hint}`, tone: 'amber' };
}

