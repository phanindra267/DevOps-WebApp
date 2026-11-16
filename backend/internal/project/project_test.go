package project

import (
	"testing"
)

func TestProjectModelStructure(t *testing.T) {
	p := Project{
		ID:          1,
		Name:        "Test Project",
		Description: "A unit test project",
		OwnerID:     10,
	}

	if p.Name != "Test Project" {
		t.Fatalf("expected name 'Test Project', got '%s'", p.Name)
	}

	if p.OwnerID != 10 {
		t.Fatalf("expected owner ID 10, got %d", p.OwnerID)
	}
}
