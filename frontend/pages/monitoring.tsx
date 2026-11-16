import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Card from '../src/components/Card';
import StatusBadge from '../src/components/StatusBadge';
import { getHealth, getMetrics, getAlerts, resolveAlert } from '../src/lib/api';

export default function MonitoringPage() {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [hRes, mRes, aRes] = await Promise.allSettled([
        getHealth(),
        getMetrics(),
        getAlerts(),
      ]);
      if (hRes.status === 'fulfilled') setHealth(hRes.value.data);
      if (mRes.status === 'fulfilled') setMetrics(mRes.value.data || []);
      if (aRes.status === 'fulfilled') setAlerts(aRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolveAlert = async (id: number) => {
    try {
      await resolveAlert(id);
      fetchData();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  return (
    <div>
      <Head>
        <title>Monitoring | CloudOps Sentinel</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Monitoring & Observability</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Time-series telemetry, Prometheus metrics scraping, and Grafana visualization dashboards
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noreferrer"
            className="btn"
          >
            🔥 Prometheus (:9090)
          </a>
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            📊 Grafana Dashboards (:3001)
          </a>
        </div>
      </div>

      {/* Top metrics summary */}
      <div className="card-grid">
        <Card title="System Status" value={health?.status?.toUpperCase() || 'ONLINE'} icon="💓">
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={health?.status || 'healthy'} />
          </div>
        </Card>

        <Card title="Active Prometheus Alerts" value={alerts.filter((a) => a.status === 'firing').length} icon="🚨">
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Threshold breaches in last window
          </div>
        </Card>

        <Card title="Recorded Metrics Count" value={metrics.length} icon="📈">
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Application & infrastructure data points
          </div>
        </Card>

        <Card title="Observability Engine" value="Prometheus v2.51" icon="⚡">
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Scraping `/metrics` every 15s
          </div>
        </Card>
      </div>

      {/* Operational Alerts section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Operational Alerts & Incidents</h2>
          <button className="btn btn-sm" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="empty-state">
            <p>No firing or historical alerts recorded.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Alert Name</th>
                  <th>Severity</th>
                  <th>State</th>
                  <th>Message / Trigger Details</th>
                  <th>Fired At</th>
                  <th style={{ textAlign: 'right' }}>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.name}</td>
                    <td>
                      <span
                        className={`badge ${
                          a.severity === 'critical'
                            ? 'badge-error'
                            : a.severity === 'warning'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {a.severity.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.message}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {new Date(a.fired_at).toLocaleTimeString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {a.status === 'firing' ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleResolveAlert(a.id)}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--success)' }}>Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Metrics Feed */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          <h2 className="card-title">Live Telemetry Metrics (Scraped from Microservices)</h2>
        </div>

        {metrics.length === 0 ? (
          <div className="empty-state">
            No telemetry records in local database. Check `/metrics` endpoint for Prometheus exposition format.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Metric Name</th>
                  <th>Value</th>
                  <th>Labels</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {metrics.slice(0, 10).map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.source}</td>
                    <td style={{ fontFamily: 'monospace' }}>{m.name}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{m.value}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {m.labels || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(m.recorded_at).toLocaleTimeString()}
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
