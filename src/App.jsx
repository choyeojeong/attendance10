// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import KioskPage from './pages/KioskPage'
import OneToOneClassPage from './pages/OneToOneClassPage'
import StudentPage from './pages/StudentPage'

function ProtectedRoute({ children }) {
  const loggedIn = localStorage.getItem('loggedIn') === 'true';
  const location = useLocation();
  if (!loggedIn) return <Navigate to="/" state={{ from: location }} replace />
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentPage /></ProtectedRoute>} />
        <Route path="/one-to-one" element={<ProtectedRoute><OneToOneClassPage /></ProtectedRoute>} />
        <Route path="/kiosk" element={<ProtectedRoute><KioskPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
