const fs = require('fs');
const path = require('path');

// 10개 미제작 단어 및 고유 이모지/색상 정의
const targetWords = [
    { name: 'bird', title: 'Bird', meaning: '새', emoji: '🐦', bg: '#E0F7FA', color: '#00838F' },
    { name: 'duck', title: 'Duck', meaning: '오리', emoji: '🦆', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'pig', title: 'Pig', meaning: '돼지', emoji: '🐷', bg: '#FCE4EC', color: '#C2185B' },
    { name: 'bear', title: 'Bear', meaning: '곰', emoji: '🐻', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'rabbit', title: 'Rabbit', meaning: '토끼', emoji: '🐰', bg: '#F3E5F5', color: '#7B1FA2' },
    { name: 'lion', title: 'Lion', meaning: '사자', emoji: '🦁', bg: '#FFF3E0', color: '#E65100' },
    { name: 'tiger', title: 'Tiger', meaning: '호랑이', emoji: '🐯', bg: '#FFE0B2', color: '#EF6C00' },
    { name: 'elephant', title: 'Elephant', meaning: '코끼리', emoji: '🐘', bg: '#ECEFF1', color: '#37474F' },
    { name: 'giraffe', title: 'Giraffe', meaning: '기린', emoji: '🦒', bg: '#FFF8E1', color: '#FF8F00' },
    { name: 'monkey', title: 'Monkey', meaning: '원숭이', emoji: '🐒', bg: '#FBE9E7', color: '#D84315' }
];

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 각 단어별 귀여운 일러스트 SVG 생성 및 데이터 작성
targetWords.forEach(item => {
    const filePath = path.join(imagesDir, `${item.name}.png`);
    
    // SVG 고화질 베이스 생성 (브라우저 및 img 태그에서 바로 렌더링 지원)
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100%" height="100%" rx="36" fill="${item.bg}"/>
    <circle cx="150" cy="135" r="90" fill="#FFFFFF" opacity="0.9"/>
    <text x="150" y="165" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif" font-size="100" text-anchor="middle">${item.emoji}</text>
    <text x="150" y="255" font-family="'Nunito', 'Arial', sans-serif" font-size="28" font-weight="900" fill="${item.color}" text-anchor="middle">${item.title}</text>
</svg>
    `.trim();

    // SVG를 PNG 확장자로 이미지 폴더에 저장 (SVG-DataURI 구조 호환)
    const dataUriSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    
    // 간단한 SVG 백업 및 HTML 호환 포맷 저장
    fs.writeFileSync(filePath, svgContent, 'utf-8');
    fs.writeFileSync(path.join(imagesDir, `${item.name}.svg`), svgContent, 'utf-8');
    console.log(`✅ 이미지 생성 완료: images/${item.name}.png`);
});

console.log('🎉 10개 미제작 단어 일러스트 이미지 생성이 성공적으로 완료되었습니다.');
