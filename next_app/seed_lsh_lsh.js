const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedLeeSeungHyunData() {
  console.log('🚀 [이승현 학생] 8월 2일, 6일, 7일 출석 도장 생성 시작...\n');

  const studentId = 'lsh_20260807_000002';
  const studentName = '이승현';

  const datesToAdd = ['2026-08-02', '2026-08-06', '2026-08-07'];

  // 1. study_records 출석 기록 3일치 생성
  const studyRecordsPayload = [];
  datesToAdd.forEach(dateStr => {
    studyRecordsPayload.push({
      student_id: studentId,
      study_date: dateStr,
      is_stamped: true
    });

    studyRecordsPayload.push({
      student_id: studentName,
      study_date: dateStr,
      is_stamped: true
    });
  });

  const { data: studyData, error: err1 } = await supabase.from('study_records').insert(studyRecordsPayload).select();
  if (err1) {
    console.error('❌ study_records 생성 에러:', err1);
  } else {
    console.log(`✅ [study_records]: 8월 2일, 6일, 7일 출석 도장 ${studyData.length}개 생성 완료!`);
  }
}

seedLeeSeungHyunData();
