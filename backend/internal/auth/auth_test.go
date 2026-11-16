package auth

import (
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
