import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import StatusBadge from '../src/components/StatusBadge';
import { getProjects, getStacks, planStack, applyStack } from '../src/lib/api';

export default function InfrastructurePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(0);
  const [stacks, setStacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await getProjects();
        const projs = res.data || [];
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    async function loadStacks() {
      setLoading(true);
      try {
        const res = await getStacks(selectedProjectId);
        setStacks(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStacks();
  }, [selectedProjectId]);

  const handlePlan = async (id: number) => {
    try {
      const res = await planStack(id);
      setOutput(`=== Terraform Plan Output ===\n${JSON.stringify(res.data, null, 2)}`);
      // refresh
      const sRes = await getStacks(selectedProjectId);
      setStacks(sRes.data || []);
    } catch (err) {
      alert('Plan failed');
    }
  };

  const handleApply = async (id: number) => {
    try {
      const res = await applyStack(id);
      setOutput(`=== Terraform Apply Output ===\n${JSON.stringify(res.data, null, 2)}`);
      // refresh
      const sRes = await getStacks(selectedProjectId);
      setStacks(sRes.data || []);
    } catch (err) {
      alert('Apply failed');
    }
  };

  return (
    <div>
      <Head>
        <title>Infrastructure | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Infrastructure as Code (IaC)</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Declarative infrastructure automation using Terraform modules and AWS CloudFormation
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
            <h3 className="card-title">Execution Console</h3>
            <button className="btn btn-sm" onClick={() => setOutput(null)}>
              Dismiss
            </button>
          </div>
          <pre className="log-output">{output}</pre>
        </div>
      )}

      {/* Stacks table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Provisioned Stacks</h2>
        </div>

        {loading ? (
          <div className="empty-state">Loading infrastructure stacks...</div>
        ) : stacks.length === 0 ? (
          <div className="empty-state">
            <p>No stacks found for this project. Manage stacks inside the project details.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Stack Name</th>
                  <th>IaC Engine</th>
                  <th>State / Status</th>
                  <th>Last Applied</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stacks.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <span className="badge badge-info">{s.provider.toUpperCase()}</span>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {s.last_applied_at ? new Date(s.last_applied_at).toLocaleString() : 'Never'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-sm"
                        style={{ marginRight: 6 }}
                        onClick={() => handlePlan(s.id)}
                      >
                        🔍 Plan
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleApply(s.id)}
                      >
                        🚀 Apply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* IaC Comparison Section */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 className="card-title" style={{ marginBottom: 12 }}>
          IaC Technology Comparison (Academic Module II)
        </h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>HashiCorp Terraform</th>
                <th>AWS CloudFormation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Language Syntax</td>
                <td>HCL (HashiCorp Configuration Language)</td>
                <td>JSON / YAML Template Format</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Cloud Portability</td>
                <td>Multi-cloud (AWS, Azure, GCP, Kubernetes)</td>
                <td>AWS-native managed service</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>State Management</td>
                <td>Remote State (`terraform.tfstate` in S3 / pg backend)</td>
                <td>Managed automatically by AWS CloudFormation service</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Modularity & Reusability</td>
                <td>Composable Terraform Modules</td>
                <td>Nested Stacks & CloudFormation Modules</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Drift Detection</td>
                <td>`terraform plan -refresh-only`</td>
                <td>AWS CloudFormation Drift Detection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
