const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllData() {
  console.log('🔍 [이상학 학생 DB 데이터 실시간 정밀 점검 시작]\n');

  // 1. users / student_profiles
  const { data: users } = await supabase.from('users').select('*');
  console.log('👤 1. [users 테이블 전체 회원 목록]:', users);

  // 2. study_records 출석 테이블
  const { data: study } = await supabase.from('study_records').select('*');
  console.log('\n📅 2. [study_records 출석 기록 전체]:', study);

  // 3. student_learned_words 외운 단어 테이블
  const { data: learned } = await supabase.from('student_learned_words').select('*');
  console.log('\n📚 3. [student_learned_words 외운 단어 수]:', learned ? learned.length : 0);
  if (learned && learned.length > 0) {
    console.log('  외운 단어 목록 샘플:', learned.slice(0, 10));
  }

  // 4. audio_records 녹음 파일 테이블
  const { data: audio } = await supabase.from('audio_records').select('*');
  console.log('\n🎙️ 4. [audio_records 발음 녹음 파일 수]:', audio ? audio.length : 0);
  if (audio && audio.length > 0) {
    console.log('  발음 녹음 내역 샘플:', audio.slice(0, 5));
  }
}

checkAllData();
