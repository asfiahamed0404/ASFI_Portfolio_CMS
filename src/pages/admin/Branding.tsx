import { useState } from 'react'
import { AlertCircle, CheckCircle2, ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import { supabase, updateSiteContent } from '../../lib/supabase'
import type { SiteContent } from '../../lib/supabase'
import { useSiteContent } from '../../hooks/usePortfolioData'

type AssetField = 'logo' | 'portrait' | 'hero_image' | 'favicon'
type AssetStatus = 'idle' | 'uploading' | 'success' | 'error'

interface AssetConfig {
  field: AssetField
  name: string
  description: string
  recommendation: string
  previewClass: string
}

const assets: AssetConfig[] = [
  {
    field: 'logo',
    name: 'Website logo',
    description: 'Primary portfolio brand mark.',
    recommendation: 'Recommended: square (1:1), with a transparent background.',
    previewClass: 'admin-asset-preview-logo',
  },
  {
    field: 'portrait',
    name: 'Profile portrait',
    description: 'Portrait associated with the portfolio profile.',
    recommendation: 'Recommended: portrait orientation (4:5).',
    previewClass: 'admin-asset-preview-portrait',
  },
  {
    field: 'hero_image',
    name: 'Hero image',
    description: 'Wide visual intended for the portfolio hero area.',
    recommendation: 'Recommended: landscape orientation (16:9).',
    previewClass: 'admin-asset-preview-hero',
  },
  {
    field: 'favicon',
    name: 'Favicon',
    description: 'Small browser and bookmark icon.',
    recommendation: 'Recommended: square (1:1).',
    previewClass: 'admin-asset-preview-favicon',
  },
]

const initialStatuses: Record<AssetField, AssetStatus> = {
  logo: 'idle',
  portrait: 'idle',
  hero_image: 'idle',
  favicon: 'idle',
}

// Uploads to the existing branding bucket and returns its existing public URL shape.
async function uploadFile(file: File, path: string): Promise<string | null> {
  const { error: uploadError } = await supabase.storage.from('branding').upload(path, file, {
    upsert: true,
    cacheControl: '3600',
    contentType: file.type,
  })
  if (uploadError) {
    toast.error(`Upload failed: ${uploadError.message}`)
    return null
  }
  const { data } = supabase.storage.from('branding').getPublicUrl(path)
  return data?.publicUrl || null
}

export default function AdminBranding() {
  const { content, loading, error } = useSiteContent()
  const [savedUrls, setSavedUrls] = useState<Partial<Record<AssetField, string>>>({})
  const [statuses, setStatuses] = useState<Record<AssetField, AssetStatus>>(initialStatuses)

  const setAssetStatus = (field: AssetField, status: AssetStatus) => {
    setStatuses((previous) => ({ ...previous, [field]: status }))
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, field: AssetField) => {
    const file = event.target.files?.[0]
    if (!file) return

    setAssetStatus(field, 'uploading')
    const path = `${field}/${file.name}`
    const publicUrl = await uploadFile(file, path)
    if (!publicUrl) {
      setAssetStatus(field, 'error')
      return
    }

    const updateData: Partial<SiteContent> = {}
    if (field === 'logo') updateData.logo_url = publicUrl
    else if (field === 'portrait') updateData.portrait_url = publicUrl
    else if (field === 'hero_image') updateData.hero_image_url = publicUrl
    else if (field === 'favicon') updateData.favicon_url = publicUrl

    try {
      await updateSiteContent(updateData)
      toast.success('Asset saved')
      setSavedUrls((previous) => ({ ...previous, [field]: publicUrl }))
      setAssetStatus(field, 'success')
    } catch (err) {
      toast.error(`Failed to save: ${(err as Error).message}`)
      setAssetStatus(field, 'error')
    }
  }

  const assetUrls: Record<AssetField, string | null> = {
    logo: savedUrls.logo ?? content?.logo_url ?? null,
    portrait: savedUrls.portrait ?? content?.portrait_url ?? null,
    hero_image: savedUrls.hero_image ?? content?.hero_image_url ?? null,
    favicon: savedUrls.favicon ?? content?.favicon_url ?? null,
  }

  if (loading) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Visual identity"
          title="Branding"
          description="Review and replace the portfolio's stored image assets."
        />
        <div className="admin-loading">Loading branding assets...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <AdminPageHeader
          eyebrow="Visual identity"
          title="Branding"
          description="Review and replace the portfolio's stored image assets."
        />
        <div className="admin-error-panel">
          <p className="admin-error-title">Failed to load branding assets</p>
          <p className="admin-error-detail">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="admin-primary-action">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <AdminPageHeader
        eyebrow="Visual identity"
        title="Branding"
        description="Review and replace the portfolio's stored image assets."
      />

      <div className="admin-asset-grid">
        {assets.map((asset) => {
          const url = assetUrls[asset.field]
          const status = statuses[asset.field]
          const inputId = `branding-${asset.field}-upload`
          const recommendationId = `${inputId}-recommendation`
          const statusId = `${inputId}-status`
          const isUploading = status === 'uploading'

          return (
            <article key={asset.field} className="admin-asset-card" aria-busy={isUploading}>
              <div className="admin-asset-card-preview">
                {url ? (
                  <img
                    src={url}
                    alt={`Current ${asset.name.toLowerCase()}`}
                    className={`admin-asset-preview ${asset.previewClass}`}
                  />
                ) : (
                  <div className="admin-asset-placeholder" aria-hidden="true">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>

              <div className="admin-asset-card-content">
                <div className="admin-asset-card-heading">
                  <div>
                    <h2>{asset.name}</h2>
                    <p>{asset.description}</p>
                  </div>
                  <span className={`admin-asset-state admin-asset-state-${url ? 'ready' : 'empty'}`}>
                    {url ? 'Uploaded' : 'Not set'}
                  </span>
                </div>

                <p id={recommendationId} className="admin-asset-recommendation">
                  {asset.recommendation}
                </p>

                <p className="admin-asset-url" title={url ?? undefined}>
                  {url ?? 'No asset URL available'}
                </p>

                <div className="admin-asset-card-actions">
                  <label
                    htmlFor={inputId}
                    className={`admin-asset-upload-button ${isUploading ? 'admin-asset-upload-button-disabled' : ''}`}
                    aria-disabled={isUploading}
                  >
                    <input
                      id={inputId}
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      aria-describedby={`${recommendationId} ${statusId}`}
                      onChange={(event) => handleFileChange(event, asset.field)}
                      className="sr-only"
                    />
                    {isUploading ? <span className="spinner" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
                    {isUploading ? 'Uploading...' : url ? 'Replace asset' : 'Upload asset'}
                  </label>

                  <span
                    id={statusId}
                    className={`admin-asset-upload-status admin-asset-upload-status-${status}`}
                    aria-live="polite"
                  >
                    {status === 'success' && <CheckCircle2 size={14} aria-hidden="true" />}
                    {status === 'error' && <AlertCircle size={14} aria-hidden="true" />}
                    {status === 'uploading'
                      ? 'Saving asset'
                      : status === 'success'
                        ? 'Saved'
                        : status === 'error'
                          ? 'Upload not saved'
                          : 'Image files'}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
