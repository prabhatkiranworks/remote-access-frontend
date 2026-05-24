import { useSignInForm } from './signIn.js'

function SignInUI({ onSuccess }) {
  const { form, loading, message, error, handleChange, handleSubmit } = useSignInForm(onSuccess)

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="auth-field">
        <label className="auth-label" htmlFor="signin-email">Email</label>
        <input
          id="signin-email"
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
        <label className="auth-label" htmlFor="signin-password">Password</label>
        <input
          id="signin-password"
          className="auth-input"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" disabled={loading} className="auth-submit">
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      {message && <p className="auth-message auth-message--success">{message}</p>}
      {error   && <p className="auth-message auth-message--error">{error}</p>}
    </form>
  )
}

export default SignInUI
