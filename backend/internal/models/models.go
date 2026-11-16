package models

import "time"

// ── Identity ────────────────────────────────────────────────────────────────

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ── Project & Environment ───────────────────────────────────────────────────

type Project struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	OwnerID     int       `json:"owner_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Environment struct {
	ID        int       `json:"id"`
	ProjectID int       `json:"project_id"`
	Name      string    `json:"name"`
	EnvType   string    `json:"env_type"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// ── Infrastructure ──────────────────────────────────────────────────────────

type InfrastructureStack struct {
	ID            int        `json:"id"`
	ProjectID     int        `json:"project_id"`
	EnvironmentID int        `json:"environment_id"`
	Name          string     `json:"name"`
	Provider      string     `json:"provider"`
	Status        string     `json:"status"`
	LastAppliedAt *time.Time `json:"last_applied_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

// ── Delivery ────────────────────────────────────────────────────────────────

type Deployment struct {
	ID            int        `json:"id"`
	ProjectID     int        `json:"project_id"`
	EnvironmentID int        `json:"environment_id"`
	ImageTag      string     `json:"image_tag"`
	Status        string     `json:"status"`
	StartedAt     *time.Time `json:"started_at"`
	FinishedAt    *time.Time `json:"finished_at"`
	CreatedAt     time.Time  `json:"created_at"`
}

type PipelineRun struct {
	ID          int        `json:"id"`
	ProjectID   int        `json:"project_id"`
	TriggerType string     `json:"trigger_type"`
	Status      string     `json:"status"`
	StartedAt   time.Time  `json:"started_at"`
	FinishedAt  *time.Time `json:"finished_at"`
	Logs        string     `json:"logs"`
}

// ── Security ────────────────────────────────────────────────────────────────

type SecurityScan struct {
	ID           int       `json:"id"`
	DeploymentID int       `json:"deployment_id"`
	ScanType     string    `json:"scan_type"`
	Status       string    `json:"status"`
	Summary      string    `json:"summary"`
	CreatedAt    time.Time `json:"created_at"`
}

type Vulnerability struct {
	ID             int    `json:"id"`
	SecurityScanID int    `json:"security_scan_id"`
	Severity       string `json:"severity"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Remediation    string `json:"remediation"`
}

// ── Operations ──────────────────────────────────────────────────────────────

type MetricRecord struct {
	ID         int       `json:"id"`
	Source     string    `json:"source"`
	Name       string    `json:"name"`
	Value      float64   `json:"value"`
	Labels     string    `json:"labels"`
	RecordedAt time.Time `json:"recorded_at"`
}

type AlertRecord struct {
	ID         int        `json:"id"`
	Name       string     `json:"name"`
	Severity   string     `json:"severity"`
	Status     string     `json:"status"`
	Message    string     `json:"message"`
	FiredAt    time.Time  `json:"fired_at"`
	ResolvedAt *time.Time `json:"resolved_at"`
}

// ── Governance ──────────────────────────────────────────────────────────────

type GovernancePolicy struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Severity    string    `json:"severity"`
	Enabled     bool      `json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
}

type ComplianceResult struct {
	ID          int       `json:"id"`
	PolicyID    int       `json:"policy_id"`
	ProjectID   int       `json:"project_id"`
	Status      string    `json:"status"`
	Details     string    `json:"details"`
	EvaluatedAt time.Time `json:"evaluated_at"`
}

type AuditLog struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	Action       string    `json:"action"`
	ResourceType string    `json:"resource_type"`
	ResourceID   string    `json:"resource_id"`
	Details      string    `json:"details"`
	CreatedAt    time.Time `json:"created_at"`
}

// ── Engineering ─────────────────────────────────────────────────────────────

type TechnicalDebtItem struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

type Experiment struct {
	ID          int       `json:"id"`
	ProjectID   int       `json:"project_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

// ── Cost & Billing Optimization ─────────────────────────────────────────────

type CostRecord struct {
	ID            int       `json:"id"`
	ProjectID     int       `json:"project_id"`
	EnvironmentID int       `json:"environment_id"`
	ServiceName   string    `json:"service_name"`
	EstimatedCost float64   `json:"estimated_cost"`
	ActualCost    float64   `json:"actual_cost"`
	Currency      string    `json:"currency"`
	PeriodStart   time.Time `json:"period_start"`
	PeriodEnd     time.Time `json:"period_end"`
	RecordedAt    time.Time `json:"recorded_at"`
}

type CostRecommendation struct {
	ID                 int       `json:"id"`
	ProjectID          int       `json:"project_id"`
	ResourceName       string    `json:"resource_name"`
	RecommendationType string    `json:"recommendation_type"`
	PotentialSavings   float64   `json:"potential_savings"`
	Status             string    `json:"status"`
	Details            string    `json:"details"`
	CreatedAt          time.Time `json:"created_at"`
}

type Budget struct {
	ID                    int       `json:"id"`
	ProjectID             int       `json:"project_id"`
	MonthlyBudget         float64   `json:"monthly_budget"`
	AlertThresholdPercent int       `json:"alert_threshold_percent"`
	CurrentSpend          float64   `json:"current_spend"`
	Status                string    `json:"status"`
	CreatedAt             time.Time `json:"created_at"`
}
