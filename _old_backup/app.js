/* ===================================================
   초등 필수 영단어 500선 3D 플래시카드 앱 동작 로직
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // words_data.js의 wordList500 데이터 로딩
    let currentList = [...wordList500];
    let currentIndex = 0;

    const flashcard = document.getElementById('flashcard');
    const wordEn = document.getElementById('wordEn');
    const wordPhonics = document.getElementById('wordPhonics');
    const wordImg = document.getElementById('wordImg');
    const meaningKr = document.getElementById('meaningKr');
    const exampleEn = document.getElementById('exampleEn');
    const exampleKo = document.getElementById('exampleKo');
    const progressText = document.getElementById('progressText');
    const audioBtn = document.getElementById('audioBtn');
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const categorySelect = document.getElementById('categorySelect');

    // 카테고리 옵션 생성
    const categories = ['전체 보기', ...new Set(wordList500.map(item => item.category))];
    categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    // 카드 업데이트 함수
    function updateCard() {
        if (currentList.length === 0) return;

        // 카드가 뒤집혀 있다면 먼저 앞면으로 복귀
        flashcard.classList.remove('flipped');

        const currentItem = currentList[currentIndex];
        const imageName = currentItem.word.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');

        // word_img 200선 이미지 연동 (없을 경우 fallback)
        wordImg.src = `word_img/${imageName}.png`;
        wordImg.onerror = () => {
            if (wordImg.src.includes('word_img/')) {
                wordImg.src = `p_img/${imageName}.png`;
            } else if (wordImg.src.includes('p_img/')) {
                wordImg.src = `images/${imageName}.png`;
            }
        };

        wordEn.textContent = currentItem.word;
        wordPhonics.textContent = currentItem.phonics;
        meaningKr.textContent = currentItem.meaning;
        exampleEn.textContent = currentItem.exampleEn;
        exampleKo.textContent = currentItem.exampleKo;

        progressText.textContent = `${currentIndex + 1} / ${currentList.length}`;
    }

    // 3D 카드 뒤집기 토글
    flashcard.addEventListener('click', (e) => {
        // 음성 버튼 클릭 시 뒤집기 방지
        if (e.target.closest('#audioBtn')) return;
        flashcard.classList.toggle('flipped');
    });

    // 원어민 영어 발음 읽기 (TTS)
    audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentItem = currentList[currentIndex];
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(currentItem.word);
            utterance.lang = 'en-US';
            utterance.rate = 0.85; // 아이들이 듣기 편한 속도
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
        }
    });

    // 이전 단어
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = currentList.length - 1;
        }
        updateCard();
    });

    // 다음 단어
    nextBtn.addEventListener('click', () => {
        if (currentIndex < currentList.length - 1) {
            currentIndex++;
        } else {
            currentIndex = 0;
        }
        updateCard();
    });

    // 랜덤 셔플
    shuffleBtn.addEventListener('click', () => {
        for (let i = currentList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentList[i], currentList[j]] = [currentList[j], currentList[i]];
        }
        currentIndex = 0;
        updateCard();
    });

    // 카테고리 필터링
    categorySelect.addEventListener('change', (e) => {
        const selected = e.target.value;
        if (selected === '전체 보기') {
            currentList = [...wordList500];
        } else {
            currentList = wordList500.filter(item => item.category === selected);
        }
        currentIndex = 0;
        updateCard();
    });

    // 키보드 화살표 / 스페이스바 제어
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevBtn.click();
        } else if (e.key === 'ArrowRight') {
            nextBtn.click();
        } else if (e.key === ' ') {
            e.preventDefault();
            flashcard.click();
        }
    });

    // 첫 카드 초기화
    updateCard();
});
