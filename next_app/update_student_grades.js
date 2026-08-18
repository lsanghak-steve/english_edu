const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGradesForAdults() {
  console.log('🔄 [김민채], [박재현] 학년 정보를 "대학생 및 성인"으로 변경 시작...');

  const targets = [
    { name: '김민채', grade: '대학생 및 성인', studyLevel: '고등단어' },
    { name: '박재현', grade: '대학생 및 성인', studyLevel: '고등단어' }
  ];

  for (const target of targets) {
    const { data: found, error: findErr } = await supabase
      .from('users')
      .select('*')
      .ilike('name', `%${target.name}%`);

    if (findErr) {
      console.error(`❌ [${target.name}] 조회 에러:`, findErr.message);
      continue;
    }

    if (found && found.length > 0) {
      for (const row of found) {
        const { error: updateErr } = await supabase
          .from('users')
          .update({
            avatar: target.grade,
            study_grade_level: target.studyLevel
          })
          .eq('id', row.id);

        if (updateErr) {
          console.error(`❌ [${row.name}] 업데이트 실패:`, updateErr.message);
        } else {
          console.log(`✅ [${row.name}] (ID: ${row.student_id || row.id}) ➔ 학년: ${target.grade}, 레벨: ${target.studyLevel} 변경 완료!`);
        }
      }
    } else {
      console.log(`⚠️ [${target.name}] 학생을 DB에서 찾을 수 없습니다.`);
    }
  }

  console.log('\n🎉 김민채, 박재현 학생의 학년 정보가 성공적으로 변경되었습니다!');
}

updateGradesForAdults();
