import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  FiShield, FiAlertOctagon, FiAlertTriangle, FiInfo, FiCheckCircle, FiRefreshCw,
  FiSearch, FiPlay, FiLock,
} from 'react-icons/fi';
import StatusBadge from '../src/components/StatusBadge';
import { getProjects, getDeployments, getScans, getScan, getScanGate, triggerScan } from '../src/lib/api';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#34d399',
};
const tooltipCard: React.CSSProperties = {
  background: 'rgba(13,17,23,0.97)', border: '1px solid var(--border-bright)',
  borderRadius: 10, padding: '9px 12px', boxShadow: '0 12px 34px rgba(0,0,0,0.55)', fontSize: 12,
};
function SeverityTooltip({ active, payload }: any) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <div className="chart-tooltip" style={tooltipCard}>
      <div style={{ color: 'var(--text)', fontWeight: 700, textTransform: 'capitalize' }}>{p.name}</div>
      <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{p.value} finding{p.value === 1 ? '' : 's'}</div>
    </div>
  );
}
const searchWrap: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)',
  border: '1px solid var(--border)', borderRadius: 8, padding: '0 10px', minWidth: 180,
};
const searchInput: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)',
  padding: '8px 0', fontSize: 13, width: '100%',
};

export default function SecurityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<number>(0);
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScanDetail, setSelectedScanDetail] = useState<any>(null);
  const [gateInfo, setGateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [severityTab, setSeverityTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [vulnSearch, setVulnSearch] = useState('');

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

  useEffect(() => {
    if (!selectedProjectId) return;
    async function loadDeps() {
      try {
        const res = await getDeployments(selectedProjectId);
        const dList = res.data || [];
        setDeployments(dList);
        if (dList.length > 0) setSelectedDeploymentId(dList[0].id);
      } catch (err) {
        console.error(err);
      }
    }
    loadDeps();
  }, [selectedProjectId]);

  const fetchScans = async (depId: number) => {
    if (!depId) return;
    setLoading(true);
    try {
      const res = await getScans(depId);
      const sList = res.data || [];
      setScans(sList);
      if (sList.length > 0) {
        inspectScan(sList[0].id);
      } else {
        setSelectedScanDetail(null);
        setGateInfo(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const inspectScan = async (scanId: number) => {
    try {
      const [detailRes, gateRes] = await Promise.all([
        getScan(scanId),
        getScanGate(scanId),
      ]);
      setSelectedScanDetail(detailRes.data);
      setGateInfo(gateRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedDeploymentId) fetchScans(selectedDeploymentId);
  }, [selectedDeploymentId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetchScans(selectedDeploymentId); } finally { setRefreshing(false); }
  };

  const handleRunScan = async () => {
    if (!selectedDeploymentId) {
      alert('Please select or create a deployment first.');
      return;
    }
    setScanning(true);
    try {
      await triggerScan(selectedDeploymentId);
      fetchScans(selectedDeploymentId);
    } catch (err) {
      alert('Failed to trigger scan');
    } finally {
      setScanning(false);
    }
  };

  const vulnerabilities: any[] = selectedScanDetail?.vulnerabilities || [];
  const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter((v) => v.severity === 'medium').length;
  const lowCount = vulnerabilities.filter((v) => v.severity === 'low').length;

  const severityData = useMemo(() => {
    const order = ['critical', 'high', 'medium', 'low'];
    const counts: Record<string, number> = { critical: criticalCount, high: highCount, medium: mediumCount, low: lowCount };
    return order.map((name) => ({ name, value: counts[name] })).filter((d) => d.value > 0);
  }, [criticalCount, highCount, mediumCount, lowCount]);

  const filteredVulns = useMemo(() => {
    const q = vulnSearch.trim().toLowerCase();
    return vulnerabilities.filter((v) => {
      const matchTab = severityTab === 'all' || v.severity === severityTab;
      const matchSearch = !q || `${v.title} ${v.description} ${v.remediation}`.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [vulnerabilities, severityTab, vulnSearch]);

  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Head>
        <title>Security | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">DevSecOps &amp; Vulnerability Gates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Automated SAST, dependency analysis, container scanning, and deployment gate policies
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {projects.length > 0 && (
            <select className="form-input" style={{ width: 170 }} value={selectedProjectId} onChange={(e) => setSelectedProjectId(Number(e.target.value))} title="Select project">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {deployments.length > 0 && (
            <select className="form-input" style={{ width: 180 }} value={selectedDeploymentId} onChange={(e) => setSelectedDeploymentId(Number(e.target.value))} title="Select deployment">
              {deployments.map((d) => <option key={d.id} value={d.id}>Deploy #{d.id} ({d.image_tag})</option>)}
            </select>
          )}
          <button className="btn btn-sm" onClick={handleRefresh} disabled={refreshing} title="Refresh scans">
            <FiRefreshCw size={14} style={refreshing ? { animation: 'spin 0.9s linear infinite' } : undefined} />
          </button>
          <button className="btn btn-primary" onClick={handleRunScan} disabled={scanning}>
            {scanning ? <FiRefreshCw size={14} style={{ animation: 'spin 0.9s linear infinite' }} /> : <FiShield size={14} />}
            <span style={{ marginLeft: 6 }}>{scanning ? 'Scanning…' : 'Run Security Scan'}</span>
          </button>
        </div>
      </div>

      {/* Vulnerability stat strip */}
      <div className="card-grid ui-stat-strip">
        {[
          { title: 'Critical Findings', icon: <FiAlertOctagon size={18} />, value: criticalCount, color: 'red' as const, sub: 'Block deployment' },
          { title: 'High Findings', icon: <FiAlertTriangle size={18} />, value: highCount, color: 'orange' as const, sub: 'Remediate soon' },
          { title: 'Medium / Low', icon: <FiInfo size={18} />, value: mediumCount + lowCount, color: 'cyan' as const, sub: 'Informational' },
          { title: 'Gate Status', icon: <FiLock size={18} />, value: gateInfo ? (gateInfo.passed ? 'PASS' : 'BLOCKED') : '—', color: gateInfo?.passed ? 'green' as const : 'red' as const, sub: gateInfo?.gate_status || 'No scan data' },
        ].map((s, i) => (
          <motion.div key={s.title} {...fade(0.04 * i)} className="hover-lift">
            <div className="stat-card">
              <div className="stat-card-glow" style={{ background: 'var(--accent-glow)' }} />
              <div className="stat-icon" style={{ background: 'var(--accent-glow)' }}>{s.icon}</div>
              <div className="stat-value" style={{ color: `var(--${s.color})`, fontSize: String(s.value).length > 4 ? 20 : undefined }}>{s.value}</div>
              <div className="stat-label">{s.title}</div>
              <div className="stat-trend text-muted">{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quality Gate Status Banner */}
      {gateInfo && (
        <motion.div
          className="card glow-border"
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          style={{ borderLeft: `4px solid ${gateInfo.passed ? 'var(--success)' : 'var(--error)'}`, marginBottom: 20 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="card-title">Production Quality Gate:</h3>
                <span className={`badge ${gateInfo.passed ? 'badge-success' : 'badge-error'}`} style={{ fontSize: 13 }}>
                  {gateInfo.passed && <FiCheckCircle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />}
                  {gateInfo.gate_status}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Policy: {gateInfo.blocking_policy}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: gateInfo.passed ? 'var(--success)' : 'var(--error)' }}>
                {gateInfo.critical_count}
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Critical CVEs Found</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Severity distribution donut */}
      {severityData.length > 0 && (
        <motion.div className="card card-interactive ui-panel" {...fade(0.14)} style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Vulnerability Severity Distribution</div>
              <div className="card-subtitle">Findings for the selected scan</div>
            </div>
            <span className="badge badge-neutral">{vulnerabilities.length} findings</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, flexWrap: 'wrap' }}>
            <div style={{ width: 260, height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={62} outerRadius={98} paddingAngle={4} stroke="none"
                    isAnimationActive animationDuration={800}>
                    {severityData.map((d) => <Cell key={d.name} fill={SEVERITY_COLORS[d.name] || '#4f8ef7'} />)}
                  </Pie>
                  <Tooltip content={<SeverityTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, flex: 1, minWidth: 200 }}>
              {severityData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: SEVERITY_COLORS[d.name] }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'capitalize', flex: 1 }}>{d.name}</span>
                  <span style={{ fontWeight: 700 }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Two columns: Scans list & Vulnerability breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, alignItems: 'start' }}>
        {/* Scans list */}
        <motion.div className="card" {...fade(0.18)}>
          <div className="card-header">
            <h2 className="card-title">Completed Scans</h2>
            <span className="badge badge-neutral">{scans.length}</span>
          </div>

          {loading ? (
            <div className="empty-state"><div className="empty-state-icon">◌</div>Loading scan records…</div>
          ) : scans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiShield size={30} /></div>
              <div className="empty-state-title">No scans found</div>
              <div className="empty-state-desc">Trigger a scan for this deployment.</div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={handleRunScan}>
                <FiPlay size={12} /> Trigger DevSecOps Scan
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scans.map((s) => {
                const active = selectedScanDetail?.scan?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className="card-interactive"
                    onClick={() => inspectScan(s.id)}
                    style={{
                      padding: 12, borderRadius: 8, border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      background: active ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.18s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>Scan #{s.id}</span>
                      <StatusBadge status={s.status} />
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {s.summary || 'Scan completed successfully'}
                    </p>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Vulnerabilities Table */}
        <motion.div className="card" {...fade(0.22)}>
          <div className="card-header" style={{ flexWrap: 'wrap', gap: 10 }}>
            <h2 className="card-title">Vulnerability Details &amp; Remediation</h2>
            {vulnerabilities.length > 0 && (
              <div style={searchWrap}>
                <FiSearch size={13} className="text-muted" />
                <input style={searchInput} placeholder="Search findings…" value={vulnSearch} onChange={(e) => setVulnSearch(e.target.value)} />
              </div>
            )}
          </div>

          {vulnerabilities.length > 0 && (
            <div className="ui-toolbar" style={{ marginBottom: 14 }}>
              <div className="tabs" style={{ margin: 0 }}>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((t) => (
                  <button key={t} className={`tab ${severityTab === t ? 'active' : ''}`} onClick={() => setSeverityTab(t)}>
                    {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!selectedScanDetail || vulnerabilities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FiCheckCircle size={30} /></div>
              <div className="empty-state-title">No vulnerabilities detected</div>
              <div className="empty-state-desc">Select a scan to inspect its findings.</div>
            </div>
          ) : filteredVulns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No matching findings</div>
              <div className="empty-state-desc">Try a different search term or severity filter.</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Vulnerability / Title</th>
                    <th>Remediation Advice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVulns.map((v: any) => (
                    <tr key={v.id} className="card-interactive">
                      <td>
                        <span className={`badge ${
                          v.severity === 'critical' ? 'badge-error'
                          : v.severity === 'high' ? 'badge-warning' : 'badge-info'
                        }`}>{v.severity.toUpperCase()}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{v.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{v.description}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--accent)' }}>{v.remediation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
}
