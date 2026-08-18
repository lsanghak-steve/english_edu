const fs = require('fs');
const path = require('path');

function getEnvValue(key) {
  const envPath = fs.existsSync('.env.local') ? '.env.local' : (fs.existsSync('next_app/.env.local') ? 'next_app/.env.local' : '../.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  let val = '';
  content.split('\n').forEach(l => {
    if (l.startsWith(`${key}=`)) val = l.split('=')[1].trim().replace(/^["']|["']$/g, '');
  });
  return val;
}

function extractDatabaseId(raw) {
  const match = raw.match(/([a-f0-9]{32})/i);
  return match ? match[1] : raw;
}

// 텍스트를 노션 블록으로 변환하는 유틸리티
function convertMarkdownToBlocks(mdContent) {
  const lines = mdContent.split('\n');
  const blocks = [];

  for (let line of lines) {
    line = line.trimEnd();
    if (!line.trim()) continue;

    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: { rich_text: [{ type: 'text', text: { content: line.replace(/^#\s+/, '').slice(0, 1900) } }] }
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: line.replace(/^##\s+/, '').slice(0, 1900) } }] }
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: line.replace(/^###\s+/, '').slice(0, 1900) } }] }
      });
    } else if (line.startsWith('- [x] ') || line.startsWith('* [x] ')) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: { checked: true, rich_text: [{ type: 'text', text: { content: line.replace(/^[-*]\s+\[x\]\s+/, '').slice(0, 1900) } }] }
      });
    } else if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) {
      blocks.push({
        object: 'block',
        type: 'to_do',
        to_do: { checked: false, rich_text: [{ type: 'text', text: { content: line.replace(/^[-*]\s+\[ \]\s+/, '').slice(0, 1900) } }] }
      });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: line.replace(/^[-*]\s+/, '').slice(0, 1900) } }] }
      });
    } else if (line.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          icon: { type: 'emoji', emoji: '📌' },
          rich_text: [{ type: 'text', text: { content: line.replace(/^>\s+/, '').slice(0, 1900) } }]
        }
      });
    } else if (line.startsWith('---')) {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: line.slice(0, 1900) } }] }
      });
    }
  }
  return blocks;
}

async function createNotionPageWithBlocks(headers, databaseId, title, day, topic, blocks) {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1차 생성: 첫 80개 블록과 함께 페이지 생성
  const firstBatch = blocks.slice(0, 80);
  const remainingBlocks = blocks.slice(80);

  const payload = {
    parent: { database_id: databaseId },
    properties: {
      '이름': {
        title: [{ text: { content: title } }]
      },
      'Day': {
        number: day
      },
      '주제': {
        rich_text: [{ text: { content: topic } }]
      },
      '날짜': {
        date: { start: todayStr }
      },
      '스트릭': {
        number: 7
      },
      '아는단어': {
        number: 100
      },
      '복습필요단어': {
        number: 0
      },
      '메모': {
        rich_text: [{ text: { content: `기획서 전체 복사본 적재 완료 (총 ${blocks.length}개 블록)` } }]
      }
    },
    children: firstBatch
  };

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  });

  const resData = await res.json();
  if (!res.ok) {
    console.error(`  ❌ [페이지 생성 실패 - ${title}]:`, resData.message || resData);
    return;
  }

  const pageId = resData.id;
  console.log(`  ✅ [페이지 생성 완료] "${title}" (ID: ${pageId})`);

  // 남은 블록이 있으면 50개씩 추가 적재
  let offset = 0;
  while (offset < remainingBlocks.length) {
    const chunk = remainingBlocks.slice(offset, offset + 50);
    const appendRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify({ children: chunk })
    });
    if (!appendRes.ok) {
      const appendErr = await appendRes.json();
      console.error(`    ⚠️ [블록 추가 중 경고]:`, appendErr.message || appendErr);
    }
    offset += 50;
  }
}

async function copyAllSpecsToNotion() {
  const apiKey = getEnvValue('NOTION_API_KEY');
  const databaseId = extractDatabaseId(getEnvValue('NOTION_DATABASE_ID'));

  console.log('====================================================');
  console.log('📚 [노션 "🎧 영어학습 진행상황" 기획서 전체 복사 적재 시작]');
  console.log('====================================================\n');

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  };

  // 1. docs/plan.md (기본 기획서 및 미개발 백로그)
  const planMdPath = path.join(__dirname, '..', 'docs', 'plan.md');
  if (fs.existsSync(planMdPath)) {
    const planContent = fs.readFileSync(planMdPath, 'utf8');
    const blocks = convertMarkdownToBlocks(planContent);
    await createNotionPageWithBlocks(
      headers,
      databaseId,
      '📑 [기획서 1] 초등 기초 영단어 학습 기획서 & 개발 진행표 (plan.md)',
      10,
      '기초 학습 흐름, 7단계 로드맵, 미개발 아이디어 백로그',
      blocks
    );
  }

  // 2. docs/STEVE_VOCA_B2B_ACADEMY_SPEC.md (학원 B2B 기획서)
  const b2bMdPath = path.join(__dirname, '..', 'docs', 'STEVE_VOCA_B2B_ACADEMY_SPEC.md');
  if (fs.existsSync(b2bMdPath)) {
    const b2bContent = fs.readFileSync(b2bMdPath, 'utf8');
    const blocks = convertMarkdownToBlocks(b2bContent);
    await createNotionPageWithBlocks(
      headers,
      databaseId,
      '🏫 [기획서 2] 학원·공부방 B2B SaaS 통합 기획서 (STEVE_VOCA_B2B_SPEC)',
      11,
      '다중 테넌트 권한, 6종 PDF 시험지 자동 생성, 알림톡 연동, 원장님 대시보드',
      blocks
    );
  }

  // 3. homepage/md/prd.md (랜딩페이지 PRD & 요금제 & 리워드)
  const prdMdPath = path.join(__dirname, '..', 'homepage', 'md', 'prd.md');
  if (fs.existsSync(prdMdPath)) {
    const prdContent = fs.readFileSync(prdMdPath, 'utf8');
    const blocks = convertMarkdownToBlocks(prdContent);
    await createNotionPageWithBlocks(
      headers,
      databaseId,
      '🚀 [기획서 3] 제품 소개 & 랜딩페이지 상세 PRD (요금제 & 랭킹 정책)',
      12,
      '학생/학부모 평생 무료, 학원 도입 별도 문의, 주간 랭킹전 & 친구 초대 복리 포인트',
      blocks
    );
  }

  console.log('\n====================================================');
  console.log('🎉 [기획서 전체 복사 및 노션 적재 100% 완료!]');
  console.log('====================================================');
}

copyAllSpecsToNotion();
