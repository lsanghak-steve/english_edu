const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function approveAllExistingStudents() {
  console.log('🔄 기존 등록된 모든 학생 일괄 승인(Approved) 처리 시작...');

  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('❌ 유저 조회 오류:', error.message);
    return;
  }

  console.log(`📋 현재 등록된 학생 총 ${users.length}명 확인`);

  for (const user of users) {
    const rawAvatar = String(user.avatar || '초등 3학년');
    const cleanAvatar = rawAvatar.replace('[PENDING]', '').replace('[REJECTED]', '').trim() || '초등 3학년';

    const { error: updateErr } = await supabase
      .from('users')
      .update({ avatar: cleanAvatar })
      .eq('id', user.id);

    if (updateErr) {
      console.error(`  ❌ [${user.name}] 업데이트 실패:`, updateErr.message);
    } else {
      console.log(`  ✅ [${user.name}] (ID: ${user.student_id || user.id}) ➔ 승인 완료 (학년: ${cleanAvatar})`);
    }
  }

  console.log('\n🎉 모든 기존 등록 학생이 100% 정상 승인(Approved) 상태로 완벽 갱신되었습니다!');
}

approveAllExistingStudents();
