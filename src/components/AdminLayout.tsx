import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Award,
  ArrowUpRight,
  Briefcase,
  Code2,
  FileText,
  Globe,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.png'
import '../styles/admin.css'
import '../styles/admin-editorial.css'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/projects', label: 'Projects', icon: Briefcase },
  { to: '/admin/skills', label: 'Skills', icon: Code2 },
  { to: '/admin/education', label: 'Education', icon: GraduationCap },
  { to: '/admin/experience', label: 'Experience', icon: FileText },
  { to: '/admin/certificates', label: 'Certificates', icon: Award },
  { to: '/admin/site-content', label: 'Site Content', icon: Layers },
  { to: '/admin/branding', label: 'Branding', icon: Globe },
  { to: '/admin/socials', label: 'Socials', icon: Link2 },
]

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileDrawerRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const currentSection = navItems.find(item => item.to === pathname)?.label ?? 'Dashboard'

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const closeMobileNavigation = () => setIsOpen(false)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement as HTMLElement | null
    const menuButton = menuButtonRef.current
    document.body.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      mobileDrawerRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileNavigation()
        return
      }

      if (event.key !== 'Tab' || !mobileDrawerRef.current) return
      const focusable = Array.from(
        mobileDrawerRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      )

      if (focusable.length === 0) {
        event.preventDefault()
        mobileDrawerRef.current.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const handleResize = () => {
      if (window.innerWidth > 900) closeMobileNavigation()
    }

    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      document.body.style.overflow = previousOverflow
      ;(previousFocus ?? menuButton)?.focus()
    }
  }, [isOpen])

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    closeMobileNavigation()

    const { error } = await logout()
    if (error) {
      toast.error(error.message)
      setIsLoggingOut(false)
    } else {
      toast.success('Logged out')
    }
  }

  const renderSidebar = (mobile = false) => (
    <aside className="admin-sidebar" aria-label={mobile ? 'Mobile admin navigation' : 'Admin navigation'}>
      <div className="admin-sidebar-brand">
        <span className="admin-sidebar-brand-mark" aria-hidden="true">
          <img src={logo} alt="" width={32} height={32} className="admin-sidebar-logo" />
        </span>
        <div className="admin-sidebar-brand-copy">
          <div className="admin-sidebar-title">Asfi Ahamed</div>
          <div className="admin-sidebar-subtitle">PORTFOLIO STUDIO</div>
        </div>

        {mobile ? (
          <button
            type="button"
            onClick={closeMobileNavigation}
            className="admin-sidebar-collapse admin-sidebar-close"
            aria-label="Close admin navigation"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsCollapsed((collapsed) => !collapsed)}
            className="admin-sidebar-collapse"
            aria-label={isCollapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
            aria-pressed={isCollapsed}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={17} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={17} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <nav className="admin-nav" aria-label="Admin sections">
        {navItems.map((item, index) => (
          <Fragment key={item.to}>
            {[0, 1, 6].includes(index) && (
              <p className="admin-nav-label">{index === 0 ? 'Workspace' : index === 1 ? 'Portfolio' : 'Settings'}</p>
            )}
            <NavLink
              to={item.to}
              end={item.to === '/admin'}
              onClick={closeMobileNavigation}
              className={({ isActive }) => `admin-nav-link${isActive ? ' admin-nav-link-active' : ''}`}
              aria-label={!mobile && isCollapsed ? item.label : undefined}
              title={!mobile && isCollapsed ? item.label : undefined}
            >
              <item.icon size={18} aria-hidden="true" />
              <span className="admin-sidebar-label">{item.label}</span>
              <span className="admin-nav-indicator" aria-hidden="true" />
            </NavLink>
          </Fragment>
        ))}
      </nav>

      <div className="admin-sidebar-actions">
        <Link
          to="/"
          onClick={closeMobileNavigation}
          className="admin-nav-link"
          aria-label={!mobile && isCollapsed ? 'View Site' : undefined}
          title={!mobile && isCollapsed ? 'View Site' : undefined}
        >
          <Globe size={18} aria-hidden="true" />
          <span className="admin-sidebar-label">View Site</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="admin-nav-link admin-nav-link-danger"
          disabled={isLoggingOut}
          aria-label={!mobile && isCollapsed ? 'Logout' : undefined}
          title={!mobile && isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} aria-hidden="true" />
          <span className="admin-sidebar-label">{isLoggingOut ? 'Logging out…' : 'Logout'}</span>
        </button>
        <div className="admin-sidebar-owner">
          <span className="admin-owner-avatar" aria-hidden="true">AA</span>
          <span className="admin-sidebar-label"><strong>Asfi Ahamed</strong><span>Portfolio administrator</span></span>
        </div>
      </div>
    </aside>
  )

  return (
    <div className={`admin-shell${isCollapsed ? ' admin-shell-collapsed' : ''}`}>
      <a href="#admin-main-content" className="admin-skip-link">
        Skip to main content
      </a>

      <header className="admin-mobile-topbar">
        <Link to="/admin" className="admin-mobile-brand" aria-label="Admin dashboard">
          <span className="admin-sidebar-brand-mark" aria-hidden="true">
            <img src={logo} alt="" width={30} height={30} className="admin-sidebar-logo" />
          </span>
          <span>Portfolio Studio</span>
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="admin-menu-button"
          aria-label={isOpen ? 'Close admin navigation' : 'Open admin navigation'}
          aria-expanded={isOpen}
          aria-controls="admin-mobile-navigation"
        >
          {isOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      </header>

      <div className="admin-desktop-sidebar">{renderSidebar()}</div>

      {isOpen && (
        <>
          <div
            className="admin-mobile-overlay"
            aria-hidden="true"
            onMouseDown={closeMobileNavigation}
          />
          <div
            ref={mobileDrawerRef}
            id="admin-mobile-navigation"
            className="admin-mobile-sidebar"
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            tabIndex={-1}
          >
            {renderSidebar(true)}
          </div>
        </>
      )}

      <main ref={mainRef} id="admin-main-content" className="admin-main" tabIndex={-1}>
        <div className="admin-workspace-header">
          <nav className="admin-breadcrumb" aria-label="Breadcrumb">
            <Link to="/admin">Studio</Link><span aria-hidden="true">/</span><span aria-current="page">{currentSection}</span>
          </nav>
          <Link to="/" target="_blank" rel="noopener noreferrer" className="admin-preview-link">View portfolio <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </div>
        <div className="admin-workspace-content"><Outlet /></div>
      </main>
    </div>
  )
}
