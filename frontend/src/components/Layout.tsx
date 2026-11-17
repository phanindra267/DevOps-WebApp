import React, { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../context/AuthContext'
import {
  FiGrid,
  FiFolder,
  FiServer,
  FiSend,
  FiGitCommit,
  FiShield,
  FiActivity,
  FiZap,
  FiDollarSign,
  FiCheckSquare,
  FiCloud,
  FiLogOut,
  FiExternalLink,
  FiBookOpen,
} from 'react-icons/fi'

const sections = [
  {
    label: 'Platform',
    items: [
      { href: '/',               label: 'Dashboard',       icon: FiGrid },
      { href: '/projects',       label: 'Projects',        icon: FiFolder },
      { href: '/infrastructure', label: 'Infrastructure',  icon: FiServer },
      { href: '/deployments',    label: 'Deployments',     icon: FiSend },
      { href: '/pipelines',      label: 'Pipelines',       icon: FiGitCommit },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/security',    label: 'Security',    icon: FiShield },
      { href: '/monitoring',  label: 'Monitoring',  icon: FiActivity },
      { href: '/reliability', label: 'Reliability', icon: FiZap },
    ],
  },
  {
    label: 'FinOps & Policy',
    items: [
      { href: '/cost',       label: 'Cost & FinOps', icon: FiDollarSign },
      { href: '/governance', label: 'Governance',    icon: FiCheckSquare },
    ],
  },
  {
    label: 'Academic (INT 378)',
    items: [
      { href: '/syllabus',   label: 'Curriculum Hub', icon: FiBookOpen },
    ],
  },
]

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'

  return (
    <div className="layout" style={{ position: 'relative' }}>
      {/* ── Ambient Background Lighting & Cyber Grid ── */}
      <div className="bg-ambient-layer" />
      <div className="bg-grid-pattern" />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon pulse-glow">
            <FiCloud size={20} color="#6366f1" />
          </div>
          <div>
            <div className="sidebar-logo-text">CloudOps</div>
            <div className="sidebar-logo-sub">Sentinel · INT 378</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => {
                const IconComponent = item.icon
                const active =
                  router.pathname === item.href ||
                  (item.href !== '/' && router.pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link${active ? ' active' : ''}`}
                  >
                    <span className="sidebar-link-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <IconComponent size={16} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="sidebar-username"
                style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                {user?.username ?? 'admin'}
              </div>
              <div className="sidebar-role">{user?.role ?? 'admin'}</div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px',
                borderRadius: '6px',
                transition: 'color 0.15s, background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="status-pill glow-border-green" style={{ padding: '6px 14px', borderRadius: 20 }}>
              <span className="status-dot ping-dot" style={{ background: '#10b981' }} />
              <span style={{ fontWeight: 600, fontSize: 12.5 }}>All Systems Operational</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· 14ms Latency</span>
            </div>
            <div
              className="badge"
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                color: '#a5b4fc',
                fontSize: 11,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 16,
              }}
            >
              Kakumani Phaneendra · Reg: 12418953 (LPU)
            </div>
          </div>
          <div className="topbar-right">
            <Link
              href="/syllabus"
              className="btn btn-sm btn-dynamic"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}
            >
              <FiBookOpen size={13} />
              <span>Curriculum Hub</span>
            </Link>
            <a
              href="http://localhost:8085"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>Jenkins</span>
              <FiExternalLink size={12} />
            </a>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>Prometheus</span>
              <FiExternalLink size={12} />
            </a>
            <a
              href="http://localhost:3001"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>Grafana</span>
              <FiExternalLink size={12} />
            </a>
            <div className="topbar-user">
              <div className="topbar-avatar">{initials}</div>
              <span>{user?.username ?? 'admin'}</span>
              <button
                onClick={logout}
                title="Logout"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)'
                }}
              >
                <FiLogOut size={14} />
              </button>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}