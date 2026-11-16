package monitor

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

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

// ── Metrics ─────────────────────────────────────────────────────────────────

type MetricRecord struct {
	ID         int     `json:"id"`
	Source     string  `json:"source"`
	Name       string  `json:"name"`
	Value      float64 `json:"value"`
	Labels     string  `json:"labels"`
	RecordedAt string  `json:"recorded_at"`
}

type metricReq struct {
	Source string  `json:"source"`
	Name   string  `json:"name"`
	Value  float64 `json:"value"`
	Labels string  `json:"labels"`
}

func GetMetrics(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(
		"SELECT id, source, name, value, labels, recorded_at FROM metric_records ORDER BY recorded_at DESC LIMIT 100")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var metrics []MetricRecord
	for rows.Next() {
		var m MetricRecord
		rows.Scan(&m.ID, &m.Source, &m.Name, &m.Value, &m.Labels, &m.RecordedAt)
		metrics = append(metrics, m)
	}
	if metrics == nil {
		metrics = []MetricRecord{}
	}
	writeJSON(w, http.StatusOK, metrics)
}

func RecordMetric(w http.ResponseWriter, r *http.Request) {
	var req metricReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.Name == "" || req.Source == "" {
		writeError(w, http.StatusBadRequest, "source and name required")
		return
	}
	var id int
	db.DB.QueryRow(
		"INSERT INTO metric_records (source, name, value, labels) VALUES ($1,$2,$3,$4) RETURNING id",
		req.Source, req.Name, req.Value, req.Labels,
	).Scan(&id)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

// ── Alerts ──────────────────────────────────────────────────────────────────

type AlertRecord struct {
	ID         int     `json:"id"`
	Name       string  `json:"name"`
	Severity   string  `json:"severity"`
	Status     string  `json:"status"`
	Message    string  `json:"message"`
	FiredAt    string  `json:"fired_at"`
	ResolvedAt *string `json:"resolved_at"`
}

type alertReq struct {
	Name     string `json:"name"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
}

func GetAlerts(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query(
		"SELECT id, name, severity, status, message, fired_at, resolved_at FROM alert_records ORDER BY fired_at DESC LIMIT 100")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var alerts []AlertRecord
	for rows.Next() {
		var a AlertRecord
		rows.Scan(&a.ID, &a.Name, &a.Severity, &a.Status, &a.Message, &a.FiredAt, &a.ResolvedAt)
		alerts = append(alerts, a)
	}
	if alerts == nil {
		alerts = []AlertRecord{}
	}
	writeJSON(w, http.StatusOK, alerts)
}

func CreateAlert(w http.ResponseWriter, r *http.Request) {
	var req alertReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if req.Severity == "" {
		req.Severity = "warning"
	}
	var id int
	db.DB.QueryRow(
		"INSERT INTO alert_records (name, severity, message) VALUES ($1,$2,$3) RETURNING id",
		req.Name, req.Severity, req.Message,
	).Scan(&id)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

func ResolveAlert(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	now := time.Now().Format(time.RFC3339)
	db.DB.Exec("UPDATE alert_records SET status='resolved', resolved_at=$1 WHERE id=$2", now, id)
	writeJSON(w, http.StatusOK, map[string]string{"message": "alert resolved"})
}

// ── Health Check ────────────────────────────────────────────────────────────

func HealthCheck(w http.ResponseWriter, r *http.Request) {
	dbOK := true
	if err := db.DB.Ping(); err != nil {
		dbOK = false
	}

	status := "healthy"
	httpStatus := http.StatusOK
	if !dbOK {
		status = "unhealthy"
		httpStatus = http.StatusServiceUnavailable
	}

	writeJSON(w, httpStatus, map[string]interface{}{
		"status":    status,
		"database":  dbOK,
		"timestamp": time.Now().Format(time.RFC3339),
		"version":   "0.1.0",
	})
}
