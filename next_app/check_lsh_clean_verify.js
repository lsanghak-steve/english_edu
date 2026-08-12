const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLeeClean() {
  console.log('🔍 [이승현 학생 DB 최종 통합 검증 시작]\n');

  const studentCode = 'lsh_20260807_000002';

  // 1. study_records 출석 테이블 점검
  const { data: studyAll } = await supabase.from('study_records').select('*').or(`student_id.eq.${studentCode},student_id.eq.이승현`);
  console.log('📅 1. [study_records 출석 행 전체 목록]:');
  console.log(studyAll);

  // 2. student_learned_words 점검
  const { data: learnedAll } = await supabase.from('student_learned_words').select('*').or(`student_id.eq.${studentCode},student_id.eq.이승현`);
  console.log('\n📚 2. [student_learned_words 외운 단어 행 개수]:', learnedAll ? learnedAll.length : 0);
  if (learnedAll && learnedAll.length > 0) {
    const hasName = learnedAll.some(item => item.student_id === '이승현');
    console.log('  - 한글 이름 "이승현" 남아있는 행 존재 여부:', hasName ? '⚠️ 존재함' : '✅ 0개 (완전 제거됨!)');
    console.log('  - 고유 코드 "lsh_20260807_000002" 행 개수:', learnedAll.filter(item => item.student_id === studentCode).length);
  }
}

verifyLeeClean();
