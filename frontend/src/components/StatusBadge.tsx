import React from 'react'

interface StatusBadgeProps {
  status: string
}

const map: Record<string, { cls: string; label?: string }> = {
  healthy:    { cls: 'badge-success' },
  active:     { cls: 'badge-success' },
  success:    { cls: 'badge-success' },
  applied:    { cls: 'badge-success' },
  passed:     { cls: 'badge-success' },
  compliant:  { cls: 'badge-success' },
  resolved:   { cls: 'badge-cyan' },
  running:    { cls: 'badge-cyan' },
  pending:    { cls: 'badge-warning' },
  firing:     { cls: 'badge-error' },
  failed:     { cls: 'badge-error' },
  critical:   { cls: 'badge-error' },
  warning:    { cls: 'badge-warning' },
  high:       { cls: 'badge-orange', label: 'high' },
  medium:     { cls: 'badge-warning' },
  low:        { cls: 'badge-neutral' },
  draft:      { cls: 'badge-neutral' },
  disabled:   { cls: 'badge-neutral' },
  open:       { cls: 'badge-info' },
  'in-progress': { cls: 'badge-cyan' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const entry = map[status?.toLowerCase()] ?? { cls: 'badge-neutral' }
  return (
    <span className={`badge ${entry.cls}`}>
      <span className="badge-dot" style={{ background: 'currentColor' }} />
      {entry.label ?? status}
    </span>
  )
}
