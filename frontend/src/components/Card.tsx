import React from 'react'
import { motion } from 'framer-motion'
import { FiMinus, FiTrendingDown, FiTrendingUp } from 'react-icons/fi'

export interface CardTrend {
  label: string
  direction?: 'up' | 'down' | 'flat'
  tone?: 'positive' | 'negative' | 'neutral'
}

interface CardProps {
  title: string
  value: React.ReactNode
  icon?: React.ReactNode
  color?: 'accent' | 'green' | 'orange' | 'red' | 'cyan' | 'purple'
  children?: React.ReactNode
  subtitle?: string
  /** Trend text (string/element) or a structured { label, direction, tone } object. */
  trend?: React.ReactNode | CardTrend
  /** Optional numeric series rendered as an inline sparkline. */
  spark?: number[]
  /** When set, the whole card becomes a link. */
  href?: string
  /** When set, the whole card becomes clickable. */
  onClick?: () => void
  /** Override the accent colour used for the value/glow. */
  accent?: string
  /** Show a shimmering placeholder instead of the value. */
  loading?: boolean
}

const colorMap: Record<string, { glow: string; icon: string; value: string }> = {
  accent: { glow: 'var(--accent)',  icon: 'var(--accent-glow)',  value: 'var(--accent-bright)' },
  green:  { glow: 'var(--green)',   icon: 'var(--green-glow)',   value: 'var(--green)'  },
  orange: { glow: 'var(--orange)',  icon: 'var(--orange-glow)',  value: 'var(--orange)' },
  red:    { glow: 'var(--red)',     icon: 'var(--red-glow)',     value: 'var(--red)'    },
  cyan:   { glow: 'var(--cyan)',    icon: 'var(--cyan-glow)',    value: 'var(--cyan)'   },
  purple: { glow: 'var(--purple)',  icon: 'rgba(167,139,250,0.14)', value: 'var(--purple)' },
}

function isTrendObject(t: unknown): t is CardTrend {
  return (
    typeof t === 'object' &&
    t !== null &&
    !React.isValidElement(t) &&
    'label' in (t as Record<string, unknown>)
  )
}

function Trend({ trend }: { trend: React.ReactNode | CardTrend }) {
  if (trend === null || trend === undefined || trend === false) return null

  if (isTrendObject(trend)) {
    const positive = trend.tone
      ? trend.tone === 'positive'
      : trend.direction !== 'down'
    const Icon =
      trend.direction === 'down'
        ? FiTrendingDown
        : trend.direction === 'flat'
          ? FiMinus
          : FiTrendingUp
    const tone = trend.tone === 'neutral'
      ? 'var(--text-muted)'
      : positive
        ? 'var(--green)'
        : 'var(--red)'
    return (
      <div className="stat-trend" style={{ color: tone }}>
        <Icon size={13} /> {trend.label}
      </div>
    )
  }

  return <div className="stat-trend text-muted">{trend}</div>
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (!Array.isArray(values) || values.length < 2) return null

  const w = 84
  const h = 28
  const pad = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const coords = values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }))
  const line = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${coords[coords.length - 1].x.toFixed(1)} ${h} L${coords[0].x.toFixed(1)} ${h} Z`

  return (
    <svg
      className="card-spark"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ display: 'block', marginTop: 10, overflow: 'visible' }}
    >
      <path d={area} fill={color} opacity={0.12} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  )
}

export default function Card({
  title,
  value,
  icon = '◈',
  color = 'accent',
  children,
  subtitle,
  trend,
  spark,
  href,
  onClick,
  accent,
  loading,
}: CardProps) {
  const c = colorMap[color] ?? colorMap.accent
  const resolved = accent
    ? { glow: accent, icon: accent, value: accent }
    : c
  const interactive = Boolean(href || onClick)

  // Polymorphic root: an anchor when `href` is given, otherwise a div.
  const Root: React.ElementType = href ? motion.a : motion.div

  return (
    <Root
      href={href}
      onClick={onClick}
      role={!href && onClick ? 'button' : undefined}
      tabIndex={!href && onClick ? 0 : undefined}
      onKeyDown={
        !href && onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={`stat-card${interactive ? ' card-interactive' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      whileHover={interactive ? { y: -4 } : undefined}
      style={{
        color: 'inherit',
        textDecoration: 'none',
        cursor: interactive ? 'pointer' : undefined,
        outline: 'none',
      }}
    >
      <div
        className="stat-card-glow"
        style={{ background: resolved.glow, opacity: accent ? 0.18 : undefined }}
      />
      <div className="stat-icon" style={{ background: resolved.icon }}>
        <span style={{ fontSize: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 26, width: '65%', margin: '6px 0 8px' }} />
      ) : (
        <div className="stat-value" style={{ color: resolved.value }}>
          {value}
        </div>
      )}

      <div className="stat-label">{title}</div>
      {subtitle && <div className="stat-trend text-muted">{subtitle}</div>}
      {!loading && trend != null && <Trend trend={trend} />}
      {!loading && spark && spark.length > 1 && (
        <Sparkline values={spark} color={resolved.value} />
      )}
      {children}
    </Root>
  )
}
