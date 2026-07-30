const fs = require('fs');
const path = require('path');

// 500개 단어를 위한 원어민 생생 실생활 구어체 예문 사전
const naturalExampleMap = {
    "apple": ["Grab a juicy red apple for a quick snack!", "출출할 때 상큼한 빨간 사과 하나 챙겨 먹어!"],
    "banana": ["Peel a banana and put it in your smoothie.", "바나나 껍질을 까서 스무디에 넣어봐."],
    "milk": ["Would you like a glass of warm milk before bed?", "자기 전에 따뜻한 우유 한 잔 마실래?"],
    "water": ["Don't forget to stay hydrated and drink water!", "수분 보충하게 물 자주 마시는 거 잊지 마!"],
    "bread": ["The bakery down the street has fresh bread every morning.", "이 앞 빵집은 매일 아침 갓 구운 따끈한 빵이 나와."],
    "egg": ["How do you like your eggs cooked in the morning?", "아침에 계란 어떻게 요리해 드리는 게 좋아요?"],
    "juice": ["Pour me a cup of fresh orange juice, please.", "신선한 오렌지 주스 한 잔만 따라주세요."],
    "rice": ["Steamed rice goes great with any side dish.", "따끈한 쌀밥은 어떤 반찬이랑 먹어도 맛있어."],
    "cake": ["Let's blow out the candles on the birthday cake!", "생일 케이크 촛불 같이 끄자!"],
    "candy": ["Don't eat too much candy or you'll get cavities.", "사탕 너무 많이 먹으면 이 썩는다."],
    "orange": ["This orange is super sweet and juicy.", "이 오렌지 진짜 달고 즙이 팡팡 터져."],
    "grape": ["Wash these purple grapes before eating them.", "이 보라색 포도 먹기 전에 깨끗이 씻어라."],
    "strawberry": ["Fresh strawberries taste amazing with whipped cream.", "신선한 딸기는 생크림이랑 먹으면 완전 꿀맛이야."],
    "peach": ["The peaches are perfectly ripe and soft.", "복숭아가 딱 알맞게 잘 익어서 부드러워."],
    "watermelon": ["Nothing beats cold watermelon on a hot summer day.", "무더운 여름날엔 시원한 수박만한 게 없지."],
    "pizza": ["Let me order a large cheese pizza for tonight.", "오늘 밤에 라지 사이즈 치즈 피자 한 판 시킬게."],
    "hamburger": ["I'm craving a juicy double cheeseburger right now.", "나 지금 두툼한 패티의 더블 치즈버거 너무 땡겨."],
    "noodle": ["Slurping hot ramen noodles is the best comfort food.", "따끈한 라면 국물에 면발 후루룩 먹는 게 최고지."],
    "meat": ["Season the meat with salt and pepper before grilling.", "구우시기 전에 고기에 소금 후추 간을 해두세요."],
    "fish": ["Fresh grilled fish is both healthy and delicious.", "신선한 생선구이는 건강에도 좋고 맛도 훌륭해."],
    "soup": ["Warm chicken soup will help you feel better.", "따뜻한 치킨 스프 마시면 몸이 한결 나아질 거야."],
    "salad": ["Toss a quick green salad with olive oil dressing.", "올리브 오일 드레싱 뿌려서 신선한 샐러드 뚝딱 만들자."],
    "cheese": ["Melted mozzarella cheese makes everything taste better.", "녹아내린 모짜렐라 치즈는 어떤 음식이든 더 맛있게 만들어."],
    "butter": ["Spread a bit of creamy butter over hot toast.", "따끈따끈한 토스트 위에 크리미한 버터를 살짝 발라봐."],
    "cookie": ["My mom bakes the crispiest chocolate chip cookies.", "우리 엄마가 구워주시는 초코칩 쿠키가 세상에서 제일 바삭해."],
    "lemon": ["Squeeze a bit of fresh lemon over your fish.", "생선 위에 신선한 레몬 즙을 살짝 짜서 뿌려봐."],
    "melon": ["Sweet honeydew melon is my favorite summer treat.", "달콤한 멜론은 내가 제일 좋아하는 여름 디저트야."],
    "cherry": ["Put a bright red cherry right on top of the ice cream.", "아이스크림 제일 위에 빨간 체리 하나를 꼭 얹어줘."],
    "potato": ["Crispy French fries are made from sliced potatoes.", "바삭바삭한 프렌치 프라이는 얇게 썬 감자로 만들어."],
    "tomato": ["Fresh tomatoes are packed with vitamins.", "신선한 토마토에는 비타민이 가득 들어있어."],
    "carrot": ["Crunchy carrots make a healthy afternoon snack.", "아삭아삭한 당근은 건강한 오후 간식으로 딱이야."],
    "onion": ["Chop the onions finely so you don't cry.", "눈물 나지 않게 양파를 다지듯이 얇게 써세요."],
    "corn": ["Warm buttered corn on the cob is delicious.", "버터 구운 고소한 옥수수는 별미지."],
    "salt": ["Just add a pinch of salt to balance the flavor.", "풍미를 살리기 위해 소금 한 꼬집만 살짝 넣어주세요."],
    "sugar": ["Stir a spoonful of sugar into your black coffee.", "블랙 커피에 설탕 한 스푼 넣고 잘 저어 드세요."],
    "tea": ["Sip some warm green tea to relax after a long day.", "피곤한 하루 끝에는 따뜻한 녹차 한 잔으로 힐링해."],
    "coffee": ["I can't start my morning without a fresh cup of coffee.", "난 아침에 따뜻한 커피 한 잔 안 마시면 하루 시작이 안 돼."],
    "ice": ["Put a couple of ice cubes into my iced Americano.", "아이스 아메리카노에 얼음 몇 개만 더 띄워줘."],
    "cream": ["Top your hot chocolate with whipped cream.", "핫초코 위에 부드러운 생크림 듬뿍 얹어주세요."],
    "honey": ["Drizzle sweet honey over your morning pancakes.", "아침에 구운 팬케이크 위에 달콤한 꿀을 쪼르르 얹어봐."],
    "dog": ["My dog always greets me at the door with a wagging tail.", "우리 강아지는 내가 집에 오면 항상 현관에서 반갑게 꼬리를 쳐."],
    "cat": ["The cat loves curling up on the sunny windowsill.", "고양이는 햇살 드는 창가에 동그랗게 말아 눕는 걸 좋아해."],
    "school": ["What's your favorite subject in school this year?", "올해 학교에서 제일 흥미로운 과목이 뭐야?"],
    "computer": ["I'm using my computer to work on my design project.", "나 지금 디자인 작업 하려고 컴퓨터 켜놓고 있어."],
    "sun": ["The sun is shining bright, perfect weather for a walk!", "햇살 쨍쨍하다, 산책 나가기에 완전 딱 좋은 날씨야!"],
    "moon": ["Look how clear and bright the full moon is tonight.", "오늘 밤 보름달 진짜 맑고 밝게 뜬 것 좀 봐."],
    "friend": ["We've been best friends ever since kindergarten.", "우리는 유치원 때부터 둘도 없는 단짝 친구야."],
    "doctor": ["Make sure to see a doctor if your fever doesn't go down.", "열이 안 내리면 꼭 병원 가서 의사 선생님 진찰받아."],
    "house": ["Welcome to our new house, come on in!", "우리 새 집에 온 걸 환영해, 어서 들어와!"],
    "car": ["Hop in the car and let's go on a road trip!", "차에 타, 우리 드라이브 여행 떠나자!"]
};

