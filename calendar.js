/* ===================================================
   🎈 초등학생 일일 학습 달력 & 출석 도장 로직 (calendar.js)
   =================================================== */

// 1. 출석 기록 데이터 (학생별 독립 출석 키 사용)
function getAttendanceKey() {
    return (typeof getUserAttendanceKey === 'function') ? getUserAttendanceKey() : 'english_attendance_dates';
}

let attendanceDates = JSON.parse(localStorage.getItem(getAttendanceKey())) || [];

// 2. HTML 엘리먼트 가져오기
const calendarGrid = document.getElementById('calendar-grid');
const calendarMonthTitle = document.getElementById('calendar-month-title');
const btnCompleteStamp = document.getElementById('btn-complete-stamp');

// 오늘 날짜 구하기 (YYYY-MM-DD)
function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 3. 달력 그리드 렌더링 함수
function renderCalendar() {
    if (!calendarGrid) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0~11

    if (calendarMonthTitle) {
        calendarMonthTitle.textContent = `${year}년 ${month + 1}월`;
    }

    // 해당 월의 첫 번째 날과 마지막 날 계산
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0(일)~6(토)
    const totalDays = new Date(year, month + 1, 0).getDate();

    calendarGrid.innerHTML = '';
    calendarGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        margin-top: 12px;
        text-align: center;
    `;

    // 요일 헤더 생성 (일 월 화 수 목 금 토)
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    weekDays.forEach((dayName, idx) => {
        const headerCell = document.createElement('div');
        headerCell.style.cssText = `
            font-weight: bold;
            font-size: 13px;
            padding: 6px 0;
            color: ${idx === 0 ? '#E74C3C' : idx === 6 ? '#3498DB' : '#2C3E50'};
        `;
        headerCell.textContent = dayName;
        calendarGrid.appendChild(headerCell);
    });

    // 첫째 날 이전 빈 날짜 칸 생성
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        calendarGrid.appendChild(emptyCell);
    }

    // 1일부터 마지막 날까지 칸 생성
    const todayStr = getTodayString();

    for (let day = 1; day <= totalDays; day++) {
        const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isAttended = attendanceDates.includes(dayStr);
        const isToday = (dayStr === todayStr);

        const dayCell = document.createElement('div');
        dayCell.style.cssText = `
            background: ${isToday ? '#FFF9E6' : '#FFFFFF'};
            border: ${isToday ? '2px solid #F1C40F' : '1px solid #E9ECEF'};
            border-radius: 12px;
            padding: 8px 4px;
            min-height: 54px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            position: relative;
        `;

        dayCell.innerHTML = `
            <span style="font-size: 12px; font-weight: bold; color: ${isToday ? '#D35400' : '#7F8C8D'};">${day}</span>
            ${isAttended ? '<span style="font-size: 22px; line-height: 1;">💮</span>' : ''}
        `;

        calendarGrid.appendChild(dayCell);
    }
}

// 4. 오늘 학습 완료 도장 찍기 이벤트
if (btnCompleteStamp) {
    btnCompleteStamp.addEventListener('click', () => {
        const todayStr = getTodayString();
        
        if (!attendanceDates.includes(todayStr)) {
            attendanceDates.push(todayStr);
            localStorage.setItem(getAttendanceKey(), JSON.stringify(attendanceDates));
            alert('🎉 참잘했어요! 오늘의 출석 도장이 쾅 찍혔습니다! 💮');
        } else {
            alert('😊 이미 오늘 출석 도장을 찍었어요! 아주 참 잘했어요!');
        }

        renderCalendar();

        // 출석 달력 탭으로 자동 이동
        const calendarTabBtn = document.querySelector('.tab-btn[data-tab="calendar-tab"]');
        if (calendarTabBtn) {
            calendarTabBtn.click();
        }
    });
}

// 5. 초기 렌더링
document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
});
