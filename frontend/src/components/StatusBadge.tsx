import React from 'react'
import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: string
}

const map: Record<string, { cls: string; label?: string; live?: boolean }> = {
  healthy:    { cls: 'badge-success' },
  active:     { cls: 'badge-success', live: true },
  success:    { cls: 'badge-success' },
  applied:    { cls: 'badge-success' },
  passed:     { cls: 'badge-success' },
  compliant:  { cls: 'badge-success' },
  resolved:   { cls: 'badge-cyan' },
  running:    { cls: 'badge-cyan', live: true },
  pending:    { cls: 'badge-warning', live: true },
  firing:     { cls: 'badge-error', live: true },
  failed:     { cls: 'badge-error' },
  critical:   { cls: 'badge-error', live: true },
  warning:    { cls: 'badge-warning' },
  high:       { cls: 'badge-warning', label: 'high' },
  medium:     { cls: 'badge-warning' },
  low:        { cls: 'badge-neutral' },
  draft:      { cls: 'badge-neutral' },
  disabled:   { cls: 'badge-neutral' },
  open:       { cls: 'badge-info' },
  'in-progress': { cls: 'badge-cyan', live: true },
}

const urgent = new Set(['firing', 'failed', 'critical', 'error'])

export default function StatusBadge({ status }: StatusBadgeProps) {
  const key = String(status ?? '').toLowerCase()
  const entry = map[key] ?? { cls: 'badge-neutral' }
  const label = entry.label ?? status
  const isUrgent = urgent.has(key)
  const pulseDuration = isUrgent ? 1.4 : 2.4

  return (
    <motion.span
      className={`badge ${entry.cls}`}
      role="status"
      aria-label={`Status: ${label}`}
      title={String(label)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        textShadow: '0 0 10px rgba(255,255,255,0.07)',
        filter: 'brightness(1.08)',
      }}
    >
      <motion.span
        className="badge-dot"
        style={{
          position: 'relative',
          display: 'inline-flex',
          background: 'currentColor',
          flexShrink: 0,
        }}
        animate={{ opacity: [1, 0.55, 1], scale: [1, 0.82, 1] }}
        transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
      >
        {entry.live && (
          <motion.span
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'currentColor',
            }}
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.span>
      {label}
    </motion.span>
  )
}
