// src/pages/OneToOneClassPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import dayjs from 'dayjs';

const weekdaySlots = [
  '16:00-16:40', '16:40-17:20', '17:20-18:00', '18:00-18:40', '18:40-19:20',
  '19:20-20:00', '20:00-20:40', '20:40-21:20', '21:20-22:00',
];
const saturdaySlots = [
  '10:20-11:00', '11:00-11:40', '11:40-12:20', '12:20-13:00', '13:00-13:40',
  '14:00-14:40', '14:40-15:20', '15:20-16:00', '16:00-16:40', '16:40-17:20',
];

function OneToOneClassPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [fixedSchedules, setFixedSchedules] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [memoValues, setMemoValues] = useState({});
  const [refresh, setRefresh] = useState(false);
  const [absentReasons, setAbsentReasons] = useState({});
  const [makeupInfo, setMakeupInfo] = useState({});
  const [showAbsenceInputs, setShowAbsenceInputs] = useState({});
  const [allLessonMap, setAllLessonMap] = useState({});
  const [newFixed, setNewFixed] = useState({
    name: '', weekday: '', time_slot: '', description: '', done: false,
  });
  const memoTimeouts = useRef({});

  const slots = dayjs(selectedDate).day() === 6 ? saturdaySlots : weekdaySlots;

  useEffect(() => {
    fetchTeachers();
    fetchStudents();
  }, []);
  useEffect(() => {
    if (selectedTeacher && selectedDate && students.length > 0) {
      fetchLessons();
      fetchFixedSchedules();
    }
  }, [selectedTeacher, selectedDate, students, refresh]);

  const fetchTeachers = async () => {
    const { data } = await supabase.from('students').select('teacher').neq('teacher', '');
    const unique = [...new Set(data.map(s => s.teacher))];
    setTeachers(unique);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*');
    setStudents(data);
  };

  const fetchLessons = async () => {
    const { data: students } = await supabase.from('students').select('*').eq('teacher', selectedTeacher);
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
    const { data: todayLessons } = await supabase.from('lessons').select('*').eq('date', selectedDate);
    const relatedIds = todayLessons.flatMap(l => [l.original_lesson_id, l.makeup_lesson_id]).filter(Boolean);
    const { data: related } = relatedIds.length
      ? await supabase.from('lessons').select('*').in('id', relatedIds)
      : { data: [] };
    const all = [...todayLessons, ...related];
    const map = Object.fromEntries(all.map(l => [l.id, l]));
    const filtered = todayLessons
      .filter(l => studentMap[l.student_id])
      .map(l => ({ ...l, student: studentMap[l.student_id] }));
    const memos = {};
    filtered.forEach(l => memos[l.id] = l.memo || '');
    setLessons(filtered);
    setAllLessonMap(map);
    setMemoValues(memos);
  };

  const fetchFixedSchedules = async () => {
    const dayInt = dayjs(selectedDate).day();
    const teacherStudents = students.filter(s => s.teacher === selectedTeacher).map(s => s.name);
    const { data } = await supabase.from('fixed_schedules').select('*').eq('weekday', dayInt);
    const filtered = data.filter(f => teacherStudents.includes(f.name));
    setFixedSchedules(filtered);
  };
  const deleteFixedSchedule = async (id) => {
    await supabase.from('fixed_schedules').delete().eq('id', id);
    fetchFixedSchedules();
  };

  const addFixedSchedule = async () => {
    const { name, weekday, time_slot, description } = newFixed;
    if (!name || !weekday || !time_slot || !description) {
      alert('모든 항목을 입력해주세요');
      return;
    }
    await supabase.from('fixed_schedules').insert([{
      name,
      weekday: parseInt(weekday),
      time_slot,
      description,
      done: false,
    }]);
    setNewFixed({ name: '', weekday: '', time_slot: '', description: '', done: false });
    fetchFixedSchedules();
  };

  const handleStatusUpdate = async (id, status) => {
    const now = dayjs();
    await supabase.from('lessons').update({
      status,
      attendance_time: now.format('HH:mm'),
      late_info: now.isAfter(dayjs(`${selectedDate} ${allLessonMap[id]?.test_time}`)) ? '지각' : '정상',
    }).eq('id', id);
    setRefresh(prev => !prev);
  };

  const handleReset = async (id) => {
    const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single();
    if (lesson?.makeup_lesson_id) {
      await supabase.from('lessons').delete().eq('id', lesson.makeup_lesson_id);
    }
    if (lesson?.type === '보강' && lesson?.original_lesson_id) {
      await supabase.from('lessons').update({ makeup_lesson_id: null }).eq('id', lesson.original_lesson_id);
    }
    await supabase.from('lessons').update({
      status: null,
      absent_reason: null,
      makeup_lesson_id: null,
      original_lesson_id: null,
      memo: '',
      attendance_time: null,
      late_info: null,
    }).eq('id', id);
    setRefresh(prev => !prev);
  };

  const handleAbsentAndMakeup = async (lesson) => {
    const reason = absentReasons[lesson.id];
    const makeup = makeupInfo[lesson.id];
    if (!reason) {
      alert('결석사유를 입력하세요');
      return;
    }
    const updates = {
      status: '결석',
      absent_reason: reason,
    };
    let makeupId = null;
    if (makeup?.date && makeup?.test && makeup?.classTime) {
      const { data: newMakeup } = await supabase.from('lessons').insert([{
        student_id: lesson.student.id,
        date: makeup.date,
        test_time: makeup.test,
        class_time: makeup.classTime,
        type: '보강',
        original_lesson_id: lesson.id,
      }]).select().single();
      makeupId = newMakeup?.id;
    }
    if (makeupId) {
      updates.makeup_lesson_id = makeupId;
    }
    await supabase.from('lessons').update(updates).eq('id', lesson.id);
    setRefresh(prev => !prev);
  };

  const handleMoveMakeup = async (lesson) => {
    const oldMakeupId = lesson.makeup_lesson_id;
    const oldMakeup = allLessonMap[oldMakeupId];
    if (!oldMakeup) {
      alert('기존 보강 수업이 존재하지 않습니다');
      return;
    }
    await supabase.from('lessons').delete().eq('id', oldMakeupId);
    const date = prompt('새 보강 날짜 (YYYY-MM-DD)');
    const test = prompt('새 테스트 시간');
    const classTime = prompt('새 수업 시간');
    if (!date || !test || !classTime) {
      alert('모든 정보를 입력해야 합니다.');
      return;
    }
    const { data: newMakeup } = await supabase.from('lessons').insert([{
      student_id: lesson.student.id,
      date,
      test_time: test,
      class_time: classTime,
      type: '보강',
      original_lesson_id: lesson.id,
    }]).select().single();
    await supabase.from('lessons').update({
      makeup_lesson_id: newMakeup.id,
    }).eq('id', lesson.id);
    setRefresh(prev => !prev);
  };

  const handleMemoChange = (lessonId, newText) => {
    setMemoValues(prev => ({ ...prev, [lessonId]: newText }));
    clearTimeout(memoTimeouts.current[lessonId]);
    memoTimeouts.current[lessonId] = setTimeout(async () => {
      await supabase.from('lessons').update({ memo: newText }).eq('id', lessonId);
    }, 1000);
  };

  const getCardColor = (lesson) => {
    if (!lesson) return '#fff';
    if (lesson.type === '보강' && !lesson.status) return '#fff8dc'; // 연노랑 (보강, 출결 전)
    if (lesson.status === null || lesson.status === undefined) return '#f5f5f5'; // 수업 있음, 출결 미처리
    if (lesson.type === '보강') return '#fff8dc'; // 보강 수업은 무조건 연노랑
    if (lesson.status === '출석') return '#e6f4ff'; // 연파랑
    if (lesson.status === '결석') return '#ffe6e6'; // 연빨강
    return '#fff';
  };
  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => window.location.href = '/dashboard'} style={{
        marginBottom: 16,
        padding: '6px 12px',
        backgroundColor: '#ccc',
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer'
      }}>
        뒤로가기
      </button>

      <h2>일대일 수업 관리</h2>

      <div style={{ marginBottom: 24 }}>
        <label>선생님: </label>
        <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
          <option value="">선택</option>
          {teachers.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label style={{ marginLeft: 16 }}>날짜: </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 24, border: '1px solid #ccc', padding: 12 }}>
        <h4>고정일정 등록</h4>
        <input
          placeholder="이름"
          value={newFixed.name}
          onChange={(e) => setNewFixed({ ...newFixed, name: e.target.value })}
        />
        <select
          value={newFixed.weekday}
          onChange={(e) => setNewFixed({ ...newFixed, weekday: e.target.value })}
        >
          <option value="">요일</option>
          <option value="0">일</option>
          <option value="1">월</option>
          <option value="2">화</option>
          <option value="3">수</option>
          <option value="4">목</option>
          <option value="5">금</option>
          <option value="6">토</option>
        </select>
        <input
          placeholder="시간대"
          value={newFixed.time_slot}
          onChange={(e) => setNewFixed({ ...newFixed, time_slot: e.target.value })}
        />
        <input
          placeholder="설명"
          value={newFixed.description}
          onChange={(e) => setNewFixed({ ...newFixed, description: e.target.value })}
        />
        <button onClick={addFixedSchedule}>등록</button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h4>📌 고정일정 목록</h4>
        {fixedSchedules.map((f) => (
          <div key={f.id} style={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            padding: 8,
            marginBottom: 6,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ flex: 2 }}>
              <strong>{f.name}</strong> | {f.time_slot} | {f.description}
            </div>
            <textarea
              placeholder="메모"
              defaultValue={f.memo || ''}
              style={{ flex: 2, fontSize: 14, padding: 4 }}
              onChange={(e) => {
                const value = e.target.value;
                clearTimeout(f._memoTimeout);
                f._memoTimeout = setTimeout(async () => {
                  await supabase.from('fixed_schedules').update({ memo: value }).eq('id', f.id);
                  setFixedSchedules((prev) =>
                    prev.map(item => item.id === f.id ? { ...item, memo: value } : item)
                  );
                }, 1000);
              }}
            />
            <input
              type="checkbox"
              checked={f.done || false}
              onChange={async (e) => {
                const newDone = e.target.checked;
                await supabase.from('fixed_schedules').update({ done: newDone }).eq('id', f.id);
                setFixedSchedules((prev) =>
                  prev.map(item => item.id === f.id ? { ...item, done: newDone } : item)
                );
              }}
            />
            <button onClick={() => deleteFixedSchedule(f.id)}>삭제</button>
          </div>
        ))}
      </div>
      {slots.map((slot) => {
        const lesson = lessons.find(l => l.class_time === slot);
        const original = lesson?.original_lesson_id ? allLessonMap[lesson.original_lesson_id] : null;
        const makeup = lesson?.makeup_lesson_id ? allLessonMap[lesson.makeup_lesson_id] : null;

        return (
          <div key={slot} style={{
            border: '1px solid #ccc',
            padding: 14,
            borderRadius: 8,
            marginBottom: 12,
            backgroundColor: getCardColor(lesson),
          }}>
            <strong>{slot}</strong>
            {lesson ? (
              <>
                <div>{lesson.student.name} ({lesson.student.grade}학년, {lesson.student.school})</div>
                <div>테스트: {lesson.test_time} / 수업: {lesson.class_time}</div>
                <div>
                  출결: {lesson.status || '-'}{' '}
                  {lesson.attendance_time ? `(${lesson.attendance_time}, ${lesson.late_info})` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
                  {!lesson.status && (
                    <>
                      <button onClick={() => handleStatusUpdate(lesson.id, '출석')}>출석</button>
                      <button onClick={() => setShowAbsenceInputs((p) => ({ ...p, [lesson.id]: !p[lesson.id] }))}>결석</button>
                    </>
                  )}
                  <button onClick={() => handleReset(lesson.id)}>초기화</button>
                  {lesson.status === '결석' && !lesson.type && (
                    <button onClick={() => {
                      if (lesson.makeup_lesson_id) {
                        supabase.from('lessons').delete().eq('id', lesson.makeup_lesson_id);
                      }
                      setShowAbsenceInputs((p) => ({ ...p, [lesson.id]: true }));
                    }}>
                      보강이동
                    </button>
                  )}
                </div>

                {showAbsenceInputs[lesson.id] && (
                  <div>
                    <input
                      type="text"
                      placeholder="결석사유"
                      value={absentReasons[lesson.id] || ''}
                      onChange={(e) => setAbsentReasons((p) => ({ ...p, [lesson.id]: e.target.value }))}
                    />
                    <input
                      type="date"
                      value={makeupInfo[lesson.id]?.date || ''}
                      onChange={(e) =>
                        setMakeupInfo((p) => ({
                          ...p,
                          [lesson.id]: { ...p[lesson.id], date: e.target.value },
                        }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="보강 테스트"
                      value={makeupInfo[lesson.id]?.test || ''}
                      onChange={(e) =>
                        setMakeupInfo((p) => ({
                          ...p,
                          [lesson.id]: { ...p[lesson.id], test: e.target.value },
                        }))
                      }
                    />
                    <input
                      type="text"
                      placeholder="보강 수업"
                      value={makeupInfo[lesson.id]?.classTime || ''}
                      onChange={(e) =>
                        setMakeupInfo((p) => ({
                          ...p,
                          [lesson.id]: { ...p[lesson.id], classTime: e.target.value },
                        }))
                      }
                    />
                    <button onClick={() => handleAbsentAndMakeup(lesson)}>결석 처리</button>
                  </div>
                )}

                {lesson.absent_reason && <div>결석사유: {lesson.absent_reason}</div>}
                {lesson.type === '보강' && original && (
                  <div style={{ fontSize: 13, color: '#555' }}>
                    원결석일: {original.date}, 사유: {original.absent_reason}
                  </div>
                )}
                {lesson.makeup_lesson_id && makeup && (
                  <div style={{ fontSize: 13, color: '#888' }}>
                    보강일: {makeup.date}, 수업: {makeup.class_time}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: '#999' }}>수업 없음</div>
            )}

            <textarea
              placeholder="메모"
              value={lesson ? memoValues[lesson.id] || '' : ''}
              onChange={(e) => {
                if (lesson) handleMemoChange(lesson.id, e.target.value);
              }}
              style={{
                width: '100%',
                marginTop: 8,
                padding: 6,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14,
                resize: 'vertical',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default OneToOneClassPage;
