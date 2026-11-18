import React, { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Card from '../src/components/Card'
import StatusBadge from '../src/components/StatusBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getGlobalCostSummary, getProjectCosts, getProjectCostRecommendations, applyRecommendation } from '../src/lib/api'
import {
  FiTrendingUp, FiCreditCard, FiDollarSign, FiPieChart, FiCheck,
  FiRefreshCw, FiSearch, FiZap, FiChevronDown, FiArrowUp, FiArrowDown,
} from 'react-icons/fi'

const PIE_COLORS = ['#4f8ef7', '#22d3ee', '#34d399', '#fb923c', '#a78bfa', '#f87171']
const GRAD_ACCT = ['#4f8ef7', '#22d3ee']

const tooltipCard: React.CSSProperties = {
  background: 'rgba(13,17,23,0.97)',
  border: '1px solid var(--border-bright)',
  borderRadius: 10,
  padding: '10px 13px',
  boxShadow: '0 12px 34px rgba(0,0,0,0.55)',
  fontSize: 12,
  backdropFilter: 'blur(8px)',
}

function CostTooltip({ active, payload, label, currency = true }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="chart-tooltip" style={tooltipCard}>
      {label != null && label !== '' && (
        <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 7 }}>{label}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: p.color || p.fill || p.payload?.fill }} />
          <span style={{ color: 'var(--text-muted)', flex: 1 }}>{p.name || p.dataKey}</span>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>
            {currency ? `$${Number(p.value ?? 0).toFixed(2)}` : Number(p.value ?? 0).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '0 10px', minWidth: 200,
}
const searchInput: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)',
  padding: '8px 0', fontSize: 13, width: '100%',
}

