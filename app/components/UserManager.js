'use client';

import { useState, useEffect } from 'react';

const ADMIN_PIN = '1234';

export default function UserManager({ currentUser, setCurrentUser }) {
    const [studentList, setStudentList] = useState([]);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [inputPin, setInputPin] = useState('');
    const [adminInputPin, setAdminInputPin] = useState('');
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
    const [pinError, setPinError] = useState('');

    // 신규 학생 등록 폼 상태
    const [newStudentName, setNewStudentName] = useState('');
    const [newStudentGrade, setNewStudentGrade] = useState('3학년');
    const [newStudentPin, setNewStudentPin] = useState('1111');
    const [newStudentCount, setNewStudentCount] = useState(10);

    useEffect(() => {
        const stored = localStorage.getItem('english_student_list');
        let list = [];
        if (stored) {
            try { list = JSON.parse(stored); } catch (e) { list = []; }
        }
        if (!list || list.length === 0) {
            list = [
                { id: 'student_1', name: '김민수', grade: '3학년', pin: '1111', dailyWordCount: 10 },
                { id: 'student_2', name: '이지우', grade: '5학년', pin: '2222', dailyWordCount: 20 }
            ];
            localStorage.setItem('english_student_list', JSON.stringify(list));
        }
        setStudentList(list);

        const current = localStorage.getItem('english_current_user');
        if (current) {
            try {
                const user = JSON.parse(current);
                setCurrentUser(user);
            } catch (e) {}
        } else if (list.length > 0) {
            setCurrentUser(list[0]);
            localStorage.setItem('english_current_user', JSON.stringify(list[0]));
        }
    }, [setCurrentUser]);

    const saveStudents = (newList) => {
        setStudentList(newList);
        localStorage.setItem('english_student_list', JSON.stringify(newList));
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setInputPin('');
        setPinError('');
    };

    const handleLoginSubmit = () => {
        if (!selectedStudent) return;
        if (inputPin === selectedStudent.pin) {
            setCurrentUser(selectedStudent);
            localStorage.setItem('english_current_user', JSON.stringify(selectedStudent));
            setShowLoginModal(false);
            setSelectedStudent(null);
            setInputPin('');
            setPinError('');
        } else {
            setPinError('비밀번호(PIN)가 틀렸습니다.');
        }
    };

    const handleAdminAuth = () => {
        if (adminInputPin === ADMIN_PIN) {
            setIsAdminAuthenticated(true);
            setPinError('');
        } else {
            setPinError('관리자 비밀번호(1234)가 틀렸습니다.');
        }
    };

    const handleAddStudent = (e) => {
        e.preventDefault();
        if (!newStudentName.trim()) return;
        const newStudent = {
            id: `student_${Date.now()}`,
            name: newStudentName.trim(),
            grade: newStudentGrade,
            pin: newStudentPin || '1111',
            dailyWordCount: parseInt(newStudentCount) || 10
        };
        const updated = [...studentList, newStudent];
        saveStudents(updated);
        setNewStudentName('');
        alert(`${newStudent.name} 학생이 등록되었습니다!`);
    };

    const handleDeleteStudent = (id) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            const updated = studentList.filter(s => s.id !== id);
            saveStudents(updated);
            if (currentUser && currentUser.id === id) {
                const nextUser = updated[0] || null;
                setCurrentUser(nextUser);
                if (nextUser) {
                    localStorage.setItem('english_current_user', JSON.stringify(nextUser));
                } else {
                    localStorage.removeItem('english_current_user');
                }
            }
        }
    };

    return (
        <div style={{ width: '100%' }}>
            {/* 상단 학생 헤더 바 */}
            <div className="user-header-bar">
                {currentUser ? (
                    <div className="user-info-row">
                        <div>
                            <span className="user-label">현재 학생:</span>
                            <strong className="user-name">👤 {currentUser.name} ({currentUser.grade})</strong>
                            <span className="user-target-badge">목표: 하루 {currentUser.dailyWordCount || 10}단어</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-user-switch" onClick={() => setShowLoginModal(true)}>학생 변경</button>
                            <button className="btn-admin" onClick={() => { setShowAdminModal(true); setIsAdminAuthenticated(false); setAdminInputPin(''); setPinError(''); }}>🔒 관리자</button>
                        </div>
                    </div>
                ) : (
                    <div className="user-no-login">
                        <span>📢 로그인된 학생이 없습니다.</span>
                        <button className="btn-user-switch" onClick={() => setShowLoginModal(true)}>학생 로그인하기</button>
                    </div>
                )}
            </div>

            {/* 학생 선택 모달 */}
            {showLoginModal && (
                <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>👤 학생 선택 및 로그인</h2>
                            <button className="btn-close" onClick={() => setShowLoginModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {!selectedStudent ? (
                                <div className="student-grid">
                                    {studentList.map(s => (
                                        <div key={s.id} className="student-card" onClick={() => handleSelectStudent(s)}>
                                            <div className="student-avatar">🎓</div>
                                            <h3>{s.name}</h3>
                                            <p>{s.grade}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="pin-form">
                                    <h3>{selectedStudent.name} ({selectedStudent.grade})</h3>
                                    <p style={{ fontSize: '13px', color: '#7F8C8D' }}>비밀번호 4자리를 입력하세요</p>
                                    <input
                                        type="password"
                                        maxLength="4"
                                        placeholder="PIN 번호 (예: 1111)"
                                        value={inputPin}
                                        onChange={e => setInputPin(e.target.value)}
                                        className="pin-input"
                                    />
                                    {pinError && <p className="error-text">{pinError}</p>}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                        <button className="btn-secondary" onClick={() => setSelectedStudent(null)}>뒤로</button>
                                        <button className="btn-primary" onClick={handleLoginSubmit}>확인</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 관리자 셋팅 모달 */}
            {showAdminModal && (
                <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🔒 관리자 설정 (부모님/선생님용)</h2>
                            <button className="btn-close" onClick={() => setShowAdminModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {!isAdminAuthenticated ? (
                                <div className="pin-form">
                                    <p>관리자 비밀번호를 입력하세요 (기본: 1234)</p>
                                    <input
                                        type="password"
                                        maxLength="4"
                                        placeholder="1234"
                                        value={adminInputPin}
                                        onChange={e => setAdminInputPin(e.target.value)}
                                        className="pin-input"
                                    />
                                    {pinError && <p className="error-text">{pinError}</p>}
                                    <button className="btn-primary" style={{ marginTop: '10px' }} onClick={handleAdminAuth}>인증</button>
                                </div>
                            ) : (
                                <div>
                                    <h3 style={{ marginBottom: '10px' }}>➕ 신규 학생 추가</h3>
                                    <form onSubmit={handleAddStudent} className="admin-form">
                                        <input
                                            type="text"
                                            placeholder="학생 이름 (예: 홍길동)"
                                            value={newStudentName}
                                            onChange={e => setNewStudentName(e.target.value)}
                                            required
                                        />
                                        <select value={newStudentGrade} onChange={e => setNewStudentGrade(e.target.value)}>
                                            <option value="1학년">1학년</option>
                                            <option value="2학년">2학년</option>
                                            <option value="3학년">3학년</option>
                                            <option value="4학년">4학년</option>
                                            <option value="5학년">5학년</option>
                                            <option value="6학년">6학년</option>
                                        </select>
                                        <input
                                            type="password"
                                            maxLength="4"
                                            placeholder="PIN (기본: 1111)"
                                            value={newStudentPin}
                                            onChange={e => setNewStudentPin(e.target.value)}
                                        />
                                        <select value={newStudentCount} onChange={e => setNewStudentCount(e.target.value)}>
                                            <option value="5">하루 5단어</option>
                                            <option value="10">하루 10단어</option>
                                            <option value="20">하루 20단어</option>
                                            <option value="30">하루 30단어</option>
                                        </select>
                                        <button type="submit" className="btn-primary">학생 추가</button>
                                    </form>

                                    <h3 style={{ margin: '20px 0 10px' }}>📋 등록된 학생 목록</h3>
                                    <ul className="student-manage-list">
                                        {studentList.map(s => (
                                            <li key={s.id}>
                                                <span><strong>{s.name}</strong> ({s.grade}) - 하루 {s.dailyWordCount}단어 [PIN: {s.pin}]</span>
                                                <button className="btn-delete" onClick={() => handleDeleteStudent(s.id)}>삭제</button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
