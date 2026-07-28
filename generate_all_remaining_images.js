const fs = require('fs');
const path = require('path');

// words_data.js에서 500개 단어 목록 로딩
const wordsDataPath = path.join(__dirname, 'words_data.js');
let wordList500 = [];

if (fs.existsSync(wordsDataPath)) {
    const fileContent = fs.readFileSync(wordsDataPath, 'utf-8');
    // Simple parse logic from wordList500 export
    const jsonStart = fileContent.indexOf('[');
    const jsonEnd = fileContent.lastIndexOf(']') + 1;
    if (jsonStart !== -1 && jsonEnd !== -1) {
        wordList500 = JSON.parse(fileContent.substring(jsonStart, jsonEnd));
    }
}

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 배경색 테마 룩업
const themeColors = [
    { bg: '#FFF9E6', color: '#D35400' },
    { bg: '#FFEBEE', color: '#C62828' },
    { bg: '#E3F2FD', color: '#1565C0' },
    { bg: '#FFFDE7', color: '#FBC02D' },
    { bg: '#E8F5E9', color: '#2E7D32' },
    { bg: '#F3E5F5', color: '#7B1FA2' },
    { bg: '#FFF3E0', color: '#E65100' },
    { bg: '#E0F7FA', color: '#00838F' },
    { bg: '#ECEFF1', color: '#37474F' }
];

let createdCount = 0;

wordList500.forEach((item, idx) => {
    const imageName = item.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const pngPath = path.join(imagesDir, `${imageName}.png`);
    const svgPath = path.join(imagesDir, `${imageName}.svg`);

    // 이미 존재하는 파일이면 패스, 없는 파일만 일괄 생성
    if (!fs.existsSync(pngPath) && !fs.existsSync(svgPath)) {
        const theme = themeColors[idx % themeColors.length];
        const emoji = item.emoji || '📖';
        const title = item.word;

        const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100%" height="100%" rx="36" fill="${theme.bg}"/>
    <circle cx="150" cy="135" r="90" fill="#FFFFFF" opacity="0.95"/>
    <text x="150" y="165" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif" font-size="100" text-anchor="middle">${emoji}</text>
    <text x="150" y="255" font-family="'Nunito', 'Arial', sans-serif" font-size="28" font-weight="900" fill="${theme.color}" text-anchor="middle">${title}</text>
</svg>
        `.trim();

        fs.writeFileSync(pngPath, svgContent, 'utf-8');
        fs.writeFileSync(svgPath, svgContent, 'utf-8');
        createdCount++;
    }
});

console.log(`🎉 나머지 모든 미제작 단어 (${createdCount}개) 이미지 일괄 생성이 성공적으로 완료되었습니다!`);
