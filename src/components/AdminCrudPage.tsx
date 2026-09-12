import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Pencil, Plus, Search, Trash, X } from 'lucide-react'
import { toast } from 'sonner'
import AdminDialog from './admin/AdminDialog'
import AdminEmptyState from './admin/AdminEmptyState'
import AdminPageHeader from './admin/AdminPageHeader'
import AdminPagination from './admin/AdminPagination'
import ConfirmDialog from './admin/ConfirmDialog'

export interface AdminField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'array'
  required?: boolean
  section?: string
  description?: string
  placeholder?: string
  arrayFormat?: 'comma' | 'lines'
  min?: number
  max?: number
  rows?: number
  wide?: boolean
}

export interface AdminColumn<TItem extends object = Record<string, unknown>> {
  key: string
  label: string
  render?: (item: TItem) => ReactNode
  title?: (item: TItem) => string
  className?: string
}

export interface AdminSearchConfig {
  keys: string[]
  placeholder?: string
}

export interface AdminFilterConfig {
  key: string
  label: string
  allLabel?: string
}

interface AdminCrudPageProps<TItem extends object, TCreate, TUpdate> {
  title: string
  singularTitle?: string
  description?: string
  formDescription?: string
  fields: AdminField[]
  columns?: AdminColumn<TItem>[]
  search?: AdminSearchConfig
  filter?: AdminFilterConfig
  pageSize?: number
  compact?: boolean
  formSize?: 'sm' | 'md' | 'lg'
  getItemLabel?: (item: TItem) => string
  getFn: () => Promise<TItem[]>
  createFn: (data: TCreate) => Promise<unknown>
  updateFn: (id: string, data: TUpdate) => Promise<unknown>
  deleteFn: (id: string) => Promise<void>
  idKey?: string
}

interface FieldGroup {
  title?: string
  fields: AdminField[]
}

function asRecord(item: object) {
  return item as Record<string, unknown>
}

function getArrayDrafts(fields: AdminField[], item: Record<string, unknown>) {
  return fields.reduce<Record<string, string>>((drafts, field) => {
    if (field.type !== 'array') return drafts

    const value = item[field.key]
    const separator = field.arrayFormat === 'lines' ? '\n' : ', '
    drafts[field.key] = Array.isArray(value) ? value.join(separator) : String(value ?? '')
    return drafts
  }, {})
}

