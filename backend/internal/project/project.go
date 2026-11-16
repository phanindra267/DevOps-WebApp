package project

import (
	"encoding/json"
	"net/http"
	"strconv"

	"cloudops-sentinel/internal/auth"
	"cloudops-sentinel/internal/db"

	"github.com/gorilla/mux"
)

type Project struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	OwnerID     int    `json:"owner_id"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
}

type createReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// GetProjects lists all projects.
func GetProjects(w http.ResponseWriter, r *http.Request) {
	rows, err := db.DB.Query("SELECT id, name, description, owner_id, created_at, updated_at FROM projects ORDER BY created_at DESC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var projects []Project
	for rows.Next() {
		var p Project
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt, &p.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		projects = append(projects, p)
	}
	if projects == nil {
		projects = []Project{}
	}
	writeJSON(w, http.StatusOK, projects)
}

// CreateProject creates a new project.
func CreateProject(w http.ResponseWriter, r *http.Request) {
	var req createReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}

	// Get owner from JWT
	ownerID := 0
	if claims, ok := auth.FromContext(r.Context()); ok {
		var uid int
		db.DB.QueryRow("SELECT id FROM users WHERE username=$1", claims.UserID).Scan(&uid)
		ownerID = uid
	}

	var id int
	err := db.DB.QueryRow(
		"INSERT INTO projects (name, description, owner_id) VALUES ($1,$2,$3) RETURNING id",
		req.Name, req.Description, ownerID,
	).Scan(&id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id, "name": req.Name})
}

// GetProject returns a single project.
func GetProject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var p Project
	err := db.DB.QueryRow(
		"SELECT id, name, description, owner_id, created_at, updated_at FROM projects WHERE id=$1", id,
	).Scan(&p.ID, &p.Name, &p.Description, &p.OwnerID, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, p)
}

// UpdateProject updates a project.
func UpdateProject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var req createReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	_, err := db.DB.Exec(
		"UPDATE projects SET name=$1, description=$2, updated_at=NOW() WHERE id=$3",
		req.Name, req.Description, id,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "updated"})
}

// DeleteProject deletes a project.
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	_, err := db.DB.Exec("DELETE FROM projects WHERE id=$1", id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
