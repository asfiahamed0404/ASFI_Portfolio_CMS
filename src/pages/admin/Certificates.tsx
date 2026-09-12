import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ImageIcon, Pencil, Plus, Search, Trash, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import AdminDialog from '../../components/admin/AdminDialog'
import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminPagination from '../../components/admin/AdminPagination'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { supabase } from '../../lib/supabase'
import type { Certificate } from '../../lib/supabase'

const PAGE_SIZE = 10

interface CertificateDraft {
  id?: string
  name: string
  issuer: string
  display_order: number | ''
  image_url: string | null
  created_at?: string
  updated_at?: string
}

function createEmptyDraft(): CertificateDraft {
  return {
    name: '',
    issuer: '',
    display_order: 0,
    image_url: null,
  }
}

function matchesView(certificate: Certificate, query: string, issuer: string) {
  if (issuer !== 'all' && certificate.issuer !== issuer) return false

  const normalizedQuery = query.trim().toLocaleLowerCase()
  if (!normalizedQuery) return true

  return [certificate.name, certificate.issuer].some((value) =>
    value.toLocaleLowerCase().includes(normalizedQuery),
  )
}

export default function AdminCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<CertificateDraft | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Certificate | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [query, setQuery] = useState('')
  const [issuerFilter, setIssuerFilter] = useState('all')
  const [page, setPage] = useState(1)
  const searchInputId = useId()
  const issuerFilterId = useId()
  const formId = useId()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: loadError } = await supabase
        .from('certificates')
        .select('*')
        .order('display_order', { ascending: true })
      if (loadError) throw loadError
      setCertificates(data || [])
      setPage(1)
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

  const issuerOptions = useMemo(
    () =>
      Array.from(new Set(certificates.map((certificate) => certificate.issuer).filter(Boolean))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [certificates],
  )

  const filteredCertificates = useMemo(
    () => certificates.filter((certificate) => matchesView(certificate, query, issuerFilter)),
    [certificates, issuerFilter, query],
  )

  const totalPages = Math.max(1, Math.ceil(filteredCertificates.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleCertificates = useMemo(
    () => filteredCertificates.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredCertificates],
  )

  // Preserve the existing randomized object name and certificate-images bucket behavior.
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('certificate-images')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600',
          contentType: file.type,
        })
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('certificate-images').getPublicUrl(fileName)
      return publicUrl
    } catch (err) {
      console.error('Error uploading image:', err)
      throw err
    }
  }

  // Preserve existing storage cleanup support for images removed in the edit form.
  const deleteImageFromStorage = async (url: string) => {
    try {
      const segments = url.split('/')
      const fileName = segments[segments.length - 1]
      const { error: removeError } = await supabase.storage
        .from('certificate-images')
        .remove([fileName])
      if (removeError) throw removeError
    } catch (err) {
      console.error('Error deleting image:', err)
      toast.error('Failed to delete image')
    }
  }

  const openAddForm = () => {
    setEditing(createEmptyDraft())
    setImagePreview(null)
    setImageFile(null)
    setIsFormOpen(true)
  }

  const openEditForm = (certificate: Certificate) => {
    setEditing(certificate)
    setImagePreview(certificate.image_url)
    setImageFile(null)
    setIsFormOpen(true)
  }

  const closeForm = useCallback(() => {
    if (saving) return
    setIsFormOpen(false)
    setEditing(null)
    setImagePreview(null)
    setImageFile(null)
  }, [saving])

  const closeDeleteDialog = useCallback(() => {
    if (!deleting) setPendingDelete(null)
  }, [deleting])

  const handleRemoveImage = async () => {
    if (editing?.image_url) {
      await deleteImageFromStorage(editing.image_url)
      setEditing((previous) => (previous ? { ...previous, image_url: null } : previous))
    }
    setImagePreview(null)
    setImageFile(null)
  }

  const handleDelete = async () => {
    if (!pendingDelete || deleting) return

    setDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('certificates')
        .delete()
        .eq('id', pendingDelete.id)
      if (deleteError) throw deleteError

      const remaining = certificates.filter((certificate) => certificate.id !== pendingDelete.id)
      const remainingMatches = remaining.filter((certificate) =>
        matchesView(certificate, query, issuerFilter),
      ).length
      const remainingPages = Math.max(1, Math.ceil(remainingMatches / PAGE_SIZE))

      setCertificates(remaining)
      setPage((previous) => Math.min(previous, remainingPages))
      setPendingDelete(null)
      toast.success('Certificate deleted')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to delete: ${message}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || !editing) return

    setSaving(true)
    try {
      let imageUrl: string | null = null
      if (imageFile) imageUrl = await uploadImage(imageFile)

      const certificateData = {
        ...editing,
        name: editing.name || '',
        issuer: editing.issuer || '',
        display_order: editing.display_order || 0,
        image_url: imageUrl ?? editing.image_url ?? null,
      }

      if (editing.id) {
        const { data, error: updateError } = await supabase
          .from('certificates')
          .update(certificateData)
          .eq('id', editing.id)
          .select()
          .single()
        if (updateError) throw updateError

        setCertificates((previous) =>
          previous.map((certificate) => (certificate.id === editing.id ? data : certificate)),
        )
        toast.success('Certificate updated')
      } else {
        const { data, error: createError } = await supabase
          .from('certificates')
          .insert(certificateData)
          .select()
          .single()
        if (createError) throw createError

        setCertificates((previous) => [data, ...previous])
        setPage(1)
        toast.success('Certificate created')
      }

      setIsFormOpen(false)
      setEditing(null)
      setImagePreview(null)
      setImageFile(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Failed to save: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setEditing((previous) => {
      const draft = previous ?? createEmptyDraft()
      if (name === 'name') return { ...draft, name: value }
      if (name === 'issuer') return { ...draft, issuer: value }
      if (name === 'display_order') {
        return { ...draft, display_order: value === '' ? '' : Number(value) }
      }
      return draft
    })
  }

  const acceptFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) acceptFile(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.classList.add('cert-upload--dragover')
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.classList.remove('cert-upload--dragover')
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.classList.remove('cert-upload--dragover')
    const file = event.dataTransfer.files?.[0]
    if (file) acceptFile(file)
  }

  const clearViewControls = () => {
    setQuery('')
    setIssuerFilter('all')
    setPage(1)
  }

  const addButton = (
    <button type="button" onClick={openAddForm} className="admin-primary-action">
      <Plus size={16} aria-hidden="true" />
      Add certificate
    </button>
  )

  if (loading) {
    return (
      <div className="admin-page admin-collection-page">
        <AdminPageHeader
          title="Certificates"
          eyebrow="Credential library"
          description="Manage portfolio credentials and their supporting images."
        />
        <div className="admin-loading">Loading certificates...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page admin-collection-page">
        <AdminPageHeader title="Certificates" eyebrow="Credential library" />
        <div className="admin-error-panel" role="alert">
          <p className="admin-error-title">Failed to load certificates</p>
          <p className="admin-error-detail">{error}</p>
          <button type="button" onClick={load} className="admin-primary-action">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page admin-collection-page">
      <AdminPageHeader
        title="Certificates"
        eyebrow="Credential library"
        description="Manage portfolio credentials and their supporting images."
        count={certificates.length}
        actions={addButton}
      />

      {certificates.length > 0 && (
        <div className="admin-data-toolbar">
          <div className="admin-search-field">
            <label htmlFor={searchInputId} className="sr-only">
              Search certificates by name or issuer
            </label>
            <Search size={16} aria-hidden="true" />
            <input
              id={searchInputId}
              type="search"
              className="admin-search-input"
              value={query}
              placeholder="Search name or issuer..."
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
            />
          </div>

          <label htmlFor={issuerFilterId} className="sr-only">
            Filter certificates by issuer
          </label>
          <select
            id={issuerFilterId}
            className="admin-filter-select"
            value={issuerFilter}
            onChange={(event) => {
              setIssuerFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All issuers</option>
            {issuerOptions.map((issuer) => (
              <option key={issuer} value={issuer}>
                {issuer}
              </option>
            ))}
          </select>

          <p className="admin-toolbar-result" aria-live="polite">
            {filteredCertificates.length === certificates.length
              ? `${certificates.length} ${certificates.length === 1 ? 'record' : 'records'}`
              : `${filteredCertificates.length} of ${certificates.length} records`}
          </p>
        </div>
      )}

      <div className="admin-table-shell">
        {filteredCertificates.length === 0 ? (
          <AdminEmptyState
            title={certificates.length === 0 ? 'No certificates yet' : 'No matching certificates'}
            description={
              certificates.length === 0
                ? 'Add your first certificate to build the credential library.'
                : 'Try a different name, issuer, or filter.'
            }
            compact
            action={
              certificates.length === 0 ? (
                addButton
              ) : (
                <button type="button" className="admin-btn admin-btn-ghost" onClick={clearViewControls}>
                  Clear search and filter
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <caption className="sr-only">Certificate content records</caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[72px]">
                      Image
                    </th>
                    <th scope="col">Name</th>
                    <th scope="col">Issuer</th>
                    <th scope="col" className="w-[90px]">
                      Order
                    </th>
                    <th scope="col" className="admin-table-actions-heading">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCertificates.map((certificate) => (
                    <tr key={certificate.id}>
                      <td>
                        {certificate.image_url ? (
                          <img
                            src={certificate.image_url}
                            alt=""
                            className="admin-thumbnail"
                            loading="lazy"
                          />
                        ) : (
                          <span className="admin-thumbnail-placeholder" aria-label="No certificate image">
                            <ImageIcon size={15} aria-hidden="true" />
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="admin-cell-primary" title={certificate.name}>
                          {certificate.name}
                        </div>
                      </td>
                      <td>
                        <div className="admin-cell-truncate" title={certificate.issuer}>
                          {certificate.issuer}
                        </div>
                      </td>
                      <td className="admin-cell-order">
                        {certificate.display_order}
                      </td>
                      <td className="admin-table-actions-cell">
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            onClick={() => openEditForm(certificate)}
                            className="admin-icon-button"
                            aria-label={`Edit ${certificate.name}`}
                            title={`Edit ${certificate.name}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(certificate)}
                            className="admin-icon-button admin-icon-button-danger"
                            aria-label={`Delete ${certificate.name}`}
                            title={`Delete ${certificate.name}`}
                          >
                            <Trash size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCertificates.length > PAGE_SIZE && (
              <AdminPagination
                page={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredCertificates.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <AdminDialog
        open={isFormOpen}
        title={editing?.id ? 'Edit certificate' : 'Add certificate'}
        description="Keep the credential details concise and add an image when one is available."
        onClose={closeForm}
        closeLabel="Close certificate form"
        size="md"
        preventClose={saving}
      >
        <form onSubmit={handleSave} className="admin-form-grid">
          <fieldset className="admin-form-section" aria-label="Certificate details">
            <div className="admin-field">
              <label htmlFor={`${formId}-name`} className="admin-field-label">
                Name <span className="admin-required" aria-hidden="true">*</span>
              </label>
              <input
                id={`${formId}-name`}
                name="name"
                type="text"
                required
                value={editing?.name ?? ''}
                placeholder="Certificate title"
                className="admin-input"
                disabled={saving}
                data-autofocus
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-field">
              <label htmlFor={`${formId}-issuer`} className="admin-field-label">
                Issuer <span className="admin-required" aria-hidden="true">*</span>
              </label>
              <input
                id={`${formId}-issuer`}
                name="issuer"
                type="text"
                required
                value={editing?.issuer ?? ''}
                placeholder="e.g. Kaggle, AWS"
                className="admin-input"
                disabled={saving}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-field">
              <label htmlFor={`${formId}-display-order`} className="admin-field-label">
                Display order
              </label>
              <input
                id={`${formId}-display-order`}
                name="display_order"
                type="number"
                value={editing?.display_order ?? ''}
                placeholder="0"
                className="admin-input"
                disabled={saving}
                onChange={handleInputChange}
              />
            </div>

            <div className="admin-field admin-field-full">
              <span id={`${formId}-image-label`} className="admin-field-label">
                Certificate image
              </span>
              <p id={`${formId}-image-help`} className="admin-field-help">
                PNG, JPG, WEBP, or GIF. The existing storage limit is approximately 5 MB.
              </p>

              {imagePreview ? (
                <div className="cert-upload cert-upload--filled group">
                  <img src={imagePreview} alt="Certificate preview" className="cert-upload-preview" />
                  <div className="cert-upload-actions">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="cert-upload-remove"
                      aria-label={`Remove image from ${editing?.name || 'certificate'}`}
                      disabled={saving}
                    >
                      <X size={14} aria-hidden="true" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  className="cert-upload cert-upload--empty group"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    className="sr-only"
                    aria-labelledby={`${formId}-image-label`}
                    aria-describedby={`${formId}-image-help`}
                    disabled={saving}
                    onChange={handleImageChange}
                  />
                  <div className="cert-upload-icon">
                    <ImageIcon size={22} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="cert-upload-title">Click or drag to upload</span>
                    <span className="cert-upload-sub">PNG, JPG, WEBP, or GIF — up to approximately 5 MB</span>
                  </div>
                  <span className="cert-upload-cta">
                    <Upload size={13} aria-hidden="true" />
                    Browse
                  </span>
                </label>
              )}
            </div>
          </fieldset>

          <div className="admin-dialog-actions">
            <button type="button" disabled={saving} onClick={closeForm} className="admin-btn admin-btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
              {saving && <span className="admin-spinner" aria-hidden="true" />}
              <span>{saving ? 'Saving...' : editing?.id ? 'Save changes' : 'Add certificate'}</span>
            </button>
          </div>
        </form>
      </AdminDialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete certificate?"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This will permanently remove it from the portfolio.`
            : ''
        }
        onCancel={closeDeleteDialog}
        onConfirm={handleDelete}
        confirming={deleting}
        confirmLabel="Delete certificate"
      />
    </div>
  )
}
