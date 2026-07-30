const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img');
const wordsDataPath = path.join(__dirname, 'words_data.js');

if (!fs.existsSync(wordsDataPath)) {
    console.log('❌ words_data.js 파일이 없습니다.');
    process.exit(1);
}

let content = fs.readFileSync(wordsDataPath, 'utf-8');
const match = content.match(/const wordList500 = (\[[\s\S]*?\]);/);
const wordList = JSON.parse(match[1]);

let foundCount = 0;
let missingWords = [];

wordList.forEach((item, idx) => {
    const imageName = item.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const pngPath = path.join(imgDir, `${imageName}.png`);
    const jpgPath = path.join(imgDir, `${imageName}.jpg`);

    if (fs.existsSync(pngPath) || fs.existsSync(jpgPath)) {
        foundCount++;
    } else {
        missingWords.push({ id: idx + 1, word: item.word });
    }
});

console.log(`📊 전체 검사 단어 수: ${wordList.length}개`);
console.log(`🖼️ img 폴더에 준비 완료된 이미지 수: ${foundCount}개`);

if (missingWords.length === 0) {
    console.log('\n🎉 [100% 완벽 점검 완료] 500개 단어 전체의 이미지가 img 폴더에 빠짐없이 전부 저장되어 있습니다!');
} else {
    console.log(`\n⚠️ 누락된 이미지 단어 (${missingWords.length}개):`);
    missingWords.forEach(m => console.log(`   - ${m.id}번: ${m.word}`));
}
