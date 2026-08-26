'use client';

import { useState, useRef } from 'react';
import wordList500Fallback from '../../data/wordsData.js';

export default function PdfTestSheetGenerator({ currentUser, customWords, onClose }) {
  const [academyName, setAcademyName] = useState('PopVoca 영어 전문 사관학원');
  const [testTitle, setTestTitle] = useState('초등 3학년 일일 단어 성취도 평가');
  const [layoutMode, setLayoutMode] = useState('word_to_meaning'); // 6개 모드
  const [wordCount, setWordCount] = useState(20);
  const [showPhonics, setShowPhonics] = useState(true);

  const studentName = (currentUser?.name || '이승현').replace(/\(.*?\)/g, '').trim();
  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  // 인쇄 대상 단어 추출
  const targetWords = (customWords && customWords.length > 0 ? customWords : wordList500Fallback).slice(0, wordCount);

  // 스펠링 빈칸 채우기 생성 헬퍼 (예: apple -> a _ p _ e)
  const makeSpellingBlank = (word) => {
    if (!word || word.length <= 2) return '_ _ _';
    return word.split('').map((char, idx) => (idx % 2 === 1 ? ' _ ' : char)).join('');
  };

  // 인쇄 실행
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pdf-generator-container">
      {/* 🎛️ 상단 인쇄 설정 옵션 바 (화면 출력용, 인쇄 시 숨김) */}
      <div className="no-print" style={{ background: '#FFFFFF', borderRadius: '20px', padding: '20px', marginBottom: '24px', border: '2px solid #E2E8F0', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px dashed #E2E8F0', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#2B6CB0', fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖨️ 원클릭 고품질 PDF 시험지 & 워크시트 자동 생성기 (16번 모듈)
            </h3>
            <span style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold' }}>
              A4 맞춤 레이아웃 6종 인쇄 • PDF 저장 가능
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: '#EDF2F7', border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              ✖ 닫기
            </button>
          )}
        </div>

        {/* 설정 컨트롤 라인 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4A5568', display: 'block', marginBottom: '4px' }}>🏫 학원 / 기관명</label>
            <input
              type="text"
              value={academyName}
              onChange={(e) => setAcademyName(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px', fontWeight: 'bold' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4A5568', display: 'block', marginBottom: '4px' }}>📝 시험지 제목</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px', fontWeight: 'bold' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4A5568', display: 'block', marginBottom: '4px' }}>📐 인쇄 레이아웃 모드 (6종)</label>
            <select
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '2px solid #3182CE', fontSize: '13px', fontWeight: 'bold', color: '#2B6CB0', background: '#EBF8FF' }}
            >
              <option value="word_to_meaning">1️⃣ 영단어 ➔ 한글 뜻 맞추기 시험지</option>
              <option value="meaning_to_word">2️⃣ 한글 뜻 ➔ 영단어 스펠링 쓰기 시험지</option>
              <option value="spelling_fill">3️⃣ 알파벳 스펠링 빈칸 채우기 워크시트</option>
              <option value="sentence_blank">4️⃣ 예문 속 핵심 영단어 빈칸 채우기</option>
              <option value="flashcard_pocket">5️⃣ A4 2열 휴대용 단어 암기 깜빡이장</option>
              <option value="answer_key">6️⃣ 💮 선생님/학부모 채점용 종합 정답지 (Answer Key)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4A5568', display: 'block', marginBottom: '4px' }}>🔢 문항 수 조절</label>
            <select
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '13px', fontWeight: 'bold' }}
            >
              <option value={10}>10 문항</option>
              <option value={20}>20 문항 (A4 1장)</option>
              <option value={30}>30 문항</option>
              <option value={50}>50 문항 (A4 2장)</option>
            </select>
          </div>
        </div>

        {/* 인쇄 버튼 */}
        <button
          onClick={handlePrint}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(49,130,206,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🖨️ A4 고품질 시험지 즉시 인쇄 / PDF 다운로드 저장 (Print to PDF)
        </button>
      </div>

      {/* 📄 실제 A4 용지 인쇄 렌더링 영역 (A4 규격) */}
      <div className="printable-page" style={{ background: '#FFFFFF', padding: '40px', border: '1px solid #CBD5E0', borderRadius: '8px', minHeight: '1000px', width: '100%', maxWidth: '800px', margin: '0 auto', color: '#000000', fontFamily: "'Pretendard', sans-serif" }}>
        
        {/* 시험지 상단 헤더 표지 */}
        <div style={{ borderBottom: '3px double #000000', paddingBottom: '14px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#555555' }}>{academyName}</div>
              <h1 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                {testTitle} {layoutMode === 'answer_key' ? '[ 정답지 Answer Key ]' : ''}
              </h1>
            </div>
            
            {/* 학생 정보 & 점수 박스 */}
            <div style={{ border: '1px solid #000000', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span><strong>일자:</strong> {todayStr}</span>
                <span><strong>이름:</strong> {studentName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #CCCCCC', paddingTop: '4px' }}>
                <span><strong>문항수:</strong> {targetWords.length}문항</span>
                <span style={{ fontWeight: 'bold', color: '#C0392B' }}>점수: [ &nbsp;&nbsp;&nbsp;&nbsp; / 100점 ]</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1️⃣ 영단어 ➔ 한글 뜻 맞추기 시험지 */}
        {layoutMode === 'word_to_meaning' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {targetWords.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', width: '24px' }}>{idx + 1}.</span>
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.word}</span>
                    {showPhonics && item.phonics && <span style={{ fontSize: '11px', color: '#666', marginLeft: '6px' }}>{item.phonics}</span>}
                  </div>
                </div>
                <div style={{ borderBottom: '1px solid #000', width: '150px', height: '24px' }} />
              </div>
            ))}
          </div>
        )}

        {/* 2️⃣ 한글 뜻 ➔ 영단어 스펠링 쓰기 시험지 */}
        {layoutMode === 'meaning_to_word' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {targetWords.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', width: '24px' }}>{idx + 1}.</span>
                  <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#2C3E50' }}>{item.meaning}</span>
                </div>
                <div style={{ borderBottom: '1px solid #000', width: '160px', height: '24px' }} />
              </div>
            ))}
          </div>
        )}

        {/* 3️⃣ 알파벳 스펠링 빈칸 채우기 워크시트 */}
        {layoutMode === 'spelling_fill' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {targetWords.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', width: '24px' }}>{idx + 1}.</span>
                  <div>
                    <span style={{ fontSize: '14px', color: '#4A5568' }}>({item.meaning})</span>
                  </div>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace' }}>
                  {makeSpellingBlank(item.word)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 4️⃣ 예문 속 핵심 영단어 빈칸 채우기 */}
        {layoutMode === 'sentence_blank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {targetWords.map((item, idx) => (
              <div key={idx} style={{ padding: '10px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{idx + 1}. [ {item.meaning} ]</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>단어 힌트: {item.word[0]}...</span>
                </div>
                <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#2D3748', background: '#F8F9FA', padding: '8px 12px', borderRadius: '6px' }}>
                  {(item.exampleEn || `I learn the word '${item.word}' every day.`).replace(new RegExp(item.word, 'gi'), '( ____________________ )')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 5️⃣ A4 2열 휴대용 단어 암기 깜빡이장 */}
        {layoutMode === 'flashcard_pocket' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', border: '1px solid #000' }}>
            {targetWords.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #CCC', minHeight: '44px' }}>
                <div style={{ width: '50%', padding: '10px', fontWeight: 'bold', borderRight: '1px dashed #000', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{idx + 1}.</span> <span>{item.word}</span>
                </div>
                <div style={{ width: '50%', padding: '10px', background: '#FAFAFA', display: 'flex', alignItems: 'center', color: '#333' }}>
                  {item.meaning}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6️⃣ 💮 채점용 종합 정답지 (Answer Key) */}
        {layoutMode === 'answer_key' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {targetWords.map((item, idx) => (
              <div key={idx} style={{ padding: '8px 12px', background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px' }}>
                <strong style={{ color: '#2B6CB0' }}>{idx + 1}. {item.word}</strong>
                <div style={{ color: '#2D3748', fontWeight: 'bold', marginTop: '2px' }}>➔ {item.meaning}</div>
              </div>
            ))}
          </div>
        )}

        {/* 하단 푸터 꼬리표 */}
        <div style={{ marginTop: '36px', borderTop: '1px solid #000000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666666' }}>
          <span>PopVoca AI Smart Edu System • A4 Print Layout</span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      {/* 🖨️ A4 인쇄 전용 CSS 스타일 */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .pdf-generator-container, .pdf-generator-container .printable-page, .pdf-generator-container .printable-page * {
            visibility: visible;
          }
          .pdf-generator-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .printable-page {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
