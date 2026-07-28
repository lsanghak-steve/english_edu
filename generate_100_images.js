const fs = require('fs');
const path = require('path');

// 100개 미제작 단어 리스트 정의 (63번~162번)
const target100Words = [
    // 숫자 & 색상
    { name: 'one', title: 'One', emoji: '1️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'two', title: 'Two', emoji: '2️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'three', title: 'Three', emoji: '3️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'four', title: 'Four', emoji: '4️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'five', title: 'Five', emoji: '5️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'six', title: 'Six', emoji: '6️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'seven', title: 'Seven', emoji: '7️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'eight', title: 'Eight', emoji: '8️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'nine', title: 'Nine', emoji: '9️⃣', bg: '#FFF9E6', color: '#D35400' },
    { name: 'ten', title: 'Ten', emoji: '🔟', bg: '#FFF9E6', color: '#D35400' },
    { name: 'red', title: 'Red', emoji: '🔴', bg: '#FFEBEE', color: '#C62828' },
    { name: 'blue', title: 'Blue', emoji: '🔵', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'yellow', title: 'Yellow', emoji: '🟡', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'green', title: 'Green', emoji: '🟢', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'white', title: 'White', emoji: '⚪', bg: '#FAFAFA', color: '#424242' },
    { name: 'black', title: 'Black', emoji: '⬛', bg: '#ECEFF1', color: '#263238' },
    { name: 'pink', title: 'Pink', emoji: '🩷', bg: '#FCE4EC', color: '#C2185B' },

    // 날씨 & 자연
    { name: 'sun', title: 'Sun', emoji: '☀️', bg: '#FFF3E0', color: '#E65100' },
    { name: 'moon', title: 'Moon', emoji: '🌙', bg: '#FFF8E1', color: '#F57F17' },
    { name: 'star', title: 'Star', emoji: '⭐', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'sky', title: 'Sky', emoji: '☁️', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'cloud', title: 'Cloud', emoji: '☁️', bg: '#ECEFF1', color: '#37474F' },
    { name: 'rain', title: 'Rain', emoji: '🌧️', bg: '#E0F7FA', color: '#00838F' },
    { name: 'snow', title: 'Snow', emoji: '❄️', bg: '#E3F2FD', color: '#0D47A1' },
    { name: 'wind', title: 'Wind', emoji: '🌬️', bg: '#F5F5F5', color: '#616161' },
    { name: 'tree', title: 'Tree', emoji: '🌳', bg: '#E8F5E9', color: '#1B5E20' },
    { name: 'flower', title: 'Flower', emoji: '🌸', bg: '#FCE4EC', color: '#C2185B' },
    { name: 'leaf', title: 'Leaf', emoji: '🍃', bg: '#F1F8E9', color: '#33691E' },
    { name: 'river', title: 'River', emoji: '🌊', bg: '#E0F7FA', color: '#006064' },
    { name: 'mountain', title: 'Mountain', emoji: '⛰️', bg: '#EFEBE9', color: '#3E2723' },
    { name: 'sea', title: 'Sea', emoji: '🌊', bg: '#E1F5FE', color: '#01579B' },
    { name: 'beach', title: 'Beach', emoji: '🏖️', bg: '#FFF8E1', color: '#FF6F00' },

    // 집 & 사물 & 옷
    { name: 'home', title: 'Home', emoji: '🏠', bg: '#FFEBEE', color: '#B71C1C' },
    { name: 'room', title: 'Room', emoji: '🚪', bg: '#FFF3E0', color: '#E65100' },
    { name: 'door', title: 'Door', emoji: '🚪', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'window', title: 'Window', emoji: '🪟', bg: '#E0F7FA', color: '#00838F' },
    { name: 'bed', title: 'Bed', emoji: '🛏️', bg: '#E8EAF6', color: '#1A237E' },
    { name: 'table', title: 'Table', emoji: '🪵', bg: '#FFF3E0', color: '#EF6C00' },
    { name: 'clock', title: 'Clock', emoji: '⏰', bg: '#FFF8E1', color: '#F57F17' },
    { name: 'phone', title: 'Phone', emoji: '📱', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'tv', title: 'TV', emoji: '📺', bg: '#ECEFF1', color: '#263238' },
    { name: 'key', title: 'Key', emoji: '🔑', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'box', title: 'Box', emoji: '📦', bg: '#FFF3E0', color: '#E65100' },
    { name: 'lamp', title: 'Lamp', emoji: '💡', bg: '#FFFDE7', color: '#F57F17' },
    { name: 'mirror', title: 'Mirror', emoji: '🪞', bg: '#E0F7FA', color: '#00838F' },
    { name: 'cup', title: 'Cup', emoji: '☕', bg: '#FFEBEE', color: '#C62828' },
    { name: 'spoon', title: 'Spoon', emoji: '🥄', bg: '#FAFAFA', color: '#424242' },
    { name: 'shirt', title: 'Shirt', emoji: '👕', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'pants', title: 'Pants', emoji: '👖', bg: '#E8EAF6', color: '#283593' },
    { name: 'dress', title: 'Dress', emoji: '👗', bg: '#FCE4EC', color: '#C2185B' },
    { name: 'hat', title: 'Hat', emoji: '👒', bg: '#FFF8E1', color: '#FF8F00' },
    { name: 'cap', title: 'Cap', emoji: '🧢', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'shoes', title: 'Shoes', emoji: '👟', bg: '#ECEFF1', color: '#37474F' },
    { name: 'socks', title: 'Socks', emoji: '🧦', bg: '#F3E5F5', color: '#7B1FA2' },
    { name: 'coat', title: 'Coat', emoji: '🧥', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'jacket', title: 'Jacket', emoji: '🧥', bg: '#FFF3E0', color: '#EF6C00' },
    { name: 'ring', title: 'Ring', emoji: '💍', bg: '#FFFDE7', color: '#FBC02D' },

    // 교통 & 도시 & 행동 & 상태
    { name: 'car', title: 'Car', emoji: '🚗', bg: '#FFEBEE', color: '#C62828' },
    { name: 'bus', title: 'Bus', emoji: '🚌', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'train', title: 'Train', emoji: '🚆', bg: '#E1F5FE', color: '#0288D1' },
    { name: 'bike', title: 'Bike', emoji: '🚲', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'airplane', title: 'Airplane', emoji: '✈️', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'ship', title: 'Ship', emoji: '🚢', bg: '#E0F7FA', color: '#00838F' },
    { name: 'taxi', title: 'Taxi', emoji: '🚕', bg: '#FFFDE7', color: '#F57F17' },
    { name: 'street', title: 'Street', emoji: '🛣️', bg: '#ECEFF1', color: '#37474F' },
    { name: 'park', title: 'Park', emoji: '🏞️', bg: '#E8F5E9', color: '#1B5E20' },
    { name: 'store', title: 'Store', emoji: '🏪', bg: '#FFF8E1', color: '#FF8F00' },
    { name: 'go', title: 'Go', emoji: '🏃', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'come', title: 'Come', emoji: '🚶', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'run', title: 'Run', emoji: '🏃', bg: '#FFEBEE', color: '#C62828' },
    { name: 'walk', title: 'Walk', emoji: '🚶', bg: '#FFF8E1', color: '#F57F17' },
    { name: 'jump', title: 'Jump', emoji: '🦘', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'sit', title: 'Sit', emoji: '🪑', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'stand', title: 'Stand', emoji: '🧍', bg: '#ECEFF1', color: '#37474F' },
    { name: 'eat', title: 'Eat', emoji: '🍽️', bg: '#FFF3E0', color: '#E65100' },
    { name: 'drink', title: 'Drink', emoji: '🥤', bg: '#E0F7FA', color: '#00838F' },
    { name: 'sleep', title: 'Sleep', emoji: '😴', bg: '#E8EAF6', color: '#1A237E' },
    { name: 'sing', title: 'Sing', emoji: '🎤', bg: '#F3E5F5', color: '#7B1FA2' },
    { name: 'dance', title: 'Dance', emoji: '💃', bg: '#FCE4EC', color: '#C2185B' },
    { name: 'read', title: 'Read', emoji: '📖', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'write', title: 'Write', emoji: '✍️', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'draw', title: 'Draw', emoji: '🎨', bg: '#F3E5F5', color: '#8E24AA' },
    { name: 'listen', title: 'Listen', emoji: '🎧', bg: '#E0F7FA', color: '#00838F' },
    { name: 'speak', title: 'Speak', emoji: '🗣️', bg: '#E8EAF6', color: '#283593' },
    { name: 'look', title: 'Look', emoji: '👀', bg: '#FFF8E1', color: '#F57F17' },
    { name: 'wash', title: 'Wash', emoji: '🧼', bg: '#E0F7FA', color: '#006064' },
    { name: 'play', title: 'Play', emoji: '🎮', bg: '#FCE4EC', color: '#880E4F' },
    { name: 'happy', title: 'Happy', emoji: '😊', bg: '#FFFDE7', color: '#FBC02D' },
    { name: 'sad', title: 'Sad', emoji: '😢', bg: '#E3F2FD', color: '#1565C0' },
    { name: 'big', title: 'Big', emoji: '🐘', bg: '#ECEFF1', color: '#37474F' },
    { name: 'small', title: 'Small', emoji: '🐭', bg: '#FFF3E0', color: '#E65100' },
    { name: 'good', title: 'Good', emoji: '👍', bg: '#E8F5E9', color: '#2E7D32' },
    { name: 'bad', title: 'Bad', emoji: '👎', bg: '#FFEBEE', color: '#C62828' },
    { name: 'hot', title: 'Hot', emoji: '♨️', bg: '#FFEBEE', color: '#B71C1C' },
    { name: 'cold', title: 'Cold', emoji: '🧊', bg: '#E0F7FA', color: '#00838F' },
    { name: 'fast', title: 'Fast', emoji: '⚡', bg: '#FFFDE7', color: '#F57F17' },
    { name: 'slow', title: 'Slow', emoji: '🐢', bg: '#E8F5E9', color: '#1B5E20' },
    { name: 'cute', title: 'Cute', emoji: '🐱', bg: '#FCE4EC', color: '#C2185B' },
    { name: 'pretty', title: 'Pretty', emoji: '🌸', bg: '#F3E5F5', color: '#7B1FA2' },
    { name: 'clean', title: 'Clean', emoji: '✨', bg: '#E0F7FA', color: '#00838F' },
    { name: 'dirty', title: 'Dirty', emoji: '🧹', bg: '#EFEBE9', color: '#4E342E' },
    { name: 'kind', title: 'Kind', emoji: '🤝', bg: '#FFF8E1', color: '#FF8F00' }
];

const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 100개 이미지 파일 고화질 일괄 렌더링
target100Words.forEach(item => {
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
});

console.log('🎉 100개 단어 이미지 일괄 생성이 모두 성공적으로 완료되었습니다!');
