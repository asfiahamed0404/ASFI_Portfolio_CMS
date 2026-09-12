import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'
import '../styles/login.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type LoginErrorField = 'email' | 'password' | null

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login, loading: authLoading, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errorField, setErrorField] = useState<LoginErrorField>(null)

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/admin', { replace: true })
    }
  }, [user, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || authLoading) return
    setFormError(null)
    setErrorField(null)

    if (!email.trim()) {
      const message = 'Enter your email address.'
      setFormError(message)
      setErrorField('email')
      toast.error('Please fill in all fields')
      return
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      const message = 'Enter a valid email address.'
      setFormError(message)
      setErrorField('email')
      toast.error(message)
      return
    }

    if (!password) {
      const message = 'Enter your password.'
      setFormError(message)
      setErrorField('password')
      toast.error('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await login(email.trim(), password)
      if (error) throw error
      toast.success('Welcome back!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-screen">
      <aside className="login-story" aria-labelledby="login-story-title">
        <Link to="/" className="login-brand" aria-label="Asfi Ahamed — back to portfolio">
          <img className="login-logo" src={logo} alt="" width={48} height={48} />
          <span><strong>Asfi Ahamed</strong><span>PORTFOLIO STUDIO</span></span>
        </Link>
        <div className="login-story-copy">
          <p className="login-story-eyebrow"><span aria-hidden="true" /> THE SPACE BEHIND THE WORK</p>
          <h2 id="login-story-title">Keep building.<br /><em>Keep becoming.</em></h2>
          <p>Your projects, your story, and everything that comes next. All in one place.</p>
          <div className="login-story-index" aria-hidden="true"><span>01 / PROJECTS</span><span>02 / CONTENT</span><span>03 / IDENTITY</span></div>
        </div>
        <div className="login-story-footer"><span>ASFI AHAMED<br /><strong>A portfolio in progress.</strong></span><ArrowUpRight size={48} strokeWidth={1} aria-hidden="true" /></div>
      </aside>
      <div className="login-form-side">
      <section
        className="login-card"
        aria-labelledby="login-title"
        aria-describedby="login-description"
      >
        <header className="login-header">
          <p className="login-security-note"><ShieldCheck size={15} aria-hidden="true" /> ADMIN ACCESS</p>

          <div className="login-heading">
            <h1 id="login-title" className="login-title">Welcome back<span>.</span></h1>
            <p id="login-description" className="login-description">
              Sign in to manage your portfolio content.
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="login-form"
          noValidate
          aria-busy={isSubmitting || authLoading}
        >
          <div className="login-field">
            <label htmlFor="login-email" className="login-label">Email address</label>
            <div className="login-input-control">
              <Mail size={18} aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (formError) {
                    setFormError(null)
                    setErrorField(null)
                  }
                }}
                className="login-input"
                placeholder="Email address"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                disabled={isSubmitting}
                aria-invalid={errorField === 'email'}
                aria-describedby={errorField === 'email' ? 'login-error' : undefined}
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="login-password" className="login-label">Password</label>
            <div className="login-input-control login-password-control">
              <Lock size={18} aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (formError) {
                    setFormError(null)
                    setErrorField(null)
                  }
                }}
                className="login-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                aria-invalid={errorField === 'password'}
                aria-describedby={errorField === 'password' ? 'login-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="login-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {formError && (
            <div id="login-error" className="login-error" role="alert">
              <span className="login-error-mark" aria-hidden="true">!</span>
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || authLoading}
            className="login-submit"
          >
            {isSubmitting && <span className="login-spinner" aria-hidden="true" />}
            <span>{isSubmitting ? 'Signing in…' : authLoading ? 'Checking session…' : 'Enter your studio'}</span>
            {!isSubmitting && <ArrowUpRight size={19} aria-hidden="true" />}
          </button>

          <span className="login-live-status" aria-live="polite" aria-atomic="true">
            {isSubmitting ? 'Signing in to the admin dashboard.' : ''}
          </span>
        </form>

        <Link to="/" className="login-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to portfolio
        </Link>
      </section>
      <p className="login-form-footer">Asfi Ahamed / Portfolio administration</p>
      </div>
    </main>
  )
}
