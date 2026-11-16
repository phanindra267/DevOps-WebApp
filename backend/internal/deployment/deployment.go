package deployment

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

type Deployment struct {
	ID            int     `json:"id"`
	ProjectID     int     `json:"project_id"`
	EnvironmentID int     `json:"environment_id"`
	ImageTag      string  `json:"image_tag"`
	Status        string  `json:"status"`
	StartedAt     *string `json:"started_at"`
	FinishedAt    *string `json:"finished_at"`
	CreatedAt     string  `json:"created_at"`
}

type createReq struct {
	EnvironmentID int    `json:"environment_id"`
	ImageTag      string `json:"image_tag"`
}

func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}

func GetDeployments(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(
		"SELECT id, project_id, environment_id, image_tag, status, started_at, finished_at, created_at FROM deployments WHERE project_id=$1 ORDER BY created_at DESC", pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var deps []Deployment
	for rows.Next() {
		var d Deployment
		rows.Scan(&d.ID, &d.ProjectID, &d.EnvironmentID, &d.ImageTag, &d.Status, &d.StartedAt, &d.FinishedAt, &d.CreatedAt)
		deps = append(deps, d)
	}
	if deps == nil {
		deps = []Deployment{}
	}
	writeJSON(w, http.StatusOK, deps)
}

func CreateDeployment(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	var req createReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.ImageTag == "" {
		writeError(w, http.StatusBadRequest, "image_tag is required")
		return
	}

	now := time.Now().Format(time.RFC3339)
	var id int
	err := db.DB.QueryRow(
		"INSERT INTO deployments (project_id, environment_id, image_tag, status, started_at) VALUES ($1,$2,$3,'running',$4) RETURNING id",
		pid, req.EnvironmentID, req.ImageTag, now,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Simulate deployment completing
	finished := time.Now().Add(2 * time.Second).Format(time.RFC3339)
	db.DB.Exec("UPDATE deployments SET status='success', finished_at=$1 WHERE id=$2", finished, id)

	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id, "status": "success"})
}

func GetDeployment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var d Deployment
	err := db.DB.QueryRow(
		"SELECT id, project_id, environment_id, image_tag, status, started_at, finished_at, created_at FROM deployments WHERE id=$1", id,
	).Scan(&d.ID, &d.ProjectID, &d.EnvironmentID, &d.ImageTag, &d.Status, &d.StartedAt, &d.FinishedAt, &d.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func RollbackDeployment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])

	// Get the deployment being rolled back
	var pid, eid int
	var imgTag string
	err := db.DB.QueryRow(
		"SELECT project_id, environment_id, image_tag FROM deployments WHERE id=$1", id,
	).Scan(&pid, &eid, &imgTag)
	if err != nil {
		writeError(w, http.StatusNotFound, "deployment not found")
		return
	}

	// Mark original as rolled-back
	db.DB.Exec("UPDATE deployments SET status='rolled_back' WHERE id=$1", id)

	// Find previous successful deployment for this env
	var prevTag string
	err = db.DB.QueryRow(
		"SELECT image_tag FROM deployments WHERE project_id=$1 AND environment_id=$2 AND status='success' AND id < $3 ORDER BY id DESC LIMIT 1",
		pid, eid, id,
	).Scan(&prevTag)
	if err != nil {
		prevTag = imgTag + "-rollback"
	}

	// Create new deployment with previous tag
	now := time.Now().Format(time.RFC3339)
	var newID int
	db.DB.QueryRow(
		"INSERT INTO deployments (project_id, environment_id, image_tag, status, started_at, finished_at) VALUES ($1,$2,$3,'success',$4,$4) RETURNING id",
		pid, eid, prevTag, now,
	).Scan(&newID)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":           "rollback successful",
		"rolled_back_id":    id,
		"new_deployment_id": newID,
		"image_tag":         prevTag,
	})
}

func GetDeploymentStatus(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var status string
	err := db.DB.QueryRow("SELECT status FROM deployments WHERE id=$1", id).Scan(&status)
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"id": mux.Vars(r)["id"], "status": status})
}
