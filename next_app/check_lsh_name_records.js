const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLshNameRecords() {
  console.log('🔍 student_id가 "이승현"인 데이터 조회 중...\n');

  const { data: study } = await supabase.from('study_records').select('*').eq('student_id', '이승현');
  console.log('📅 [study_records - 이승현]:', study ? study.length : 0, '개');

  const { data: learned } = await supabase.from('student_learned_words').select('*').eq('student_id', '이승현');
  console.log('📚 [student_learned_words - 이승현]:', learned ? learned.length : 0, '개');

  const { data: audio } = await supabase.from('audio_records').select('*').eq('student_id', '이승현');
  console.log('🎙️ [audio_records - 이승현]:', audio ? audio.length : 0, '개');

  const { data: wrong } = await supabase.from('wrong_words').select('*').eq('student_id', '이승현');
  console.log('❌ [wrong_words - 이승현]:', wrong ? wrong.length : 0, '개');
}

checkLshNameRecords();
