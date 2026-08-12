const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * [upload_800_words_to_supabase.js 한 줄 요약]
 * parsed_800_words.json에서 파싱된 800개 초등 단어 데이터를 Supabase DB words 테이블에 실시간으로 업로드(upsert)합니다.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function upload800Words() {
  try {
    let rawData = fs.readFileSync(path.join(__dirname, 'parsed_800_words.json'), 'utf-8');
    rawData = rawData.replace(/^\uFEFF/, '');
    const wordList = JSON.parse(rawData);
    console.log(`🚀 총 ${wordList.length}개 초등 단어 Supabase DB 업로드 시작...`);


    const formattedPayload = wordList.map(item => ({
      id: item.id,
      word: item.word,
      phonics: item.phonics || '',
      meaning: item.meaning,
      category: item.category || '초등단어',
      example_en: item.exampleEn || '',
      example_ko: item.exampleKo || '',
    }));


    // 100개씩 청크 분할 업로드
    const chunkSize = 100;
    let successCount = 0;

    for (let i = 0; i < formattedPayload.length; i += chunkSize) {
      const chunk = formattedPayload.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('words').upsert(chunk, { onConflict: 'id' });

      if (error) {
        console.error(`❌ ${i + 1}~${i + chunk.length} 단어 업로드 실패:`, error.message);
      } else {
        successCount += chunk.length;
        console.log(`✅ ${i + 1}~${i + chunk.length} 단어 업로드 성공!`);
      }
    }

    console.log(`🎉 축하합니다! 총 ${successCount}개 초등 단어가 Supabase DB 'words' 보관함에 완벽히 저장되었습니다!`);
  } catch (e) {
    console.error('업로드 중 예외 발생:', e);
  }
}

upload800Words();
