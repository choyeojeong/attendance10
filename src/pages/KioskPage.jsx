// src/pages/KioskPage.jsx
import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import dayjs from 'dayjs'

function KioskPage() {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    setMessage('')

    const today = dayjs().format('YYYY-MM-DD')
    const nowTime = dayjs()

    const { data: students, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('phone', phone.trim())

    if (studentError || !students || students.length === 0) {
      setMessage('학생 정보를 찾을 수 없습니다.')
      setIsLoading(false)
      return
    }

    const student = students[0]

    const { data: lessonList } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .eq('date', today)

    const todayLesson = lessonList?.find((l) => l.type === '정규')

    if (!todayLesson) {
      setMessage('오늘 수업이 없습니다.')
      setIsLoading(false)
      return
    }

    const testTime = dayjs(`${today} ${todayLesson.test_time}`)
    const diff = nowTime.diff(testTime, 'minute')

    let status = ''
    if (diff <= 0) {
      status = '정시'
    } else {
      status = `지각 ${diff}분`
    }

    await supabase
      .from('lessons')
      .update({
        status: '출석',
        attendance_time: nowTime.format('HH:mm'),
        late_info: status,
      })
      .eq('id', todayLesson.id)

    setMessage(`✅ 출석 처리 완료 (${status})`)
    setIsLoading(false)
    setPhone('')
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>출석 체크</h2>
      <input
        style={styles.input}
        placeholder="전화번호 입력"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button style={styles.button} onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? '처리중...' : '출석 체크'}
      </button>
      <p style={styles.message}>{message}</p>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: 300,
    margin: '100px auto',
    padding: 24,
    textAlign: 'center',
    border: '1px solid #ccc',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  title: {
    color: '#2f80ed',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  button: {
    width: '100%',
    padding: 12,
    backgroundColor: '#2f80ed',
    color: 'white',
    fontSize: 16,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  message: {
    marginTop: 16,
    color: '#333',
    fontWeight: 'bold',
  },
}

export default KioskPage