export default function CostPage() {
  const [summary, setSummary]           = useState<any>(null)
  const [breakdown, setBreakdown]       = useState<any>(null)
  const [recs, setRecs]                 = useState<any[]>([])
  const [applying, setApplying]         = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)
  const [recTab, setRecTab]             = useState<'all' | 'open' | 'applied'>('all')
  const [recSearch, setRecSearch]       = useState('')
  const [sortDesc, setSortDesc]         = useState(true)
  const [expanded, setExpanded]         = useState<number | null>(null)
  const [refreshing, setRefreshing]     = useState(false)
  const projectId = 1

  const load = async () => {
    setLoading(true)
    try {
      const [s, b, r] = await Promise.allSettled([
        getGlobalCostSummary(),
        getProjectCosts(projectId),
        getProjectCostRecommendations(projectId),
      ])
      if (s.status === 'fulfilled') setSummary(s.value.data)
      if (b.status === 'fulfilled') setBreakdown(b.value.data)
      if (r.status === 'fulfilled') setRecs(r.value.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try { await load() } finally { setRefreshing(false) }
  }

  const handleApply = async (id: number) => {
    setApplying(id)
    try {
      await applyRecommendation(id)
      await load()
    } finally {
      setApplying(null)
    }
  }

  const services: any[] = breakdown?.services || []
  const openCount = recs.filter((r) => r.status === 'open').length
  const utilisation = breakdown?.budget_spent_percent ?? 0

  const filteredRecs = useMemo(() => {
    let list = recs.filter((r) => {
      const matchTab = recTab === 'all' || (recTab === 'open' ? r.status === 'open' : r.status !== 'open')
      const q = recSearch.trim().toLowerCase()
      const matchSearch = !q || `${r.resource_name} ${r.recommendation_type}`.toLowerCase().includes(q)
      return matchTab && matchSearch
    })
    list = [...list].sort((a, b) =>
      sortDesc
        ? (b.potential_savings ?? 0) - (a.potential_savings ?? 0)
        : (a.potential_savings ?? 0) - (b.potential_savings ?? 0)
    )
    return list
  }, [recs, recTab, recSearch, sortDesc])

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  })

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Head><title>Cost & FinOps | CloudOps Sentinel</title></Head>

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Cost &amp; FinOps</h1>
          <p className="page-subtitle">
            Local billing simulation · 100% offline · no cloud charges incurred
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-success">✓ AWS Free-Tier Guard Active</span>
          <span className="badge badge-cyan">Local Simulation</span>
          <button className="btn btn-sm" onClick={handleRefresh} disabled={refreshing} title="Refresh cost data">
            <FiRefreshCw size={14} className={refreshing ? 'spin' : ''} style={refreshing ? { animation: 'spin 0.9s linear infinite' } : undefined} />
            <span style={{ marginLeft: 6 }}>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="card-grid ui-stat-strip">
        {[
          { title: 'Estimated Spend', icon: <FiTrendingUp size={18} />, value: `$${summary?.total_estimated_cloud_cost?.toFixed(2) ?? '—'}`, color: 'accent' as const, sub: 'Projected cloud cost' },
          { title: 'Actual Billing', icon: <FiCreditCard size={18} />, value: `$${summary?.total_actual_billing_spend?.toFixed(2) ?? '—'}`, color: 'cyan' as const, sub: 'Simulated billing' },
          { title: 'Potential Savings', icon: <FiDollarSign size={18} />, value: `$${summary?.total_potential_savings?.toFixed(2) ?? '—'}`, color: 'green' as const, sub: 'Across open actions' },
          { title: 'Budget Utilised', icon: <FiPieChart size={18} />, value: `${breakdown?.budget_spent_percent?.toFixed(1) ?? '—'}%`, color: utilisation > 80 ? 'red' as const : 'orange' as const, sub: 'Of monthly allocation' },
        ].map((c, i) => (
          <motion.div key={c.title} {...fade(0.04 * i)} className="hover-lift">
            <Card title={c.title} icon={c.icon} value={c.value} color={c.color} subtitle={c.sub} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="ui-split" style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 20, marginBottom: 20 }}>
        {/* Bar chart */}
        <motion.div className="card card-interactive" {...fade(0.1)}>
          <div className="card-header">
            <div className="card-title">Service Cost Breakdown</div>
            <span className="badge badge-neutral">USD · Est vs Actual</span>
          </div>
          {services.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▤</div>
              <div className="empty-state-title">No cost data yet</div>
              <div className="empty-state-desc">Service-level billing data will appear here once available.</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={services} layout="vertical" barGap={4} margin={{ top: 10, right: 20, left: 8, bottom: 10 }}>
                  <defs>
                    <linearGradient id="costEstGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={GRAD_ACCT[0]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={GRAD_ACCT[1]} stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="costActGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <YAxis dataKey="service_name" type="category" width={150} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CostTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="estimated_cost" name="Estimated" fill="url(#costEstGrad)" radius={[0, 5, 5, 0]} isAnimationActive animationDuration={800} maxBarSize={22} />
                  <Bar dataKey="actual_cost" name="Actual" fill="url(#costActGrad)" radius={[0, 5, 5, 0]} isAnimationActive animationDuration={900} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Pie chart */}
        <motion.div className="card card-interactive" {...fade(0.14)}>
          <div className="card-header">
            <div className="card-title">By Category</div>
            <FiPieChart size={16} className="text-muted" />
          </div>
          {services.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◔</div>
              <div className="empty-state-title">No category data</div>
            </div>
          ) : (
            <div className="chart-container" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={services}
                    dataKey="actual_cost"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={54}
                    paddingAngle={4}
                    stroke="none"
                    isAnimationActive
                    animationDuration={850}
                  >
                    {services.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CostTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Budget */}
      {breakdown && (
        <motion.div className="card" {...fade(0.18)}>
          <div className="card-header">
            <div className="card-title">Budget Status</div>
            <StatusBadge status={utilisation > 80 ? 'warning' : 'healthy'} />
          </div>
          <div className="ui-stat-strip" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24, fontSize: 14 }}>
            <div>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: 0.6, marginBottom: 4 }}>MONTHLY BUDGET</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>${breakdown.monthly_budget?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: 0.6, marginBottom: 4 }}>ACTUAL SPEND</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--cyan)' }}>${breakdown.total_actual_cost?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: 0.6, marginBottom: 4 }}>REMAINING</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--green)' }}>
                ${Math.max((breakdown.monthly_budget ?? 0) - (breakdown.total_actual_cost ?? 0), 0).toFixed(2)}
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', minWidth: 220 }}>
              <div className="text-muted" style={{ fontSize: 11, letterSpacing: 0.6, marginBottom: 8 }}>UTILISATION</div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(utilisation, 100)}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  style={{ background: utilisation > 80 ? 'var(--red)' : 'linear-gradient(90deg, var(--accent), var(--cyan))' }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                {utilisation.toFixed(1)}% of budget used
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      <motion.div className="card" {...fade(0.22)}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="card-title">FinOps Recommendations</div>
            <div className="card-subtitle">Rightsizing &amp; idle resource optimisations</div>
          </div>
          <div className="ui-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'open', 'applied'] as const).map((t) => (
                <button key={t} className={`tab ${recTab === t ? 'active' : ''}`} onClick={() => setRecTab(t)}>
                  {t === 'all' ? 'All' : t === 'open' ? `Open (${openCount})` : 'Applied'}
                </button>
              ))}
            </div>
            <div style={searchWrap}>
              <FiSearch size={14} className="text-muted" />
              <input
                style={searchInput}
                placeholder="Search resources…"
                value={recSearch}
                onChange={(e) => setRecSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {recs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiCheck size={34} /></div>
            <div className="empty-state-title">No recommendations</div>
            <div className="empty-state-desc">Your infrastructure is well-optimised.</div>
          </div>
        ) : filteredRecs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiSearch size={30} /></div>
            <div className="empty-state-title">No matching recommendations</div>
            <div className="empty-state-desc">Try a different search term or filter.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>
                    <button
                      className="btn btn-xs"
                      onClick={() => setSortDesc((v) => !v)}
                      title="Sort by potential savings"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', padding: 0 }}
                    >
                      Potential Savings {sortDesc ? <FiArrowDown size={12} /> : <FiArrowUp size={12} />}
                    </button>
                  </th>
                  <th>Status</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredRecs.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className="card-interactive"
                      onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <FiChevronDown size={13} className="text-muted" style={{ transition: 'transform 0.2s', transform: expanded === r.id ? 'rotate(180deg)' : undefined }} />
                          {r.resource_name}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{r.recommendation_type}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 700 }}>${r.potential_savings?.toFixed(2)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        {r.status === 'open' && (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={(e) => { e.stopPropagation(); handleApply(r.id) }}
                            disabled={applying === r.id}
                          >
                            {applying === r.id ? '…' : <><FiCheck size={13} /> Apply</>}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr>
                        <td colSpan={5} style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <div style={{ padding: '10px 4px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
                            <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>Recommendation: </span>
                            {r.description || r.details || `${r.recommendation_type} optimisation for ${r.resource_name}, estimated at $${r.potential_savings?.toFixed(2)} in monthly savings.`}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Architecture note */}
      <div
        className="card"
        style={{ marginTop: 16, background: 'rgba(79,142,247,0.04)', borderColor: 'rgba(79,142,247,0.2)' }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}><FiZap size={13} style={{ verticalAlign: 'middle' }} /> Architecture Note: </span>
          All cost figures are computed locally by the FinOps engine using data in the PostgreSQL container.
          Real AWS Cost Explorer and Stripe integrations are available as commented code in{' '}
          <code className="font-mono" style={{ color: 'var(--cyan)' }}>backend/internal/cost/cost.go</code>.
          No external API calls, billing charges, or cloud resources are used.
        </div>
      </div>
    </motion.div>
  )
}
