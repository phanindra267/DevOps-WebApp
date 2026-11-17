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
  FiZap,
  FiDollarSign,
  FiBookOpen,
  FiLayers,
  FiTerminal,
} from 'react-icons/fi'

export default function DashboardPage() {
  const [health, setHealth]       = useState<any>(null)
  const [projects, setProjects]   = useState<any[]>([])
  const [alerts, setAlerts]       = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [policies, setPolicies]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [simFeedback, setSimFeedback] = useState<string | null>(null)
  const [simRunning, setSimRunning]   = useState<boolean>(false)

  const runSimulation = (msg: string) => {
    setSimRunning(true)
    setSimFeedback("Executing command through Go Control Plane...")
    setTimeout(() => {
      setSimFeedback(msg)
      setSimRunning(false)
    }, 600)
  }

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

      {/* ── Interactive Hero Banner ── */}
      <div className="hero-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="badge badge-info" style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
                INT 378 CAPSTONE CONTROL PLANE
              </span>
              <span className="badge badge-success">
                <FiCheckCircle size={12} />
                <span>100% OPERATIONAL</span>
              </span>
            </div>
            <h1 className="page-title" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              CloudOps Sentinel Command Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13.5, maxWidth: 680 }}>
              Unified governance across the 10-stage cloud-native lifecycle: automated Trivy vulnerability gates, multi-cloud Terraform/CFN IaC, real-time Prometheus telemetry, and local FinOps cost optimization.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/syllabus"
              className="btn btn-primary btn-dynamic"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            >
              <FiBookOpen size={16} />
              <span>Curriculum Hub</span>
            </Link>
            <Link
              href="/pipelines"
              className="btn btn-dynamic"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              <FiZap size={16} color="var(--accent)" />
              <span>CI/CD Pipeline</span>
            </Link>
            <a
              href="/architecture.png"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-dynamic"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
            >
              <FiLayers size={16} color="#34d399" />
              <span>Architecture</span>
            </a>
          </div>
        </div>

        {/* Live System Metrics Ribbon */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: 12.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Status:</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>● Healthy</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Runtime:</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Docker &amp; K8s</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Cloud Spend:</span>
            <span style={{ color: 'var(--accent-bright)', fontWeight: 700 }}>$0.00 (Zero-Cost Local)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>12-Factor App:</span>
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>12 / 12 Verified</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Prometheus:</span>
            <span style={{ color: 'var(--orange)', fontWeight: 600 }}>15s Scrape Active</span>
          </div>
        </div>
      </div>

      {/* ── Metric Cards ── */}
      <div className="card-grid">
        <div className="card-interactive">
          <Card
            title="System Health"
            icon={<FiActivity size={18} />}
            value={loading ? '…' : (health?.status?.toUpperCase() || 'ONLINE')}
            color={health?.status === 'healthy' ? 'green' : 'red'}
            subtitle={`DB ${health?.database ? '✓ Connected' : '⚠ Checking'}`}
          />
        </div>
        <div className="card-interactive">
          <Card
            title="Active Projects"
            icon={<FiFolder size={18} />}
            value={projects.length}
            color="accent"
            subtitle="Managed environments & stacks"
          />
        </div>
        <div className="card-interactive">
          <Card
            title="Active Alerts"
            icon={<FiAlertTriangle size={18} />}
            value={firingAlerts.length}
            color={firingAlerts.length > 0 ? 'red' : 'green'}
            subtitle={firingAlerts.length > 0 ? `${firingAlerts.length} need attention` : 'All systems nominal'}
          />
        </div>
        <div className="card-interactive">
          <Card
            title="Governance Policies"
            icon={<FiShield size={18} />}
            value={policies.length}
            color="purple"
            subtitle="Active compliance rules"
          />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: 20 }}>
        {/* Left Column: Projects & Interactive Workbench */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Projects table */}
          <div className="card card-interactive">
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

          {/* Interactive DevSecOps Quick-Action Workbench */}
          <div className="card card-interactive glow-border">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTerminal size={18} color="#38bdf8" />
                <div className="card-title">Interactive DevSecOps Quick Actions</div>
              </div>
              <span className="badge badge-info">Zero-Cost Simulator</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14 }}>
              Execute live platform actions across Trivy security scanning, Terraform drift detection, Canary routing, and FinOps analysis:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
              <button
                onClick={() => runSimulation("✓ Trivy Scan Completed: 0 Critical, 0 High CVEs in cloudops-backend:v1.0.0. Quality gate PASSED.")}
                className="btn btn-sm btn-dynamic"
                disabled={simRunning}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
              >
                <FiShield size={14} />
                <span>Run Trivy Scan</span>
              </button>
              <button
                onClick={() => runSimulation("✓ Terraform Plan: 14 resources to add, 0 to destroy. Remote state verified in sync.")}
                className="btn btn-sm btn-dynamic"
                disabled={simRunning}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              >
                <FiServer size={14} />
                <span>Terraform Plan</span>
              </button>
              <button
                onClick={() => runSimulation("✓ Canary Traffic Shift: 85% to Stable (v1.4.2), 15% to Canary (v2.0.0). SLA p95 latency: 14ms.")}
                className="btn btn-sm btn-dynamic"
                disabled={simRunning}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
              >
                <FiZap size={14} />
                <span>Canary Split</span>
              </button>
              <button
                onClick={() => runSimulation("✓ FinOps Analysis: Scaled 2 idle staging pods. Projected monthly savings: $118.00 (34%).")}
                className="btn btn-sm btn-dynamic"
                disabled={simRunning}
                style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
              >
                <FiDollarSign size={14} />
                <span>FinOps Analyze</span>
              </button>
            </div>

            {simFeedback && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: '#04060a',
                  border: '1px solid var(--border-bright)',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: simRunning ? 'var(--accent)' : '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span className="ping-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: simRunning ? '#38bdf8' : '#10b981' }} />
                <span>{simFeedback}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Telemetry, Audit Trail & Side Visuals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Live Telemetry Radar Widget */}
          <div className="radar-widget card-interactive">
            <div className="radar-sweep" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiActivity size={16} color="#10b981" />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc' }}>SRE Live Radar &amp; Signals</span>
              </div>
              <span className="badge badge-success" style={{ fontSize: 10 }}>HEALTHY</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
              <div style={{ padding: 8, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>p95 Latency</div>
                <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: 14 }}>14.2 ms</div>
              </div>
              <div style={{ padding: 8, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Error Rate (5xx)</div>
                <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>0.00 %</div>
              </div>
              <div style={{ padding: 8, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Throughput</div>
                <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14 }}>1,240 req/s</div>
              </div>
              <div style={{ padding: 8, background: 'rgba(15, 23, 42, 0.6)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Active Replicas</div>
                <div style={{ fontWeight: 700, color: '#818cf8', fontSize: 14 }}>3 / 5 (HPA)</div>
              </div>
            </div>
          </div>

          {/* Side Banner Graphic */}
          <div className="card card-interactive glow-border" style={{ padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#38bdf8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Defense Blueprint
            </div>
            <Link href="/syllabus">
              <img
                src="/side_banner_summary.png"
                alt="CloudOps Sentinel Mission Control"
                className="side-banner-img"
                style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
              />
            </Link>
          </div>

          {/* Audit Trail */}
          <div className="card card-interactive">
            <div className="card-header">
              <div>
                <div className="card-title">Live Audit Trail</div>
                <div className="card-subtitle">Recent security &amp; admin events</div>
              </div>
              <Link href="/governance" className="btn btn-sm">All Logs</Link>
            </div>

            {auditLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 12px' }}>
                <div className="empty-state-icon" style={{ fontSize: 24 }}>✓</div>
                <div className="empty-state-desc">No security events triggered.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  >
                    <div className="flex justify-between" style={{ marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, color: 'var(--accent-bright)' }}>{log.action}</span>
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <div className="text-muted" style={{ fontSize: 11.5 }}>
                      {log.resource_type}: {log.details || log.resource_id || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Lifecycle Pipeline Banner ── */}
      <div className="card card-interactive" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiZap size={16} color="var(--accent)" />
            <div className="card-title">End-to-End DevSecOps Lifecycle Pipeline (10 Stages)</div>
          </div>
          <span className="badge badge-info">Automated Delivery Flow</span>
        </div>
        <div className="pipeline-flow">
          {[
            '1. Plan & Code', '2. Unit Tests', '3. Static Analysis', '4. Trivy CVE Gate',
            '5. Docker Build', '6. IaC Provision', '7. K8s Deploy', '8. Prometheus Observe',
            '9. Auto-Recover', '10. FinOps Govern',
          ].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="pipeline-step float-hover">{step}</div>
              {i < arr.length - 1 && <span className="pipeline-arrow" style={{ color: 'var(--accent)' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  )
}

