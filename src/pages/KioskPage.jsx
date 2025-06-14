// src/pages/KioskPage.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

function KioskPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true'
    if (!isLoggedIn) navigate('/')
  }, [])

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
      setMessage('❌ 학생 정보를 찾을 수 없습니다.')
      setIsLoading(false)
      return
    }

    const student = students[0]

    const { data: lessonList } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', student.id)
      .eq('date', today)

    const todayLesson = lessonList?.find((l) => l.type === '정규' || l.type === '보강')

    if (!todayLesson) {
      setMessage('📭 오늘 수업이 없습니다.')
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

  const handleBack = () => navigate('/dashboard')

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={handleBack}>← 뒤로가기</button>
      <div style={styles.formBox}>
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
    </div>
  )
}

const styles = {
  container: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  formBox: {
    width: 400,
    padding: 32,
    border: '1px solid #ccc',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: '8px 14px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 16,
  },
  title: {
    color: '#2f80ed',
    fontSize: 28,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
    border: '1px solid #ccc',
    borderRadius: 8,
    boxSizing: 'border-box', // ✅ padding 포함해서 정확히 100% 너비
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#2f80ed',
    color: 'white',
    fontSize: 18,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    boxSizing: 'border-box', // ✅ 버튼도 동일하게 적용
  },
  message: {
    marginTop: 20,
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
}

export default KioskPage
