package environment

import (
	"encoding/json"
	"net/http"
	"strconv"

	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

type Environment struct {
	ID        int    `json:"id"`
	ProjectID int    `json:"project_id"`
	Name      string `json:"name"`
	EnvType   string `json:"env_type"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type createReq struct {
	Name    string `json:"name"`
	EnvType string `json:"env_type"`
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func GetEnvironments(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(
		"SELECT id, project_id, name, env_type, status, created_at FROM environments WHERE project_id=$1 ORDER BY created_at", pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var envs []Environment
	for rows.Next() {
		var e Environment
		rows.Scan(&e.ID, &e.ProjectID, &e.Name, &e.EnvType, &e.Status, &e.CreatedAt)
		envs = append(envs, e)
	}
	if envs == nil {
		envs = []Environment{}
	}
	writeJSON(w, http.StatusOK, envs)
}

func CreateEnvironment(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	var req createReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if req.EnvType == "" {
		req.EnvType = "dev"
	}
	var id int
	err := db.DB.QueryRow(
		"INSERT INTO environments (project_id, name, env_type) VALUES ($1,$2,$3) RETURNING id",
		pid, req.Name, req.EnvType,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

func GetEnvironment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var e Environment
	err := db.DB.QueryRow(
		"SELECT id, project_id, name, env_type, status, created_at FROM environments WHERE id=$1", id,
	).Scan(&e.ID, &e.ProjectID, &e.Name, &e.EnvType, &e.Status, &e.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	writeJSON(w, http.StatusOK, e)
}

func UpdateEnvironment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var req createReq
	json.NewDecoder(r.Body).Decode(&req)
	_, err := db.DB.Exec("UPDATE environments SET name=$1, env_type=$2 WHERE id=$3", req.Name, req.EnvType, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "updated"})
}

func DeleteEnvironment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	db.DB.Exec("DELETE FROM environments WHERE id=$1", id)
	writeJSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
