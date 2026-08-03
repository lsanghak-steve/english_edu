const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// env.local 파일 파싱
const envPath = path.join(__dirname, '..', '.env.local');
let supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  });
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key_here') {
  console.error('❌ Supabase Key가 .env.local 파일에 작성되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// wordsData.js 가져오기
const wordsDataPath = path.join(__dirname, '..', 'data', 'wordsData.js');
let wordsData = [];
try {
  const content = fs.readFileSync(wordsDataPath, 'utf8');
  const jsonMatch = content.match(/const wordList500 = (\[[\s\S]*\]);/);
  if (jsonMatch) {
    wordsData = JSON.parse(jsonMatch[1]);
  }
} catch (e) {
  console.error('Failed to parse wordsData.js:', e);
}

async function seedDatabase() {
  console.log(`🚀 Supabase DB로 ${wordsData.length}개 단어 전송을 시작합니다...`);

  // DB 형식 변환
  const dbRows = wordsData.map(item => ({
    word: item.word,
    phonics: item.phonics,
    meaning: item.meaning,
    category: item.category,
    example_en: item.exampleEn,
    example_ko: item.exampleKo,
    image_url: `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${item.word}.png`
  }));

  // 50개씩 배치 전송
  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < dbRows.length; i += batchSize) {
    const batch = dbRows.slice(i, i + batchSize);
    const { data, error } = await supabase.from('words').insert(batch);
    if (error) {
      console.error(`Batch ${i / batchSize + 1} Error:`, error.message);
    } else {
      totalInserted += batch.length;
      console.log(`✅ ${totalInserted} / ${dbRows.length} 개 단어 전송 완료...`);
    }
  }

  console.log(`🎉 축하합니다! 총 ${totalInserted}개 단어가 Supabase 클라우드 데이터베이스에 입력되었습니다!`);
}

seedDatabase();
