'use client';

import { useState } from 'react';
import Link from 'next/link';
import { playUniversalAudio } from '../../lib/audioPlayer.js';

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
    setIsDemoAudioPlaying(true);
    playUniversalAudio(text, { rate: customRate, lang: 'en' });
    setTimeout(() => setIsDemoAudioPlaying(false), 1200);
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

  // Onboarding / Consultation Submit Handle
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === 'student') {
      if (!studentName.trim() || !studentPin.trim()) {
        alert('이름과 비밀번호(4자리 PIN)를 입력해주세요.');
        return;
      }
      alert(`🎉 ${studentName} 학생 계정이 생성되었습니다!\n무료 학습 화면으로 이동합니다.`);
    } else if (selectedRole === 'parent') {
      if (!parentName.trim() || !parentPin.trim()) {
        alert('학부모 성함과 비밀번호를 입력해주세요.');
        return;
      }
      alert(`🎉 ${parentName} 학부모님 계정이 등록되었습니다!\n자녀 안심 대시보드로 이동합니다.`);
    } else {
      if (!academyName.trim() || !directorName.trim() || !academyPhone.trim()) {
        alert('학원명, 원장님 성함 및 연락처를 모두 입력해주세요.');
        return;
      }
      alert(`📞 ${academyName} (${directorName} 원장님) 도입 상담 신청이 접수되었습니다!\n담당자가 확인 후 바로 연락드리겠습니다.`);
    }
    setShowAuthModal(false);
    if (selectedRole !== 'academy') {
      window.location.href = '/';
    }
  };

  const openAcademyConsultModal = () => {
    setSelectedRole('academy');
    setShowAuthModal(true);
  };

  return (
    <div className="landing-root">
      {/* 🍏 1. Floating Apple-style Capsule Header */}
      <header className="apple-nav-wrapper">
        <div className="apple-nav-capsule">
          <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <img
              src="/image/flipvoca_logo.png"
              alt="FlipVoca"
              style={{ height: '34px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0, 166, 251, 0.15))' }}
            />
          </div>

          <nav className="nav-menu">
            <a href="#features">기능</a>
            <a href="#parent">학부모 리포트</a>
            <a href="#academy">PDF 인쇄</a>
            <a href="#demo">맛보기</a>
            <a href="#pricing">요금 안내</a>
          </nav>

          <div className="nav-actions">
            <Link href="/" className="btn-apple-secondary">
              학습 앱 ➔
            </Link>
            <button className="btn-apple-primary" onClick={() => setShowAuthModal(true)}>
              🎁 100% 무료 가입
            </button>
          </div>
        </div>
      </header>

      {/* 🍏 2. Hero Section with iPhone 16 Pro Frame Mockup */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="apple-pill-tag">
              <span>🎁 학생 & 학부모 100% 무료 | 🏫 학원 별도 문의</span>
            </div>
            <h1 className="hero-title">
              Master English Vocabulary.<br />
              <span className="highlight-text">Effortlessly.</span>
            </h1>
            <p className="hero-subtitle">
              직관적인 🎙️ <strong>음성 파동 녹음</strong>, 🎚️ <strong>0.75x~1.25x 맞춤 속도 조절</strong>,<br />
              💮 <strong>학부모 출석 달력</strong>, 🖨️ <strong>원클릭 6종 PDF 인쇄</strong>까지.<br />
              학생/학부모는 100% 무료! (학원/공부방 도입은 <strong>따로 연락해 주세요</strong>)
            </p>
            
            <div className="hero-btn-group">
              <button className="btn-hero-apple" onClick={() => setShowAuthModal(true)}>
                🎁 100% 무료 회원가입하기
              </button>
              <button className="btn-hero-glass" onClick={openAcademyConsultModal}>
                📞 학원 도입 문의하기
              </button>
            </div>

            <div className="apple-stats-bar">
              <div className="stat-box">
                <span className="stat-val">0원</span>
                <span className="stat-desc">학생/학부모 무료</span>
              </div>
              <div className="stat-sep"></div>
              <div className="stat-box">
                <span className="stat-val">따로 연락</span>
                <span className="stat-desc">학원/공부방 문의</span>
              </div>
              <div className="stat-sep"></div>
              <div className="stat-box">
                <span className="stat-val">6종</span>
                <span className="stat-desc">PDF 워크시트</span>
              </div>
            </div>
          </div>

          {/* 📱 Realistic iPhone 16 Pro Bezel Mockup Frame */}
          <div className="iphone-mockup-wrapper">
            <div className="iphone-frame">
              {/* iPhone Dynamic Island Notch */}
              <div className="iphone-dynamic-island">
                <span className="camera-lens"></span>
              </div>

              {/* iPhone Screen Content */}
              <div className="iphone-screen">
                <div className="app-status-bar">
                  <span>9:41</span>
                  <span>📶 5G 🔋</span>
                </div>

                <div className="app-header-mini">
                  <span className="app-badge">flip voca</span>
                  <span className="free-badge">🎁 Free</span>
                </div>

                <div className="iphone-card">
                  <div className="card-tag-mini">초등 필수 • 파닉스</div>
                  <h3 className="card-title-mini">Adventure</h3>
                  <p className="card-phonics-mini">[əd'ventʃər]</p>
                  <p className="card-meaning-mini">모험, 신나고 놀라운 경험</p>

                  <div className="mini-speed-bar">
                    <span className="speed-tag active">🐢 0.75x</span>
                    <span className="speed-tag">⚡ 1.0x</span>
                    <span className="speed-tag">🚀 1.25x</span>
                  </div>

                  <div className="mini-waveform-box">
                    <div className="wave-lbl">🎙️ 내 발음 실시간 주파수</div>
                    <div className="wave-bars-mini">
                      <span className="wb w1"></span>
                      <span className="wb w2"></span>
                      <span className="wb w3"></span>
                      <span className="wb w4"></span>
                      <span className="wb w5"></span>
                      <span className="wb w3"></span>
                    </div>
                    <div className="ai-score">AI 점수: 94점 (합격 🎉)</div>
                  </div>

                  <div className="mini-badges-row">
                    <span className="mini-stamp">💮 출석 완수</span>
                    <span className="mini-hp">💚💚💚</span>
                  </div>
                </div>

                {/* iPhone Home Bar */}
                <div className="iphone-home-bar"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 3. Features Section */}
      <section id="features" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="apple-subheading">Seamless Learning</span>
            <h2 className="apple-heading">감각을 통합하는 4단계 스마트 암기</h2>
            <p className="apple-body">아이폰 UI처럼 직관적인 디자인으로 몰입감을 높여 기억을 오래 유지시킵니다.</p>
          </div>

          <div className="grid-4">
            <div className="apple-card">
              <div className="apple-card-icon">📘</div>
              <h3>플래시카드 & 🎚️ 속도 조절</h3>
              <p>원어민 음성을 <strong>0.75x(느리게) / 1.0x(보통) / 1.25x(빠르게)</strong>로 맞춤 청취.</p>
            </div>

            <div className="apple-card">
              <div className="apple-card-icon">🎙️</div>
              <h3>음성 파동 Visualizer</h3>
              <p>마이크로 영어 단어를 읽고 주파수 이퀄라이저 그래프로 실시간 발음 일치도 측정.</p>
            </div>

            <div className="apple-card">
              <div className="apple-card-icon">❓</div>
              <h3>4단계 멀티 퀴즈</h3>
              <p>1단계 소리 ➔ 2단계 선택(출석도장 💮) ➔ 3단계 녹음 ➔ 4단계 쓰기 주관식 마스터.</p>
            </div>

            <div className="apple-card">
              <div className="apple-card-icon">🔥</div>
              <h3>연속 학습 스트릭</h3>
              <p>🔥 3일/7일/30일 연속 출석 스트릭과 왕관 뱃지로 지속적인 자기주도 학습 습관 형성.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 4. Parent Section */}
      <section id="parent" className="section parent-section">
        <div className="section-container">
          <div className="grid-2 align-center">
            <div className="parent-text-box">
              <span className="apple-subheading">Parent Dashboard</span>
              <h2 className="apple-heading">스마트폰으로 한눈에 보는 자녀 안심 리포트</h2>
              <p className="apple-body">
                학부모 전용 iOS 스타일 대시보드에서 자녀의 출석 달력과 오답노트를 실시간으로 확인하세요.
              </p>

              <div className="apple-feature-list">
                <div className="f-item">
                  <span className="f-icon">💮</span>
                  <div>
                    <h4>참잘했어요 출석 달력</h4>
                    <p>퀴즈 완수 시 도장이 콕 찍히는 달력. 날짜를 클릭하면 당일 공부한 단어 팝업 복습 제공.</p>
                  </div>
                </div>
                <div className="f-item">
                  <span className="f-icon">❌</span>
                  <div>
                    <h4>실시간 클라우드 오답노트</h4>
                    <p>틀린 단어만 클라우드 DB에 자동 모아 완벽히 마스터할 때까지 맞춤 관리.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="apple-dashboard-card">
              <div className="dash-header">
                <span>👨‍👩‍👧‍👦 자녀 안심 리포트</span>
                <span className="dash-live-chip">Live Sync</span>
              </div>
              <div className="ios-segmented-control">
                <button className="seg-btn active">👦 첫째 이승현</button>
                <button className="seg-btn">👧 둘째 이수민</button>
              </div>

              <div className="dash-metrics-grid">
                <div className="m-card">
                  <span className="m-icon">💮</span>
                  <span className="m-val">184개</span>
                  <span className="m-lbl">누적 도장</span>
                </div>
                <div className="m-card">
                  <span className="m-icon">📖</span>
                  <span className="m-val">20단어</span>
                  <span className="m-lbl">오늘 공부</span>
                </div>
                <div className="m-card">
                  <span className="m-icon">❌</span>
                  <span className="m-val">12개</span>
                  <span className="m-lbl">오답 잔여</span>
                </div>
              </div>

              <div className="ios-calendar-box">
                <div className="cal-hdr">📅 2026년 8월 학습 달력</div>
                <div className="cal-days-grid">
                  <div className="c-day">월 <span>💮</span></div>
                  <div className="c-day">화 <span>💮</span></div>
                  <div className="c-day">수 <span>💮</span></div>
                  <div className="c-day">목 <span>💮</span></div>
                  <div className="c-day">금 <span>💮</span></div>
                  <div className="c-day">토</div>
                  <div className="c-day">일</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 5. Academy PDF Generator Gallery */}
      <section id="academy" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="apple-subheading">For Teachers</span>
            <h2 className="apple-heading">원클릭 6종 PDF 워크시트 인쇄</h2>
            <p className="apple-body">단어 시험지 제작 시간을 0초로 단축시켜 드립니다. (학원 도입은 <strong>따로 연락주세요</strong>)</p>
          </div>

          <div className="grid-6">
            <div className="apple-pdf-card">
              <span className="pdf-tag">📝 양식 1</span>
              <h4>4지선다 시험지</h4>
              <p>객관식 뜻/스펠링 테스트지</p>
              <button className="btn-apple-action" onClick={() => alert('📝 [시험지 양식] 미리보기')}>미리보기 ➔</button>
            </div>

            <div className="apple-pdf-card">
              <span className="pdf-tag">📋 양식 2</span>
              <h4>2열 단어 리스트</h4>
              <p>영어-한글 뜻 대조 표</p>
              <button className="btn-apple-action" onClick={() => alert('📋 [2열 단어장] 미리보기')}>미리보기 ➔</button>
            </div>

            <div className="apple-pdf-card">
              <span className="pdf-tag">📄 양식 3</span>
              <h4>빈칸 채우기</h4>
              <p>스펠링 받아쓰기 연습지</p>
              <button className="btn-apple-action" onClick={() => alert('📄 [빈칸 연습지] 미리보기')}>미리보기 ➔</button>
            </div>

            <div className="apple-pdf-card">
              <span className="pdf-tag">📘 양식 4</span>
              <h4>절취선 단어 카드</h4>
              <p>오프라인 실물 단어 카드</p>
              <button className="btn-apple-action" onClick={() => alert('📘 [단어 카드] 미리보기')}>미리보기 ➔</button>
            </div>

            <div className="apple-pdf-card">
              <span className="pdf-tag">🎲 양식 5</span>
              <h4>단어 빙고판 (4x4)</h4>
              <p>학습용 단어 빙고 게임판</p>
              <button className="btn-apple-action" onClick={() => alert('🎲 [단어 빙고판] 미리보기')}>미리보기 ➔</button>
            </div>

            <div className="apple-pdf-card">
              <span className="pdf-tag">✍️ 양식 6</span>
              <h4>4선지 따라쓰기</h4>
              <p>영단어 4선 노트 연습지</p>
              <button className="btn-apple-action" onClick={() => alert('✍️ [4선지 노트] 미리보기')}>미리보기 ➔</button>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 6. Interactive Demo Widget */}
      <section id="demo" className="section demo-section">
        <div className="section-container">
          <div className="section-header">
            <span className="apple-subheading">Interactive Experience</span>
            <h2 className="apple-heading">1분 맛보기 체험 위젯</h2>
            <p className="apple-body">음성 속도를 조절하여 발음을 직접 들어보세요.</p>
          </div>

          <div className="apple-demo-container">
            {/* Speed Selector */}
            <div className="ios-segmented-bar">
              <span className="speed-lbl">🎚️ 음성 속도:</span>
              <button
                className={`seg-speed-btn ${demoAudioSpeed === 0.75 ? 'active' : ''}`}
                onClick={() => setDemoAudioSpeed(0.75)}
              >
                🐢 0.75x (슬로우)
              </button>
              <button
                className={`seg-speed-btn ${demoAudioSpeed === 1.0 ? 'active' : ''}`}
                onClick={() => setDemoAudioSpeed(1.0)}
              >
                ⚡ 1.0x (보통)
              </button>
              <button
                className={`seg-speed-btn ${demoAudioSpeed === 1.25 ? 'active' : ''}`}
                onClick={() => setDemoAudioSpeed(1.25)}
              >
                🚀 1.25x (빠르게)
              </button>
            </div>

            <div className="demo-words-pills">
              {demoWords.map((w, idx) => (
                <button
                  key={idx}
                  className={`word-pill ${demoWordIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setDemoWordIndex(idx);
                    setIsDemoFlipped(false);
                    setDemoQuizSelected(null);
                    setDemoQuizIsCorrect(null);
                  }}
                >
                  {w.word} ({w.category})
                </button>
              ))}
            </div>

            <div className="demo-flex-layout">
              <div className="demo-card-box">
                <div className={`apple-flashcard ${isDemoFlipped ? 'flipped' : ''}`} onClick={() => setIsDemoFlipped(!isDemoFlipped)}>
                  <div className="card-front">
                    <span className="flip-hint">👆 카드를 터치하면 뒤집어집니다</span>
                    <h3>{currentDemoWord.word}</h3>
                    <p>{currentDemoWord.phonics}</p>
                    <button
                      className="btn-apple-tts"
                      onClick={(e) => {
                        e.stopPropagation();
                        playWordAudio(currentDemoWord.word);
                      }}
                    >
                      {isDemoAudioPlaying ? `🔊 재생 중 (${demoAudioSpeed}x)...` : `🔊 발음 듣기 (${demoAudioSpeed}x)`}
                    </button>
                  </div>
                  <div className="card-back">
                    <h3>{currentDemoWord.meaning}</h3>
                    <p className="ex-en">"{currentDemoWord.exampleEn}"</p>
                    <p className="ex-ko">{currentDemoWord.exampleKo}</p>
                  </div>
                </div>
              </div>

              <div className="demo-quiz-box">
                <h4>❓ [맛보기 퀴즈] {currentDemoWord.word}의 올바른 뜻은?</h4>
                <div className="quiz-options">
                  <button
                    className={`quiz-opt-btn ${demoQuizSelected === 0 ? 'wrong' : ''}`}
                    onClick={() => handleDemoQuizChoice(0)}
                  >
                    1. 웅장하고 오래된 건물
                  </button>
                  <button
                    className={`quiz-opt-btn ${demoQuizSelected === 1 ? 'correct' : ''}`}
                    onClick={() => handleDemoQuizChoice(1)}
                  >
                    2. {currentDemoWord.meaning}
                  </button>
                  <button
                    className={`quiz-opt-btn ${demoQuizSelected === 2 ? 'wrong' : ''}`}
                    onClick={() => handleDemoQuizChoice(2)}
                  >
                    3. 조용히 쉬는 휴식 시간
                  </button>
                </div>

                {demoQuizIsCorrect === true && (
                  <div className="feedback-badge correct">🎉 정답입니다! 출석 도장(💮) 발급 완료!</div>
                )}
                {demoQuizIsCorrect === false && (
                  <div className="feedback-badge wrong">❌ 아쉬워요! 정답은 2번입니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 7. Pricing Section - Free for Students / Contact Us for Academies */}
      <section id="pricing" className="section">
        <div className="section-container">
          <div className="section-header">
            <span className="apple-subheading">Pricing Policy</span>
            <h2 className="apple-heading">요금 및 맞춤 신청 안내</h2>
            <p className="apple-body">개인 학생과 학부모는 100% 무료이며, 학원/공부방 도입은 별도로 연락해 주세요.</p>
          </div>

          <div className="grid-2">
            <div className="apple-pricing-card featured">
              <div className="feat-chip">🎓 학생 & 학부모 회원</div>
              <div className="plan-title">전 기능 100% 평생 무료</div>
              <div className="plan-cost">0원 <span>/ 평생</span></div>
              <ul className="plan-list">
                <li>✓ 초·중·고 5,000개 전 단어 DB 무료 오픈</li>
                <li>✓ 🎚️ **0.75x/1.0x/1.25x 맞춤 속도 조절**</li>
                <li>✓ 🎙️ 음성 파동 Visualizer 녹음</li>
                <li>✓ ❓ 4단계 스마트 멀티 퀴즈</li>
                <li>✓ 🏆 주간 랭킹전 참여 & 뱃지 수여</li>
                <li>✓ 🔗 친구 초대 다단계 복리 추천 포인트</li>
                <li>✓ 💮 학부모 안심 출석 달력 & ❌ 오답노트</li>
              </ul>
              <button className="btn-plan-btn primary" onClick={() => setShowAuthModal(true)}>
                🎁 100% 무료 회원가입하기
              </button>
            </div>

            <div className="apple-pricing-card contact-card">
              <div className="feat-chip academy-chip">🏫 선생님 & 학원 / 공부방</div>
              <div className="plan-title">학원 도입 맞춤 솔루션</div>
              <div className="plan-cost contact-text">📞 따로 연락 주세요 <span>(별도 문의)</span></div>
              <ul className="plan-list">
                <li>✓ 수강생 인원 맞춤 관리 디렉토리</li>
                <li>✓ 🖨️ **원클릭 6종 PDF 시험지/워크시트 인쇄 지원**</li>
                <li>✓ 📥 학원 자체 단어장 커스텀 엑셀 업로드 지원</li>
                <li>✓ 학원 전용 프린트 헤더/로고 서식 셋팅</li>
                <li>✓ 전담 담당자 1:1 방문/전화 온보딩 안내</li>
              </ul>
              <button className="btn-plan-btn outline-dark" onClick={openAcademyConsultModal}>
                📞 학원 도입 문의하기 (따로 연락)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 🍏 8. FAQ Section */}
      <section id="faq" className="section faq-section">
        <div className="section-container">
          <div className="section-header">
            <span className="apple-subheading">FAQ</span>
            <h2 className="apple-heading">자주 묻는 질문</h2>
          </div>

          <div className="apple-faq-list">
            {[
              {
                q: 'Q. 학생과 학부모는 정말 무료로 사용할 수 있나요?',
                a: '네! 초·중·고 5,000개 전 단어 학습, 음성 속도 조절, 주간 랭킹전, 학부모 출석 리포트까지 학생과 학부모는 100% 무료로 이용하실 수 있습니다.'
              },
              {
                q: 'Q. 학원/공부방 도입은 어떻게 신청하나요?',
                a: '학원 원장님 및 선생님은 [학원 도입 문의하기] 버튼을 통해 연락처를 남겨주시면, 담당자가 확인 후 직접 연락드려 안내 및 인쇄 서식 셋팅을 도와드립니다.'
              },
              {
                q: 'Q. 단어 발음이 빠른 아이들은 천천히 들을 수 있나요?',
                a: '네! 🎚️ 0.75x 배속(슬로우 모드) 옵션을 지원하여 어린 학생이나 파닉스 입문자도 느린 발음으로 또박또박 반복 청취할 수 있습니다.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`apple-faq-item ${openFaqIndex === idx ? 'open' : ''}`}
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
              >
                <div className="faq-q-text">
                  <span>{faq.q}</span>
                  <span>{openFaqIndex === idx ? '−' : '+'}</span>
                </div>
                {openFaqIndex === idx && <div className="faq-a-text">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🍏 9. Bottom CTA */}
      <section className="apple-cta-section">
        <div className="cta-box">
          <h2>Start Learning English Vocabulary Today.</h2>
          <p>학생/학부모는 100% 무료! 학원 도입은 언제든지 따로 연락 주세요.</p>
          <div className="cta-btn-flex">
            <button className="btn-hero-apple" onClick={() => setShowAuthModal(true)}>
              🎁 100% 무료 회원가입하기
            </button>
            <button className="btn-hero-glass" onClick={openAcademyConsultModal}>
              📞 학원 도입 문의하기
            </button>
          </div>
        </div>
      </section>

      {/* 🔐 Onboarding & Consultation Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="apple-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)}>✕</button>
            <div className="modal-hdr">
              <h3>
                {selectedRole === 'academy' ? '📞 학원/공부방 도입 문의 신청' : '🎓 FlipVoca 100% 무료 가입'}
              </h3>
              <p>
                {selectedRole === 'academy' ? '담당자가 확인 후 직접 따로 연락을 드리겠습니다.' : '회원 유형을 선택해 주세요.'}
              </p>
            </div>

            <div className="ios-modal-tabs">
              <button
                className={`tab-item ${selectedRole === 'student' ? 'active' : ''}`}
                onClick={() => setSelectedRole('student')}
              >
                학생
              </button>
              <button
                className={`tab-item ${selectedRole === 'parent' ? 'active' : ''}`}
                onClick={() => setSelectedRole('parent')}
              >
                학부모
              </button>
              <button
                className={`tab-item ${selectedRole === 'academy' ? 'active' : ''}`}
                onClick={() => setSelectedRole('academy')}
              >
                🏫 학원/공부방 (따로 연락)
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="modal-form">
              {selectedRole === 'student' && (
                <>
                  <div className="form-fld">
                    <label>학생 이름</label>
                    <input
                      type="text"
                      placeholder="예: 이승현"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                    />
                  </div>
                  <div className="form-fld">
                    <label>학년 선택</label>
                    <select value={studentGrade} onChange={(e) => setStudentGrade(e.target.value)}>
                      <option>초등 1~2학년</option>
                      <option>초등 3~4학년</option>
                      <option>초등 5~6학년</option>
                      <option>중학교 1~3학년</option>
                      <option>고등학교 1~3학년</option>
                    </select>
                  </div>
                  <div className="form-fld">
                    <label>하루 목표 학습량</label>
                    <select value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)}>
                      <option value="10">하루 10단어</option>
                      <option value="20">하루 20단어 (추천)</option>
                      <option value="30">하루 30단어</option>
                    </select>
                  </div>
                  <div className="form-fld">
                    <label>비밀번호 (4자리 PIN)</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="숫자 4자리 (예: 1234)"
                      value={studentPin}
                      onChange={(e) => setStudentPin(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-modal-apple">
                    🚀 100% 무료 회원가입하기
                  </button>
                </>
              )}

              {selectedRole === 'parent' && (
                <>
                  <div className="form-fld">
                    <label>학부모 성함</label>
                    <input
                      type="text"
                      placeholder="예: 이상학"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                    />
                  </div>
                  <div className="form-fld">
                    <label>연락처</label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-fld">
                    <label>비밀번호 (4자리 PIN)</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="숫자 4자리"
                      value={parentPin}
                      onChange={(e) => setParentPin(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-modal-apple">
                    🚀 100% 무료 회원가입하기
                  </button>
                </>
              )}

              {selectedRole === 'academy' && (
                <>
                  <div className="form-fld">
                    <label>학원 / 공부방 명칭</label>
                    <input
                      type="text"
                      placeholder="예: 영창 영어전문학원"
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                    />
                  </div>
                  <div className="form-fld">
                    <label>원장님 성함</label>
                    <input
                      type="text"
                      placeholder="예: 김원장"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                    />
                  </div>
                  <div className="form-fld">
                    <label>연락받으실 전화번호</label>
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={academyPhone}
                      onChange={(e) => setAcademyPhone(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-modal-apple contact-btn">
                    📞 상담 신청하기 (따로 연락)
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="apple-footer">
        <p>© 2026 FlipVoca (https://flipvoca.com). All rights reserved. Designed for Apple iOS & Web.</p>
      </footer>

      {/* Scoped Apple Style Sheet */}
      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Pretendard', sans-serif;
          color: #1D1D1F;
          background-color: #F5F5F7;
          line-height: 1.5;
          letter-spacing: -0.015em;
        }
        a { text-decoration: none; color: inherit; }
      `}</style>

      <style jsx>{`
        /* Apple Floating Capsule Header */
        .apple-nav-wrapper {
          position: fixed;
          top: 16px;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 1000;
          padding: 0 16px;
        }
        .apple-nav-capsule {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 999px;
          padding: 8px 12px 8px 24px;
          display: flex;
          align-items: center;
          gap: 36px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03);
          max-width: 1000px;
          width: 100%;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 19px;
          font-weight: 800;
          cursor: pointer;
          color: #1D1D1F;
        }
        .logo-apple-icon {
          font-size: 20px;
          color: #0071E3;
        }
        .nav-menu {
          display: flex;
          gap: 24px;
          font-size: 14px;
          font-weight: 600;
          color: #515154;
        }
        .nav-menu a:hover {
          color: #0071E3;
        }
        .nav-actions {
          display: flex;
          gap: 8px;
        }
        .btn-apple-secondary {
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.05);
          color: #1D1D1F;
          font-size: 13px;
          font-weight: 600;
        }
        .btn-apple-primary {
          padding: 8px 18px;
          border-radius: 999px;
          background: #0071E3;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 113, 227, 0.3);
        }

        /* Hero */
        .hero-section {
          padding-top: 150px;
          padding-bottom: 100px;
        }
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .apple-pill-tag {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(0, 113, 227, 0.1);
          color: #0071E3;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .hero-title {
          font-size: 52px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.025em;
          color: #1D1D1F;
          margin-bottom: 20px;
        }
        .highlight-text {
          color: #0071E3;
        }
        .hero-subtitle {
          font-size: 18px;
          color: #86868B;
          line-height: 1.6;
          margin-bottom: 36px;
        }
        .hero-btn-group {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }
        .btn-hero-apple {
          padding: 16px 32px;
          border-radius: 999px;
          background: #0071E3;
          color: #FFFFFF;
          font-size: 17px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0, 113, 227, 0.35);
          transition: transform 0.2s;
        }
        .btn-hero-apple:hover {
          transform: scale(1.02);
          background: #0077ED;
        }
        .btn-hero-glass {
          padding: 16px 28px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.85);
          color: #1D1D1F;
          border: 1px solid rgba(0, 0, 0, 0.12);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .apple-stats-bar {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
        }
        .stat-val {
          font-size: 22px;
          font-weight: 800;
          color: #1D1D1F;
          display: block;
        }
        .stat-desc {
          font-size: 13px;
          color: #86868B;
        }
        .stat-sep {
          width: 1px;
          height: 32px;
          background: rgba(0, 0, 0, 0.1);
        }

        /* 📱 iPhone Frame Mockup */
        .iphone-mockup-wrapper {
          display: flex;
          justify-content: center;
        }
        .iphone-frame {
          width: 320px;
          height: 640px;
          background: #000000;
          border-radius: 54px;
          padding: 12px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 4px #2D2D2E, 0 0 0 8px #1A1A1A;
          position: relative;
        }
        .iphone-dynamic-island {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 96px;
          height: 28px;
          background: #000000;
          border-radius: 20px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
        }
        .camera-lens {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #111115;
          border: 1px solid #222228;
        }
        .iphone-screen {
          width: 100%;
          height: 100%;
          background: #F5F5F7;
          border-radius: 42px;
          overflow: hidden;
          padding: 38px 16px 16px;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        .app-status-bar {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 700;
          color: #1D1D1F;
          margin-bottom: 12px;
        }
        .app-header-mini {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .app-badge { color: #0071E3; }
        .free-badge { color: #34C759; background: #E8F9ED; padding: 2px 6px; border-radius: 6px; }

        .iphone-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 20px 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .card-tag-mini { font-size: 10px; color: #0071E3; font-weight: 700; margin-bottom: 4px; }
        .card-title-mini { font-size: 26px; font-weight: 800; color: #1D1D1F; margin-bottom: 2px; }
        .card-phonics-mini { font-size: 12px; color: #86868B; margin-bottom: 6px; }
        .card-meaning-mini { font-size: 14px; font-weight: 700; color: #1D1D1F; margin-bottom: 14px; }

        .mini-speed-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }
        .speed-tag {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 6px;
          background: #F5F5F7;
          color: #86868B;
        }
        .speed-tag.active { background: #0071E3; color: #FFFFFF; font-weight: 700; }

        .mini-waveform-box {
          background: #F5F5F7;
          border-radius: 14px;
          padding: 10px;
          margin-bottom: 14px;
        }
        .wave-lbl { font-size: 10px; font-weight: 700; color: #515154; margin-bottom: 6px; }
        .wave-bars-mini {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
          height: 24px;
          margin-bottom: 6px;
        }
        .wb { width: 4px; background: #0071E3; border-radius: 2px; height: 16px; }
        .w1 { height: 8px; } .w2 { height: 18px; } .w3 { height: 24px; } .w4 { height: 14px; } .w5 { height: 20px; }
        .ai-score { font-size: 10px; text-align: center; color: #34C759; font-weight: 700; }

        .mini-badges-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 700;
        }
        .mini-stamp { color: #D0145A; background: #FCE7F3; padding: 4px 8px; border-radius: 6px; }
        .mini-hp { color: #34C759; background: #E8F9ED; padding: 4px 8px; border-radius: 6px; }

        .iphone-home-bar {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 4px;
          background: #000000;
          border-radius: 2px;
        }

        /* Apple Squircle Sections */
        .section { padding: 100px 24px; }
        .section-container { max-width: 1100px; margin: 0 auto; }
        .section-header { text-align: center; max-width: 680px; margin: 0 auto 60px; }
        .apple-subheading { font-size: 14px; font-weight: 700; color: #0071E3; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 8px; }
        .apple-heading { font-size: 38px; font-weight: 800; color: #1D1D1F; letter-spacing: -0.02em; margin-bottom: 14px; }
        .apple-body { font-size: 18px; color: #86868B; }

        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
        .grid-6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        .apple-card {
          background: #FFFFFF;
          border-radius: 28px;
          padding: 32px 24px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .apple-card:hover {
          transform: scale(1.02);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
        }
        .apple-card-icon { font-size: 38px; margin-bottom: 20px; }
        .apple-card h3 { font-size: 20px; font-weight: 800; color: #1D1D1F; margin-bottom: 10px; }
        .apple-card p { font-size: 14px; color: #86868B; line-height: 1.6; }

        /* Parent Section */
        .parent-section { background: #FFFFFF; border-radius: 36px; margin: 40px 0; }
        .apple-feature-list { margin-top: 32px; display: flex; flex-direction: column; gap: 20px; }
        .f-item { display: flex; gap: 16px; }
        .f-icon { font-size: 24px; }
        .f-item h4 { font-size: 16px; font-weight: 700; color: #1D1D1F; }
        .f-item p { font-size: 14px; color: #86868B; }

        .apple-dashboard-card {
          background: #F5F5F7;
          border-radius: 28px;
          padding: 28px;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }
        .dash-header { display: flex; justify-content: space-between; font-weight: 800; margin-bottom: 16px; font-size: 15px; }
        .dash-live-chip { color: #34C759; background: #E8F9ED; padding: 2px 8px; border-radius: 999px; font-size: 11px; }

        .ios-segmented-control {
          display: flex;
          background: rgba(0, 0, 0, 0.06);
          padding: 3px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .seg-btn {
          flex: 1;
          padding: 8px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 700;
          color: #515154;
          cursor: pointer;
        }
        .seg-btn.active { background: #FFFFFF; color: #1D1D1F; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }

        .dash-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .m-card { background: #FFFFFF; border-radius: 16px; padding: 14px; text-align: center; display: flex; flex-direction: column; align-items: center; }
        .m-icon { font-size: 20px; }
        .m-val { font-size: 17px; font-weight: 800; color: #1D1D1F; }
        .m-lbl { font-size: 11px; color: #86868B; }

        .ios-calendar-box { background: #FFFFFF; border-radius: 16px; padding: 16px; }
        .cal-hdr { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #1D1D1F; }
        .cal-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; font-size: 11px; font-weight: 600; }
        .c-day { background: #F5F5F7; padding: 6px 2px; border-radius: 6px; display: flex; flex-direction: column; align-items: center; }

        /* Apple PDF Cards */
        .apple-pdf-card {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.04);
          text-align: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03);
        }
        .pdf-tag { font-size: 11px; font-weight: 700; color: #0071E3; background: rgba(0, 113, 227, 0.08); padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 12px; }
        .apple-pdf-card h4 { font-size: 17px; font-weight: 800; color: #1D1D1F; margin-bottom: 6px; }
        .apple-pdf-card p { font-size: 13px; color: #86868B; margin-bottom: 18px; }
        .btn-apple-action { width: 100%; padding: 10px; border-radius: 999px; background: #1D1D1F; color: #FFFFFF; font-size: 13px; font-weight: 700; border: none; cursor: pointer; }

        /* Demo Section */
        .demo-section { background: #FFFFFF; border-radius: 36px; margin: 40px 0; }
        .apple-demo-container { max-width: 900px; margin: 0 auto; }
        .ios-segmented-bar { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 24px; }
        .speed-lbl { font-size: 13px; font-weight: 700; color: #515154; }
        .seg-speed-btn { padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(0, 0, 0, 0.1); background: #F5F5F7; font-size: 13px; font-weight: 600; color: #515154; cursor: pointer; }
        .seg-speed-btn.active { background: #0071E3; color: #FFFFFF; border-color: #0071E3; font-weight: 700; }

        .demo-words-pills { display: flex; justify-content: center; gap: 10px; margin-bottom: 32px; }
        .word-pill { padding: 10px 20px; border-radius: 999px; background: #F5F5F7; border: none; font-size: 14px; font-weight: 600; color: #515154; cursor: pointer; }
        .word-pill.active { background: #1D1D1F; color: #FFFFFF; font-weight: 700; }

        .demo-flex-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .apple-flashcard { height: 260px; background: linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%); border-radius: 28px; color: #FFFFFF; padding: 28px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; cursor: pointer; }
        .flip-hint { font-size: 11px; opacity: 0.7; margin-bottom: 12px; }
        .apple-flashcard h3 { font-size: 36px; font-weight: 900; margin-bottom: 6px; }
        .apple-flashcard p { font-size: 14px; opacity: 0.8; margin-bottom: 20px; }
        .btn-apple-tts { padding: 8px 18px; border-radius: 999px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.3); color: #FFFFFF; font-weight: 700; font-size: 13px; cursor: pointer; }

        .demo-quiz-box { background: #F5F5F7; border-radius: 28px; padding: 28px; border: 1px solid rgba(0, 0, 0, 0.04); }
        .demo-quiz-box h4 { font-size: 15px; font-weight: 800; color: #1D1D1F; margin-bottom: 16px; }
        .quiz-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .quiz-opt-btn { padding: 12px 16px; border-radius: 16px; background: #FFFFFF; border: 1px solid rgba(0, 0, 0, 0.08); text-align: left; font-size: 14px; font-weight: 600; color: #1D1D1F; cursor: pointer; }
        .quiz-opt-btn.correct { background: #E8F9ED; border-color: #34C759; color: #1D8A38; font-weight: 700; }
        .quiz-opt-btn.wrong { background: #FFEBEB; border-color: #FF3B30; color: #D0145A; font-weight: 700; }
        .feedback-badge { padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 700; }
        .feedback-badge.correct { background: #E8F9ED; color: #1D8A38; }
        .feedback-badge.wrong { background: #FFEBEB; color: #D0145A; }

        /* Pricing Cards */
        .apple-pricing-card { background: #FFFFFF; border-radius: 28px; padding: 36px 28px; border: 1px solid rgba(0, 0, 0, 0.04); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; position: relative; }
        .apple-pricing-card.featured { border: 2px solid #34C759; box-shadow: 0 16px 40px rgba(52, 199, 89, 0.15); }
        .apple-pricing-card.contact-card { border: 2px solid #0071E3; box-shadow: 0 16px 40px rgba(0, 113, 227, 0.12); }
        .feat-chip { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #34C759; color: #FFFFFF; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; }
        .feat-chip.academy-chip { background: #0071E3; }
        .plan-title { font-size: 20px; font-weight: 800; color: #1D1D1F; margin-bottom: 6px; }
        .plan-cost { font-size: 36px; font-weight: 800; color: #1D1D1F; margin-bottom: 20px; }
        .plan-cost.contact-text { font-size: 28px; color: #0071E3; }
        .plan-cost span { font-size: 14px; color: #86868B; font-weight: 500; }
        .plan-list { list-style: none; margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: #515154; flex-grow: 1; }
        .btn-plan-btn { width: 100%; padding: 14px; border-radius: 999px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; }
        .btn-plan-btn.primary { background: #34C759; color: #FFFFFF; box-shadow: 0 4px 14px rgba(52, 199, 89, 0.3); }
        .btn-plan-btn.outline-dark { background: #0071E3; color: #FFFFFF; box-shadow: 0 4px 14px rgba(0, 113, 227, 0.3); }

        /* FAQ */
        .apple-faq-list { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px; }
        .apple-faq-item { background: #FFFFFF; border-radius: 20px; padding: 20px 24px; border: 1px solid rgba(0, 0, 0, 0.04); cursor: pointer; }
        .faq-q-text { display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #1D1D1F; }
        .faq-a-text { margin-top: 12px; padding-top: 12px; border-top: 1px solid #F5F5F7; font-size: 14px; color: #86868B; line-height: 1.6; }

        /* CTA */
        .apple-cta-section { padding: 90px 24px; text-align: center; }
        .cta-box { max-width: 760px; margin: 0 auto; background: #FFFFFF; border-radius: 36px; padding: 60px 32px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.06); }
        .cta-box h2 { font-size: 32px; font-weight: 800; color: #1D1D1F; margin-bottom: 12px; }
        .cta-box p { font-size: 17px; color: #86868B; margin-bottom: 32px; }
        .cta-btn-flex { display: flex; justify-content: center; gap: 16px; }

        /* Footer */
        .apple-footer { padding: 32px 24px; text-align: center; font-size: 13px; color: #86868B; border-top: 1px solid rgba(0, 0, 0, 0.06); }

        /* Modal */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .apple-modal-box { background: #FFFFFF; border-radius: 32px; max-width: 480px; width: 100%; padding: 36px; position: relative; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15); }
        .modal-close { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.05); border: none; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; color: #86868B; font-weight: 800; }
        .modal-hdr { text-align: center; margin-bottom: 24px; }
        .modal-hdr h3 { font-size: 20px; font-weight: 800; color: #1D1D1F; margin-bottom: 4px; }
        .modal-hdr p { font-size: 13px; color: #86868B; }
        .ios-modal-tabs { display: flex; background: #F5F5F7; padding: 4px; border-radius: 12px; margin-bottom: 20px; }
        .tab-item { flex: 1; padding: 8px; border-radius: 8px; border: none; background: transparent; font-size: 12px; font-weight: 700; color: #86868B; cursor: pointer; }
        .tab-item.active { background: #FFFFFF; color: #1D1D1F; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        .modal-form { display: flex; flex-direction: column; gap: 14px; }
        .form-fld { display: flex; flex-direction: column; gap: 6px; }
        .form-fld label { font-size: 12px; font-weight: 700; color: #515154; }
        .form-fld input, .form-fld select { padding: 12px; border-radius: 12px; border: 1px solid #E5E5EA; background: #F5F5F7; font-size: 14px; outline: none; }
        .btn-modal-apple { margin-top: 12px; padding: 14px; border-radius: 999px; background: #0071E3; color: #FFFFFF; font-size: 15px; font-weight: 700; border: none; cursor: pointer; box-shadow: 0 4px 14px rgba(0, 113, 227, 0.3); }
        .btn-modal-apple.contact-btn { background: #0071E3; }
      `}</style>
    </div>
  );
}
