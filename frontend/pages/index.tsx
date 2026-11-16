import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Card from '../src/components/Card'
import StatusBadge from '../src/components/StatusBadge'
import { getProjects, getHealth, getAlerts, getAuditLogs, getPolicies } from '../src/lib/api'
import {
  FiActivity,
  FiFolder,
  FiAlertTriangle,
  FiShield,
  FiPlus,
  FiExternalLink,
  FiArrowRight,
  FiCheckCircle,
  FiServer,
  FiCpu,
  FiGitCommit,
} from 'react-icons/fi'

export default function DashboardPage() {
  const [health, setHealth]       = useState<any>(null)
  const [projects, setProjects]   = useState<any[]>([])
  const [alerts, setAlerts]       = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [policies, setPolicies]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [h, p, a, l, pol] = await Promise.allSettled([
          getHealth(), getProjects(), getAlerts(), getAuditLogs(), getPolicies(),
        ])
        if (h.status   === 'fulfilled') setHealth(h.value.data)
        if (p.status   === 'fulfilled') setProjects(p.value.data || [])
        if (a.status   === 'fulfilled') setAlerts(a.value.data || [])
        if (l.status   === 'fulfilled') setAuditLogs(l.value.data || [])
        if (pol.status === 'fulfilled') setPolicies(pol.value.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const firingAlerts = alerts.filter((a) => a.status === 'firing')

  return (
    <>
      <Head><title>Dashboard | CloudOps Sentinel</title></Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Operational Dashboard</h1>
          <p className="page-subtitle">
            Unified DevSecOps overview · infrastructure · observability · FinOps
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/projects" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FiPlus size={16} />
            <span>New Project</span>
          </Link>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>Grafana</span>
            <FiExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="card-grid">
        <Card
          title="System Health"
          icon={<FiActivity size={18} />}
          value={loading ? '…' : (health?.status?.toUpperCase() || 'ONLINE')}
          color={health?.status === 'healthy' ? 'green' : 'red'}
          subtitle={`DB ${health?.database ? '✓ Connected' : '⚠ Checking'}`}
        />
        <Card
          title="Active Projects"
          icon={<FiFolder size={18} />}
          value={projects.length}
          color="accent"
          subtitle="Managed environments & stacks"
        />
        <Card
          title="Active Alerts"
          icon={<FiAlertTriangle size={18} />}
          value={firingAlerts.length}
          color={firingAlerts.length > 0 ? 'red' : 'green'}
          subtitle={firingAlerts.length > 0 ? `${firingAlerts.length} need attention` : 'All systems nominal'}
        />
        <Card
          title="Governance Policies"
          icon={<FiShield size={18} />}
          value={policies.length}
          color="purple"
          subtitle="Active compliance rules"
        />
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 20 }}>
        {/* Projects table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Managed Projects</div>
              <div className="card-subtitle">{projects.length} project(s) registered</div>
            </div>
            <Link href="/projects" className="btn btn-sm">View All →</Link>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◉</div>
              <div className="empty-state-title">No projects yet</div>
              <div className="empty-state-desc">Create your first project to get started.</div>
              <Link href="/projects" className="btn btn-primary btn-sm">Create Project</Link>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.slice(0, 6).map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link href={`/projects/${p.id}`}>{p.name}</Link>
                      </td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{p.description || '—'}</td>
                      <td style={{ fontSize: 12 }} className="text-muted">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <Link href={`/projects/${p.id}`} className="btn btn-xs">Manage</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Audit feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Audit Trail</div>
              <div className="card-subtitle">Recent platform activity</div>
            </div>
            <Link href="/governance" className="btn btn-sm">All Logs</Link>
          </div>

          {auditLogs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◉</div>
              <div className="empty-state-desc">No audit events yet.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {auditLogs.slice(0, 7).map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid var(--border)',
                    fontSize: 12.5,
                  }}
                >
                  <div className="flex justify-between" style={{ marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, color: 'var(--accent-bright)' }}>{log.action}</span>
                    <span className="text-muted" style={{ fontSize: 11 }}>
                      {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <div className="text-muted">
                    {log.resource_type}: {log.details || log.resource_id || '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Lifecycle Pipeline Banner ── */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">End-to-End Lifecycle Pipeline</div>
          <span className="badge badge-info">DevSecOps Flow</span>
        </div>
        <div className="pipeline-flow">
          {[
            'Plan & Code', 'Unit Tests', 'DevSecOps Scan', 'Container Build',
            'IaC Provision', 'K8s Deploy', 'Monitor', 'FinOps Optimize',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="pipeline-step">{i + 1}. {step}</div>
              {i < arr.length - 1 && <span className="pipeline-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  )
}
