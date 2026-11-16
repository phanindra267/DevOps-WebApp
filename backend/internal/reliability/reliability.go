package reliability

import (
	"encoding/json"
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

// ── Technical Debt ──────────────────────────────────────────────────────────

type DebtItem struct {
	ID          int    `json:"id"`
	ProjectID   int    `json:"project_id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
}

type debtReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
}

func GetDebt(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(
		"SELECT id, project_id, title, description, priority, status, created_at FROM technical_debt_items WHERE project_id=$1 ORDER BY created_at DESC", pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var items []DebtItem
	for rows.Next() {
		var d DebtItem
		rows.Scan(&d.ID, &d.ProjectID, &d.Title, &d.Description, &d.Priority, &d.Status, &d.CreatedAt)
		items = append(items, d)
	}
	if items == nil {
		items = []DebtItem{}
	}
	writeJSON(w, http.StatusOK, items)
}

func CreateDebt(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	var req debtReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.Title == "" {
		writeError(w, http.StatusBadRequest, "title required")
		return
	}
	if req.Priority == "" {
		req.Priority = "medium"
	}
	var id int
	db.DB.QueryRow(
		"INSERT INTO technical_debt_items (project_id, title, description, priority) VALUES ($1,$2,$3,$4) RETURNING id",
		pid, req.Title, req.Description, req.Priority,
	).Scan(&id)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

func UpdateDebt(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
		Status      string `json:"status"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	db.DB.Exec(
		"UPDATE technical_debt_items SET title=$1, description=$2, priority=$3, status=$4 WHERE id=$5",
		req.Title, req.Description, req.Priority, req.Status, id,
	)
	writeJSON(w, http.StatusOK, map[string]string{"message": "updated"})
}

// ── Experiments ─────────────────────────────────────────────────────────────

type Experiment struct {
	ID          int    `json:"id"`
	ProjectID   int    `json:"project_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
}

type expReq struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func GetExperiments(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	rows, err := db.DB.Query(
		"SELECT id, project_id, name, description, status, created_at FROM experiments WHERE project_id=$1 ORDER BY created_at DESC", pid)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()
	var exps []Experiment
	for rows.Next() {
		var e Experiment
		rows.Scan(&e.ID, &e.ProjectID, &e.Name, &e.Description, &e.Status, &e.CreatedAt)
		exps = append(exps, e)
	}
	if exps == nil {
		exps = []Experiment{}
	}
	writeJSON(w, http.StatusOK, exps)
}

func CreateExperiment(w http.ResponseWriter, r *http.Request) {
	pid, _ := strconv.Atoi(mux.Vars(r)["projectId"])
	var req expReq
	json.NewDecoder(r.Body).Decode(&req)
	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "name required")
		return
	}
	var id int
	db.DB.QueryRow(
		"INSERT INTO experiments (project_id, name, description) VALUES ($1,$2,$3) RETURNING id",
		pid, req.Name, req.Description,
	).Scan(&id)
	writeJSON(w, http.StatusCreated, map[string]interface{}{"id": id})
}

func UpdateExperiment(w http.ResponseWriter, r *http.Request) {
	id, _ := strconv.Atoi(mux.Vars(r)["id"])
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Status      string `json:"status"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	db.DB.Exec(
		"UPDATE experiments SET name=$1, description=$2, status=$3 WHERE id=$4",
		req.Name, req.Description, req.Status, id,
	)
	writeJSON(w, http.StatusOK, map[string]string{"message": "updated"})
}
