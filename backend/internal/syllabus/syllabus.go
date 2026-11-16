package syllabus

import (
	"encoding/json"
	"net/http"
	"sync"
)

func writeJSON(w http.ResponseWriter, s int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(s)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, s int, m string) {
	writeJSON(w, s, map[string]string{"error": m})
}

// ── AB Testing In-Memory State ─────────────────────────────────────────────

type ABTestState struct {
	mu           sync.RWMutex
	Experiment   string  `json:"experiment"`
	VariantA     string  `json:"variant_a"`
	VariantB     string  `json:"variant_b"`
	SplitRatioA  int     `json:"split_ratio_a"` // e.g. 80
	SplitRatioB  int     `json:"split_ratio_b"` // e.g. 20
	TotalTraffic int     `json:"total_traffic"`
	ConvRateA    float64 `json:"conv_rate_a"`
	ConvRateB    float64 `json:"conv_rate_b"`
	Status       string  `json:"status"`
}

var globalAB = &ABTestState{
	Experiment:   "EXP-2026-CANARY-01: Next-Gen Zero-Downtime Deployment Flow",
	VariantA:     "v1.4.2 (Standard Rolling)",
	VariantB:     "v2.0.0-rc1 (Blue-Green with Trivy Gate)",
	SplitRatioA:  85,
	SplitRatioB:  15,
	TotalTraffic: 14250,
	ConvRateA:    98.7,
	ConvRateB:    99.8,
	Status:       "active",
}

// ── Handlers ───────────────────────────────────────────────────────────────

func GetSyllabusOverview(w http.ResponseWriter, r *http.Request) {
	overview := map[string]interface{}{
		"course":      "INT 378: Cloud-Native DevOps, Infrastructure Automation & Observability",
		"institution": "Lovely Professional University",
		"units": []map[string]interface{}{
			{
				"unit":  "Unit I",
				"title": "Advanced Cloud Infrastructure and Services",
				"topics": []string{
					"AWS vs Azure Advanced Cloud Services comparison",
					"Resource provisioning and autoscaling optimization",
					"Containerization architecture, Docker Hub & Docker Lifecycle",
					"Scalable architecture case studies: Netflix, Amazon, Uber",
				},
				"status": "fully_implemented",
			},
			{
				"unit":  "Unit II",
				"title": "Infrastructure as Code (IaC)",
				"topics": []string{
					"IaC significance and declarative state management",
					"Modular HashiCorp Terraform (VPC, ECS)",
					"Native AWS CloudFormation templates",
					"Comparative analysis matrix (Terraform vs CloudFormation)",
					"Future trends: OpenTofu, Pulumi, Crossplane, CDK",
				},
				"status": "fully_implemented",
			},
			{
				"unit":  "Unit III",
				"title": "Agile and CI/CD Practices for Scalable Product Development",
				"topics": []string{
					"Scaling Agile frameworks (SAFe & LeSS)",
					"Test-Driven Development (TDD) and Behavior-Driven Development (BDD)",
					"13-stage Jenkins declarative CI/CD delivery pipeline",
					"A/B Testing and Canary traffic allocation",
					"Technical debt tracking and distributed team collaboration",
				},
				"status": "fully_implemented",
			},
			{
				"unit":  "Unit IV",
				"title": "Monitoring and Observability",
				"topics": []string{
					"Prometheus time-series telemetry scraping (/metrics)",
					"Actionable alerting rules (Latency, 5xx, Down)",
					"Grafana performance dashboards",
					"Four Golden Signals and advanced observability scaling (Thanos/OTel)",
				},
				"status": "fully_implemented",
			},
			{
				"unit":  "Unit V",
				"title": "DevSecOps and Cloud Security",
				"topics": []string{
					"Shift-Left security & Trivy container vulnerability scanner",
					"Blocking quality gates in CI/CD pipeline",
					"Role-Based Access Control (RBAC) & least privilege IAM",
					"Kubernetes zero-trust network policies and non-root containers",
					"Emerging trends: SLSA provenance, SBOM, Cosign signing",
				},
				"status": "fully_implemented",
			},
			{
				"unit":  "Unit VI",
				"title": "Cloud-Native Development and Optimization",
				"topics": []string{
					"Complete 12-Factor App methodology compliance scorecard",
					"Serverless vs Containerized microservice architectures (Fargate/Lambda)",
					"FinOps cloud cost optimization and rightsizing engine",
					"Policy-as-Code governance and immutable compliance audit trails",
				},
				"status": "fully_implemented",
			},
		},
	}
	writeJSON(w, http.StatusOK, overview)
}

