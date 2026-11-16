import React from 'react'
import { FiInbox } from 'react-icons/fi'

interface DataTableProps {
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[]
  data: any[]
  loading?: boolean
  emptyText?: string
}

export default function DataTable({ columns, data, loading, emptyText = 'No data available.' }: DataTableProps) {
  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }} />
        ))}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <FiInbox size={32} />
        </div>
        <div className="empty-state-title">Nothing here yet</div>
        <div className="empty-state-desc">{emptyText}</div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, ri) => (
            <tr key={ri}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
