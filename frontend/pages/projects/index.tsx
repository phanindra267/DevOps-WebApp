import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Modal from '../../src/components/Modal';
import { getProjects, createProject, deleteProject } from '../../src/lib/api';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getProjects();
      setProjects(res.data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createProject(name, description);
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create project');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      <Head>
        <title>Projects | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Organize applications, environments, infrastructure, and delivery pipelines
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create Project
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h3>No Projects Found</h3>
            <p style={{ marginTop: 6, marginBottom: 16 }}>
              Create your first project to start provisioning infrastructure and deploying workloads.
            </p>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              + Create Project
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)', width: 60 }}>#{p.id}</td>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/projects/${p.id}`} style={{ color: 'var(--accent)' }}>
                        {p.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.description || '—'}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="btn btn-sm"
                        style={{ marginRight: 8 }}
                      >
                        Manage
                      </Link>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(p.id, p.name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal title="Create New Project" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleCreate}>
          {error && <div className="error-msg">{error}</div>}

          <div className="form-group">
            <label>Project Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Payments Microservice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="e.g. Core banking payment settlement pipeline and containerized service"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
