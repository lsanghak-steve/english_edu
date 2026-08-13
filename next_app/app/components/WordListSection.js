import { useState } from 'react';
import PdfTestSheetGenerator from './PdfTestSheetGenerator.js';

export default function WordListSection({ words, activeWords, onPlayAudio, playAudio, userAudioRecordings = {} }) {
    const [showPdfModal, setShowPdfModal] = useState(false);
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
            <div className="word-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h3 style={{ margin: 0 }}>📋 학습 단어 목록 ({list.length}개)</h3>
                    <p className="word-list-subtitle" style={{ margin: '4px 0 0 0' }}>공부할 단어들의 영단어, 발음기호, 뜻, 예문과 🎙️ 내 발음 녹음을 들어보세요.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowPdfModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: '900',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(49,130,206,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    🖨️ 원클릭 PDF 시험지/워크시트 인쇄 (6종)
                </button>
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

            {/* 🖨️ 원클릭 고품질 PDF 시험지 & 워크시트 생성 모달 */}
            {showPdfModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <PdfTestSheetGenerator
                            customWords={list}
                            onClose={() => setShowPdfModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

