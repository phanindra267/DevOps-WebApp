import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import StatusBadge from '../src/components/StatusBadge';
import Modal from '../src/components/Modal';
import { getPolicies, createPolicy, getAuditLogs } from '../src/lib/api';

export default function GovernancePage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('security');
  const [severity, setSeverity] = useState('high');

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

  return (
    <div>
      <Head>
        <title>Governance | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Governance, Compliance & Audit</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Policy-as-Code enforcement, resource tagging, encryption validation, and immutable audit trails
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Define Policy
        </button>
      </div>

      {/* Policies section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Governance Policy Catalog</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {policies.length} Active Policies Enforced
          </span>
        </div>

        {loading ? (
          <div className="empty-state">Loading governance policies...</div>
        ) : policies.length === 0 ? (
          <div className="empty-state">No governance policies defined.</div>
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
                {policies.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{p.name}</td>
                    <td>
                      <span className="badge badge-neutral">{p.category?.toUpperCase()}</span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.severity === 'critical'
                            ? 'badge-error'
                            : p.severity === 'high'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {p.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.description}</td>
                    <td>
                      <StatusBadge status={p.enabled ? 'active' : 'disabled'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Trail Section */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2 className="card-title">Immutable Audit Trail (Administrative Actions)</h2>
        </div>

        {logs.length === 0 ? (
          <div className="empty-state">No administrative audit records logged.</div>
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
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{l.action}</td>
                    <td>
                      <span className="badge badge-info">{l.resource_type || 'system'}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {l.resource_id || '—'}
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {l.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal title="Define Governance Policy" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreatePolicy}>
          <div className="form-group">
            <label>Policy Name / Key</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. enforce-https-ingress"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="security">Security</option>
              <option value="tagging">Tagging & Metadata</option>
              <option value="reliability">Reliability</option>
              <option value="cost">Resource Limits</option>
            </select>
          </div>
          <div className="form-group">
            <label>Severity</label>
            <select
              className="form-input"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="form-group">
            <label>Policy Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="All ingress resources must terminate TLS with trusted certificate"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Policy
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
