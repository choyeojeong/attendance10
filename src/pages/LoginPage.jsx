// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = () => {
    if (id === 'sanbon' && password === '471466') {
      navigate('/dashboard')
    } else {
      setError('아이디 또는 비밀번호가 잘못되었습니다.')
    }
  }

  return (
    <div style={styles.container}>
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
  )
}

const styles = {
  container: {
    maxWidth: 320,
    margin: '80px auto',
    padding: 24,
    border: '1px solid #ccc',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  title: {
    marginBottom: 20,
    color: '#2f80ed',
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 12,
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  button: {
    width: '100%',
    padding: 12,
    backgroundColor: '#2f80ed',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: 'bold',
  },
  error: {
    marginTop: 10,
    color: 'red',
  },
}

export default LoginPage
