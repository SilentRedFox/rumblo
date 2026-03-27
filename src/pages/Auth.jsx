import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sb } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './Auth.module.css'

export default function Auth() {
  const [tab, setTab] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { loadUserData } = useAuth()
  const [signinForm, setSigninForm] = useState({ email: '', password: '' })
  const [signupForm, setSignupForm] = useState({ username: '', email: '', password: '' })

  async function handleSignIn(e) {
    e.preventDefault(); setError(''); setLoading(true)
    const { data, error } = await sb.auth.signInWithPassword(signinForm)
    if (error) { setError(error.message); setLoading(false); return }
    await loadUserData(data.user)
    navigate('/')
  }

  async function handleSignUp(e) {
    e.preventDefault(); setError('')
    const { username, email, password } = signupForm
    if (!username || !email || !password) { setError('Please fill in all fields.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (!/^[a-z0-9_]+$/.test(username)) { setError('Username: letters, numbers, underscores only.'); return }
    setLoading(true)
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { username, full_name: username } } })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) { await loadUserData(data.user); navigate('/') }
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.logo}>rumblo</div>
        <p>Daily challenges. Every day.</p>
      </div>
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'signin' ? styles.active : ''}`} onClick={() => { setTab('signin'); setError('') }}>Sign in</button>
          <button className={`${styles.tab} ${tab === 'signup' ? styles.active : ''}`} onClick={() => { setTab('signup'); setError('') }}>Create account</button>
        </div>
        {tab === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <div className={styles.field}><label>Email</label><input type="email" placeholder="you@example.com" value={signinForm.email} onChange={e => setSigninForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className={styles.field}><label>Password</label><input type="password" placeholder="••••••••" value={signinForm.password} onChange={e => setSigninForm(f => ({ ...f, password: e.target.value }))} /></div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className={styles.field}><label>Username</label><input type="text" placeholder="yourname" value={signupForm.username} onChange={e => setSignupForm(f => ({ ...f, username: e.target.value.toLowerCase() }))} /></div>
            <div className={styles.field}><label>Email</label><input type="email" placeholder="you@example.com" value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className={styles.field}><label>Password</label><input type="password" placeholder="Min 6 characters" value={signupForm.password} onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))} /></div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className={styles.btnPrimary} disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
          </form>
        )}
      </div>
    </div>
  )
}