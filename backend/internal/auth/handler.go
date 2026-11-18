package auth

import (
	"encoding/json"
	"net/http"

	"cloudops-sentinel/internal/db"

	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type registerRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type tokenResponse struct {
	Token string `json:"token"`
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// Login authenticates a user and returns a JWT.
func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var id int
	var hash, role string
	err := db.DB.QueryRow(
		"SELECT id, password_hash, role FROM users WHERE username=$1", req.Username,
	).Scan(&id, &hash, &role)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, err := GenerateToken(req.Username, role)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "token generation failed")
		return
	}
	writeJSON(w, http.StatusOK, tokenResponse{Token: token})
}

// Register creates a new user account.
func Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Username == "" || req.Email == "" || req.Password == "" {
		writeError(w, http.StatusBadRequest, "username, email, and password are required")
		return
	}
	// Public registration is always least-privilege: a caller cannot grant
	// itself admin/editor by supplying a "role" field in the request.
	req.Role = "viewer"

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "password hashing failed")
		return
	}

	_, err = db.DB.Exec(
		"INSERT INTO users (username, email, password_hash, role) VALUES ($1,$2,$3,$4)",
		req.Username, req.Email, string(hash), req.Role,
	)
	if err != nil {
		writeError(w, http.StatusConflict, "user already exists")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]string{"message": "user created"})
}

// GetMe returns the currently authenticated user's info.
func GetMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := FromContext(r.Context())
	if !ok {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{
		"username": claims.UserID,
		"role":     claims.Role,
	})
}
