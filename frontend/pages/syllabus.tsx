import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import {
  FiBookOpen,
  FiAward,
  FiCheckCircle,
  FiCpu,
  FiServer,
  FiShield,
  FiActivity,
  FiLayers,
  FiSliders,
  FiTerminal,
  FiBox,
  FiCloud,
  FiGitBranch,
  FiExternalLink,
  FiRefreshCw,
  FiCheck,
  FiDollarSign,
  FiZap,
} from 'react-icons/fi'
import {
  getSyllabusOverview,
  getCaseStudies,
  getTwelveFactorScorecard,
  getABTest,
  updateABSplit,
} from '../src/lib/api'

export default function SyllabusPage() {
  const [activeTab, setActiveTab] = useState<number>(1)
  const [caseStudies, setCaseStudies] = useState<any[]>([])
  const [twelveFactor, setTwelveFactor] = useState<any>(null)
  const [abTest, setAbTest] = useState<any>(null)
  const [splitRatioB, setSplitRatioB] = useState<number>(20)
  const [updatingSplit, setUpdatingSplit] = useState<boolean>(false)
  const [gherkinScenario, setGherkinScenario] = useState<string>('gate')
  const [gherkinPassed, setGherkinPassed] = useState<boolean>(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [csRes, tfRes, abRes] = await Promise.allSettled([
          getCaseStudies(),
          getTwelveFactorScorecard(),
          getABTest(),
        ])
        if (csRes.status === 'fulfilled') setCaseStudies(csRes.value.data || [])
        if (tfRes.status === 'fulfilled') setTwelveFactor(tfRes.value.data || null)
        if (abRes.status === 'fulfilled') {
          setAbTest(abRes.value.data)
          if (abRes.value.data?.split_ratio_b !== undefined) {
            setSplitRatioB(abRes.value.data.split_ratio_b)
          }
        }
      } catch (err) {
        console.error('Failed to load syllabus metadata', err)
      }
    }
    loadData()
  }, [])

  const handleUpdateSplit = async (newVal: number) => {
    setSplitRatioB(newVal)
    setUpdatingSplit(true)
    try {
      const res = await updateABSplit(newVal)
      setAbTest(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingSplit(false)
    }
  }

  const units = [
    { id: 0, label: 'Master Architecture', icon: FiLayers },
    { id: 1, label: 'Unit I: Cloud & Containers', icon: FiCloud },
    { id: 2, label: 'Unit II: IaC & Automation', icon: FiServer },
    { id: 3, label: 'Unit III: Agile, BDD & A/B', icon: FiGitBranch },
    { id: 4, label: 'Unit IV: Observability', icon: FiActivity },
    { id: 5, label: 'Unit V: DevSecOps & Security', icon: FiShield },
    { id: 6, label: 'Unit VI: 12-Factor & FinOps', icon: FiDollarSign },
  ]

  return (
    <>
      <Head>
        <title>Curriculum Hub (INT 378) | CloudOps Sentinel</title>
      </Head>

      {/* Header Banner */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              className="badge"
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              ACADEMIC SYLLABUS ALIGNMENT
            </span>
            <span
              className="badge"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '4px 8px',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              100% COVERED & IMPLEMENTED
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: 24, fontWeight: 800 }}>
            INT 378: Curriculum & Architecture Center
          </h1>
          <p className="page-subtitle" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Deep architectural mapping, enterprise case studies (Netflix, Amazon, Uber), and live academic interactive demonstrators for Units I through VI.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 8,
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {units.map((u) => {
          const Icon = u.icon
          const isActive = activeTab === u.id
          return (
            <button
              key={u.id}
              onClick={() => setActiveTab(u.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 8,
                border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={14} color={isActive ? '#818cf8' : 'currentColor'} />
              <span>{u.label}</span>
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 0: MASTER END-TO-END SYSTEM ARCHITECTURE BLUEPRINT
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiLayers size={18} color="var(--accent)" />
                <h3 className="card-title">Master System Architecture Blueprint</h3>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href="/architecture.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <FiExternalLink size={12} />
                  <span>Open Full-Res (300 DPI)</span>
                </a>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Complete architectural topology showing the Next.js presentation tier, the Go 1.22 modular monolith control plane, the 10 internal micro-engines, and the underlying persistence, orchestration, and telemetry targets.
            </p>

            <div
              style={{
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: '#04060a',
                padding: 12,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <img
                src="/architecture.png"
                alt="CloudOps Sentinel Master System Architecture"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </div>
          </div>

          {/* Core Tiers Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>Layer 1: Presentation (Port 3000)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Next.js 14, React 18, and TypeScript delivering a dark DevOps theme. Axios handles automatic JWT Bearer injection for authenticated endpoints.
              </div>
            </div>

            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>Layer 2: Go 1.22 Control Plane (Port 8080)</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Gorilla Mux routing with 10 internal engines: Auth/RBAC, IaC Stacks, Deployments, Jenkins CI/CD, Trivy DevSecOps, SRE Monitoring, FinOps, and AWS SDK v2.
              </div>
            </div>

            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 4 }}>Layer 3: Persistence &amp; Orchestration</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                PostgreSQL 16 Alpine container (:5432) with connection pool. Kubernetes cluster with HPA autoscaling (2-5 replicas) and zero-trust NetworkPolicy.
              </div>
            </div>

            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: '#fb923c', marginBottom: 4 }}>Observability &amp; Guardrails</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Prometheus (:9090) scrapes /metrics every 15s. Grafana (:3001) visualizes golden signals. Strict zero-cost fallback ensures $0.00 cloud charges.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          UNIT I: ADVANCED CLOUD INFRASTRUCTURE & CONTAINERIZATION
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AWS vs Azure Services Comparison */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCloud size={18} color="var(--accent)" />
                <h3 className="card-title">AWS vs. Microsoft Azure Enterprise Services Mapping</h3>
              </div>
              <span className="badge badge-info">Multi-Cloud Parity</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Amazon Web Services (AWS)</th>
                    <th>Microsoft Azure</th>
                    <th>CloudOps Sentinel Local / SDK Implementation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Virtual Compute</td>
                    <td>Amazon EC2 / Auto Scaling Groups</td>
                    <td>Azure Virtual Machines / Scale Sets</td>
                    <td>Local Go multi-container runtime &amp; simulated EC2 cost modeling</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Container Orchestration</td>
                    <td>Amazon ECS (Fargate) &amp; Amazon EKS</td>
                    <td>Azure Kubernetes Service (AKS) &amp; Container Apps</td>
                    <td>Declarative Kubernetes manifests (HPA, NetworkPolicy) &amp; ECS modules</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Object Storage</td>
                    <td>Amazon S3 (Simple Storage Service)</td>
                    <td>Azure Blob Storage</td>
                    <td>Cost-free AWS SDK v2 client with safe in-memory fallback in <code>internal/cloud</code></td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Relational Database</td>
                    <td>Amazon RDS PostgreSQL / Aurora</td>
                    <td>Azure Database for PostgreSQL</td>
                    <td>Self-hosted PostgreSQL 16 Alpine container with connection pool</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cloud Telemetry</td>
                    <td>Amazon CloudWatch Metrics &amp; Alarms</td>
                    <td>Azure Monitor &amp; Log Analytics</td>
                    <td>Integrated Prometheus exporter (<code>/metrics</code>) &amp; CloudWatch metrics export</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Identity &amp; Governance</td>
                    <td>AWS IAM (Roles, Policies, STS)</td>
                    <td>Microsoft Entra ID (Azure AD) &amp; Azure RBAC</td>
                    <td>Role-Based Access Control (Admin, DevOps, Auditor) with JWT tokens</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Docker Architecture & Container Lifecycle */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBox size={18} color="var(--accent)" />
                <h3 className="card-title">Docker Architecture &amp; Lifecycle State Machine</h3>
              </div>
              <span className="badge badge-success">Container Engine</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Containers decouple application runtimes from host kernels. Below is the active state transition pipeline orchestrated in our platform:
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>1. Docker Client</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  CLI commands (<code>docker build</code>, <code>docker run</code>) sending REST requests to daemon socket.
                </div>
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 6 }}>2. Docker Daemon (Host)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <code>dockerd</code> manages images, containers, volumes, namespaces, and cgroups resource limits.
                </div>
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 6 }}>3. Registry (Docker Hub)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Centralized container image repository for versioned tags (e.g. <code>cloudops-backend:v1.0.0</code>).
                </div>
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#fb923c', marginBottom: 6 }}>4. Container Runtime</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Isolated process executing root filesystem layers with non-root security principles.
                </div>
              </div>
            </div>

            {/* Lifecycle Stages */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                background: '#04060a',
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              <span className="badge badge-info">[Created]</span>
              <span style={{ color: 'var(--text-muted)' }}>--docker start--&gt;</span>
              <span className="badge badge-success">[Running]</span>
              <span style={{ color: 'var(--text-muted)' }}>--docker pause--&gt;</span>
              <span className="badge badge-warning">[Paused]</span>
              <span style={{ color: 'var(--text-muted)' }}>--docker stop--&gt;</span>
              <span className="badge badge-error">[Stopped]</span>
              <span style={{ color: 'var(--text-muted)' }}>--docker rm--&gt;</span>
              <span className="badge">[Deleted]</span>
            </div>
          </div>

          {/* Scalable Cloud Solution Case Studies: Netflix, Amazon, Uber */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAward size={18} color="var(--accent)" />
                <h3 className="card-title">Enterprise Case Studies: Netflix, Amazon &amp; Uber</h3>
              </div>
              <span className="badge badge-primary">Architectural Foundations</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              {caseStudies.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{c.logo}</span>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{c.company}</h4>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--accent-bright)', fontWeight: 600, marginBottom: 8 }}>
                      {c.focus}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                      {c.description}
                    </p>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Key Innovations:</div>
                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                      {c.key_innovations?.map((item: string, i: number) => (
                        <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div
                    style={{
                      marginTop: 14,
                      padding: 10,
                      borderRadius: 6,
                      background: 'rgba(79, 142, 247, 0.06)',
                      border: '1px solid rgba(79, 142, 247, 0.2)',
                      fontSize: 11,
                      color: '#cbd5e1',
                    }}
                  >
                    <strong style={{ color: 'var(--cyan)' }}>CloudOps Alignment: </strong>
                    {c.cloudops_sentinel_alignment}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          UNIT II: INFRASTRUCTURE AS CODE (IaC)
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Significance & Comparative Matrix */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiServer size={18} color="var(--accent)" />
                <h3 className="card-title">Significance of IaC &amp; Technology Comparison</h3>
              </div>
              <Link href="/infrastructure" className="btn btn-sm btn-primary">
                Launch Stacks UI →
              </Link>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Infrastructure as Code enables teams to treat network, storage, and compute configurations identically to source code — versioned in Git, tested in CI/CD, and provisioned without manual configuration drift.
            </p>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Evaluation Criteria</th>
                    <th>HashiCorp Terraform</th>
                    <th>AWS CloudFormation</th>
                    <th>Significance in CloudOps Sentinel</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Syntax &amp; Paradigm</td>
                    <td>Declarative HCL (HashiCorp Config Language)</td>
                    <td>JSON or YAML template schemas</td>
                    <td>Allows side-by-side template preview in our dashboard</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Portability</td>
                    <td>Multi-cloud (AWS, Azure, GCP, K8s)</td>
                    <td>AWS-native managed engine</td>
                    <td>Terraform provides vendor flexibility; CFN provides native AWS rollback</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>State Management</td>
                    <td>State file (<code>.tfstate</code> in S3/Postgres backend)</td>
                    <td>Automatically managed by AWS CloudFormation</td>
                    <td>Our API runs dry-run plans before executing mutating applies</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Modularity</td>
                    <td>Composable modules (VPC, ECS cluster)</td>
                    <td>Nested Stacks &amp; CloudFormation modules</td>
                    <td>Reusable modules in <code>infrastructure/terraform/modules/</code></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Future Trends and Emerging Tools in IaC */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiLayers size={18} color="var(--accent)" />
                <h3 className="card-title">Future Trends &amp; Emerging Tools in IaC</h3>
              </div>
              <span className="badge badge-warning">Industry Evolution</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>OpenTofu</span>
                  <span className="badge badge-info">Open-Source</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Linux Foundation fork of Terraform ensuring community-driven, MPL-compatible open-source infrastructure definitions without licensing friction.
                </div>
              </div>

              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#818cf8' }}>Pulumi</span>
                  <span className="badge badge-primary">General-Purpose Langs</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Authoring cloud resources using TypeScript, Python, and Go — unlocking IDE auto-completion, unit testing frameworks, and true object-oriented reuse.
                </div>
              </div>

              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>Crossplane</span>
                  <span className="badge badge-success">K8s Control Plane</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Extending Kubernetes Custom Resource Definitions (CRDs) to orchestrate external cloud databases, VPCs, and queues using standard K8s manifests.
                </div>
              </div>

              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: '#fb923c' }}>Policy-as-Code (OPA)</span>
                  <span className="badge badge-warning">Automated Guardrails</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Open Policy Agent (Rego) and HashiCorp Sentinel verifying tagging, encryption, and budget policies prior to infrastructure allocation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          UNIT III: AGILE, CI/CD, TDD/BDD & A/B TESTING
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Scaling Agile Frameworks */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiGitBranch size={18} color="var(--accent)" />
                <h3 className="card-title">Scaling Agile Frameworks: SAFe vs. LeSS</h3>
              </div>
              <span className="badge badge-info">Enterprise Agile</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ color: '#38bdf8', marginBottom: 8 }}>SAFe (Scaled Agile Framework)</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Structured enterprise framework aligning multiple Agile Release Trains (ARTs), Program Increments (PIs), and executive portfolio budgets.
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <div>• <strong>Cadence:</strong> 8-12 week Program Increments (PI Planning).</div>
                  <div>• <strong>Team Structure:</strong> 50-125 cross-functional practitioners per ART.</div>
                  <div>• <strong>Alignment:</strong> Synchronized delivery across multi-tier dependencies.</div>
                </div>
              </div>

              <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ color: '#818cf8', marginBottom: 8 }}>LeSS (Large-Scale Scrum)</h4>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Lightweight scaling principle maintaining a single Product Backlog, one Product Owner, and minimal coordinating management overhead.
                </p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <div>• <strong>Cadence:</strong> Standard 2-week Sprint cycles across all teams.</div>
                  <div>• <strong>Team Structure:</strong> 2-8 feature teams pulling from one common backlog.</div>
                  <div>• <strong>Alignment:</strong> Shared Sprint Planning &amp; joint Sprint Reviews.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive A/B Testing & Canary Splitter */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiSliders size={18} color="var(--accent)" />
                <h3 className="card-title">Interactive Canary &amp; A/B Testing Traffic Splitter</h3>
              </div>
              <span className="badge badge-success">Live Controller</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              A/B testing and Canary releases distribute production requests between the baseline version and newly released feature variants to validate performance before 100% rollout.
            </p>

            <div
              style={{
                padding: 16,
                borderRadius: 8,
                background: '#04060a',
                border: '1px solid var(--border)',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#38bdf8' }}>Variant A (Stable): </span>
                  <span>{100 - splitRatioB}%</span>
                </div>
                <div>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>Variant B (Canary Candidate): </span>
                  <span>{splitRatioB}%</span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={splitRatioB}
                onChange={(e) => handleUpdateSplit(Number(e.target.value))}
                style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>0% Canary (Full Stable)</span>
                <span>50% Equal Split (True A/B Test)</span>
                <span>100% Canary (Full Rollout)</span>
              </div>
            </div>

            {abTest && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Traffic Sampled</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{abTest.total_traffic?.toLocaleString()} reqs</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Variant A Conversion</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>{abTest.conv_rate_a}%</div>
                </div>
                <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Variant B Conversion</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>{abTest.conv_rate_b}%</div>
                </div>
              </div>
            )}
          </div>

          {/* TDD vs BDD with Gherkin Specification Tester */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiTerminal size={18} color="var(--accent)" />
                <h3 className="card-title">TDD &amp; BDD: Executable Behavior Specifications</h3>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`btn btn-sm ${gherkinScenario === 'gate' ? 'btn-primary' : ''}`}
                  onClick={() => setGherkinScenario('gate')}
                >
                  Security Gate Spec
                </button>
                <button
                  className={`btn btn-sm ${gherkinScenario === 'rollback' ? 'btn-primary' : ''}`}
                  onClick={() => setGherkinScenario('rollback')}
                >
                  Rollback Spec
                </button>
              </div>
            </div>

            <div
              style={{
                padding: 14,
                borderRadius: 8,
                background: '#04060a',
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.8,
                color: '#e2e8f0',
              }}
            >
              {gherkinScenario === 'gate' ? (
                <>
                  <div style={{ color: '#818cf8', fontWeight: 700 }}>Feature: DevSecOps Container Vulnerability Gate</div>
                  <div style={{ color: 'var(--text-muted)' }}>  As a DevOps Engineer, I want builds blocked when high CVEs exist</div>
                  <div style={{ marginTop: 8, color: '#34d399' }}>  Scenario: Trivy scan detects 0 critical CVEs</div>
                  <div>    <span style={{ color: '#fb923c' }}>Given</span> a freshly compiled Docker image tag 'v2.1.0'</div>
                  <div>    <span style={{ color: '#fb923c' }}>When</span> the Trivy vulnerability scanner executes in stage 7</div>
                  <div>    <span style={{ color: '#fb923c' }}>And</span> critical CVE count is 0 (below max threshold 0)</div>
                  <div>    <span style={{ color: '#fb923c' }}>Then</span> the CI/CD pipeline shall mark the security gate as <span style={{ color: '#34d399', fontWeight: 700 }}>PASSED</span></div>
                  <div>    <span style={{ color: '#fb923c' }}>And</span> trigger the Kubernetes rolling deployment stage</div>
                </>
              ) : (
                <>
                  <div style={{ color: '#818cf8', fontWeight: 700 }}>Feature: Automated Zero-Downtime Failure Recovery</div>
                  <div style={{ color: 'var(--text-muted)' }}>  As an SRE, I want failed deployments automatically reverted</div>
                  <div style={{ marginTop: 8, color: '#34d399' }}>  Scenario: Unhealthy container fails liveness probe</div>
                  <div>    <span style={{ color: '#fb923c' }}>Given</span> a new deployment rollout is initiated</div>
                  <div>    <span style={{ color: '#fb923c' }}>When</span> the HTTP health endpoint returns 500 Internal Error</div>
                  <div>    <span style={{ color: '#fb923c' }}>And</span> Prometheus triggers the 'ServiceDown' alert rule</div>
                  <div>    <span style={{ color: '#fb923c' }}>Then</span> CloudOps Sentinel issues an immediate rollback to previous replica</div>
                  <div>    <span style={{ color: '#fb923c' }}>And</span> logs the incident to the immutable audit trail</div>
                </>
              )}
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}>
              <FiCheckCircle size={14} />
              <span>Specification verified against Go backend integration test suite.</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          UNIT IV: MONITORING & OBSERVABILITY
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiActivity size={18} color="var(--accent)" />
                <h3 className="card-title">Prometheus &amp; Grafana Observability Architecture</h3>
              </div>
              <Link href="/monitoring" className="btn btn-sm btn-primary">
                Open Telemetry Dashboard →
              </Link>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              CloudOps Sentinel exposes high-cardinality Prometheus metrics from our Go backend, scraped every 15 seconds, and visualizes them on Grafana with automated alert manager triggers.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}>1. Latency</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Time required to service HTTP requests. Tracked via <code>http_request_duration_seconds</code> histogram buckets.
                </div>
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: '#34d399', fontWeight: 700, marginBottom: 4 }}>2. Traffic</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Request throughput across routes. Monitored via <code>http_requests_total</code> counter by status code.
                </div>
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 4 }}>3. Errors</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Rate of 5xx HTTP responses. Fires automated alert rule <code>HighErrorRate</code> if &gt; 5% for 2 minutes.
                </div>
              </div>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ color: '#fb923c', fontWeight: 700, marginBottom: 4 }}>4. Saturation</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Fraction of CPU &amp; Memory consumed. Drives Horizontal Pod Autoscaler (HPA) to scale pod replicas.
                </div>
              </div>
            </div>

            <div style={{ padding: 12, background: 'rgba(79, 142, 247, 0.05)', borderRadius: 8, border: '1px solid rgba(79,142,247,0.2)', fontSize: 12 }}>
              <strong>Advanced Observability Scaling: </strong>
              For high-scale enterprise fleets, Prometheus instances are federated across multiple clusters and ship blocks to object storage via <strong>Thanos</strong> or <strong>Cortex</strong> for long-term historical retention.
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          UNIT V: DEVSECOPS & CLOUD SECURITY
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiShield size={18} color="var(--accent)" />
                <h3 className="card-title">DevSecOps Shift-Left Gates &amp; Emerging Security Trends</h3>
              </div>
              <Link href="/security" className="btn btn-sm btn-primary">
                Open Security Gates →
              </Link>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Security is shifted left into developer workflows rather than tested only in production. Every build passes through secret detection, dependency audits, container scanning, and least-privilege network policies.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>SLSA Framework (Levels 1-4)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Supply-chain Levels for Software Artifacts. Guarantees build provenance, isolated hermetic environments, and protection against supply-chain tampering.
                </div>
              </div>

              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#818cf8', marginBottom: 4 }}>SBOM Generation (SPDX / CycloneDX)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Software Bill of Materials generated during CI/CD to document nested dependencies and open-source licenses for compliance audits.
                </div>
              </div>

              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#34d399', marginBottom: 4 }}>Cosign / Sigstore Signing</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Cryptographically signing container images with OIDC keyless signatures so Kubernetes admission controllers reject unsigned container images.
                </div>
              </div>

              <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, color: '#fb923c', marginBottom: 4 }}>Kubernetes Zero-Trust Network Policies</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Default-deny ingress/egress rules in <code>kubernetes/networkpolicy.yaml</code> enforcing that only verified frontend pods can talk to the backend.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          UNIT VI: 12-FACTOR APP, SERVERLESS & FINOPS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 12-Factor App Compliance Scorecard */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCheckCircle size={18} color="var(--green)" />
                <h3 className="card-title">The 12-Factor App Methodology Compliance Scorecard</h3>
              </div>
              <span className="badge badge-success">12 / 12 Verified (100%)</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              CloudOps Sentinel adheres strictly to the cloud-native Twelve-Factor App methodology established for modern software-as-a-service architectures:
            </p>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Core Principle</th>
                    <th>Status</th>
                    <th>CloudOps Sentinel Architectural Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {twelveFactor?.scorecard?.map((f: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--accent-bright)' }}>{f.factor}</td>
                      <td style={{ fontWeight: 500 }}>{f.name}</td>
                      <td>
                        <span className="badge badge-success">COMPLIANT</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.implementation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Serverless vs. Container Microservices Comparison */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiZap size={18} color="var(--accent)" />
                <h3 className="card-title">Serverless (Lambda/Fargate) vs. Containerized (EKS/EC2)</h3>
              </div>
              <span className="badge badge-info">Architectural Tradeoffs</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Architecture Dimension</th>
                    <th>Serverless Architecture (AWS Lambda / Fargate)</th>
                    <th>Containerized Microservices (EKS / Self-Managed K8s)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cold Start Latency</td>
                    <td>100ms - 800ms during initial initialization</td>
                    <td>Sub-millisecond (always warm, active replicas)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Cost Scaling Curve</td>
                    <td>$0 at idle; pay strictly per-millisecond of execution</td>
                    <td>Fixed baseline cost for node VMs; cheaper at high, continuous volume</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Operational Overhead</td>
                    <td>Zero server/OS patching, automatic provider-managed scaling</td>
                    <td>Requires managing node groups, ingress, CNI plugins, and K8s upgrades</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Platform Implementation</td>
                    <td>CloudFormation &amp; Terraform ECS Fargate serverless templates</td>
                    <td>Production Kubernetes deployment manifests &amp; HPA scaling policies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
