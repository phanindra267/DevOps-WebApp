package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"

	"cloudops-sentinel/internal/auth"
	"cloudops-sentinel/internal/cloud"
	"cloudops-sentinel/internal/cost"
	"cloudops-sentinel/internal/db"
	"cloudops-sentinel/internal/deployment"
	"cloudops-sentinel/internal/environment"
	"cloudops-sentinel/internal/governance"
	"cloudops-sentinel/internal/infra"
	"cloudops-sentinel/internal/middleware"
	"cloudops-sentinel/internal/monitor"
	"cloudops-sentinel/internal/pipeline"
	"cloudops-sentinel/internal/project"
	"cloudops-sentinel/internal/reliability"
	"cloudops-sentinel/internal/security"
	"cloudops-sentinel/internal/syllabus"
)

// writeGuard restricts state-changing endpoints to roles allowed to write.
// It is applied to every POST/PUT/DELETE route on the authenticated subrouter
// so a viewer token can read but cannot mutate platform state.
func writeGuard(next http.HandlerFunc) http.Handler {
	return auth.RequireMutate()(next)
}

func main() {
	// ── Database ────────────────────────────────────────────────────────────
	if err := db.Init(); err != nil {
		log.Fatalf("database init failed: %v", err)
	}

	// ── AWS Cloud Free-Tier Manager ──────────────────────────────────────────
	cloud.InitAWS()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := mux.NewRouter()

	// ── Public endpoints ────────────────────────────────────────────────────
	router.HandleFunc("/api/v1/login", auth.Login).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/v1/register", auth.Register).Methods(http.MethodPost, http.MethodOptions)
	router.HandleFunc("/api/v1/health", monitor.HealthCheck).Methods(http.MethodGet)
	router.Handle("/metrics", monitor.MetricsHandler())

	// Syllabus & INT 378 Academic Public / Demo routes
	router.HandleFunc("/api/v1/syllabus/overview", syllabus.GetSyllabusOverview).Methods(http.MethodGet)
	router.HandleFunc("/api/v1/syllabus/case-studies", syllabus.GetCaseStudies).Methods(http.MethodGet)
	router.HandleFunc("/api/v1/syllabus/twelve-factor", syllabus.GetTwelveFactorScorecard).Methods(http.MethodGet)
	router.HandleFunc("/api/v1/syllabus/ab-test", syllabus.GetABTest).Methods(http.MethodGet)
	// NOTE: the mutating /syllabus/ab-test/split route is defined only on the
	// authenticated subrouter below (it must never be public).

	// ── Protected endpoints ─────────────────────────────────────────────────
	api := router.PathPrefix("/api/v1").Subrouter()
	api.Use(auth.Middleware)

	// Auth
	api.HandleFunc("/me", auth.GetMe).Methods(http.MethodGet)

	// Projects
	api.HandleFunc("/projects", project.GetProjects).Methods(http.MethodGet)
	api.Handle("/projects", writeGuard(project.CreateProject)).Methods(http.MethodPost)
	api.HandleFunc("/projects/{id:[0-9]+}", project.GetProject).Methods(http.MethodGet)
	api.Handle("/projects/{id:[0-9]+}", writeGuard(project.UpdateProject)).Methods(http.MethodPut)
	api.Handle("/projects/{id:[0-9]+}", writeGuard(project.DeleteProject)).Methods(http.MethodDelete)

	// Environments
	api.HandleFunc("/projects/{projectId:[0-9]+}/environments", environment.GetEnvironments).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/environments", writeGuard(environment.CreateEnvironment)).Methods(http.MethodPost)
	api.HandleFunc("/environments/{id:[0-9]+}", environment.GetEnvironment).Methods(http.MethodGet)
	api.Handle("/environments/{id:[0-9]+}", writeGuard(environment.UpdateEnvironment)).Methods(http.MethodPut)
	api.Handle("/environments/{id:[0-9]+}", writeGuard(environment.DeleteEnvironment)).Methods(http.MethodDelete)

	// Infrastructure Stacks
	api.HandleFunc("/projects/{projectId:[0-9]+}/stacks", infra.GetStacks).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/stacks", writeGuard(infra.CreateStack)).Methods(http.MethodPost)
	api.HandleFunc("/stacks/{id:[0-9]+}", infra.GetStack).Methods(http.MethodGet)
	api.Handle("/stacks/{id:[0-9]+}/plan", writeGuard(infra.PlanStack)).Methods(http.MethodPost)
	api.Handle("/stacks/{id:[0-9]+}/apply", writeGuard(infra.ApplyStack)).Methods(http.MethodPost)

	// Deployments
	api.HandleFunc("/projects/{projectId:[0-9]+}/deployments", deployment.GetDeployments).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/deployments", writeGuard(deployment.CreateDeployment)).Methods(http.MethodPost)
	api.HandleFunc("/deployments/{id:[0-9]+}", deployment.GetDeployment).Methods(http.MethodGet)
	api.HandleFunc("/deployments/{id:[0-9]+}/status", deployment.GetDeploymentStatus).Methods(http.MethodGet)
	api.Handle("/deployments/{id:[0-9]+}/rollback", writeGuard(deployment.RollbackDeployment)).Methods(http.MethodPost)

	// Pipelines & Jenkins CI/CD
	api.HandleFunc("/projects/{projectId:[0-9]+}/pipelines", pipeline.GetPipelines).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/pipelines", writeGuard(pipeline.TriggerPipeline)).Methods(http.MethodPost)
	api.HandleFunc("/pipelines/{id:[0-9]+}", pipeline.GetPipeline).Methods(http.MethodGet)
	api.HandleFunc("/jenkins/status", pipeline.GetJenkinsStatus).Methods(http.MethodGet)

	// Security
	api.Handle("/deployments/{deploymentId:[0-9]+}/scan", writeGuard(security.TriggerScan)).Methods(http.MethodPost)
	api.HandleFunc("/deployments/{deploymentId:[0-9]+}/scans", security.GetScans).Methods(http.MethodGet)
	api.HandleFunc("/scans/{id:[0-9]+}", security.GetScan).Methods(http.MethodGet)
	api.HandleFunc("/scans/{id:[0-9]+}/gate", security.GetScanGate).Methods(http.MethodGet)

	// Monitoring
	api.HandleFunc("/metrics-data", monitor.GetMetrics).Methods(http.MethodGet)
	api.Handle("/metrics-data", writeGuard(monitor.RecordMetric)).Methods(http.MethodPost)
	api.HandleFunc("/alerts", monitor.GetAlerts).Methods(http.MethodGet)
	api.Handle("/alerts", writeGuard(monitor.CreateAlert)).Methods(http.MethodPost)
	api.Handle("/alerts/{id:[0-9]+}/resolve", writeGuard(monitor.ResolveAlert)).Methods(http.MethodPut)

	// Governance
	api.HandleFunc("/policies", governance.GetPolicies).Methods(http.MethodGet)
	api.Handle("/policies", writeGuard(governance.CreatePolicy)).Methods(http.MethodPost)
	api.Handle("/policies/{id:[0-9]+}", writeGuard(governance.UpdatePolicy)).Methods(http.MethodPut)
	api.Handle("/projects/{projectId:[0-9]+}/evaluate", writeGuard(governance.EvaluateCompliance)).Methods(http.MethodPost)
	api.HandleFunc("/projects/{projectId:[0-9]+}/compliance", governance.GetCompliance).Methods(http.MethodGet)
	api.HandleFunc("/audit-logs", governance.GetAuditLogs).Methods(http.MethodGet)

	// Reliability
	api.HandleFunc("/projects/{projectId:[0-9]+}/debt", reliability.GetDebt).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/debt", writeGuard(reliability.CreateDebt)).Methods(http.MethodPost)
	api.Handle("/debt/{id:[0-9]+}", writeGuard(reliability.UpdateDebt)).Methods(http.MethodPut)
	api.HandleFunc("/projects/{projectId:[0-9]+}/experiments", reliability.GetExperiments).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/experiments", writeGuard(reliability.CreateExperiment)).Methods(http.MethodPost)
	api.Handle("/experiments/{id:[0-9]+}", writeGuard(reliability.UpdateExperiment)).Methods(http.MethodPut)

	// Cost & FinOps Optimization (Local Billing Engine)
	api.HandleFunc("/costs/summary", cost.GetGlobalCostSummary).Methods(http.MethodGet)
	api.HandleFunc("/projects/{projectId:[0-9]+}/costs", cost.GetCosts).Methods(http.MethodGet)
	api.HandleFunc("/projects/{projectId:[0-9]+}/cost-recommendations", cost.GetRecommendations).Methods(http.MethodGet)
	api.Handle("/cost-recommendations/{id:[0-9]+}/apply", writeGuard(cost.ApplyRecommendation)).Methods(http.MethodPost)
	api.HandleFunc("/projects/{projectId:[0-9]+}/budget", cost.GetBudget).Methods(http.MethodGet)
	api.Handle("/projects/{projectId:[0-9]+}/budget", writeGuard(cost.SetBudget)).Methods(http.MethodPost)
	api.Handle("/projects/{projectId:[0-9]+}/simulate-billing", writeGuard(cost.SimulateBillingCycle)).Methods(http.MethodPost)

	// AWS Free-Tier & Cloud Integration
	api.HandleFunc("/aws/status", cloud.GetStatusHandler).Methods(http.MethodGet)
	api.Handle("/aws/artifacts", writeGuard(cloud.UploadArtifactHandler)).Methods(http.MethodPost)
	api.HandleFunc("/aws/artifacts", cloud.GetArtifactHandler).Methods(http.MethodGet)

	// Syllabus & Curriculum endpoints (authenticated)
	api.HandleFunc("/syllabus/overview", syllabus.GetSyllabusOverview).Methods(http.MethodGet)
	api.HandleFunc("/syllabus/case-studies", syllabus.GetCaseStudies).Methods(http.MethodGet)
	api.HandleFunc("/syllabus/twelve-factor", syllabus.GetTwelveFactorScorecard).Methods(http.MethodGet)
	api.HandleFunc("/syllabus/ab-test", syllabus.GetABTest).Methods(http.MethodGet)
	api.Handle("/syllabus/ab-test/split", writeGuard(syllabus.UpdateABSplit)).Methods(http.MethodPost)

	// ── Global middleware ───────────────────────────────────────────────────
	handler := middleware.CORS(monitor.PrometheusMiddleware(router))

	log.Printf("CloudOps Sentinel API listening on :%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
