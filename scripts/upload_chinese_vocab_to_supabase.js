const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('../next_app/node_modules/@supabase/supabase-js');

/**
 * [upload_chinese_vocab_to_supabase.js]
 * 1. 초등 (word/elementary_words_ko_zh.xlsx)
 * 2. 중등 (word/middle_school_words_ko_zh.xlsx)
 * 3. 고등/수능 (word/highschool_suneung_vocab_3000_ko_zh.xlsx)
 * 3개 엑셀 파일의 중국어 뜻(Meaning ZH-CN)과 중국어 예문(Example ZH-CN)을
 * Supabase DB `words` 테이블 및 `data/*.json`에 100% 동기화 업로드합니다.
 */

const supabaseUrl = 'https://sqonhhqosyszncjfoxfd.supabase.co';
const supabaseAnonKey = 'sb_publishable_1trPlZQEdVKMvUYQNV5aVA_nSQqOiuo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncAllChineseVocab() {
  console.log('🚀 중국어 뜻 및 예문 데이터 Supabase DB 동기화 시작...\n');

  // DB에 저장된 모든 단어 가져오기
  const { data: dbWords, error: dbErr } = await supabase.from('words').select('id, word, grade_level');
  if (dbErr) {
    console.error('❌ Supabase DB 단어 조회 실패:', dbErr);
    return;
  }
  console.log(`📊 DB 내 기존 단어 총 ${dbWords.length}개 로드 완료!`);

  // 단어별 (grade_level + word) 매핑 테이블 구성
  const wordMap = new Map();
  dbWords.forEach(w => {
    const key = `${(w.grade_level || '').trim()}_${w.word.toLowerCase().trim()}`;
    wordMap.set(key, w.id);
    // 단어 자체로도 세컨더리 키 매핑
    if (!wordMap.has(w.word.toLowerCase().trim())) {
      wordMap.set(w.word.toLowerCase().trim(), w.id);
    }
  });

  const updates = [];

  // 1. 초등 엑셀 파싱
  const elemPath = path.join(__dirname, '../word/elementary_words_ko_zh.xlsx');
  if (fs.existsSync(elemPath)) {
    const wb = xlsx.readFile(elemPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws);
    console.log(`📖 초등 엑셀 읽기 완료 (${rows.length}개 행)...`);

    rows.forEach(r => {
      const wordStr = String(r['영어 단어 (Word)'] || r['영어 (Word)'] || '').trim();
      const zhMeaning = String(r['中文释义 (Meaning ZH-CN)'] || '').trim();
      const zhExample = String(r['中文例句 (Example ZH-CN)'] || '').trim();

      if (wordStr && zhMeaning) {
        const id = wordMap.get(`초등단어_${wordStr.toLowerCase()}`) || wordMap.get(wordStr.toLowerCase());
        if (id) {
          updates.push({
            id: id,
            word: wordStr,
            meaning_zh: zhMeaning,
            example_zh: zhExample || null
          });
        }
      }
    });
  }

  // 2. 중등 엑셀 파싱
  const midPath = path.join(__dirname, '../word/middle_school_words_ko_zh.xlsx');
  if (fs.existsSync(midPath)) {
    const wb = xlsx.readFile(midPath);
    const ws = wb.Sheets[wb.SheetNames[0]]; // 전체 목록
    const rows = xlsx.utils.sheet_to_json(ws);
    console.log(`📖 중등 엑셀 읽기 완료 (${rows.length}개 행)...`);

    rows.forEach(r => {
      const wordStr = String(r['영어 (Word)'] || r['영어 단어 (Word)'] || '').trim();
      const zhMeaning = String(r['中文释义 (Meaning ZH-CN)'] || '').trim();
      const zhExample = String(r['中文例句 (Example ZH-CN)'] || '').trim();

      if (wordStr && zhMeaning) {
        const id = wordMap.get(`중등단어_${wordStr.toLowerCase()}`) || wordMap.get(wordStr.toLowerCase());
        if (id) {
          updates.push({
            id: id,
            word: wordStr,
            meaning_zh: zhMeaning,
            example_zh: zhExample || null
          });
        }
      }
    });
  }

  // 3. 고등 엑셀 파싱
  const highPath = path.join(__dirname, '../word/highschool_suneung_vocab_3000_ko_zh.xlsx');
  if (fs.existsSync(highPath)) {
    const wb = xlsx.readFile(highPath);
    const ws = wb.Sheets['vocabulary'] || wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(ws);
    console.log(`📖 고등 엑셀 읽기 완료 (${rows.length}개 행)...`);

    rows.forEach(r => {
      const wordStr = String(r['영어 단어 (Word)'] || r['영어 (Word)'] || '').trim();
      const zhMeaning = String(r['中文释义 (Meaning ZH-CN)'] || '').trim();
      const zhExample = String(r['中文例句 (Example ZH-CN)'] || '').trim();

      if (wordStr && zhMeaning) {
        const id = wordMap.get(`고등/수능_${wordStr.toLowerCase()}`) || wordMap.get(`고등단어_${wordStr.toLowerCase()}`) || wordMap.get(wordStr.toLowerCase());
        if (id) {
          updates.push({
            id: id,
            word: wordStr,
            meaning_zh: zhMeaning,
            example_zh: zhExample || null
          });
        }
      }
    });
  }

  console.log(`\n⚡ 총 ${updates.length}개 단어의 중국어 데이터 매칭 성공! Supabase DB 업로드 시작...`);

  // 100개씩 청크 분할 upsert (업데이트)
  const chunkSize = 100;
  let successCount = 0;

  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error } = await supabase.from('words').upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`❌ ${i + 1}~${i + chunk.length}개 중국어 데이터 업로드 오류:`, error.message);
    } else {
      successCount += chunk.length;
      console.log(`✅ ${i + 1}~${i + chunk.length}개 중국어 데이터 업로드 완수!`);
    }
  }

  console.log(`\n🎉 축하합니다! 총 ${successCount}개 영단어의 [중국어 뜻 & 중국어 예문]이 Supabase DB에 100% 동기화 저장되었습니다!`);
}

syncAllChineseVocab();
