// src/pages/OneToOneClassPage.jsx
import { useEffect, useState, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import dayjs from 'dayjs'

const weekdaySlots = [
  '16:00-16:40', '16:40-17:20', '17:20-18:00', '18:00-18:40', '18:40-19:20',
  '19:20-20:00', '20:00-20:40', '20:40-21:20', '21:20-22:00',
]
const saturdaySlots = [
  '10:20-11:00', '11:00-11:40', '11:40-12:20', '12:20-13:00', '13:00-13:40',
  '14:00-14:40', '14:40-15:20', '15:20-16:00', '16:00-16:40', '16:40-17:20',
]

function OneToOneClassPage() {
  const [teachers, setTeachers] = useState([])
  const [lessons, setLessons] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [memoValues, setMemoValues] = useState({})
  const memoTimeouts = useRef({})
  const [refresh, setRefresh] = useState(false)
  const [absentReasons, setAbsentReasons] = useState({})
  const [makeupInfo, setMakeupInfo] = useState({})
  const [showAbsenceInputs, setShowAbsenceInputs] = useState({})
  const [allLessonMap, setAllLessonMap] = useState({})

  useEffect(() => { fetchTeachers() }, [])
  useEffect(() => {
    if (selectedTeacher && selectedDate) fetchLessons()
  }, [selectedTeacher, selectedDate, refresh])

  const fetchTeachers = async () => {
    const { data } = await supabase.from('students').select('teacher').neq('teacher', '').order('teacher')
    const unique = [...new Set(data.map((s) => s.teacher))]
    setTeachers(unique)
  }

  const fetchLessons = async () => {
    const { data: students } = await supabase.from('students').select('*').eq('teacher', selectedTeacher)
    const studentMap = Object.fromEntries(students.map((s) => [s.id, s]))
    const { data: lessonsToday } = await supabase.from('lessons').select('*').eq('date', selectedDate)
    const relatedLessonIds = lessonsToday.flatMap(l => [l.original_lesson_id, l.makeup_lesson_id]).filter(Boolean)
    const { data: relatedLessons } = relatedLessonIds.length > 0 ? await supabase.from('lessons').select('*').in('id', relatedLessonIds) : { data: [] }
    const all = [...lessonsToday, ...relatedLessons]
    const map = Object.fromEntries(all.map(l => [l.id, l]))
    const filtered = lessonsToday.filter(l => studentMap[l.student_id]).map(l => ({ ...l, student: studentMap[l.student_id] }))
    setLessons(filtered)
    setAllLessonMap(map)

    // 초기 메모 값 설정
    const memoInit = {}
    filtered.forEach(l => { memoInit[l.id] = l.memo || '' })
    setMemoValues(memoInit)
  }

  const convertTimeToSlot = (time) => {
    const slot = [...weekdaySlots, ...saturdaySlots].find(s => s.startsWith(time))
    return slot || time
  }

  const handleStatusUpdate = async (lessonId, status) => {
    const now = dayjs()
    const lesson = lessons.find((l) => l.id === lessonId)
    const testTime = dayjs(`${lesson.date} ${lesson.test_time}`)
    const late = now.diff(testTime, 'minute')
    const lateStatus = late <= 0 ? '정시' : `지각 ${late}분`
    await supabase.from('lessons').update({ status, attendance_time: now.format('HH:mm'), late_info: lateStatus }).eq('id', lessonId)
    setRefresh(!refresh)
  }

  const handleAbsentAndMakeup = async (lesson) => {
    const reason = absentReasons[lesson.id]
    if (!reason) return alert('결석 사유를 입력해주세요.')

    await supabase.from('lessons').update({ status: '결석', absent_reason: reason }).eq('id', lesson.id)
    setShowAbsenceInputs(prev => ({ ...prev, [lesson.id]: false }))

    const info = makeupInfo[lesson.id] || {}
    if (info.date && info.test && info.classTime) {
      const convertedTime = convertTimeToSlot(info.classTime)
      const { data: makeup } = await supabase
        .from('lessons')
        .insert([{ student_id: lesson.student_id, date: info.date, test_time: info.test, class_time: convertedTime, type: '보강', original_lesson_id: lesson.id }])
        .select().single()
      await supabase.from('lessons')
        .update({ makeup_lesson_id: makeup.id })
        .eq('id', lesson.id)
    }
    setRefresh(!refresh)
  }

  const handleReset = async (lessonId) => {
    const confirm = window.confirm('출결 상태 및 보강 수업도 초기화할까요?')
    if (!confirm) return
    const lesson = lessons.find((l) => l.id === lessonId)
    if (lesson.makeup_lesson_id) {
      await supabase.from('lessons').delete().eq('id', lesson.makeup_lesson_id)
    }
    await supabase.from('lessons').update({ status: null, memo: '', absent_reason: null, attendance_time: null, makeup_lesson_id: null, late_info: null }).eq('id', lessonId)
    setRefresh(!refresh)
  }

  const handleMemoChange = (lessonId, value) => {
    setMemoValues(prev => ({ ...prev, [lessonId]: value }))
    if (memoTimeouts.current[lessonId]) clearTimeout(memoTimeouts.current[lessonId])
    memoTimeouts.current[lessonId] = setTimeout(async () => {
      await supabase.from('lessons').update({ memo: value }).eq('id', lessonId)
    }, 1000)
  }

  const slots = dayjs(selectedDate).day() === 6 ? saturdaySlots : weekdaySlots
  const getLessonForSlot = (time) => lessons.find((l) => l.class_time === time && l.student?.teacher === selectedTeacher)

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>일대일 수업 관리</h2>
      <div style={styles.controls}>
        <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
          <option value="">선생님 선택</option>
          {teachers.map((t) => (<option key={t} value={t}>{t}</option>))}
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
      </div>
      {slots.map((slot) => {
        const lesson = getLessonForSlot(slot)
        const original = lesson?.original_lesson_id ? allLessonMap[lesson.original_lesson_id] : null
        const makeup = lesson?.makeup_lesson_id ? allLessonMap[lesson.makeup_lesson_id] : null
        return (
          <div key={slot} style={{ ...styles.card, backgroundColor: lesson?.type === '보강' ? '#e3f2fd' : '#fff' }}>
            <strong>{slot}</strong>
            {lesson ? (
              <>
                <div>{lesson.student.name} ({lesson.student.grade}학년, {lesson.student.school})</div>
                <div>테스트: {lesson.test_time} / 수업: {lesson.class_time}</div>
                <div>출결: {lesson.status || '-'} {lesson.attendance_time ? `(${lesson.attendance_time}, ${lesson.late_info})` : ''}</div>
                <div style={styles.buttons}>
                  <button onClick={() => handleStatusUpdate(lesson.id, '출석')}>출석</button>
                  <button onClick={() => setShowAbsenceInputs(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }))}>결석</button>
                  <button onClick={() => handleReset(lesson.id)}>초기화</button>
                </div>
                {showAbsenceInputs[lesson.id] && (
                  <div>
                    <input type="text" placeholder="결석사유" value={absentReasons[lesson.id] || ''} onChange={(e) => setAbsentReasons(prev => ({ ...prev, [lesson.id]: e.target.value }))} style={styles.input} />
                    <input type="date" placeholder="보강 날짜" value={makeupInfo[lesson.id]?.date || ''} onChange={(e) => setMakeupInfo(prev => ({ ...prev, [lesson.id]: { ...prev[lesson.id], date: e.target.value } }))} style={styles.input} />
                    <input type="text" placeholder="보강 테스트" value={makeupInfo[lesson.id]?.test || ''} onChange={(e) => setMakeupInfo(prev => ({ ...prev, [lesson.id]: { ...prev[lesson.id], test: e.target.value } }))} style={styles.input} />
                    <input type="text" placeholder="보강 수업" value={makeupInfo[lesson.id]?.classTime || ''} onChange={(e) => setMakeupInfo(prev => ({ ...prev, [lesson.id]: { ...prev[lesson.id], classTime: e.target.value } }))} style={styles.input} />
                    <button onClick={() => handleAbsentAndMakeup(lesson)}>결석 처리</button>
                  </div>
                )}
                {lesson.absent_reason && <div>결석사유: {lesson.absent_reason}</div>}
                {lesson.type === '보강' && original && (
                  <div style={{ fontSize: 13, color: '#555' }}>원결석일: {original.date}, 사유: {original.absent_reason}</div>
                )}
                {lesson.makeup_lesson_id && makeup && (
                  <div style={{ fontSize: 13, color: '#888' }}>보강일: {makeup.date}, 수업: {makeup.class_time}</div>
                )}
              </>
            ) : (
              <div style={{ color: '#999' }}>수업 없음</div>
            )}
            <textarea
              placeholder="메모"
              value={memoValues[lesson?.id] || ''}
              onChange={(e) => handleMemoChange(lesson.id, e.target.value)}
              style={styles.memo}
            />
          </div>
        )
      })}
    </div>
  )
}

const styles = {
  page: { padding: '24px', width: '100vw', minHeight: '100vh', backgroundColor: '#f9f9f9', boxSizing: 'border-box' },
  title: { color: '#2f80ed', fontSize: 24, marginBottom: 20 },
  controls: { display: 'flex', gap: 20, marginBottom: 30 },
  card: { border: '1px solid #ccc', borderRadius: 8, padding: 14, marginBottom: 12, backgroundColor: 'white' },
  buttons: { display: 'flex', gap: 8, marginTop: 8, marginBottom: 8 },
  input: { marginRight: 8, marginTop: 4, padding: 6, fontSize: 14 },
  memo: { width: '100%', marginTop: 8, padding: 6, fontSize: 14 },
}

export default OneToOneClassPage;
