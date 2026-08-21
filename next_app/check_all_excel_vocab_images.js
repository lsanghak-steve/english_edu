const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function getLocalImageSet() {
  const imgDir = path.join(__dirname, 'public', 'word_img');
  const files = fs.readdirSync(imgDir);
  const normalizedSet = new Set();

  files.forEach(f => {
    if (!f.endsWith('.png') || f.startsWith('_')) return;
    const base = f.replace('.png', '').trim().toLowerCase();
    normalizedSet.add(base);
    normalizedSet.add(base.replace(/[\s\-_]/g, ''));
  });

  return { set: normalizedSet, count: files.length };
}

function analyzeAllExcelFiles() {
  console.log('====================================================');
  console.log('📚 [초/중/고 5,000개 엑셀 마스터 단어장 이미지 보유율 전수 검사]');
  console.log('====================================================\n');

  const { set: localImages, count: totalImgFiles } = getLocalImageSet();
  console.log(`📁 보유 이미지 파일 총: ${totalImgFiles}개\n`);

  const excelFiles = [
    { name: '초등단어장 (800)', file: path.join(__dirname, '..', 'word', 'elementary_words_ko_zh.xlsx'), grade: '초등' },
    { name: '중등단어장 (1,200)', file: path.join(__dirname, '..', 'word', 'middle_school_words_ko_zh.xlsx'), grade: '중등' },
    { name: '고등/수능단어장 (3,000)', file: path.join(__dirname, '..', 'word', 'highschool_suneung_vocab_3000_ko_zh.xlsx'), grade: '고등/수능' }
  ];

  const overallMissing = [];
  let grandTotal = 0;
  let grandExist = 0;

  excelFiles.forEach(ef => {
    if (!fs.existsSync(ef.file)) {
      console.log(`⚠️ 파일을 찾을 수 없음: ${ef.file}`);
      return;
    }

    const workbook = xlsx.readFile(ef.file);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    let existCount = 0;
    const missing = [];

    rows.forEach(r => {
      const word = String(r.word || r.Word || r['단어'] || r.english || '').trim();
      const meaning = String(r.meaning || r.Meaning || r['뜻'] || r.korean || '').trim();
      if (!word) return;

      const cleanWord = word.toLowerCase();
      const cleanNoSpace = cleanWord.replace(/[\s\-_]/g, '');

      if (localImages.has(cleanWord) || localImages.has(cleanNoSpace)) {
        existCount++;
      } else {
        missing.push({ grade: ef.grade, word, meaning });
        overallMissing.push({ grade: ef.grade, word, meaning });
      }
    });

    const total = rows.length;
    const rate = total > 0 ? ((existCount / total) * 100).toFixed(1) : 0;
    grandTotal += total;
    grandExist += existCount;

    console.log(`📖 [${ef.name}]`);
    console.log(`  - 총 단어 수: ${total}개`);
    console.log(`  - 이미지 보유: ${existCount}개 (${rate}%)`);
    console.log(`  - ❌ 미보유: ${missing.length}개\n`);
  });

  const grandRate = grandTotal > 0 ? ((grandExist / grandTotal) * 100).toFixed(1) : 0;
  console.log('====================================================');
  console.log(`🏆 [전체 마스터 단어 종합: 총 ${grandTotal}개 중 ${grandExist}개 보유 (${grandRate}%), 미보유 ${overallMissing.length}개]`);
  console.log('====================================================\n');

  if (overallMissing.length > 0) {
    console.log(`📋 미보유 단어 목록 샘플 (상위 30개):`);
    overallMissing.slice(0, 30).forEach((m, idx) => {
      console.log(`  [${idx + 1}] [${m.grade}] ${m.word.padEnd(16)} | 뜻: ${m.meaning}`);
    });

    const missingReportPath = path.join(__dirname, 'excel_missing_words.json');
    fs.writeFileSync(missingReportPath, JSON.stringify(overallMissing, null, 2), 'utf8');
    console.log(`\n💾 전체 미보유 단어 리스트 저장: ${missingReportPath}`);
  } else {
    console.log('🎉 5,000개 전체 단어의 이미지를 100% 완벽히 보유하고 있습니다!');
  }
}

analyzeAllExcelFiles();
