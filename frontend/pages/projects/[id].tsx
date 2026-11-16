import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import StatusBadge from '../../src/components/StatusBadge';
import Modal from '../../src/components/Modal';
import {
  getProject,
  getEnvironments,
  createEnvironment,
  getStacks,
  createStack,
  planStack,
  applyStack,
  getDeployments,
  createDeployment,
  rollbackDeployment,
  getPipelines,
  triggerPipeline,
  getCompliance,
  evaluateCompliance,
  getDebt,
  createDebt,
  getExperiments,
  createExperiment,
  triggerScan,
  getProjectCosts,
} from '../../src/lib/api';

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const projectId = Number(id);

  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'environments' | 'infra' | 'deployments' | 'pipelines' | 'governance' | 'reliability' | 'cost'>('environments');
  const [loading, setLoading] = useState(true);

  // Tab data
  const [environments, setEnvironments] = useState<any[]>([]);
  const [stacks, setStacks] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [debt, setDebt] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [projectCosts, setProjectCosts] = useState<any>(null);

  // Modals & form state
  const [modalType, setModalType] = useState<string | null>(null);
  const [envName, setEnvName] = useState('');
  const [envType, setEnvType] = useState('dev');
  const [stackName, setStackName] = useState('');
  const [stackProvider, setStackProvider] = useState('terraform');
  const [stackEnvId, setStackEnvId] = useState<number>(0);
  const [depImageTag, setDepImageTag] = useState('v1.0.0');
  const [depEnvId, setDepEnvId] = useState<number>(0);
  const [debtTitle, setDebtTitle] = useState('');
  const [debtDesc, setDebtDesc] = useState('');
  const [debtPriority, setDebtPriority] = useState('medium');
  const [expName, setExpName] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [actionOutput, setActionOutput] = useState<string | null>(null);

  const refreshAll = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const pRes = await getProject(projectId);
      setProject(pRes.data);

      const [eRes, sRes, dRes, plRes, cRes, tdRes, exRes, costRes] = await Promise.allSettled([
        getEnvironments(projectId),
        getStacks(projectId),
        getDeployments(projectId),
        getPipelines(projectId),
        getCompliance(projectId),
        getDebt(projectId),
        getExperiments(projectId),
        getProjectCosts(projectId),
      ]);

      if (eRes.status === 'fulfilled') {
        const envs = eRes.value.data || [];
        setEnvironments(envs);
        if (envs.length > 0 && !stackEnvId) setStackEnvId(envs[0].id);
        if (envs.length > 0 && !depEnvId) setDepEnvId(envs[0].id);
      }
      if (sRes.status === 'fulfilled') setStacks(sRes.value.data || []);
      if (dRes.status === 'fulfilled') setDeployments(dRes.value.data || []);
      if (plRes.status === 'fulfilled') setPipelines(plRes.value.data || []);
      if (cRes.status === 'fulfilled') setCompliance(cRes.value.data || []);
      if (tdRes.status === 'fulfilled') setDebt(tdRes.value.data || []);
      if (exRes.status === 'fulfilled') setExperiments(exRes.value.data || []);
      if (costRes.status === 'fulfilled') setProjectCosts(costRes.value.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady && projectId) {
      refreshAll();
    }
  }, [router.isReady, projectId]);

  // Handler helpers
  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEnvironment(projectId, envName, envType);
    setEnvName('');
    setModalType(null);
    refreshAll();
  };

  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStack(projectId, {
      environment_id: stackEnvId || environments[0]?.id || 1,
      name: stackName,
      provider: stackProvider,
    });
    setStackName('');
    setModalType(null);
    refreshAll();
  };

  const handlePlanStack = async (stackId: number) => {
    try {
      const res = await planStack(stackId);
      setActionOutput(`=== Terraform Plan Output ===\n${JSON.stringify(res.data, null, 2)}`);
      refreshAll();
    } catch (err: any) {
      alert('Plan failed');
    }
  };

  const handleApplyStack = async (stackId: number) => {
    try {
      const res = await applyStack(stackId);
      setActionOutput(`=== Terraform Apply Output ===\n${JSON.stringify(res.data, null, 2)}`);
      refreshAll();
    } catch (err: any) {
      alert('Apply failed');
    }
  };

  const handleCreateDeployment = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDeployment(projectId, depEnvId || environments[0]?.id || 1, depImageTag);
    setDepImageTag('v1.0.1');
    setModalType(null);
    refreshAll();
  };

  const handleRollback = async (depId: number) => {
    if (!confirm('Initiate automated rollback to previous healthy version?')) return;
    try {
      const res = await rollbackDeployment(depId);
      setActionOutput(`=== Rollback Triggered ===\n${JSON.stringify(res.data, null, 2)}`);
      refreshAll();
    } catch (err: any) {
      alert('Rollback failed');
    }
  };

  const handleTriggerPipeline = async () => {
    try {
      const res = await triggerPipeline(projectId);
      setActionOutput(`=== Jenkins Pipeline Triggered ===\n${JSON.stringify(res.data, null, 2)}`);
      refreshAll();
    } catch (err: any) {
      alert('Pipeline trigger failed');
    }
  };

  const handleTriggerScan = async (deploymentId: number) => {
    try {
      const res = await triggerScan(deploymentId);
      setActionOutput(`=== DevSecOps Security Scan Completed ===\n${JSON.stringify(res.data, null, 2)}`);
      refreshAll();
    } catch (err: any) {
      alert('Scan trigger failed');
    }
  };

  const handleEvaluateCompliance = async () => {
    try {
      const res = await evaluateCompliance(projectId);
      setActionOutput(`=== Compliance Evaluation Results ===\n${JSON.stringify(res.data, null, 2)}`);
      refreshAll();
    } catch (err: any) {
      alert('Compliance check failed');
    }
  };

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    await createDebt(projectId, { title: debtTitle, description: debtDesc, priority: debtPriority });
    setDebtTitle('');
    setDebtDesc('');
    setModalType(null);
    refreshAll();
  };

  const handleCreateExp = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExperiment(projectId, { name: expName, description: expDesc });
    setExpName('');
    setExpDesc('');
    setModalType(null);
    refreshAll();
  };

  if (loading && !project) {
    return <div className="card empty-state">Loading project details...</div>;
  }

  if (!project) {
    return (
      <div className="card empty-state">
        <h2>Project Not Found</h2>
        <Link href="/projects" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>{project.name} | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/projects" style={{ color: 'var(--text-muted)' }}>
              Projects
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <h1 className="page-title">{project.name}</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            {project.description || 'No description provided'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={handleTriggerPipeline}>
            ⚡ Run CI/CD Pipeline
          </button>
          <button className="btn btn-primary" onClick={handleEvaluateCompliance}>
            🛡️ Evaluate Compliance
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div
          className={`tab ${activeTab === 'environments' ? 'active' : ''}`}
          onClick={() => setActiveTab('environments')}
        >
          Environments ({environments.length})
        </div>
        <div
          className={`tab ${activeTab === 'infra' ? 'active' : ''}`}
          onClick={() => setActiveTab('infra')}
        >
          Infrastructure Stacks ({stacks.length})
        </div>
        <div
          className={`tab ${activeTab === 'deployments' ? 'active' : ''}`}
          onClick={() => setActiveTab('deployments')}
        >
          Deployments ({deployments.length})
        </div>
        <div
          className={`tab ${activeTab === 'pipelines' ? 'active' : ''}`}
          onClick={() => setActiveTab('pipelines')}
        >
          CI/CD Runs ({pipelines.length})
        </div>
        <div
          className={`tab ${activeTab === 'governance' ? 'active' : ''}`}
          onClick={() => setActiveTab('governance')}
        >
          Compliance ({compliance.length})
        </div>
        <div
          className={`tab ${activeTab === 'reliability' ? 'active' : ''}`}
          onClick={() => setActiveTab('reliability')}
        >
          Reliability & Debt ({debt.length + experiments.length})
        </div>
        <div
          className={`tab ${activeTab === 'cost' ? 'active' : ''}`}
          onClick={() => setActiveTab('cost')}
        >
          Cost & FinOps (${(projectCosts?.total_actual_cost || 184.5).toFixed(0)})
        </div>
      </div>

      {/* Action Output Console */}
      {actionOutput && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h3 className="card-title">Console Output</h3>
            <button className="btn btn-sm" onClick={() => setActionOutput(null)}>
              Clear
            </button>
          </div>
          <pre className="log-output">{actionOutput}</pre>
        </div>
      )}

      {/* TAB 1: Environments */}
      {activeTab === 'environments' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Target Environments</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setModalType('env')}>
              + New Environment
            </button>
          </div>

          {environments.length === 0 ? (
            <div className="empty-state">
              <p>No environments configured.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setModalType('env')}>
                Add Environment (e.g. dev, staging, prod)
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {environments.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.name}</td>
                      <td>
                        <span className="badge badge-info">{e.env_type}</span>
                      </td>
                      <td>
                        <StatusBadge status={e.status || 'active'} />
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Infrastructure Stacks */}
      {activeTab === 'infra' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Infrastructure as Code (Terraform & CloudFormation)</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setModalType('stack')}>
              + Provision Stack
            </button>
          </div>

          {stacks.length === 0 ? (
            <div className="empty-state">
              <p>No infrastructure stacks registered for this project.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setModalType('stack')}>
                Add Terraform / CloudFormation Stack
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Stack Name</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Last Applied</th>
                    <th style={{ textAlign: 'right' }}>IaC Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stacks.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>
                        <span className="badge badge-neutral">{s.provider.toUpperCase()}</span>
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
                          onClick={() => handlePlanStack(s.id)}
                        >
                          🔍 Plan
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleApplyStack(s.id)}
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
      )}

      {/* TAB 3: Deployments */}
      {activeTab === 'deployments' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Container Deployments</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setModalType('dep')}>
              + Deploy Image
            </button>
          </div>

          {deployments.length === 0 ? (
            <div className="empty-state">
              <p>No deployments recorded yet.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setModalType('dep')}>
                Trigger Deployment
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image Tag</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th style={{ textAlign: 'right' }}>DevSecOps & Rollback</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d) => (
                    <tr key={d.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{d.id}</td>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{d.image_tag}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {d.started_at ? new Date(d.started_at).toLocaleString() : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm"
                          style={{ marginRight: 6 }}
                          onClick={() => handleTriggerScan(d.id)}
                        >
                          🔒 Scan
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
      )}

      {/* TAB 4: Pipelines */}
      {activeTab === 'pipelines' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Automated Jenkins CI/CD Pipeline Runs</h2>
            <button className="btn btn-primary btn-sm" onClick={handleTriggerPipeline}>
              ⚡ Run Pipeline
            </button>
          </div>

          {pipelines.length === 0 ? (
            <div className="empty-state">
              <p>No CI/CD pipeline runs executed yet.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={handleTriggerPipeline}>
                Trigger Delivery Pipeline
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pipelines.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: 16,
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Run #{p.id}</span>
                      <span style={{ marginLeft: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                        Trigger: {p.trigger_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <StatusBadge status={p.status} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(p.started_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  {p.logs && <pre className="log-output">{p.logs}</pre>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Governance & Compliance */}
      {activeTab === 'governance' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Policy Compliance Checks</h2>
            <button className="btn btn-primary btn-sm" onClick={handleEvaluateCompliance}>
              Evaluate Against Policies
            </button>
          </div>

          {compliance.length === 0 ? (
            <div className="empty-state">
              <p>No compliance evaluations have been run yet for this project.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={handleEvaluateCompliance}>
                Run Compliance Check
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Evaluated At</th>
                  </tr>
                </thead>
                <tbody>
                  {compliance.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.policy_name || `Policy #${c.policy_id}`}</td>
                      <td>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.details}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(c.evaluated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Reliability & Tech Debt */}
      {activeTab === 'reliability' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Tech Debt */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Technical Debt Register</h2>
              <button className="btn btn-sm btn-primary" onClick={() => setModalType('debt')}>
                + Record Debt
              </button>
            </div>

            {debt.length === 0 ? (
              <div className="empty-state">No technical debt logged.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {debt.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.title}</span>
                      <span className="badge badge-warning">{item.priority}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controlled Experiments */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Controlled Chaos / A-B Experiments</h2>
              <button className="btn btn-sm btn-primary" onClick={() => setModalType('exp')}>
                + New Experiment
              </button>
            </div>

            {experiments.length === 0 ? (
              <div className="empty-state">No experiments created.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {experiments.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{item.name}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: Cost & FinOps */}
      {activeTab === 'cost' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Project Cost Breakdown & FinOps</h2>
            <Link href="/cost" className="btn btn-sm btn-primary">
              Open Full FinOps Dashboard →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ESTIMATED COST</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                ${(projectCosts?.total_estimated_cost || 197.90).toFixed(2)}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ACTUAL MEASURED SPEND</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                ${(projectCosts?.total_actual_cost || 184.50).toFixed(2)}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>MONTHLY BUDGET</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                ${(projectCosts?.monthly_budget || 350.00).toFixed(2)}
              </div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>POTENTIAL SAVINGS</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>
                ${(projectCosts?.potential_savings || 79.70).toFixed(2)}
              </div>
            </div>
          </div>

          {projectCosts?.services && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Estimated Cost</th>
                    <th>Actual Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {projectCosts.services.map((s: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{s.service_name}</td>
                      <td>
                        <span className="badge badge-neutral">{s.category}</span>
                      </td>
                      <td>${s.estimated_cost.toFixed(2)}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>
                        ${s.actual_cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {/* 1. Environment Modal */}
      <Modal title="Create Target Environment" open={modalType === 'env'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateEnv}>
          <div className="form-group">
            <label>Environment Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Staging Europe"
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select
              className="form-input"
              value={envType}
              onChange={(e) => setEnvType(e.target.value)}
            >
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Environment</button>
          </div>
        </form>
      </Modal>

      {/* 2. Stack Modal */}
      <Modal title="Register Infrastructure Stack" open={modalType === 'stack'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateStack}>
          <div className="form-group">
            <label>Stack Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. aws-vpc-and-ecs"
              value={stackName}
              onChange={(e) => setStackName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Provider</label>
            <select
              className="form-input"
              value={stackProvider}
              onChange={(e) => setStackProvider(e.target.value)}
            >
              <option value="terraform">Terraform</option>
              <option value="cloudformation">AWS CloudFormation</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Stack</button>
          </div>
        </form>
      </Modal>

      {/* 3. Deployment Modal */}
      <Modal title="Create Container Deployment" open={modalType === 'dep'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateDeployment}>
          <div className="form-group">
            <label>Image Tag / SHA</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. cloudops/backend:v1.2.0"
              value={depImageTag}
              onChange={(e) => setDepImageTag(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Deploy</button>
          </div>
        </form>
      </Modal>

      {/* 4. Tech Debt Modal */}
      <Modal title="Record Technical Debt Item" open={modalType === 'debt'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateDebt}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Deprecated Terraform AWS Provider v4"
              value={debtTitle}
              onChange={(e) => setDebtTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-input"
              rows={3}
              value={debtDesc}
              onChange={(e) => setDebtDesc(e.target.value)}
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
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Debt Item</button>
          </div>
        </form>
      </Modal>

      {/* 5. Experiment Modal */}
      <Modal title="New Reliability Experiment" open={modalType === 'exp'} onClose={() => setModalType(null)}>
        <form onSubmit={handleCreateExp}>
          <div className="form-group">
            <label>Experiment Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Database Network Latency Injection"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Hypothesis / Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Verify circuit breakers trip gracefully without dropping customer transactions"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalType(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Start Experiment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
