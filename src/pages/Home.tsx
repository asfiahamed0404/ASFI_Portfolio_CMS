import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react'
import { motion, useReducedMotion, type MotionProps } from 'framer-motion'
import {
  ArrowDown,
  ArrowUpRight,
  BriefcaseBusiness,
  Code2,
  Database,
  Download,
  ExternalLink,
  GraduationCap,
  Landmark,
  Layers3,
  Mail,
  MapPin,
  Menu,
  Phone,
  RefreshCw,
  Send,
  Workflow,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import Portrait from '../components/Portrait'
import ProjectDiagram from '../components/ProjectDiagram'
import BackToTop from '../components/BackToTop'
import SectionHeading from '../components/SectionHeading'
import CertificatesSection from '../components/sections/CertificatesSection'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { removeAppreciation, submitAppreciation } from '../lib/supabase'
import type { Project, SiteContent, Skill, Social } from '../lib/supabase'
import '../styles/editorial.css'

const VISITOR_KEY = 'asfi_visitor_id'
const APPRECIATED_KEY = 'asfi_appreciated'
const SECTION_EASE = [0.23, 1, 0.32, 1] as const
const NAV_ACTIVATION_GAP = 16

const ABOUT_FOCUS_AREAS = [
  {
    title: 'Machine learning workflows',
    description: 'From document search to viewership forecasting: preparing data, building models, and connecting them to useful applications.',
    icon: Workflow,
  },
  {
    title: 'Full-stack applications',
    description: 'Connected experiences with real-time messaging, content management, and the APIs that keep them running.',
    icon: Layers3,
  },
] as const

const ABOUT_METADATA = [
  { label: 'CSE', icon: GraduationCap },
  { label: 'Software Engineering', icon: Code2 },
  { label: 'Data Science & Engineering', icon: Database },
  { label: 'University of Moratuwa', icon: Landmark },
] as const

const getSectionMotion = (shouldReduceMotion: boolean): MotionProps => shouldReduceMotion
  ? { initial: false }
  : {
      initial: { opacity: 0, y: 22 },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: '-80px', amount: 0.12 },
      transition: { duration: 0.52, ease: SECTION_EASE },
    }

const isNotEmpty = (value: unknown) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

const hasAboutContent = (content: SiteContent | null) => Boolean(
  content && [
    content.about_text,
    content.about_paragraph1,
    content.about_paragraph2,
    content.about_paragraph3,
  ].some(isNotEmpty),
)

const hasHeroContent = (content: SiteContent | null) => Boolean(
  content && [content.hero_title, content.hero_subtitle, content.hero_status].some(isNotEmpty),
)

const getValidSocials = (socials: Social[]) => socials.filter((social) => isNotEmpty(social.href))

const getScrollBehavior = (): ScrollBehavior => (
  window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
)

const getDocumentOffsetTop = (element: HTMLElement) => {
  let offsetTop = 0
  let currentElement: HTMLElement | null = element

  while (currentElement) {
    offsetTop += currentElement.offsetTop
    currentElement = currentElement.offsetParent as HTMLElement | null
  }

  return offsetTop
}

