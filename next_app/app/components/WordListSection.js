'use client';

export default function WordListSection({ activeWords, playAudio }) {
    const playWordAudio = (text) => {
        if (playAudio) {
            playAudio(text);
        } else if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="word-list-section">
            <div className="word-list-header">
                <h3>📋 오늘 학습 단어 목록 ({activeWords.length}개)</h3>
                <p className="word-list-subtitle">오늘 공부할 단어들의 영단어, 발음기호, 뜻, 예문을 한눈에 확인하세요.</p>
            </div>

            <div className="word-card-grid">
                {activeWords.map((item, index) => (
                    <div key={index} className="word-list-item-card">
                        <div className="word-item-index">{index + 1}</div>
                        <div className="word-item-main">
                            <div className="word-item-header">
                                <span className="word-item-en">{item.word}</span>
                                <span className="word-item-phonics">{item.phonics}</span>
                            </div>
                            <div className="word-item-meaning">{item.meaning}</div>
                            {item.exampleEn && (
                                <div className="word-item-example">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span className="example-en-sm">{item.exampleEn}</span>
                                        <button
                                            type="button"
                                            onClick={() => playWordAudio(item.exampleEn)}
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
                                    <span className="example-ko-sm">{item.exampleKo}</span>
                                </div>
                            )}
                        </div>
                        <button
                            className="audio-btn-sm"
                            onClick={() => playWordAudio(item.word)}
                            title="단어 발음 듣기"
                        >
                            🔊
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
