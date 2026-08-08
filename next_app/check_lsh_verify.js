const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLeeData() {
  console.log('🔍 [이승현 학생 DB 최종 데이터 검증]\n');

  // 1. study_records 출석 날짜들
  const { data: studyData } = await supabase.from('study_records').select('*').or('student_id.eq.lsh_20260807_000002,student_id.eq.이승현');
  const dates = [...new Set(studyData.map(d => d.study_date))].sort();
  console.log('📅 [출석 완성 날짜 목록 (총 ' + dates.length + '일)]:', dates);

  // 2. student_learned_words 외운 단어 수
  const { data: learnedData } = await supabase.from('student_learned_words').select('*').or('student_id.eq.lsh_20260807_000002,student_id.eq.이승현');
  console.log('📚 [총 외운 단어 기록 수]:', learnedData ? learnedData.length : 0);

  // 3. audio_records 발음 녹음 수
  const { data: audioData } = await supabase.from('audio_records').select('*').or('student_id.eq.lsh_20260807_000002,student_id.eq.이승현');
  console.log('🎙️ [총 발음 녹음 기록 수]:', audioData ? audioData.length : 0);
}

verifyLeeData();
