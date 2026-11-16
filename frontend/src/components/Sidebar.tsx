import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/projects', label: 'Projects', icon: '📁' },
  { href: '/infrastructure', label: 'Infrastructure', icon: '🏗️' },
  { href: '/deployments', label: 'Deployments', icon: '🚀' },
  { href: '/pipelines', label: 'Pipelines', icon: '⚙️' },
  { href: '/security', label: 'Security', icon: '🛡️' },
  { href: '/monitoring', label: 'Monitoring', icon: '📈' },
  { href: '/cost', label: 'Cost & FinOps', icon: '💰' },
  { href: '/governance', label: 'Governance', icon: '📋' },
  { href: '/reliability', label: 'Reliability', icon: '🔧' },
];

const Sidebar: React.FC = () => {
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/') return router.pathname === '/';
    return router.pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: 240,
        minHeight: '100vh',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.25rem 1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #58a6ff, #3fb950)',
              fontWeight: 800,
              fontSize: '.85rem',
              color: '#fff',
            }}
          >
            CS
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', lineHeight: 1.2 }}>
              CloudOps
            </div>
            <div
              style={{
                fontSize: '.7rem',
                color: 'var(--text-secondary)',
                letterSpacing: '.05em',
              }}
            >
              SENTINEL
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '.75rem .5rem' }}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} legacyBehavior>
            <a
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.65rem',
                padding: '.55rem .75rem',
                borderRadius: 'var(--radius)',
                marginBottom: 2,
                fontSize: '.875rem',
                fontWeight: 500,
                color: isActive(item.href)
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                background: isActive(item.href)
                  ? 'rgba(88,166,255,.1)'
                  : 'transparent',
                textDecoration: 'none',
                transition: 'background .15s, color .15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href))
                  (e.currentTarget.style.background = 'rgba(88,166,255,.05)');
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href))
                  (e.currentTarget.style.background = 'transparent');
              }}
            >
              <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
              {isActive(item.href) && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 4,
                    height: 16,
                    borderRadius: 2,
                    background: 'var(--accent)',
                  }}
                />
              )}
            </a>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          fontSize: '.7rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        v0.1.0 · INT 378 Project
      </div>
    </aside>
  );
};

export default Sidebar;
