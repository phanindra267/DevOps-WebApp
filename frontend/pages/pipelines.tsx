import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import StatusBadge from '../src/components/StatusBadge'
import { getProjects, getPipelines, triggerPipeline, getJenkinsStatus } from '../src/lib/api'
import {
  FiPlay,
  FiExternalLink,
  FiCheckCircle,
  FiClock,
  FiTerminal,
  FiCpu,
  FiShield,
  FiLayers,
  FiCopy,
  FiCheck,
  FiRefreshCw,
} from 'react-icons/fi'

interface Stage {
  id: number
  name: string
  desc: string
  duration: string
}

const STAGES: Stage[] = [
  { id: 1, name: 'Checkout', desc: 'Git branch & workspace', duration: '0.8s' },
  { id: 2, name: 'Unit Tests', desc: 'Go tests & coverage', duration: '2.2s' },
  { id: 3, name: 'Static Analysis', desc: 'Code linting & vet', duration: '1.1s' },
  { id: 4, name: 'Dependency Scan', desc: 'Go modules vulnerability check', duration: '1.4s' },
  { id: 5, name: 'Secret Detection', desc: 'Scanning for leaked credentials', duration: '0.9s' },
  { id: 6, name: 'Docker Build', desc: 'Multi-stage container image', duration: '3.5s' },
  { id: 7, name: 'Security Gate', desc: 'Quality threshold validation', duration: '1.2s' },
  { id: 8, name: 'Deploy & S3', desc: 'Rolling update & S3 artifact', duration: '1.9s' },
]

