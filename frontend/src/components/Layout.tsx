import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  FiGrid, FiFolder, FiServer, FiSend, FiGitCommit, FiShield, FiActivity,
  FiZap, FiDollarSign, FiCheckSquare, FiCloud, FiLogOut, FiExternalLink,
  FiBookOpen, FiMenu, FiX, FiSearch, FiChevronRight, FiArrowUp,
  FiCommand, FiUser, FiSettings, FiBell, FiHome,
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

const tools = [
  { label: 'Jenkins',    href: 'http://localhost:8085', icon: FiGitCommit, external: true },
  { label: 'Prometheus', href: 'http://localhost:9090', icon: FiActivity,  external: true },
  { label: 'Grafana',    href: 'http://localhost:3001', icon: FiBell,      external: true },
]

const allNav = sections.flatMap((s) => s.items)

const labelFor = (path: string) => allNav.find((n) => n.href === path)?.label ||
  (path.startsWith('/projects/') ? 'Project Detail' : 'Workspace')

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [userMenu, setUserMenu] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'AD'
  const current = labelFor(router.pathname)

  // Persist the desktop collapse preference without breaking SSR hydration.
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === '1') setCollapsed(true)
  }, [])
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  // Close overlays on navigation.
  useEffect(() => {
    setMobileOpen(false)
    setSearchOpen(false)
    setUserMenu(false)
    setQuery('')
    setSelected(0)
  }, [router.pathname])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Global command palette shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setSearchOpen((v) => !v)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setUserMenu(false); setMobileOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => { if (searchOpen) setTimeout(() => searchRef.current?.focus(), 60) }, [searchOpen])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const items = [
      ...allNav.map((n) => ({ label: n.label, href: n.href, icon: n.icon, external: false })),
      ...tools,
    ]
    return q ? items.filter((i) => i.label.toLowerCase().includes(q)) : items
  }, [query])

  const go = (href: string, external?: boolean) => {
    setSearchOpen(false)
    if (external) window.open(href, '_blank', 'noopener,noreferrer')
    else router.push(href)
  }

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) go(results[selected].href, results[selected].external)
  }

  const navLinks = (onNavigate?: () => void) => sections.map((section) => (
    <div key={section.label}>
      <div className="sidebar-section-label">{section.label}</div>
      {section.items.map((item) => {
        const Icon = item.icon
        const active = router.pathname === item.href ||
          (item.href !== '/' && router.pathname.startsWith(item.href))
        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}
            className={`sidebar-link${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="sidebar-link-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Icon size={16} />
            </span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </div>
  ))

  return (
    <div className={`layout${collapsed ? ' sidebar-collapsed' : ''}`} style={{ position: 'relative' }}>
      <div className="bg-ambient-layer" />
      <div className="bg-grid-pattern" />

      {/* Mobile scrim */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="mobile-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar (desktop fixed / mobile drawer) */}
      <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon pulse-glow"><FiCloud size={20} color="#818cf8" /></div>
          <div>
            <div className="sidebar-logo-text">CloudOps</div>
            <div className="sidebar-logo-sub">Sentinel · INT 378</div>
          </div>
          <button className="menu-toggle" style={{ marginLeft: 'auto' }} onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"><FiX size={16} /></button>
        </div>

        <nav className="sidebar-nav">{navLinks(() => setMobileOpen(false))}</nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-username" style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user?.username ?? 'admin'}
              </div>
              <div className="sidebar-role">{user?.role ?? 'admin'}</div>
            </div>
            <button onClick={logout} title="Sign Out" data-tip="Sign out" className="nav-icon-btn">
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation"
              data-tip="Open menu"><FiMenu size={18} /></button>
            <button className="menu-toggle" onClick={() => setCollapsed((v) => !v)}
              aria-label="Toggle sidebar" data-tip="Expand / collapse"><FiChevronRight size={16}
              style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} /></button>

            <div className="breadcrumb">
              <FiHome size={13} />
              <span className="sep">/</span>
              <span>Workspace</span>
              <span className="sep">/</span>
              <strong>{current}</strong>
            </div>

            <div className="status-pill glow-border-green" style={{ padding: '6px 13px', borderRadius: 20 }}>
              <span className="status-dot ping-dot" style={{ background: '#10b981' }} />
              <span style={{ fontWeight: 600, fontSize: 12 }}>All Systems Operational</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· 14ms</span>
            </div>
          </div>

          <div className="topbar-right">
            <button className="btn btn-sm search-btn" onClick={() => setSearchOpen(true)} data-tip="Search (Ctrl+K)"
              style={{ gap: 8, color: 'var(--text-muted)' }}>
              <FiSearch size={14} /><span style={{ fontSize: 12 }}>Search</span>
              <kbd style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--border-bright)', borderRadius: 4 }}>⌘K</kbd>
            </button>
            <Link href="/syllabus" className="btn btn-sm curriculum-btn" data-tip="Curriculum hub"
              style={{ gap: 6, color: '#38bdf8', borderColor: 'rgba(56,189,248,.3)' }}>
              <FiBookOpen size={14} /><span>Curriculum Hub</span>
            </Link>
            {tools.map((t) => {
              const Icon = t.icon
              return (
                <a key={t.label} href={t.href} target="_blank" rel="noreferrer"
                  className="btn btn-sm" data-tip={`Open ${t.label}`}>
                  <Icon size={14} /><span>{t.label}</span><FiExternalLink size={11} />
                </a>
              )
            })}

            <div className="user-menu-wrap">
              <button className="topbar-user" onClick={() => setUserMenu((v) => !v)} aria-expanded={userMenu}
                aria-label="Account menu">
                <div className="topbar-avatar">{initials}</div>
                <span>{user?.username ?? 'admin'}</span>
              </button>
              <AnimatePresence>
                {userMenu && (
                  <motion.div className="user-menu" initial={{ opacity: 0, y: -8, scale: .97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .97 }}
                    transition={{ duration: .16 }}>
                    <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{user?.username ?? 'admin'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role ?? 'admin'} · local session</div>
                    </div>
                    <button onClick={() => { setUserMenu(false); router.push('/projects') }}><FiUser size={14} /> Workspace</button>
                    <button onClick={() => { setUserMenu(false); router.push('/syllabus') }}><FiSettings size={14} /> Curriculum</button>
                    <button className="danger" onClick={logout}><FiLogOut size={14} /> Sign out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="page-content">{children}</main>
      </div>

      {/* Command palette */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div className="cmd-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}>
            <motion.div className="cmd-panel" initial={{ opacity: 0, y: -18, scale: .98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: .98 }}
              transition={{ duration: .2, ease: [0.16, 1, 0.3, 1] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                <FiSearch size={17} color="var(--text-muted)" style={{ marginLeft: 18 }} />
                <input ref={searchRef} className="cmd-input" style={{ border: 0, paddingLeft: 4 }}
                  placeholder="Jump to a page or tool…" value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(0) }} onKeyDown={onSearchKey} />
                <FiCommand size={15} color="var(--text-dim)" style={{ marginRight: 18 }} />
              </div>
              <div className="cmd-list">
                {results.length === 0 && <div className="cmd-empty">No matches for “{query}”</div>}
                {results.map((r, i) => {
                  const Icon = r.icon
                  return (
                    <div key={`${r.href}-${i}`} className={`cmd-item${i === selected ? ' selected' : ''}`}
                      onMouseEnter={() => setSelected(i)} onClick={() => go(r.href, r.external)}>
                      <span className="cmd-icon"><Icon size={15} /></span>
                      <span style={{ flex: 1 }}>{r.label}</span>
                      {r.external && <FiExternalLink size={12} color="var(--text-dim)" />}
                      <FiChevronRight size={13} color="var(--text-dim)" />
                    </div>
                  )
                })}
              </div>
              <div style={{ padding: '9px 14px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 14 }}>
                <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTop && (
          <motion.button className="scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }}
            aria-label="Back to top" data-tip="Back to top"><FiArrowUp size={17} /></motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
