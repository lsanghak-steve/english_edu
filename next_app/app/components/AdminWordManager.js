'use client';

import { useState, useEffect, useCallback } from 'react';
import supabase from '../../lib/supabaseClient.js';
import fallbackWords from '../../data/wordsData.js';
import { playUniversalAudio } from '../../lib/audioPlayer.js';

export default function AdminWordManager() {
    const [words, setWords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');
    const [selectedGrade, setSelectedGrade] = useState('전체');

    // 신규 단어 추가 폼 상태
    const [showAddForm, setShowAddForm] = useState(false);
    const [newWord, setNewWord] = useState('');
    const [newMeaning, setNewMeaning] = useState('');
    const [newPhonics, setNewPhonics] = useState('');
    const [newCategory, setNewCategory] = useState('과일 & 음식 🍎');
    const [newGradeLevel, setNewGradeLevel] = useState('초등단어');
    const [newExampleEn, setNewExampleEn] = useState('');
    const [newExampleKo, setNewExampleKo] = useState('');

    // 인라인 수정 상태
    const [editingWordId, setEditingWordId] = useState(null);
    const [editForm, setEditForm] = useState({
        word: '',
        meaning: '',
        phonics: '',
        category: '',
        grade_level: '초등단어',
        example_en: '',
        example_ko: ''
    });

    // Web Speech / Server TTS 원어민 소리 재생 (단어/예문 공용)
    const playTTS = useCallback((textToPlay) => {
        if (!textToPlay) return;
        playUniversalAudio(textToPlay, { rate: 0.85, lang: 'en' });
    }, []);

    // Supabase DB에서 서버 1,000개 수량 제한을 완벽 우회하여 2,000개+ 전체 단어 페이징 로드
    const fetchWords = useCallback(async () => {
        try {
            let allData = [];
            let from = 0;
            const step = 1000;

            while (true) {
                const { data, error } = await supabase
                    .from('words')
                    .select('*')
                    .order('id', { ascending: true })
                    .range(from, from + step - 1);

                if (error || !data || data.length === 0) break;
                allData = allData.concat(data);
                if (data.length < step) break;
                from += step;
            }

            if (allData.length > 0) {
                setWords(allData);
            } else {
                setWords(fallbackWords.map((w, idx) => ({ id: idx + 1, ...w, example_en: w.exampleEn, example_ko: w.exampleKo })));
            }
        } catch (e) {
            setWords(fallbackWords.map((w, idx) => ({ id: idx + 1, ...w, example_en: w.exampleEn, example_ko: w.exampleKo })));
        }
    }, []);

    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // 카테고리 목록
    const categories = ['전체', ...new Set(words.map(w => w.category || '기타'))];

    // 초등 / 중등 / 고등 단어 개수 파악
    const elemCount = words.filter(w => (w.grade_level === '초등단어' || (!w.grade_level && (w.id < 1000 && !w.category?.includes('중등'))))).length;
    const middleCount = words.filter(w => (w.grade_level === '중등단어' || (!w.grade_level && (w.id >= 1000 || w.category?.includes('중등'))))).length;
    const highCount = words.filter(w => w.grade_level === '고등단어').length;

    // 실시간 검색 & 학년/카테고리 필터링
    const filteredWords = words.filter(w => {
        const itemGrade = w.grade_level || (w.category && w.category.includes('중등') ? '중등단어' : (w.id >= 1000 ? '중등단어' : '초등단어'));
        const matchGrade = selectedGrade === '전체' || itemGrade === selectedGrade;
        const matchCat = selectedCategory === '전체' || w.category === selectedCategory;
        const exEn = w.example_en || w.exampleEn || '';
        const exKo = w.example_ko || w.exampleKo || '';
        const matchSearch =
            (w.word || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (w.meaning || '').includes(searchQuery) ||
            (w.phonics || '').includes(searchQuery) ||
            exEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exKo.includes(searchQuery);
        return matchGrade && matchCat && matchSearch;
    });

    // 신규 단어 추가 (DB 저장)
    const handleAddWordSubmit = async (e) => {
        e.preventDefault();
        if (!newWord.trim() || !newMeaning.trim()) return;

        const newItem = {
            word: newWord.trim(),
            meaning: newMeaning.trim(),
            phonics: newPhonics.trim() || `[${newWord.trim().toLowerCase()}]`,
            category: newCategory,
            grade_level: newGradeLevel,
            example_en: newExampleEn.trim() || `I like ${newWord.trim()}.`,
            example_ko: newExampleKo.trim() || `나는 ${newMeaning.trim()}을(를) 좋아해요.`,
            image_url: `https://sqonhhqosyszncjfoxfd.supabase.co/storage/v1/object/public/word_images/${newWord.trim()}.png`
        };

        try {
            const { data, error } = await supabase.from('words').insert([newItem]).select();
            if (!error && data && data.length > 0) {
                setWords([data[0], ...words]);
                alert(`🎉 [${newItem.word}] (${newGradeLevel}) 단어가 클라우드 DB에 추가되었습니다!`);
                setNewWord('');
                setNewMeaning('');
                setNewPhonics('');
                setNewExampleEn('');
                setNewExampleKo('');
                setShowAddForm(false);
            }
        } catch (e) {
            alert('단어 추가 도중 오류가 발생했습니다.');
        }
    };

    // 수정 모드 시작
    const handleStartEdit = (w) => {
        const itemGrade = w.grade_level || (w.category && w.category.includes('중등') ? '중등단어' : (w.id >= 1000 ? '중등단어' : '초등단어'));
        setEditingWordId(w.id);
        setEditForm({
            word: w.word,
            meaning: w.meaning,
            phonics: w.phonics || '',
            category: w.category || '기타',
            grade_level: itemGrade,
            example_en: w.example_en || w.exampleEn || '',
            example_ko: w.example_ko || w.exampleKo || ''
        });
    };

    // 수정 내용 저장 (DB 업데이트)
    const handleSaveEdit = async (id) => {
        try {
            const { error } = await supabase
                .from('words')
                .update({
                    word: editForm.word,
                    meaning: editForm.meaning,
                    phonics: editForm.phonics,
                    category: editForm.category,
                    grade_level: editForm.grade_level,
                    example_en: editForm.example_en,
                    example_ko: editForm.example_ko
                })
                .eq('id', id);

            if (!error) {
                setWords(words.map(w => w.id === id ? { ...w, ...editForm } : w));
                setEditingWordId(null);
                alert('단어 정보 및 학교 구분이 수정되었습니다!');
            }
        } catch (e) {
            alert('수정 실패');
        }
    };

    // 단어 삭제 (DB 삭제)
    const handleDeleteWord = async (id, wordStr) => {
        if (confirm(`정말로 [${wordStr}] 단어를 데이터베이스에서 완전히 삭제할까요?`)) {
            try {
                await supabase.from('words').delete().eq('id', id);
                setWords(words.filter(w => w.id !== id));
                alert('삭제되었습니다.');
            } catch (e) {
                alert('삭제 실패');
            }
        }
    };

    return (
        <div style={{ background: '#FFFFFF', borderRadius: '20px', padding: '16px', border: '1px solid #E9ECEF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, color: '#2C3E50', fontSize: '16px', fontWeight: 'bold' }}>
                  📚 Supabase DB 전체 {words.length.toLocaleString()}개 영단어 통합 관리함 ({filteredWords.length.toLocaleString()}개 표출됨)
                </h4>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{ background: '#27AE60', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                    ➕ 신규 영단어 추가
                </button>
            </div>

            {/* 🏫 초등 / 중등 / 고등 / 전체 즉시 확인 원클릭 탭 버튼 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button
                    type="button"
                    onClick={() => setSelectedGrade('전체')}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: selectedGrade === '전체' ? '2px solid #2980B9' : '1px solid #BDC3C7',
                        background: selectedGrade === '전체' ? '#2980B9' : '#FFFFFF',
                        color: selectedGrade === '전체' ? '#FFFFFF' : '#2C3E50',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    🎒🏫🎓 전체 영단어 ({words.length.toLocaleString()}개)
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedGrade('초등단어')}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: selectedGrade === '초등단어' ? '2px solid #E67E22' : '1px solid #BDC3C7',
                        background: selectedGrade === '초등단어' ? '#FEF5E7' : '#FFFFFF',
                        color: selectedGrade === '초등단어' ? '#D35400' : '#2C3E50',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    🎒 초등 영단어 ({elemCount.toLocaleString()}개)
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedGrade('중등단어')}
                    style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: selectedGrade === '중등단어' ? '2px solid #3498DB' : '1px solid #BDC3C7',
                        background: selectedGrade === '중등단어' ? '#EBF5FB' : '#FFFFFF',
                        color: selectedGrade === '중등단어' ? '#2980B9' : '#2C3E50',
                        fontWeight: 'bold',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    🏫 중등 영단어 ({middleCount.toLocaleString()}개)
                </button>
                {highCount > 0 && (
                    <button
                        type="button"
                        onClick={() => setSelectedGrade('고등단어')}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: selectedGrade === '고등단어' ? '2px solid #9B59B6' : '1px solid #BDC3C7',
                            background: selectedGrade === '고등단어' ? '#F5EEF8' : '#FFFFFF',
                            color: selectedGrade === '고등단어' ? '#8E44AD' : '#2C3E50',
                            fontWeight: 'bold',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        🎓 고등 영단어 ({highCount.toLocaleString()}개)
                    </button>
                )}
            </div>

            {/* 신규 단어 추가 폼 */}
            {showAddForm && (
                <form onSubmit={handleAddWordSubmit} style={{ background: '#F8F9FA', border: '1px solid #E9ECEF', padding: '14px', borderRadius: '14px', marginBottom: '14px' }}>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#D35400' }}>➕ 새로운 영단어 DB 등록</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '8px' }}>
                        <input type="text" placeholder="영단어 (Apple)" value={newWord} onChange={e => setNewWord(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px' }} required />
                        <input type="text" placeholder="한글 뜻 (사과)" value={newMeaning} onChange={e => setNewMeaning(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px' }} required />
                        <input type="text" placeholder="발음기호 ([æpl])" value={newPhonics} onChange={e => setNewPhonics(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
                        <select value={newGradeLevel} onChange={e => setNewGradeLevel(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px', fontWeight: 'bold' }}>
                            <option value="초등단어">🎒 초등단어</option>
                            <option value="중등단어">🏫 중등단어</option>
                            <option value="고등단어">🎓 고등단어</option>
                        </select>
                        <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px' }}>
                            <option value="과일 & 음식 🍎">과일 & 음식 🍎</option>
                            <option value="동물 🐶">동물 🐶</option>
                            <option value="학교 & 학용품 ✏️">학교 & 학용품 ✏️</option>
                            <option value="가족 & 사람 👨‍👩‍👧">가족 & 사람 👨‍👩‍👧</option>
                            <option value="신체 👁️">신체 👁️</option>
                            <option value="동작 & 상태 🏃">동작 & 상태 🏃</option>
                            <option value="자연 & 날씨 ☀️">자연 & 날씨 ☀️</option>
                            <option value="기타">기타</option>
                        </select>
                        <input type="text" placeholder="영문 예문 (예: I eat an apple.)" value={newExampleEn} onChange={e => setNewExampleEn(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px' }} />
                        <input type="text" placeholder="예문 해석 (예: 나는 사과를 먹는다.)" value={newExampleKo} onChange={e => setNewExampleKo(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CCC', fontSize: '12px' }} />
                    </div>
                    <button type="submit" style={{ width: '100%', padding: '10px', background: '#27AE60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        DB에 신규 단어 추가하기
                    </button>
                </form>
            )}

            {/* 실시간 단어 검색 바 및 학교 구분/카테고리 필터 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                    type="text"
                    placeholder="🔍 영단어, 발음, 뜻, 예문 문장 0.1초 검색..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '12px' }}
                />
                <select
                    value={selectedGrade}
                    onChange={e => setSelectedGrade(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '12px', fontWeight: 'bold', background: '#EBF5FB', color: '#2980B9' }}
                >
                    <option value="전체">🎒🏫 전체 학년</option>
                    <option value="초등단어">🎒 초등단어만</option>
                    <option value="중등단어">🏫 중등단어만</option>
                    <option value="고등단어">🎓 고등단어만</option>
                </select>
                <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '10px', border: '1px solid #BDC3C7', fontSize: '12px', fontWeight: 'bold' }}
                >
                    {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* 단어 테이블 리스트 (예문 및 소리 듣기 🔊 확장) */}
            <div style={{ maxHeight: '340px', overflowY: 'auto', border: '1px solid #EEE', borderRadius: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #DDD', color: '#7F8C8D', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>No</th>
                            <th style={{ padding: '8px' }}>학교 구분</th>
                            <th style={{ padding: '8px' }}>🔊 영단어 & 소리</th>
                            <th style={{ padding: '8px' }}>발음</th>
                            <th style={{ padding: '8px' }}>한글 뜻</th>
                            <th style={{ padding: '8px', minWidth: '180px' }}>📝 예문 & 🔊 예문 소리</th>
                            <th style={{ padding: '8px', textAlign: 'center' }}>제어</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWords.map((w, idx) => {
                            const exEn = w.example_en || w.exampleEn || '';
                            const exKo = w.example_ko || w.exampleKo || '';
                            const gradeTag = w.grade_level || (w.category && w.category.includes('중등') ? '중등단어' : (w.id >= 1000 ? '중등단어' : '초등단어'));

                            return (
                                <tr key={w.id || idx} style={{ borderBottom: '1px solid #F1F1F1' }}>
                                    {editingWordId === w.id ? (
                                        <>
                                            <td style={{ padding: '6px' }}>{w.id}</td>
                                            <td style={{ padding: '6px' }}>
                                                <select value={editForm.grade_level} onChange={e => setEditForm({ ...editForm, grade_level: e.target.value })} style={{ padding: '4px', fontSize: '11px' }}>
                                                    <option value="초등단어">초등</option>
                                                    <option value="중등단어">중등</option>
                                                    <option value="고등단어">고등</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '6px' }}>
                                                <input type="text" value={editForm.word} onChange={e => setEditForm({ ...editForm, word: e.target.value })} style={{ width: '90%', padding: '4px' }} />
                                            </td>
                                            <td style={{ padding: '6px' }}>
                                                <input type="text" value={editForm.phonics} onChange={e => setEditForm({ ...editForm, phonics: e.target.value })} style={{ width: '90%', padding: '4px' }} />
                                            </td>
                                            <td style={{ padding: '6px' }}>
                                                <input type="text" value={editForm.meaning} onChange={e => setEditForm({ ...editForm, meaning: e.target.value })} style={{ width: '90%', padding: '4px' }} />
                                            </td>
                                            <td style={{ padding: '6px' }}>
                                                <input type="text" placeholder="영문 예문" value={editForm.example_en} onChange={e => setEditForm({ ...editForm, example_en: e.target.value })} style={{ width: '95%', padding: '4px', marginBottom: '2px' }} />
                                                <input type="text" placeholder="예문 해석" value={editForm.example_ko} onChange={e => setEditForm({ ...editForm, example_ko: e.target.value })} style={{ width: '95%', padding: '4px' }} />
                                            </td>
                                            <td style={{ padding: '6px', textAlign: 'center' }}>
                                                <button onClick={() => handleSaveEdit(w.id)} style={{ background: '#27AE60', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>저장</button>
                                                <button onClick={() => setEditingWordId(null)} style={{ background: '#95A5A6', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}>취소</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td style={{ padding: '8px', color: '#95A5A6' }}>{w.id}</td>
                                            <td style={{ padding: '8px' }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 6px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold',
                                                    background: gradeTag === '중등단어' ? '#EBF5FB' : (gradeTag === '고등단어' ? '#F5EEF8' : '#FEF5E7'),
                                                    color: gradeTag === '중등단어' ? '#2980B9' : (gradeTag === '고등단어' ? '#8E44AD' : '#D35400'),
                                                    border: `1px solid ${gradeTag === '중등단어' ? '#3498DB' : (gradeTag === '고등단어' ? '#9B59B6' : '#E67E22')}`
                                                }}>
                                                    {gradeTag === '중등단어' ? '🏫 중등' : (gradeTag === '고등단어' ? '🎓 고등' : '🎒 초등')}
                                                </span>
                                            </td>
                                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#2C3E50' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span>{w.word}</span>
                                                    <button
                                                        onClick={() => playTTS(w.word)}
                                                        style={{ background: '#EBF5FB', border: '1px solid #3498DB', color: '#2980B9', borderRadius: '50%', width: '24px', height: '24px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}
                                                        title="단어 원어민 소리 듣기"
                                                    >
                                                        🔊
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ padding: '8px', color: '#3498DB' }}>{w.phonics}</td>
                                            <td style={{ padding: '8px', color: '#E74C3C', fontWeight: 'bold' }}>{w.meaning}</td>
                                            <td style={{ padding: '8px' }}>
                                                {exEn ? (
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <strong style={{ color: '#2C3E50', fontSize: '11px' }}>{exEn}</strong>
                                                            <button
                                                                onClick={() => playTTS(exEn)}
                                                                style={{ background: '#E8F8F5', border: '1px solid #2ECC71', color: '#27AE60', borderRadius: '8px', padding: '1px 6px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                                                title="예문 원어민 소리 듣기"
                                                            >
                                                                🔊 예문 듣기
                                                            </button>
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#7F8C8D', marginTop: '2px' }}>{exKo}</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#BDC3C7', fontSize: '11px' }}>예문 없음</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>
                                                <button onClick={() => handleStartEdit(w)} style={{ background: '#3498DB', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', marginRight: '4px' }}>수정</button>
                                                <button onClick={() => handleDeleteWord(w.id, w.word)} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
