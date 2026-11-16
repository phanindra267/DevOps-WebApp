package cost

import (
	"testing"
)

func TestCategorizeService(t *testing.T) {
	tests := []struct {
		name     string
		expected string
	}{
		{"Amazon EC2 (Compute)", "Compute"},
		{"Amazon EKS Cluster", "Compute"},
		{"Amazon RDS PostgreSQL", "Database"},
		{"Amazon EBS (gp3 Storage)", "Storage"},
		{"AWS NAT Gateway", "Networking"},
	}

	for _, tt := range tests {
		got := categorizeService(tt.name)
		if got != tt.expected {
			t.Errorf("categorizeService(%s) = %s, expected %s", tt.name, got, tt.expected)
		}
	}
}
