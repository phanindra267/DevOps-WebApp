import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  FiTarget, FiClipboard, FiRefreshCw, FiSearch, FiPlus, FiActivity, FiAlertOctagon,
} from 'react-icons/fi';
import StatusBadge from '../src/components/StatusBadge';
import Modal from '../src/components/Modal';
import { getProjects, getDebt, createDebt, getExperiments, createExperiment } from '../src/lib/api';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6b7a99', medium: '#fb923c', high: '#fb923c', critical: '#f87171',
};
const tooltipCard: React.CSSProperties = {
  background: 'rgba(13,17,23,0.97)', border: '1px solid var(--border-bright)',
  borderRadius: 10, padding: '8px 12px', boxShadow: '0 12px 34px rgba(0,0,0,0.55)', fontSize: 12,
};
function PriorityTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip" style={tooltipCard}>
      <div style={{ color: 'var(--text)', fontWeight: 700, textTransform: 'capitalize' }}>{label}</div>
      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{payload[0].value} item(s)</div>
    </div>
  );
}
const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', minWidth: 170,
};
const searchInput: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)',
  padding: '7px 0', fontSize: 13, width: '100%',
};
const itemCard: React.CSSProperties = {
  padding: 14, border: '1px solid var(--border)', borderRadius: 9,
  background: 'rgba(255,255,255,0.02)',
};

