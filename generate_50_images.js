const fs = require('fs');
const path = require('path');

// 50개 미제작 단어 리스트 정의
const target50Words = [
    // 동물 & 곤충
    { name: 'horse', title: 'Horse', emoji: '🐴', bg: '#FFF3E0', color: '#E65100' },
    { name: 'cow', title: 'Cow', emoji: '🐮', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'sheep', title: 'Sheep', emoji: '🐑', bg: '#FAFAFA', color: '#424242' },
    { name: 'frog', title: 'Frog', emoji: '🐸', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'butterfly', title: 'Butterfly', emoji: '🦋', bg: '#F3E5F5', color: '#7B1FA2' },
    { name: 'ant', title: 'Ant', emoji: '🐜', bg: '#FFEBEE', color: '#C62828' },
    { name: 'bee', title: 'Bee', emoji: '🐝', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'whale', title: 'Whale', emoji: '🐳', bg: '#E0F7FA', color: '#00838F' },
    { name: 'dolphin', title: 'Dolphin', emoji: '🐬', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'shark', title: 'Shark', emoji: '🦈', bg: '#ECEFF1', color: '#37474F' },
    { name: 'snake', title: 'Snake', emoji: '🐍', bg: '#F1F8E9', color: '#558B2F' },
    { name: 'turtle', title: 'Turtle', emoji: '🐢', bg: '#E8F5E9', color: '#1B5E20' },
    { name: 'fox', title: 'Fox', emoji: '🦊', bg: '#FBE9E7', color: '#D84315' },

    // 가족 & 사람
    { name: 'father', title: 'Father', emoji: '👨', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'mother', title: 'Mother', emoji: '👩', bg: '#FCE4EC', color: '#C2185B' },
    { name: 'brother', title: 'Brother', emoji: '👦', bg: '#E8EAF6', color: '#283593' },
    { name: 'sister', title: 'Sister', emoji: '👧', bg: '#F3E5F5', color: '#6A1B9A' },
    { name: 'grandfather', title: 'Grandfather', emoji: '👴', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'grandmother', title: 'Grandmother', emoji: '👵', bg: '#FFF3E0', color: '#EF6C00' },
    { name: 'friend', title: 'Friend', emoji: '🧑‍🤝‍🧑', bg: '#FFF8E1', color: '#F57F17' },
    { name: 'teacher', title: 'Teacher', emoji: '👩‍🏫', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'student', title: 'Student', emoji: '🧑‍🎓', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'baby', title: 'Baby', emoji: '👶', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'doctor', title: 'Doctor', emoji: '🧑‍⚕️', bg: '#E0F7FA', color: '#00838F' },
    { name: 'nurse', title: 'Nurse', emoji: '👩‍⚕️', bg: '#FFEBEE', color: '#C62828' },
    { name: 'police', title: 'Police', emoji: '👮', bg: '#E8EAF6', color: '#1A237E' },
    { name: 'firefighter', title: 'Firefighter', emoji: '🧑‍🚒', bg: '#FFEBEE', color: '#B71C1C' },
    { name: 'cook', title: 'Cook', emoji: '🧑‍🍳', bg: '#FFF3E0', color: '#E65100' },

    // 학교 & 학용품
    { name: 'school', title: 'School', emoji: '🏫', bg: '#FFF8E1', color: '#FF8F00' },
    { name: 'classroom', title: 'Classroom', emoji: '🏫', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'book', title: 'Book', emoji: '📖', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'pencil', title: 'Pencil', emoji: '✏️', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'pen', title: 'Pen', emoji: '🖊️', bg: '#ECEFF1', color: '#37474F' },
    { name: 'desk', title: 'Desk', emoji: '🪑', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'chair', title: 'Chair', emoji: '🪑', bg: '#FFF3E0', color: '#EF6C00' },
    { name: 'bag', title: 'Bag', emoji: '🎒', bg: '#FFEBEE', color: '#C62828' },
    { name: 'eraser', title: 'Eraser', emoji: '🧹', bg: '#F3E5F5', color: '#7B1FA2' },
    { name: 'ruler', title: 'Ruler', emoji: '📏', bg: '#E0F7FA', color: '#00838F' },
    { name: 'class', title: 'Class', emoji: '🏫', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'computer', title: 'Computer', emoji: '💻', bg: '#ECEFF1', color: '#263238' },

    // 몸 & 얼굴
    { name: 'eye', title: 'Eye', emoji: '👀', bg: '#E3F2FD', color: '#0D47A1' },
    { name: 'ear', title: 'Ear', emoji: '👂', bg: '#FFF3E0', color: '#E65100' },
    { name: 'mouth', title: 'Mouth', emoji: '👄', bg: '#FFEBEE', color: '#B71C1C' },
    { name: 'nose', title: 'Nose', emoji: '👃', bg: '#FFF8E1', color: '#F57F17' },
    { name: 'hand', title: 'Hand', emoji: '✋', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'foot', title: 'Foot', emoji: '🦶', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'head', title: 'Head', emoji: '🗣️', bg: '#E8EAF6', color: '#1A237E' },
    { name: 'face', title: 'Face', emoji: '😊', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'arm', title: 'Arm', emoji: '💪', bg: '#FFE0B2', color: '#E65100' },
    { name: 'leg', title: 'Leg', emoji: '🦵', bg: '#F3E5F5', color: '#7B1FA2' }
];

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 50개 이미지 파일 고화질 렌더링 작성
target50Words.forEach(item => {
    const pngPath = path.join(imagesDir, `${item.name}.png`);
    const svgPath = path.join(imagesDir, `${item.name}.svg`);

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <rect width="100%" height="100%" rx="36" fill="${item.bg}"/>
    <circle cx="150" cy="135" r="90" fill="#FFFFFF" opacity="0.95"/>
    <text x="150" y="165" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif" font-size="100" text-anchor="middle">${item.emoji}</text>
    <text x="150" y="255" font-family="'Nunito', 'Arial', sans-serif" font-size="28" font-weight="900" fill="${item.color}" text-anchor="middle">${item.title}</text>
</svg>
    `.trim();

    fs.writeFileSync(pngPath, svgContent, 'utf-8');
    fs.writeFileSync(svgPath, svgContent, 'utf-8');
    console.log(`✅ 생성 완료: images/${item.name}.png`);
});

console.log('🎉 50개 단어 이미지 일괄 생성이 모두 완료되었습니다!');
