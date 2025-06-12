// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import KioskPage from './pages/KioskPage'
import OneToOneClassPage from './pages/OneToOneClassPage'
import StudentPage from './pages/StudentPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/one-to-one" element={<OneToOneClassPage />} />
        <Route path="/students" element={<StudentPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
