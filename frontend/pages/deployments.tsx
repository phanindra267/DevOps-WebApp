import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import StatusBadge from '../src/components/StatusBadge';
import { getProjects, getDeployments, rollbackDeployment, triggerScan } from '../src/lib/api';

export default function DeploymentsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

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

  const fetchDeps = async (pid: number) => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await getDeployments(pid);
      setDeployments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) fetchDeps(selectedProjectId);
  }, [selectedProjectId]);

  const handleRollback = async (id: number) => {
    if (!confirm('Rollback this deployment to the previous stable release?')) return;
    try {
      const res = await rollbackDeployment(id);
      setOutput(`=== Automated Rollback Completed ===\n${JSON.stringify(res.data, null, 2)}`);
      fetchDeps(selectedProjectId);
    } catch (err) {
      alert('Rollback failed');
    }
  };

  const handleScan = async (id: number) => {
    try {
      const res = await triggerScan(id);
      setOutput(`=== DevSecOps Container Scan ===\n${JSON.stringify(res.data, null, 2)}`);
    } catch (err) {
      alert('Scan failed');
    }
  };

  return (
    <div>
      <Head>
        <title>Deployments | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Deployments & Orchestration</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Kubernetes container releases, rolling updates, and zero-downtime rollback controls
          </p>
        </div>

        {projects.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Project:</span>
            <select
              className="form-input"
              style={{ width: 220 }}
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {output && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Console Output</h3>
            <button className="btn btn-sm" onClick={() => setOutput(null)}>
              Clear
            </button>
          </div>
          <pre className="log-output">{output}</pre>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Release History</h2>
        </div>

        {loading ? (
          <div className="empty-state">Loading deployment history...</div>
        ) : deployments.length === 0 ? (
          <div className="empty-state">
            <p>No deployments found for this project. Trigger one from the project view.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Deployment ID</th>
                  <th>Image Tag</th>
                  <th>Release Status</th>
                  <th>Started At</th>
                  <th>Finished At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((d) => (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-muted)', width: 80 }}>#{d.id}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {d.image_tag}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {d.started_at ? new Date(d.started_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {d.finished_at ? new Date(d.finished_at).toLocaleString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm"
                        style={{ marginRight: 6 }}
                        onClick={() => handleScan(d.id)}
                      >
                        🛡️ Scan Image
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRollback(d.id)}
                      >
                        ⏪ Rollback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
