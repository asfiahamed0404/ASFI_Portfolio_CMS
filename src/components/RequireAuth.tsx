import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.png'
import '../styles/admin.css'
import '../styles/admin-editorial.css'

function AccessScreen({ title, loading = false, children }: { title: string; loading?: boolean; children?: ReactNode }) {
  return (
    <main className="admin-access-screen">
      <div className="admin-access-card" aria-busy={loading}>
        <img className="admin-access-logo" src={logo} alt="Asfi Ahamed" width={62} height={62} />
        <p className="admin-access-eyebrow">PORTFOLIO STUDIO</p>
        <h1>{title}</h1>
        {children}
        {loading && <div className="admin-access-progress" role="status" aria-label="Verifying your session" />}
      </div>
    </main>
  )
}

interface AdminResolution {
  userId: string
  isAdmin: boolean
  error: string | null
}

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth()
  const [resolved, setResolved] = useState<AdminResolution | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    const checkAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()

        if (cancelled) return

        setResolved({
          userId,
          isAdmin: !error && data?.role === 'admin',
          error: error ? error.message || 'Failed to verify admin access' : null,
        })
      } catch {
        if (!cancelled) {
          setResolved({ userId, isAdmin: false, error: 'Failed to verify admin access' })
        }
      }
    }

    void checkAdmin()

    return () => {
      cancelled = true
    }
  }, [userId])

  const handleUnauthorizedSignOut = async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    setSignOutError(null)

    const { error } = await logout()
    if (error) {
      setSignOutError(error.message)
      setIsSigningOut(false)
    }
  }

  if (loading) {
    return (
      <AccessScreen title="Opening your studio." loading><p>Checking your session…</p></AccessScreen>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!resolved || resolved.userId !== user.id) {
    return (
      <AccessScreen title="One moment." loading><p>Verifying your admin access…</p></AccessScreen>
    )
  }

  if (resolved.error) {
    return (
      <AccessScreen title="Unable to verify access.">
        <p role="alert">{resolved.error}</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={() => window.location.reload()}>Try again</button>
      </AccessScreen>
    )
  }

  if (!resolved.isAdmin) {
    return (
      <AccessScreen title="Admin access required.">
        <p>This account is not authorized to access the studio.</p>
        {signOutError && <p className="admin-error-title" role="alert">{signOutError}</p>}
        <button
          type="button"
          onClick={handleUnauthorizedSignOut}
          disabled={isSigningOut}
          className="admin-btn admin-btn-primary"
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </AccessScreen>
    )
  }

  return <>{children}</>
}