const SocialIcon: FC<{ label: string }> = ({ label }) => {
  const normalizedLabel = label.toLowerCase()

  if (normalizedLabel.includes('github')) {
    return (
      <svg className="pp-social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.1.8-.25.8-.56v-2.02c-3.26.71-3.95-1.4-3.95-1.4-.53-1.36-1.3-1.72-1.3-1.72-1.07-.73.08-.72.08-.72 1.18.08 1.8 1.22 1.8 1.22 1.05 1.79 2.76 1.27 3.43.97.1-.76.41-1.27.75-1.56-2.6-.3-5.34-1.3-5.34-5.8 0-1.28.46-2.33 1.21-3.15-.12-.3-.52-1.5.12-3.1 0 0 .98-.32 3.22 1.2A11.1 11.1 0 0 1 12 5.87c.99 0 1.98.13 2.91.39 2.23-1.52 3.22-1.2 3.22-1.2.64 1.6.24 2.8.12 3.1.75.82 1.2 1.87 1.2 3.15 0 4.51-2.74 5.5-5.35 5.8.42.36.8 1.08.8 2.18v3.05c0 .31.2.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    )
  }

  if (normalizedLabel.includes('linkedin')) {
    return (
      <svg className="pp-social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.44-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.54V9H7.1v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C24 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
      </svg>
    )
  }

  if (normalizedLabel.includes('email') || normalizedLabel.includes('mail')) {
    return <Mail size={17} aria-hidden="true" />
  }

  return <ExternalLink size={17} aria-hidden="true" />
}

function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

const HeartButton: FC = () => {
  const [appreciated, setAppreciated] = useState(() => localStorage.getItem(APPRECIATED_KEY) === '1')
  const [loading, setLoading] = useState(false)

  const handleToggle = useCallback(async () => {
    if (loading) return
    setLoading(true)

    try {
      const visitorId = getVisitorId()
      if (appreciated) {
        await removeAppreciation(visitorId)
        localStorage.setItem(APPRECIATED_KEY, '0')
        setAppreciated(false)
      } else {
        await submitAppreciation(visitorId)
        localStorage.setItem(APPRECIATED_KEY, '1')
        setAppreciated(true)
        toast.success('Thanks for appreciating my work!', { duration: 3000 })
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [appreciated, loading])

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`pp-icon-button ${appreciated ? 'pp-icon-button-active' : ''}`}
      aria-label={appreciated ? 'Remove appreciation' : 'Appreciate this portfolio'}
      aria-pressed={appreciated}
      title={appreciated ? 'Remove appreciation' : 'Appreciate this portfolio'}
    >
      <span aria-hidden="true">{appreciated ? '♥' : '♡'}</span>
    </button>
  )
}

interface NavProps {
  hasAbout: boolean
  hasBackground: boolean
  hasProjects: boolean
  hasSkills: boolean
  hasCertificates: boolean
  hasContact: boolean
  resumeUrl: string
}

const Nav: FC<NavProps> = ({
  hasAbout,
  hasBackground,
  hasProjects,
  hasSkills,
  hasCertificates,
  hasContact,
  resumeUrl,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const pendingSectionRef = useRef<string | null>(null)

  const navLinks = useMemo(() => [
    { label: 'Projects', href: '#projects', show: hasProjects },
    { label: 'About', href: '#about', show: hasAbout },
    { label: 'Journey', href: '#education', show: hasBackground },
    { label: 'Toolkit', href: '#skills', show: hasSkills },
    { label: 'Certificates', href: '#certificates', show: hasCertificates },
    { label: 'Contact', href: '#contact', show: hasContact },
  ].filter((link) => link.show), [hasAbout, hasBackground, hasCertificates, hasContact, hasProjects, hasSkills])

  useEffect(() => {
    let animationFrame: number | null = null

    const updateActiveSection = () => {
      animationFrame = null
      const activationLine = (navRef.current?.getBoundingClientRect().height ?? 68) + NAV_ACTIVATION_GAP
      const atPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      const pendingSection = pendingSectionRef.current

      if (pendingSection) {
        const pendingTarget = document.querySelector<HTMLElement>(pendingSection)
        const targetReached = pendingTarget
          ? getDocumentOffsetTop(pendingTarget) - window.scrollY <= activationLine + 2
          : true

        if (!targetReached && !atPageBottom) {
          setActiveSection((current) => current === pendingSection ? current : pendingSection)
          return
        }
        pendingSectionRef.current = null
      }

      let nextSection = ''
      for (const link of navLinks) {
        const section = document.querySelector<HTMLElement>(link.href)
        if (!section) continue
        if (getDocumentOffsetTop(section) - window.scrollY <= activationLine + 1) nextSection = link.href
        else break
      }

      if (atPageBottom && navLinks.length > 0) nextSection = navLinks[navLinks.length - 1].href
      setActiveSection((current) => current === nextSection ? current : nextSection)
    }

    const requestUpdate = () => {
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(updateActiveSection)
    }

    const cancelPendingNavigation = () => {
      if (!pendingSectionRef.current) return
      pendingSectionRef.current = null
      requestUpdate()
    }

    updateActiveSection()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    window.addEventListener('wheel', cancelPendingNavigation, { passive: true })
    window.addEventListener('touchstart', cancelPendingNavigation, { passive: true })
    window.addEventListener('keydown', cancelPendingNavigation)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      window.removeEventListener('wheel', cancelPendingNavigation)
      window.removeEventListener('touchstart', cancelPendingNavigation)
      window.removeEventListener('keydown', cancelPendingNavigation)
      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame)
    }
  }, [navLinks])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const scrollTo = (selector: string) => {
    const target = document.querySelector<HTMLElement>(selector)
    if (!target) return

    const activationLine = (navRef.current?.getBoundingClientRect().height ?? 68) + NAV_ACTIVATION_GAP
    pendingSectionRef.current = selector
    setActiveSection(selector)
    window.scrollTo({
      top: Math.max(0, getDocumentOffsetTop(target) - activationLine),
      behavior: getScrollBehavior(),
    })
    setIsOpen(false)
  }

  const navItems = navLinks.map((link) => (
    <button
      key={link.href}
      type="button"
      onClick={() => scrollTo(link.href)}
      className={`pp-nav-link ${activeSection === link.href ? 'pp-nav-link-active' : ''}`}
      aria-current={activeSection === link.href ? 'location' : undefined}
    >
      {link.label}
    </button>
  ))

  return (
    <nav ref={navRef} className="pp-nav" aria-label="Primary navigation">
      <div className="pp-nav-inner">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: getScrollBehavior() })}
          className="pp-brand"
          aria-label="Back to top"
        >
          <span className="pp-brand-mark" aria-hidden="true">
            a<span>.</span>
          </span>
          <span className="pp-brand-copy">
            <strong>Asfi Ahamed</strong>
            <span>Engineering & applied AI</span>
          </span>
        </button>

        <div className="pp-nav-links">{navItems}</div>

        <div className="pp-nav-actions">
          <HeartButton />
          <a href={resumeUrl} download="Asfi_Ahamed_CV.pdf" className="pp-nav-resume">
            <Download size={15} aria-hidden="true" />
            Resume
          </a>
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="pp-menu-button"
            aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isOpen}
            aria-controls="portfolio-mobile-menu"
          >
            {isOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="portfolio-mobile-menu" className="pp-mobile-menu">
          {navItems}
          <a href={resumeUrl} download="Asfi_Ahamed_CV.pdf" className="pp-mobile-resume">
            <Download size={16} aria-hidden="true" />
            Download resume
          </a>
        </div>
      )}
    </nav>
  )
}