func GetCaseStudies(w http.ResponseWriter, r *http.Request) {
	cases := []map[string]interface{}{
		{
			"company":     "Netflix",
			"logo":        "🔴",
			"focus":       "Chaos Engineering, Microservice Resiliency & Multi-Cloud Delivery",
			"description": "Netflix migrated from a monolithic DVD catalog to a globally distributed cloud architecture running tens of thousands of microservices on AWS.",
			"key_innovations": []string{
				"Simian Army & Chaos Monkey: Deliberate injection of random instance terminations in production to prove system survivability.",
				"Spinnaker Continuous Delivery: Automated canary deployments and multi-region automated rollbacks.",
				"Eureka & Zuul: Resilient client-side service discovery and edge dynamic routing gateways.",
				"Circuit Breakers: Isolating failing dependencies to prevent cascading microservice outages.",
			},
			"cloudops_sentinel_alignment": "CloudOps Sentinel implements Netflix-style Chaos experiments (pod kills, latency spikes in internal/reliability) and automated rolling zero-downtime rollbacks.",
		},
		{
			"company":     "Amazon",
			"logo":        "📦",
			"focus":       "Two-Pizza Teams, Loose Coupling & High-Availability Cloud Infrastructure",
			"description": "Amazon transformed from a monolithic bookstore architecture into independent, decentralized engineering units operating decoupled web services.",
			"key_innovations": []string{
				"Two-Pizza Team Rule: Autonomous teams owning microservices end-to-end ('You build it, you run it').",
				"Decoupled Service APIs: Strict contract boundaries without shared databases between distinct domains.",
				"Multi-AZ Infrastructure: High-availability VPC networking spanning multiple Availability Zones with automated failover.",
				"DynamoDB Single-Digit Millisecond Scale: Predictable latency at planetary scale with horizontal partitioning.",
			},
			"cloudops_sentinel_alignment": "CloudOps Sentinel implements Amazon's multi-AZ VPC architecture in Terraform & CloudFormation with strict database connection pooling and isolated workspaces.",
		},
		{
			"company":     "Uber",
			"logo":        "🚗",
			"focus":       "DOMA Architecture, Distributed Tracing & Real-Time Dynamic Dispatch",
			"description": "Uber scaled to millions of concurrent trip dispatches by evolving 4,000+ loose microservices into Domain-Oriented Microservice Architecture (DOMA).",
			"key_innovations": []string{
				"DOMA (Domain-Oriented Microservice Architecture): Grouping thousands of microservices into logical business domains and gateways.",
				"Jaeger Distributed Tracing: Open-source end-to-end tracing across RPC calls to debug microservice latency bottlenecks.",
				"Real-Time Telemetry & Geohash Dispatch: Sub-second metrics collection for surge pricing and driver-rider matching.",
				"Dynamic Workload Auto-scaling: Rapid horizontal pod elasticity responding to regional demand surges.",
			},
			"cloudops_sentinel_alignment": "CloudOps Sentinel implements Uber's observability principles using Prometheus golden signal metrics, Kubernetes HPA autoscaling, and real-time health checks.",
		},
	}
	writeJSON(w, http.StatusOK, cases)
}

func GetTwelveFactorScorecard(w http.ResponseWriter, r *http.Request) {
	factors := []map[string]interface{}{
		{"factor": "I. Codebase", "name": "One codebase tracked in revision control, many deploys", "status": "COMPLIANT", "implementation": "Single Git repository with multi-environment deployment branches and tags"},
		{"factor": "II. Dependencies", "name": "Explicitly declare and isolate dependencies", "status": "COMPLIANT", "implementation": "Go modules (go.mod/go.sum) and Node.js package-lock.json with strict lockfiles"},
		{"factor": "III. Config", "name": "Store config in the environment", "status": "COMPLIANT", "implementation": "Decoupled environment variables, Kubernetes ConfigMap and Secret manifests"},
		{"factor": "IV. Backing services", "name": "Treat backing services as attached resources", "status": "COMPLIANT", "implementation": "PostgreSQL, S3, and Prometheus connected via standard URL endpoints without code changes"},
		{"factor": "V. Build, release, run", "name": "Strictly separate build and run stages", "status": "COMPLIANT", "implementation": "Multi-stage Dockerfiles and Jenkins 13-stage CI/CD pipeline separating build from deploy"},
		{"factor": "VI. Processes", "name": "Execute the app as one or more stateless processes", "status": "COMPLIANT", "implementation": "Stateless Go REST API and Next.js frontend; persistent state solely in PostgreSQL"},
		{"factor": "VII. Port binding", "name": "Export services via port binding", "status": "COMPLIANT", "implementation": "Self-contained HTTP servers binding to :8080 (backend) and :3000 (frontend)"},
		{"factor": "VIII. Concurrency", "name": "Scale out via the process model", "status": "COMPLIANT", "implementation": "Horizontal Pod Autoscaler (HPA) scaling replicas dynamically on CPU/Memory load"},
		{"factor": "IX. Disposability", "name": "Maximize robustness with fast startup and graceful shutdown", "status": "COMPLIANT", "implementation": "Instant container startup (<2s) and SIGTERM graceful shutdown handling"},
		{"factor": "X. Dev/prod parity", "name": "Keep development, staging, and production as similar as possible", "status": "COMPLIANT", "implementation": "Identical Docker container runtime and Terraform environment modules (envs/dev and envs/prod)"},
		{"factor": "XI. Logs", "name": "Treat logs as event streams", "status": "COMPLIANT", "implementation": "All processes write structured JSON to stdout/stderr, captured by Prometheus and Jenkins"},
		{"factor": "XII. Admin processes", "name": "Run admin/management tasks as one-off processes", "status": "COMPLIANT", "implementation": "Automated database schema migrations executed at bootstrap (db.Init()) and init-db.sh"},
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"total_factors":     12,
		"compliant_factors": 12,
		"compliance_rate":   "100%",
		"scorecard":         factors,
	})
}

func GetABTest(w http.ResponseWriter, r *http.Request) {
	globalAB.mu.RLock()
	defer globalAB.mu.RUnlock()
	writeJSON(w, http.StatusOK, globalAB)
}

func UpdateABSplit(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SplitRatioB int `json:"split_ratio_b"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.SplitRatioB < 0 || req.SplitRatioB > 100 {
		writeError(w, http.StatusBadRequest, "split ratio must be between 0 and 100")
		return
	}

	globalAB.mu.Lock()
	globalAB.SplitRatioB = req.SplitRatioB
	globalAB.SplitRatioA = 100 - req.SplitRatioB
	globalAB.TotalTraffic += 50
	globalAB.mu.Unlock()

	writeJSON(w, http.StatusOK, globalAB)
}
