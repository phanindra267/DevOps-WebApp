#!/bin/bash
set -e

echo "=== CloudOps Sentinel Database Initialization ==="

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'viewer',
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Projects
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    owner_id    INT REFERENCES users(id),
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Environments
-- ============================================================
CREATE TABLE IF NOT EXISTS environments (
    id          SERIAL PRIMARY KEY,
    project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    env_type    TEXT NOT NULL DEFAULT 'dev',
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Infrastructure Stacks
-- ============================================================
CREATE TABLE IF NOT EXISTS infrastructure_stacks (
    id              SERIAL PRIMARY KEY,
    project_id      INT REFERENCES projects(id) ON DELETE CASCADE,
    environment_id  INT REFERENCES environments(id),
    name            TEXT NOT NULL,
    provider        TEXT NOT NULL DEFAULT 'terraform',
    status          TEXT NOT NULL DEFAULT 'pending',
    last_applied_at TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Deployments
-- ============================================================
CREATE TABLE IF NOT EXISTS deployments (
    id              SERIAL PRIMARY KEY,
    project_id      INT REFERENCES projects(id) ON DELETE CASCADE,
    environment_id  INT REFERENCES environments(id),
    image_tag       TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    started_at      TIMESTAMP,
    finished_at     TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Pipeline Runs
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id            SERIAL PRIMARY KEY,
    project_id    INT REFERENCES projects(id) ON DELETE CASCADE,
    trigger_type  TEXT NOT NULL DEFAULT 'manual',
    status        TEXT NOT NULL DEFAULT 'pending',
    started_at    TIMESTAMP DEFAULT NOW(),
    finished_at   TIMESTAMP,
    logs          TEXT
);

-- ============================================================
-- Security Scans
-- ============================================================
CREATE TABLE IF NOT EXISTS security_scans (
    id            SERIAL PRIMARY KEY,
    deployment_id INT REFERENCES deployments(id) ON DELETE CASCADE,
    scan_type     TEXT NOT NULL DEFAULT 'full',
    status        TEXT NOT NULL DEFAULT 'pending',
    summary       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Vulnerabilities
-- ============================================================
CREATE TABLE IF NOT EXISTS vulnerabilities (
    id                SERIAL PRIMARY KEY,
    security_scan_id  INT REFERENCES security_scans(id) ON DELETE CASCADE,
    severity          TEXT NOT NULL,
    title             TEXT NOT NULL,
    description       TEXT,
    remediation       TEXT
);

-- ============================================================
-- Metric Records
-- ============================================================
CREATE TABLE IF NOT EXISTS metric_records (
    id          SERIAL PRIMARY KEY,
    source      TEXT NOT NULL,
    name        TEXT NOT NULL,
    value       FLOAT8 NOT NULL,
    labels      TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Alert Records
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_records (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    severity    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'firing',
    message     TEXT,
    fired_at    TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- ============================================================
-- Governance Policies
-- ============================================================
CREATE TABLE IF NOT EXISTS governance_policies (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    category    TEXT,
    severity    TEXT NOT NULL DEFAULT 'medium',
    enabled     BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Compliance Results
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_results (
    id           SERIAL PRIMARY KEY,
    policy_id    INT REFERENCES governance_policies(id),
    project_id   INT REFERENCES projects(id),
    status       TEXT NOT NULL,
    details      TEXT,
    evaluated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Audit Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id            SERIAL PRIMARY KEY,
    user_id       INT,
    action        TEXT NOT NULL,
    resource_type TEXT,
    resource_id   TEXT,
    details       TEXT,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Technical Debt Items
-- ============================================================
CREATE TABLE IF NOT EXISTS technical_debt_items (
    id          SERIAL PRIMARY KEY,
    project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    priority    TEXT NOT NULL DEFAULT 'medium',
    status      TEXT NOT NULL DEFAULT 'open',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Experiments
-- ============================================================
CREATE TABLE IF NOT EXISTS experiments (
    id          SERIAL PRIMARY KEY,
    project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'draft',
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Cost Records & Billing
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_records (
    id              SERIAL PRIMARY KEY,
    project_id      INT REFERENCES projects(id) ON DELETE CASCADE,
    environment_id  INT REFERENCES environments(id),
    service_name    TEXT NOT NULL,
    estimated_cost  FLOAT8 NOT NULL DEFAULT 0.0,
    actual_cost     FLOAT8 NOT NULL DEFAULT 0.0,
    currency        TEXT NOT NULL DEFAULT 'USD',
    period_start    TIMESTAMP DEFAULT NOW(),
    period_end      TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
    recorded_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Cost Optimization Recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_recommendations (
    id                  SERIAL PRIMARY KEY,
    project_id          INT REFERENCES projects(id) ON DELETE CASCADE,
    resource_name       TEXT NOT NULL,
    recommendation_type TEXT NOT NULL,
    potential_savings   FLOAT8 NOT NULL DEFAULT 0.0,
    status              TEXT NOT NULL DEFAULT 'open',
    details             TEXT DEFAULT '',
    created_at          TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Project Budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
    id                      SERIAL PRIMARY KEY,
    project_id              INT REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    monthly_budget          FLOAT8 NOT NULL DEFAULT 500.0,
    alert_threshold_percent INT NOT NULL DEFAULT 80,
    current_spend           FLOAT8 NOT NULL DEFAULT 0.0,
    status                  TEXT NOT NULL DEFAULT 'normal',
    created_at              TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Seed Data
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@cloudops.local',
        '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'admin')
ON CONFLICT (username) DO NOTHING;

-- Sample project
INSERT INTO projects (name, description, owner_id)
VALUES ('CloudOps Demo Project',
        'A sample project demonstrating the CloudOps Sentinel platform capabilities.',
        (SELECT id FROM users WHERE username = 'admin'))
ON CONFLICT DO NOTHING;

-- Sample environment
INSERT INTO environments (project_id, name, env_type, status)
VALUES (
    (SELECT id FROM projects WHERE name = 'CloudOps Demo Project'),
    'Development',
    'dev',
    'active'
)
ON CONFLICT DO NOTHING;

-- Initial Budget & Cost Records (Demo Project)
INSERT INTO budgets (project_id, monthly_budget, alert_threshold_percent, current_spend, status)
VALUES (
    (SELECT id FROM projects WHERE name = 'CloudOps Demo Project'),
    350.00,
    80,
    184.50,
    'normal'
)
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO cost_records (project_id, environment_id, service_name, estimated_cost, actual_cost)
VALUES 
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 1, 'Amazon EC2 (Compute)', 86.40, 78.20),
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 1, 'Amazon RDS PostgreSQL', 45.00, 43.10),
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 1, 'Amazon EBS (gp3 Storage)', 28.50, 27.00),
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 1, 'Data Transfer & NAT Gateway', 38.00, 36.20);

INSERT INTO cost_recommendations (project_id, resource_name, recommendation_type, potential_savings, status, details)
VALUES
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 'ec2-prod-worker-2', 'Right-sizing', 32.50, 'open', 'CPU utilization averaged < 6% over 14 days. Downsize from t3.large to t3.medium.'),
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 'vol-08a9f24b89e', 'Unattached EBS Volume', 14.80, 'open', 'gp3 volume unattached to any instance for > 30 days. Recommend snapshot and delete.'),
    ((SELECT id FROM projects WHERE name = 'CloudOps Demo Project'), 'nat-gw-az2-idle', 'Idle NAT Gateway', 32.40, 'open', 'Zero egress observed through secondary AZ NAT Gateway. Consolidate to primary AZ for dev environment.');


EOSQL

echo "=== Database initialization complete ==="