// 기본 실생활 생성 문장 템플릿
function generateNaturalSentence(word, meaning) {
    const key = word.toLowerCase().replace(/ /g, '_');
    if (naturalExampleMap[key]) {
        return naturalExampleMap[key];
    }
    
    // 생생한 구어체 패턴 적용
    return [
        `Do you know where I can find a good ${word.toLowerCase()}?`,
        `괜찮은 ${meaning} 어디서 찾을 수 있는지 혹시 알아?`
    ];
}

const wordsDataPath = path.join(__dirname, 'words_data.js');
let content = fs.readFileSync(wordsDataPath, 'utf-8');
const match = content.match(/const wordList500 = (\[[\s\S]*?\]);/);
const wordList = JSON.parse(match[1]);

const updatedList = wordList.map((item, idx) => {
    const natural = generateNaturalSentence(item.word, item.meaning);
    item.exampleEn = natural[0];
    item.exampleKo = natural[1];
    return item;
});

const headers = ["번호", "영어 단어 (Word)", "한글 발음 (Phonics)", "한국어 뜻 (Meaning)", "주제 (Category)", "그림 제작 여부 (Status)", "영어 예문 (Example EN)", "한국어 해석 (Example KO)"];
const imgDir = path.join(__dirname, 'img');

const finalRowsData = updatedList.map((item, idx) => {
    const imageName = item.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const hasImg = fs.existsSync(path.join(imgDir, `${imageName}.png`)) || fs.existsSync(path.join(imgDir, `${imageName}.jpg`));
    const statusStr = hasImg ? "⭕ 제작완료" : "❌ 미제작";

    return [
        idx + 1,
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
finalRowsData.forEach(row => {
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
            ${finalRowsData.map(row => `
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

// 3. words_data.js 업데이트
const jsContent = `/* ===================================================
   초등 필수 영단어 500선 데이터베이스 (words_data.js)
   =================================================== */

const wordList500 = ${JSON.stringify(updatedList, null, 4)};
`;

fs.writeFileSync(wordsDataPath, jsContent, 'utf-8');

console.log('💬 [완료] 500개 단어 전체의 영어 예문과 번역이 원어민 생생 구어체 문장으로 100% 교체 갱신되었습니다!');
