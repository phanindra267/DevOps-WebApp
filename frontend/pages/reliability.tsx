import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import StatusBadge from '../src/components/StatusBadge';
import Modal from '../src/components/Modal';
import { getProjects, getDebt, createDebt, getExperiments, createExperiment } from '../src/lib/api';

export default function ReliabilityPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [debts, setDebts] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [modalType, setModalType] = useState<'debt' | 'exp' | null>(null);
  const [debtTitle, setDebtTitle] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [debtPriority, setDebtPriority] = useState('medium');
  const [expName, setExpName] = useState('');
  const [expDesc, setExpDesc] = useState('');

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

  return (
    <div>
      <Head>
        <title>Reliability | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Reliability & Chaos Engineering</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Controlled failure simulations, automated recovery validation, and technical debt management
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

      {/* Two columns: Chaos Experiments & Tech Debt */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Controlled Experiments */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Failure Scenarios & Experiments</h2>
            <button className="btn btn-sm btn-primary" onClick={() => setModalType('exp')}>
              + New Scenario
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading experiments...</div>
          ) : experiments.length === 0 ? (
            <div className="empty-state">
              <p>No reliability experiments defined for this project.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setModalType('exp')}
              >
                Create Failure Scenario
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    padding: 14,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{exp.name}</span>
                    <StatusBadge status={exp.status} />
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                    {exp.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Debt Register */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Technical Debt Register</h2>
            <button className="btn btn-sm btn-primary" onClick={() => setModalType('debt')}>
              + Record Debt
            </button>
          </div>

          {loading ? (
            <div className="empty-state">Loading technical debt...</div>
          ) : debts.length === 0 ? (
            <div className="empty-state">
              <p>No technical debt items logged.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => setModalType('debt')}
              >
                Log Debt Item
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {debts.map((d) => (
                <div
                  key={d.id}
                  style={{
                    padding: 14,
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>{d.title}</span>
                    <span
                      className={`badge ${
                        d.priority === 'critical'
                          ? 'badge-error'
                          : d.priority === 'high'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}
                    >
                      {d.priority.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                    {d.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Failure Detection & Recovery Diagram Section */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          Failure Recovery Architecture (Figure 4)
        </h3>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          <span className="badge badge-error">1. Failure Occurs</span>
          <span>→</span>
          <span className="badge badge-warning">2. Prometheus Detection</span>
          <span>→</span>
          <span className="badge badge-warning">3. Actionable Alert</span>
          <span>→</span>
          <span className="badge badge-info">4. Diagnosis</span>
          <span>→</span>
          <span className="badge badge-info">5. Recovery / Rollback</span>
          <span>→</span>
          <span className="badge badge-success">6. Health Verification</span>
          <span>→</span>
          <span className="badge badge-success">7. Incident Resolution</span>
        </div>
      </div>

      {/* Modals */}
      <Modal title="Record Technical Debt Item" open={modalType === 'debt'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateDebt}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Upgrade PostgreSQL alpine base image"
              value={debtTitle}
              onChange={(e) => setDebtTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select
              className="form-input"
              value={debtPriority}
              onChange={(e) => setDebtPriority(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={debtDesc}
              onChange={(e) => setDebtDesc(e.target.value)}
              required
            />
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
            <input
              type="text"
              className="form-input"
              placeholder="e.g. High Memory Spike Simulation on Backend"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Hypothesis & Recovery Target</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Kubernetes HPA scales pod replicas from 2 to 5 within 90 seconds"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Experiment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
