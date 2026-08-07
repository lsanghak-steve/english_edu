'use client';

// WordListSection 컴포넌트: 넘겨받은 단어 배열(words/activeWords)의 소리 재생 및 리스트 화면을 표시합니다.
// WordListSection 컴포넌트: 넘겨받은 단어 배열(words/activeWords)의 소리 재생 및 리스트 화면을 표시하며, 학생 본인의 녹음 듣기를 지원합니다.
export default function WordListSection({ words, activeWords, onPlayAudio, playAudio, userAudioRecordings = {} }) {
    // words 또는 activeWords 중 유효한 배열을 사용 (undefined 시 빈 배열 안전 처리)
    const list = Array.isArray(words) ? words : (Array.isArray(activeWords) ? activeWords : []);
    const playAudioFn = onPlayAudio || playAudio;

    const playWordAudio = (text) => {
        if (playAudioFn) {
            playAudioFn(text);
        } else if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    };

    // 🎙️ 학생이 녹음한 오디오 재생
    const playUserAudio = (audioUrl) => {
        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.play();
        }
    };

    return (
        <div className="word-list-section">
            <div className="word-list-header">
                <h3>📋 학습 단어 목록 ({list.length}개)</h3>
                <p className="word-list-subtitle">공부할 단어들의 영단어, 발음기호, 뜻, 예문과 🎙️ 내 발음 녹음을 들어보세요.</p>
            </div>

            <div className="word-card-grid">
                {list.map((item, index) => {
                    const userRecUrl = userAudioRecordings[item.word];
                    return (
                        <div key={index} className="word-list-item-card">
                            <div className="word-item-index">{index + 1}</div>
                            <div className="word-item-main">
                                <div className="word-item-header">
                                    <span className="word-item-en">{item.word}</span>
                                    <span className="word-item-phonics">{item.phonics}</span>
                                </div>
                                <div className="word-item-meaning">{item.meaning}</div>
                                {(item.exampleEn || item.example_en) && (
                                    <div className="word-item-example">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="example-en-sm">{item.exampleEn || item.example_en}</span>
                                            <button
                                                type="button"
                                                onClick={() => playWordAudio(item.exampleEn || item.example_en)}
                                                style={{
                                                    background: '#E8F8F5',
                                                    border: '1px solid #2ECC71',
                                                    color: '#27AE60',
                                                    borderRadius: '10px',
                                                    padding: '2px 6px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer'
                                                }}
                                                title="예문 소리 듣기"
                                            >
                                                🔊 예문
                                            </button>
                                        </div>
                                        <span className="example-ko-sm">{item.exampleKo || item.example_ko}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {userRecUrl && (
                                    <button
                                        type="button"
                                        onClick={() => playUserAudio(userRecUrl)}
                                        style={{
                                            background: '#F5EEF8',
                                            border: '1.5px solid #9B59B6',
                                            color: '#8E44AD',
                                            borderRadius: '12px',
                                            padding: '6px 10px',
                                            fontSize: '12px',
                                            fontWeight: '900',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                        title="내 발음 녹음 듣기"
                                    >
                                        🎙️ 내 녹음
                                    </button>
                                )}

                                <button
                                    className="audio-btn-sm"
                                    onClick={() => playWordAudio(item.word)}
                                    title="원어민 발음 듣기"
                                >
                                    🔊
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

