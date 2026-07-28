/* ===================================================
   🎈 초등학생 영어 발음 듣기(TTS) & 마이크 녹음 로직 (audio.js)
   =================================================== */

// 1. 상태 변수 설정
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioUrl = null;
let isRecording = false;

// 2. HTML 엘리먼트 가져오기
const btnListenSpeech = document.getElementById('btn-listen-speech');
const btnQuizSpeech = document.getElementById('btn-quiz-speech');
const btnRecord = document.getElementById('btn-record');
const btnPlayRecord = document.getElementById('btn-play-record');
const recordStatus = document.getElementById('record-status');
const cardWord = document.getElementById('card-word');

/* ---------------------------------------------------
   [기능 1] 원어민 영어 발음 듣기 (Text-to-Speech)
   --------------------------------------------------- */
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        alert('이 브라우저는 음성 듣기 기능을 지원하지 않습니다.');
        return;
    }

    // 기존 발음 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // 미국 영어 발음
    utterance.rate = 0.85;   // 아이들이 듣기 편하도록 약 15% 천천히 발음
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

// 스피커 버튼 이벤트 연결
if (btnListenSpeech) {
    btnListenSpeech.addEventListener('click', (e) => {
        e.stopPropagation(); // 카드 뒤집기 이벤트 방지
        const wordText = cardWord ? cardWord.textContent : 'Apple';
        speakText(wordText);
    });
}

if (btnQuizSpeech) {
    btnQuizSpeech.addEventListener('click', () => {
        const quizWord = document.getElementById('quiz-word');
        if (quizWord) {
            speakText(quizWord.textContent);
        }
    });
}

/* ---------------------------------------------------
   [기능 2] 마이크 녹음 및 내 목소리 재생
   --------------------------------------------------- */

// 녹음 시작 / 중지 처리
async function toggleRecording() {
    if (!isRecording) {
        // [녹음 시작]
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                recordedAudioUrl = URL.createObjectURL(audioBlob);

                // 재생 버튼 활성화
                btnPlayRecord.disabled = false;
                recordStatus.textContent = '✅ 녹음 완료! 아래 [▶️ 내 발음 듣기]를 눌러보세요.';
                recordStatus.style.color = '#2ECC71';
            };

            mediaRecorder.start();
            isRecording = true;

            btnRecord.textContent = '⬛ 녹음 중지';
            btnRecord.style.backgroundColor = '#2D3436';
            recordStatus.textContent = '🎙️ 녹음 중입니다... 영어를 따라 말씀하세요!';
            recordStatus.style.color = '#E74C3C';

        } catch (err) {
            console.error('마이크 접근 오류:', err);
            alert('마이크 사용 권한이 필요합니다. 브라우저 마이크 허용을 확인해 주세요.');
            recordStatus.textContent = '마이크 접근이 거부되었습니다.';
        }
    } else {
        // [녹음 중지]
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            // 마이크 스트림 트랙 종료 (마이크 아이콘 끄기)
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
        isRecording = false;
        btnRecord.textContent = '🔴 녹음 시작';
        btnRecord.style.backgroundColor = '#FF7675';
    }
}

// 녹음된 내 음성 재생
function playRecordedAudio() {
    if (recordedAudioUrl) {
        const audio = new Audio(recordedAudioUrl);
        audio.play();
        recordStatus.textContent = '🔊 내 녹음 음성을 재생 중입니다...';
        audio.onended = () => {
            recordStatus.textContent = '✅ 재생 완료! 다시 녹음하거나 들어볼 수 있어요.';
        };
    }
}

// 녹음 이벤트 등록
if (btnRecord) {
    btnRecord.addEventListener('click', toggleRecording);
}

if (btnPlayRecord) {
    btnPlayRecord.addEventListener('click', playRecordedAudio);
}

// 단어가 변경되면 이전 녹음 상태 초기화하는 함수
function resetRecordingState() {
    recordedAudioUrl = null;
    if (btnPlayRecord) btnPlayRecord.disabled = true;
    if (recordStatus) {
        recordStatus.textContent = '마이크 버튼을 눌러 말을 시작하세요.';
        recordStatus.style.color = '#A0AEC0';
    }
}