export default function ReliabilityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [debts, setDebts] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [modalType, setModalType] = useState<'debt' | 'exp' | null>(null);
  const [debtTitle, setDebtTitle] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [debtPriority, setDebtPriority] = useState('medium');
  const [expName, setExpName] = useState('');
  const [expDesc, setExpDesc] = useState('');

  // Filters
  const [expTab, setExpTab] = useState<'all' | 'running' | 'completed'>('all');
  const [debtTab, setDebtTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [expSearch, setExpSearch] = useState('');
  const [debtSearch, setDebtSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await getProjects();
        const pList = res.data || [];
        setProjects(pList);
        if (pList.length > 0) setSelectedProjectId(pList[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const refreshItems = async (pid: number) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [dRes, eRes] = await Promise.all([
        getDebt(pid),
        getExperiments(pid),
      ]);
      setDebts(dRes.data || []);
      setExperiments(eRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) refreshItems(selectedProjectId);
  }, [selectedProjectId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshItems(selectedProjectId); } finally { setRefreshing(false); }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDebt(selectedProjectId, {
        title: debtTitle,
        description: debtDesc,
        priority: debtPriority,
      });
      setDebtTitle('');
      setDebtDesc('');
      setModalType(null);
      refreshItems(selectedProjectId);
    } catch (err) {
      alert('Failed to save debt item');
    }
  };

  const handleCreateExp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExperiment(selectedProjectId, {
        name: expName,
        description: expDesc,
      });
      setExpName('');
      setExpDesc('');
      setModalType(null);
      refreshItems(selectedProjectId);
    } catch (err) {
      alert('Failed to save experiment');
    }
  };

  const criticalDebt = debts.filter((d) => d.priority === 'critical').length;
  const runningExp = experiments.filter((e) => ['running', 'in-progress', 'active'].includes(String(e.status || '').toLowerCase())).length;

  const priorityData = useMemo(() => {
    const order = ['low', 'medium', 'high', 'critical'];
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    debts.forEach((d) => {
      const key = String(d.priority || 'medium').toLowerCase();
      if (key in counts) counts[key] += 1;
    });
    return order.map((name) => ({ name, value: counts[name] })).filter((d) => d.value > 0);
  }, [debts]);

  const filteredExperiments = useMemo(() => {
    const q = expSearch.trim().toLowerCase();
    return experiments.filter((e) => {
      const s = String(e.status || '').toLowerCase();
      const matchTab = expTab === 'all'
        || (expTab === 'running' ? ['running', 'in-progress', 'active'].includes(s) : !['running', 'in-progress', 'active'].includes(s));
      const matchSearch = !q || `${e.name} ${e.description}`.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [experiments, expTab, expSearch]);

  const filteredDebts = useMemo(() => {
    const q = debtSearch.trim().toLowerCase();
    return debts.filter((d) => {
      const matchTab = debtTab === 'all' || d.priority === debtTab;
      const matchSearch = !q || `${d.title} ${d.description}`.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [debts, debtTab, debtSearch]);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Head>
        <title>Reliability | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Reliability &amp; Chaos Engineering</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Controlled failure simulations, automated recovery validation, and technical debt management
          </p>
        </div>

        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Project:</span>
            <select className="form-input" style={{ width: 220 }} value={selectedProjectId} onChange={(e) => setSelectedProjectId(Number(e.target.value))}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="btn btn-sm" onClick={handleRefresh} disabled={refreshing} title="Refresh reliability data">
              <FiRefreshCw size={14} style={refreshing ? { animation: 'spin 0.9s linear infinite' } : undefined} />
            </button>
          </div>
        )}
      </div>

      {/* Stat strip */}
      <div className="card-grid ui-stat-strip">
        {[
          { title: 'Experiments', icon: <FiTarget size={18} />, value: experiments.length, color: 'accent' as const, sub: 'Failure scenarios' },
          { title: 'Running Now', icon: <FiActivity size={18} />, value: runningExp, color: 'cyan' as const, sub: 'Active simulations' },
          { title: 'Debt Items', icon: <FiClipboard size={18} />, value: debts.length, color: 'purple' as const, sub: 'Tracked items' },
          { title: 'Critical Debt', icon: <FiAlertOctagon size={18} />, value: criticalDebt, color: criticalDebt > 0 ? 'red' as const : 'green' as const, sub: 'Needs attention' },
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

      {/* Debt priority chart */}
      {debts.length > 0 && (
        <motion.div className="card card-interactive ui-panel" {...fade(0.1)}>
          <div className="card-header">
            <div>
              <div className="card-title">Technical Debt by Priority</div>
              <div className="card-subtitle">Distribution of tracked debt items by severity</div>
            </div>
            <span className="badge badge-neutral">{debts.length} items</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} layout="vertical" margin={{ top: 4, right: 24, left: 12, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)} axisLine={false} tickLine={false} />
                <Tooltip content={<PriorityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="value" name="Items" radius={[0, 5, 5, 0]} isAnimationActive animationDuration={750} maxBarSize={26}>
                  {priorityData.map((d) => <Cell key={d.name} fill={PRIORITY_COLORS[d.name] || '#4f8ef7'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Two columns: Chaos Experiments & Tech Debt */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Controlled Experiments */}
        <motion.div className="card" {...fade(0.14)}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <h2 className="card-title">Failure Scenarios &amp; Experiments</h2>
            <button className="btn btn-sm btn-primary" onClick={() => setModalType('exp')}>
              <FiPlus size={13} /> New Scenario
            </button>
          </div>

          <div className="ui-toolbar" style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'running', 'completed'] as const).map((t) => (
                <button key={t} className={`tab ${expTab === t ? 'active' : ''}`} onClick={() => setExpTab(t)}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={searchWrap}>
              <FiSearch size={14} className="text-muted" />
              <input style={searchInput} placeholder="Search scenarios…" value={expSearch} onChange={(e) => setExpSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">◌</div>Loading experiments…</div>
          ) : experiments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiTarget size={30} /></div>
              <div className="empty-state-title">No experiments defined</div>
              <div className="empty-state-desc">Define a failure scenario for this project.</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setModalType('exp')}>
                Create Failure Scenario
              </button>
            </div>
          ) : filteredExperiments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No matching scenarios</div>
              <div className="empty-state-desc">Try a different search term or filter.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredExperiments.map((exp) => (
                <motion.div key={exp.id} className="card-interactive hover-lift" style={itemCard} whileHover={{ y: -2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600 }}>{exp.name}</span>
                    <StatusBadge status={exp.status} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{exp.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Technical Debt Register */}
        <motion.div className="card" {...fade(0.18)}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <h2 className="card-title">Technical Debt Register</h2>
            <button className="btn btn-sm btn-primary" onClick={() => setModalType('debt')}>
              <FiPlus size={13} /> Record Debt
            </button>
          </div>

          <div className="ui-toolbar" style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div className="tabs" style={{ margin: 0 }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map((t) => (
                <button key={t} className={`tab ${debtTab === t ? 'active' : ''}`} onClick={() => setDebtTab(t)}>
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={searchWrap}>
              <FiSearch size={14} className="text-muted" />
              <input style={searchInput} placeholder="Search debt…" value={debtSearch} onChange={(e) => setDebtSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">◌</div>Loading technical debt…</div>
          ) : debts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiClipboard size={30} /></div>
              <div className="empty-state-title">No technical debt logged</div>
              <div className="empty-state-desc">Track a debt item for this project.</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setModalType('debt')}>
                Log Debt Item
              </button>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No matching items</div>
              <div className="empty-state-desc">Try a different search term or filter.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredDebts.map((d) => (
                <motion.div key={d.id} className="card-interactive hover-lift" style={itemCard} whileHover={{ y: -2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600 }}>{d.title}</span>
                    <span className={`badge ${
                      d.priority === 'critical' ? 'badge-error'
                      : d.priority === 'high' ? 'badge-warning' : 'badge-info'
                    }`}>{d.priority.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{d.description}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Failure Detection & Recovery Diagram Section */}
      <motion.div className="card glow-border" {...fade(0.22)} style={{ marginTop: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 14 }}>Failure Recovery Architecture (Figure 4)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          {[
            { label: '1. Failure Occurs', cls: 'badge-error' },
            { label: '2. Prometheus Detection', cls: 'badge-warning' },
            { label: '3. Actionable Alert', cls: 'badge-warning' },
            { label: '4. Diagnosis', cls: 'badge-info' },
            { label: '5. Recovery / Rollback', cls: 'badge-info' },
            { label: '6. Health Verification', cls: 'badge-success' },
            { label: '7. Incident Resolution', cls: 'badge-success' },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <span className={`badge ${step.cls}`}>{step.label}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--text-dim)' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
      </motion.div>

      {/* Modals */}
      <Modal title="Record Technical Debt Item" open={modalType === 'debt'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateDebt}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" className="form-input" placeholder="e.g. Upgrade PostgreSQL alpine base image" value={debtTitle} onChange={(e) => setDebtTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select className="form-input" value={debtPriority} onChange={(e) => setDebtPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" rows={3} value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Debt</button>
          </div>
        </form>
      </Modal>

      <Modal title="Create Reliability Experiment" open={modalType === 'exp'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateExp}>
          <div className="form-group">
            <label>Scenario / Title</label>
            <input type="text" className="form-input" placeholder="e.g. High Memory Spike Simulation on Backend" value={expName} onChange={(e) => setExpName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Hypothesis &amp; Recovery Target</label>
            <textarea className="form-input" rows={3} placeholder="Kubernetes HPA scales pod replicas from 2 to 5 within 90 seconds" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Experiment</button>
          </div>
        </form>
      </Modal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
