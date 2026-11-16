package syllabus

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestGetSyllabusOverview(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/syllabus/overview", nil)
	rec := httptest.NewRecorder()

	GetSyllabusOverview(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var data map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &data); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	units, ok := data["units"].([]interface{})
	if !ok || len(units) != 6 {
		t.Fatalf("expected 6 units in overview, got %d", len(units))
	}
}

func TestGetCaseStudies(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/syllabus/case-studies", nil)
	rec := httptest.NewRecorder()

	GetCaseStudies(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}
}

func TestGetTwelveFactorScorecard(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/syllabus/twelve-factor", nil)
	rec := httptest.NewRecorder()

	GetTwelveFactorScorecard(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}
}

func TestABTestingHandlers(t *testing.T) {
	// 1. Get AB test
	req := httptest.NewRequest(http.MethodGet, "/api/v1/syllabus/ab-test", nil)
	rec := httptest.NewRecorder()
	GetABTest(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	// 2. Update split
	payload, _ := json.Marshal(map[string]int{"split_ratio_b": 30})
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/syllabus/ab-test/split", bytes.NewBuffer(payload))
	rec2 := httptest.NewRecorder()
	UpdateABSplit(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec2.Code)
	}

	var state ABTestState
	json.Unmarshal(rec2.Body.Bytes(), &state)
	if state.SplitRatioB != 30 || state.SplitRatioA != 70 {
		t.Fatalf("expected 70/30 split, got %d/%d", state.SplitRatioA, state.SplitRatioB)
	}
}
