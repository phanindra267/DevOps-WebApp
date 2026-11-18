import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiShield, FiClipboard, FiList, FiCheckCircle, FiRefreshCw, FiSearch, FiPlus,
} from 'react-icons/fi';
import StatusBadge from '../src/components/StatusBadge';
import Modal from '../src/components/Modal';
import { getPolicies, createPolicy, getAuditLogs } from '../src/lib/api';

const CATEGORY_COLORS = ['#4f8ef7', '#22d3ee', '#34d399', '#a78bfa', '#fb923c'];
const tooltipCard: React.CSSProperties = {
  background: 'rgba(13,17,23,0.97)', border: '1px solid var(--border-bright)',
  borderRadius: 10, padding: '9px 12px', boxShadow: '0 12px 34px rgba(0,0,0,0.55)', fontSize: 12,
};
function DonutTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tooltip" style={tooltipCard}>
      <div style={{ color: 'var(--text)', fontWeight: 700 }}>{p.name}</div>
      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{p.value} policies</div>
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

export default function GovernancePage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('security');
  const [severity, setSeverity] = useState('high');
  const [refreshing, setRefreshing] = useState(false);
  const [severityTab, setSeverityTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [policySearch, setPolicySearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        getPolicies(),
        getAuditLogs(),
      ]);
      setPolicies(pRes.data || []);
      setLogs(lRes.data || []);
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

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPolicy({ name, description, category, severity, enabled: true });
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to create policy');
    }
  };

  const enabledCount = policies.filter((p) => p.enabled).length;
  const criticalCount = policies.filter((p) => p.severity === 'critical').length;

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    policies.forEach((p) => {
      const key = String(p.category || 'uncategorised');
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    const q = policySearch.trim().toLowerCase();
    return policies.filter((p) => {
      const matchTab = severityTab === 'all' || p.severity === severityTab;
      const matchSearch = !q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [policies, severityTab, policySearch]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => `${l.action} ${l.resource_type} ${l.resource_id} ${l.details}`.toLowerCase().includes(q));
  }, [logs, logSearch]);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Head>
        <title>Governance | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Governance, Compliance &amp; Audit</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Policy-as-Code enforcement, resource tagging, encryption validation, and immutable audit trails
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={handleRefresh} disabled={refreshing} title="Refresh governance data">
            <FiRefreshCw size={14} style={refreshing ? { animation: 'spin 0.9s linear infinite' } : undefined} />
            <span style={{ marginLeft: 6 }}>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <FiPlus size={14} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Define Policy
          </button>
        </div>
      </div>

      {/* Compliance stat strip */}
      <div className="card-grid ui-stat-strip">
        {[
          { title: 'Total Policies', icon: <FiClipboard size={18} />, value: policies.length, color: 'accent' as const, sub: 'Catalogued rules' },
          { title: 'Active / Enforced', icon: <FiCheckCircle size={18} />, value: enabledCount, color: 'green' as const, sub: 'Currently enforced' },
          { title: 'Critical Severity', icon: <FiShield size={18} />, value: criticalCount, color: criticalCount > 0 ? 'red' as const : 'cyan' as const, sub: 'Blocking controls' },
          { title: 'Audit Events', icon: <FiList size={18} />, value: logs.length, color: 'purple' as const, sub: 'Immutable records' },
        ].map((s, i) => (
          <motion.div key={s.title} {...fade(0.04 * i)} className="hover-lift">
            <div className="stat-card">
              <div className="stat-card-glow" style={{ background: 'var(--accent-glow)' }} />
              <div className="stat-icon" style={{ background: 'var(--accent-glow)' }}>{s.icon}</div>
              <div className="stat-value" style={{ color: `var(--${s.color})` }}>{s.value}</div>
              <div className="stat-label">{s.title}</div>
              <div className="stat-trend text-muted">{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compliance coverage donut */}
      <motion.div className="card card-interactive ui-panel" {...fade(0.1)} style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Compliance Coverage</div>
            <div className="card-subtitle">Policies grouped by governance domain</div>
          </div>
          <span className="badge badge-neutral">{policies.length} total</span>
        </div>
        {categoryData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◔</div>
            <div className="empty-state-title">No compliance data</div>
            <div className="empty-state-desc">Define policies to see coverage by domain.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ width: 260, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={62} outerRadius={98} paddingAngle={4} stroke="none"
                    isAnimationActive animationDuration={800}>
                    {categoryData.map((_: any, i: number) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, flex: 1, minWidth: 220 }}>
              {categoryData.map((c, i) => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', flex: 1 }}>{c.name}</span>
                  <span style={{ fontWeight: 700 }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Policies section */}
      <motion.div className="card" {...fade(0.14)}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2 className="card-title">Governance Policy Catalog</h2>
          <div className="ui-toolbar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((t) => (
                <button key={t} className={`tab ${severityTab === t ? 'active' : ''}`} onClick={() => setSeverityTab(t)}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={searchWrap}>
              <FiSearch size={14} className="text-muted" />
              <input style={searchInput} placeholder="Search policies…" value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{policies.length} enforced</span>
          </div>
        </div>

        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">◌</div>Loading governance policies…</div>
        ) : policies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiShield size={30} /></div>
            <div className="empty-state-title">No governance policies defined</div>
            <div className="empty-state-desc">Create a policy to start enforcing governance rules.</div>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No matching policies</div>
            <div className="empty-state-desc">Try a different search term or severity filter.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Policy Identifier</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Enforcement Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((p) => (
                  <tr key={p.id} className="card-interactive">
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{p.name}</td>
                    <td><span className="badge badge-neutral">{p.category?.toUpperCase()}</span></td>
                    <td>
                      <span className={`badge ${
                        p.severity === 'critical' ? 'badge-error'
                        : p.severity === 'high' ? 'badge-warning' : 'badge-info'
                      }`}>{p.severity.toUpperCase()}</span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.description}</td>
                    <td><StatusBadge status={p.enabled ? 'active' : 'disabled'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Audit Trail Section */}
      <motion.div className="card" {...fade(0.18)} style={{ marginTop: 24 }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2 className="card-title">Immutable Audit Trail (Administrative Actions)</h2>
          <div style={searchWrap}>
            <FiSearch size={14} className="text-muted" />
            <input style={searchInput} placeholder="Search audit log…" value={logSearch} onChange={(e) => setLogSearch(e.target.value)} />
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiList size={30} /></div>
            <div className="empty-state-title">No audit records</div>
            <div className="empty-state-desc">Administrative actions will be logged here.</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No matching events</div>
            <div className="empty-state-desc">Try a different search term.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Resource ID</th>
                  <th>Audit Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="card-interactive">
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(l.created_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{l.action}</td>
                    <td><span className="badge badge-info">{l.resource_type || 'system'}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{l.resource_id || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <Modal title="Define Governance Policy" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreatePolicy}>
          <div className="form-group">
            <label>Policy Name / Key</label>
            <input type="text" className="form-input" placeholder="e.g. enforce-https-ingress" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="security">Security</option>
              <option value="tagging">Tagging &amp; Metadata</option>
              <option value="reliability">Reliability</option>
              <option value="cost">Resource Limits</option>
            </select>
          </div>
          <div className="form-group">
            <label>Severity</label>
            <select className="form-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="form-group">
            <label>Policy Description</label>
            <textarea className="form-input" rows={3} placeholder="All ingress resources must terminate TLS with trusted certificate" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Policy</button>
          </div>
        </form>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
