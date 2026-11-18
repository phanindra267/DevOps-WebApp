import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Card from '../src/components/Card';
import StatusBadge from '../src/components/StatusBadge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  PieChart, Pie,
} from 'recharts';
import {
  FiActivity, FiBell, FiDatabase, FiZap, FiRefreshCw, FiSearch, FiExternalLink,
  FiCheckCircle, FiAlertTriangle, FiCpu,
} from 'react-icons/fi';
import { getHealth, getMetrics, getAlerts, resolveAlert } from '../src/lib/api';

const DONUT_COLORS = ['#f87171', '#34d399'];
const tooltipCard: React.CSSProperties = {
  background: 'rgba(13,17,23,0.97)', border: '1px solid var(--border-bright)',
  borderRadius: 10, padding: '10px 13px', boxShadow: '0 12px 34px rgba(0,0,0,0.55)', fontSize: 12,
};
function MetricTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip" style={tooltipCard}>
      {label != null && label !== '' && <div style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }} />
          <span style={{ color: 'var(--text-muted)', flex: 1 }}>{p.name || p.dataKey}</span>
          <span style={{ color: 'var(--text)', fontWeight: 700 }}>{Number(p.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
function StatusTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tooltip" style={tooltipCard}>
      <div style={{ color: 'var(--text)', fontWeight: 700 }}>{p.name}</div>
      <div style={{ color: 'var(--text-muted)', marginTop: 3 }}>{p.value} alert{p.value === 1 ? '' : 's'}</div>
    </div>
  );
}

const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', minWidth: 190,
};
const searchInput: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)',
  padding: '8px 0', fontSize: 13, width: '100%',
};

