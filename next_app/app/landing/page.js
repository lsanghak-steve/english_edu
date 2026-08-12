'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  // Modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');

  // Form states
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('초등 3학년');
  const [dailyGoal, setDailyGoal] = useState('20');
  const [studentPin, setStudentPin] = useState('');
  
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentPin, setParentPin] = useState('');
  const [childPin, setChildPin] = useState('');

  const [academyName, setAcademyName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [academyPhone, setAcademyPhone] = useState('');

  // Interactive Live Demo states
  const [demoWordIndex, setDemoWordIndex] = useState(0);
  const [isDemoFlipped, setIsDemoFlipped] = useState(false);
  const [isDemoAudioPlaying, setIsDemoAudioPlaying] = useState(false);
  const [demoAudioSpeed, setDemoAudioSpeed] = useState(1.0); // 0.75x, 1.0x, 1.25x
  const [demoQuizSelected, setDemoQuizSelected] = useState(null);
  const [demoQuizIsCorrect, setDemoQuizIsCorrect] = useState(null);

  // FAQ accordion states
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Sample words for demo
  const demoWords = [
    {
      word: 'adventure',
      phonics: "[əd'ventʃər]",
      meaning: '모험, 신나고 놀라운 경험',
      category: '초등 필수',
      exampleEn: 'We started our grand adventure in the deep forest.',
      exampleKo: '우리는 깊은 숲속에서 장대한 모험을 시작했습니다.'
    },
    {
      word: 'brilliant',
      phonics: "['brɪliənt]",
      meaning: '훌륭한, 눈부시게 빛나는',
      category: '중등 필수',
      exampleEn: 'She gave a brilliant answer to the difficult question.',
      exampleKo: '그녀는 어려운 질문에 훌륭한 답변을 내놓았습니다.'
    },
    {
      word: 'curiosity',
      phonics: "[,kjʊəri'ɒsəti]",
      meaning: '호기심, 궁금증',
      category: '고등 필수',
      exampleEn: 'Children learn new things out of natural curiosity.',
      exampleKo: '아이들은 타고난 호기심으로 새로운 것들을 배웁니다.'
    }
  ];

  const currentDemoWord = demoWords[demoWordIndex];

  // Play TTS audio with custom speed rate (0.75, 1.0, 1.25)
  const playWordAudio = (text, customRate = demoAudioSpeed) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = customRate;
      setIsDemoAudioPlaying(true);
      utterance.onend = () => setIsDemoAudioPlaying(false);
      utterance.onerror = () => setIsDemoAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`[🔊 음성 재생예시 (${customRate}x 배속)] "${text}"`);
    }
  };

  // Demo Quiz Handle Submit
  const handleDemoQuizChoice = (index) => {
    setDemoQuizSelected(index);
    if (index === 1) {
      setDemoQuizIsCorrect(true);
    } else {
      setDemoQuizIsCorrect(false);
    }
  };

  // Onboarding Submit Handle
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === 'student') {
      if (!studentName.trim() || !studentPin.trim()) {
        alert('이름과 비밀번호(4자리 PIN)를 입력해주세요.');
        return;
      }
      alert(`🎉 ${studentName} 학생 계정이 생성되었습니다!\n학습 화면으로 이동합니다.`);
    } else if (selectedRole === 'parent') {
      if (!parentName.trim() || !parentPin.trim()) {
        alert('학부모 성함과 비밀번호를 입력해주세요.');
        return;
      }
      alert(`🎉 ${parentName} 학부모님 계정이 등록되었습니다!\n자녀 안심 대시보드로 이동합니다.`);
    } else {
      if (!academyName.trim() || !directorName.trim()) {
        alert('학원명과 원장님 성함을 입력해주세요.');
        return;
      }
      alert(`🎉 ${academyName} 센터 관리자 계정이 등록되었습니다!\n선생님 관리자 센터로 이동합니다.`);
    }
    setShowAuthModal(false);
    window.location.href = '/';
  };

  return (
    <div className="landing-root">
      {/* 🌟 1. Navigation Fixed Header */}
      <header className="nav-header">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className="logo-badge">steve</span>
            <span className="logo-main">voca</span>
            <span className="logo-tag">🎓</span>
          </div>

          <nav className="nav-menu">
            <a href="#features">주요 기능</a>
            <a href="#parent">학부모 안심</a>
            <a href="#academy">선생님 PDF 인쇄</a>
            <a href="#demo">1분 맛보기</a>
            <a href="#pricing">요금 안내</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="nav-actions">
            <Link href="/" className="btn-secondary">
              학습 앱 바로가기 ➔
            </Link>
            <button className="btn-primary" onClick={() => setShowAuthModal(true)}>
              🚀 7일 무료 수강신청
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 2. Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-pill">
              <span>🔥 초·중·고 필수 5,000 영단어 DB 완비</span>
            </div>
            <h1 className="hero-title">
              듣고, 말하고, 퀴즈로 완성하는<br />
              <span className="highlight-text">차세대 영단어 에듀테크</span> steve voca
            </h1>
            <p className="hero-subtitle">
              학생은 🎙️ <strong>실시간 음성 파동 녹음</strong>과 🎚️ <strong>0.75x~1.25x 맞춤 음성 속도 조절</strong>로 즐겁게 외우고,<br />
              학부모는 💮 <strong>출석 달력 도장</strong>으로 안심하며, 선생님은 🖨️ <strong>1초 만에 PDF 시험지</strong>를 인쇄합니다.
            </p>
            <div className="hero-btn-group">
              <button className="btn-hero-primary" onClick={() => setShowAuthModal(true)}>
                🚀 7일 무료 수강신청하기
              </button>
              <a href="#demo" className="btn-hero-outline">
                🎧 1분 기능 맛보기
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-num">5,000+</span>
                <span className="stat-label">초/중/고 필두 영단어</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">0.75x~1.25x</span>
                <span className="stat-label">음성 재생 속도 조절</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-num">6종</span>
                <span className="stat-label">원클릭 PDF 시험지 인쇄</span>
              </div>
            </div>
          </div>

          {/* Right Hero Visual UI Card */}
          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="card-top">
                <span className="card-cat">초등 필수 • 파닉스</span>
                <span className="card-streak">🔥 14일 연속 학습 중</span>
              </div>
              <div className="card-word">Adventure</div>
              <div className="card-phonics">[əd'ventʃər]</div>
              <div className="card-meaning">모험, 신나고 놀라운 경험</div>

              {/* Speed control indicator badge */}
              <div className="speed-badge-bar">
                <span>🎚️ 음성 재생 속도:</span>
                <span className="speed-chip active">🐢 0.75x</span>
                <span className="speed-chip">⚡ 1.0x</span>
                <span className="speed-chip">🚀 1.25x</span>
              </div>

              <div className="audio-visualizer-box">
                <div className="waveform-header">
                  <span>🎙️ 실시간 내 발음 녹음 주파수 파동</span>
                  <span className="rec-dot">● REC</span>
                </div>
                <div className="waveform-bars">
                  <span className="bar b1"></span>
                  <span className="bar b2"></span>
                  <span className="bar b3"></span>
                  <span className="bar b4"></span>
                  <span className="bar b5"></span>
                  <span className="bar b4"></span>
                  <span className="bar b3"></span>
                  <span className="bar b2"></span>
                  <span className="bar b5"></span>
                  <span className="bar b1"></span>
                </div>
                <div className="score-badge">
                  AI 발음 일치도: <strong>94점 (합격 🎉)</strong>
                </div>
              </div>

              <div className="card-footer-badges">
                <div className="stamp-badge">
                  <span className="stamp-icon">💮</span>
                  <span>오늘 출석 도장 완료</span>
                </div>
                <div className="hp-badge">
                  <span>💚💚💚</span>
                  <span>하트 3개 완벽</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎓 3. Feature Section 1: 학생 4단계 스마트 학습관 */}
      <section id="features" className="section feature-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">FOR STUDENTS</span>
            <h2 className="section-title">공부가 아닌 게임처럼! 몰입형 4단계 학습법</h2>
            <p className="section-desc">
              단순 암기의 지루함을 깨고, 듣기, 말하기, 선택하기, 주관식 쓰기까지 감각을 통합하여 오래 기억합니다.
            </p>
          </div>

          <div className="grid-4">
            <div className="feature-card">
              <div className="card-step-num">Step 1</div>
              <div className="card-icon">🎴</div>
              <h3>플래시카드 & 🎚️ 음성 속도 조절</h3>
              <p>5,000개 단어의 원어민 발음(🔊)과 추천 예문. <strong>0.75x 슬로우 모드 / 1.0x 정속 / 1.25x 스피드</strong>로 맞춤 청취.</p>
            </div>

            <div className="feature-card">
              <div className="card-step-num">Step 2</div>
              <div className="card-icon">🎙️</div>
              <h3>발음 녹음 & 파동 시각화</h3>
              <p>마이크로 영어 단어를 직접 읽고 내 음성 주파수 그래프 파동을 원어민과 실시간으로 비교 체험.</p>
            </div>

            <div className="feature-card">
              <div className="card-step-num">Step 3</div>
              <div className="card-icon">❓</div>
              <h3>4단계 스마트 멀티 퀴즈</h3>
              <p>1단계 소리 듣기 ➔ 2단계 스펠선택(출석도장 💮 수여) ➔ 3단계 AI 녹음 ➔ 4단계 주관식 쓰기까지 단계별 완수.</p>
            </div>

            <div className="feature-card">
              <div className="card-step-num">Step 4</div>
              <div className="card-icon">🔥</div>
              <h3>연속 스트릭 & 칭찬 뱃지</h3>
              <p>듀오링고 스타일의 🔥 3일/7일/30일 연속 출석 스트릭과 왕관 뱃지를 모으며 자기주도 학습 습관 형성.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 👨‍👩‍👧‍👦 4. Feature Section 2: 학부모 안심 자녀 리포트 */}
      <section id="parent" className="section parent-section">
        <div className="section-container">
          <div className="grid-2 align-center">
            <div className="parent-text">
              <span className="section-tag">FOR PARENTS</span>
              <h2 className="section-title">스마트폰으로 한눈에 보는 자녀 안심 학습 리포트</h2>
              <p className="section-desc">
                아이가 오늘 공부를 했는지 물어볼 필요가 없습니다. 학부모 전용 대시보드에서 출석 도장과 공부한 단어, 오답노트를 실시간으로 확인하세요.
              </p>

              <ul className="check-list">
                <li>
                  <span className="check-icon">💮</span>
                  <div>
                    <strong>참잘했어요 출석 달력 도장</strong>
                    <p>퀴즈를 완수한 날짜에 콕 찍히는 참잘했어요 도장. 날짜를 클릭하면 그날 공부한 30개 단어 팝업 복습 제공.</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">❌</span>
                  <div>
                    <strong>클라우드 실시간 오답노트</strong>
                    <p>아이가 퀴즈에서 틀린 단어만 클라우드 DB에 자동 저장되어 오답을 완벽히 마스터할 때까지 관리.</p>
                  </div>
                </li>
                <li>
                  <span className="check-icon">👨‍👩‍👧‍👦</span>
                  <div>
                    <strong>다자녀 통합 관리 탭</strong>
                    <p>첫째, 둘째 자녀 학습 현황을 탭 클릭 한 번으로 손쉽게 전환하여 통합 조회.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="parent-preview-card">
              <div className="preview-header">
                <span>👨‍👩‍👧‍👦 학부모 안심 대시보드 미리보기</span>
                <span className="badge-live">Live Sync</span>
              </div>

              <div className="child-tabs">
                <div className="child-tab active">👦 첫째: 이승현 (초5)</div>
                <div className="child-tab">👧 둘째: 이수민 (초3)</div>
              </div>

              <div className="stats-row">
                <div className="stat-card">
                  <span className="s-icon">💮</span>
                  <span className="s-val">184개</span>
                  <span className="s-lbl">누적 출석도장</span>
                </div>
                <div className="stat-card">
                  <span className="s-icon">📖</span>
                  <span className="s-val">20단어</span>
                  <span className="s-lbl">오늘 공부한 단어</span>
                </div>
                <div className="stat-card">
                  <span className="s-icon">❌</span>
                  <span className="s-val">12개</span>
                  <span className="s-lbl">오답노트 잔여</span>
                </div>
              </div>

              <div className="mini-calendar">
                <div className="cal-title">📅 2026년 8월 학습 달력</div>
                <div className="cal-grid">
                  <div className="cal-day">월<span className="cal-stamp">💮</span></div>
                  <div className="cal-day">화<span className="cal-stamp">💮</span></div>
                  <div className="cal-day">수<span className="cal-stamp">💮</span></div>
                  <div className="cal-day">목<span className="cal-stamp">💮</span></div>
                  <div className="cal-day">금<span className="cal-stamp">💮</span></div>
                  <div className="cal-day sat">토</div>
                  <div className="cal-day sun">일</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏫 5. Feature Section 3: 학원/공부방 원클릭 6종 PDF 인쇄 */}
      <section id="academy" className="section academy-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">FOR TEACHERS & ACADEMIES</span>
            <h2 className="section-title">단어 시험지 제작 0초! 원클릭 6종 PDF 워크시트 인쇄</h2>
            <p className="section-desc">
              선생님의 교재 준비 시간을 혁신적으로 줄여드립니다. 클릭 한 번으로 고품질 오프라인 시험지와 워크시트를 인쇄하세요.
            </p>
          </div>

          <div className="grid-6">
            <div className="pdf-card">
              <div className="pdf-badge">📝 양식 1</div>
              <h4>4지선다 시험지</h4>
              <p>객관식 뜻/스펠링 테스트용 전문 시험지</p>
              <button className="btn-pdf-preview" onClick={() => alert('📝 [시험지 양식] 미리보기가 생성되었습니다.')}>미리보기 ➔</button>
            </div>

            <div className="pdf-card">
              <div className="pdf-badge">📋 양식 2</div>
              <h4>2열 단어 리스트</h4>
              <p>영어-한글 뜻 대조 일괄 암기용 표</p>
              <button className="btn-pdf-preview" onClick={() => alert('📋 [2열 단어장] 미리보기가 생성되었습니다.')}>미리보기 ➔</button>
            </div>

            <div className="pdf-card">
              <div className="pdf-badge">📄 양식 3</div>
              <h4>빈칸 채우기 연습지</h4>
              <p>스펠링 받아쓰기 및 빈칸 테스트지</p>
              <button className="btn-pdf-preview" onClick={() => alert('📄 [빈칸 연습지] 미리보기가 생성되었습니다.')}>미리보기 ➔</button>
            </div>

            <div className="pdf-card">
              <div className="pdf-badge">🎴 양식 4</div>
              <h4>절취선 단어 카드</h4>
              <p>손으로 잘라 활용하는 오프라인 실물 카드</p>
              <button className="btn-pdf-preview" onClick={() => alert('🎴 [단어 카드] 미리보기가 생성되었습니다.')}>미리보기 ➔</button>
            </div>

            <div className="pdf-card">
              <div className="pdf-badge">🎲 양식 5</div>
              <h4>단어 빙고판 (4x4)</h4>
              <p>수업 중 다 함께 즐기는 단어 빙고 게임판</p>
              <button className="btn-pdf-preview" onClick={() => alert('🎲 [단어 빙고판] 미리보기가 생성되었습니다.')}>미리보기 ➔</button>
            </div>

            <div className="pdf-card">
              <div className="pdf-badge">✍️ 양식 6</div>
              <h4>4선지 따라쓰기 노트</h4>
              <p>초등 파닉스/영단어 4선 노트 연습지</p>
              <button className="btn-pdf-preview" onClick={() => alert('✍️ [4선지 노트] 미리보기가 생성되었습니다.')}>미리보기 ➔</button>
            </div>
          </div>
        </div>
      </section>

      {/* 🎮 6. Interactive Live Demo Widget with Audio Speed Control */}
      <section id="demo" className="section demo-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">TRY BEFORE REGISTER</span>
            <h2 className="section-title">가입 없이 체험하는 1분 인터랙티브 맛보기 데모</h2>
            <p className="section-desc">
              음성 재생 속도를 선택하여 단어 소리를 직접 들어보세요!
            </p>
          </div>

          <div className="demo-widget-container">
            {/* Speed Selector Widget */}
            <div className="speed-selector-widget">
              <span className="speed-label">🎚️ 음성 재생 속도 선택:</span>
              <button
                className={`speed-btn ${demoAudioSpeed === 0.75 ? 'active' : ''}`}
                onClick={() => setDemoAudioSpeed(0.75)}
              >
                🐢 0.75x (느리게 / 슬로우)
              </button>
              <button
                className={`speed-btn ${demoAudioSpeed === 1.0 ? 'active' : ''}`}
                onClick={() => setDemoAudioSpeed(1.0)}
              >
                ⚡ 1.0x (보통 정속)
              </button>
              <button
                className={`speed-btn ${demoAudioSpeed === 1.25 ? 'active' : ''}`}
                onClick={() => setDemoAudioSpeed(1.25)}
              >
                🚀 1.25x (빠르게 / 스피드)
              </button>
            </div>

            <div className="demo-tabs">
              {demoWords.map((w, idx) => (
                <button
                  key={idx}
                  className={`demo-tab-btn ${demoWordIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setDemoWordIndex(idx);
                    setIsDemoFlipped(false);
                    setDemoQuizSelected(null);
                    setDemoQuizIsCorrect(null);
                  }}
                >
                  단어 {idx + 1}: {w.word} ({w.category})
                </button>
              ))}
            </div>

            <div className="demo-box">
              {/* Card flipping demo */}
              <div className="demo-card-side">
                <div className={`demo-flashcard ${isDemoFlipped ? 'flipped' : ''}`} onClick={() => setIsDemoFlipped(!isDemoFlipped)}>
                  <div className="flashcard-front">
                    <span className="hint-flip">👆 카드를 클릭하면 뒤집어집니다</span>
                    <h3 className="demo-word-text">{currentDemoWord.word}</h3>
                    <p className="demo-phonics-text">{currentDemoWord.phonics}</p>
                    <button
                      className="btn-tts"
                      onClick={(e) => {
                        e.stopPropagation();
                        playWordAudio(currentDemoWord.word);
                      }}
                    >
                      {isDemoAudioPlaying ? `🔊 재생 중 (${demoAudioSpeed}x)...` : `🔊 발음 듣기 (${demoAudioSpeed}x)`}
                    </button>
                  </div>
                  <div className="flashcard-back">
                    <h3>{currentDemoWord.meaning}</h3>
                    <p className="example-en">"{currentDemoWord.exampleEn}"</p>
                    <p className="example-ko">{currentDemoWord.exampleKo}</p>
                    <button
                      className="btn-tts-sub"
                      onClick={(e) => {
                        e.stopPropagation();
                        playWordAudio(currentDemoWord.exampleEn);
                      }}
                    >
                      🔊 예문 음성 듣기 ({demoAudioSpeed}x)
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Quiz demo */}
              <div className="demo-quiz-side">
                <div className="quiz-box-header">
                  <h4>❓ [맛보기 퀴즈] 단어의 올바른 뜻을 골라보세요!</h4>
                  <button className="btn-sound-quiz" onClick={() => playWordAudio(currentDemoWord.word)}>
                    🔊 단어 소리 듣기 ({demoAudioSpeed}x 배속)
                  </button>
                </div>

                <div className="quiz-options">
                  <button
                    className={`quiz-opt ${demoQuizSelected === 0 ? 'wrong' : ''}`}
                    onClick={() => handleDemoQuizChoice(0)}
                  >
                    1. 웅장하고 오래된 건물
                  </button>
                  <button
                    className={`quiz-opt ${demoQuizSelected === 1 ? 'correct' : ''}`}
                    onClick={() => handleDemoQuizChoice(1)}
                  >
                    2. {currentDemoWord.meaning}
                  </button>
                  <button
                    className={`quiz-opt ${demoQuizSelected === 2 ? 'wrong' : ''}`}
                    onClick={() => handleDemoQuizChoice(2)}
                  >
                    3. 조용히 쉬는 휴식 시간
                  </button>
                  <button
                    className={`quiz-opt ${demoQuizSelected === 3 ? 'wrong' : ''}`}
                    onClick={() => handleDemoQuizChoice(3)}
                  >
                    4. 친절하고 다정한 인사말
                  </button>
                </div>

                {demoQuizIsCorrect === true && (
                  <div className="quiz-feedback correct-bg">
                    🎉 <strong>정답입니다!</strong> 대단해요! 출석 도장(💮)이 발급되는 순간입니다.
                  </div>
                )}
                {demoQuizIsCorrect === false && (
                  <div className="quiz-feedback wrong-bg">
                    ❌ <strong>아쉬워요!</strong> 정답은 2번입니다. 오답노트에 자동 저장됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💳 7. Pricing Section */}
      <section id="pricing" className="section pricing-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">PRICING PLANS</span>
            <h2 className="section-title">투명하고 합리적인 요금 안내</h2>
            <p className="section-desc">
              신규 회원 누구나 7일간 전 기능을 무료로 체험하실 수 있습니다.
            </p>
          </div>

          <div className="grid-3">
            <div className="pricing-card">
              <div className="plan-name">무료 체험 플랜</div>
              <div className="plan-price">0원 <span>/ 7일간</span></div>
              <p className="plan-desc">모든 신규 가입자 대상 무료 체험</p>
              <ul className="plan-features">
                <li>✓ 초/중/고 체험 단어 100개</li>
                <li>✓ 🎚️ 0.75x~1.25x 음성 속도 조절</li>
                <li>✓ 4단계 스마트 퀴즈 맛보기</li>
                <li>✓ 기본 출석 달력 체험</li>
              </ul>
              <button className="btn-plan-outline" onClick={() => setShowAuthModal(true)}>
                7일 무료체험 시작
              </button>
            </div>

            <div className="pricing-card popular">
              <div className="pop-badge">인기 선택</div>
              <div className="plan-name">개인 / 학부모 플랜</div>
              <div className="plan-price">9,900원 <span>/ 월</span></div>
              <p className="plan-desc">개인 학생 및 자녀 학습 관리용</p>
              <ul className="plan-features">
                <li>✓ 초·중·고 5,000개 전 단어 오픈</li>
                <li>✓ 🎚️ **0.75x/1.0x/1.25x 맞춤 속도 조절**</li>
                <li>✓ 🎙️ 음성 파동 녹음 & 4단계 퀴즈</li>
                <li>✓ 💮 학부모 안심 출석 달력</li>
                <li>✓ ❌ 무제한 실시간 오답노트</li>
              </ul>
              <button className="btn-plan-primary" onClick={() => setShowAuthModal(true)}>
                개인 수강신청 하기
              </button>
            </div>

            <div className="pricing-card">
              <div className="plan-name">학원 / 공부방 플랜</div>
              <div className="plan-price">39,000원 <span>/ 월</span></div>
              <p className="plan-desc">선생님 및 학원 수강생 통합 관리</p>
              <ul className="plan-features">
                <li>✓ 수강생 30명 기본 포함</li>
                <li>✓ 🖨️ 원클릭 6종 PDF 인쇄 무제한</li>
                <li>✓ 수강생 진도 통합 디렉토리</li>
                <li>✓ 📥 학원 자체 단어장 엑셀 업로드</li>
              </ul>
              <button className="btn-plan-outline" onClick={() => setShowAuthModal(true)}>
                학원/공부방 신청
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🙋‍♂️ 8. FAQ Section */}
      <section id="faq" className="section faq-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">FAQ</span>
            <h2 className="section-title">자주 묻는 질문</h2>
          </div>

          <div className="faq-list">
            {[
              {
                q: 'Q. 단어 발음이 빠른 아이들은 천천히 들을 수 있나요?',
                a: '네! 단어 카드 및 예문 재생 시 🎚️ 0.75x 배속(슬로우 모드) 옵션을 지원하여 어린 학생이나 파닉스 입문자도 또박또박 느린 발음으로 반복 청취할 수 있습니다.'
              },
              {
                q: 'Q. 초등학생 아이 혼자서도 공부할 수 있나요?',
                a: '네! 플래시카드 음성 들려주기와 4단계 스마트 퀴즈가 직관적인 UI로 구성되어 있어, 초등학생도 스스로 버튼을 누르며 재미있게 공부할 수 있습니다.'
              },
              {
                q: 'Q. 학부모 계정은 자녀와 어떻게 연동하나요?',
                a: '학부모 회원가입 시 자녀가 설정한 4자리 PIN 번호만 입력하면 즉시 연결되어 학부모 안심 대시보드에서 출석 달력과 오답노트를 조회하실 수 있습니다.'
              },
              {
                q: 'Q. 학원에서 PDF 시험지를 프린트할 때 추가 비용이 드나요?',
                a: '아닙니다! 학원/공부방 플랜 이용 시 4지선다 시험지, 단어 리스트, 워크시트, 단어 카드, 빙고판, 4선지 노트 등 6종 양식을 무제한으로 PDF 다운로드 및 인쇄하실 수 있습니다.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`faq-item ${openFaqIndex === idx ? 'open' : ''}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
              >
                <div className="faq-q">
                  <span>{faq.q}</span>
                  <span className="faq-arrow">{openFaqIndex === idx ? '▲' : '▼'}</span>
                </div>
                {openFaqIndex === idx && <div className="faq-a">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 9. Bottom CTA Section */}
      <section className="cta-banner-section">
        <div className="cta-container">
          <h2>지금 바로 steve voca와 함께 영단어 학습을 시작해보세요!</h2>
          <p>7일간 모든 기능을 제한 없이 무료로 체험하실 수 있습니다.</p>
          <button className="btn-cta-large" onClick={() => setShowAuthModal(true)}>
            🚀 7일 무료 수강신청하기
          </button>
        </div>
      </footer>

      {/* 🔐 10. Registration / Onboarding Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
            <div className="modal-header">
              <h3>🎓 steve voca 3초 간편 수강신청</h3>
              <p>원하시는 가입 회원 유형을 선택해 주세요.</p>
            </div>

            <div className="role-selector">
              <button
                className={`role-btn ${selectedRole === 'student' ? 'active' : ''}`}
                onClick={() => setSelectedRole('student')}
              >
                🎓 학생 가입
              </button>
              <button
                className={`role-btn ${selectedRole === 'parent' ? 'active' : ''}`}
                onClick={() => setSelectedRole('parent')}
              >
                👨‍👩‍👧‍👦 학부모 가입
              </button>
              <button
                className={`role-btn ${selectedRole === 'academy' ? 'active' : ''}`}
                onClick={() => setSelectedRole('academy')}
              >
                🏫 학원/공부방 가입
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="modal-form">
              {selectedRole === 'student' && (
                <>
                  <div className="form-group">
                    <label>학생 이름</label>
                    <input
                      type="text"
                      placeholder="예: 이승현"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>학년 선택</label>
                    <select value={studentGrade} onChange={(e) => setStudentGrade(e.target.value)}>
                      <option>초등 1~2학년</option>
                      <option>초등 3~4학년</option>
                      <option>초등 5~6학년</option>
                      <option>중학교 1~3학년</option>
                      <option>고등학교 1~3학년</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>하루 목표 학습 단어 수</label>
                    <select value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)}>
                      <option value="10">하루 10단어</option>
                      <option value="20">하루 20단어 (추천)</option>
                      <option value="30">하루 30단어</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>학생 비밀번호 (4자리 PIN)</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="숫자 4자리 (예: 1234)"
                      value={studentPin}
                      onChange={(e) => setStudentPin(e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedRole === 'parent' && (
                <>
                  <div className="form-group">
                    <label>학부모 성함</label>
                    <input
                      type="text"
                      placeholder="예: 이상학"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>연락처</label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>학부모 비밀번호 (4자리 PIN)</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="숫자 4자리 (예: 0815)"
                      value={parentPin}
                      onChange={(e) => setParentPin(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>연동할 자녀 학생 PIN 번호 (선택)</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="자녀 학생 PIN 4자리"
                      value={childPin}
                      onChange={(e) => setChildPin(e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedRole === 'academy' && (
                <>
                  <div className="form-group">
                    <label>학원 / 공부방 명칭</label>
                    <input
                      type="text"
                      placeholder="예: 영창 영어전문학원"
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>원장님 / 대표 선생님 성함</label>
                    <input
                      type="text"
                      placeholder="예: 김원장"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>연락처</label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={academyPhone}
                      onChange={(e) => setAcademyPhone(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="btn-modal-submit">
                🚀 수강신청 및 학습 시작하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <p>© 2026 steve voca. All rights reserved. 초·중·고 5,000 영단어 스마트 에듀테크</p>
        </div>
      </footer>

      {/* Scoped Styling */}
      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0F172A;
          background-color: #F8FAFC;
          line-height: 1.6;
        }
        a {
          text-decoration: none;
          color: inherit;
        }
      `}</style>

      <style jsx>{`
        /* Header */
        .nav-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid #E2E8F0;
          z-index: 1000;
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 24px;
          font-weight: 800;
          cursor: pointer;
        }
        .logo-badge {
          color: #4F46E5;
        }
        .logo-main {
          color: #0F172A;
        }
        .logo-tag {
          font-size: 20px;
        }
        .nav-menu {
          display: flex;
          gap: 28px;
          font-weight: 600;
          color: #475569;
          font-size: 15px;
        }
        .nav-menu a:hover {
          color: #4F46E5;
        }
        .nav-actions {
          display: flex;
          gap: 12px;
        }
        .btn-secondary {
          padding: 10px 18px;
          border-radius: 8px;
          background: #F1F5F9;
          color: #334155;
          font-size: 14px;
          font-weight: 600;
        }
        .btn-secondary:hover {
          background: #E2E8F0;
        }
        .btn-primary {
          padding: 10px 20px;
          border-radius: 8px;
          background: #4F46E5;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.2s, background 0.2s;
        }
        .btn-primary:hover {
          background: #4338CA;
          transform: translateY(-1px);
        }

        /* Hero */
        .hero-section {
          padding-top: 130px;
          padding-bottom: 90px;
          background: linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 100%);
        }
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: center;
        }
        .hero-pill {
          display: inline-block;
          padding: 6px 14px;
          background: #E0E7FF;
          color: #3730A3;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .hero-title {
          font-size: 42px;
          font-weight: 900;
          line-height: 1.25;
          color: #0F172A;
          margin-bottom: 20px;
          letter-spacing: -0.5px;
        }
        .highlight-text {
          color: #4F46E5;
        }
        .hero-subtitle {
          font-size: 17px;
          color: #475569;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .hero-btn-group {
          display: flex;
          gap: 16px;
          margin-bottom: 40px;
        }
        .btn-hero-primary {
          padding: 16px 32px;
          font-size: 17px;
          font-weight: 800;
          background: #4F46E5;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
          transition: transform 0.2s, background 0.2s;
        }
        .btn-hero-primary:hover {
          background: #4338CA;
          transform: translateY(-2px);
        }
        .btn-hero-outline {
          padding: 16px 28px;
          font-size: 16px;
          font-weight: 700;
          background: #FFFFFF;
          color: #334155;
          border: 2px solid #CBD5E1;
          border-radius: 12px;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .btn-hero-outline:hover {
          border-color: #4F46E5;
          color: #4F46E5;
        }
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-top: 24px;
          border-top: 1px solid #E2E8F0;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
        }
        .stat-num {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
        }
        .stat-label {
          font-size: 13px;
          color: #64748B;
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: #CBD5E1;
        }

        /* Hero Visual Card */
        .hero-visual {
          display: flex;
          justify-content: center;
        }
        .visual-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.12);
          border: 1px solid #E2E8F0;
          width: 100%;
          max-width: 440px;
        }
        .card-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 13px;
          font-weight: 700;
        }
        .card-cat {
          color: #4F46E5;
        }
        .card-streak {
          color: #D97706;
        }
        .card-word {
          font-size: 36px;
          font-weight: 900;
          color: #0F172A;
        }
        .card-phonics {
          font-size: 15px;
          color: #64748B;
          margin-bottom: 8px;
        }
        .card-meaning {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 16px;
        }

        .speed-badge-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 16px;
          background: #F1F5F9;
          padding: 8px 12px;
          border-radius: 10px;
        }
        .speed-chip {
          padding: 2px 8px;
          border-radius: 6px;
          background: #FFFFFF;
          color: #64748B;
          font-size: 11px;
        }
        .speed-chip.active {
          background: #4F46E5;
          color: #FFFFFF;
        }

        .audio-visualizer-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .waveform-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 12px;
        }
        .rec-dot {
          color: #EF4444;
          animation: blink 1.2s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .waveform-bars {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          height: 48px;
          margin-bottom: 12px;
        }
        .bar {
          width: 6px;
          background: linear-gradient(180deg, #4F46E5 0%, #10B981 100%);
          border-radius: 4px;
          animation: wave 1.2s ease-in-out infinite alternate;
        }
        .b1 { height: 16px; animation-delay: 0.1s; }
        .b2 { height: 36px; animation-delay: 0.3s; }
        .b3 { height: 48px; animation-delay: 0.5s; }
        .b4 { height: 28px; animation-delay: 0.2s; }
        .b5 { height: 40px; animation-delay: 0.4s; }
        @keyframes wave {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }

        .score-badge {
          text-align: center;
          font-size: 13px;
          color: #065F46;
          background: #D1FAE5;
          padding: 6px 12px;
          border-radius: 8px;
        }
        .card-footer-badges {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
        }
        .stamp-badge {
          color: #BE185D;
          background: #FCE7F3;
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hp-badge {
          color: #047857;
          background: #D1FAE5;
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Sections Common */
        .section {
          padding: 90px 24px;
        }
        .section-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 60px;
        }
        .section-tag {
          font-size: 13px;
          font-weight: 800;
          color: #4F46E5;
          letter-spacing: 1px;
          margin-bottom: 8px;
          display: block;
        }
        .section-title {
          font-size: 34px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }
        .section-desc {
          font-size: 17px;
          color: #64748B;
        }

        /* Grid layouts */
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
        }
        .grid-6 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        /* Feature Cards */
        .feature-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 32px 24px;
          border: 1px solid #E2E8F0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px -10px rgba(15, 23, 42, 0.08);
        }
        .card-step-num {
          font-size: 12px;
          font-weight: 800;
          color: #4F46E5;
          background: #EEF2FF;
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .card-icon {
          font-size: 36px;
          margin-bottom: 16px;
        }
        .feature-card h3 {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 12px;
        }
        .feature-card p {
          font-size: 14px;
          color: #64748B;
          line-height: 1.6;
        }

        /* Parent Section */
        .parent-section {
          background: #FFFFFF;
        }
        .align-center {
          align-items: center;
        }
        .check-list {
          list-style: none;
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .check-list li {
          display: flex;
          gap: 16px;
        }
        .check-icon {
          font-size: 28px;
        }
        .check-list strong {
          display: block;
          font-size: 17px;
          color: #0F172A;
          margin-bottom: 4px;
        }
        .check-list p {
          font-size: 14px;
          color: #64748B;
        }

        .parent-preview-card {
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 16px 32px -10px rgba(15, 23, 42, 0.08);
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          margin-bottom: 20px;
          font-size: 15px;
        }
        .badge-live {
          color: #10B981;
          background: #D1FAE5;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 12px;
        }
        .child-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        .child-tab {
          padding: 10px 16px;
          border-radius: 10px;
          background: #E2E8F0;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
        }
        .child-tab.active {
          background: #4F46E5;
          color: #FFFFFF;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .s-icon { font-size: 24px; margin-bottom: 4px; }
        .s-val { font-size: 18px; font-weight: 800; color: #0F172A; }
        .s-lbl { font-size: 11px; color: #64748B; }

        .mini-calendar {
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #E2E8F0;
        }
        .cal-title {
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 12px;
          color: #334155;
        }
        .cal-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
        }
        .cal-day {
          background: #F1F5F9;
          padding: 8px 4px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .cal-stamp {
          font-size: 14px;
          margin-top: 4px;
        }

        /* Academy Section */
        .pdf-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #E2E8F0;
          text-align: center;
        }
        .pdf-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 800;
          color: #0369A1;
          background: #E0F2FE;
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .pdf-card h4 {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #0F172A;
        }
        .pdf-card p {
          font-size: 13px;
          color: #64748B;
          margin-bottom: 20px;
        }
        .btn-pdf-preview {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          background: #0F172A;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 13px;
          border: none;
          cursor: pointer;
        }
        .btn-pdf-preview:hover {
          background: #334155;
        }

        /* Demo Section */
        .demo-section {
          background: #EEF2FF;
        }
        .demo-widget-container {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 20px 40px -15px rgba(79, 70, 229, 0.15);
          border: 1px solid #C7D2FE;
        }
        .speed-selector-widget {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 28px;
          background: #F8FAFC;
          padding: 12px 20px;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
        }
        .speed-label {
          font-size: 14px;
          font-weight: 800;
          color: #334155;
        }
        .speed-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
        }
        .speed-btn.active {
          background: #4F46E5;
          color: #FFFFFF;
          border-color: #4F46E5;
        }

        .demo-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
          justify-content: center;
        }
        .demo-tab-btn {
          padding: 12px 24px;
          border-radius: 12px;
          background: #F1F5F9;
          border: none;
          font-weight: 700;
          font-size: 14px;
          color: #475569;
          cursor: pointer;
        }
        .demo-tab-btn.active {
          background: #4F46E5;
          color: #FFFFFF;
        }
        .demo-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
        }
        .demo-flashcard {
          height: 280px;
          background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%);
          border-radius: 20px;
          color: #FFFFFF;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          cursor: pointer;
        }
        .hint-flip {
          font-size: 12px;
          opacity: 0.8;
          margin-bottom: 16px;
        }
        .demo-word-text {
          font-size: 40px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .demo-phonics-text {
          font-size: 16px;
          opacity: 0.9;
          margin-bottom: 24px;
        }
        .btn-tts, .btn-tts-sub {
          padding: 10px 20px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }
        .btn-tts:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .demo-quiz-side {
          background: #F8FAFC;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #E2E8F0;
        }
        .quiz-box-header h4 {
          font-size: 16px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 12px;
        }
        .btn-sound-quiz {
          padding: 6px 14px;
          border-radius: 8px;
          background: #E0E7FF;
          color: #4F46E5;
          font-weight: 700;
          font-size: 13px;
          border: none;
          cursor: pointer;
          margin-bottom: 20px;
        }
        .quiz-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        .quiz-opt {
          padding: 14px 18px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 2px solid #E2E8F0;
          text-align: left;
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          cursor: pointer;
        }
        .quiz-opt:hover {
          border-color: #4F46E5;
        }
        .quiz-opt.correct {
          background: #D1FAE5;
          border-color: #10B981;
          color: #065F46;
        }
        .quiz-opt.wrong {
          background: #FEE2E2;
          border-color: #EF4444;
          color: #991B1B;
        }
        .quiz-feedback {
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
        }
        .correct-bg { background: #D1FAE5; color: #065F46; }
        .wrong-bg { background: #FEE2E2; color: #991B1B; }

        /* Pricing Cards */
        .pricing-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 40px 32px;
          border: 1px solid #E2E8F0;
          position: relative;
          display: flex;
          flex-direction: column;
        }
        .pricing-card.popular {
          border: 2px solid #4F46E5;
          box-shadow: 0 16px 36px -10px rgba(79, 70, 229, 0.2);
        }
        .pop-badge {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          background: #4F46E5;
          color: #FFFFFF;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 800;
        }
        .plan-name {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 8px;
        }
        .plan-price {
          font-size: 38px;
          font-weight: 900;
          color: #0F172A;
          margin-bottom: 12px;
        }
        .plan-price span {
          font-size: 16px;
          color: #64748B;
          font-weight: 600;
        }
        .plan-desc {
          font-size: 14px;
          color: #64748B;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid #E2E8F0;
        }
        .plan-features {
          list-style: none;
          margin-bottom: 36px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-size: 14px;
          color: #334155;
          font-weight: 600;
          flex-grow: 1;
        }
        .btn-plan-primary {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: #4F46E5;
          color: #FFFFFF;
          font-weight: 800;
          font-size: 15px;
          border: none;
          cursor: pointer;
        }
        .btn-plan-outline {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: #FFFFFF;
          color: #334155;
          border: 2px solid #CBD5E1;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
        }

        /* FAQ */
        .faq-section {
          background: #FFFFFF;
        }
        .faq-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .faq-item {
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 20px 24px;
          cursor: pointer;
        }
        .faq-item.open {
          background: #F8FAFC;
          border-color: #C7D2FE;
        }
        .faq-q {
          display: flex;
          justify-content: space-between;
          font-size: 17px;
          font-weight: 800;
          color: #0F172A;
        }
        .faq-a {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #E2E8F0;
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
        }

        /* CTA Banner */
        .cta-banner-section {
          padding: 80px 24px;
          background: linear-gradient(135deg, #4F46E5 0%, #312E81 100%);
          color: #FFFFFF;
          text-align: center;
        }
        .cta-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .cta-container h2 {
          font-size: 34px;
          font-weight: 900;
          margin-bottom: 16px;
        }
        .cta-container p {
          font-size: 18px;
          opacity: 0.9;
          margin-bottom: 32px;
        }
        .btn-cta-large {
          padding: 18px 40px;
          border-radius: 14px;
          background: #10B981;
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 900;
          border: none;
          cursor: pointer;
        }

        /* Footer */
        .landing-footer {
          padding: 32px 24px;
          background: #0F172A;
          color: #94A3B8;
          text-align: center;
          font-size: 14px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .modal-content {
          background: #FFFFFF;
          border-radius: 24px;
          max-width: 500px;
          width: 100%;
          padding: 36px;
          position: relative;
        }
        .modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #64748B;
        }
        .modal-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .modal-header h3 {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 6px;
        }
        .modal-header p {
          font-size: 14px;
          color: #64748B;
        }
        .role-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #F1F5F9;
          padding: 4px;
          border-radius: 12px;
        }
        .role-btn {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
        }
        .role-btn.active {
          background: #FFFFFF;
          color: #4F46E5;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
        }
        .form-group input, .form-group select {
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid #CBD5E1;
          font-size: 14px;
          outline: none;
        }
        .btn-modal-submit {
          margin-top: 12px;
          padding: 14px;
          border-radius: 12px;
          background: #4F46E5;
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 800;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