export default function PipelinesPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0)
  const [pipelines, setPipelines] = useState<any[]>([])
  const [jenkinsStatus, setJenkinsStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [activeStageIndex, setActiveStageIndex] = useState<number>(-1)
  const [activeLog, setActiveLog] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadInitial() {
      try {
        const [projRes, jRes] = await Promise.allSettled([
          getProjects(),
          getJenkinsStatus(),
        ])
        if (projRes.status === 'fulfilled') {
          const pList = projRes.value.data || []
          setProjects(pList)
          if (pList.length > 0) setSelectedProjectId(pList[0].id)
        }
        if (jRes.status === 'fulfilled') {
          setJenkinsStatus(jRes.value.data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    loadInitial()
  }, [])

  const fetchPipelines = async (pid: number) => {
    if (!pid) return
    setLoading(true)
    try {
      const res = await getPipelines(pid)
      const list = res.data || []
      setPipelines(list)
      if (list.length > 0 && !activeLog) {
        setActiveLog(list[0].logs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedProjectId) fetchPipelines(selectedProjectId)
  }, [selectedProjectId])

  const handleRun = async () => {
    if (!selectedProjectId || running) return
    setRunning(true)
    setActiveStageIndex(0)

    // Simulate animated step progression through the 8 stages
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 400)

    try {
      const res = await triggerPipeline(selectedProjectId)
      setTimeout(async () => {
        clearInterval(interval)
        setActiveStageIndex(-1)
        setRunning(false)
        await fetchPipelines(selectedProjectId)
      }, 3500)
    } catch (err) {
      clearInterval(interval)
      setActiveStageIndex(-1)
      setRunning(false)
      alert('Pipeline trigger failed')
    }
  }

  const copyLog = () => {
    if (!activeLog) return
    navigator.clipboard.writeText(activeLog)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <Head>
        <title>Pipelines & Jenkins CI/CD | CloudOps Sentinel</title>
      </Head>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">CI/CD & Jenkins Orchestration</h1>
          <p className="page-subtitle">
            Local automated build, test, DevSecOps gates, container packaging & S3 artifact storage
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {projects.length > 0 && (
            <select
              className="form-input"
              style={{ width: 190 }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <a
            href="http://localhost:8085"
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: 'rgba(56, 189, 248, 0.4)' }}
          >
            <span>Open Jenkins</span>
            <FiExternalLink size={14} />
          </a>

          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            {running ? (
              <>
                <FiRefreshCw size={14} className="spin" />
                <span>Running Pipeline…</span>
              </>
            ) : (
              <>
                <FiPlay size={14} />
                <span>Trigger Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Jenkins & Free-Tier Integration Info Banner */}
      <div
        className="card"
        style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'rgba(56, 189, 248, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              <FiCpu size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Jenkins CI/CD Automation Engine</span>
                <span className="badge badge-success" style={{ fontSize: 10, padding: '2px 8px' }}>
                  ● {jenkinsStatus?.status?.toUpperCase() || 'ONLINE'} (v{jenkinsStatus?.version || '2.580.2'})
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Declarative <code>ci/Jenkinsfile</code> · Local Docker Agent · S3 Artifact Mirroring · 100% Free
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
              Port: 8085
            </span>
            <span className="badge badge-cyan" style={{ fontSize: 11 }}>
              Admin: admin / admin123
            </span>
            <span className="badge badge-success" style={{ fontSize: 11 }}>
              ✓ 0 Cloud Cost Guarantee
            </span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Stage Flowchart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div>
            <div className="card-title">Declarative Stage Execution Flow</div>
            <div className="card-subtitle">8-stage automated DevSecOps delivery pipeline</div>
          </div>
          {running && (
            <span className="badge badge-cyan" style={{ animation: 'pulse 1.5s infinite' }}>
              ● Execution in progress…
            </span>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 6,
          }}
        >
          {STAGES.map((s, idx) => {
            const isCompleted = activeStageIndex === -1 ? true : idx < activeStageIndex
            const isCurrent = activeStageIndex === idx
            return (
              <div
                key={s.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: isCurrent
                    ? '1px solid var(--accent)'
                    : isCompleted
                    ? '1px solid rgba(52, 211, 153, 0.4)'
                    : '1px solid var(--border)',
                  background: isCurrent
                    ? 'rgba(79, 142, 247, 0.12)'
                    : isCompleted
                    ? 'rgba(52, 211, 153, 0.05)'
                    : 'rgba(255, 255, 255, 0.02)',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>0{s.id}</span>
                  {isCurrent ? (
                    <span className="badge-dot" style={{ background: 'var(--accent)' }} />
                  ) : isCompleted ? (
                    <FiCheckCircle size={13} color="var(--green)" />
                  ) : (
                    <FiClock size={13} color="var(--text-muted)" />
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.desc}</div>
                <div style={{ fontSize: 10, color: isCompleted ? 'var(--green)' : 'var(--text-dim)', marginTop: 6, fontWeight: 500 }}>
                  {isCurrent ? 'Running…' : isCompleted ? `✓ ${s.duration}` : 'Pending'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Pipeline Runs & Console Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
        {/* Runs List */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pipeline History</div>
              <div className="card-subtitle">{pipelines.length} build execution(s)</div>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => fetchPipelines(selectedProjectId)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <FiRefreshCw size={12} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="skeleton" style={{ height: 48, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 48, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          ) : pipelines.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiLayers size={32} />
              </div>
              <div className="empty-state-title">No pipeline runs yet</div>
              <div className="empty-state-desc">Trigger a Jenkins pipeline above to generate builds.</div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 14 }}
                onClick={handleRun}
                disabled={running}
              >
                Run First Pipeline
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pipelines.map((p) => {
                const isSelected = activeLog === p.logs
                return (
                  <div
                    key={p.id}
                    onClick={() => setActiveLog(p.logs)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(79, 142, 247, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>Jenkins Build #{p.id}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        fontSize: 12,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>Trigger: {p.trigger_type}</span>
                      <span>{p.started_at ? new Date(p.started_at).toLocaleTimeString() : '—'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Live Logs Console */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiTerminal size={16} color="var(--accent)" />
              <div className="card-title">Pipeline Console Output</div>
            </div>
            {activeLog && (
              <button
                className="btn btn-sm"
                onClick={copyLog}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {copied ? <FiCheck size={12} color="var(--green)" /> : <FiCopy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
              </button>
            )}
          </div>

          {activeLog ? (
            <pre
              className="log-output"
              style={{
                minHeight: 380,
                maxHeight: 520,
                overflowY: 'auto',
                fontSize: 12,
                lineHeight: 1.6,
                fontFamily: "'JetBrains Mono', monospace",
                background: '#04060a',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: 16,
                color: '#e2e8f0',
              }}
            >
              {activeLog}
            </pre>
          ) : (
            <div
              className="empty-state"
              style={{ minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            >
              <FiTerminal size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
              <div>Select a pipeline build on the left to inspect its live console logs.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
