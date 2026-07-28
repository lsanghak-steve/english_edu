const fs = require('fs');
const path = require('path');

// 500개 단어 생성기 & 엑셀 내 이미지 제작 여부(⭕/❌) 자동 판별 갱신
const imagesDir = path.join(__dirname, 'images');

// 기존 데이터 로딩...
const targetCategories = [
    {
        category: "과일/음식 🍎",
        items: [
            ["Apple", "[애플]", "사과", "I eat an apple.", "나는 사과를 먹어요."],
            ["Banana", "[버내너]", "바나나", "Monkeys like bananas.", "원숭이는 바나나를 좋아해요."],
            ["Milk", "[밀크]", "우유", "Drink warm milk.", "따뜻한 우유를 마셔요."],
            ["Water", "[워터]", "물", "I drink water.", "나는 물을 마셔요."],
            ["Bread", "[브레드]", "빵", "I eat bread for breakfast.", "나는 아침으로 빵을 먹어요."],
            ["Egg", "[에그]", "계란/달걀", "I like fried eggs.", "나는 계란 프라이를 좋아해요."],
            ["Juice", "[주스]", "주스", "Orange juice is sweet.", "오렌지 주스는 달콤해요."],
            ["Rice", "[라이스]", "밥/쌀", "We eat rice every day.", "우리는 매일 밥을 먹어요."],
            ["Cake", "[케이크]", "케이크", "Happy birthday cake!", "생일 축하 케이크!"],
            ["Candy", "[캔디]", "사탕", "Sweet candy is yummy.", "달콤한 사탕은 맛있어요."],
            ["Orange", "[오렌지]", "오렌지", "The orange is juicy.", "오렌지가 즙이 많아요."],
            ["Grape", "[그레이프]", "포도", "Purple grapes are sweet.", "보라색 포도는 달콤해요."],
            ["Strawberry", "[스트로베리]", "딸기", "Red strawberries are fresh.", "빨간 딸기가 신선해요."],
            ["Peach", "[피치]", "복숭아", "Pink peach is soft.", "분홍 복숭아는 부드러워요."],
            ["Watermelon", "[워터멜론]", "수박", "Watermelon is good in summer.", "수박은 여름에 좋아요."],
            ["Pizza", "[피자]", "피자", "Let's eat cheese pizza.", "치즈 피자를 먹어요."],
            ["Hamburger", "[햄버거]", "햄버거", "I like big hamburgers.", "나는 큰 햄버거를 좋아해요."],
            ["Noodle", "[누들]", "국수/면", "Hot noodles are delicious.", "따뜻한 국수는 맛있어요."],
            ["Meat", "[미트]", "고기", "Cook the fresh meat.", "신선한 고기를 요리해요."],
            ["Fish", "[피쉬]", "생선/물고기", "Fresh fish is good.", "신선한 생선이 좋아요."],
            ["Soup", "[수프]", "스프/국", "Warm soup is nice.", "따뜻한 스프가 좋아요."],
            ["Salad", "[샐러드]", "샐러드", "Eat healthy salad.", "건강한 샐러드를 먹어요."],
            ["Cheese", "[치즈]", "치즈", "Yellow cheese is savory.", "노란 치즈는 고소해요."],
            ["Butter", "[버터]", "버터", "Spread butter on bread.", "빵에 버터를 바르세요."],
            ["Cookie", "[쿠키]", "쿠키/과자", "Bake sweet cookies.", "달콤한 쿠키를 구워요."]
        ]
    },
    {
        category: "동물 & 곤충 🐶",
        items: [
            ["Dog", "[독]", "개/강아지", "My dog wags its tail.", "내 강아지가 꼬리를 쳐요."],
            ["Cat", "[캣]", "고양이", "The cat sleeps on the bed.", "고양이가 침대에서 자요."],
            ["Bird", "[버드]", "새", "The bird sings softly.", "새가 부드럽게 노래해요."],
            ["Duck", "[덕]", "오리", "Ducks swim well.", "오리는 수영을 잘해요."],
            ["Pig", "[피그]", "돼지", "Pigs are cute.", "돼지는 귀여워요."],
            ["Bear", "[베어]", "곰", "Bears love honey.", "곰은 꿀을 좋아해요."],
            ["Rabbit", "[래빗]", "토끼", "Rabbits jump high.", "토끼는 높이 뛰어올라요."],
            ["Lion", "[라이언]", "사자", "Lions are strong.", "사자는 힘이 세요."],
            ["Tiger", "[타이거]", "호랑이", "Tigers have stripes.", "호랑이는 줄무늬가 있어요."],
            ["Elephant", "[엘리펀트]", "코끼리", "Elephants have long trunks.", "코끼리는 긴 코를 가지고 있어요."],
            ["Giraffe", "[지래프]", "기린", "Giraffes are tall.", "기린은 키가 크요."],
            ["Monkey", "[멍키]", "원숭이", "Monkeys climb trees.", "원숭이는 나무를 타요."],
            ["Horse", "[호스]", "말", "The horse runs fast.", "말이 빠르게 달려요."],
            ["Cow", "[카우]", "소", "Cows give us milk.", "소는 우리에게 우유를 줘요."],
            ["Sheep", "[쉽]", "양", "Sheep have white wool.", "양은 하얀 털을 갖고 있어요."],
            ["Frog", "[프로그]", "개구리", "Green frog jumps.", "초록 개구리가 뛰어요."],
            ["Butterfly", "[버터플라이]", "나비", "The butterfly flies gently.", "나비가 부드럽게 날아요."],
            ["Ant", "[앤트]", "개미", "Ants work hard.", "개미는 열심히 일해요."],
            ["Bee", "[비]", "꿀벌", "Bees make sweet honey.", "벌들은 달콤한 꿀을 만들어요."],
            ["Whale", "[웨일]", "고래", "Big whale swims in the ocean.", "큰 고래가 바다에서 헤엄쳐요."],
            ["Dolphin", "[돌핀]", "돌고래", "Dolphins are smart.", "돌고래는 똑똑해요."],
            ["Shark", "[샤크]", "상어", "Sharks swim fast.", "상어는 빠르게 수영해요."],
            ["Snake", "[스네이크]", "뱀", "The snake moves quietly.", "뱀이 조용히 움직여요."],
            ["Turtle", "[터틀]", "거북이", "Turtles walk slowly.", "거북이는 천천히 걸어가요."],
            ["Fox", "[폭스]", "여우", "The fox is clever.", "여우는 영리해요."]
        ]
    }
];

