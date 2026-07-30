/* ===================================================
   🎈 초등학생 단어 퀴즈 & 오답노트 관리 로직 (quiz.js)
   =================================================== */

// 1. 상태 변수 (학생별 독립 오답 키 사용)
function getWrongWordsKey() {
    return (typeof getUserWrongWordsKey === 'function') ? getUserWrongWordsKey() : 'english_wrong_words';
}

let wrongWords = JSON.parse(localStorage.getItem(getWrongWordsKey())) || [];

// 2. HTML 엘리먼트 가져오기
const quizEmoji = document.getElementById('quiz-emoji');
const quizWord = document.getElementById('quiz-word');
const quizOptions = document.getElementById('quiz-options');
const wrongWordList = document.getElementById('wrong-word-list');
const wrongCountBadge = document.getElementById('wrong-count-badge');

// 3. 오답 뱃지 숫자 갱신
function updateWrongBadge() {
    if (wrongCountBadge) {
        wrongCountBadge.textContent = wrongWords.length;
    }
}

// 4. 오답 로컬스토리지 저장
function saveWrongWordsToStorage() {
    localStorage.setItem(getWrongWordsKey(), JSON.stringify(wrongWords));
    updateWrongBadge();
    renderWrongWordList();
}

// 5. 퀴즈 생성 함수
function generateQuiz() {
    const list = (typeof activeWordList !== 'undefined') ? activeWordList : wordList;
    if (!list || list.length === 0) return;

    // 무작위 정답 단어 1개 선정
    const randomIndex = Math.floor(Math.random() * list.length);
    currentQuizData = list[randomIndex];

    // 무작위 오답 3개 선정
    const wrongOptions = [];
    while (wrongOptions.length < 3) {
        const rand = Math.floor(Math.random() * list.length);
        if (rand !== randomIndex && !wrongOptions.includes(list[rand])) {
            wrongOptions.push(list[rand]);
        }
    }

    // 4개 보기를 섞기 (정답 1개 + 오답 3개)
    const allOptions = [currentQuizData, ...wrongOptions];
    allOptions.sort(() => Math.random() - 0.5);

    // 화면 갱신
    if (quizEmoji) quizEmoji.textContent = currentQuizData.emoji || '❓';
    if (quizWord) quizWord.textContent = currentQuizData.word;

    if (quizOptions) {
        quizOptions.innerHTML = '';
        allOptions.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `${idx + 1}. ${opt.meaning}`;
            btn.addEventListener('click', () => handleAnswer(btn, opt));
            quizOptions.appendChild(btn);
        });
    }
}

// 6. 정답 / 오답 처리 함수
function handleAnswer(selectedBtn, selectedOpt) {
    const isCorrect = (selectedOpt.word === currentQuizData.word);
    const allBtns = quizOptions.querySelectorAll('.option-btn');
    
    // 버튼 중복 클릭 방지
    allBtns.forEach(btn => btn.disabled = true);

    if (isCorrect) {
        selectedBtn.style.backgroundColor = '#2ECC71';
        selectedBtn.style.color = 'white';
        selectedBtn.style.borderColor = '#27AE60';
        selectedBtn.textContent += ' ⭕ 정답입니다!';
        
        // 1.2초 뒤 다음 문제로 이동
        setTimeout(() => {
            generateQuiz();
        }, 1200);
    } else {
        selectedBtn.style.backgroundColor = '#E74C3C';
        selectedBtn.style.color = 'white';
        selectedBtn.style.borderColor = '#C0392B';
        selectedBtn.textContent += ' ❌ 아쉬워요!';

        // 정답 버튼 표시
        allBtns.forEach(btn => {
            if (btn.textContent.includes(currentQuizData.meaning)) {
                btn.style.backgroundColor = '#2ECC71';
                btn.style.color = 'white';
            }
        });

        // 오답 노약에 저장 (중복 방지)
        const isAlreadySaved = wrongWords.some(w => w.word === currentQuizData.word);
        if (!isAlreadySaved) {
            wrongWords.push(currentQuizData);
            saveWrongWordsToStorage();
        }

        // 2초 뒤 다음 문제로 이동
        setTimeout(() => {
            generateQuiz();
        }, 2000);
    }
}

// 7. 오답 노트 목록 렌더링
function renderWrongWordList() {
    if (!wrongWordList) return;

    if (wrongWords.length === 0) {
        wrongWordList.innerHTML = '<p class="empty-msg">아직 틀린 단어가 없어요! 참 잘했어요! 👍</p>';
        return;
    }

    wrongWordList.innerHTML = '';
    wrongWords.forEach((wordObj, index) => {
        const itemCard = document.createElement('div');
        itemCard.className = 'wrong-item-card';
        itemCard.style.cssText = `
            background: #FFF5F5;
            border: 2px solid #FFD8D8;
            border-radius: 16px;
            padding: 14px 18px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        itemCard.innerHTML = `
            <div>
                <span style="font-size: 20px;">${wordObj.emoji || '📖'}</span>
                <strong style="font-size: 18px; color: #E74C3C; margin-left: 8px;">${wordObj.word}</strong>
                <span style="color: #7F8C8D; font-size: 14px; margin-left: 6px;">${wordObj.phonics}</span>
                <p style="margin-top: 4px; font-weight: 700; color: #2C3E50;">뜻: ${wordObj.meaning}</p>
            </div>
            <button class="delete-wrong-btn" data-index="${index}" style="
                background: #FF7675;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 12px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
            ">외움 ⭕</button>
        `;

        wrongWordList.appendChild(itemCard);
    });

    // 외움 버튼 삭제 이벤트
    const deleteBtns = wrongWordList.querySelectorAll('.delete-wrong-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'));
            wrongWords.splice(idx, 1);
            saveWrongWordsToStorage();
        });
    });
}

// 8. 초기화 이벤트
document.addEventListener('DOMContentLoaded', () => {
    updateWrongBadge();
    generateQuiz();
    renderWrongWordList();
});
