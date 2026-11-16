import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import StatusBadge from '../src/components/StatusBadge';
import { getProjects, getDeployments, getScans, getScan, getScanGate, triggerScan } from '../src/lib/api';

export default function SecurityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<number>(0);
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScanDetail, setSelectedScanDetail] = useState<any>(null);
  const [gateInfo, setGateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

  const handleRunScan = async () => {
    if (!selectedDeploymentId) {
      alert('Please select or create a deployment first.');
      return;
    }
    try {
      await triggerScan(selectedDeploymentId);
      fetchScans(selectedDeploymentId);
    } catch (err) {
      alert('Failed to trigger scan');
    }
  };

  return (
    <div>
      <Head>
        <title>Security | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">DevSecOps & Vulnerability Gates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Automated SAST, dependency analysis, container scanning, and deployment gate policies
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {deployments.length > 0 && (
            <select
              className="form-input"
              style={{ width: 220 }}
              value={selectedDeploymentId}
              onChange={(e) => setSelectedDeploymentId(Number(e.target.value))}
            >
              {deployments.map((d) => (
                <option key={d.id} value={d.id}>
                  Deploy #{d.id} ({d.image_tag})
                </option>
              ))}
            </select>
          )}

          <button className="btn btn-primary" onClick={handleRunScan}>
            🛡️ Run Security Scan
          </button>
        </div>
      </div>

      {/* Quality Gate Status Banner */}
      {gateInfo && (
        <div
          className="card"
          style={{
            borderLeft: `4px solid ${gateInfo.passed ? 'var(--success)' : 'var(--error)'}`,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 className="card-title">Production Quality Gate:</h3>
                <span
                  className={`badge ${gateInfo.passed ? 'badge-success' : 'badge-error'}`}
                  style={{ fontSize: 13 }}
                >
                  {gateInfo.gate_status}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                Policy: {gateInfo.blocking_policy}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: gateInfo.passed ? 'var(--success)' : 'var(--error)' }}>
                {gateInfo.critical_count}
              </span>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Critical CVEs Found</div>
            </div>
          </div>
        </div>
      )}

      {/* Two columns: Scans list & Vulnerability breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
        {/* Scans list */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Completed Scans</h2>
          </div>

          {loading ? (
            <div className="empty-state">Loading scan records...</div>
          ) : scans.length === 0 ? (
            <div className="empty-state">
              <p>No scans found for this deployment.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={handleRunScan}>
                Trigger DevSecOps Scan
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scans.map((s) => (
                <div
                  key={s.id}
                  onClick={() => inspectScan(s.id)}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selectedScanDetail?.scan?.id === s.id ? 'rgba(88, 166, 255, 0.08)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Scan #{s.id}</span>
                    <StatusBadge status={s.status} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {s.summary || 'Scan completed successfully'}
                  </p>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vulnerabilities Table */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Vulnerability Details & Remediation</h2>
          </div>

          {!selectedScanDetail || selectedScanDetail?.vulnerabilities?.length === 0 ? (
            <div className="empty-state">
              <p>No vulnerabilities detected or select a scan to inspect findings.</p>
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
                  {selectedScanDetail.vulnerabilities.map((v: any) => (
                    <tr key={v.id}>
                      <td>
                        <span
                          className={`badge ${
                            v.severity === 'critical'
                              ? 'badge-error'
                              : v.severity === 'high'
                              ? 'badge-warning'
                              : 'badge-info'
                          }`}
                        >
                          {v.severity.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{v.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {v.description}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--accent)' }}>
                        {v.remediation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
