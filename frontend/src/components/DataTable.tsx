import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FiArrowDown,
  FiArrowUp,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiDownload,
  FiInbox,
  FiSearch,
  FiX,
} from 'react-icons/fi'

export interface DataTableColumn {
  key: string
  label: string
  render?: (val: any, row: any) => React.ReactNode
}

export interface DataTableProps {
  columns: DataTableColumn[]
  data: any[]
  loading?: boolean
  emptyText?: string
  /** Show the search box. Default: true */
  searchable?: boolean
  /** Placeholder for the search box. */
  searchPlaceholder?: string
  /** Allow clicking column headers to sort. Default: true */
  sortable?: boolean
  /** Rows per page. Default: 10 */
  pageSize?: number
  /** Called when a row is clicked. */
  onRowClick?: (row: any, index: number) => void
  /** Show the "Export CSV" button. Default: true */
  exportCsv?: boolean
  /** Extra controls rendered in the toolbar (right side). */
  toolbar?: React.ReactNode
  /** Tighter cell padding. */
  dense?: boolean
}

type SortDir = 'asc' | 'desc'
interface SortState {
  key: string
  dir: SortDir
}

const asString = (v: any): string => {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return String(v)
}

const escapeCsv = (v: string): string =>
  /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
}

const bodyVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.028, delayChildren: 0.02 } },
}

