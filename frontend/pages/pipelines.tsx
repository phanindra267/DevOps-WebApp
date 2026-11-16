import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import StatusBadge from '../src/components/StatusBadge';
import { getProjects, getPipelines, triggerPipeline } from '../src/lib/api';

export default function PipelinesPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLog, setActiveLog] = useState<string | null>(null);

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

  const fetchPipelines = async (pid: number) => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await getPipelines(pid);
      setPipelines(res.data || []);
      if (res.data?.length > 0 && !activeLog) {
        setActiveLog(res.data[0].logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) fetchPipelines(selectedProjectId);
  }, [selectedProjectId]);

  const handleRun = async () => {
    if (!selectedProjectId) return;
    try {
      await triggerPipeline(selectedProjectId);
      fetchPipelines(selectedProjectId);
    } catch (err) {
      alert('Pipeline trigger failed');
    }
  };

  return (
    <div>
      <Head>
        <title>Pipelines | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">CI/CD & DevSecOps Pipelines</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Jenkins pipeline orchestration with quality gates, unit tests, and security scans
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {projects.length > 0 && (
            <select
              className="form-input"
              style={{ width: 200 }}
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

          <button className="btn btn-primary" onClick={handleRun}>
            ⚡ Trigger Pipeline
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        {/* Runs List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Execution Runs</h2>
          </div>

          {loading ? (
            <div className="empty-state">Loading pipeline history...</div>
          ) : pipelines.length === 0 ? (
            <div className="empty-state">
              <p>No pipeline runs logged for this project.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={handleRun}>
                Run First Pipeline
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pipelines.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setActiveLog(p.logs)}
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: activeLog === p.logs ? 'rgba(88, 166, 255, 0.08)' : 'transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>Run #{p.id}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Trigger: {p.trigger_type}</span>
                    <span>{new Date(p.started_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Logs Console */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pipeline Output Logs</h2>
          </div>
          {activeLog ? (
            <pre className="log-output" style={{ minHeight: 380 }}>{activeLog}</pre>
          ) : (
            <div className="empty-state" style={{ minHeight: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Select a pipeline run on the left to inspect execution logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