const ProjectCard: FC<{ project: Project; index: number; featured: boolean; shouldReduceMotion: boolean }> = ({
  project,
  index,
  featured,
  shouldReduceMotion,
}) => {
  const demoLink = project.demo || project.live_website
  const hasLinks = Boolean(project.github || demoLink)

  return (
    <motion.article
      className={`pp-project-card ${featured ? 'pp-project-featured' : ''}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={shouldReduceMotion ? { duration: 0 } : {
        duration: 0.42,
        delay: Math.min(index * 0.05, 0.2),
        ease: SECTION_EASE,
      }}
    >
      {project.image_url ? (
        <div className="pp-project-media">
          <img src={project.image_url} alt={project.title} loading="lazy" />
        </div>
      ) : <ProjectDiagram project={project} />}
      <div className="pp-project-body">
        <div className="pp-project-index"><span>PROJECT {String(index + 1).padStart(2, '0')}</span><span>{project.year}</span></div>
        <div className="pp-project-heading">
          <div>
            <h3>{project.title.includes('-') && !project.title.includes(' ') ? project.title.split('-').filter(Boolean).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : project.title}</h3>
          </div>
          {project.highlight && <span className="pp-project-highlight">{project.highlight}</span>}
        </div>
        <p className="pp-project-description">{project.description}</p>
        {(project.tech || []).length > 0 && (
          <ul className="pp-tech-list" aria-label="Technologies used">
            {(project.tech || []).map((tech) => <li key={tech}>{tech}</li>)}
          </ul>
        )}
        <div className="pp-project-links">
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer">
              Source code <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          )}
          {demoLink && (
            <a href={demoLink} target="_blank" rel="noopener noreferrer" className="pp-project-link-primary">
              {demoLink.includes('.gif') ? 'Watch walkthrough' : 'Explore project'} <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          )}
          {!hasLinks && <span className="pp-project-unavailable">Links unavailable</span>}
        </div>
      </div>
    </motion.article>
  )
}

const ProjectGallery: FC<{ projects: Project[]; shouldReduceMotion: boolean }> = ({ projects, shouldReduceMotion }) => {
  const [filter, setFilter] = useState('All projects')
  const ordered = useMemo(() => [...projects].sort((a, b) => Number(b.highlight?.toLowerCase() === 'featured') - Number(a.highlight?.toLowerCase() === 'featured')), [projects])
  const filtered = ordered.filter(project => filter === 'All projects' || (filter === 'Full stack'
    ? /full.stack|cms/i.test(project.highlight || '')
    : /python|langchain|scikit|lightgbm/i.test((project.tech || []).join(' '))))
  return (
    <section id="projects" className="pp-section pp-work-section">
      <div className="pp-container">
        <div className="pp-work-heading">
          <SectionHeading
            eyebrow="01 / Selected projects"
            title="Ideas, made real."
            subtitle="From machine learning pipelines to the products people interact with."
            icon={BriefcaseBusiness}
          />
          <span className="pp-work-count">({String(projects.length).padStart(2, '0')})</span>
        </div>
        <div className="pp-work-toolbar">
          <div className="pp-project-filters" role="group" aria-label="Filter projects">
            {['All projects', 'Full stack', 'AI & data'].map(label => (
              <button type="button" key={label} aria-pressed={filter === label} onClick={() => setFilter(label)}>
                {label}{filter === label && <span aria-hidden="true">↗</span>}
              </button>
            ))}
          </div>
          <span className="pp-work-caption" role="status">{filtered.length} projects / Explore the projects</span>
        </div>
        <div className="pp-projects">
          {filtered.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={ordered.findIndex(item => item.id === project.id)}
              featured={index === 0 || (filtered.length % 2 === 0 && index === filtered.length - 1)}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
        {filtered.length === 0 && <p className="pp-project-empty">No projects in this category yet.</p>}
      </div>
    </section>
  )
}

const PortfolioLoadingScreen: FC = () => (
  <main className="portfolio-public pp-loader-screen" aria-busy="true" aria-live="polite">
    <div className="pp-loader-ambient" aria-hidden="true" />
    <div className="pp-loader-grid" aria-hidden="true" />
    <span className="pp-loader-corner pp-loader-corner-top" aria-hidden="true" />
    <span className="pp-loader-corner pp-loader-corner-bottom" aria-hidden="true" />

    <div className="pp-loader-content" role="status">
      <div className="pp-loader-mark">
        <span className="pp-loader-ring" aria-hidden="true" />
        <span className="pp-loader-orbit pp-loader-orbit-cyan" aria-hidden="true" />
        <span className="pp-loader-orbit pp-loader-orbit-violet" aria-hidden="true" />
        <span className="pp-loader-orbit pp-loader-orbit-pink" aria-hidden="true" />
        <span className="pp-loader-logo">
          <span aria-label="Asfi Ahamed">a.</span>
        </span>
      </div>
      <p className="pp-loader-label">Asfi Ahamed</p>
      <h1>Loading portfolio</h1>
      <p className="pp-loader-description">Preparing the latest projects, skills, and portfolio content.</p>
      <div className="pp-loader-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="pp-loader-progress" aria-hidden="true"><span /></div>
      <span className="pp-sr-only">Loading portfolio content</span>
    </div>
  </main>
)

const PortfolioRetryScreen: FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <main className="portfolio-public pp-state-screen">
    <div className="pp-state-card" role="alert">
      <span className="pp-state-logo" aria-hidden="true">a.</span>
      <p className="pp-state-label">Portfolio unavailable</p>
      <h1>Could not load the portfolio</h1>
      <p>Please check your connection and try again.</p>
      <p className="pp-state-detail">{message}</p>
      <button type="button" onClick={onRetry} className="pp-button pp-button-primary">
        <RefreshCw size={16} aria-hidden="true" /> Retry
      </button>
    </div>
  </main>
)

interface PortfolioContentProps {
  onRetry: () => void
}

const PortfolioContent: FC<PortfolioContentProps> = ({ onRetry }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const shouldReduceMotion = Boolean(useReducedMotion())

  const {
    projects: { projects },
    skills: { skills },
    education: { education },
    experience: { experience },
    certificates: { certificates },
    siteContent: { content: siteContent },
    socials: { socials },
    loading: portfolioLoading,
    error: portfolioError,
  } = usePortfolioData()

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [portfolioError])

  if (portfolioLoading) return <PortfolioLoadingScreen />
  if (portfolioError) return <PortfolioRetryScreen message={portfolioError} onRetry={onRetry} />

  const hasProjects = projects.length > 0
  const hasSkills = skills.length > 0
  const hasEducation = education.length > 0
  const hasExperience = isNotEmpty(experience)
  const hasCertificates = certificates.length > 0
  const hasAbout = hasAboutContent(siteContent)
  const hasAboutNarrative = [
    siteContent?.about_paragraph1,
    siteContent?.about_paragraph2,
    siteContent?.about_paragraph3,
  ].some(isNotEmpty)
  const hasContact = isNotEmpty(siteContent?.contact_intro)
  const validSocials = getValidSocials(socials)
  const hasSocials = validSocials.length > 0
  const hasHero = hasHeroContent(siteContent)
  const showBackgroundSection = hasEducation || hasExperience
  const resumeUrl = siteContent?.resume_url || '/Asfi_CV.pdf'
  const heroTitle = siteContent?.hero_title?.trim() || 'Asfi Ahamed'
  const heroWords = heroTitle.split(/\s+/)

  const skillGroups = skills.reduce<Record<string, Skill[]>>((groups, skill) => {
    if (!groups[skill.category]) groups[skill.category] = []
    groups[skill.category].push(skill)
    return groups
  }, {})

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('muasfiahamed276@gmail.com')
      toast.success('Email copied to clipboard')
    } catch {
      toast.error('Could not copy. Email me at muasfiahamed276@gmail.com.')
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill out all fields')
      return
    }

    setIsSubmitting(true)
    const subject = encodeURIComponent(`Portfolio Inquiry from ${formData.name}`)
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)
    window.location.href = `mailto:muasfiahamed276@gmail.com?subject=${subject}&body=${body}`

    window.setTimeout(() => {
      toast.success('Opening your email client...')
      setIsSubmitting(false)
    }, 800)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <div className="portfolio-public">
      <a className="pp-skip-link" href="#portfolio-content">Skip to content</a>
      <Nav
        hasAbout={hasAbout}
        hasBackground={showBackgroundSection}
        hasProjects={hasProjects}
        hasSkills={hasSkills}
        hasCertificates={hasCertificates}
        hasContact={hasContact}
        resumeUrl={resumeUrl}
      />

      <main id="portfolio-content">
        {hasHero && (
          <section className="pp-hero" aria-labelledby="portfolio-title">
            <div className="pp-container pp-hero-topline"><span><span className="pp-status-dot" /> 3RD YEAR</span><span>SRI LANKA <ArrowUpRight size={13} aria-hidden="true" /></span></div>
            <div className="pp-container pp-hero-grid">
              <div className="pp-hero-heading">
                <p className="pp-hero-intro">Curious mind. Engineer at heart.</p>
                {isNotEmpty(siteContent?.hero_status) && (
                  <p className="pp-hero-status"><span aria-hidden="true" />{siteContent?.hero_status}</p>
                )}
                <h1 id="portfolio-title" className={heroWords.length > 2 ? 'pp-hero-long-title' : undefined}>
                  {heroWords.length > 2 ? heroTitle : heroWords.map((word, index) => (
                    <span key={`${word}-${index}`}>{word}{index === heroWords.length - 1 && <span className="pp-name-dot">.</span>}</span>
                  ))}
                </h1>
              </div>

              <div className="pp-portrait">
                <Portrait />
              </div>

              <div className="pp-hero-details">
                {isNotEmpty(siteContent?.hero_subtitle) && (
                  <div
                    className="pp-hero-subtitle"
                    dangerouslySetInnerHTML={{ __html: siteContent?.hero_subtitle || '' }}
                  />
                )}
                <div className="pp-hero-actions">
                  {hasProjects && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: getScrollBehavior() })}
                      className="pp-button pp-button-primary"
                    >
                      Explore my projects <ArrowDown size={17} aria-hidden="true" />
                    </button>
                  )}
                  {hasContact && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: getScrollBehavior() })}
                      className="pp-button pp-button-secondary"
                    >
                      Let's talk <ArrowUpRight size={17} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {hasSocials && (
                  <div className="pp-socials" aria-label="Social profiles">
                    {validSocials.map((social) => (
                      <a
                        key={social.id || social.href}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        data-social={social.label.toLowerCase()}
                      >
                        <SocialIcon label={social.label} />
                        <span>{social.label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="pp-container pp-hero-bottom"><span>COMPUTER SCIENCE & ENGINEERING<br /><strong>University of Moratuwa</strong></span><a href={hasProjects ? '#projects' : '#about'} className="pp-scroll-cue"><span>SCROLL TO DISCOVER</span><ArrowDown size={17} aria-hidden="true" /></a></div>
          </section>
        )}

        {hasProjects && <ProjectGallery projects={projects} shouldReduceMotion={shouldReduceMotion} />}

        {hasAbout && (
          <motion.section
            id="about"
            className="pp-section pp-section-muted pp-about-section"
            {...getSectionMotion(shouldReduceMotion)}
          >
            <div className="pp-container pp-about-container">
              <div className="pp-about-layout">
                <div className="pp-about-content">
                  <SectionHeading
                    eyebrow="02 / A little about me"
                    title="A builder. Always a learner."
                    icon={Code2}
                  />
                  {isNotEmpty(siteContent?.about_text) && (
                    <div
                      className="pp-about-lead"
                      dangerouslySetInnerHTML={{ __html: siteContent?.about_text || '' }}
                    />
                  )}
                  {hasAboutNarrative && (
                    <div className="pp-about-narrative">
                      {isNotEmpty(siteContent?.about_paragraph1) && (
                        <p dangerouslySetInnerHTML={{ __html: siteContent?.about_paragraph1 || '' }} />
                      )}
                      {isNotEmpty(siteContent?.about_paragraph2) && (
                        <p dangerouslySetInnerHTML={{ __html: siteContent?.about_paragraph2 || '' }} />
                      )}
                      {isNotEmpty(siteContent?.about_paragraph3) && (
                        <p dangerouslySetInnerHTML={{ __html: siteContent?.about_paragraph3 || '' }} />
                      )}
                    </div>
                  )}
                </div>

                <aside className="pp-about-focus-card" aria-labelledby="about-focus-title">
                  <p className="pp-focus-label">THE INTERSECTION I WORK IN</p>
                  <h3 id="about-focus-title">Systems thinking.<br /><em>Human perspective.</em></h3>
                  <div className="pp-about-focus-list">
                    {ABOUT_FOCUS_AREAS.map((area, index) => {
                      const Icon = area.icon
                      return (
                        <motion.div
                          key={area.title}
                          className="pp-about-focus-row"
                          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: '-30px' }}
                          transition={shouldReduceMotion ? { duration: 0 } : {
                            duration: 0.38,
                            delay: index * 0.07,
                            ease: SECTION_EASE,
                          }}
                        >
                          <span className="pp-about-focus-icon" aria-hidden="true"><Icon size={24} /></span>
                          <span className="pp-about-focus-copy">
                            <strong>{area.title}</strong>
                            <span>{area.description}</span>
                          </span>
                          <span className="pp-about-focus-status" aria-hidden="true" />
                        </motion.div>
                      )
                    })}
                  </div>
                </aside>

                <ul className="pp-about-metadata" aria-label="Academic and technical profile">
                  {ABOUT_METADATA.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.label}>
                        <span className="pp-about-metadata-icon" aria-hidden="true"><Icon size={20} /></span>
                        <span>{item.label}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </motion.section>
        )}

        {showBackgroundSection && (
          <motion.section
            id="education"
            className="pp-section"
            {...getSectionMotion(shouldReduceMotion)}
          >
            <div className="pp-container">
              <SectionHeading
                eyebrow="03 / The journey"
                title="Learning. Building. Giving back."
                icon={GraduationCap}
              />
              <div className="pp-background-grid">
                {hasEducation && (
                  <div className="pp-timeline-group">
                    <h3>Education</h3>
                    <div className="pp-timeline">
                      {education.map((item, index) => (
                        <article key={item.id || index} className="pp-timeline-item">
                          <p className="pp-timeline-period">{item.period}</p>
                          <h4>{item.title}</h4>
                          <p className="pp-timeline-subtitle">{item.subtitle}</p>
                          {(item.details || []).length > 0 && (
                            <ul>{item.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {hasExperience && experience && (
                  <div className="pp-timeline-group">
                    <h3>Experience</h3>
                    <div className="pp-timeline">
                      <article className="pp-timeline-item">
                        <p className="pp-timeline-period">{experience.period}</p>
                        <h4>{experience.title}</h4>
                        <p className="pp-timeline-subtitle">{experience.subtitle}</p>
                        {(experience.details || []).length > 0 && (
                          <ul>{experience.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
                        )}
                      </article>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {hasSkills && (
          <motion.section
            id="skills"
            className="pp-section"
            {...getSectionMotion(shouldReduceMotion)}
          >
            <div className="pp-container">
              <SectionHeading
                eyebrow="04 / The toolkit"
                title="The right tool. The right problem."
                subtitle="The languages, frameworks, and ideas I turn to when building."
                icon={Code2}
              />
              <div className="pp-skills-grid">
                {Object.entries(skillGroups).map(([category, items], index) => (
                  <motion.article
                    key={category}
                    className="pp-skill-group"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={shouldReduceMotion ? { duration: 0 } : {
                      duration: 0.4,
                      delay: Math.min(index * 0.05, 0.2),
                      ease: SECTION_EASE,
                    }}
                  >
                    <div className="pp-skill-heading">
                      <span className="pp-skill-number">{String(index + 1).padStart(2, '0')}</span>
                      <h3>{category}</h3>
                      <span>{items.length} {items.length === 1 ? 'skill' : 'skills'}</span>
                    </div>
                    <ul>{items.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul>
                  </motion.article>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <CertificatesSection certificates={certificates} />

        {hasContact && (
          <motion.section
            id="contact"
            className="pp-section pp-contact-section"
            {...getSectionMotion(shouldReduceMotion)}
          >
            <div className="pp-container pp-contact-grid">
              <div className="pp-contact-copy">
                <SectionHeading
                  eyebrow="06 / What's next?"
                  title="Good things start with a conversation."
                  subtitle={siteContent?.contact_intro && !/©|copyright|all rights reserved/i.test(siteContent.contact_intro) ? siteContent.contact_intro : 'A project, a collaboration, or an interesting problem. I’d love to hear about it.'}
                  icon={Mail}
                />
                <address className="pp-contact-details">
                  <button type="button" onClick={copyEmail}>
                    <Mail size={17} aria-hidden="true" /> muasfiahamed276@gmail.com
                  </button>
                  <a href="tel:+94781556402"><Phone size={17} aria-hidden="true" /> +94 78 155 6402</a>
                  <span><MapPin size={17} aria-hidden="true" /> Sri Lanka</span>
                </address>
              </div>

              <form onSubmit={handleSubmit} className="pp-contact-form">
                <div className="pp-form-grid">
                  <label>
                    <span>Your name</span>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Jane Doe"
                      required
                    />
                  </label>
                  <label>
                    <span>Email address</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="you@company.com"
                      required
                    />
                  </label>
                </div>
                <label>
                  <span>Message</span>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Tell me about your project or opportunity..."
                    required
                  />
                </label>
                <button type="submit" disabled={isSubmitting} className="pp-button pp-button-primary pp-submit-button">
                  {isSubmitting ? 'Opening email…' : 'Open email draft'}
                  <Send size={17} aria-hidden="true" />
                </button>
                <p className="pp-form-note">Opens your email app with your message ready to send.</p>
                <span className="pp-sr-only" aria-live="polite">
                  {isSubmitting ? 'Opening your email application.' : ''}
                </span>
              </form>
            </div>
          </motion.section>
        )}
      </main>

      <footer className="pp-footer">
        <div className="pp-container pp-footer-wordmark" aria-hidden="true">ASFI AHAMED<span>↗</span></div>
        <div className="pp-container pp-footer-inner">
          <p>{siteContent?.footer_text || `© ${new Date().getFullYear()} Asfi Ahamed. All rights reserved.`}</p>
          <div className="pp-footer-links">
            <a href="https://github.com/asfiahamed0404" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://www.linkedin.com/in/asfi-ahamed-baa362347" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <button type="button" onClick={copyEmail}>Email</button>
          </div>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}

const Home: FC = () => {
  const [retryKey, setRetryKey] = useState(0)
  return <PortfolioContent key={retryKey} onRetry={() => setRetryKey((key) => key + 1)} />
}

export default Home