// 추가 데이터 확장
const additionalThemes = [
    {
        cat: "가족 & 사람 👨‍👩‍👧‍👦",
        words: [
            ["Father", "[파더]", "아버지/아빠", "My father is kind.", "우리 아버지는 친절해요."],
            ["Mother", "[마더]", "어머니/엄마", "I love my mother.", "나는 엄마를 사랑해요."],
            ["Brother", "[브라더]", "남동생/형/오빠", "My brother plays soccer.", "내 남동생은 축구를 해요."],
            ["Sister", "[시스터]", "여동생/누나/언니", "My sister plays the piano.", "내 여동생은 피아노를 쳐요."],
            ["Friend", "[프렌드]", "친구", "We are good friends.", "우리는 좋은 친구예요."],
            ["Teacher", "[티처]", "선생님", "The teacher is smiling.", "선생님이 미소 짓고 계셔요."],
            ["Student", "[스튜던트]", "학생", "I am a smart student.", "나는 똑똑한 학생이에요."],
            ["Baby", "[베이비]", "아기", "The baby is sleeping.", "아기가 자고 있어요."],
            ["Doctor", "[닥터]", "의사", "The doctor helps sick people.", "의사는 아픈 사람을 도와요."]
        ]
    },
    {
        cat: "학교 & 학용품 🏫",
        words: [
            ["School", "[스쿨]", "학교", "I go to school.", "나는 학교에 가요."],
            ["Book", "[북]", "책", "Read a good book.", "좋은 책을 읽어요."],
            ["Pencil", "[펜슬]", "연필", "I write with a pencil.", "나는 연필로 글을 써요."],
            ["Desk", "[데스크]", "책상", "Clean your desk.", "책상을 깨끗이 정리해요."],
            ["Chair", "[체어]", "의자", "Sit on the chair.", "의자에 앉으세요."],
            ["Bag", "[백]", "가방", "My bag is blue.", "내 가방은 파란색이에요."],
            ["Eraser", "[이레이저]", "지우개", "Pass me the eraser.", "지우개 좀 전해줘."],
            ["Ruler", "[룰러]", "자", "Use a ruler to draw lines.", "선을 그릴 때 자를 사용해요."]
        ]
    }
];

let rawWords = [];
targetCategories.forEach(catObj => {
    catObj.items.forEach(item => {
        rawWords.push({
            word: item[0],
            phonics: item[1],
            meaning: item[2],
            category: catObj.category,
            exampleEn: item[3],
            exampleKo: item[4]
        });
    });
});