export default function DataTable({
  columns,
  data,
  loading,
  emptyText = 'No data available.',
  searchable = true,
  searchPlaceholder = 'Search…',
  sortable = true,
  pageSize = 10,
  onRowClick,
  exportCsv = true,
  toolbar,
  dense = false,
}: DataTableProps) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(0)

  const cellPad = dense ? '6px 10px' : undefined

  /* ── Filter → Sort → Paginate ─────────────────────────────────────── */

  const filtered = useMemo(() => {
    const rows = Array.isArray(data) ? data : []
    const q = query.trim().toLowerCase()
    if (!searchable || !q) return rows
    return rows.filter((row) =>
      columns.some((col) => asString(row?.[col.key]).toLowerCase().includes(q)),
    )
  }, [data, query, columns, searchable])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const { key, dir } = sort
    const factor = dir === 'asc' ? 1 : -1
    // copy() keeps the original `data` prop untouched (no in-place sort).
    return [...filtered].sort((a, b) => {
      const av = a?.[key]
      const bv = b?.[key]
      let result: number
      if (typeof av === 'number' && typeof bv === 'number') {
        result = av - bv
      } else {
        result = asString(av).localeCompare(asString(bv), undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      }
      return result * factor
    })
  }, [filtered, sort])

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pageRows = useMemo(
    () => sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [sorted, currentPage, pageSize],
  )

  // Reset/clamp the page whenever the result set shrinks.
  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1))
  }, [totalPages, page])

  useEffect(() => {
    setPage(0)
  }, [query])

  /* ── Handlers ─────────────────────────────────────────────────────── */

  const toggleSort = (key: string) => {
    if (!sortable) return
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null // third click clears sorting
    })
  }

  const handleExport = () => {
    const header = columns.map((c) => escapeCsv(c.label)).join(',')
    const lines = sorted.map((row) =>
      columns.map((c) => escapeCsv(asString(row?.[c.key]))).join(','),
    )
    const csv = '\uFEFF' + [header, ...lines].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'export.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const rangeStart = total === 0 ? 0 : currentPage * pageSize + 1
  const rangeEnd = Math.min(total, (currentPage + 1) * pageSize)
  const animationKey = `${currentPage}|${query}|${sort?.key ?? ''}|${sort?.dir ?? ''}`

  /* ── Loading ──────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="table-container" style={{ padding: 16 }}>
        <div className="skeleton" style={{ height: 14, width: '35%', marginBottom: 18 }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div className="skeleton" style={{ height: 16, flex: 1.4 }} />
            <div className="skeleton" style={{ height: 16, flex: 1 }} />
            <div className="skeleton" style={{ height: 16, flex: 0.7 }} />
          </div>
        ))}
      </div>
    )
  }

  /* ── Empty ────────────────────────────────────────────────────────── */

  if (!data || data.length === 0) {
    return (
      <motion.div
        className="empty-state"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="empty-state-icon"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <FiInbox size={32} />
        </motion.div>
        <div className="empty-state-title">Nothing here yet</div>
        <div className="empty-state-desc">{emptyText}</div>
      </motion.div>
    )
  }

  /* ── Toolbar ──────────────────────────────────────────────────────── */

  const hasToolbar = searchable || exportCsv || toolbar

  return (
    <div className="dt-root">
      {hasToolbar && (
        <div
          className="dt-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '0 2px 14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {searchable && (
              <div className="dt-search" style={{ position: 'relative' }}>
                <FiSearch
                  size={14}
                  style={{
                    position: 'absolute',
                    left: 11,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  className="form-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  style={{ paddingLeft: 32, paddingRight: 30, minWidth: 220, height: 34 }}
                />
                {query && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                    }}
                  >
                    <FiX size={13} />
                  </button>
                )}
              </div>
            )}
            {searchable && query && (
              <span className="dt-chip text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {total} result{total === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {toolbar}
            {exportCsv && (
              <button
                type="button"
                className="dt-chip btn btn-sm"
                onClick={handleExport}
                title="Export visible rows as CSV"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FiDownload size={14} /> Export CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="table-container">
        <table style={dense ? { fontSize: 12.5 } : undefined}>
          <thead>
            <tr>
              {columns.map((col) => {
                const active = sort?.key === col.key
                const ariaSort = active
                  ? sort?.dir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
                return (
                  <th
                    key={col.key}
                    aria-sort={sortable ? (ariaSort as any) : undefined}
                    style={{ padding: cellPad, whiteSpace: 'nowrap' }}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        className="dt-sort-btn"
                        onClick={() => toggleSort(col.key)}
                        aria-label={`Sort by ${col.label}${active ? `, currently ${sort?.dir === 'asc' ? 'ascending' : 'descending'}` : ''}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          border: 'none',
                          background: 'transparent',
                          color: active ? 'var(--accent-bright)' : 'inherit',
                          font: 'inherit',
                          textTransform: 'inherit',
                          letterSpacing: 'inherit',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {col.label}
                        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 0.7 }}>
                          {active ? (
                            sort?.dir === 'asc' ? (
                              <FiArrowUp size={12} />
                            ) : (
                              <FiArrowDown size={12} />
                            )
                          ) : (
                            <>
                              <FiChevronUp size={9} style={{ opacity: 0.35 }} />
                              <FiChevronDown size={9} style={{ opacity: 0.35 }} />
                            </>
                          )}
                        </span>
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>

          <motion.tbody
            key={animationKey}
            variants={bodyVariants}
            initial="hidden"
            animate="show"
          >
            {pageRows.map((row, ri) => (
              <motion.tr
                key={ri}
                variants={rowVariants}
                onClick={onRowClick ? () => onRowClick(row, currentPage * pageSize + ri) : undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : undefined,
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: cellPad }}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* No results for the current search */}
      {filtered.length === 0 && (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: '28px 16px' }}
        >
          <FiSearch size={26} style={{ opacity: 0.5, marginBottom: 10 }} />
          <div className="empty-state-title">No matching rows</div>
          <div className="empty-state-desc">Try a different search term.</div>
          <button type="button" className="btn btn-sm" onClick={() => setQuery('')}>
            Clear search
          </button>
        </motion.div>
      )}

      {/* ── Pagination (subtle / hidden when there is only one page) ──── */}
      {totalPages > 1 && (
        <div
          className="dt-pagination"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            padding: '14px 2px 2px',
          }}
        >
          <span className="text-muted" style={{ fontSize: 12 }}>
            Showing <strong style={{ color: 'var(--text)' }}>{rangeStart}–{rangeEnd}</strong> of{' '}
            <strong style={{ color: 'var(--text)' }}>{total}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              className="btn btn-sm btn-icon dt-page-btn"
              aria-label="Previous page"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <FiChevronLeft size={15} />
            </button>

            {buildPageNumbers(currentPage, totalPages).map((n, i) =>
              n === '…' ? (
                <span key={`gap-${i}`} className="text-muted" style={{ padding: '0 4px', fontSize: 12 }}>
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className={`btn btn-sm dt-page-btn${n === currentPage ? ' btn-primary' : ''}`}
                  aria-label={`Page ${n}`}
                  aria-current={n === currentPage ? 'page' : undefined}
                  onClick={() => setPage(n)}
                  style={n === currentPage ? undefined : { minWidth: 30 }}
                >
                  {n}
                </button>
              ),
            )}

            <button
              type="button"
              className="btn btn-sm btn-icon dt-page-btn"
              aria-label="Next page"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <FiChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Page numbers with ellipses: always show first, last, and a window around current. */
function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages: (number | '…')[] = [0]
  const start = Math.max(1, current - 1)
  const end = Math.min(total - 2, current + 1)
  if (start > 1) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 2) pages.push('…')
  pages.push(total - 1)
  return pages
}
