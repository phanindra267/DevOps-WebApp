package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGenerateAndValidateToken(t *testing.T) {
	username := "testadmin"
	role := "admin"

	tokenStr, err := GenerateToken(username, role)
	if err != nil {
		t.Fatalf("expected no error generating token, got: %v", err)
	}

	if tokenStr == "" {
		t.Fatal("expected non-empty token string")
	}
}

func TestLoadJWTSecretFromEnv(t *testing.T) {
	t.Setenv("JWT_SECRET", "env-provided-local-secret")
	got := string(loadJWTSecret())
	if got != "env-provided-local-secret" {
		t.Fatalf("expected env secret, got %q", got)
	}
}

func TestLoadJWTSecretDefault(t *testing.T) {
	t.Setenv("JWT_SECRET", "")
	got := string(loadJWTSecret())
	if got != defaultJWTSecret {
		t.Fatalf("expected local-only default secret, got %q", got)
	}
}

func TestRequireMutateRoleGate(t *testing.T) {
	okHandler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	gate := RequireMutate()(okHandler)

	tests := []struct {
		name       string
		claims     *Claims
		wantStatus int
	}{
		{name: "admin allowed", claims: &Claims{UserID: "admin", Role: "admin"}, wantStatus: http.StatusOK},
		{name: "editor allowed", claims: &Claims{UserID: "editor", Role: "editor"}, wantStatus: http.StatusOK},
		{name: "viewer denied", claims: &Claims{UserID: "viewer", Role: "viewer"}, wantStatus: http.StatusForbidden},
		{name: "unknown role denied", claims: &Claims{UserID: "guest", Role: "guest"}, wantStatus: http.StatusForbidden},
		{name: "no claims denied", claims: nil, wantStatus: http.StatusUnauthorized},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/projects", nil)
			if tt.claims != nil {
				ctx := context.WithValue(req.Context(), userKey, tt.claims)
				req = req.WithContext(ctx)
			}
			rec := httptest.NewRecorder()
			gate.ServeHTTP(rec, req)
			if rec.Code != tt.wantStatus {
				t.Fatalf("expected status %d, got %d (body: %s)", tt.wantStatus, rec.Code, rec.Body.String())
			}
		})
	}
}
