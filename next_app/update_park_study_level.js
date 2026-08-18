const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateParkJaehyunStudyLevel() {
  console.log('🔄 [박재현] 학습 단어 레벨을 "초등단어"로 변경 시작...');

  const { data: found, error: findErr } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%박재현%');

  if (findErr) {
    console.error('❌ 조회 에러:', findErr.message);
    return;
  }

  if (found && found.length > 0) {
    for (const row of found) {
      const { error: updateErr } = await supabase
        .from('users')
        .update({
          study_grade_level: '초등단어'
        })
        .eq('id', row.id);

      if (updateErr) {
        console.error(`❌ [${row.name}] 업데이트 실패:`, updateErr.message);
      } else {
        console.log(`✅ [${row.name}] (ID: ${row.student_id || row.id}) ➔ 학습 단어 레벨: [초등단어] 변경 완료!`);
      }
    }
  } else {
    console.log('⚠️ [박재현] 학생을 DB에서 찾을 수 없습니다.');
  }

  console.log('\n🎉 박재현 학생의 학습 단어 레벨이 [초등단어]로 성공적으로 변경되었습니다!');
}

updateParkJaehyunStudyLevel();
