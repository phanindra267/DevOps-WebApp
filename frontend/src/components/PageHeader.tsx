import React from 'react'
import { FiChevronRight } from 'react-icons/fi'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
  crumbs?: string[]
}

export default function PageHeader({ eyebrow, title, subtitle, icon, actions, crumbs }: PageHeaderProps) {
  return (
    <div className="page-header reveal" style={{ gap: 16 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {icon && (
          <div className="stat-icon" style={{
            width: 42, height: 42, marginBottom: 0, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(79,142,247,.2), rgba(34,211,238,.1))',
            color: 'var(--accent-bright)', border: '1px solid rgba(79,142,247,.3)',
          }}>{icon}</div>
        )}
        <div>
          {eyebrow && (
            <div style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              color: 'var(--accent-bright)', marginBottom: 4,
            }}>{eyebrow}</div>
          )}
          <h1 className="page-title gradient-text" style={{ fontSize: 25 }}>{title}</h1>
          {subtitle && <p className="page-subtitle" style={{ maxWidth: 720 }}>{subtitle}</p>}
          {crumbs && crumbs.length > 0 && (
            <div className="breadcrumb" style={{ marginTop: 8 }}>
              {crumbs.map((c, i) => (
                <React.Fragment key={c}>
                  {i > 0 && <FiChevronRight size={11} className="sep" />}
                  <span>{c}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  )
}