function parseArrayValue(value: string, format: AdminField['arrayFormat']) {
  const separator = format === 'lines' ? /\r?\n/ : ','
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function getCellText(item: object, key: string) {
  const value = asRecord(item)[key]
  if (Array.isArray(value)) return value.join(', ')
  return value === null || value === undefined ? '' : String(value)
}

export default function AdminCrudPage<TItem extends object, TCreate, TUpdate>({
  title,
  singularTitle,
  description,
  formDescription,
  fields,
  columns,
  search,
  filter,
  pageSize = 10,
  compact = false,
  formSize = 'md',
  getItemLabel,
  getFn,
  createFn,
  updateFn,
  deleteFn,
  idKey = 'id',
}: AdminCrudPageProps<TItem, TCreate, TUpdate>) {
  const [items, setItems] = useState<TItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<Record<string, unknown>>({})
  const [arrayDrafts, setArrayDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<TItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [query, setQuery] = useState('')
  const [filterValue, setFilterValue] = useState('all')
  const [page, setPage] = useState(1)
  const searchInputId = useId()
  const filterInputId = useId()
  const fieldIdPrefix = useId()

  const singular = singularTitle ?? (title.endsWith('s') ? title.slice(0, -1) : title)

  const displayColumns = useMemo<AdminColumn<TItem>[]>(
    () =>
      columns ??
      fields
        .filter((field) => field.type !== 'textarea')
        .slice(0, 2)
        .map(({ key, label }) => ({ key, label })),
    [columns, fields],
  )

  const fieldGroups = useMemo<FieldGroup[]>(() => {
    const groups: FieldGroup[] = []
    const groupIndexes = new Map<string, number>()

    fields.forEach((field) => {
      const groupKey = field.section ?? ''
      const existingIndex = groupIndexes.get(groupKey)
      if (existingIndex !== undefined) {
        groups[existingIndex].fields.push(field)
        return
      }

      groupIndexes.set(groupKey, groups.length)
      groups.push({ title: field.section, fields: [field] })
    })

    return groups
  }, [fields])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getFn()
      setItems(data || [])
      setLoading(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      setLoading(false)
    }
  }, [getFn])

  useEffect(() => {
    // The existing CRUD contract loads once when its data callback changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const filterOptions = useMemo(() => {
    if (!filter) return []

    return Array.from(
      new Set(
        items
          .map((item) => asRecord(item)[filter.key])
          .filter((value) => value !== null && value !== undefined && String(value).length > 0)
          .map(String),
      ),
    ).sort((a, b) => a.localeCompare(b))
  }, [filter, items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    return items.filter((item) => {
      const matchesFilter =
        !filter ||
        filterValue === 'all' ||
        String(asRecord(item)[filter.key] ?? '') === filterValue
      if (!matchesFilter) return false
      if (!normalizedQuery || !search) return true

      return search.keys.some((key) =>
        getCellText(item, key).toLocaleLowerCase().includes(normalizedQuery),
      )
    })
  }, [filter, filterValue, items, query, search])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filteredItems, pageSize],
  )

  const openAddForm = () => {
    setEditing({})
    setArrayDrafts(getArrayDrafts(fields, {}))
    setIsFormOpen(true)
  }

  const openEditForm = (item: TItem) => {
    const record = asRecord(item)
    setEditing(record)
    setArrayDrafts(getArrayDrafts(fields, record))
    setIsFormOpen(true)
  }

  const closeForm = useCallback(() => {
    if (saving) return
    setIsFormOpen(false)
    setEditing({})
    setArrayDrafts({})
  }, [saving])

  const closeDeleteDialog = useCallback(() => {
    if (!deleting) setPendingDelete(null)
  }, [deleting])

  const itemLabel = (item: TItem) => {
    if (getItemLabel) return getItemLabel(item)
    const fallback = displayColumns[0] ? getCellText(item, displayColumns[0].key) : ''
    return fallback || singular
  }

  const handleDelete = async () => {
    if (!pendingDelete || deleting) return

    const id = asRecord(pendingDelete)[idKey] as string
    setDeleting(true)
    try {
      await deleteFn(id)
      toast.success('Deleted')
      setItems((previousItems) =>
        previousItems.filter((item) => asRecord(item)[idKey] !== id),
      )
      setPendingDelete(null)
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const id = editing[idKey]
      if (id) {
        await updateFn(id as string, editing as TUpdate)
        toast.success('Updated')
      } else {
        await createFn(editing as TCreate)
        toast.success('Created')
      }
      setIsFormOpen(false)
      setEditing({})
      setArrayDrafts({})
      load()
    } catch (err) {
      toast.error(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const clearViewControls = () => {
    setQuery('')
    setFilterValue('all')
    setPage(1)
  }

  const addButton = (
    <button type="button" onClick={openAddForm} className="admin-primary-action">
      <Plus size={16} aria-hidden="true" />
      Add {singular}
    </button>
  )

  if (loading) return <div className="admin-loading">Loading {title.toLowerCase()}...</div>

  if (error) {
    return (
      <div className="admin-page admin-collection-page">
        <AdminPageHeader title={title} eyebrow="Content manager" />
        <div className="admin-error-panel" role="alert">
          <p className="admin-error-title">Failed to load {title.toLowerCase()}</p>
          <p className="admin-error-detail">{error}</p>
          <button type="button" onClick={load} className="admin-primary-action">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const hasViewControls = Boolean(search || filter)

  return (
    <div
      className={`admin-page admin-collection-page${compact ? ' admin-collection-page-compact' : ''}`}
    >
      <AdminPageHeader
        title={title}
        eyebrow="Content manager"
        description={description}
        count={items.length}
        actions={addButton}
      />

      {hasViewControls && items.length > 0 && (
        <div className="admin-data-toolbar">
          {search && (
            <div className="admin-search-control">
              <label htmlFor={searchInputId} className="sr-only">
                Search {title.toLowerCase()}
              </label>
              <Search size={16} className="admin-search-icon" aria-hidden="true" />
              <input
                id={searchInputId}
                type="search"
                className="admin-search-input"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder={search.placeholder ?? `Search ${title.toLowerCase()}...`}
              />
              {query && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => {
                    setQuery('')
                    setPage(1)
                  }}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              )}
            </div>
          )}

          {filter && filterOptions.length > 0 && (
            <label htmlFor={filterInputId} className="admin-filter-control">
              <span className="admin-filter-label">{filter.label}</span>
              <select
                id={filterInputId}
                className="admin-filter-select"
                value={filterValue}
                onChange={(event) => {
                  setFilterValue(event.target.value)
                  setPage(1)
                }}
              >
                <option value="all">{filter.allLabel ?? `All ${filter.label.toLowerCase()}`}</option>
                {filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          <p className="admin-toolbar-summary" aria-live="polite">
            {filteredItems.length === items.length
              ? `${items.length} ${items.length === 1 ? 'record' : 'records'}`
              : `${filteredItems.length} of ${items.length} records`}
          </p>
        </div>
      )}

      <div className="admin-table-shell">
        {filteredItems.length === 0 ? (
          <AdminEmptyState
            title={items.length === 0 ? `No ${title.toLowerCase()} yet` : 'No matching records'}
            description={
              items.length === 0
                ? `Add your first ${singular.toLowerCase()} to get started.`
                : 'Try a different search or filter.'
            }
            compact
            action={
              items.length === 0 ? (
                addButton
              ) : (
                <button type="button" className="admin-btn admin-btn-ghost" onClick={clearViewControls}>
                  Clear search and filters
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table">
                <caption className="sr-only">{title} content records</caption>
                <thead>
                  <tr>
                    {displayColumns.map((column) => (
                      <th key={column.key} scope="col" className={column.className}>
                        {column.label}
                      </th>
                    ))}
                    <th scope="col" className="admin-actions-column">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => {
                    const name = itemLabel(item)
                    return (
                      <tr key={String(asRecord(item)[idKey])}>
                        {displayColumns.map((column) => {
                          const fullText = column.title?.(item) ?? getCellText(item, column.key)
                          return (
                            <td key={column.key} className={column.className}>
                              <div className="admin-cell-value" title={fullText || undefined}>
                                {column.render ? column.render(item) : fullText}
                              </div>
                            </td>
                          )
                        })}
                        <td className="admin-actions-column">
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              onClick={() => openEditForm(item)}
                              className="admin-icon-button"
                              aria-label={`Edit ${name}`}
                              title={`Edit ${name}`}
                            >
                              <Pencil size={16} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDelete(item)}
                              className="admin-icon-button admin-icon-button-danger"
                              aria-label={`Delete ${name}`}
                              title={`Delete ${name}`}
                            >
                              <Trash size={16} aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {filteredItems.length > pageSize && (
              <AdminPagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={filteredItems.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <AdminDialog
        open={isFormOpen}
        title={editing[idKey] ? `Edit ${singular}` : `Add ${singular}`}
        description={formDescription}
        onClose={closeForm}
        closeLabel={`Close ${singular.toLowerCase()} form`}
        size={formSize}
        preventClose={saving}
      >
        <form onSubmit={handleSave} className="admin-form-grid">
          {fieldGroups.map((group, groupIndex) => (
            <fieldset
              key={group.title ?? `fields-${groupIndex}`}
              className="admin-form-section"
              aria-label={group.title ?? `${singular} details`}
            >
              {group.title && <legend className="admin-form-section-title">{group.title}</legend>}
              <div className="admin-form-fields">
                {group.fields.map((field) => {
                  const inputId = `${fieldIdPrefix}-${field.key}`
                  const descriptionId = field.description ? `${inputId}-description` : undefined
                  const isFirstField = field.key === fields[0]?.key
                  const fieldClassName = `admin-field${field.wide ? ' admin-field-wide' : ''}`

                  return (
                    <div key={field.key} className={fieldClassName}>
                      <label htmlFor={inputId} className="admin-field-label">
                        {field.label}
                        {field.required && (
                          <span className="admin-field-required" aria-hidden="true">
                            *
                          </span>
                        )}
                      </label>
                      {field.description && (
                        <p id={descriptionId} className="admin-field-description">
                          {field.description}
                        </p>
                      )}

                      {field.type === 'textarea' ? (
                        <textarea
                          id={inputId}
                          required={field.required}
                          className="admin-textarea"
                          rows={field.rows ?? 4}
                          placeholder={field.placeholder ?? field.label}
                          value={String(editing[field.key] ?? '')}
                          aria-describedby={descriptionId}
                          data-autofocus={isFirstField || undefined}
                          onChange={(event) =>
                            setEditing((previous) => ({
                              ...previous,
                              [field.key]: event.target.value,
                            }))
                          }
                        />
                      ) : field.type === 'array' && field.arrayFormat === 'lines' ? (
                        <textarea
                          id={inputId}
                          required={field.required}
                          className="admin-textarea admin-array-textarea"
                          rows={field.rows ?? 5}
                          placeholder={field.placeholder ?? 'One item per line'}
                          value={arrayDrafts[field.key] ?? ''}
                          aria-describedby={descriptionId}
                          data-autofocus={isFirstField || undefined}
                          onChange={(event) => {
                            const value = event.target.value
                            setArrayDrafts((previous) => ({ ...previous, [field.key]: value }))
                            setEditing((previous) => ({
                              ...previous,
                              [field.key]: parseArrayValue(value, field.arrayFormat),
                            }))
                          }}
                        />
                      ) : field.type === 'array' ? (
                        <input
                          id={inputId}
                          type="text"
                          required={field.required}
                          placeholder={field.placeholder ?? 'Comma separated'}
                          className="admin-input"
                          value={arrayDrafts[field.key] ?? ''}
                          aria-describedby={descriptionId}
                          data-autofocus={isFirstField || undefined}
                          onChange={(event) => {
                            const value = event.target.value
                            setArrayDrafts((previous) => ({ ...previous, [field.key]: value }))
                            setEditing((previous) => ({
                              ...previous,
                              [field.key]: parseArrayValue(value, field.arrayFormat),
                            }))
                          }}
                        />
                      ) : (
                        <input
                          id={inputId}
                          type={field.type === 'number' ? 'number' : 'text'}
                          required={field.required}
                          placeholder={field.placeholder ?? field.label}
                          className="admin-input"
                          value={String(editing[field.key] ?? '')}
                          min={field.min}
                          max={field.max}
                          aria-describedby={descriptionId}
                          data-autofocus={isFirstField || undefined}
                          onChange={(event) =>
                            setEditing((previous) => ({
                              ...previous,
                              [field.key]: event.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <div className="admin-dialog-actions admin-form-actions">
            <button
              type="button"
              disabled={saving}
              onClick={closeForm}
              className="admin-btn admin-btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
              {saving && <span className="admin-spinner" aria-hidden="true" />}
              <span>{saving ? 'Saving...' : editing[idKey] ? 'Save changes' : `Add ${singular}`}</span>
            </button>
          </div>
        </form>
      </AdminDialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${singular}?`}
        description={
          pendingDelete
            ? `Delete "${itemLabel(pendingDelete)}"? This will permanently remove it from the portfolio.`
            : ''
        }
        onCancel={closeDeleteDialog}
        onConfirm={handleDelete}
        confirming={deleting}
        confirmLabel={`Delete ${singular}`}
      />
    </div>
  )
}
