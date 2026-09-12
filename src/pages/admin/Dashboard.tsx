import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Award,
  ArrowUpRight,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Code2,
  FileText,
  GraduationCap,
  Heart,
  Link2,
  RefreshCw,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import {
  getAppreciationStats,
  getCertificates,
  getEducation,
  getExperience,
  getProjects,
  getSkills,
  getSocials,
  type AppreciationStats,
} from '../../lib/supabase'

interface ContentStat {
  title: string
  getFn: () => Promise<unknown[]>
  icon: LucideIcon
  to: string
}

const contentStats: ContentStat[] = [
  { title: 'Projects', getFn: getProjects, icon: Briefcase, to: '/admin/projects' },
  { title: 'Skills', getFn: getSkills, icon: Code2, to: '/admin/skills' },
  { title: 'Education', getFn: getEducation, icon: GraduationCap, to: '/admin/education' },
  { title: 'Experience', getFn: getExperience, icon: FileText, to: '/admin/experience' },
  { title: 'Certificates', getFn: getCertificates, icon: Award, to: '/admin/certificates' },
  { title: 'Social Links', getFn: getSocials, icon: Link2, to: '/admin/socials' },
]

const appreciationMetrics = [
  { key: 'today', label: 'Today', icon: CalendarDays },
  { key: 'thisWeek', label: 'This week', icon: CalendarRange },
  { key: 'thisMonth', label: 'This month', icon: CalendarCheck },
  { key: 'total', label: 'All time', icon: Heart },
] as const

export default function AdminDashboard() {
  const [appreciationStats, setAppreciationStats] = useState<AppreciationStats | null>(null)
  const [appreciationLoading, setAppreciationLoading] = useState(true)
  const [appreciationError, setAppreciationError] = useState<string | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  const handleAppreciationRetry = async () => {
    setAppreciationLoading(true)
    setAppreciationError(null)

    try {
      const stats = await getAppreciationStats()
      setAppreciationStats(stats)
    } catch (error) {
      setAppreciationStats(null)
      setAppreciationError(
        error instanceof Error ? error.message : 'Failed to load appreciation stats',
      )
    } finally {
      setAppreciationLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    getAppreciationStats()
      .then((stats) => {
        if (mounted) setAppreciationStats(stats)
      })
      .catch((error) => {
        if (!mounted) return
        setAppreciationError(
          error instanceof Error ? error.message : 'Failed to load appreciation stats',
        )
      })
      .finally(() => {
        if (mounted) setAppreciationLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="admin-page admin-dashboard">
      <AdminPageHeader
        eyebrow="Workspace / Overview"
        title="Your portfolio, at a glance."
        description="Manage your content and see how visitors respond to your work."
        actions={(
          <Link to="/admin/projects" className="admin-primary-action">
            <span>Manage projects</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        )}
      />

      <div className="admin-overview-label"><span>YOUR CONTENT</span><span>Select a collection to edit</span></div>

      <section className="admin-dashboard-counts" aria-label="Content overview">
        {contentStats.map((stat) => (
          <ContentStatCard key={stat.title} {...stat} />
        ))}
      </section>

      <section
        className="admin-dashboard-section"
        aria-labelledby="admin-appreciation-title"
        aria-busy={appreciationLoading}
      >
        <div className="admin-dashboard-section-heading">
          <h2 id="admin-appreciation-title" className="admin-dashboard-section-title">
            <Heart size={16} aria-hidden="true" />
            A little appreciation.
          </h2>
          <span className="admin-chart-subtitle">Visitor appreciation activity</span>
        </div>

        {appreciationLoading && (
          <div className="admin-dashboard-message" role="status">
            Loading appreciation statistics…
          </div>
        )}

        {appreciationError && !appreciationLoading && (
          <div
            className="admin-dashboard-message admin-dashboard-message-error"
            role="alert"
            title={appreciationError}
          >
            <span>Appreciation statistics are unavailable.</span>
            <button
              type="button"
              className="admin-secondary-action"
              onClick={() => void handleAppreciationRetry()}
            >
              <RefreshCw size={14} aria-hidden="true" />
              Retry
            </button>
          </div>
        )}

        {appreciationStats && !appreciationLoading && !appreciationError && (
          <div className="admin-dashboard-analytics">
            <dl className="admin-appreciation-grid" aria-label="Appreciation totals">
              {appreciationMetrics.map(({ key, label, icon: Icon }) => (
                <div key={key} className="admin-appreciation-card">
                  <dt className="admin-appreciation-card-label">
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </dt>
                  <dd className="admin-appreciation-card-value">{appreciationStats[key]}</dd>
                </div>
              ))}
            </dl>

            <article className="admin-chart-panel" aria-labelledby="admin-chart-title">
              <div className="admin-chart-header">
                <div>
                  <h3 id="admin-chart-title" className="admin-chart-title">
                    30-day activity
                  </h3>
                  <p className="admin-chart-subtitle">Daily appreciation totals</p>
                </div>
                <span className="admin-dashboard-section-title" aria-hidden="true">
                  <TrendingUp size={15} />
                </span>
              </div>

              <div className="admin-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={appreciationStats.dailyCounts}
                    margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                    accessibilityLayer
                  >
                    <defs>
                      <linearGradient id="adminAppreciationGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#86a852" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#86a852" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e5d9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: '#6b7360', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatShortDate}
                      interval="preserveStartEnd"
                      minTickGap={38}
                    />
                    <YAxis
                      tick={{ fill: '#6b7360', fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#fffef9',
                        border: '1px solid #d4d8ca',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(34,38,30,0.08)',
                        color: '#28351e',
                        fontSize: 12,
                      }}
                      cursor={{ stroke: '#8fa773', strokeWidth: 1 }}
                      labelFormatter={(label) => formatLongDate(String(label))}
                      formatter={(value) => [String(value), 'Appreciations']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#65833e"
                      strokeWidth={2}
                      fill="url(#adminAppreciationGradient)"
                      isAnimationActive={!prefersReducedMotion}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>
        )}
      </section>
    </div>
  )
}

function ContentStatCard({ title, getFn, icon: Icon, to }: ContentStat) {
  const [count, setCount] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let mounted = true

    getFn()
      .then((data) => {
        if (!mounted) return
        setCount(Array.isArray(data) ? data.length : 0)
      })
      .catch(() => {
        if (mounted) setHasError(true)
      })

    return () => {
      mounted = false
    }
  }, [getFn])

  const accessibleValue = hasError ? 'Unavailable' : count === null ? 'Loading' : count

  return (
    <Link className="admin-stat-card" to={to} aria-label={`${title}: ${accessibleValue}`}>
      <span className="admin-stat-card-top">
        <span className="admin-stat-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="admin-stat-label">{title}</span>
        <ArrowUpRight className="admin-stat-arrow" size={16} aria-hidden="true" />
      </span>
      <span className="admin-stat-value" aria-live="polite">
        {count ?? '—'}
      </span>
    </Link>
  )
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function formatLongDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}
