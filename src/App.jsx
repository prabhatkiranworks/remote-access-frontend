import { useState } from 'react'
import './App.css'
import Login from './components/login/Login.jsx'
import Dashboard from './components/dashboard/Dashboard.jsx'
import { signOut } from './common/api'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogout = async () => {
    try { await signOut() } catch (_) { /* ignore */ }
    setIsAuthenticated(false)
    setCurrentPage('login')
  }

  if (currentPage === 'dashboard') {
    return (
      <div className="app-shell app-shell--fill">
        <Dashboard onLogout={handleLogout} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Login
        onSuccess={() => {
          setCurrentPage('dashboard')
          setIsAuthenticated(true)
        }}
      />
    </div>
  )
}

export default App
