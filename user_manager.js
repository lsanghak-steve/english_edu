/* ===================================================
   🎈 다중 학습자 관리 & 보안 로그인 시스템 (user_manager.js)
   =================================================== */

// 1. 초기 데이터 구조
const ADMIN_PIN = '1234'; // 관리자 기본 비밀번호 (부모님/선생님용)
let studentList = JSON.parse(localStorage.getItem('english_student_list')) || [
    { id: 'student_1', name: '김민수', grade: '3학년', pin: '1111' },
    { id: 'student_2', name: '이지우', grade: '5학년', pin: '2222' }
];

let currentUser = JSON.parse(localStorage.getItem('english_current_user')) || null;

// 2. LocalStorage 데이터 보관
function saveStudentsToStorage() {
    localStorage.setItem('english_student_list', JSON.stringify(studentList));
}

function saveCurrentUserToStorage(userObj) {
    currentUser = userObj;
    if (userObj) {
        localStorage.setItem('english_current_user', JSON.stringify(userObj));
    } else {
        localStorage.removeItem('english_current_user');
    }
}

// 3. 학생별 키 생성 유틸리티 (독립 저장용)
function getUserWrongWordsKey() {
    return currentUser ? `english_wrong_words_${currentUser.id}` : 'english_wrong_words';
}

function getUserAttendanceKey() {
    return currentUser ? `english_attendance_dates_${currentUser.id}` : 'english_attendance_dates';
}

// 4. 로그인 팝업 및 관리자 모드 처리
function initUserManagerUI() {
    const userHeaderBar = document.getElementById('user-header-bar');
    if (!userHeaderBar) return;

    renderUserHeader();
}

// 헤더 표시 (로그인한 학생 정보 및 학생 변경/관리자 버튼)
function renderUserHeader() {
    const userHeaderBar = document.getElementById('user-header-bar');
    if (!userHeaderBar) return;

    if (currentUser) {
        userHeaderBar.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF9E6; border: 2px solid #FFE66D; border-radius: 16px; padding: 10px 16px; margin-bottom: 16px;">
                <div>
                    <span style="font-size: 14px; color: #7F8C8D;">현재 학생:</span>
                    <strong style="font-size: 16px; color: #D35400; margin-left: 6px;">👤 ${currentUser.name} (${currentUser.grade})</strong>
                </div>
                <div>
                    <button id="btn-switch-user" style="background: #4ECDC4; color: white; border: none; padding: 6px 12px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 12px; margin-right: 6px;">학생 변경</button>
                    <button id="btn-admin-mode" style="background: #2C3E50; color: white; border: none; padding: 6px 12px; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 12px;">🔒 관리자</button>
                </div>
            </div>
        `;

        document.getElementById('btn-switch-user').addEventListener('click', showLoginModal);
        document.getElementById('btn-admin-mode').addEventListener('click', showAdminModal);
    } else {
        userHeaderBar.innerHTML = `
            <div style="text-align: center; background: #FFEAA7; padding: 12px; border-radius: 16px; margin-bottom: 16px;">
                <span>📢 로그인된 학생이 없습니다.</span>
                <button id="btn-open-login" style="background: #FF7675; color: white; border: none; padding: 6px 14px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-left: 10px;">학생 로그인하기</button>
            </div>
        `;
        document.getElementById('btn-open-login').addEventListener('click', showLoginModal);
    }
}

// 5. 학생 로그인 모달 창 띄우기
function showLoginModal() {
    let modal = document.getElementById('user-login-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'user-login-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
            z-index: 1000;
        `;
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); text-align: center;">
            <h2 style="color: #FF6B6B; margin-bottom: 8px;">🎒 누구 공부 시간인가요?</h2>
            <p style="font-size: 13px; color: #7F8C8D; margin-bottom: 16px;">본인의 이름과 비밀번호(4자리)를 입력해 주세요.</p>
            
            <div style="margin-bottom: 12px; text-align: left;">
                <label style="font-size: 13px; font-weight: bold; color: #2C3E50;">학생 선택:</label>
                <select id="login-student-select" style="width: 100%; padding: 12px; margin-top: 4px; border: 2px solid #E9ECEF; border-radius: 12px; font-size: 15px; font-weight: bold;">
                    ${studentList.map(s => `<option value="${s.id}">${s.name} (${s.grade})</option>`).join('')}
                </select>
            </div>

            <div style="margin-bottom: 20px; text-align: left;">
                <label style="font-size: 13px; font-weight: bold; color: #2C3E50;">비밀번호 (PIN):</label>
                <input type="password" id="login-student-pin" placeholder="비밀번호 4자리" maxlength="4" style="width: 100%; padding: 12px; margin-top: 4px; border: 2px solid #E9ECEF; border-radius: 12px; font-size: 15px; text-align: center; letter-spacing: 4px;">
            </div>

            <div style="display: flex; gap: 8px;">
                <button id="btn-login-submit" style="flex: 1; padding: 14px; background: #FF6B6B; color: white; border: none; border-radius: 16px; font-weight: bold; font-size: 15px; cursor: pointer;">🔑 로그인하기</button>
            </div>
            
            <button id="btn-login-admin-link" style="background: none; border: none; color: #95A5A6; text-decoration: underline; margin-top: 16px; cursor: pointer; font-size: 12px;">선생님/부모님 관리자 로그인</button>
        </div>
    `;

    document.getElementById('btn-login-submit').addEventListener('click', processStudentLogin);
    document.getElementById('btn-login-admin-link').addEventListener('click', () => {
        modal.style.display = 'none';
        showAdminModal();
    });
}

// 학생 로그인 제출 처리
function processStudentLogin() {
    const selectedId = document.getElementById('login-student-select').value;
    const inputPin = document.getElementById('login-student-pin').value;

    const targetStudent = studentList.find(s => s.id === selectedId);

    if (targetStudent && targetStudent.pin === inputPin) {
        saveCurrentUserToStorage(targetStudent);
        document.getElementById('user-login-modal').style.display = 'none';
        alert(`🎉 ${targetStudent.name} 학생, 반갑습니다! 오늘의 영어 공부를 시작해 봅시다!`);
        
        // 페이지 새로고침하여 사용자별 오답노트 & 출석달력 갱신 적용
        location.reload();
    } else {
        alert('❌ 비밀번호(PIN)가 틀렸습니다. 본인 비밀번호를 다시 확인해 주세요!');
    }
}

// 6. 관리자 모드 모달 (학생 등록 및 비밀번호 관리)
function showAdminModal() {
    const inputAdminPin = prompt('🔒 관리자 비밀번호를 입력하세요 (기본 비밀번호: 1234):');
    if (inputAdminPin !== ADMIN_PIN) {
        alert('❌ 관리자 비밀번호가 올바르지 않습니다.');
        return;
    }

    let modal = document.getElementById('admin-manage-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-manage-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
            z-index: 1001;
        `;
        document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    renderAdminUI(modal);
}

