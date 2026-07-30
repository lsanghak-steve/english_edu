'use client';

import { useState, useEffect, useCallback } from 'react';

export default function CalendarSection({ currentUser }) {
    const [attendanceDates, setAttendanceDates] = useState([]);
    const [isStampedToday, setIsStampedToday] = useState(false);

    const getAttendanceKey = useCallback(() => {
        return currentUser ? `english_attendance_dates_${currentUser.id}` : 'english_attendance_dates';
    }, [currentUser]);

    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        const key = getAttendanceKey();
        const stored = localStorage.getItem(key);
        let dates = [];
        if (stored) {
            try { dates = JSON.parse(stored); } catch (e) { dates = []; }
        }
        setAttendanceDates(dates);
        const todayStr = getTodayString();
        setIsStampedToday(dates.includes(todayStr));
    }, [currentUser, getAttendanceKey]);

    const handleStampToday = () => {
        const todayStr = getTodayString();
        if (attendanceDates.includes(todayStr)) return;

        const updated = [...attendanceDates, todayStr];
        setAttendanceDates(updated);
        localStorage.setItem(getAttendanceKey(), JSON.stringify(updated));
        setIsStampedToday(true);
        alert('💮 오늘 학습 출석 도장이 성공적으로 찍혔습니다!');
    };

    // 달력 날짜 렌더링 준비
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0~11
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const todayStr = getTodayString();

    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
        <div className="calendar-card">
            <div className="calendar-header">
                <h2>📅 {year}년 {month + 1}월 학습 출석부</h2>
                <p className="calendar-subtitle">
                    {currentUser ? `🎓 ${currentUser.name} 학생의 공부 도장` : '오늘의 출석 도장을 찍어보세요!'}
                </p>
            </div>

            <div className="stamp-action-box">
                <button
                    className={`btn-stamp ${isStampedToday ? 'stamped' : ''}`}
                    disabled={isStampedToday}
                    onClick={handleStampToday}
                >
                    {isStampedToday ? '💮 오늘 학습 완료! (출석 완료)' : '💮 오늘 단어 학습 완료! 도장 찍기'}
                </button>
            </div>

            <div className="calendar-grid">
                {weekDays.map((dayName, idx) => (
                    <div
                        key={idx}
                        className="calendar-week-header"
                        style={{ color: idx === 0 ? '#E74C3C' : idx === 6 ? '#3498DB' : '#2C3E50' }}
                    >
                        {dayName}
                    </div>
                ))}

                {/* 빈 날짜 칸 */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="calendar-empty-cell" />
                ))}

                {/* 실제 일 수 칸 */}
                {Array.from({ length: totalDays }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isAttended = attendanceDates.includes(dayStr);
                    const isTodayCell = dayStr === todayStr;

                    return (
                        <div
                            key={dayNum}
                            className={`calendar-day-cell ${isTodayCell ? 'today' : ''}`}
                        >
                            <span className="day-number">{dayNum}</span>
                            {isAttended && <span className="stamp-mark">💮</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
