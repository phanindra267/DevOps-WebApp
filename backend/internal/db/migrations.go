package db

import (
	"database/sql"
	"log"
)

func RunMigrations(d *sql.DB) error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			username TEXT UNIQUE NOT NULL,
			email TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'viewer',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS projects (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT DEFAULT '',
			owner_id INT REFERENCES users(id),
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS environments (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			env_type TEXT NOT NULL DEFAULT 'dev',
			status TEXT NOT NULL DEFAULT 'active',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS infrastructure_stacks (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			environment_id INT REFERENCES environments(id),
			name TEXT NOT NULL,
			provider TEXT NOT NULL DEFAULT 'terraform',
			status TEXT NOT NULL DEFAULT 'pending',
			last_applied_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS deployments (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			environment_id INT REFERENCES environments(id),
			image_tag TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			started_at TIMESTAMP,
			finished_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS pipeline_runs (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			trigger_type TEXT NOT NULL DEFAULT 'manual',
			status TEXT NOT NULL DEFAULT 'pending',
			started_at TIMESTAMP DEFAULT NOW(),
			finished_at TIMESTAMP,
			logs TEXT DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS security_scans (
			id SERIAL PRIMARY KEY,
			deployment_id INT REFERENCES deployments(id) ON DELETE CASCADE,
			scan_type TEXT NOT NULL DEFAULT 'full',
			status TEXT NOT NULL DEFAULT 'pending',
			summary TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS vulnerabilities (
			id SERIAL PRIMARY KEY,
			security_scan_id INT REFERENCES security_scans(id) ON DELETE CASCADE,
			severity TEXT NOT NULL,
			title TEXT NOT NULL,
			description TEXT DEFAULT '',
			remediation TEXT DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS metric_records (
			id SERIAL PRIMARY KEY,
			source TEXT NOT NULL,
			name TEXT NOT NULL,
			value FLOAT8 NOT NULL,
			labels TEXT DEFAULT '',
			recorded_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS alert_records (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			severity TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'firing',
			message TEXT DEFAULT '',
			fired_at TIMESTAMP DEFAULT NOW(),
			resolved_at TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS governance_policies (
			id SERIAL PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT DEFAULT '',
			category TEXT DEFAULT '',
			severity TEXT NOT NULL DEFAULT 'medium',
			enabled BOOLEAN DEFAULT true,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS compliance_results (
			id SERIAL PRIMARY KEY,
			policy_id INT REFERENCES governance_policies(id),
			project_id INT REFERENCES projects(id),
			status TEXT NOT NULL,
			details TEXT DEFAULT '',
			evaluated_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS audit_logs (
			id SERIAL PRIMARY KEY,
			user_id INT,
			action TEXT NOT NULL,
			resource_type TEXT DEFAULT '',
			resource_id TEXT DEFAULT '',
			details TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS technical_debt_items (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			description TEXT DEFAULT '',
			priority TEXT NOT NULL DEFAULT 'medium',
			status TEXT NOT NULL DEFAULT 'open',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS experiments (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			description TEXT DEFAULT '',
			status TEXT NOT NULL DEFAULT 'draft',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS cost_records (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			environment_id INT REFERENCES environments(id),
			service_name TEXT NOT NULL,
			estimated_cost FLOAT8 NOT NULL DEFAULT 0.0,
			actual_cost FLOAT8 NOT NULL DEFAULT 0.0,
			currency TEXT NOT NULL DEFAULT 'USD',
			period_start TIMESTAMP DEFAULT NOW(),
			period_end TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
			recorded_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS cost_recommendations (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE,
			resource_name TEXT NOT NULL,
			recommendation_type TEXT NOT NULL,
			potential_savings FLOAT8 NOT NULL DEFAULT 0.0,
			status TEXT NOT NULL DEFAULT 'open',
			details TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS budgets (
			id SERIAL PRIMARY KEY,
			project_id INT REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
			monthly_budget FLOAT8 NOT NULL DEFAULT 500.0,
			alert_threshold_percent INT NOT NULL DEFAULT 80,
			current_spend FLOAT8 NOT NULL DEFAULT 0.0,
			status TEXT NOT NULL DEFAULT 'normal',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
	}

	for _, stmt := range tables {
		if _, err := d.Exec(stmt); err != nil {
			log.Printf("migration error: %v\nstatement: %s", err, stmt)
			return err
		}
	}

	// Seed default governance policies
	seeds := []string{
		`INSERT INTO governance_policies (name, description, category, severity)
		 SELECT 'require-tagging','All resources must have owner and environment tags','tagging','high'
		 WHERE NOT EXISTS (SELECT 1 FROM governance_policies WHERE name='require-tagging')`,
		`INSERT INTO governance_policies (name, description, category, severity)
		 SELECT 'require-encryption','Storage and database resources must use encryption at rest','security','critical'
		 WHERE NOT EXISTS (SELECT 1 FROM governance_policies WHERE name='require-encryption')`,
		`INSERT INTO governance_policies (name, description, category, severity)
		 SELECT 'no-public-access','Resources must not be publicly accessible unless explicitly approved','security','critical'
		 WHERE NOT EXISTS (SELECT 1 FROM governance_policies WHERE name='no-public-access')`,
		`INSERT INTO governance_policies (name, description, category, severity)
		 SELECT 'require-health-checks','Deployments must define health check endpoints','reliability','high'
		 WHERE NOT EXISTS (SELECT 1 FROM governance_policies WHERE name='require-health-checks')`,
		`INSERT INTO governance_policies (name, description, category, severity)
		 SELECT 'resource-limits','Containers must define CPU and memory limits','cost','medium'
		 WHERE NOT EXISTS (SELECT 1 FROM governance_policies WHERE name='resource-limits')`,
		`INSERT INTO governance_policies (name, description, category, severity)
		 SELECT 'backup-policy','Databases must have automated backups configured','reliability','high'
		 WHERE NOT EXISTS (SELECT 1 FROM governance_policies WHERE name='backup-policy')`,
	}
	for _, s := range seeds {
		d.Exec(s) // best-effort seed
	}

	return nil
}
