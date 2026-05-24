import { useSignUpForm } from './signUp.js'

function SignUpUI({ onSwitchToSignIn }) {
  const { form, loading, message, error, handleChange, handleSubmit } = useSignUpForm(onSwitchToSignIn)

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-field">
        <label className="auth-label" htmlFor="signup-name">Full Name</label>
        <input
          id="signup-name"
          className="auth-input"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          autoComplete="name"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          className="auth-input"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
      </div>

      <div className="auth-field">
        <label className="auth-label" htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          className="auth-input"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a password"
          autoComplete="new-password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="auth-submit">
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      {message && <p className="auth-message auth-message--success">{message}</p>}
      {error   && <p className="auth-message auth-message--error">{error}</p>}
    </form>
  )
}

export default SignUpUI
