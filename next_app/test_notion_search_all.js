const fs = require('fs');

function getApiKey() {
  const envPath = fs.existsSync('.env.local') ? '.env.local' : (fs.existsSync('next_app/.env.local') ? 'next_app/.env.local' : '../.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  let apiKey = '';
  content.split('\n').forEach(l => {
    if (l.startsWith('NOTION_API_KEY=')) apiKey = l.split('=')[1].trim();
  });
  return apiKey;
}

async function searchAllAccessiblePages() {
  const apiKey = getApiKey();
  console.log('🔍 [노션 전체 접근 가능한 페이지 & 데이터베이스 검색 중...]');

  try {
    const res = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 50
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('❌ 검색 오류:', data);
      return;
    }

    console.log(`\n📋 현재 API 봇이 접근 가능한 전체 항목: 총 ${data.results.length}개 발견\n`);
    data.results.forEach((item, idx) => {
      let title = '제목 없음';
      if (item.object === 'database') {
        title = item.title && item.title[0] ? item.title[0].plain_text : '이름 없는 데이터베이스';
        console.log(`[${idx + 1}] 🗄️ [데이터베이스] "${title}" (ID: ${item.id})`);
      } else if (item.object === 'page') {
        for (const [k, v] of Object.entries(item.properties || {})) {
          if (v.type === 'title' && v.title && v.title[0]) {
            title = v.title[0].plain_text;
          }
        }
        console.log(`[${idx + 1}] 📄 [페이지] "${title}" (ID: ${item.id})`);
      }
    });

  } catch (e) {
    console.error('예외 발생:', e.message);
  }
}

searchAllAccessiblePages();
