/* ===================================================
   🎈 초등학생 기초 영어 단어장 메인 로직 (app.js)
   =================================================== */

// 1. 로그인된 학생의 지정 단어 수에 맞춰 학습 단어 목록 구성
function getActiveWordList() {
    let fullList = (typeof wordList500 !== 'undefined' && Array.isArray(wordList500) && wordList500.length > 0) 
        ? wordList500 
        : ((typeof wordList !== 'undefined') ? wordList : []);
    
    // 관리자가 학생별로 설정한 일일 학습 단어 수 가져오기 (기본값: 20개)
    const targetCount = (typeof getCurrentUserWordCount === 'function') ? getCurrentUserWordCount() : 20;

    // 전체 500개 단어 중 관리자가 세팅한 개수만큼 맞춤 구성
    return fullList.slice(0, targetCount);
}

let currentIndex = 0; // 현재 단어 위치 번호

// 2. 화면 카드 내용 갱신 함수 (그림 이미지 & 이모지 스마트 전환)
function updateCardContent() {
    const list = getActiveWordList();
    if (!list || list.length === 0) return;

    if (currentIndex < 0) currentIndex = 0;
    if (currentIndex >= list.length) currentIndex = list.length - 1;

    const currentData = list[currentIndex];
    const flashcard = document.getElementById('flashcard');
    
    // 카드가 뒤집혀 있다면 앞면으로 돌리기
    if (flashcard) {
        flashcard.classList.remove('flipped');
    }

    // 이전 녹음 상태 리셋 (audio.js 연동)
    if (typeof resetRecordingState === 'function') {
        resetRecordingState();
    }

    // 카드 텍스트 요소들 갱신
    const cardCategory = document.getElementById('card-category');
    const cardEmoji = document.getElementById('card-emoji');
    const cardImg = document.getElementById('card-img');
    const cardWord = document.getElementById('card-word');
    const cardPhonics = document.getElementById('card-phonics');
    const cardMeaning = document.getElementById('card-meaning');
    const cardExampleEn = document.getElementById('card-example-en');
    const cardExampleKo = document.getElementById('card-example-ko');
    const currentCardNum = document.getElementById('current-card-num');
    const totalCardNum = document.getElementById('total-card-num');

    if (cardCategory) cardCategory.textContent = currentData.category;
    if (cardEmoji) cardEmoji.textContent = currentData.emoji || '📖';
    if (cardWord) cardWord.textContent = currentData.word;
    if (cardPhonics) cardPhonics.textContent = currentData.phonics;
    if (cardMeaning) cardMeaning.textContent = currentData.meaning;
    if (cardExampleEn) cardExampleEn.textContent = currentData.exampleEn;
    if (cardExampleKo) cardExampleKo.textContent = currentData.exampleKo;

    // 단어 맞춤 그림 이미지 처리 (images/단어명.png)
    if (cardImg && cardEmoji) {
        const imageName = currentData.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');
        const imagePath = `images/${imageName}.png`;

        cardImg.onload = () => {
            cardImg.style.display = 'block';
            cardEmoji.style.display = 'none';
        };
        cardImg.onerror = () => {
            // 이미지가 아직 없는 단어는 귀여운 이모지로 자동 대체
            cardImg.style.display = 'none';
            cardEmoji.style.display = 'block';
        };
        cardImg.src = imagePath;
    }

    if (currentCardNum) currentCardNum.textContent = currentIndex + 1;
    if (totalCardNum) totalCardNum.textContent = list.length;
}

// 3. 버튼 클릭 이벤트 안전 바인딩 함수
function bindAppEvents() {
    const flashcard = document.getElementById('flashcard');
    const btnPrevCard = document.getElementById('btn-prev-card');
    const btnNextCard = document.getElementById('btn-next-card');

    // 플래시 카드 뒤집기 이벤트
    if (flashcard) {
        flashcard.onclick = (e) => {
            if (e.target.id === 'btn-listen-speech' || e.target.closest('#btn-listen-speech')) return;
            flashcard.classList.toggle('flipped');
        };
    }

    // 이전 단어 버튼 이벤트
    if (btnPrevCard) {
        btnPrevCard.onclick = (e) => {
            e.stopPropagation();
            if (currentIndex > 0) {
                currentIndex--;
                updateCardContent();
            } else {
                alert('첫 번째 단어입니다! 😊');
            }
        };
    }

    // 다음 단어 버튼 이벤트
    if (btnNextCard) {
        btnNextCard.onclick = (e) => {
            e.stopPropagation();
            const list = getActiveWordList();
            if (currentIndex < list.length - 1) {
                currentIndex++;
                updateCardContent();
            } else {
                alert(`🎉 오늘 목표 ${list.length}개 단어를 모두 다 읽었어요! 참 잘했어요!`);
            }
        };
    }

    // 상단 탭 버튼 클릭 이벤트
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.onclick = () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const targetTabId = button.getAttribute('data-tab');
            tabContents.forEach(content => {
                if (content.id === targetTabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        };
    });
}

// 4. 초기화 함수 실행
function initApp() {
    bindAppEvents();
    updateCardContent();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
