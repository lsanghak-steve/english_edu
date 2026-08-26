'use client';

import { useState } from 'react';
import Link from 'next/link';
import ChinaPaymentModal from '../components/ChinaPaymentModal.js';

export default function LandingZhPage() {
  // VIP 支付弹窗状态
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 角色弹窗状态 (学生/家长/机构校长)
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');

  // 表单输入状态
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('小学 三年级');
  const [dailyGoal, setDailyGoal] = useState('20');
  const [studentPin, setStudentPin] = useState('');

  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  const [academyName, setAcademyName] = useState('');
  const [directorName, setDirectorName] = useState('');
  const [academyPhone, setAcademyPhone] = useState('');

  // 互动式实时 Demo 体验卡片
  const [demoWordIndex, setDemoWordIndex] = useState(0);
  const [isDemoFlipped, setIsDemoFlipped] = useState(false);
  const [demoAudioSpeed, setDemoAudioSpeed] = useState(1.0);
  const [demoQuizSelected, setDemoQuizSelected] = useState(null);
  const [demoQuizIsCorrect, setDemoQuizIsCorrect] = useState(null);

  // FAQ 手风琴状态
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // 演示示例单词库
  const demoWords = [
    {
      word: 'adventure',
      phonics: "[əd'ventʃər]",
      meaning: '冒险，奇遇，惊险刺激的经历',
      category: '小学 必背核心',
      exampleEn: 'We started our grand adventure in the deep forest.',
      exampleZh: '我们在茂密的森林里开启了宏大的冒险旅程。'
    },
    {
      word: 'brilliant',
      phonics: "['brɪliənt]",
      meaning: '极好的，绝妙的，闪耀光芒的',
      category: '初中 重点突破',
      exampleEn: 'She gave a brilliant answer to the difficult question.',
      exampleZh: '她对这个难题给出了一个极其精妙的回答。'
    },
    {
      word: 'curiosity',
      phonics: "[,kjʊəri'ɒsəti]",
      meaning: '好奇心，求知欲',
      category: '高中·高考 提分必备',
      exampleEn: 'Children learn new things out of natural curiosity.',
      exampleZh: '孩子们出于与生俱来的好奇心去探索学习新事物。'
    }
  ];

  const currentDemoWord = demoWords[demoWordIndex];

  // 语音朗读播放
  const playWordAudio = (text, rate = demoAudioSpeed) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(`[🔊 发音演示 (${rate}x 语速)] "${text}"`);
    }
  };

  // 测验选项点击
  const handleDemoQuizChoice = (index) => {
    setDemoQuizSelected(index);
    if (index === 1) {
      setDemoQuizIsCorrect(true);
    } else {
      setDemoQuizIsCorrect(false);
    }
  };

  // 预约/入驻提交
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (selectedRole === 'student') {
      if (!studentName.trim()) {
        alert('请输入学生姓名。');
        return;
      }
      alert(`🎉 恭喜！${studentName} 同学的体验账号已就绪！\n正在前往智能学习主页。`);
      window.location.href = '/';
    } else if (selectedRole === 'parent') {
      if (!parentName.trim() || !parentPhone.trim()) {
        alert('请完整填写家长姓名和联系电话。');
        return;
      }
      alert(`🎉 感谢 ${parentName} 家长的关注！\n微信学习报告演示看板已就绪。`);
      window.location.href = '/';
    } else {
      if (!academyName.trim() || !directorName.trim() || !academyPhone.trim()) {
        alert('请完整填写机构名称、负责人姓名及电话。');
        return;
      }
      alert(`🎉 感谢 ${directorName} 校长！\n【${academyName}】机构专属试用账号已提交，稍后将由教研顾问与您联系！`);
      setShowAuthModal(false);
    }
  };

  const faqs = [
    {
      q: '为什么 FlipVoca 比死记硬背单词效率高 3 倍？',
      a: 'FlipVoca (翻翻背单词) 采用“3D 视觉插画翻卡 ➔ 原声听力辨音 ➔ 4阶游戏化测验 ➔ 错题智能漏斗”的闭环记忆法。配合 AI 发音音高波形比对，告别枯燥默写，真正激活深度长时记忆。'
    },
    {
      q: '培训机构与英语教师如何使用后台管理系统？',
      a: '机构版支持一键批量导入班级学员、每日指派分级词汇包、实时监控全班做题正确率与出勤率，并能一键导出 6 种 A4 练习试卷与错题诊断卷（支持 PDF 打印）。'
    },
    {
      q: '支持哪些词汇级别？是否契合国内教学大纲与高考？',
      a: '系统完整内置 5,000 核心词库：涵盖新课标小学英语必背 800 词、初中中考必备 1,200 词、高中高考冲刺 3,000 词，所有词条均配齐 100% 高清插画、真声音频与实用双语例句。'
    },
    {
      q: '家长如何实时掌握孩子的每日学习成果？',
      a: '无需额外下载复杂 App。家长通过微信直接登录家长看板，每日自动生成签到印章、答题正确率、录音评分及薄弱词汇雷达图，学习动态一目了然。'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#1E293B', fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif' }}>
      
      {/* 🧭 1. 顶部极简导航栏 */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#58CC02', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#FFF', boxShadow: '0 4px 10px rgba(88,204,2,0.3)' }}>
              🦉
            </div>
            <div>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#2C3E50', letterSpacing: '-0.5px' }}>FlipVoca</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#58CC02', marginLeft: '6px', background: '#E5F8D0', padding: '2px 8px', borderRadius: '8px' }}>中国版 🇨🇳</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: '#DCFCE7',
              color: '#15803D',
              border: '1px solid #86EFAC',
              padding: '6px 14px',
              borderRadius: '12px',
              fontWeight: '900',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🎁 全功能 100% 免费开放
            </span>
            <Link href="/" style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569', textDecoration: 'none', padding: '8px 10px' }}>
              🇰🇷 한국어
            </Link>
            <Link href="/" style={{ background: '#58CC02', color: 'white', padding: '9px 18px', borderRadius: '12px', fontWeight: '900', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 0 #46A302' }}>
              🚀 免费进入学习 ➔
            </Link>
          </div>
        </div>
      </header>

      {/* 🌟 2. Hero 头部主视觉区 */}
      <section style={{ padding: '60px 20px 80px 20px', textAlign: 'center', background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: '900', marginBottom: '20px' }}>
            🎁 5,000 核心词库全部 100% 免费开放 · 无需付费 · 微信/手机一键即学！
          </div>

          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#0F172A', lineHeight: 1.25, margin: '0 0 20px 0', letterSpacing: '-1px' }}>
            告别死记硬背！用 <span style={{ color: '#58CC02' }}>3D卡片</span> 与 <span style={{ color: '#3B82F6' }}>4阶闯关</span><br />
            轻松掌握 5,000 核心英语词汇
          </h1>

          <p style={{ fontSize: '18px', color: '#475569', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto 36px auto' }}>
            100% 配备高清原创图解、真人原声音频与 AI 智能发音评分。新课标小学到高中高考冲刺，所有核心功能全部免费提供。
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/" style={{ background: '#58CC02', color: 'white', padding: '16px 36px', borderRadius: '16px', fontWeight: '900', fontSize: '18px', textDecoration: 'none', boxShadow: '0 6px 0 #46A302' }}>
              ⚡ 微信/手机号 一键免费畅学 ➔
            </Link>
            <button
              onClick={() => { setSelectedRole('academy'); setShowAuthModal(true); }}
              style={{ background: '#FFFFFF', color: '#334155', border: '2px solid #CBD5E1', padding: '16px 28px', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 0 #CBD5E1' }}
            >
              🏫 机构/教师 免费开通试卷后台
            </button>
          </div>
        </div>
      </section>

      {/* 🎮 3. 互动式实时 Demo 体验区 */}
      <section style={{ padding: '60px 20px', maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '1px' }}>LIVE DEMO</span>
          <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#0F172A', marginTop: '6px' }}>
            🕹️ 在线体验：3D双面单词卡与发音评测
          </h2>
          <p style={{ color: '#64748B', fontSize: '15px' }}>点击卡片翻转查看释义与原比例双语例句，试听多倍速原声音频</p>
        </div>

        {/* 演示控制面板 */}
        <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '32px', border: '2px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          {/* 切换单词 Tab */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {demoWords.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { setDemoWordIndex(idx); setIsDemoFlipped(false); setDemoQuizSelected(null); setDemoQuizIsCorrect(null); }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '900',
                  border: demoWordIndex === idx ? '2px solid #58CC02' : '2px solid #E2E8F0',
                  background: demoWordIndex === idx ? '#E5F8D0' : '#FFFFFF',
                  color: demoWordIndex === idx ? '#46A302' : '#64748B',
                  cursor: 'pointer'
                }}
              >
                {item.category}: <strong>{item.word}</strong>
              </button>
            ))}
          </div>

          {/* 3D 翻转卡片 */}
          <div
            onClick={() => setIsDemoFlipped(!isDemoFlipped)}
            style={{
              maxWidth: '560px',
              minHeight: '260px',
              margin: '0 auto 24px auto',
              background: isDemoFlipped ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)' : '#FFFFFF',
              border: isDemoFlipped ? '3px solid #3B82F6' : '3px solid #E2E8F0',
              borderRadius: '24px',
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: isDemoFlipped ? '0 10px 0 #2563EB' : '0 10px 0 #E2E8F0',
              transition: 'all 0.25s ease'
            }}
          >
            {!isDemoFlipped ? (
              <div>
                <span style={{ background: '#E5F8D0', color: '#46A302', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '900' }}>
                  {currentDemoWord.category}
                </span>
                <h3 style={{ fontSize: '38px', fontWeight: '900', color: '#1E293B', margin: '14px 0 4px 0' }}>
                  {currentDemoWord.word}
                </h3>
                <p style={{ fontSize: '17px', fontWeight: 'bold', color: '#3B82F6', margin: '0 0 16px 0' }}>
                  {currentDemoWord.phonics}
                </p>
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#EF4444', marginBottom: '16px' }}>
                  {currentDemoWord.meaning}
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 'bold' }}>
                  👆 点击卡片翻转查看地道双语例句
                </p>
              </div>
            ) : (
              <div>
                <span style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '900' }}>
                  📖 精选地道双语例句
                </span>
                <p style={{ fontSize: '19px', fontWeight: '900', color: '#1E293B', margin: '20px 0 8px 0', lineHeight: 1.4 }}>
                  "{currentDemoWord.exampleEn}"
                </p>
                <p style={{ fontSize: '15px', color: '#475569', fontWeight: 'bold', margin: '0 0 20px 0' }}>
                  {currentDemoWord.exampleZh}
                </p>
                <p style={{ fontSize: '12px', color: '#3B82F6', fontWeight: 'bold' }}>
                  👆 再次点击卡片翻回正面
                </p>
              </div>
            )}
          </div>

          {/* 发音播放控制条 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={(e) => { e.stopPropagation(); playWordAudio(currentDemoWord.word); }}
              style={{ background: '#3B82F6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '900', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 0 #1D4ED8' }}
            >
              🔊 播放原声音频
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[0.75, 1.0, 1.25].map((speed) => (
                <button
                  key={speed}
                  onClick={(e) => { e.stopPropagation(); setDemoAudioSpeed(speed); playWordAudio(currentDemoWord.word, speed); }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '900',
                    border: demoAudioSpeed === speed ? '2px solid #3B82F6' : '1px solid #CBD5E1',
                    background: demoAudioSpeed === speed ? '#EFF6FF' : '#FFFFFF',
                    color: demoAudioSpeed === speed ? '#1D4ED8' : '#64748B',
                    cursor: 'pointer'
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 4. 4大核心系统功能特色 */}
      <section style={{ padding: '60px 20px 80px 20px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A' }}>
              🎯 为提分而生的 4 大硬核学习模块
            </h2>
            <p style={{ color: '#64748B', fontSize: '16px', marginTop: '6px' }}>
              从输入到输出，层层递进锁定长期记忆
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            
            {/* Feature 1 */}
            <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '28px', border: '2px solid #E2E8F0' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🎴</div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>
                1. 5,000 原创插画图解
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
                每一枚单词均配齐 100% 高清插画、IPA音标、双语实用例句与 6 国语言释义，建立牢固的大脑图像记忆网络。
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '28px', border: '2px solid #E2E8F0' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🎙️</div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>
                2. AI 发音声波图比对
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
                录制学生发音并在 HTML5 Canvas 画布中实时绘制声波音高曲线，与纯正外教原声精准比对，练就纯正美音。
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '28px', border: '2px solid #E2E8F0' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>🧩</div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>
                3. 4阶渐进式互动闯关
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
                1阶听音选词 ➔ 2阶拼写选择 ➔ 3阶发音评测 75分通关 ➔ 4阶键盘打字拼写，趣味闯关彻底攻克遗忘曲线。
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '28px', border: '2px solid #E2E8F0' }}>
              <div style={{ fontSize: '36px', marginBottom: '14px' }}>📄</div>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '8px' }}>
                4. 一键导出 6 种 A4 练习卷
              </h3>
              <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
                教师后台 1 秒自动生成单选、中英互译、错题专练、口袋3折词表等 6 款标准 A4 试卷，支持无缝高清打印。
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ❓ 5. 常见问题解答 FAQ */}
      <section style={{ padding: '60px 20px 80px 20px', maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#0F172A' }}>
            💬 常见问题与答疑
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setOpenFaqIndex(openFaqIndex === idx ? -1 : idx)}
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '20px 24px',
                border: '2px solid #E2E8F0',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1E293B' }}>
                  {faq.q}
                </h4>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#94A3B8' }}>
                  {openFaqIndex === idx ? '▲' : '▼'}
                </span>
              </div>
              {openFaqIndex === idx && (
                <p style={{ margin: '14px 0 0 0', fontSize: '14px', color: '#475569', lineHeight: 1.6, borderTop: '1px dashed #E2E8F0', paddingTop: '12px' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 🚀 6. 底部行动号召 CTA */}
      <section style={{ padding: '60px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '34px', fontWeight: '900', margin: '0 0 16px 0' }}>
            现在开启智能高效的词汇学习之旅
          </h2>
          <p style={{ fontSize: '16px', color: '#94A3B8', marginBottom: '32px' }}>
            无需下载安装，支持微信扫码与手机号直接进入，立即免费体验 5,000 核心单词包
          </p>
          <Link href="/" style={{ background: '#58CC02', color: 'white', padding: '16px 40px', borderRadius: '16px', fontWeight: '900', fontSize: '18px', textDecoration: 'none', boxShadow: '0 6px 0 #46A302', display: 'inline-block' }}>
            🚀 免费进入体验 ➔
          </Link>
        </div>
      </section>

      {/* 📝 7. 机构/家长预约试用弹窗 */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', padding: '32px 28px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#1E293B', fontSize: '20px', fontWeight: '900' }}>
                🏫 英语培训机构 / 教师专属入驻
              </h3>
              <button onClick={() => setShowAuthModal(false)} style={{ background: '#F1F5F9', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                  🏫 机构/学校名称 *
                </label>
                <input
                  type="text"
                  placeholder="例如: 卓越英语培训中心"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #CBD5E1', fontSize: '14px', fontWeight: 'bold' }}
                  required
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                  👤 负责人/教师姓名 *
                </label>
                <input
                  type="text"
                  placeholder="例如: 张老师 / 李校长"
                  value={directorName}
                  onChange={(e) => setDirectorName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #CBD5E1', fontSize: '14px', fontWeight: 'bold' }}
                  required
                />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
                  📞 联系手机号码 *
                </label>
                <input
                  type="tel"
                  placeholder="例如: 138-0000-0000"
                  value={academyPhone}
                  onChange={(e) => setAcademyPhone(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #CBD5E1', fontSize: '14px', fontWeight: 'bold' }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', background: '#58CC02', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 0 #46A302', marginTop: '8px' }}
              >
                提交申请并开通机构权限 ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 📄 8. Footer 页脚 */}
      <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '30px 20px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
        <p style={{ margin: '0 0 6px 0' }}>
          © 2026 <strong>FlipVoca (翻翻背单词)</strong>. All rights reserved. (https://flipvoca.com)
        </p>
        <p style={{ margin: 0 }}>
          小学 · 初中 · 高中 5,000 核心英语词汇智能评测平台 (支持微信与手机号极速体验)
        </p>
      </footer>

      {/* 💳 微信/支付宝 VIP 支付弹窗 */}
      <ChinaPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        currentLang="zh"
        onPaymentSuccess={(data) => {
          alert(`🎉 恭喜！您已成功开通 【${data.planName}】！`);
        }}
      />
    </div>
  );
}
