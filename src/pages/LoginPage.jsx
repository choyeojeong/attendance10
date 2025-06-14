// src/pages/LoginPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true'
    if (isLoggedIn) navigate('/dashboard')
  }, [])

  const handleLogin = () => {
    if (id === 'sanbon' && password === '471466') {
      localStorage.setItem('loggedIn', 'true')
      navigate('/dashboard')
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.formBox}>
        <h2 style={styles.title}>블라썸에듀 산본 로그인</h2>
        <input
          style={styles.input}
          placeholder="아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
        <input
          style={styles.input}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button style={styles.button} onClick={handleLogin}>
          로그인
        </button>
        {error && <p style={styles.error}>{error}</p>}
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
  title: {
    marginBottom: 24,
    color: '#2f80ed',
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 14,
    fontSize: 18,
    marginBottom: 16,
    border: '1px solid #ccc',
    borderRadius: 8,
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: 14,
    backgroundColor: '#2f80ed',
    color: 'white',
    fontSize: 18,
    border: 'none',
    borderRadius: 8,
    fontWeight: 'bold',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
  error: {
    marginTop: 16,
    color: 'red',
    fontSize: 16,
  },
}

export default LoginPage
