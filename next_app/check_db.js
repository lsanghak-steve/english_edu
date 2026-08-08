const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/);

const supabaseUrl = urlMatch[1].trim();
const supabaseKey = keyMatch[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLshData() {
  console.log('🔍 [이상학] 데이터베이스 실시간 기록 점검 중...\n');

  // 1. users 테이블 점검
  const { data: usersData } = await supabase.from('users').select('*').or('name.eq.이상학,student_id.eq.lsh_20260807_000001,id.eq.sh_100');
  console.log('👤 [users 학생 계정 정보]:', usersData);

  // 2. study_records 출석 기록 점검
  const { data: studyData } = await supabase.from('study_records').select('*').or('student_id.eq.lsh_20260807_000001,student_id.eq.이상학,student_id.eq.sh_100');
  console.log('\n📅 [study_records 출석 날짜 기록]:', studyData);

  // 3. student_learned_words 외운 단어 테이블 점검
  const { data: learnedData } = await supabase.from('student_learned_words').select('*').or('student_id.eq.lsh_20260807_000001,student_id.eq.이상학,student_id.eq.sh_100');
  console.log('\n📚 [student_learned_words 외운 단어 목록 수]:', learnedData ? learnedData.length : 0);
  if (learnedData && learnedData.length > 0) {
    console.log('샘플 단어 3개:', learnedData.slice(0, 3));
  }

  // 4. audio_records 녹음 파일 테이블 점검
  const { data: audioData } = await supabase.from('audio_records').select('*').or('student_id.eq.lsh_20260807_000001,student_id.eq.이상학,student_id.eq.sh_100');
  console.log('\n🎙️ [audio_records 녹음 내역 수]:', audioData ? audioData.length : 0);
  if (audioData && audioData.length > 0) {
    console.log('샘플 녹음 기록 2개:', audioData.slice(0, 2));
  }
}

checkLshData();
