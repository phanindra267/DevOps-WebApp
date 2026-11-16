import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Card from '../src/components/Card'
import StatusBadge from '../src/components/StatusBadge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { getGlobalCostSummary, getProjectCosts, getProjectCostRecommendations, applyRecommendation } from '../src/lib/api'
import { FiTrendingUp, FiCreditCard, FiDollarSign, FiPieChart, FiCheck, FiRefreshCw } from 'react-icons/fi'

const PIE_COLORS = ['#4f8ef7', '#22d3ee', '#34d399', '#fb923c', '#a78bfa', '#f87171']

export default function CostPage() {
  const [summary, setSummary]           = useState<any>(null)
  const [breakdown, setBreakdown]       = useState<any>(null)
  const [recs, setRecs]                 = useState<any[]>([])
  const [applying, setApplying]         = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)
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

  return (
    <>
      <Head><title>Cost & FinOps | CloudOps Sentinel</title></Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Cost & FinOps</h1>
          <p className="page-subtitle">
            Local billing simulation · 100% offline · no cloud charges incurred
          </p>
        </div>
        <span className="badge badge-cyan">Local-first Simulation</span>
      </div>

      {/* Summary Cards */}
      <div className="card-grid">
        <Card title="Estimated Spend" icon={<FiTrendingUp size={18} />} value={`$${summary?.total_estimated_cloud_cost?.toFixed(2) ?? '—'}`} color="accent" />
        <Card title="Actual Billing"  icon={<FiCreditCard size={18} />} value={`$${summary?.total_actual_billing_spend?.toFixed(2) ?? '—'}`}  color="cyan"   />
        <Card title="Potential Savings" icon={<FiDollarSign size={18} />} value={`$${summary?.total_potential_savings?.toFixed(2) ?? '—'}`}  color="green"  />
        <Card title="Budget Utilised" icon={<FiPieChart size={18} />} value={`${breakdown?.budget_spent_percent?.toFixed(1) ?? '—'}%`}     color={breakdown?.budget_spent_percent > 80 ? 'red' : 'orange'} />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: 20, marginBottom: 20 }}>
        {/* Bar chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Service Cost Breakdown</div>
            <span className="badge badge-neutral">USD</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={services}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 150, bottom: 10 }}
              >
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis dataKey="service_name" type="category" width={145} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`, '']}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'var(--text)' }}
                />
                <Bar dataKey="estimated_cost" fill="var(--accent)" name="Estimated" radius={[0, 4, 4, 0]} />
                <Bar dataKey="actual_cost"    fill="var(--cyan)"   name="Actual"    radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">By Category</div>
          </div>
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
                  innerRadius={50}
                  paddingAngle={4}
                >
                  {services.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [`$${Number(v).toFixed(2)}`]}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Budget */}
      {breakdown && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">Budget Status</div>
            <StatusBadge status={breakdown.budget_spent_percent > 80 ? 'warning' : 'healthy'} />
          </div>
          <div className="flex" style={{ gap: 24, fontSize: 14 }}>
            <div>
              <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>MONTHLY BUDGET</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>${breakdown.monthly_budget?.toFixed(2) ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 11, marginBottom: 4 }}>ACTUAL SPEND</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--cyan)' }}>${breakdown.total_actual_cost?.toFixed(2) ?? '—'}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="text-muted" style={{ fontSize: 11, marginBottom: 8 }}>UTILISATION</div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(breakdown.budget_spent_percent ?? 0, 100)}%`,
                    background: breakdown.budget_spent_percent > 80 ? 'var(--red)' : 'var(--accent)',
                  }}
                />
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                {breakdown.budget_spent_percent?.toFixed(1) ?? '0'}% of budget used
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">FinOps Recommendations</div>
            <div className="card-subtitle">Rightsizing & idle resource optimisations</div>
          </div>
          <span className="badge badge-info">{recs.filter((r) => r.status === 'open').length} open</span>
        </div>

        {recs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✓</div>
            <div className="empty-state-title">No recommendations</div>
            <div className="empty-state-desc">Your infrastructure is well-optimised.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>Potential Savings</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recs.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.resource_name}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{r.recommendation_type}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>${r.potential_savings?.toFixed(2)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.status === 'open' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApply(r.id)}
                          disabled={applying === r.id}
                        >
                          {applying === r.id ? '…' : '✓ Apply'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Architecture note */}
      <div
        className="card"
        style={{ marginTop: 16, background: 'rgba(79,142,247,0.04)', borderColor: 'rgba(79,142,247,0.2)' }}
      >
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>⚙ Architecture Note: </span>
          All cost figures are computed locally by the FinOps engine using data in the PostgreSQL container.
          Real AWS Cost Explorer and Stripe integrations are available as commented code in{' '}
          <code className="font-mono" style={{ color: 'var(--cyan)' }}>backend/internal/cost/cost.go</code>.
          No external API calls, billing charges, or cloud resources are used.
        </div>
      </div>
    </>
  )
}
