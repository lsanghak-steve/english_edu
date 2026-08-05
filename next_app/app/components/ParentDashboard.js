'use client';

import { useState, useEffect } from 'react';
import supabase from '../../lib/supabaseClient.js';

// 이름에서 이모지 제거 헬퍼 함수
const removeEmoji = (str) => {
  if (!str) return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}]/gu, '')
    .trim();
};

export default function ParentDashboard({ currentUser }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [stampedDates, setStampedDates] = useState([]);
  const [wrongCount, setWrongCount] = useState(0);

  // Supabase 클라우드 DB에서 학부모 이름 또는 전체 자녀(이승현, 이수민 등) 로드
  useEffect(() => {
    async function loadCloudChildren() {
      setLoading(true);
      const curParentName = currentUser ? removeEmoji(currentUser.parentName) : '';

      try {
        let query = supabase.from('student_profiles').select('*');

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const formatted = data.map(s => ({
            id: s.id,
            name: removeEmoji(s.name),
            grade: s.grade || '초등 3학년',
            dailyWordCount: s.daily_word_count || '10',
            studentPin: s.student_pin || '1234',
            parentName: removeEmoji(s.parent_name),
            parentPhone: s.parent_phone || '',
            parentPin: s.parent_pin || '5678'
          }));

          // 학부모 이름으로 필터링, 없다면 전체 혹은 currentUser 포함
          let matched = [];
          if (curParentName) {
            matched = formatted.filter(u => u.parentName === curParentName);
          }

          if (matched.length === 0) {
            // 이승현, 이수민 또는 전체 학생을 자녀 목록으로 로드
            matched = formatted;
          }

          setChildrenList(matched);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log('Cloud child load error', e);
      }

      // LocalStorage 백업 로드
      try {
        const savedUsers = JSON.parse(localStorage.getItem('english_edu_users') || '[]');
        if (savedUsers.length > 0) {
          const formatted = savedUsers.map(u => ({ ...u, name: removeEmoji(u.name), parentName: removeEmoji(u.parentName) }));
          setChildrenList(formatted);
        } else if (currentUser) {
          setChildrenList([currentUser]);
        }
      } catch (e) {
        if (currentUser) setChildrenList([currentUser]);
      }
      setLoading(false);
    }

    loadCloudChildren();
  }, [currentUser]);

  const activeChild = childrenList[selectedChildIndex] || currentUser || { name: '학생', dailyWordCount: '10' };
  const studentName = removeEmoji(activeChild.name);
  const parentName = removeEmoji(activeChild.parentName) || '학부모';

  // 활성화된 자녀의 출석도장 및 오답노트 데이터를 Supabase 클라우드 DB에서 실시간 쿼리 로드
  useEffect(() => {
    if (!activeChild || !activeChild.id) return;
    const childId = activeChild.id;

    async function fetchChildDataFromCloud() {
      // 1. Supabase 출석 도장 쿼리
      try {
        const { data: attData } = await supabase
          .from('student_attendance')
          .select('stamped_date')
          .eq('user_id', childId);

        if (attData && attData.length > 0) {
          const dates = attData.map(a => a.stamped_date);
          setStampedDates(dates);
        } else {
          // LocalStorage 백업
          const savedStamps = JSON.parse(localStorage.getItem(`english_stamps_${childId}`) || '[]');
          setStampedDates(savedStamps);
        }
      } catch (e) {
        const savedStamps = JSON.parse(localStorage.getItem(`english_stamps_${childId}`) || '[]');
        setStampedDates(savedStamps);
      }

      // 2. Supabase 오답노트 쿼리
      try {
        const { data: wrongData } = await supabase
          .from('student_wrong_answers')
          .select('id')
          .eq('user_id', childId);

        if (wrongData) {
          setWrongCount(wrongData.length);
        } else {
          const savedWrong = JSON.parse(localStorage.getItem(`wrong_answers_${childId}`) || '[]');
          setWrongCount(savedWrong.length);
        }
      } catch (e) {
        const savedWrong = JSON.parse(localStorage.getItem(`wrong_answers_${childId}`) || '[]');
        setWrongCount(savedWrong.length);
      }
    }

    fetchChildDataFromCloud();
  }, [activeChild]);

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '24px', padding: '24px', border: '1px solid #E9ECEF', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}>
      {/* 상단 학부모 정보 및 자녀 선택 탭 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px dashed #E9ECEF', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#8E44AD', fontSize: '20px' }}>
            📊 학부모 자녀 학습 성취도 리포트 ☁️
          </h3>
          <span style={{ fontSize: '13px', color: '#27AE60', fontWeight: 'bold' }}>
            👨‍👩‍👧‍👦 등록된 자녀 총 {childrenList.length}명 실시간 연동
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#8E44AD', fontWeight: 'bold' }}>
          ☁️ 클라우드 DB에서 자녀(이승현, 이수민 등) 학습 데이터를 로드하는 중...
        </div>
      ) : (
        <>
          {/* 👨‍👩‍👧‍👦 다자녀 선택 탭 스위처 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', background: '#F5EEF8', padding: '12px', borderRadius: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#8E44AD' }}>👤 조회할 자녀 선택:</span>
            {childrenList.map((child, idx) => (
              <button
                key={child.id || idx}
                onClick={() => setSelectedChildIndex(idx)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: selectedChildIndex === idx ? '2px solid #8E44AD' : '1px solid #BDC3C7',
                  background: selectedChildIndex === idx ? '#8E44AD' : '#FFFFFF',
                  color: selectedChildIndex === idx ? '#FFFFFF' : '#2C3E50',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: selectedChildIndex === idx ? '0 4px 10px rgba(142,68,173,0.2)' : 'none'
                }}
              >
                {removeEmoji(child.name)} ({child.grade || '초등 3학년'})
              </button>
            ))}
          </div>

          {/* 활성화된 자녀 통계 요약 카드 세트 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: '#E8F8F5', padding: '16px', borderRadius: '16px', border: '1px solid #A3E4D7', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#16A085', fontWeight: 'bold' }}>💮 누적 출석도장</span>
              <h2 style={{ margin: '6px 0 0 0', color: '#117864', fontSize: '26px' }}>{stampedDates.length}회</h2>
            </div>

            <div style={{ background: '#FEF9E7', padding: '16px', borderRadius: '16px', border: '1px solid #F9E79F', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#D4AC0D', fontWeight: 'bold' }}>🎯 하루 목표 단어수</span>
              <h2 style={{ margin: '6px 0 0 0', color: '#7D6608', fontSize: '26px' }}>하루 {activeChild?.dailyWordCount || 10}개</h2>
            </div>

            <div style={{ background: '#FADBD8', padding: '16px', borderRadius: '16px', border: '1px solid #F5B7B1', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#C0392B', fontWeight: 'bold' }}>❌ 오답노트 잔여</span>
              <h2 style={{ margin: '6px 0 0 0', color: '#78281F', fontSize: '26px' }}>{wrongCount}개</h2>
            </div>
          </div>

          <div style={{ background: '#F8F9FA', padding: '16px', borderRadius: '16px', border: '1px solid #E9ECEF' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#2C3E50', fontSize: '15px' }}>
              💌 [{studentName}] 자녀를 위한 따뜻한 피드백 코멘트
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#7F8C8D', lineHeight: 1.6 }}>
              {stampedDates.length >= 1
                ? `👍 ${studentName} 학생은 꾸준히 학습에 참여하여 출석 도장 ${stampedDates.length}회를 기록 중입니다!`
                : `✏️ ${studentName} 학생이 매일 영단어 플래시카드 퀴즈를 풀 수 있도록 가정에서도 따뜻한 응원 부탁드립니다!`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
