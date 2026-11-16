package governance

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strconv"

	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}

// ── Policies ────────────────────────────────────────────────────────────────

type Policy struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Severity    string `json:"severity"`
	Enabled     bool   `json:"enabled"`
	CreatedAt   string `json:"created_at"`
}

type policyReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Severity    string `json:"severity"`
	Enabled     *bool  `json:"enabled"`
}

func GetPolicies(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(
		"SELECT id, name, description, category, severity, enabled, created_at FROM governance_policies ORDER BY created_at")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var policies []Policy
	for rows.Next() {
		var p Policy
		rows.Scan(&p.ID, &p.Name, &p.Description, &p.Category, &p.Severity, &p.Enabled, &p.CreatedAt)
		policies = append(policies, p)
	}
	if policies == nil {
		policies = []Policy{}
	}
	writeJSON(w, http.StatusOK, policies)
}

func CreatePolicy(w http.ResponseWriter, r *http.Request) {
	var req policyReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name required")
		return
	}
	if req.Severity == "" {
		req.Severity = "medium"
	}
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	var id int
	db.DB.QueryRow(
		"INSERT INTO governance_policies (name, description, category, severity, enabled) VALUES ($1,$2,$3,$4,$5) RETURNING id",
		req.Name, req.Description, req.Category, req.Severity, enabled,
	).Scan(&id)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

func UpdatePolicy(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var req policyReq
	json.NewDecoder(r.Body).Decode(&req)
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	db.DB.Exec(
		"UPDATE governance_policies SET name=$1, description=$2, category=$3, severity=$4, enabled=$5 WHERE id=$6",
		req.Name, req.Description, req.Category, req.Severity, enabled, id,
	)
	writeJSON(w, http.StatusOK, map[string]string{"message": "updated"})
}

// ── Compliance Evaluation ───────────────────────────────────────────────────

type ComplianceResult struct {
	ID          int    `json:"id"`
	PolicyID    int    `json:"policy_id"`
	PolicyName  string `json:"policy_name"`
	ProjectID   int    `json:"project_id"`
	Status      string `json:"status"`
	Details     string `json:"details"`
	EvaluatedAt string `json:"evaluated_at"`
}

func EvaluateCompliance(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])

	// Get enabled policies
	rows, err := db.DB.Query("SELECT id, name, description FROM governance_policies WHERE enabled=true")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var polID int
		var polName, polDesc string
		rows.Scan(&polID, &polName, &polDesc)

		// Simulated evaluation (random pass/warning/fail)
		statuses := []string{"passed", "passed", "passed", "warning", "failed"}
		st := statuses[rand.Intn(len(statuses))]
		details := "Policy '" + polName + "': " + st
		if st == "failed" {
			details += " — remediation required"
		}

		db.DB.Exec(
			"INSERT INTO compliance_results (policy_id, project_id, status, details) VALUES ($1,$2,$3,$4)",
			polID, pid, st, details,
		)
		results = append(results, map[string]interface{}{
			"policy_id":   polID,
			"policy_name": polName,
			"status":      st,
			"details":     details,
		})
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"project_id": pid,
		"results":    results,
	})
}

func GetCompliance(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(`
		SELECT cr.id, cr.policy_id, gp.name, cr.project_id, cr.status, cr.details, cr.evaluated_at
		FROM compliance_results cr
		JOIN governance_policies gp ON gp.id = cr.policy_id
		WHERE cr.project_id=$1
		ORDER BY cr.evaluated_at DESC`, pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var results []ComplianceResult
	for rows.Next() {
		var c ComplianceResult
		rows.Scan(&c.ID, &c.PolicyID, &c.PolicyName, &c.ProjectID, &c.Status, &c.Details, &c.EvaluatedAt)
		results = append(results, c)
	}
	if results == nil {
		results = []ComplianceResult{}
	}
	writeJSON(w, http.StatusOK, results)
}

// ── Audit Logs ──────────────────────────────────────────────────────────────

type AuditLogEntry struct {
	ID           int    `json:"id"`
	UserID       int    `json:"user_id"`
	Action       string `json:"action"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	Details      string `json:"details"`
	CreatedAt    string `json:"created_at"`
}

func GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	query := "SELECT id, user_id, action, resource_type, resource_id, details, created_at FROM audit_logs"
	args := []interface{}{}
	filters := ""

	if rt := r.URL.Query().Get("resource_type"); rt != "" {
		filters += " WHERE resource_type=$1"
		args = append(args, rt)
	}
	query += filters + " ORDER BY created_at DESC LIMIT 200"

	rows, err := db.DB.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var logs []AuditLogEntry
	for rows.Next() {
		var l AuditLogEntry
		rows.Scan(&l.ID, &l.UserID, &l.Action, &l.ResourceType, &l.ResourceID, &l.Details, &l.CreatedAt)
		logs = append(logs, l)
	}
	if logs == nil {
		logs = []AuditLogEntry{}
	}
	writeJSON(w, http.StatusOK, logs)
}