function renderAdminUI(modal) {
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 24px; width: 90%; max-width: 460px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <h2 style="color: #2C3E50; margin-bottom: 8px; text-align: center;">⚙️ 관리자 모드 (학생 관리)</h2>
            <p style="font-size: 13px; color: #7F8C8D; margin-bottom: 16px; text-align: center;">학생을 등록하고 비밀번호를 안전하게 설정해 주세요.</p>
            
            <!-- 학생 등록 폼 -->
            <div style="background: #F8F9FA; padding: 16px; border-radius: 16px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 10px; color: #4ECDC4;">➕ 새 학생 추가 등록</h4>
                <input type="text" id="add-student-name" placeholder="학생 이름 (예: 홍길동)" style="width: 100%; padding: 10px; margin-bottom: 8px; border: 1px solid #DFE6E9; border-radius: 10px;">
                <select id="add-student-grade" style="width: 100%; padding: 10px; margin-bottom: 8px; border: 1px solid #DFE6E9; border-radius: 10px;">
                    <option value="3학년">초등 3학년</option>
                    <option value="4학년">초등 4학년</option>
                    <option value="5학년">초등 5학년</option>
                    <option value="6학년">초등 6학년</option>
                    <option value="기초입문">기초 입문반</option>
                </select>
                <input type="text" id="add-student-pin" placeholder="비밀번호 4자리 (예: 1234)" maxlength="4" style="width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #DFE6E9; border-radius: 10px;">
                <button id="btn-add-student-submit" style="width: 100%; padding: 10px; background: #4ECDC4; color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer;">학생 추가하기</button>
            </div>

            <!-- 등록된 학생 목록 -->
            <h4 style="margin-bottom: 10px; color: #2C3E50;">📋 현재 등록된 학생 목록</h4>
            <div id="admin-student-list" style="margin-bottom: 20px;">
                ${studentList.map((s, idx) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #FFF; border: 1px solid #E9ECEF; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px;">
                        <div>
                            <strong>${s.name}</strong> (${s.grade})
                            <span style="font-size: 12px; color: #95A5A6; margin-left: 6px;">암호: ${s.pin}</span>
                        </div>
                        <button class="delete-student-btn" data-id="${s.id}" style="background: #FF7675; color: white; border: none; padding: 4px 10px; border-radius: 8px; font-size: 12px; cursor: pointer;">삭제</button>
                    </div>
                `).join('')}
            </div>

            <button id="btn-close-admin-modal" style="width: 100%; padding: 12px; background: #7F8C8D; color: white; border: none; border-radius: 14px; font-weight: bold; cursor: pointer;">닫기</button>
        </div>
    `;

    // 새 학생 추가 이벤트
    document.getElementById('btn-add-student-submit').addEventListener('click', () => {
        const name = document.getElementById('add-student-name').value.trim();
        const grade = document.getElementById('add-student-grade').value;
        const pin = document.getElementById('add-student-pin').value.trim();

        if (!name || !pin || pin.length < 4) {
            alert('학생 이름과 4자리 비밀번호(PIN)를 올바르게 입력해 주세요!');
            return;
        }

        const newId = `student_${Date.now()}`;
        studentList.push({ id: newId, name, grade, pin });
        saveStudentsToStorage();
        alert(`✅ '${name}' 학생이 새로 추가 등록되었습니다!`);
        renderAdminUI(modal);
    });

    // 학생 삭제 이벤트
    const delBtns = modal.querySelectorAll('.delete-student-btn');
    delBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const deleteId = e.target.getAttribute('data-id');
            if (confirm('이 학생을 삭제하시겠습니까? (학습 기록이 함께 제거됩니다)')) {
                studentList = studentList.filter(s => s.id !== deleteId);
                saveStudentsToStorage();
                if (currentUser && currentUser.id === deleteId) {
                    saveCurrentUserToStorage(null);
                }
                renderAdminUI(modal);
            }
        });
    });

    document.getElementById('btn-close-admin-modal').addEventListener('click', () => {
        modal.style.display = 'none';
        renderUserHeader();
    });
}

// 7. 초기화 및 자동 로그인 체크
document.addEventListener('DOMContentLoaded', () => {
    saveStudentsToStorage();
    initUserManagerUI();

    // 로그인된 사용자가 없으면 자동으로 로그인 팝업 띄우기
    if (!currentUser) {
        showLoginModal();
    }
});
