'use client';

import { useState } from 'react';

export default function AchievementBadgesModal({ isOpen, onClose, stats = {}, currentLang = 'ko' }) {
  if (!isOpen) return null;

  const learned = stats.learnedCount || 0;
  const attendance = stats.attendanceCount || 0;
  const quizDone = stats.quizCompletedCount || 0;

  // 🏅 칭호 뱃지 정의 목록 (달성 여부 판정)
  const badges = [
    {
      id: 'first_step',
      icon: '🌱',
      title: currentLang === 'zh' ? '初露锋芒' : (currentLang === 'fr' ? 'Premier Pas' : '첫 걸음 새싹'),
      desc: currentLang === 'zh' ? '完成第1次单词学习' : (currentLang === 'fr' ? '1er mot appris' : '단어 학습 1개 이상 완수'),
      unlocked: learned >= 1,
      progress: Math.min(100, (learned / 1) * 100),
      current: `${Math.min(1, learned)} / 1`
    },
    {
      id: 'streak_3',
      icon: '🔥',
      title: currentLang === 'zh' ? '连续3天打卡' : (currentLang === 'fr' ? 'Streak 3 Jours' : '3일 연속 출석 왕'),
      desc: currentLang === 'zh' ? '累计出勤印章达到3天' : (currentLang === 'fr' ? '3 jours de présence' : '출석도장 3일 달성'),
      unlocked: attendance >= 3,
      progress: Math.min(100, Math.round((attendance / 3) * 100)),
      current: `${Math.min(3, attendance)} / 3일`
    },
    {
      id: 'streak_7',
      icon: '⚡',
      title: currentLang === 'zh' ? '周全勤王' : (currentLang === 'fr' ? 'Semaine Parfaite' : '7일 주간 완벽출석'),
      desc: currentLang === 'zh' ? '出勤印章达到7天' : (currentLang === 'fr' ? '7 jours consécutifs' : '출석도장 7일 달성'),
      unlocked: attendance >= 7,
      progress: Math.min(100, Math.round((attendance / 7) * 100)),
      current: `${Math.min(7, attendance)} / 7일`
    },
    {
      id: 'voca_50',
      icon: '🌿',
      title: currentLang === 'zh' ? '单词探险家' : (currentLang === 'fr' ? 'Explorateur 50' : '단어 탐험가 (50단어)'),
      desc: currentLang === 'zh' ? '掌握50个英语单词' : (currentLang === 'fr' ? '50 mots maîtrisés' : '완벽 외운 단어 50개 돌파'),
      unlocked: learned >= 50,
      progress: Math.min(100, Math.round((learned / 50) * 100)),
      current: `${Math.min(50, learned)} / 50개`
    },
    {
      id: 'voca_100',
      icon: '⭐',
      title: currentLang === 'zh' ? '百词斩达人' : (currentLang === 'fr' ? 'Maître des 100' : '단어 마스터 100'),
      desc: currentLang === 'zh' ? '累计掌握100个单词' : (currentLang === 'fr' ? '100 mots maîtrisés' : '완벽 외운 단어 100개 돌파'),
      unlocked: learned >= 100,
      progress: Math.min(100, Math.round((learned / 100) * 100)),
      current: `${Math.min(100, learned)} / 100개`
    },
    {
      id: 'voca_300',
      icon: '🏆',
      title: currentLang === 'zh' ? '英语大学士' : (currentLang === 'fr' ? 'Grand Maître 300' : '영단어 대장님 (300단어)'),
      desc: currentLang === 'zh' ? '累计掌握300个单词' : (currentLang === 'fr' ? '300 mots maîtrisés' : '완벽 외운 단어 300개 돌파'),
      unlocked: learned >= 300,
      progress: Math.min(100, Math.round((learned / 300) * 100)),
      current: `${Math.min(300, learned)} / 300개`
    },
    {
      id: 'quiz_master',
      icon: '🎯',
      title: currentLang === 'zh' ? '测验神枪手' : (currentLang === 'fr' ? 'Sniper du Quiz' : '퀴즈 정복자'),
      desc: currentLang === 'zh' ? '完成10次以上퀴즈' : (currentLang === 'fr' ? '10 quiz complétés' : '퀴즈 완수 10회 이상 달성'),
      unlocked: quizDone >= 10,
      progress: Math.min(100, Math.round((quizDone / 10) * 100)),
      current: `${Math.min(10, quizDone)} / 10회`
    },
    {
      id: 'day6_gold',
      icon: '🏵️',
      title: currentLang === 'zh' ? '周金牌王印' : (currentLang === 'fr' ? 'Grand Tampon Doré' : '주간 복습 골드 왕도장'),
      desc: currentLang === 'zh' ? 'Day 6 주간 총복습 완수' : (currentLang === 'fr' ? 'Day 6 Révision complétée' : 'Day 6 주간 총복습 퀴즈 완수'),
      unlocked: attendance >= 6,
      progress: Math.min(100, Math.round((attendance / 6) * 100)),
      current: `${Math.min(6, attendance)} / 6일`
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
      >
        {/* 모달 상단 헤더 */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #FEF9E7 0%, #FDEBD0 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🎖️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900', color: '#78350F' }}>
                {currentLang === 'zh' ? '荣誉称号与成就勋章' : (currentLang === 'fr' ? 'Badges & Récompenses' : '학습 성장 칭호 & 동기부여 보상 뱃지')}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#92400E', fontWeight: 'bold' }}>
                {currentLang === 'zh'
                  ? `已解锁 ${unlockedCount} / ${badges.length} 个勋章`
                  : (currentLang === 'fr'
                  ? `${unlockedCount} / ${badges.length} badges débloqués`
                  : `총 ${badges.length}개 중 ${unlockedCount}개 뱃지 획득 완료!`)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #FCD34D',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 'bold',
              color: '#78350F',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* 뱃지 그리드 영역 */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '12px'
        }}>
          {badges.map((b) => (
            <div
              key={b.id}
              style={{
                background: b.unlocked ? '#FFFFFF' : '#F8FAFC',
                borderRadius: '18px',
                padding: '16px',
                border: b.unlocked ? '2px solid #F59E0B' : '1.5px dashed #CBD5E1',
                boxShadow: b.unlocked ? '0 6px 16px rgba(245, 158, 11, 0.15)' : 'none',
                opacity: b.unlocked ? 1 : 0.7,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              {b.unlocked && (
                <span style={{
                  position: 'absolute',
                  top: '10px',
                  right: '12px',
                  fontSize: '11px',
                  fontWeight: '900',
                  color: '#D97706',
                  background: '#FEF3C7',
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  획득 완료 ✓
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: b.unlocked ? '#FEF3C7' : '#E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  filter: b.unlocked ? 'none' : 'grayscale(100%)',
                  flexShrink: 0
                }}>
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: b.unlocked ? '#1E293B' : '#64748B' }}>
                    {b.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', lineHeight: 1.3 }}>
                    {b.desc}
                  </div>
                </div>
              </div>

              {/* 진도율 게이지 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#64748B', marginBottom: '4px' }}>
                  <span>달성도</span>
                  <span>{b.current} ({b.progress}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${b.progress}%`,
                    height: '100%',
                    background: b.unlocked ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)' : '#94A3B8',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 모달 하단 닫기 */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'flex-end',
          background: '#F8FAFC'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              fontWeight: '900',
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(217, 119, 6, 0.25)'
            }}
          >
            확인 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
