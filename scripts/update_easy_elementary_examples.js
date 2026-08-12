const fs = require('fs');
const path = require('path');

// 대표 단어 80여 개 초등 아주 쉬운 커스텀 문장 사전
const easyCustomMap = {
    "apple": ["I like sweet red apples.", "나는 달콤한 빨간 사과를 좋아해요."],
    "banana": ["Monkeys love yellow bananas.", "원숭이는 노란 바나나를 좋아해요."],
    "milk": ["I drink warm milk every day.", "나는 매일 따뜻한 우유를 마셔요."],
    "water": ["Please give me cold water.", "나에게 시원한 물을 주세요."],
    "bread": ["This bread is soft and tasty.", "이 빵은 부드럽고 맛있어요."],
    "egg": ["I eat an egg for breakfast.", "나는 아침으로 계란을 먹어요."],
    "juice": ["Sweet orange juice is delicious.", "달콤한 오렌지 주스는 맛있어요."],
    "rice": ["We eat warm rice for lunch.", "우리는 점심으로 따뜻한 밥을 먹어요."],
    "cake": ["Happy birthday cake is sweet.", "생일 축하 케이크는 달콤해요."],
    "candy": ["The sweet candy is yummy.", "달콤한 사탕은 맛있어요."],
    "orange": ["The orange is juicy and sweet.", "오렌지가 즙이 많고 달콤해요."],
    "grape": ["Purple grapes are very sweet.", "보라색 포도는 매우 달콤해요."],
    "strawberry": ["Red strawberries taste good.", "빨간 딸기는 맛이 좋아요."],
    "peach": ["The pink peach is soft.", "분홍 복숭아는 부드러워요."],
    "watermelon": ["Watermelon is sweet in summer.", "수박은 여름에 달콤해요."],
    "pizza": ["Let's eat cheese pizza today.", "오늘 치즈 피자를 먹어요."],
    "hamburger": ["I like big hamburgers.", "나는 큰 햄버거를 좋아해요."],
    "noodle": ["Hot noodles taste great.", "따뜻한 국수는 맛이 좋아요."],
    "meat": ["Fresh meat is good for health.", "신선한 고기는 건강에 좋아요."],
    "fish": ["Fish swim fast in the water.", "물고기가 물속에서 빠르게 헤엄쳐요."],
    "soup": ["Warm soup is good in winter.", "겨울에는 따뜻한 국이 좋아요."],
    "salad": ["Eat fresh and healthy salad.", "신선하고 건강한 샐러드를 먹어요."],
    "cheese": ["Yellow cheese is very savory.", "노란 치즈는 매우 고소해요."],
    "butter": ["Put butter on the warm bread.", "따뜻한 빵 위에 버터를 바르세요."],
    "cookie": ["My mom bakes sweet cookies.", "엄마가 달콤한 쿠키를 구워요."],
    "lemon": ["Yellow lemon is sour.", "노란 레몬은 셔요."],
    "melon": ["Sweet melon is fresh and green.", "달콤한 멜론은 신선하고 초록색이에요."],
    "cherry": ["The red cherry is very small.", "빨간 체리는 매우 작아요."],
    "potato": ["Fried potato is crisp and good.", "감자튀김은 바삭하고 맛있어요."],
    "tomato": ["Red tomato is good for you.", "빨간 토마토는 당신에게 좋아요."],
    "carrot": ["Rabbits like crunchy carrots.", "토끼는 아삭한 당근을 좋아해요."],
    "dog": ["The cute dog wags its tail.", "귀여운 강아지가 꼬리를 쳐요."],
    "cat": ["The white cat is sleeping.", "하얀 고양이가 자고 있어요."],
    "bird": ["The blue bird sings nicely.", "파란 새가 예쁘게 노래해요."],
    "duck": ["Yellow ducks swim in pond.", "노란 오리들이 연못에서 수영해요."],
    "pig": ["The pink pig is cute.", "분홍 돼지는 귀여워요."],
    "bear": ["The big bear loves honey.", "큰 곰은 꿀을 좋아해요."],
    "rabbit": ["White rabbit jumps high.", "하얀 토끼가 높이 뛰어올라요."],
    "lion": ["The lion is very strong.", "사자는 매우 힘이 세요."],
    "tiger": ["The tiger has dark stripes.", "호랑이는 검은 줄무늬가 있어요."],
    "elephant": ["Elephants have long trunks.", "코끼리는 긴 코를 가지고 있어요."],
    "giraffe": ["Giraffes are very tall.", "기린은 키가 매우 크요."],
    "monkey": ["Monkeys climb high trees.", "원숭이는 높은 나무를 타요."],
    "horse": ["The horse runs very fast.", "말이 매우 빠르게 달려요."],
    "cow": ["Cows give us clean milk.", "소는 우리에게 깨끗한 우유를 줘요."],
    "sheep": ["Sheep have soft white wool.", "양은 부드러운 하얀 털을 가져요."],
    "frog": ["Green frog jumps high.", "초록 개구리가 높이 뛰어올라요."],
    "butterfly": ["Pretty butterfly flies high.", "예쁜 나비가 높이 날아가요."],
    "school": ["I go to school every day.", "나는 매일 학교에 가요."],
    "book": ["Read a good story book.", "재미있는 이야기 책을 읽어요."],
    "pencil": ["Write with a sharp pencil.", "뾰족한 연필로 글을 써요."],
    "desk": ["Clean your study desk.", "공부 책상을 깨끗이 정리해요."],
    "chair": ["Sit on the wooden chair.", "나무 의자에 앉으세요."],
    "bag": ["My blue school bag is heavy.", "내 파란 책가방은 무거워요."],
    "sun": ["The sun shines bright.", "태양이 밝게 빛나요."],
    "moon": ["The round moon shines at night.", "밤에 둥근 달이 빛나요."],
    "star": ["Twinkle twinkle little star.", "반짝반짝 작은 별."],
    "sky": ["Look at the blue sky.", "파란 하늘을 보세요."],
    "tree": ["Green trees grow high.", "초록 나무들이 높게 자라요."],
    "flower": ["Red flower smells sweet.", "빨간 꽃이 달콤한 향기를 내요."],
    "house": ["Welcome to my happy house.", "우리 행복한 집에 온 걸 환영해요."],
    "father": ["My father is very kind.", "우리 아버지는 매우 친절해요."],
    "mother": ["I love my mother so much.", "나는 엄마를 정말 사랑해요."],
    "friend": ["We are good best friends.", "우리는 좋은 단짝 친구예요."]
};

// 초등 쉬운 패턴 생성기
function makeEasySentence(word, meaning) {
    const key = word.toLowerCase().replace(/ /g, '_');
    if (easyCustomMap[key]) {
        return easyCustomMap[key];
    }
    
    // 명사, 동사 등 아주 짧은 초등 예문 자동 생성
    return [
        `I see a nice ${word.toLowerCase()}.`,
        `나는 멋진 ${meaning}을(를) 봐요.`
    ];
}

const wordsDataPath = path.join(__dirname, 'words_data.js');
let content = fs.readFileSync(wordsDataPath, 'utf-8');
const match = content.match(/const wordList500 = (\[[\s\S]*?\]);/);
const wordList = JSON.parse(match[1]);

const updatedList = wordList.map((item, idx) => {
    const easy = makeEasySentence(item.word, item.meaning);
    item.exampleEn = easy[0];
    item.exampleKo = easy[1];
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

console.log('🐣 [완료] 500개 단어 전체 예문이 초등 눈높이의 아주 쉽고 간단한 문장으로 100% 교체 갱신되었습니다!');
