const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const rootDir = path.join(__dirname, '..');
const imgDir = path.join(rootDir, 'next_app', 'public', 'word_img');

if (!fs.existsSync(imgDir)) {
  fs.mkdirSync(imgDir, { recursive: true });
}

const existingFiles = new Set(fs.readdirSync(imgDir).map(f => f.toLowerCase()));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const themes = [
  { bg: '#EBF5FB', cardBg: '#FFFFFF', color: '#2980B9', accent: '#3498DB' },
  { bg: '#FEF5E7', cardBg: '#FFFFFF', color: '#D35400', accent: '#E67E22' },
  { bg: '#E8F8F5', cardBg: '#FFFFFF', color: '#16A085', accent: '#2ECC71' },
  { bg: '#F5EEF8', cardBg: '#FFFFFF', color: '#8E44AD', accent: '#9B59B6' },
  { bg: '#FDEDEC', cardBg: '#FFFFFF', color: '#C0392B', accent: '#E74C3C' },
  { bg: '#EAEDED', cardBg: '#FFFFFF', color: '#2C3E50', accent: '#7F8C8D' }
];

async function uploadMiddleSchoolWords() {
  try {
    const jsonPath = path.join(rootDir, 'middle_school_words.json');
    let rawData = fs.readFileSync(jsonPath, 'utf-8').replace(/^\uFEFF/, '').trim();
    const wordList = JSON.parse(rawData);

    console.log(`📌 1. 1,200개 중등 단어 이미지 카드 점검 및 생성 시작...`);
    let newImgCount = 0;

    wordList.forEach((item, idx) => {
      const wordClean = (item.word || '').replace(/\.png/gi, '').trim();
      if (!wordClean) return;

      const wordLower = wordClean.toLowerCase();
      const wordCap = wordClean.charAt(0).toUpperCase() + wordClean.slice(1);
      const altUnder = wordLower.replace(/\s+/g, '_');
      const altNoSpace = wordLower.replace(/[\s_]+/g, '');

      const hasImage = existingFiles.has(wordLower + '.png') ||
                       existingFiles.has(altUnder + '.png') ||
                       existingFiles.has(altNoSpace + '.png') ||
                       existingFiles.has(wordLower + '.jpg');

      if (!hasImage) {
        const theme = themes[idx % themes.length];
        const firstLetter = wordCap.charAt(0).toUpperCase();

        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <rect width="100%" height="100%" rx="32" fill="${theme.bg}"/>
  <circle cx="150" cy="130" r="85" fill="${theme.cardBg}" stroke="${theme.bg}" stroke-width="4"/>
  <text x="150" y="152" font-family="'Segoe UI', Roboto, sans-serif" font-size="80" font-weight="900" fill="${theme.accent}" text-anchor="middle">${firstLetter}</text>
  <text x="150" y="250" font-family="'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="${theme.color}" text-anchor="middle">${wordCap}</text>
</svg>`.trim();

        const fileName = `${wordCap}.png`;
        fs.writeFileSync(path.join(imgDir, fileName), svgContent, 'utf8');
        existingFiles.add(wordLower + '.png');
        newImgCount++;
      }
    });

    console.log(`✅ 중등 단어 이미지 카드 ${newImgCount}개 신규 생성 완료!`);

    console.log(`\n🚀 2. 총 ${wordList.length}개 중등 단어 Supabase DB 'words' 테이블 업로드 시작...`);

    const formattedPayload = wordList.map((item, idx) => ({
      id: 1000 + (item.id || idx + 1), // 1001 ~ 2200
      word: (item.word || '').replace(/\.png/gi, '').trim(),
      phonics: item.phonics || '',
      meaning: item.meaning || '',
      category: item.category ? (item.category.startsWith('중등') ? item.category : `중등 - ${item.category}`) : '중등단어',
      example_en: item.example_en || '',
      example_ko: item.example_ko || ''
    }));

    const chunkSize = 100;
    let successCount = 0;

    for (let i = 0; i < formattedPayload.length; i += chunkSize) {
      const chunk = formattedPayload.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('words').upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error(`❌ ${i + 1}~${i + chunk.length} 중등 단어 DB 업로드 실패:`, error.message);
      } else {
        successCount += chunk.length;
        console.log(`✅ ${i + 1}~${i + chunk.length} 중등 단어 DB 업로드 성공!`);
      }
    }

    console.log(`\n🎉 [성공!] 총 ${successCount}개 중등 필수 영단어가 Supabase DB 'words' 테이블에 완벽히 저장되었습니다!`);
  } catch (e) {
    console.error('중등 단어 업로드 중 예외 발생:', e);
  }
}

uploadMiddleSchoolWords();
