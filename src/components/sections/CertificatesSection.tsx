import { useEffect, useRef, useState, type FC } from 'react'
import { createPortal } from 'react-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Award, Maximize2, X } from 'lucide-react'
import type { Certificate } from '../../lib/supabase'
import SectionHeading from '../SectionHeading'

interface CertificatesSectionProps {
  certificates: Certificate[]
}

const CertificatesSection: FC<CertificatesSectionProps> = ({ certificates }) => {
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const shouldReduceMotion = Boolean(useReducedMotion())

  useEffect(() => {
    if (!selectedCertificate) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedCertificate(null)
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      openerRef.current?.focus()
    }
  }, [selectedCertificate])

  if (certificates.length === 0) return null

  const openCertificate = (certificate: Certificate, button: HTMLButtonElement) => {
    openerRef.current = button
    setSelectedCertificate(certificate)
  }

  return (
    <motion.section
      id="certificates"
      className="pp-section pp-section-muted"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px', amount: 0.12 }}
      transition={shouldReduceMotion ? { duration: 0 } : {
        duration: 0.52,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <div className="pp-container">
        <SectionHeading
          eyebrow="05 / Continuing the curiosity"
          title="Never done learning."
          subtitle="Certifications and coursework along the way. Select a certificate to take a closer look."
          icon={Award}
        />
        <div className="pp-certificates-grid">
          {certificates.map((certificate) => {
            const hasImage = Boolean(certificate.image_url)
            const content = (
              <>
                <div className="pp-certificate-media">
                  {hasImage ? (
                    <img src={certificate.image_url!} alt="" loading="lazy" />
                  ) : (
                    <span className="pp-certificate-placeholder"><Award size={28} aria-hidden="true" /></span>
                  )}
                  {hasImage && <Maximize2 size={15} className="pp-certificate-expand" aria-hidden="true" />}
                </div>
                <div className="pp-certificate-copy">
                  <h3>{certificate.name}</h3>
                  <p>{certificate.issuer}</p>
                </div>
              </>
            )

            return hasImage ? (
              <button
                key={certificate.id}
                type="button"
                className="pp-certificate-card"
                onClick={(event) => openCertificate(certificate, event.currentTarget)}
                aria-label={`View certificate: ${certificate.name}`}
              >
                {content}
              </button>
            ) : (
              <article key={certificate.id} className="pp-certificate-card pp-certificate-static">
                {content}
              </article>
            )
          })}
        </div>
      </div>

      {selectedCertificate?.image_url && createPortal(
        <div
          className="portfolio-public pp-certificate-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="certificate-dialog-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCertificate(null)
          }}
        >
          <div className="pp-certificate-dialog">
            <div className="pp-certificate-dialog-header">
              <div>
                <h2 id="certificate-dialog-title">{selectedCertificate.name}</h2>
                <p>{selectedCertificate.issuer}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setSelectedCertificate(null)}
                className="pp-modal-close"
                aria-label="Close certificate preview"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <div className="pp-certificate-dialog-media">
              <img src={selectedCertificate.image_url} alt={`${selectedCertificate.name} certificate`} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </motion.section>
  )
}

export default CertificatesSection
