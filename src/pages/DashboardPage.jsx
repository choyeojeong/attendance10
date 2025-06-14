// src/pages/DashboardPage.jsx
import { useNavigate } from 'react-router-dom'

function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('loggedIn')
    navigate('/')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={handleLogout}>로그아웃</button>
      </div>

      <div style={styles.centerBox}>
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
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  header: {
    position: 'absolute',
    top: 20,
    right: 40,
  },
  backButton: {
    padding: '6px 12px',
    backgroundColor: '#ccc',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  centerBox: {
    textAlign: 'center',
    maxWidth: 600,
    width: '100%',
    margin: '0 auto',
  },
  title: {
    color: '#2f80ed',
    marginBottom: 40,
    fontSize: 32,
    fontWeight: 'bold',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: 20,
    flexWrap: 'wrap',
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
