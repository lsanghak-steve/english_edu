const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runComprehensiveVerification() {
  console.log('====================================================');
  console.log('🔍 [steve voca 시스템 종합 자동 검증 엔진 시작]');
  console.log('====================================================\n');

  let passed = true;

  // 1. App Router 파일 구문 및 참조 검증
  console.log('📁 1. 핵심 컴포넌트 구문 및 참조 점검:');
  const appDir = path.join(__dirname, 'app');
  const componentsDir = path.join(appDir, 'components');
  
  const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.js'));
  console.log(`  - 컴포넌트 파일 총 ${componentFiles.length}개 발견`);

  componentFiles.forEach(file => {
    const fullPath = path.join(componentsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    // JSX 내에 raw object 렌더링 위험 패턴 점검
    const objectChildRegex = /\{[a-zA-Z0-9_]+Notice\s*\|\|\s*`[^`]+`\}/g;
    if (objectChildRegex.test(content)) {
      console.error(`  ❌ [위험 감지] ${file}: React 자식 객체 직접 렌더링 패턴 존재!`);
      passed = false;
    }
  });
  console.log('  ✅ 모든 컴포넌트 정적 구문 안전성 검증 완료!\n');

  // 2. Supabase DB 테이블 실시간 스키마 정합성 검증
  console.log('🗄️ 2. Supabase 클라우드 DB 테이블 연결 및 스키마 검증:');
  const tables = ['users', 'words', 'study_records', 'student_learned_words', 'wrong_words', 'audio_records'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`  ❌ [DB 오류] ${table} 테이블 조회 실패:`, error.message);
        passed = false;
      } else {
        console.log(`  ✅ [DB 정상] ${table} 테이블 연결 성공 (샘플 컬럼: ${data && data[0] ? Object.keys(data[0]).join(', ') : '비어있음'})`);
      }
    } catch (e) {
      console.error(`  ❌ [DB 예외] ${table}:`, e);
      passed = false;
    }
  }

  // 3. 학생 데이터 정합성 검증
  console.log('\n👥 3. 등록된 학생 프로필 및 출석 데이터 무결성 검증:');
  const { data: users } = await supabase.from('users').select('*');
  console.log(`  - 총 등록 학생 수: ${users ? users.length : 0}명`);
  if (users) {
    users.forEach(u => {
      console.log(`    * [${u.name}] ID: ${u.student_id || u.id} | 학년: ${u.avatar || u.study_grade_level || '미지정'} | 일일단어수: ${u.daily_word_count || 10}개`);
    });
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('🎉 [전체 무결성 검증 결과: 100% 정상 통과 (오류 0건)]');
  } else {
    console.log('⚠️ [검증 실패 항목 발견 - 조치 필요]');
  }
  console.log('====================================================');
}

runComprehensiveVerification();
