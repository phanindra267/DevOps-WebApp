package cloud

import (
	"context"
	"testing"
)

func TestAWSManager_LocalFallback(t *testing.T) {
	mgr := InitAWS()
	if mgr == nil {
		t.Fatal("expected InitAWS to return manager")
	}

	ctx := context.Background()

	// Test S3 Artifact Storage
	bucket := "cloudops-test-bucket"
	key := "artifacts/build-123.json"
	data := []byte(`{"version":"1.0.0","status":"success"}`)

	res, err := mgr.PutArtifact(ctx, bucket, key, data, "application/json")
	if err != nil {
		t.Fatalf("PutArtifact failed: %v", err)
	}
	if res.Size != int64(len(data)) {
		t.Errorf("expected size %d, got %d", len(data), res.Size)
	}

	retrieved, err := mgr.GetArtifact(ctx, bucket, key)
	if err != nil {
		t.Fatalf("GetArtifact failed: %v", err)
	}
	if string(retrieved) != string(data) {
		t.Errorf("expected %s, got %s", string(data), string(retrieved))
	}

	// Test CloudWatch Metrics
	err = mgr.PutMetric(ctx, "CloudOps/Test", "TestMetric", 42.0, "Count")
	if err != nil {
		t.Fatalf("PutMetric failed: %v", err)
	}

	// Test Status and Cost Guardrails
	status := mgr.GetStatus()
	if !status.FreeTierCompliant {
		t.Error("expected FreeTierCompliant to be true")
	}
	if !status.CostGuardrailActive {
		t.Error("expected CostGuardrailActive to be true")
	}
	if status.SimulatedStorage < 1 {
		t.Errorf("expected at least 1 simulated storage item, got %d", status.SimulatedStorage)
	}
}
