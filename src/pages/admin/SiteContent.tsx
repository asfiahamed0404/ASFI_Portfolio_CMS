import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { getSiteContent, updateSiteContent } from '../../lib/supabase'
import type { SiteContent } from '../../lib/supabase'

type ContentFieldKey =
  | 'hero_title'
  | 'hero_subtitle'
  | 'hero_status'
  | 'about_text'
  | 'about_paragraph1'
  | 'about_paragraph2'
  | 'about_paragraph3'
  | 'contact_intro'
  | 'footer_text'
  | 'seo_title'
  | 'seo_description'
  | 'resume_url'

type ContentSectionId = 'hero' | 'about' | 'contact' | 'seo' | 'footer'

interface ContentField {
  key: ContentFieldKey
  label: string
  type: 'text' | 'textarea'
  rows?: number
  description?: string
  showCharacterCount?: boolean
}

interface ContentSection {
  id: ContentSectionId
  label: string
  description: string
  fields: ContentField[]
}

const sections: ContentSection[] = [
  {
    id: 'hero',
    label: 'Hero',
    description: 'The primary introduction shown at the top of the portfolio.',
    fields: [
      { key: 'hero_title', label: 'Hero title', type: 'text' },
      {
        key: 'hero_subtitle',
        label: 'Hero subtitle',
        type: 'textarea',
        rows: 3,
        description: 'Existing inline formatting is preserved when you save.',
      },
      { key: 'hero_status', label: 'Hero status', type: 'text' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    description: 'The heading and supporting paragraphs used in the About section.',
    fields: [
      {
        key: 'about_text',
        label: 'About text',
        type: 'textarea',
        rows: 3,
        description: 'Existing inline formatting is preserved when you save.',
      },
      { key: 'about_paragraph1', label: 'About paragraph 1', type: 'textarea', rows: 4 },
      { key: 'about_paragraph2', label: 'About paragraph 2', type: 'textarea', rows: 4 },
      { key: 'about_paragraph3', label: 'About paragraph 3', type: 'textarea', rows: 4 },
    ],
  },
  {
    id: 'contact',
    label: 'Contact',
    description: 'Contact-section copy and the downloadable resume destination.',
    fields: [
      { key: 'contact_intro', label: 'Contact intro', type: 'textarea', rows: 3 },
      {
        key: 'resume_url',
        label: 'Resume URL',
        type: 'text',
        description: 'Use a complete URL or a site-relative path such as /Asfi_CV.pdf.',
      },
    ],
  },
  {
    id: 'seo',
    label: 'SEO',
    description: 'Search-result title and description. Character counts are advisory only.',
    fields: [
      { key: 'seo_title', label: 'SEO title', type: 'text', showCharacterCount: true },
      {
        key: 'seo_description',
        label: 'SEO description',
        type: 'textarea',
        rows: 4,
        showCharacterCount: true,
      },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    description: 'The short line displayed at the bottom of the portfolio.',
    fields: [{ key: 'footer_text', label: 'Footer text', type: 'text' }],
  },
]

export default function AdminSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [activeSection, setActiveSection] = useState<ContentSectionId>('hero')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSiteContent()
      if (data) setContent(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!content) return
    setSaving(true)
    try {
      await updateSiteContent(content)
      toast.success('Saved')
    } catch (err) {
      toast.error(`Failed to save: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (key: ContentFieldKey, value: string) => {
    setContent((previous) => (previous ? { ...previous, [key]: value } : previous))
  }

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % sections.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + sections.length) % sections.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = sections.length - 1
    }

    if (nextIndex === null) return
    event.preventDefault()
    setActiveSection(sections[nextIndex].id)
    tabRefs.current[nextIndex]?.focus()
  }

  const selectedSection = sections.find((section) => section.id === activeSection) ?? sections[0]

  const viewSiteAction = (
    <a href="/" className="admin-secondary-action">
      <ExternalLink size={15} aria-hidden="true" />
      View site
    </a>
  )

  if (loading) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Homepage copy"
          title="Site Content"
          description="Edit the portfolio copy without changing its stored format."
          actions={viewSiteAction}
        />
        <div className="admin-loading">Loading site content...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Homepage copy"
          title="Site Content"
          description="Edit the portfolio copy without changing its stored format."
          actions={viewSiteAction}
        />
        <div className="admin-error-panel">
          <p className="admin-error-title">Failed to load site content</p>
          <p className="admin-error-detail">{error}</p>
          <button type="button" onClick={load} className="admin-primary-action">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Homepage copy"
        title="Site Content"
        description="Edit the portfolio copy without changing its stored format."
        actions={viewSiteAction}
      />

      <form onSubmit={handleSave} className="admin-site-content-form" aria-busy={saving}>
        <div className="admin-content-panel admin-site-content-panel">
          <div className="admin-section-tabs" role="tablist" aria-label="Site content sections">
            {sections.map((section, index) => {
              const isActive = section.id === selectedSection.id
              return (
                <button
                  key={section.id}
                  ref={(element) => {
                    tabRefs.current[index] = element
                  }}
                  id={`site-content-tab-${section.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`site-content-panel-${section.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className={`admin-section-tab ${isActive ? 'admin-section-tab-active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {section.label}
                </button>
              )
            })}
          </div>

          <section
            id={`site-content-panel-${selectedSection.id}`}
            role="tabpanel"
            aria-labelledby={`site-content-tab-${selectedSection.id}`}
            tabIndex={0}
            className="admin-section-panel"
          >
            <div className="admin-section-heading">
              <h2>{selectedSection.label}</h2>
              <p>{selectedSection.description}</p>
            </div>

            <div className="admin-form-grid admin-form-wide">
              {selectedSection.fields.map((field) => {
                const inputId = `site-content-${field.key}`
                const descriptionId = field.description ? `${inputId}-description` : undefined
                const countId = field.showCharacterCount ? `${inputId}-count` : undefined
                const describedBy = [descriptionId, countId].filter(Boolean).join(' ') || undefined
                const value = content?.[field.key] ?? ''

                return (
                  <div key={field.key} className="admin-field">
                    <div className="admin-field-label-row">
                      <label htmlFor={inputId} className="admin-field-label">
                        {field.label}
                      </label>
                      {field.showCharacterCount && (
                        <span id={countId} className="admin-character-count">
                          {value.length} characters
                        </span>
                      )}
                    </div>

                    {field.type === 'textarea' ? (
                      <textarea
                        id={inputId}
                        className="admin-textarea"
                        rows={field.rows ?? 4}
                        value={value}
                        aria-describedby={describedBy}
                        disabled={saving}
                        onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        className="admin-input"
                        value={value}
                        aria-describedby={describedBy}
                        disabled={saving}
                        onChange={(event) => handleFieldChange(field.key, event.target.value)}
                      />
                    )}

                    {field.description && (
                      <p id={descriptionId} className="admin-field-description">
                        {field.description}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <div className="admin-sticky-form-actions">
          <p className="admin-save-note">Save once after editing any section.</p>
          <button type="submit" disabled={saving || !content} className="admin-btn admin-btn-primary">
            {saving && <span className="spinner" aria-hidden="true" />}
            <span>{saving ? 'Saving...' : 'Save changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
