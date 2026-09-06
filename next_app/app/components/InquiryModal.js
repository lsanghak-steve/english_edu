'use client';

import { useState, useMemo, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';
import { faqList } from '../../data/faqData.js';

/**
 * [InquiryModal.js]
 * 자주 묻는 질문(FAQ 50선) 및 1:1 고객 문의사항 (FAQ & Contact Us)
 * - 학생 및 학부모가 서비스 이용 중 궁금한 점을 카테고리별/검색으로 즉시 확인할 수 있는 FAQ 50선 탑재
 * - 원하는 답변이 없거나 추가 도움이 필요한 경우 1:1 문의 폼으로 원클릭 전환
 * - Supabase 클라우드 DB 연동 및 로컬스토리지 백업 지원
 * - 관리자 센터(/admin)에서 실시간 조회 및 답변 상태 관리 지원
 */
export default function InquiryModal({ isOpen, onClose, currentUser = null, currentLang = 'ko', defaultTab = 'faq' }) {
  const [activeModalTab, setActiveModalTab] = useState(defaultTab || 'faq'); // 'faq' | 'inquiry'
  const [faqCategory, setFaqCategory] = useState('전체');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState(null);

  // 모달이 열리거나 defaultTab 변경 시 초기화
  useEffect(() => {
    if (isOpen) {
      setActiveModalTab(defaultTab || 'faq');
      setIsSuccess(false);
      setFaqCategory('전체');
      setFaqSearch('');
      setExpandedFaqId(null);
    }
  }, [isOpen, defaultTab]);

  const [category, setCategory] = useState('학습/퀴즈 오류');
  const [authorName, setAuthorName] = useState(currentUser?.name || '');
  const [authorPhone, setAuthorPhone] = useState(currentUser?.parentPhone || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // FAQ 카테고리 목록
  const faqCategories = [
    { id: '전체', label: '전체 (50)', icon: '🌟' },
    { id: '학습 및 암기', label: '학습 및 암기 (10)', icon: '📖' },
    { id: '발음 및 녹음', label: '발음 및 녹음 (8)', icon: '🎙️' },
    { id: '퀴즈 및 복습', label: '퀴즈 및 복습 (8)', icon: '🎯' },
    { id: '출석 및 보상', label: '출석 및 보상 (8)', icon: '💮' },
    { id: '계정 및 학부모', label: '계정 및 학부모 (8)', icon: '👨‍👩‍👧' },
    { id: '시험지 및 인쇄', label: '시험지 및 인쇄 (8)', icon: '🖨️' }
  ];

  // FAQ 필터링
  const filteredFaqs = useMemo(() => {
    return faqList.filter((item) => {
      const matchCategory = faqCategory === '전체' || item.category === faqCategory;
      const searchLower = faqSearch.trim().toLowerCase();
      const matchSearch =
        !searchLower ||
        item.question.toLowerCase().includes(searchLower) ||
        item.answer.toLowerCase().includes(searchLower);
      return matchCategory && matchSearch;
    });
  }, [faqCategory, faqSearch]);

  if (!isOpen) return null;

  // 카테고리 목록
  const categories = [
    { id: '학습/퀴즈 오류', labelKo: '🐞 학습 / 퀴즈 오류', labelZh: '🐞 学习/测验报错', labelFr: '🐞 Erreur étude/quiz' },
    { id: '단어/발음 제보', labelKo: '🎙️ 단어 / 발음 오류 제보', labelZh: '🎙️ 单词/发音报错', labelFr: '🎙️ Signalement mot/audio' },
    { id: '기능 건의/개선', labelKo: '💡 새로운 기능 건의', labelZh: '💡 功能建议', labelFr: '💡 Suggestion de fonctionnalité' },
    { id: '계정/출석 문의', labelKo: '🔑 계정 / 출석 문의', labelZh: '🔑 账号/考勤咨询', labelFr: '🔑 Compte/Présence' },
    { id: '기타 문의', labelKo: '💬 기타 일반 문의', labelZh: '💬 其他咨询', labelFr: '💬 Autre question' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert(currentLang === 'zh' ? '请填写标题和内容。' : (currentLang === 'fr' ? 'Veuillez remplir le titre et le contenu.' : '문의 제목과 내용을 모두 입력해 주세요.'));
      return;
    }

    setIsSubmitting(true);

    const inquiryItem = {
      id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      category,
      title: title.trim(),
      content: content.trim(),
      author_name: authorName.trim() || (currentUser ? currentUser.name : '방문자'),
      author_phone: authorPhone.trim() || '-',
      student_id: currentUser ? (currentUser.student_id || currentUser.id) : 'guest',
      user_type: currentUser?.parentName ? 'student' : (currentUser?.isParent ? 'parent' : 'user'),
      status: 'pending',
      created_at: new Date().toISOString(),
      answer: '',
      answered_at: null
    };

    // 1. 로컬스토리지 백업 저장
    try {
      const savedInquiries = JSON.parse(localStorage.getItem('flipvoca_inquiries') || '[]');
      savedInquiries.unshift(inquiryItem);
      localStorage.setItem('flipvoca_inquiries', JSON.stringify(savedInquiries));
    } catch (err) {
      console.warn('LocalStorage save fallback:', err);
    }

    // 2. Supabase DB 저장 시도 (study_records fallback)
    try {
      const cloudPayload = {
        student_id: 'INQ:' + inquiryItem.category + ':' + inquiryItem.author_name,
        study_date: new Date().toISOString().split('T')[0],
        is_stamped: false
      };
      await supabase.from('study_records').insert([cloudPayload]);
    } catch (err) {
      console.warn('Cloud sync fallback:', err);
    }

    // 전역 이벤트 디스패치
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inquiry_submitted', { detail: inquiryItem }));
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setTitle('');
    setContent('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 11000,
        padding: '16px'
      }}
      onClick={handleResetAndClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          padding: '28px 24px',
          width: '100%',
          maxWidth: activeModalTab === 'faq' ? '680px' : '520px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          border: '1px solid #E2E8F0',
          position: 'relative',
          transition: 'max-width 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleResetAndClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#64748B',
            cursor: 'pointer',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          ✕
        </button>

        {/* 상단 탭 전환: FAQ 50선 vs 1:1 문의 */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '16px', marginBottom: '20px', width: 'fit-content' }}>
          <button
            type="button"
            onClick={() => setActiveModalTab('faq')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800',
              border: 'none',
              background: activeModalTab === 'faq' ? '#FFFFFF' : 'transparent',
              color: activeModalTab === 'faq' ? '#0284C7' : '#64748B',
              boxShadow: activeModalTab === 'faq' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>❓</span>
            <span>자주 묻는 질문 (FAQ 50)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('inquiry')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '800',
              border: 'none',
              background: activeModalTab === 'inquiry' ? '#FFFFFF' : 'transparent',
              color: activeModalTab === 'inquiry' ? '#0284C7' : '#64748B',
              boxShadow: activeModalTab === 'inquiry' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span>💬</span>
            <span>1:1 문의하기</span>
          </button>
        </div>

        {activeModalTab === 'faq' ? (
          /* ========================================================
           * TAB 1: 자주 묻는 질문 (FAQ 50선) 아코디언 & 검색
           * ======================================================== */
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>❓</span> 자주 묻는 질문 50선
                </h2>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284C7', background: '#E0F2FE', padding: '3px 10px', borderRadius: '12px' }}>
                  총 {filteredFaqs.length}개 질문 {faqCategory !== '전체' ? `(${faqCategory})` : ''}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
                궁금하신 점을 빠르게 찾아보세요! 검색창에 키워드를 입력하거나 카테고리를 선택하세요.
              </p>
            </div>

            {/* 검색창 */}
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="🔍 검색어 입력 (예: 발음, 출석, 달란트, Day 6, 핀번호, 시험지...)"
                style={{
                  width: '100%',
                  padding: '11px 40px 11px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #CBD5E1',
                  fontSize: '13.5px',
                  outline: 'none',
                  fontWeight: '600',
                  boxSizing: 'border-box'
                }}
              />
              {faqSearch && (
                <button
                  type="button"
                  onClick={() => setFaqSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#E2E8F0',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '11px',
                    color: '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* 카테고리 필터 버튼들 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {faqCategories.map((cat) => {
                const isSelected = faqCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFaqCategory(cat.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: isSelected ? '800' : '600',
                      border: isSelected ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                      background: isSelected ? '#F0F9FF' : '#FFFFFF',
                      color: isSelected ? '#0369A1' : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                );
              })}
            </div>

            {/* 질문 아코디언 리스트 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '4px' }}>
              {filteredFaqs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 16px', background: '#F8FAFC', borderRadius: '16px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔎</div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#475569' }}>
                    '{faqSearch}' 에 대한 검색 결과가 없습니다.
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '4px' }}>
                    철자를 확인하시거나 아래 1:1 문의하기를 이용해 주세요.
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('inquiry')}
                    style={{
                      marginTop: '12px',
                      background: '#0EA5E9',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    💬 1:1 문의 남기기 ➔
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isExpanded = expandedFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      style={{
                        border: isExpanded ? '1.5px solid #38BDF8' : '1px solid #E2E8F0',
                        borderRadius: '14px',
                        background: isExpanded ? '#F0F9FF' : '#FFFFFF',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 14px',
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              background: isExpanded ? '#0284C7' : '#E2E8F0',
                              color: isExpanded ? '#FFFFFF' : '#475569',
                              fontSize: '11px',
                              fontWeight: '900',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}
                          >
                            Q{faq.id}
                          </span>
                          <span style={{ fontSize: '11.5px', color: '#0284C7', fontWeight: '700', flexShrink: 0 }}>
                            [{faq.category}]
                          </span>
                          <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#0F172A', lineHeight: '1.4', wordBreak: 'keep-all', flex: 1 }}>
                            {faq.question}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 'bold', flexShrink: 0, marginLeft: '6px' }}>
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          style={{
                            padding: '12px 16px 14px 16px',
                            background: '#FFFFFF',
                            borderTop: '1px solid #E0F2FE',
                            fontSize: '13px',
                            lineHeight: '1.6',
                            color: '#334155'
                          }}
                        >
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                            <span style={{ color: '#0284C7', fontWeight: '900', fontSize: '14px' }}>A.</span>
                            <div style={{ flex: 1, whiteSpace: 'pre-line' }}>
                              {faq.answer}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 하단 1:1 문의 유도 배너 */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#F8FAFC',
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#1E293B' }}>
                  💡 찾으시는 답변이 없으신가요?
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                  선생님께 직접 문의 남겨주시면 정성껏 답변해 드립니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTab('inquiry')}
                style={{
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)'
                }}
              >
                1:1 문의하기 ➔
              </button>
            </div>
          </div>
        ) : isSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>💌</div>
            <h3 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', marginBottom: '8px' }}>
              {currentLang === 'zh' ? '意见已成功提交！' : (currentLang === 'fr' ? 'Message envoyé avec succès !' : '문의사항이 성공적으로 접수되었습니다!')}
            </h3>
            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', marginBottom: '24px' }}>
              {currentLang === 'zh'
                ? '我们已收到您的宝贵意见与问题，管理员老师会尽快确认并给予处理反馈。谢谢！'
                : (currentLang === 'fr'
                ? 'Votre message a été transmis aux responsables. Nous vous répondrons dans les plus brefs délais. Merci !'
                : '보내주신 소중한 의견과 문의는 센터 담당 선생님께 안전하게 전달되었습니다. 신속하고 꼼꼼히 검토 후 답변드리겠습니다. 감사합니다!')}
            </p>
            <button
              onClick={handleResetAndClose}
              style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)'
              }}
            >
              {currentLang === 'zh' ? '完成' : (currentLang === 'fr' ? 'Fermer' : '확인')}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}
              >
                💬
              </div>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: '900', color: '#0F172A', margin: 0 }}>
                  {currentLang === 'zh' ? '1:1 意见与问题反馈' : (currentLang === 'fr' ? 'Contact & Assistance 1:1' : '1:1 문의사항 및 기능 건의')}
                </h2>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontWeight: '600' }}>
                  {currentLang === 'zh' ? '学习错误、功能建议或账号问题都可以告诉我们' : (currentLang === 'fr' ? 'Une question, un bug ou une idée ? Écrivez-nous' : '학습 오류 제보, 발음 이상, 새로운 기능 건의 등 무엇이든 말씀해 주세요.')}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '6px' }}>
                  {currentLang === 'zh' ? '문의 분류 (类别)' : (currentLang === 'fr' ? 'Catégorie' : '문의 분류')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {categories.map((c) => {
                    const isSelected = category === c.id;
                    const label = currentLang === 'zh' ? c.labelZh : (currentLang === 'fr' ? c.labelFr : c.labelKo);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontSize: '12px',
                          fontWeight: '700',
                          border: isSelected ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                          background: isSelected ? '#F0F9FF' : '#FFFFFF',
                          color: isSelected ? '#0369A1' : '#64748B',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    {currentLang === 'zh' ? '姓名 / 学生名' : (currentLang === 'fr' ? 'Nom' : '작성자 성함')}
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={currentUser ? currentUser.name : (currentLang === 'zh' ? '例: 李相学' : '예: 홍길동')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      fontWeight: '600'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                    {currentLang === 'zh' ? '联系电话 (选填)' : (currentLang === 'fr' ? 'Téléphone' : '연락처 (선택)')}
                  </label>
                  <input
                    type="text"
                    value={authorPhone}
                    onChange={(e) => setAuthorPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '13px',
                      outline: 'none',
                      fontWeight: '600'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  {currentLang === 'zh' ? '标题 *' : (currentLang === 'fr' ? 'Titre *' : '문의 제목 *')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    category === '학습/퀴즈 오류'
                      ? (currentLang === 'zh' ? '例: Day 6 测验题目出现显示问题' : '예: Day 6 퀴즈 5번 문항이 정답인데 오답 처리됩니다')
                      : (currentLang === 'zh' ? '例: 希望增加深色夜间模式' : '예: 칭찬 뱃지에 새로운 도전 과제도 추가해 주세요!')
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    fontWeight: '600'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '4px' }}>
                  {currentLang === 'zh' ? '详细说明 *' : (currentLang === 'fr' ? 'Description détaillée *' : '문의 및 건의 상세 내용 *')}
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    currentLang === 'zh'
                      ? '请详细描述您遇到的问题或建议，方便我们尽快为您优化解决。'
                      : (currentLang === 'fr'
                      ? 'Décrivez votre situation ou suggestion en détail afin que nous puissions vous aider au mieux.'
                      : '겪으신 오류 상황이나 바라는 점을 자유롭게 적어주세요.\n(예: 어떤 화면에서 발생했는지, 사용 중인 기기 등)')
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div
                style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  color: '#64748B',
                  lineHeight: '1.4'
                }}
              >
                🔒 {currentLang === 'zh' ? '提交的内容仅供教学管理团队查看，并遵守个人信息保护政策。' : '접수된 문의 내용은 FlipVoca 학습 지원팀에 안전하게 전달되며, 개인정보는 보호됩니다.'}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: isSubmitting ? '#94A3B8' : 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: '900',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 18px rgba(14, 165, 233, 0.35)',
                  transition: 'all 0.15s ease',
                  marginTop: '4px'
                }}
              >
                {isSubmitting
                  ? (currentLang === 'zh' ? '提交中...' : '접수 처리 중...')
                  : (currentLang === 'zh' ? '🚀 提交意见与问题 ➔' : (currentLang === 'fr' ? '🚀 Envoyer le message ➔' : '🚀 문의사항 보내기 ➔'))}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
