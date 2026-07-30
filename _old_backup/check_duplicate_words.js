const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'elementary_words.csv');

if (!fs.existsSync(csvPath)) {
    console.log('❌ elementary_words.csv 파일이 없습니다.');
    process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n').filter(line => line.trim() !== '');

// 헤더 제외하고 데이터 추출
const header = lines[0];
const dataLines = lines.slice(1);

const wordMap = {};
const duplicates = [];
const allWords = [];

dataLines.forEach((line, index) => {
    // CSV 파싱
    const cols = line.split('","').map(c => c.replace(/"/g, '').trim());
    if (cols.length >= 2) {
        const id = cols[0];
        const word = cols[1];
        
        allWords.push(word);
        if (wordMap[word.toLowerCase()]) {
            duplicates.push({ id, word, originalId: wordMap[word.toLowerCase()] });
        } else {
            wordMap[word.toLowerCase()] = id;
        }
    }
});

console.log(`📊 엑셀 내 전체 단어 개수: ${allWords.length}개`);
console.log(`🔍 중복 없는 고유 단어 개수: ${Object.keys(wordMap).length}개`);

if (duplicates.length === 0) {
    console.log('\n✅ [검사 결과] 500개 단어가 모두 서로 다른 단어로 완벽히 구성되어 있습니다!');
} else {
    console.log(`\n⚠️ [검사 결과] 총 ${duplicates.length}개의 중복(또는 유사) 단어가 발견되었습니다:`);
    duplicates.forEach(dup => {
        console.log(`   - ${dup.id}번 단어 "${dup.word}" (기존 ${dup.originalId}번 단어와 중복)`);
    });
}
