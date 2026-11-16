package security

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"

	"cloudops-sentinel/internal/cloud"
	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

type Scan struct {
	ID           int    `json:"id"`
	DeploymentID int    `json:"deployment_id"`
	ScanType     string `json:"scan_type"`
	Status       string `json:"status"`
	Summary      string `json:"summary"`
	CreatedAt    string `json:"created_at"`
}

type Vulnerability struct {
	ID             int    `json:"id"`
	SecurityScanID int    `json:"security_scan_id"`
	Severity       string `json:"severity"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Remediation    string `json:"remediation"`
}

func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}

// mock vulnerability data for realistic simulation
var mockVulns = []struct {
	Severity    string
	Title       string
	Description string
	Remediation string
}{
	{"critical", "CVE-2024-3094: xz utils backdoor", "Malicious code in xz 5.6.0-5.6.1 allows remote code execution", "Downgrade xz to 5.4.x or upgrade to 5.6.2+"},
	{"high", "CVE-2024-21626: runc container breakout", "Process.cwd and leaked fds allow host filesystem access", "Upgrade runc to v1.1.12+"},
	{"high", "CVE-2023-44487: HTTP/2 Rapid Reset", "HTTP/2 protocol vulnerability enabling DDoS", "Update web server and HTTP/2 libraries"},
	{"medium", "CVE-2023-39325: Go net/http DoS", "Excessive resource consumption via HTTP/2", "Upgrade Go to 1.21.3+"},
	{"medium", "Hardcoded credentials detected", "Database password found in configuration file", "Use environment variables or secrets manager"},
	{"low", "Outdated base image", "Alpine 3.18 is no longer receiving security updates", "Upgrade to Alpine 3.19+"},
	{"low", "Missing security headers", "X-Content-Type-Options header not set", "Add X-Content-Type-Options: nosniff header"},
}

func TriggerScan(w http.ResponseWriter, r *http.Request) {
	did, _ := strconv.Atoi(mux.Vars(r)["deploymentId"])

	// Create scan record
	var scanID int
	err := db.DB.QueryRow(
		"INSERT INTO security_scans (deployment_id, scan_type, status, summary) VALUES ($1, 'full', 'completed', '') RETURNING id", did,
	).Scan(&scanID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Generate random subset of mock vulnerabilities
	critical, high, medium, low := 0, 0, 0, 0
	numVulns := rand.Intn(5) + 2 // 2-6 vulnerabilities
	used := make(map[int]bool)

	for i := 0; i < numVulns && i < len(mockVulns); i++ {
		idx := rand.Intn(len(mockVulns))
		if used[idx] {
			continue
		}
		used[idx] = true
		v := mockVulns[idx]
		db.DB.Exec(
			"INSERT INTO vulnerabilities (security_scan_id, severity, title, description, remediation) VALUES ($1,$2,$3,$4,$5)",
			scanID, v.Severity, v.Title, v.Description, v.Remediation,
		)
		switch v.Severity {
		case "critical":
			critical++
		case "high":
			high++
		case "medium":
			medium++
		case "low":
			low++
		}
	}

	summary := "Scan complete. "
	if critical > 0 {
		summary += "CRITICAL vulnerabilities found. "
	}
	summary += strconv.Itoa(critical) + " critical, " + strconv.Itoa(high) + " high, " + strconv.Itoa(medium) + " medium, " + strconv.Itoa(low) + " low."
	db.DB.Exec("UPDATE security_scans SET summary=$1 WHERE id=$2", summary, scanID)

	// Persist scan report into AWS S3 (or cost-free local fallback) and publish CloudWatch metric
	if cloud.GlobalAWS != nil {
		reportPayload := fmt.Sprintf(`{"scan_id":%d,"deployment_id":%d,"critical":%d,"high":%d,"medium":%d,"low":%d,"summary":"%s"}`,
			scanID, did, critical, high, medium, low, summary)
		cloud.GlobalAWS.PutArtifact(context.Background(), "cloudops-sentinel-reports", fmt.Sprintf("scans/scan_%d.json", scanID), []byte(reportPayload), "application/json")
		cloud.GlobalAWS.PutMetric(context.Background(), "CloudOps/Security", "VulnerabilitiesDetected", float64(critical+high), "Count")
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"scan_id":  scanID,
		"status":   "completed",
		"summary":  summary,
		"critical": critical,
		"high":     high,
		"medium":   medium,
		"low":      low,
	})
}

func GetScans(w http.ResponseWriter, r *http.Request) {
	did, _ := strconv.Atoi(mux.Vars(r)["deploymentId"])
	rows, err := db.DB.Query(
		"SELECT id, deployment_id, scan_type, status, summary, created_at FROM security_scans WHERE deployment_id=$1 ORDER BY created_at DESC", did)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var scans []Scan
	for rows.Next() {
		var s Scan
		rows.Scan(&s.ID, &s.DeploymentID, &s.ScanType, &s.Status, &s.Summary, &s.CreatedAt)
		scans = append(scans, s)
	}
	if scans == nil {
		scans = []Scan{}
	}
	writeJSON(w, http.StatusOK, scans)
}

func GetScan(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var s Scan
	err := db.DB.QueryRow(
		"SELECT id, deployment_id, scan_type, status, summary, created_at FROM security_scans WHERE id=$1", id,
	).Scan(&s.ID, &s.DeploymentID, &s.ScanType, &s.Status, &s.Summary, &s.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "scan not found")
		return
	}

	// Include vulnerabilities
	rows, _ := db.DB.Query(
		"SELECT id, security_scan_id, severity, title, description, remediation FROM vulnerabilities WHERE security_scan_id=$1", id)
	defer rows.Close()
	var vulns []Vulnerability
	for rows.Next() {
		var v Vulnerability
		rows.Scan(&v.ID, &v.SecurityScanID, &v.Severity, &v.Title, &v.Description, &v.Remediation)
		vulns = append(vulns, v)
	}
	if vulns == nil {
		vulns = []Vulnerability{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"scan":            s,
		"vulnerabilities": vulns,
	})
}

func GetScanGate(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var critCount int
	db.DB.QueryRow(
		"SELECT COUNT(*) FROM vulnerabilities WHERE security_scan_id=$1 AND severity='critical'", id,
	).Scan(&critCount)

	passed := critCount == 0
	status := "PASSED"
	if !passed {
		status = "FAILED"
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"scan_id":              id,
		"gate_status":          status,
		"passed":               passed,
		"critical_count":       critCount,
		"blocking_policy":      "No critical vulnerabilities allowed in production deployments",
	})
}
