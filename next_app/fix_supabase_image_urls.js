const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAllImageUrls() {
  console.log('🔄 [Supabase words 테이블 단어-이미지 URL 불일치 자동 복구 시작]...\n');

  // 전체 단어 가져오기
  const { data: words, error } = await supabase.from('words').select('id, word, image_url');
  if (error) {
    console.error('❌ 단어 조회 실패:', error.message);
    return;
  }

  console.log(`📋 총 ${words.length}개 단어 조회 완료`);

  let fixedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < words.length; i += batchSize) {
    const chunk = words.slice(i, i + batchSize);
    const updates = chunk.map(w => {
      const cleanWord = (w.word || '').trim();
      const capWord = cleanWord ? cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1) : 'Apple';
      const expectedUrl = `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${capWord}.png`;

      // 기존 URL과 불일치하는 경우에만 업데이트
      if (w.image_url !== expectedUrl) {
        fixedCount++;
        return supabase.from('words').update({ image_url: expectedUrl }).eq('id', w.id);
      }
      return null;
    }).filter(Boolean);

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`  ⚡ ${i + updates.length} / ${words.length} 단어 점검 및 갱신 진행 중... (수정된 건수: ${fixedCount})`);
    }
  }

  console.log('\n====================================================');
  console.log(`🎉 [단어 이미지 URL 100% 매칭 완료!] (총 수정된 불일치 단어: ${fixedCount}건)`);
  console.log('====================================================');
}

fixAllImageUrls();
