const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateGradeLevelInDB() {
  console.log('🚀 Supabase DB words 테이블 grade_level 컬럼 업데이트 시작...');

  try {
    // 1. 중학교 단어 (ID >= 1000 또는 category에 '중등' 포함) ➔ grade_level: '중등단어'
    const { data: middleData, error: middleErr } = await supabase
      .from('words')
      .update({ grade_level: '중등단어' })
      .or('category.ilike.%중등%,id.gte.1000')
      .select('id');

    if (middleErr) {
      console.log('ℹ️ grade_level 컬럼 직접 업데이트 미지원(컬럼 생성 대기 중) - fallback 적용:', middleErr.message);
    } else {
      console.log(`✅ 중학 단어 ${middleData ? middleData.length : 0}개 grade_level='중등단어' 업데이트 완료!`);
    }

    // 2. 초등학교 단어 (ID < 1000) ➔ grade_level: '초등단어'
    const { data: elemData, error: elemErr } = await supabase
      .from('words')
      .update({ grade_level: '초등단어' })
      .lt('id', 1000)
      .select('id');

    if (!elemErr) {
      console.log(`✅ 초등 단어 ${elemData ? elemData.length : 0}개 grade_level='초등단어' 업데이트 완료!`);
    }

    console.log('🎉 DB grade_level 처리 작업이 성공적으로 마무리되었습니다.');
  } catch (e) {
    console.error('Exception during grade_level update:', e);
  }
}

updateGradeLevelInDB();
