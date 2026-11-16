package infra

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

// ============================================================================
// [ZERO CLOUD COST GUARANTEE - LOCAL SIMULATION MODE ACTIVE]
// ============================================================================
// Running this platform does NOT connect to AWS, does NOT provision real cloud
// resources, and does NOT incur any monetary costs.
//
// In production cloud environments, Terraform CLI commands or the AWS SDK
// would be executed as follows (kept commented out for local evaluation):
//
// /*
// func ExecuteRealTerraformApply(stackDir string) (string, error) {
//     cmd := exec.Command("terraform", "apply", "-auto-approve")
//     cmd.Dir = stackDir
//     out, err := cmd.CombinedOutput()
//     return string(out), err
// }
// */
// ============================================================================

type Stack struct {
	ID            int     `json:"id"`
	ProjectID     int     `json:"project_id"`
	EnvironmentID int     `json:"environment_id"`
	Name          string  `json:"name"`
	Provider      string  `json:"provider"`
	Status        string  `json:"status"`
	LastAppliedAt *string `json:"last_applied_at"`
	CreatedAt     string  `json:"created_at"`
}

type createReq struct {
	EnvironmentID int    `json:"environment_id"`
	Name          string `json:"name"`
	Provider      string `json:"provider"`
}

func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}

func GetStacks(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(
		"SELECT id, project_id, environment_id, name, provider, status, last_applied_at, created_at FROM infrastructure_stacks WHERE project_id=$1 ORDER BY created_at DESC", pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var stacks []Stack
	for rows.Next() {
		var s Stack
		rows.Scan(&s.ID, &s.ProjectID, &s.EnvironmentID, &s.Name, &s.Provider, &s.Status, &s.LastAppliedAt, &s.CreatedAt)
		stacks = append(stacks, s)
	}
	if stacks == nil {
		stacks = []Stack{}
	}
	writeJSON(w, http.StatusOK, stacks)
}

func CreateStack(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	var req createReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if req.Provider == "" {
		req.Provider = "terraform"
	}
	var id int
	err := db.DB.QueryRow(
		"INSERT INTO infrastructure_stacks (project_id, environment_id, name, provider) VALUES ($1,$2,$3,$4) RETURNING id",
		pid, req.EnvironmentID, req.Name, req.Provider,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

func GetStack(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var s Stack
	err := db.DB.QueryRow(
		"SELECT id, project_id, environment_id, name, provider, status, last_applied_at, created_at FROM infrastructure_stacks WHERE id=$1", id,
	).Scan(&s.ID, &s.ProjectID, &s.EnvironmentID, &s.Name, &s.Provider, &s.Status, &s.LastAppliedAt, &s.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "stack not found")
		return
	}
	writeJSON(w, http.StatusOK, s)
}

func PlanStack(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	db.DB.Exec("UPDATE infrastructure_stacks SET status='planning' WHERE id=$1", id)

	// Simulate terraform plan output
	plan := map[string]interface{}{
		"stack_id": id,
		"status":   "plan_complete",
		"changes": map[string]interface{}{
			"add":     3,
			"change":  1,
			"destroy": 0,
		},
		"resources": []map[string]string{
			{"action": "create", "resource": "aws_vpc.main", "name": "main-vpc"},
			{"action": "create", "resource": "aws_subnet.public", "name": "public-subnet-1"},
			{"action": "create", "resource": "aws_subnet.private", "name": "private-subnet-1"},
			{"action": "update", "resource": "aws_security_group.default", "name": "default-sg"},
		},
		"plan_output": fmt.Sprintf("Plan: 3 to add, 1 to change, 0 to destroy.\nPlanned at %s", time.Now().Format(time.RFC3339)),
	}

	db.DB.Exec("UPDATE infrastructure_stacks SET status='planned' WHERE id=$1", id)
	writeJSON(w, http.StatusOK, plan)
}

func ApplyStack(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	db.DB.Exec("UPDATE infrastructure_stacks SET status='applying' WHERE id=$1", id)

	// Simulate apply
	now := time.Now().Format(time.RFC3339)
	db.DB.Exec("UPDATE infrastructure_stacks SET status='applied', last_applied_at=$1 WHERE id=$2", now, id)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"stack_id":   id,
		"status":     "applied",
		"applied_at": now,
		"message":    "Apply complete! Resources: 3 added, 1 changed, 0 destroyed.",
	})
}
