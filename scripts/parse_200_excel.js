const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// python을 이용해 elementary_words_200.xlsx 파싱 및 json 변환
const pythonCode = `
import pandas as pd
import json

df = pd.read_excel('elementary_words_200.xlsx')
data = df.to_dict(orient='records')
print(json.dumps(data, ensure_ascii=False))
`;

fs.writeFileSync('temp_parser.py', pythonCode, 'utf-8');

try {
    const output = execSync('python temp_parser.py', { encoding: 'utf-8' });
    const records = JSON.parse(output);
    console.log(`✅ 엑셀 데이터 성공적으로 읽음: 총 ${records.length}개 단어`);
    console.log('샘플 데이터:', records.slice(0, 2));

    // words_data.js 포맷으로 가공
    const formattedList = records.map((item, idx) => {
        // 컬럼명 안전 처리 (Word, Phonics, Meaning, Category 등)
        const word = item['Word'] || item['영어'] || item['영어단어'] || item['단어'] || item['word'] || '';
        const phonics = item['Phonics'] || item['발음'] || item['한글발음'] || item['phonics'] || '';
        const meaning = item['Meaning'] || item['뜻'] || item['한국어뜻'] || item['meaning'] || '';
        const category = item['Category'] || item['카테고리'] || item['주제'] || item['category'] || '기초 단어 📖';
        const exampleEn = item['Example EN'] || item['영어예문'] || item['예문'] || item['exampleEn'] || `${word} is good.`;
        const exampleKo = item['Example KO'] || item['한글해석'] || item['해석'] || item['exampleKo'] || `${meaning}이(가) 좋아요.`;

        return {
            id: idx + 1,
            word: String(word).trim(),
            phonics: String(phonics).trim(),
            meaning: String(meaning).trim(),
            category: String(category).trim(),
            emoji: '📖',
            exampleEn: String(exampleEn).trim(),
            exampleKo: String(exampleKo).trim()
        };
    });

    const jsContent = `/* ===================================================
   초등 필수 영단어 200선 데이터베이스 (words_data.js)
   =================================================== */

const wordList500 = ${JSON.stringify(formattedList, null, 4)};

export default wordList500;
export { wordList500 };
if (typeof window !== 'undefined') { window.wordList500 = wordList500; }
`;

    fs.writeFileSync('words_data.js', jsContent, 'utf-8');
    fs.writeFileSync(path.join('next_app', 'app', 'words_data.js'), jsContent, 'utf-8');
    console.log('🎉 200개 단어 데이터베이스(words_data.js) 작성이 완수되었습니다!');
} catch (e) {
    console.error('오류 발생:', e.message);
} finally {
    if (fs.existsSync('temp_parser.py')) fs.unlinkSync('temp_parser.py');
}
