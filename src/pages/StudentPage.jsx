// src/pages/StudentPage.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

function StudentPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    name: '', school: '', grade: '', teacher: '', phone: '',
    one_day: '', one_test_time: '', one_class_time: '', first_day: ''
  })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { fetchStudents() }, [])
  useEffect(() => {
    const lower = search.toLowerCase()
    setFilteredStudents(
      students.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.school.toLowerCase().includes(lower) ||
        s.grade.toLowerCase().includes(lower) ||
        s.teacher.toLowerCase().includes(lower)
      )
    )
  }, [search, students])

  const fetchStudents = async () => {
    const { data } = await supabase.from('students').select('*').order('name')
    setStudents(data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const convertToFullTime = (time) => {
    const t = {
      '16:00': '16:00-16:40', '16:40': '16:40-17:20', '17:20': '17:20-18:00',
      '18:00': '18:00-18:40', '18:40': '18:40-19:20', '19:20': '19:20-20:00',
      '20:00': '20:00-20:40', '20:40': '20:40-21:20', '21:20': '21:20-22:00',
      '10:20': '10:20-11:00', '11:00': '11:00-11:40', '11:40': '11:40-12:20',
      '12:20': '12:20-13:00', '13:00': '13:00-13:40', '14:00': '14:00-14:40',
      '14:40': '14:40-15:20', '15:20': '15:20-16:00', '16:40(sat)': '16:40-17:20'
    }
    return t[time] || time
  }

  const handleSubmit = async () => {
    const mapped = convertToFullTime(form.one_class_time.trim())
    const newForm = { ...form, one_class_time: mapped }

    if (editingId) {
      await supabase.from('students').update(newForm).eq('id', editingId)
      setEditingId(null)
    } else {
      const { data: student } = await supabase.from('students').insert([newForm]).select().single()
      if (student) await generateLessons(student)
    }
    setForm({ name: '', school: '', grade: '', teacher: '', phone: '', one_day: '', one_test_time: '', one_class_time: '', first_day: '' })
    fetchStudents()
  }

  const generateLessons = async (student) => {
    const lessons = []
    const start = dayjs(student.first_day)
    const map = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 }
    for (let i = 0; i < 365 * 7; i++) {
      const date = start.add(i, 'day')
      if (date.day() === map[student.one_day]) {
        lessons.push({ student_id: student.id, date: date.format('YYYY-MM-DD'), test_time: student.one_test_time, class_time: student.one_class_time, type: '정규' })
      }
    }
    while (lessons.length > 0) await supabase.from('lessons').insert(lessons.splice(0, 1000))
  }

  const handleEdit = (s) => {
    setEditingId(s.id)
    setForm({ name: s.name, school: s.school, grade: s.grade, teacher: s.teacher, phone: s.phone, one_day: s.one_day, one_test_time: s.one_test_time, one_class_time: s.one_class_time, first_day: s.first_day })
  }

  const handleDelete = async (s) => {
    const input = document.createElement('input')
    input.type = 'date'; input.style.position = 'fixed'; input.style.top = '100px'; input.style.left = '50%'; input.style.transform = 'translateX(-50%)'; input.style.zIndex = 9999
    document.body.appendChild(input)
    input.focus()
    input.addEventListener('change', async () => {
      const date = input.value
      document.body.removeChild(input)
      if (date) {
        await supabase.from('lessons').delete().eq('student_id', s.id).gte('date', date)
        await supabase.from('students').delete().eq('id', s.id)
        fetchStudents()
      }
    })
  }

  const handleBack = () => navigate('/dashboard')

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backButton}>← 뒤로가기</button>
      </div>
      <h2 style={styles.title}>학생 등록</h2>
      <div style={styles.form}>
        {[
          ['name', '이름'], ['school', '학교'], ['grade', '학년'], ['teacher', '담당선생님'],
          ['phone', '전화번호'], ['one_day', '수업 요일 (월~토)'], ['one_test_time', '테스트 시간 (예: 16:00)'],
          ['one_class_time', '수업 시작 시간 (예: 16:40)']
        ].map(([k, l]) => (
          <input key={k} name={k} placeholder={l} value={form[k]} onChange={handleChange} style={styles.input} />
        ))}
        <label>첫 수업일</label>
        <input name="first_day" type="date" value={form.first_day} onChange={handleChange} style={styles.input} />
        <button style={styles.button} onClick={handleSubmit}>{editingId ? '수정 완료' : '등록'}</button>
      </div>

      <h3 style={styles.subtitle}>학생 목록</h3>
      <input type="text" placeholder="이름, 학교, 학년, 담당선생님으로 검색" value={search} onChange={(e) => setSearch(e.target.value)} style={styles.search} />
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>#</th><th>이름</th><th>학교</th><th>학년</th><th>담당</th><th>전화</th><th>요일</th><th>테스트</th><th>수업</th><th>시작일</th><th>수정</th><th>삭제</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s, i) => (
              <tr key={s.id}>
                <td>{i + 1}</td><td>{s.name}</td><td>{s.school}</td><td>{s.grade}</td>
                <td>{s.teacher}</td><td>{s.phone}</td><td>{s.one_day}</td><td>{s.one_test_time}</td>
                <td>{s.one_class_time}</td><td>{s.first_day}</td>
                <td><button onClick={() => handleEdit(s)}>수정</button></td>
                <td><button onClick={() => handleDelete(s)}>삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '24px', background: '#f9f9f9', minHeight: '100vh', width: '100vw', boxSizing: 'border-box' },
  title: { fontSize: 28, color: '#2f80ed', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 22, margin: '40px 0 16px', color: '#333', textAlign: 'center' },
  header: { marginBottom: 20 },
  backButton: { padding: '6px 12px', backgroundColor: '#ccc', border: 'none', borderRadius: 6, cursor: 'pointer' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: 0, background: 'transparent', boxShadow: 'none', borderRadius: 0, width: '100%' },
  input: { padding: 10, fontSize: 14, border: '1px solid #ccc', borderRadius: 6 },
  button: { gridColumn: '1 / -1', padding: 14, fontSize: 16, backgroundColor: '#2f80ed', color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: 8, cursor: 'pointer' },
  search: { margin: '10px 0 20px', padding: 10, width: '100%', maxWidth: 400, border: '1px solid #ccc', borderRadius: 6, display: 'block', marginLeft: 'auto', marginRight: 'auto' },
  tableWrapper: { width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' },
  table: { width: '100%', maxWidth: '1200px', borderCollapse: 'collapse', fontSize: 14, background: '#fff', textAlign: 'center', border: '1px solid #ddd' },
  th: { border: '1px solid #ddd', padding: 8 },
  td: { border: '1px solid #ddd', padding: 8 }
}

export default StudentPage
