// src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom'

function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>블라썸에듀 산본 대시보드</h1>
      <div style={styles.buttonGroup}>
        <button style={styles.button} onClick={() => navigate('/students')}>
          학생 관리
        </button>
        <button style={styles.button} onClick={() => navigate('/one-to-one')}>
          일대일 수업 관리
        </button>
        <button style={styles.button} onClick={() => navigate('/kiosk')}>
          키오스크 출석체크
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: 40,
    textAlign: 'center',
  },
  title: {
    color: '#2f80ed',
    marginBottom: 40,
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#2f80ed',
    color: 'white',
    fontSize: 16,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
}

export default DashboardPage
