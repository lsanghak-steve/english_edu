const fs = require('fs');
const path = require('path');

function getEnvValue(key) {
  const envPaths = [
    path.join(__dirname, '.env.local'),
    path.join(__dirname, '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env')
  ];

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const [k, ...v] = trimmed.split('=');
        if (k.trim() === key) {
          return v.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  return process.env[key] || '';
}

function extractDatabaseId(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  // URL에서 32자리 UUID 추출
  const match = trimmed.match(/([a-f0-9]{32})/i);
  if (match) return match[1];
  // 하이픈 포함된 36자리 UUID 추출
  const matchHyphen = trimmed.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (matchHyphen) return matchHyphen[1].replace(/-/g, '');
  return trimmed;
}

async function testNotionConnection() {
  console.log('====================================================');
  console.log('🔍 [Notion API 연동 상태 및 데이터베이스 점검 시작]');
  console.log('====================================================\n');

  const apiKey = getEnvValue('NOTION_API_KEY');
  const rawDbId = getEnvValue('NOTION_DATABASE_ID');
  const databaseId = extractDatabaseId(rawDbId);

  if (!apiKey) {
    console.error('❌ [오류] NOTION_API_KEY가 .env.local에 설정되지 않았습니다.');
    return;
  }
  if (!databaseId) {
    console.error('❌ [오류] NOTION_DATABASE_ID가 .env.local에 설정되지 않았습니다.');
    return;
  }

  console.log(`🔑 API Key 감지: ${apiKey.slice(0, 10)}... (총 ${apiKey.length}자)`);
  console.log(`📋 Database ID 추출: ${databaseId}\n`);

  try {
    // 1. 데이터베이스 정보 조회
    const dbRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    const dbData = await dbRes.json();

    if (!dbRes.ok) {
      console.error(`❌ [Notion API 오류 ${dbRes.status}]:`, dbData.message || dbData);
      if (dbRes.status === 404) {
        console.log('\n💡 [해결 가이드] 노션 페이지 우측 상단 `···` ➔ `연결 추가 (Connections)`에서 생성하신 API 통합 봇을 추가하셨는지 확인해 주세요!');
      }
      return;
    }

    const title = dbData.title && dbData.title[0] ? dbData.title[0].plain_text : '이름 없음';
    console.log(`✅ [성공] 노션 데이터베이스 연결 성공!`);
    console.log(`  - 데이터베이스 제목: "${title}"`);
    console.log(`  - 컬럼(속성) 목록: ${Object.keys(dbData.properties).join(', ')}`);

    // 2. 데이터베이스 행(레코드) 조회
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page_size: 5 })
    });

    const queryData = await queryRes.json();
    if (queryRes.ok && queryData.results) {
      console.log(`  - 총 조회된 레코드 수: ${queryData.results.length}개 (샘플 최대 5개)`);
      queryData.results.forEach((page, idx) => {
        let titleVal = '빈 레코드';
        for (const [propName, propVal] of Object.entries(page.properties)) {
          if (propVal.type === 'title' && propVal.title && propVal.title[0]) {
            titleVal = `${propName}: ${propVal.title[0].plain_text}`;
          }
        }
        console.log(`    * [${idx + 1}] ${titleVal}`);
      });
    }

    console.log('\n====================================================');
    console.log('🎉 [Notion API 연동 검증 100% 완료!]');
    console.log('====================================================');

  } catch (err) {
    console.error('❌ [네트워크/통신 예외]:', err.message);
  }
}

testNotionConnection();
