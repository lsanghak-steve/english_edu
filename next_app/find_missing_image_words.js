const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. 로컬 이미지 파일 목록 수집 및 정규화 Set 생성
function getLocalImageSet() {
  const imgDir = path.join(__dirname, 'public', 'word_img');
  if (!fs.existsSync(imgDir)) {
    console.error('❌ word_img 폴더가 존재하지 않습니다:', imgDir);
    return new Set();
  }

  const files = fs.readdirSync(imgDir);
  const normalizedSet = new Set();

  files.forEach(f => {
    if (!f.endsWith('.png') || f.startsWith('_')) return;
    const base = f.replace('.png', '').trim().toLowerCase();
    normalizedSet.add(base);
    // 띄어쓰기나 하이픈, 언더바 변형도 함께 추가
    normalizedSet.add(base.replace(/[\s\-_]/g, ''));
  });

  return { set: normalizedSet, totalFiles: files.length };
}

async function analyzeMissingWords() {
  console.log('====================================================');
  console.log('🔍 [미보유 이미지 단어 전수 분석 시작]');
  console.log('====================================================\n');

  const { set: localImages, totalFiles } = getLocalImageSet();
  console.log(`📁 로컬 word_img 폴더 내 이미지 파일 총: ${totalFiles}개\n`);

  // 2. Supabase DB의 5,000개 전체 단어 조회
  const { data: dbWords, error } = await supabase
    .from('words')
    .select('id, word, meaning, grade_level, category')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ Supabase 단어 조회 실패:', error.message);
    return;
  }

  console.log(`🗄️ Supabase DB 등록 단어 총: ${dbWords.length}개\n`);

  const missingList = [];
  const existingList = [];

  const gradeStats = {
    '초등단어': { total: 0, exist: 0, missing: 0 },
    '중등단어': { total: 0, exist: 0, missing: 0 },
    '고등단어': { total: 0, exist: 0, missing: 0 },
    '기타': { total: 0, exist: 0, missing: 0 }
  };

  dbWords.forEach(w => {
    const rawWord = (w.word || '').trim();
    const cleanWord = rawWord.toLowerCase();
    const cleanNoSpace = cleanWord.replace(/[\s\-_]/g, '');

    const grade = w.grade_level || (w.category && w.category.includes('초등') ? '초등단어' : (w.category && w.category.includes('중등') ? '중등단어' : '고등단어')) || '기타';
    if (!gradeStats[grade]) gradeStats[grade] = { total: 0, exist: 0, missing: 0 };
    gradeStats[grade].total++;

    const hasImage = localImages.has(cleanWord) || localImages.has(cleanNoSpace);

    if (hasImage) {
      existingList.push(w);
      gradeStats[grade].exist++;
    } else {
      missingList.push({
        id: w.id,
        word: rawWord,
        meaning: w.meaning,
        grade: grade,
        category: w.category
      });
      gradeStats[grade].missing++;
    }
  });

  console.log('----------------------------------------------------');
  console.log('📊 [레벨별 이미지 보유율 통계]');
  console.log('----------------------------------------------------');
  for (const [grade, stat] of Object.entries(gradeStats)) {
    const rate = stat.total > 0 ? ((stat.exist / stat.total) * 100).toFixed(1) : 0;
    console.log(`  * ${grade.padEnd(8)}: 총 ${stat.total}개 중 보유 ${stat.exist}개 | ❌ 미보유 ${stat.missing}개 (${rate}% 보유)`);
  }
  console.log('----------------------------------------------------');
  const totalRate = ((existingList.length / dbWords.length) * 100).toFixed(1);
  console.log(`🏆 전체 종합: 총 ${dbWords.length}개 중 보유 ${existingList.length}개 | ❌ 미보유 ${missingList.length}개 (${totalRate}% 보유)\n`);

  // 3. 미보유 단어 목록 출력 및 파일 저장
  console.log(`📋 미보유 단어 샘플 (총 ${missingList.length}개 중 최대 30개):`);
  missingList.slice(0, 30).forEach((m, idx) => {
    console.log(`  [${idx + 1}] ID:${m.id} | ${m.word.padEnd(15)} | 뜻: ${m.meaning} (${m.grade})`);
  });

  // 미보유 단어 상세 리포트 JSON 및 Markdown 생성
  const reportPath = path.join(__dirname, 'missing_image_words_report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalWords: dbWords.length,
      existingCount: existingList.length,
      missingCount: missingList.length,
      coverageRate: `${totalRate}%`,
      gradeStats: gradeStats
    },
    missingWords: missingList
  }, null, 2), 'utf8');

  console.log(`\n💾 미보유 단어 상세 분석 파일 저장 완료: ${reportPath}`);
}

analyzeMissingWords();
