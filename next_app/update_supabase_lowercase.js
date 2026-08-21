const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllWordsToLowercase() {
  console.log('====================================================');
  console.log('🗄️ [Supabase words 테이블 단어 및 이미지 URL 소문자 일괄 갱신]');
  console.log('====================================================\n');

  const { data: words, error } = await supabase
    .from('words')
    .select('id, word, image_url, grade_level, category');

  if (error) {
    console.error('❌ 단어 조회 실패:', error.message);
    return;
  }

  console.log(`📋 총 ${words.length}개 단어 조회 완료`);

  let updatedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < words.length; i += batchSize) {
    const chunk = words.slice(i, i + batchSize);
    const updates = chunk.map(w => {
      const rawWord = (w.word || '').trim();
      const lowerWord = rawWord.toLowerCase();
      const expectedUrl = `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${lowerWord}.png`;

      if (rawWord !== lowerWord || w.image_url !== expectedUrl) {
        updatedCount++;
        return supabase.from('words').update({
          word: lowerWord,
          image_url: expectedUrl
        }).eq('id', w.id);
      }
      return null;
    }).filter(Boolean);

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`  ⚡ ${i + updates.length} / ${words.length} 단어 점검 및 소문자 갱신 완료... (수정 누적: ${updatedCount})`);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 [DB 단어 및 image_url 소문자 일괄 갱신 완료!] (총 수정: ${updatedCount}건)`);
  console.log('====================================================');
}

updateAllWordsToLowercase();
