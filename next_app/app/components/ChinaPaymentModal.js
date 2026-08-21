'use client';

import { useState, useEffect } from 'react';

export default function ChinaPaymentModal({ isOpen, onClose, onPaymentSuccess, currentLang = 'zh', user }) {
  const [selectedPlan, setSelectedPlan] = useState('annual'); // 'monthly' | 'quarterly' | 'annual' | 'academy'
  const [paymentMethod, setPaymentMethod] = useState('wechat'); // 'wechat' | 'alipay'
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'qr' | 'success'

  if (!isOpen) return null;

  const plans = [
    {
      id: 'monthly',
      nameZh: '月度畅学卡',
      nameKo: '월간 무제한 멤버십',
      price: '39',
      originalPrice: '49',
      periodZh: '/月',
      periodKo: '/월',
      tagZh: '入门体验',
      tagKo: '체험용',
      descZh: '5,000 核心词汇无限学 + AI发音评测 + 每日签到'
    },
    {
      id: 'quarterly',
      nameZh: '季度提分卡',
      nameKo: '분기(3개월) 패키지',
      price: '99',
      originalPrice: '147',
      periodZh: '/3个月',
      periodKo: '/3개월',
      tagZh: '立省 33%',
      tagKo: '33% 할인',
      descZh: '全词库畅学 + 4阶闯关 + 错题漏斗 + A4试卷导出'
    },
    {
      id: 'annual',
      nameZh: '年度 VIP 尊享卡',
      nameKo: '연간 VIP 프리미엄 (추천)',
      price: '299',
      originalPrice: '468',
      periodZh: '/年',
      periodKo: '/년',
      tagZh: '🔥 85% 用户首选',
      tagKo: '🔥 베스트 추천',
      isPopular: true,
      descZh: '全年无限制 + 微信每日学习报告 + 6种PDF试卷无上限打印 + 专属客服'
    },
    {
      id: 'academy',
      nameZh: '机构/学校 50人商用包',
      nameKo: '학원/공부방 50인 B2B 패키지',
      price: '1999',
      originalPrice: '3000',
      periodZh: '/年',
      periodKo: '/년',
      tagZh: 'B2B 机构专享',
      tagKo: '학원/선생님 전용',
      descZh: '50个学员管理账号 + 教师一键布置作业 + 机构专属题库与排版'
    }
  ];

  const currentPlanObj = plans.find(p => p.id === selectedPlan) || plans[2];

  // 결제 진행 (QR 코드 화면으로 전환)
  const handleProceedPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('qr');
    }, 600);
  };

  // QR 코드 스캔 후 결제 완료 시뮬레이션
  const handleCompletePaymentSimulation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentStep('success');
      if (onPaymentSuccess) {
        onPaymentSuccess({
          planId: currentPlanObj.id,
          planName: currentPlanObj.nameZh,
          amount: currentPlanObj.price,
          method: paymentMethod,
          paidAt: new Date().toISOString()
        });
      }
    }, 1000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        padding: '32px 28px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#F1F5F9',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✖
        </button>

        {/* 1단계: 플랜 및 결제수단 선택 */}
        {paymentStep === 'select' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '36px', marginBottom: '4px' }}>💎</div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '900', color: '#0F172A' }}>
                {currentLang === 'zh' ? '升级 Steve Voca VIP 会员' : 'Steve Voca VIP 멤버십 구독'}
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>
                {currentLang === 'zh' ? '开通完整 5,000 词汇库、AI发音深度分析与试卷导出' : '5,000개 전 단어 무제한 학습 및 PDF 시험지 생성기'}
              </p>
            </div>

            {/* 플랜 선택 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      border: isSelected ? '2px solid #07C160' : '2px solid #E2E8F0',
                      background: isSelected ? '#F0FDF4' : '#FFFFFF',
                      borderRadius: '16px',
                      padding: '16px 14px',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(7,193,96,0.15)' : 'none'
                    }}
                  >
                    {plan.tagZh && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '10px',
                        background: plan.isPopular ? '#EF4444' : '#07C160',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '900',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}>
                        {currentLang === 'zh' ? plan.tagZh : plan.tagKo}
                      </span>
                    )}
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '900', color: '#1E293B' }}>
                      {currentLang === 'zh' ? plan.nameZh : plan.nameKo}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A' }}>¥</span>
                      <span style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A' }}>{plan.price}</span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>{currentLang === 'zh' ? plan.periodZh : plan.periodKo}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748B', lineHeight: 1.3 }}>
                      {currentLang === 'zh' ? plan.descZh : plan.nameKo}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 결제 수단 선택 (微信支付 vs 支付宝) */}
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '900', color: '#334155', marginBottom: '8px' }}>
                💳 {currentLang === 'zh' ? '选择支付方式' : '결제 수단 선택'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('wechat')}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    border: paymentMethod === 'wechat' ? '2px solid #07C160' : '2px solid #E2E8F0',
                    background: paymentMethod === 'wechat' ? '#F0FDF4' : '#FFFFFF',
                    color: paymentMethod === 'wechat' ? '#07C160' : '#475569',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>💚</span> 微信支付 (WeChat)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('alipay')}
                  style={{
                    padding: '12px',
                    borderRadius: '14px',
                    border: paymentMethod === 'alipay' ? '2px solid #1677FF' : '2px solid #E2E8F0',
                    background: paymentMethod === 'alipay' ? '#EFF6FF' : '#FFFFFF',
                    color: paymentMethod === 'alipay' ? '#1677FF' : '#475569',
                    fontWeight: '900',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>💙</span> 支付宝 (Alipay)
                </button>
              </div>
            </div>

            {/* 결제 버튼 */}
            <button
              onClick={handleProceedPayment}
              disabled={isProcessing}
              style={{
                width: '100%',
                background: paymentMethod === 'wechat' ? '#07C160' : '#1677FF',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: paymentMethod === 'wechat' ? '0 6px 16px rgba(7,193,96,0.3)' : '0 6px 16px rgba(22,119,255,0.3)'
              }}
            >
              {isProcessing ? '正在生成支付订单...' : `立即支付 ¥${currentPlanObj.price} ➔`}
            </button>
          </div>
        )}

        {/* 2단계: QR 코드 스캔 결제 창 */}
        {paymentStep === 'qr' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: paymentMethod === 'wechat' ? '#E8F8F0' : '#E6F4FF', color: paymentMethod === 'wechat' ? '#07C160' : '#1677FF', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '900', marginBottom: '14px' }}>
              {paymentMethod === 'wechat' ? '💚 微信扫码安全支付' : '💙 支付宝扫码支付'}
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>
              应付金额：<span style={{ color: '#EF4444', fontSize: '26px' }}>¥{currentPlanObj.price}</span>
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748B' }}>
              已选择套餐：【{currentPlanObj.nameZh}】
            </p>

            {/* 결제 QR 코드 UI */}
            <div style={{
              background: '#F8FAFC',
              border: `3px solid ${paymentMethod === 'wechat' ? '#07C160' : '#1677FF'}`,
              borderRadius: '20px',
              padding: '24px',
              display: 'inline-block',
              margin: '0 auto 16px auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
            }}>
              <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="180" height="180" fill="white" rx="8"/>
                {/* QR Finder patterns */}
                <rect x="15" y="15" width="45" height="45" fill="#0F172A"/>
                <rect x="23" y="23" width="29" height="29" fill="white"/>
                <rect x="30" y="30" width="15" height="15" fill={paymentMethod === 'wechat' ? '#07C160' : '#1677FF'}/>

                <rect x="120" y="15" width="45" height="45" fill="#0F172A"/>
                <rect x="128" y="23" width="29" height="29" fill="white"/>
                <rect x="135" y="30" width="15" height="15" fill={paymentMethod === 'wechat' ? '#07C160' : '#1677FF'}/>

                <rect x="15" y="120" width="45" height="45" fill="#0F172A"/>
                <rect x="23" y="128" width="29" height="29" fill="white"/>
                <rect x="30" y="135" width="15" height="15" fill={paymentMethod === 'wechat' ? '#07C160' : '#1677FF'}/>

                {/* Simulated QR dots */}
                <circle cx="90" cy="90" r="18" fill={paymentMethod === 'wechat' ? '#07C160' : '#1677FF'}/>
                <text x="90" y="95" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                  {paymentMethod === 'wechat' ? '微信' : '支'}
                </text>
              </svg>
            </div>

            <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: '#475569', fontWeight: 'bold' }}>
              📱 打开手机【{paymentMethod === 'wechat' ? '微信' : '支付宝'}】扫一扫完成支付
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setPaymentStep('select')}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}
              >
                ← 返回重选
              </button>
              <button
                type="button"
                onClick={handleCompletePaymentSimulation}
                disabled={isProcessing}
                style={{
                  flex: 2,
                  background: '#58CC02',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontWeight: '900',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #46A302'
                }}
              >
                {isProcessing ? '正在确认支付结果...' : '✅ 模拟扫码支付成功 ➔'}
              </button>
            </div>
          </div>
        )}

        {/* 3단계: 결제 성공 안내 */}
        {paymentStep === 'success' && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '900', color: '#07C160' }}>
              支付成功！VIP 权益已生效
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px 0' }}>
              恭喜！您已成功开通 <strong>【{currentPlanObj.nameZh}】</strong>！<br />
              所有 5,000 核心词库、AI 智能发音评测与试卷打印权限已全部解锁。
            </p>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                background: '#58CC02',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '16px',
                fontWeight: '900',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 0 #46A302'
              }}
            >
              🚀 立即开始 VIP 畅学 ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
