import React from 'react'

interface CardProps {
  title: string
  value: React.ReactNode
  icon?: React.ReactNode
  color?: 'accent' | 'green' | 'orange' | 'red' | 'cyan' | 'purple'
  children?: React.ReactNode
  subtitle?: string
}

const colorMap: Record<string, { glow: string; icon: string; value: string }> = {
  accent: { glow: 'var(--accent)',  icon: 'var(--accent-glow)',  value: 'var(--accent-bright)' },
  green:  { glow: 'var(--green)',   icon: 'var(--green-glow)',   value: 'var(--green)'  },
  orange: { glow: 'var(--orange)',  icon: 'var(--orange-glow)',  value: 'var(--orange)' },
  red:    { glow: 'var(--red)',     icon: 'var(--red-glow)',     value: 'var(--red)'    },
  cyan:   { glow: 'var(--cyan)',    icon: 'var(--cyan-glow)',    value: 'var(--cyan)'   },
  purple: { glow: 'var(--purple)',  icon: 'rgba(167,139,250,0.14)', value: 'var(--purple)' },
}

export default function Card({ title, value, icon = '◈', color = 'accent', children, subtitle }: CardProps) {
  const c = colorMap[color] ?? colorMap.accent
  return (
    <div className="stat-card">
      <div
        className="stat-card-glow"
        style={{ background: c.glow }}
      />
      <div className="stat-icon" style={{ background: c.icon }}>
        <span style={{ fontSize: 17, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      </div>
      <div className="stat-value" style={{ color: c.value }}>
        {value}
      </div>
      <div className="stat-label">{title}</div>
      {subtitle && <div className="stat-trend text-muted">{subtitle}</div>}
      {children}
    </div>
  )
}
