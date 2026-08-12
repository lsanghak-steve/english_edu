const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'img');

// 1. words_data.js 또는 기존 CSV 데이터 읽기
const wordsDataPath = path.join(__dirname, 'words_data.js');

if (!fs.existsSync(wordsDataPath)) {
    console.log('❌ words_data.js 파일이 없습니다.');
    process.exit(1);
}

// words_data.js 읽기
let content = fs.readFileSync(wordsDataPath, 'utf-8');
// JSON 부분 추출
const match = content.match(/const wordList500 = (\[[\s\S]*?\]);/);

if (!match) {
    console.log('❌ wordList500 데이터를 파싱하지 못했습니다.');
    process.exit(1);
}

const wordList = JSON.parse(match[1]);

let createdCount = 0;

// 각 단어별 img 폴더 존재 여부 업데이트
const updatedList = wordList.map(item => {
    const imageName = item.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const hasImg = fs.existsSync(path.join(imgDir, `${imageName}.png`)) || fs.existsSync(path.join(imgDir, `${imageName}.jpg`));
    
    if (hasImg) {
        createdCount++;
        item.hasImage = true;
    }
    return item;
});

// CSV 및 XLS 작성을 위한 배열 생성
const headers = ["번호", "영어 단어 (Word)", "한글 발음 (Phonics)", "한국어 뜻 (Meaning)", "주제 (Category)", "그림 제작 여부 (Status)", "영어 예문 (Example EN)", "한국어 해석 (Example KO)"];

const rowsData = updatedList.map(item => {
    const statusStr = item.hasImage ? "⭕ 제작완료" : "❌ 미제작";
    return [
        item.id,
        item.word,
        item.phonics,
        item.meaning,
        item.category,
        statusStr,
        item.exampleEn,
        item.exampleKo
    ];
});

// 1. CSV 업데이트
let csvContent = '\uFEFF';
csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
rowsData.forEach(row => {
    csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
});
fs.writeFileSync(path.join(__dirname, 'elementary_words.csv'), csvContent, 'utf-8');

// 2. XLS 엑셀 업데이트
let xlsContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        table { border-collapse: collapse; font-family: '맑은 고딕', sans-serif; }
        th { background-color: #4ECDC4; color: white; font-weight: bold; padding: 10px; border: 1px solid #2C3E50; text-align: center; }
        td { padding: 8px; border: 1px solid #D9D9D9; font-size: 13px; }
        .center { text-align: center; }
        .created { color: #27AE60; font-weight: bold; }
        .not-created { color: #E74C3C; }
    </style>
</head>
<body>
    <table>
        <thead>
            <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${rowsData.map(row => `
                <tr>
                    <td class="center">${row[0]}</td>
                    <td><b>${row[1]}</b></td>
                    <td class="center">${row[2]}</td>
                    <td>${row[3]}</td>
                    <td class="center">${row[4]}</td>
                    <td class="center ${row[5].includes('⭕') ? 'created' : 'not-created'}">${row[5]}</td>
                    <td>${row[6]}</td>
                    <td>${row[7]}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'elementary_words.xls'), xlsContent, 'utf-8');

// 3. words_data.js 파일 갱신
const jsContent = `/* ===================================================
   초등 필수 영단어 500선 데이터베이스 (words_data.js)
   =================================================== */

const wordList500 = ${JSON.stringify(updatedList, null, 4)};
`;

fs.writeFileSync(wordsDataPath, jsContent, 'utf-8');

console.log(`✅ 엑셀 및 데이터베이스 업데이트 완료! 총 ${createdCount}개 단어의 실물 이미지가 img 폴더에 제작 완료되었습니다.`);
