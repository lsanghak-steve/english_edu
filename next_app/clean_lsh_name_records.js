const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanLshNameRecords() {
  console.log('🚀 [이승현 학생] 한글 이름 데이터 ➔ 고유 코드(lsh_20260807_000002)로 정밀 통합 중...\n');

  // 1. study_records 출석 테이블에서 student_id가 '이승현'인 행 제거
  const { data: delStudy, error: err1 } = await supabase.from('study_records').delete().eq('student_id', '이승현').select();
  if (err1) {
    console.error('❌ study_records 정리 에러:', err1);
  } else {
    console.log(`✅ [study_records]: 한글 이름 '이승현' 중복 행 ${delStudy ? delStudy.length : 0}개 정리 완료!`);
  }

  // 2. student_learned_words 외운 단어 테이블에서 student_id가 '이승현'인 행 제거
  const { data: delLearned, error: err2 } = await supabase.from('student_learned_words').delete().eq('student_id', '이승현').select();
  if (err2) {
    console.error('❌ student_learned_words 정리 에러:', err2);
  } else {
    console.log(`✅ [student_learned_words]: 한글 이름 '이승현' 중복 행 ${delLearned ? delLearned.length : 0}개 정리 완료!`);
  }

  // 3. audio_records 테이블 점검 및 정리
  const { data: delAudio, error: err3 } = await supabase.from('audio_records').delete().eq('student_id', '이승현').select();
  if (err3) {
    console.error('❌ audio_records 정리 에러:', err3);
  } else {
    console.log(`✅ [audio_records]: 한글 이름 '이승현' 행 ${delAudio ? delAudio.length : 0}개 정리 완료!`);
  }

  // 4. wrong_words 테이블 점검 및 정리
  const { data: delWrong, error: err4 } = await supabase.from('wrong_words').delete().eq('student_id', '이승현').select();
  if (err4) {
    console.error('❌ wrong_words 정리 에러:', err4);
  } else {
    console.log(`✅ [wrong_words]: 한글 이름 '이승현' 행 ${delWrong ? delWrong.length : 0}개 정리 완료!`);
  }

  console.log('\n🎉 [이승현 학생] 모든 데이터가 고유 코드(lsh_20260807_000002)로 100% 깔끔하게 통합되었습니다!');
}

cleanLshNameRecords();
