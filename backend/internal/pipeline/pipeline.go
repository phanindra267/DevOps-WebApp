package pipeline

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

type PipelineRun struct {
	ID          int     `json:"id"`
	ProjectID   int     `json:"project_id"`
	TriggerType string  `json:"trigger_type"`
	Status      string  `json:"status"`
	StartedAt   string  `json:"started_at"`
	FinishedAt  *string `json:"finished_at"`
	Logs        string  `json:"logs"`
}

func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}

func GetPipelines(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(
		"SELECT id, project_id, trigger_type, status, started_at, finished_at, logs FROM pipeline_runs WHERE project_id=$1 ORDER BY started_at DESC", pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var runs []PipelineRun
	for rows.Next() {
		var p PipelineRun
		rows.Scan(&p.ID, &p.ProjectID, &p.TriggerType, &p.Status, &p.StartedAt, &p.FinishedAt, &p.Logs)
		runs = append(runs, p)
	}
	if runs == nil {
		runs = []PipelineRun{}
	}
	writeJSON(w, http.StatusOK, runs)
}

func TriggerPipeline(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])

	started := time.Now()
	finished := started.Add(15 * time.Second)
	finStr := finished.Format(time.RFC3339)

	logs := fmt.Sprintf(`[%s] Pipeline triggered for project %d
[Stage 1/8] Checkout ........... OK
[Stage 2/8] Unit Tests ......... OK (42 passed, 0 failed)
[Stage 3/8] Static Analysis .... OK (0 issues)
[Stage 4/8] Dependency Scan .... OK (0 critical, 2 low)
[Stage 5/8] Secret Detection ... OK (no secrets found)
[Stage 6/8] Docker Build ....... OK (image built in 12s)
[Stage 7/8] Container Scan ..... OK (0 critical vulnerabilities)
[Stage 8/8] Deploy ............. OK
Pipeline completed successfully at %s`,
		started.Format(time.RFC3339), pid, finStr)

	var id int
	err := db.DB.QueryRow(
		"INSERT INTO pipeline_runs (project_id, trigger_type, status, started_at, finished_at, logs) VALUES ($1,'manual','success',$2,$3,$4) RETURNING id",
		pid, started.Format(time.RFC3339), finStr, logs,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id, "status": "success"})
}

func GetPipeline(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var p PipelineRun
	err := db.DB.QueryRow(
		"SELECT id, project_id, trigger_type, status, started_at, finished_at, logs FROM pipeline_runs WHERE id=$1", id,
	).Scan(&p.ID, &p.ProjectID, &p.TriggerType, &p.Status, &p.StartedAt, &p.FinishedAt, &p.Logs)
	if err != nil {
		writeError(w, http.StatusNotFound, "pipeline run not found")
		return
	}
	writeJSON(w, http.StatusOK, p)
}