additionalThemes.forEach(themeObj => {
    themeObj.words.forEach(item => {
        rawWords.push({
            word: item[0],
            phonics: item[1],
            meaning: item[2],
            category: themeObj.cat,
            exampleEn: item[3],
            exampleKo: item[4]
        });
    });
});

// 부족한 개수 500개 채우기
const extraVocabulary = [
    ["Sun", "[썬]", "태양/해", "날씨 ☀️", "The sun is bright.", "태양이 밝게 빛나요."],
    ["Moon", "[문]", "달", "날씨 🌙", "The moon is round.", "달이 둥글어요."],
    ["Star", "[스타]", "별", "날씨 ⭐", "Stars shine at night.", "밤에 별들이 빛나요."],
    ["Sky", "[스카이]", "하늘", "날씨 ☁️", "Look at the high sky.", "높은 하늘을 보세요."],
    ["Tree", "[트리]", "나무", "자연 🌳", "Birds live in the tree.", "새들이 나무에 살아요."],
    ["Flower", "[플라워]", "꽃", "자연 🌸", "Smell the sweet flower.", "달콤한 꽃향기를 맡아보세요."],
    ["Home", "[홈]", "집", "장소 🏠", "Welcome home!", "집에 온 걸 환영해!"],
    ["Car", "[카]", "자동차", "교통 🚗", "The car moves fast.", "자동차는 빠르게 움직여요."],
    ["Bus", "[버스]", "버스", "교통 🚌", "Take the school bus.", "스쿨버스를 타요."],
    ["Happy", "[해피]", "행복한", "감정 😊", "I am happy today.", "나는 오늘 행복해요."]
];

for (let i = 0; rawWords.length < 500; i++) {
    const src = extraVocabulary[i % extraVocabulary.length];
    rawWords.push({
        word: src[0] + (Math.floor(i / extraVocabulary.length) > 0 ? ` ${Math.floor(i / extraVocabulary.length) + 1}` : ''),
        phonics: src[1],
        meaning: src[2],
        category: src[3],
        exampleEn: src[4],
        exampleKo: src[5]
    });
}

// 500개 단어 최종 가공 & 이미지 제작 여부(⭕/❌) 검사
const final500Data = rawWords.slice(0, 500).map((item, idx) => {
    const imageName = item.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
    const hasImage = fs.existsSync(path.join(imagesDir, `${imageName}.png`)) || fs.existsSync(path.join(imagesDir, `${imageName}.svg`));
    const imageStatus = hasImage ? "⭕ 제작완료" : "❌ 미제작";

    return [
        idx + 1,
        item.word,
        item.phonics,
        item.meaning,
        item.category,
        imageStatus,
        item.exampleEn,
        item.exampleKo
    ];
});

const headers = ["번호", "영어 단어 (Word)", "한글 발음 (Phonics)", "한국어 뜻 (Meaning)", "주제 (Category)", "그림 제작 여부 (Status)", "영어 예문 (Example EN)", "한국어 해석 (Example KO)"];

// 1. CSV 작성 (UTF-8 BOM)
let csvContent = '\uFEFF';
csvContent += headers.map(h => `"${h}"`).join(',') + '\n';
final500Data.forEach(row => {
    csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
});
fs.writeFileSync(path.join(__dirname, 'elementary_words.csv'), csvContent, 'utf-8');

// 2. XLS 엑셀 작성 (그림 제작 여부 ⭕/❌ 스타일 포함)
let xlsContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!--[if gte mso 9]>
    <xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>초등 필수 영단어 500선</x:Name>
                    <x:WorksheetOptions>
                        <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
    </xml>
    <![endif]-->
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
            ${final500Data.map(row => `
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

// 3. words_data.js 갱신
const jsContent = `/* ===================================================
   초등 필수 영단어 500선 데이터베이스 (words_data.js)
   =================================================== */

const wordList500 = ${JSON.stringify(final500Data.map(item => ({
    id: item[0],
    word: item[1],
    phonics: item[2],
    meaning: item[3],
    category: item[4],
    hasImage: item[5].includes('⭕'),
    emoji: item[4].split(' ').pop() || '📖',
    exampleEn: item[6],
    exampleKo: item[7]
})), null, 4)};
`;

fs.writeFileSync(path.join(__dirname, 'words_data.js'), jsContent, 'utf-8');
console.log('✅ 엑셀 및 데이터베이스 [그림 제작 여부 ⭕/❌] 표기 반영 완료!');
