import { useState } from 'react'
import SignUpUI from './signUp/signUpUI.jsx'
import SignInUI from './signIn/signInUI.jsx'

function Login({ onSuccess }) {
  const [currentPage, setCurrentPage] = useState('signin')

  return (
    <div className="auth-screen">

      {/* ── Left panel — mirrors the dashboard navbar style ── */}
      <aside className="auth-sidebar">
        <div className="auth-sidebar-brand">
          <div className="auth-sidebar-logo">A</div>
          <span className="auth-sidebar-name">Access</span>
        </div>

        <p className="auth-sidebar-tagline">Secure file management platform</p>

        <nav className="auth-sidebar-nav">
          <button
            className={`auth-sidebar-link ${currentPage === 'signin' ? 'auth-sidebar-link--active' : ''}`}
            onClick={() => setCurrentPage('signin')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`auth-sidebar-link ${currentPage === 'signup' ? 'auth-sidebar-link--active' : ''}`}
            onClick={() => setCurrentPage('signup')}
            type="button"
          >
            Sign Up
          </button>
        </nav>
      </aside>

      {/* ── Right panel — mirrors the dashboard workspace style ── */}
      <main className="auth-workspace">
        <div className="auth-workspace-inner">
          <h2 className="auth-workspace-title">
            {currentPage === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </h2>
          <p className="auth-workspace-subtitle">
            {currentPage === 'signin'
              ? 'Enter your credentials to continue.'
              : 'Fill in the details below to get started.'}
          </p>

          <div className="auth-form-wrap">
            {currentPage === 'signin' && <SignInUI onSuccess={onSuccess} />}
            {currentPage === 'signup' && (
              <SignUpUI onSwitchToSignIn={() => setCurrentPage('signin')} />
            )}
          </div>
        </div>
      </main>

    </div>
  )
}

export default Login