export default function MonitoringPage() {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertTab, setAlertTab] = useState<'all' | 'firing' | 'resolved'>('all');
  const [alertSearch, setAlertSearch] = useState('');
  const [metricSearch, setMetricSearch] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, mRes, aRes] = await Promise.allSettled([
        getHealth(),
        getMetrics(),
        getAlerts(),
      ]);
      if (hRes.status === 'fulfilled') setHealth(hRes.value.data);
      if (mRes.status === 'fulfilled') setMetrics(mRes.value.data || []);
      if (aRes.status === 'fulfilled') setAlerts(aRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetchData(); } finally { setRefreshing(false); }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await resolveAlert(id);
      fetchData();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  const firingCount = alerts.filter((a) => a.status === 'firing').length;
  const resolvedCount = alerts.filter((a) => a.status !== 'firing').length;

  const statusData = useMemo(() => [
    { name: 'Firing', value: firingCount },
    { name: 'Resolved', value: resolvedCount },
  ].filter((d) => d.value > 0), [firingCount, resolvedCount]);

  const numericMetrics = useMemo(() =>
    metrics
      .filter((m) => Number.isFinite(Number(m.value)))
      .slice(0, 8)
      .map((m) => ({ name: String(m.name || 'metric').slice(0, 18), value: Number(m.value), source: m.source })),
  [metrics]);

  const filteredAlerts = useMemo(() => {
    const q = alertSearch.trim().toLowerCase();
    return alerts.filter((a) => {
      const matchTab = alertTab === 'all' || (alertTab === 'firing' ? a.status === 'firing' : a.status !== 'firing');
      const matchSearch = !q || `${a.name} ${a.message} ${a.severity}`.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [alerts, alertTab, alertSearch]);

  const filteredMetrics = useMemo(() => {
    const q = metricSearch.trim().toLowerCase();
    if (!q) return metrics;
    return metrics.filter((m) => `${m.name} ${m.source} ${m.labels}`.toLowerCase().includes(q));
  }, [metrics, metricSearch]);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Head>
        <title>Monitoring | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Monitoring &amp; Observability</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Time-series telemetry, Prometheus metrics scraping, and Grafana visualization dashboards
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="http://localhost:9090" target="_blank" rel="noreferrer" className="btn">
            🔥 Prometheus (:9090) <FiExternalLink size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          <a href="http://localhost:3001" target="_blank" rel="noreferrer" className="btn btn-primary">
            📊 Grafana (:3001) <FiExternalLink size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </a>
          <button className="btn btn-sm" onClick={handleRefresh} disabled={refreshing} title="Refresh telemetry">
            <FiRefreshCw size={14} style={refreshing ? { animation: 'spin 0.9s linear infinite' } : undefined} />
            <span style={{ marginLeft: 6 }}>Refresh</span>
          </button>
        </div>
      </div>

      {/* Top metrics summary */}
      <div className="card-grid ui-stat-strip">
        {[
          { title: 'System Status', icon: <FiActivity size={18} />, value: health?.status?.toUpperCase() || 'ONLINE', color: 'green' as const, extra: <StatusBadge status={health?.status || 'healthy'} /> },
          { title: 'Active Prometheus Alerts', icon: <FiBell size={18} />, value: firingCount, color: firingCount > 0 ? 'red' as const : 'cyan' as const, extra: <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Threshold breaches in last window</span> },
          { title: 'Recorded Metrics Count', icon: <FiDatabase size={18} />, value: metrics.length, color: 'accent' as const, extra: <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Application &amp; infrastructure data points</span> },
          { title: 'Observability Engine', icon: <FiZap size={18} />, value: 'Prometheus v2.51', color: 'orange' as const, extra: <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scraping `/metrics` every 15s</span> },
        ].map((c, i) => (
          <motion.div key={c.title} {...fade(0.04 * i)} className="hover-lift">
            <Card title={c.title} icon={c.icon} value={c.value} color={c.color}>
              <div style={{ marginTop: 8 }}>{c.extra}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Telemetry visualizations */}
      <div className="ui-split" style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.8fr', gap: 20, marginBottom: 20 }}>
        <motion.div className="card card-interactive" {...fade(0.1)}>
          <div className="card-header">
            <div>
              <div className="card-title">Metric Value Snapshot</div>
              <div className="card-subtitle">Latest numeric telemetry points (up to 8)</div>
            </div>
            <span className="badge badge-neutral"><FiCpu size={12} style={{ verticalAlign: 'middle' }} /> Live</span>
          </div>
          {numericMetrics.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">▤</div>
              <div className="empty-state-title">No numeric telemetry yet</div>
              <div className="empty-state-desc">Numeric metric values will be charted here as they are scraped.</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={numericMetrics} layout="vertical" margin={{ top: 6, right: 18, left: 8, bottom: 6 }}>
                  <defs>
                    <linearGradient id="metricGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f8ef7" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" width={145} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<MetricTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" name="Value" fill="url(#metricGrad)" radius={[0, 5, 5, 0]} isAnimationActive animationDuration={800} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        <motion.div className="card card-interactive" {...fade(0.14)}>
          <div className="card-header">
            <div className="card-title">Alert Distribution</div>
            <FiBell size={16} className="text-muted" />
          </div>
          {statusData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiCheckCircle size={30} /></div>
              <div className="empty-state-title">No alerts recorded</div>
              <div className="empty-state-desc">All clear — nothing to chart.</div>
            </div>
          ) : (
            <div className="chart-container" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={58} outerRadius={92} paddingAngle={4} stroke="none"
                    isAnimationActive animationDuration={800}>
                    {statusData.map((d, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<StatusTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: -6, fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}><span style={{ color: '#f87171' }}>●</span> {firingCount} firing</span>
                <span style={{ color: 'var(--text-muted)' }}><span style={{ color: '#34d399' }}>●</span> {resolvedCount} resolved</span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Operational Alerts section */}
      <motion.div className="card" {...fade(0.18)}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2 className="card-title">Operational Alerts &amp; Incidents</h2>
          <div className="ui-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'firing', 'resolved'] as const).map((t) => (
                <button key={t} className={`tab ${alertTab === t ? 'active' : ''}`} onClick={() => setAlertTab(t)}>
                  {t === 'all' ? 'All' : t === 'firing' ? `Firing (${firingCount})` : 'Resolved'}
                </button>
              ))}
            </div>
            <div style={searchWrap}>
              <FiSearch size={14} className="text-muted" />
              <input style={searchInput} placeholder="Search alerts…" value={alertSearch} onChange={(e) => setAlertSearch(e.target.value)} />
            </div>
            <button className="btn btn-sm" onClick={fetchData} title="Refresh alerts">
              <FiRefreshCw size={13} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">◌</div>Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiCheckCircle size={32} /></div>
            <div className="empty-state-title">All clear</div>
            <div className="empty-state-desc">No firing or historical alerts recorded.</div>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No matching alerts</div>
            <div className="empty-state-desc">Try a different search term or filter.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Alert Name</th>
                  <th>Severity</th>
                  <th>State</th>
                  <th>Message / Trigger Details</th>
                  <th>Fired At</th>
                  <th style={{ textAlign: 'right' }}>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className="card-interactive">
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>
                      <span className={`badge ${
                        a.severity === 'critical' ? 'badge-error'
                        : a.severity === 'warning' ? 'badge-warning' : 'badge-info'
                      }`}>{a.severity.toUpperCase()}</span>
                    </td>
                    <td><StatusBadge status={a.status} /></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.message}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(a.fired_at).toLocaleTimeString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      {a.status === 'firing' ? (
                        <button className="btn btn-sm btn-primary" onClick={() => handleResolveAlert(a.id)}>
                          <FiCheckCircle size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--success)' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Metrics Feed */}
      <motion.div className="card" {...fade(0.22)} style={{ marginTop: 24 }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2 className="card-title">Live Telemetry Metrics (Scraped from Microservices)</h2>
          <div style={searchWrap}>
            <FiSearch size={14} className="text-muted" />
            <input style={searchInput} placeholder="Filter metrics…" value={metricSearch} onChange={(e) => setMetricSearch(e.target.value)} />
          </div>
        </div>

        {metrics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiDatabase size={30} /></div>
            <div className="empty-state-title">No telemetry records</div>
            <div className="empty-state-desc">Check the `/metrics` endpoint for Prometheus exposition format.</div>
          </div>
        ) : filteredMetrics.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No matching metrics</div>
            <div className="empty-state-desc">Try a different search term.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Metric Name</th>
                  <th>Value</th>
                  <th>Labels</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.slice(0, 12).map((m) => (
                  <tr key={m.id} className="card-interactive">
                    <td style={{ fontWeight: 600 }}>{m.source}</td>
                    <td style={{ fontFamily: 'monospace' }}>{m.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{m.value}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{m.labels || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.recorded_at).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
