import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { getError } from '../lib/api'
import './Login.css'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || '/'

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await auth.signup({
          username: form.username.trim().toLowerCase(),
          password: form.password,
          email: form.email || undefined,
          full_name: form.full_name || undefined,
        })
      } else {
        await auth.login(form.username.trim().toLowerCase(), form.password)
      }
      navigate(from, { replace: true })
    } catch (e) {
      setErr(getError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-mark">◆</div>
          <span>Career <em>Ledger</em></span>
        </div>

        <div className="auth-hero">
          <div className="eyebrow">// Vol. 01 · A Personal Index</div>
          <h1 className="display auth-title">
            Every <em>application,</em><br />
            in one private<br />
            ledger.
          </h1>
          <p className="auth-lede">
            Track companies, roles, packages, and the patterns hiding inside the JDs you collect.
            A career command center that respects your time and your data.
          </p>
        </div>

        <div className="auth-pull">
          <div className="pull-num">$</div>
          <div className="pull-text">
            <div className="pull-label">Free forever</div>
            <div className="pull-detail">Self-hostable. Your data, your server.</div>
          </div>
        </div>

        <div className="auth-foot">
          <span>EDITION · 2026</span>
          <span>·</span>
          <span>BUILT FOR APPLICANTS, NOT RECRUITERS</span>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="card-tag">// {mode === 'signup' ? 'NEW · ACCOUNT' : 'AUTH · GATE'}</div>
          <h2 className="display card-title">
            {mode === 'signup' ? <>Begin <em>tracking.</em></> : <>Welcome <em>back.</em></>}
          </h2>
          <p className="card-sub">
            {mode === 'signup'
              ? 'A few seconds. No spam, no marketing emails.'
              : 'Sign in to your career command center.'}
          </p>

          {err && <div className="err">{err}</div>}

          <form onSubmit={onSubmit}>
            {mode === 'signup' && (
              <div className="field">
                <label>Full name <span style={{ color: 'var(--ink-faint)' }}>(optional)</span></label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={onChange('full_name')}
                  placeholder="e.g. Abhi Sharma"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="field">
              <label>Username</label>
              <input
                type="text"
                value={form.username}
                onChange={onChange('username')}
                placeholder="abhi"
                autoComplete="username"
                required
                minLength={3}
                pattern="[a-zA-Z0-9_]+"
                title="Letters, numbers, and underscores only"
              />
            </div>

            {mode === 'signup' && (
              <div className="field">
                <label>Email <span style={{ color: 'var(--ink-faint)' }}>(optional)</span></label>
                <input
                  type="email"
                  value={form.email}
                  onChange={onChange('email')}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
            )}

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={onChange('password')}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-block btn-lg" disabled={loading}>
              {loading ? 'Working…' : mode === 'signup' ? 'Create account →' : 'Enter dashboard →'}
            </button>
          </form>

          <div className="card-toggle">
            {mode === 'signup' ? 'Already have an account?' : "Don't have one?"}{' '}
            <button
              type="button"
              className="link"
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr('') }}
            >
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
