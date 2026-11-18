# CloudOps Sentinel — Complete In-Depth Presentation & Viva Explanation

> **INT 378 — Advanced Cloud Infrastructure, DevSecOps & FinOps (Session 2026–27)**
> Candidate: Kakumani Phaneendra · Reg 12418953 · Sec K202313 · Lovely Professional University
>
> This document is a **complete, depth-first explanation** of every component, module, feature,
> workflow, and important concept in the project. It is written to be *presented from*, not just
> skimmed. It deliberately includes the honest caveats and the "what actually ran vs. what is a
> reference artifact" distinction, because that honesty is the project's strongest defense point.
>
> **How to use it:** Read §1–§3 to set the stage, then §4 (backend), §5 (frontend), §6–§13 (ops
> layers), then §14 (concepts), §15 (worked workflows), §16 (limitations), and finally §17 which is a
> ready-to-speak 12–15 minute presentation script. §18 is a quick-reference cheat sheet.

---

## Table of Contents

1. [Executive Overview — The Problem, The Vision, The Lifecycle](#1-executive-overview)
2. [The One-Sentence Thesis and the "Local-First" Guarantee](#2-the-one-sentence-thesis-and-the-local-first-guarantee)
3. [Big-Picture Architecture — Layers, Ports, and Request Flow](#3-big-picture-architecture)
4. [Technology Stack and Version Reality](#4-technology-stack-and-version-reality)
5. [Backend Deep Dive — The Go Modular Monolith](#5-backend-deep-dive)
6. [Frontend Deep Dive — The Next.js Dashboard](#6-frontend-deep-dive)
7. [Infrastructure as Code — Terraform & CloudFormation](#7-infrastructure-as-code)
8. [Kubernetes Manifests — Declarative Production Topology](#8-kubernetes-manifests)
9. [CI/CD — Jenkins Pipeline (Designed vs. Actually Run)](#9-cicd-jenkins-pipeline)
10. [Monitoring & Observability — Prometheus, Grafana, Golden Signals](#10-monitoring--observability)
11. [Security — DevSecOps, Trivy, IAM/MFA/RBAC, Zero Trust](#11-security)
12. [Serverless & FinOps — Lambda Runtime and Cost Simulator](#12-serverless--finops)
13. [Automation Scripts, E2E Test, and Evidence](#13-automation-scripts-e2e-test-and-evidence)
14. [Core Concepts Explained in Depth](#14-core-concepts-explained-in-depth)
15. [Worked End-to-End Workflows (Narratives You Can Tell)](#15-worked-end-to-end-workflows)
16. [Syllabus Mapping (Units I–VI) and the Three Presentations](#16-syllabus-mapping-and-presentations)
17. [Honest Limitations, Consistency Caveats & Likely Viva Questions](#17-honest-limitations-and-viva-questions)
18. [A Ready-to-Speak 12–15 Minute Presentation Script](#18-presentation-script)
19. [Quick Reference Cheat Sheet](#19-quick-reference-cheat-sheet)

---

## 1. Executive Overview

### The industry problem (how you open your talk)

Modern cloud delivery normally uses a **fragmented toolchain**: a team writes infrastructure with
Terraform, builds images with Docker, runs a Jenkins pipeline, scans with Trivy, watches with
Prometheus/Grafana, and tracks cost in a billing console. Each tool solves one slice, but the
integration gaps create four recurring failures:

1. **Tool silos** — no single view of the whole lifecycle, so status is stitched together manually.
2. **Shift-right security** — vulnerabilities are found *after* deployment, when fixes are expensive.
   (Fixing a CVE in production can cost 10–100× more than fixing it at commit time.)
3. **Configuration drift** — the running infrastructure slowly diverges from its declared state.
4. **Runaway cost** — nobody connects a resource decision to its monthly bill until the invoice arrives.

### The solution (what CloudOps Sentinel is)

**CloudOps Sentinel** is a single, integrated control plane that governs the complete cloud-native
software lifecycle:

```
Plan → Commit → Test → DevSecOps → Build → IaC → Deploy → Observe → Recover → Govern
```

It unifies:
- **Infrastructure as Code** (Terraform HCL + AWS CloudFormation YAML),
- **Containerized workloads** (Docker + Kubernetes),
- **CI/CD** (Jenkins),
- **Security gates** (Trivy vulnerability scanning + Policy-as-Code),
- **Observability** (Prometheus + Grafana + the Four Golden Signals),
- **Failure recovery** (rollback + chaos experiments),
- **Compliance** (governance policies + immutable audit trail), and
- **FinOps** (cost estimation, budgets, rightsizing)

...into **one modern web dashboard** with a Go REST API and PostgreSQL backend.

The academic hook: the project is explicitly engineered to demonstrate **all six units of the INT 378
syllabus**, with an interactive `/syllabus` "Curriculum Hub" that proves each mapping live.

---

## 2. The One-Sentence Thesis and the "Local-First" Guarantee

### The thesis to memorize

> *"CloudOps Sentinel is a locally executable, zero-cloud-cost DevSecOps control plane: a Next.js
> dashboard talking to a Go modular-monolith REST API that orchestrates ten domain engines over
> PostgreSQL, with every 'cloud' service represented by a genuine open-source local equivalent."*

### The local-first guarantee (your most important differentiator)

The system **runs entirely on the developer's machine**. No AWS account, credentials, paid API, or
external AI service is used in the execution path. Every AWS concept is mapped to a real local
equivalent, and the mapping is stated explicitly in the code, docs, and evidence:

| AWS / Cloud concept | Local, real, executable equivalent |
|---|---|
| EC2 instance | Docker container (`tf-local-webserver`) |
| VPC / subnet | Docker bridge networks (`tf-local-public`, `tf-local-private`) |
| Security group | Network segmentation between those networks |
| Elastic IP / public IP | Host port mapping (`8088 → 80`) |
| EBS volume | Named Docker volume (`tf-local-webdata`) |
| Docker Hub / ECR | Local `registry:2` on port 5000 |
| CloudWatch metrics | Prometheus 2.51 + Node Exporter + cAdvisor |
| CloudWatch dashboards | Grafana 10.4.1 on port 3001 |
| Lambda / API Gateway | Node local runtime (`serverless/local-runtime.js`) |
| Cost Explorer | Offline FinOps model (`local_cost_simulator.js`) |
| IAM MFA / STS AssumeRole | Python stdlib RFC 6238 TOTP simulator |
| Jenkins on EC2 | Jenkins container on port 8085 |

This matters because a viva examiner can ask "show me it works" — and you can run the entire stack
with `docker compose up -d --build` with **zero billing risk**.

---

## 3. Big-Picture Architecture

### Three tiers (draw this on the board)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ TIER 1 — PRESENTATION          Next.js 14 dashboard        :3000             │
│ 11 pages · Axios client · JWT in localStorage · Recharts · Framer Motion    │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │  same-origin /api/* → Next.js rewrite
                                │  → http://backend:8080 (service name on Compose net)
┌───────────────────────────────▼──────────────────────────────────────────────┐
│ TIER 2 — APPLICATION           Go 1.24 modular monolith    :8080             │
│ gorilla/mux router · CORS → Prometheus middleware → JWT auth → RBAC gate    │
│ 12 domain packages ("engines"): auth, project, environment, infra,          │
│ deployment, pipeline, security, monitor, governance, reliability, cost,     │
│ cloud, syllabus                                                             │
└──────────┬───────────────────────────────────┬───────────────────────────────┘
           │ database/sql + lib/pq (pool)      │ HTTP / SDK
┌──────────▼───────────────┐   ┌───────────────▼──────────────┐  ┌──────────────┐
│ TIER 3 — STATE & OBSERVE │   │ Prometheus :9090  +  Grafana │  │ Jenkins :8085│
│ PostgreSQL 16 :5432      │   │ :3001 · Node Exporter :9100  │  │ registry :5000│
│ 18–19 tables, migrations │   │ cAdvisor :8087 · alert rules │  │ Terraform    │
└──────────────────────────┘   └──────────────────────────────┘  └──────────────┘
```

### The middleware chain — a request's journey (explain this precisely)

In `backend/cmd/server/main.go`, the final handler is:

```go
handler := middleware.CORS(monitor.PrometheusMiddleware(router))
```

So every HTTP request passes through, in order:

1. **CORS middleware** — sets `Access-Control-Allow-Origin: *`, allowed methods/headers, and
   short-circuits `OPTIONS` preflight requests with `200`. This is what lets a browser on port 3000
   talk to the API (needed because Next.js proxies, but also safe for local dev).
2. **Prometheus middleware** — starts a timer, wraps the `ResponseWriter` in a `statusWriter` that
   captures the HTTP status code, and on completion increments `http_requests_total{method,path,status}`
   and observes `http_request_duration_seconds{method,path}`. It deliberately skips `/metrics` to
   avoid measuring the measurement endpoint.
3. **gorilla/mux routing** — public routes are registered directly; everything under `/api/v1`
   uses a **subrouter** with `api.Use(auth.Middleware)`.
4. **JWT auth middleware** — validates the `Bearer <token>`, extracts claims, injects them into the
   request context. Invalid → `401`.
5. **`writeGuard` RBAC** — every POST/PUT/DELETE is wrapped in `auth.RequireMutate()` (= `RequireRole("editor")`).
   Admins and editors may write; viewers may only read → `403` on violation.
6. **Domain handler** — runs SQL via the global `db.DB`, returns JSON.

Public routes (no JWT): `/api/v1/login`, `/register`, `/health`, `/metrics`, and the syllabus demo GETs.

### Key architectural decisions to defend

- **Modular monolith, not microservices.** One binary, one database. Modules are isolated Go
  packages (`internal/...`) with clear domain boundaries, but calls are in-process (sub-millisecond,
  no network serialization). Any module can later be extracted into a standalone microservice with no
  refactoring of its logic because the boundary is already a package. This is the *pragmatic* choice
  for a capstone: microservices would add distributed-system complexity (service discovery, retries,
  distributed transactions) with no educational benefit at this scale.
- **Shared global DB handle** (`db.DB`) with a connection pool (`MaxOpenConns=25`, `MaxIdleConns=5`).
- **Idempotent auto-migrations** on startup — `CREATE TABLE IF NOT EXISTS` plus seeded policies, so
  the app is self-bootstrapping.

---

## 4. Technology Stack and Version Reality

| Layer | Technology | Version actually used | Notes |
|---|---|---|---|
| UI | Next.js (Pages Router), React, TypeScript | 14.2.3 / 18.3.1 / 5.5.2 | 11 pages, strict TS, no CSS framework |
| Charts | Recharts | 3.10.1 | Dashboard + module pages |
| Animation | Framer Motion | 14.14.0 | Route transitions, modals, toasts |
| Icons | react-icons/fi (Feather) | 5.7.0 | Navigation and buttons |
| Backend | Go, gorilla/mux, JWT v5, bcrypt | **1.24** / 1.8.1 / 5.2.0 / x/crypto v0.22.0 | README/diagrams say 1.22 — actual build uses 1.24 |
| DB | PostgreSQL (Alpine) | 16 | `lib/pq` driver, `sslmode=disable` |
| IaC | Terraform + CloudFormation | 1.16.1 / AWS provider ~5.0 | Local uses `kreuzwerker/docker` provider 3.9.0 |
| CI/CD | Jenkins (custom image) | lts-alpine, X-Jenkins 2.580.2 LTS fallback | 13-stage declarative designed, 6-stage local scripted actually run |
| Observability | Prometheus, Grafana, Node Exporter, cAdvisor | v2.51.0, 10.4.1, v1.8.2, v0.49.2 | 4 scrape targets |
| Security | Trivy | 0.76.2 | FS, image, and IaC scans |
| Serverless | Node.js | 18.x handler | Local Lambda/API-Gateway emulator |
| Cloud SDK | AWS SDK for Go v2 | S3 v1.114.10, CloudWatch v1.76.0 | Three fallback tiers |

**Mention the version drift honestly:** docs/diagrams cite Go 1.22, but the Dockerfile, Jenkins
pipeline, and evidence all use Go 1.24 (`golang:1.24-alpine`). Also, Tailwind, next-themes,
Headless UI, and clsx are declared in `package.json` but not actually imported — the styling is a
hand-written CSS-variable design system. These are good "attention to detail" signals in a viva.

---

## 5. Backend Deep Dive — The Go Modular Monolith

**Location:** `backend/` · Module `cloudops-sentinel` · 30 files (24 Go: 18 production + 6 tests).

### 5.1 Startup (`cmd/server/main.go`) — 161 lines

`main()` executes in a strict order:
1. `db.Init()` — connect + migrate (fatal on failure).
2. `cloud.InitAWS()` — initialize the AWS manager singleton (three-tier fallback, see §5.13).
3. Read `PORT`, default `8080`.
4. Create router, register **public** routes.
5. Create `/api/v1` subrouter, attach `auth.Middleware`, register **protected** routes, wrapping all
   mutations in `writeGuard`.
6. Wrap with CORS + Prometheus middleware and `ListenAndServe`.

Route IDs are constrained with gorilla/mux regex `{id:[0-9]+}` so `/projects/abc` doesn't match.
There are roughly **69 routes** in total. (A full route table is in §19 and in `docs/API.md`.)

### 5.2 `internal/auth` — Identity, JWT, RBAC

Files: `auth.go`, `handler.go`, `auth_test.go`.

- **JWT generation** — `GenerateToken(userID, role)` builds claims `{sub: userID, role: role,
  exp: now+24h, iat: now}` and signs with **HMAC-SHA256** (`jwt.SigningMethodHS256`) using a secret
  loaded once at package init from the `JWT_SECRET` env var, with an obviously-placeholder default
  (`local-dev-only-secret-change-me-before-production`) for local dev.
- **Auth middleware** — reads `Authorization`, requires `Bearer <token>` via `SplitN(..., 2)` with a
  case-insensitive scheme check, parses with `jwt.ParseWithClaims`. **Crucially, the key function
  rejects any signing method that is not HMAC** — this prevents the classic "algorithm confusion"
  attack where an attacker changes the header to `alg: none` or swaps to RS256. On success the
  `*Claims` are injected into the request context. Errors → `401` with distinct messages.
- **RBAC** — `RequireRole(allowed...)` lowercases/trims, lets `"admin"` always pass, otherwise checks
  membership in the allow-list → `403` on denial. `RequireMutate() = RequireRole("editor")` is the
  write gate. You can explain this as an AWS-IAM-style *Allow* policy.
- **`Login`** — `SELECT id, password_hash, role FROM users WHERE username=$1`, then
  `bcrypt.CompareHashAndPassword`. Both unknown-user and wrong-password return the same generic
  `401 invalid credentials` (avoids user enumeration). Success issues a JWT.
- **`Register`** — validates non-empty fields, **forces `role = "viewer"` regardless of what the
  client sends** (prevents privilege escalation), hashes the password with
  `bcrypt.GenerateFromPassword(..., DefaultCost)`, inserts; duplicate → `409`.
- **`GetMe`** — returns `{username, role}` from the JWT claims.
- Tests cover token round-trip, env-override of the secret, default secret, and the RBAC matrix
  (admin 200, editor 200, viewer 403, guest 403, no-claims 401).

### 5.3 `internal/db` — Persistence and Auto-Migrations

- `db.go`: global `*sql.DB`, `Init()` builds a `lib/pq` connection string from `DB_HOST`, `DB_PORT`
  (default 5432), `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `sslmode=disable`; sets pool limits; `Ping()`;
  calls `RunMigrations`.
- `migrations.go`: executes **19 `CREATE TABLE IF NOT EXISTS`** statements covering users, projects,
  environments, infrastructure_stacks, deployments, pipeline_runs, security_scans, vulnerabilities,
  metric_records, alert_records, governance_policies, compliance_results, audit_logs,
  technical_debt_items, experiments, cost_records, cost_recommendations, budgets. Foreign keys use
  `ON DELETE CASCADE`. It then seeds **6 governance policies** idempotently
  (`require-tagging`, `require-encryption`, `no-public-access`, `require-health-checks`,
  `resource-limits`, `backup-policy`) using `INSERT ... SELECT ... WHERE NOT EXISTS`.

### 5.4 `internal/models` — Domain Contracts

Central structs for every entity (User, Project, Environment, InfrastructureStack, Deployment,
PipelineRun, SecurityScan, Vulnerability, MetricRecord, AlertRecord, GovernancePolicy,
ComplianceResult, AuditLog, TechnicalDebtItem, Experiment, CostRecord, CostRecommendation, Budget).
Notable: `User.PasswordHash` is tagged `json:"-"` so it can never be serialized to an API response.
In practice most handlers define local structs with string timestamps; `models` is the canonical
reference/documentation layer.

### 5.5 `internal/middleware` — CORS

`CORS(next)` sets permissive headers for local development and answers `OPTIONS` with 200.

### 5.6 `internal/project` and `internal/environment` — Multi-Tenant Core

- `project`: `GetProjects` (`ORDER BY created_at DESC`, returns `[]` not `null` when empty),
  `CreateProject` (derives `owner_id` from the JWT username → DB user lookup — a nice touch showing
  identity propagation), `GetProject`, `UpdateProject` (touches `updated_at`), `DeleteProject`
  (relies on DB cascades).
- `environment`: CRUD for dev/staging/prod tiers, defaults `env_type="dev"`.

### 5.7 `internal/infra` — IaC Execution Engine (Terraform simulation)

Header comment: **"ZERO CLOUD COST GUARANTEE — LOCAL SIMULATION MODE ACTIVE."** The real
`exec.Command("terraform", "apply", "-auto-approve")` integration is present as commented code.
- `PlanStack` → sets status `planning`, returns a deterministic simulated plan:
  `changes{add:3, change:1, destroy:0}`, four resources (`aws_vpc.main`, `aws_subnet.public`,
  `aws_subnet.private` create, `aws_security_group.default` update), a timestamped `plan_output`,
  then status `planned`.
- `ApplyStack` → `applying` → `applied`, sets `last_applied_at`, returns
  `"Apply complete! Resources: 3 added, 1 changed, 0 destroyed."`

*Presentation framing:* "The backend models the **state machine** of Terraform (pending → planning
→ planned → applying → applied) and its plan output shape. The *real* Terraform execution is
demonstrated separately in `infrastructure/terraform/local/` with the Docker provider (§7)."

### 5.8 `internal/deployment` — Deployments and Zero-Downtime Rollback

- `CreateDeployment` inserts status `running`, then immediately flips to `success` with a
  `finished_at` of `now+2s` (a deterministic simulation of a completed rollout).
- `GetDeploymentStatus` returns `{id, status}`.
- **`RollbackDeployment`** is the most algorithmic handler:
  1. Load the target's `project_id, environment_id, image_tag`.
  2. Mark the original `status='rolled_back'`.
  3. Find the **previous successful deployment** for the same project+env with `id < target`,
     `ORDER BY id DESC LIMIT 1`. If none exists, synthesize a fallback tag `imageTag + "-rollback"`.
  4. Insert a new `status='success'` deployment with the recovered tag; return both IDs.
  This models the Kubernetes "roll back to the last known-good ReplicaSet" idea (detail in §8).

### 5.9 `internal/pipeline` — CI/CD and Jenkins Status

- `TriggerPipeline` computes a 15-second run, builds an 8-stage simulated Jenkins log (Checkout,
  Unit Tests "42 passed", Static Analysis, Dependency Scan, Secret Detection, Docker Build,
  Container Scan, S3 Artifact upload + CloudWatch telemetry), inserts a `pipeline_runs` row, and —
  if `cloud.GlobalAWS != nil` — uploads a JSON artifact to S3 bucket `cloudops-sentinel-artifacts`
  and records two CloudWatch metrics.
- `GetJenkinsStatus` probes `http://cloudops-jenkins:8085/api/json` (fallback `localhost:8085`) with
  a 2-second timeout, reports `online`/`initializing`, reads the `X-Jenkins` version header, and
  returns a `JenkinsStatus` describing the local orchestrator (`LocalOnly=true`, `ActiveJobs=1`).

### 5.10 `internal/security` — DevSecOps Scanning and the Blocking Quality Gate

- `var mockVulns` holds **7 realistic hardcoded CVEs**: CVE-2024-3094 (xz backdoor, critical),
  CVE-2024-21626 (runc container breakout, high), CVE-2023-44487 (HTTP/2 Rapid Reset, high),
  CVE-2023-39325 (Go DoS, medium), hardcoded credentials, outdated Alpine, missing security headers.
- `TriggerScan` inserts a scan row, picks **2–6 random CVEs** (`rand.Intn(5)+2`) with a `used` map to
  avoid duplicates, tallies severity counts, optionally uploads a report to bucket
  `cloudops-sentinel-reports` and publishes `VulnerabilitiesDetected` to CloudWatch.
- **`GetScanGate`** counts `severity='critical'` and: **gate passes only if `critical_count == 0`**;
  returns `gate_status`, `passed`, `critical_count`, and the `blocking_policy` text. This is the
  "production-quality gate" concept you demonstrate — note that in the *real* Trivy evidence the
  gate legitimately **fails** (§11), which you must state honestly.

### 5.11 `internal/monitor` — Observability

`prometheus.go` registers four collectors via `init()`:
| Collector | Type | Labels / purpose |
|---|---|---|
| `http_requests_total` | CounterVec | method, path, status — Traffic & Errors |
| `http_request_duration_seconds` | HistogramVec (`DefBuckets`) | method, path — Latency |
| `cloudops_active_deployments` | Gauge | current workload count — Saturation proxy |
| `cloudops_security_vulnerabilities_total` | GaugeVec | severity — security signal |

Plus a `statusWriter` that captures the status code, and `PrometheusMiddleware`. `MetricsHandler()`
is `promhttp.Handler()` exposed at `/metrics`.

`monitor.go` handlers: `GetMetrics` (last 100 records), `RecordMetric`, `GetAlerts`, `CreateAlert`,
`ResolveAlert` (sets `resolved_at`), and `HealthCheck` (pings DB; returns
`{"status","database","timestamp","version":"0.1.0"}`; HTTP 503 when DB is down). The dashboard's
charts are fed by real Prometheus samples written through `RecordMetric` by
`scripts/seed_local_metrics.ps1`.

### 5.12 `internal/governance` and `internal/reliability`

- **governance**: policy CRUD (with `*bool` pointer for `Enabled` to distinguish omitted from false),
  `EvaluateCompliance` (simulated weighted random outcomes: 60% pass / 20% warning / 20% fail,
  each inserted into `compliance_results`), `GetCompliance` (join with policy names), `GetAuditLogs`
  (dynamic parameterized filter by `resource_type`, `ORDER BY created_at DESC LIMIT 200`),
  and a reusable `LogAudit(userID, action, resourceType, resourceID, details)` helper for the
  append-only `audit_logs` table.
- **reliability**: technical debt register CRUD (priority/status) and **chaos experiments** CRUD
  (name/description/status) — the code-level tie to the Netflix chaos-engineering case study.

### 5.13 `internal/cost` — The Local FinOps Billing Engine (372 lines)

Header contains fully written **commented-out production hooks**: AWS Cost Explorer
`GetCostAndUsage` (grouped by SERVICE) and Stripe `invoice.Pay` — you can show evaluators exactly
how real billing would be wired without incurring charges. The active code is a deterministic engine:

- `GetCosts` sums estimated/actual cost per project, categorizes each service (`categorizeService`:
  EC2/Compute/EKS→Compute, RDS/Postgres→Database, EBS/S3→Storage, else Networking). If no cost rows
  exist it injects a documented default 4-service breakdown (EC2 86.40/78.20, RDS 45.00/43.10,
  EBS 28.50/27.00, Data Transfer 38.00/36.20 → $197.90 est / $184.50 actual), reads the budget
  (default 350), sums open recommendation savings, and computes
  `BudgetSpentPercent = (totalActual / budget) * 100`.
- `ApplyRecommendation` sets status `applied` and reduces `%Compute%` estimated costs by
  `savings * 0.6` using SQL `GREATEST(0, estimated_cost - $1)`.
- `GetBudget`/`SetBudget` — reads/upserts the budget (`ON CONFLICT (project_id) DO UPDATE`),
  with fallbacks (≤0 → 350, threshold ≤0 → 80). Flags `threshold_breached` when spend% ≥ threshold.
- `SimulateBillingCycle` — the core cost math:
  `simulatedCompute = 40 + stackCount*25 + depCount*12`, `simulatedDB = 45.00`,
  `simulatedStorage = 20 + stackCount*5`; upserts a cost record with `actual_cost = estimated*0.92`.
- `GetGlobalCostSummary` — `COALESCE`-based cross-project totals with flags
  `free_tier_compliant=true`, `cost_guardrail_active=true`, `billing_mode="Local-first Simulation"`.

### 5.14 `internal/cloud` — AWS SDK v2 Free-Tier Manager (342 lines)

A `sync.Once` singleton `GlobalAWS` with an `AWSManager` holding `sync.RWMutex`, an `aws.Config`,
S3 and CloudWatch clients, and in-memory maps `localStorage map[string][]byte` and
`localMetrics []map[string]interface{}`.

`InitAWS()` implements a **three-tier fallback, a favorite viva question**:
1. If `AWS_ENDPOINT_URL` is set → LocalStack mode (custom endpoint resolver, `HostnameImmutable`,
   S3 `UsePathStyle=true`) — mode `"localstack"`.
2. Else if `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` are present → `"aws-live"`.
3. Else → `"local-fallback"`: all storage/metrics stay in memory.
**Cost guardrail: no paid EC2/RDS is ever provisioned in any tier.**

- `PutArtifact`/`GetArtifact` try S3 when live, otherwise use the local cache (ETag `local-%x` vs
  `s3-%x`, location `local://` vs `s3://`).
- `PutMetric` **always** appends to `localMetrics` and *additionally* calls CloudWatch when live — so
  it never fails. `RecordPipelineRun` emits `ExecutionCount` and `ExecutionDurationSeconds`.
- `GetStatus` reports mode, counts, and a `FreeTierDetails` map (S3 5 GB / 20k GET / 2k PUT;
  CloudWatch 10 metrics + 1M requests; "0 Paid EC2 instances"; billing protection active).

### 5.15 `internal/syllabus` — The Academic Demonstration Endpoints (221 lines)

This package exists specifically to *prove* syllabus coverage through the API:
- `GetSyllabusOverview` → six units, each marked `fully_implemented`.
- `GetCaseStudies` → Netflix (Chaos Monkey, Spinnaker, Eureka/Zuul, circuit breakers), Amazon
  (two-pizza teams, multi-AZ, DynamoDB), Uber (DOMA, Jaeger, geohash dispatch, autoscaling), each
  with a `cloudops_sentinel_alignment` field.
- `GetTwelveFactorScorecard` → all **12 factors** as `COMPLIANT` → 12/12 (100%), with concrete
  implementation notes (Go modules, K8s ConfigMaps, HPA, multi-stage Docker, `db.Init()` migrations).
- `ABTestState` guarded by `sync.RWMutex` — experiment "EXP-2026-CANARY-01", Variant A
  "v1.4.2 (Standard Rolling)", Variant B "v2.0.0-rc1 (Blue-Green with Trivy Gate)", initial 85/15
  split, 14,250 traffic, conversion 98.7% / 99.8%. `UpdateABSplit` accepts `split_ratio_b` (0–100),
  recomputes A = 100−B, adds 50 to traffic. This drives the interactive slider on `/syllabus`.

### 5.16 Backend Dockerfile and Tests

**Dockerfile** — two-stage build:
```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./      # dependency layer caching
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /cloudops-backend ./cmd/server/main.go
FROM alpine:latest          # static binary → no extra apk packages, fully offline rebuild
COPY --from=builder /cloudops-backend .
EXPOSE 8080
CMD ["./cloudops-backend"]
```

**Tests** (6 files, standard `testing`, no DB required): auth (token/secret/RBAC), cost
(`categorizeService`), project (struct sanity), cloud (local fallback round-trip + guardrail),
syllabus (overview/case studies/12-factor/A-B). `go test ./...` passes cleanly. Packages like
deployment, governance, infra, monitor, pipeline, security have no dedicated tests — worth knowing
if asked.

---

## 6. Frontend Deep Dive — The Next.js Dashboard

**Location:** `frontend/` · Next.js 14 **Pages Router**, React 18, strict TypeScript.

### 6.1 The shell — `pages/_app.tsx`

Provider order: `<ToastProvider><AuthProvider><AppContent/></AuthProvider></ToastProvider>`.
- `AuthProvider` restores the session from `localStorage('token')` **after mount** (hydration-safe:
  server and client HTML match), then calls `getMe()` to fetch the user; on failure it self-heals by
  removing the token. `login()` stores the JWT; `logout()` clears it.
- `ProtectedRoute` shows a "Restoring secure session" splash while `!ready`, and redirects to
  `/login` if unauthenticated (except on `/login` itself).
- `AppContent` wraps non-login pages in `Layout` and applies per-route fade/slide/blur transitions
  with `AnimatePresence mode="wait"` keyed on `router.pathname`. An `IntersectionObserver` adds
  `.is-visible` to `.reveal` elements for scroll animations.

### 6.2 `src/lib/api.ts` — The Axios client

- `axios.create({ baseURL: '' })` — same-origin; `next.config.js` rewrites `/api/:path*` →
  `http://backend:8080/api/:path*`.
- **Request interceptor** injects `Authorization: Bearer <token>` from localStorage on every call.
- Exports ~45 helper functions grouped by domain: auth, projects, environments, deployments, stacks,
  pipelines, security, monitoring, governance, reliability, FinOps, AWS, syllabus. A few are
  intentional aliases from API evolution (`getCostRecommendations` / `getProjectCostRecommendations`).

### 6.3 `src/components/` — Reusable design system

| Component | What it does |
|---|---|
| `Layout` | The real app shell: collapsible sidebar persisted in localStorage, mobile drawer + scrim, breadcrumb, status pill, external tool links (Jenkins/Prometheus/Grafana), account dropdown, **global command palette Ctrl/⌘+K** with arrow/Enter/Esc, scroll-to-top, ambient backgrounds. |
| `Sidebar` | Legacy unused alternative — superseded by Layout's embedded sidebar. |
| `Card` | Animated stat card with trend arrow, SVG sparkline (`pathLength` draw), loading shimmer, optional `href`. |
| `PageHeader` | Eyebrow, gradient title, subtitle, breadcrumb, actions slot. |
| `StatusBadge` | Maps ~20 status strings to colors; urgent ones (firing/failed/critical/error) pulse faster and get a ping ring. |
| `DataTable` | The workhorse: client-side filter → 3-state sort → pagination, CSV export (BOM + escaping), search, row-click, dense mode, skeleton loading, animated empty states. |
| `Charts` | Recharts wrappers: `TrendArea`, `CompareBars`, `Donut`, `Sparkline`, `MultiLine`, shared `CHART_COLORS`. |
| `Modal` | Accessible dialog: `role=dialog`, `aria-modal`, focus management, ESC + backdrop close, body scroll lock, spring animation. |
| `Toast` | Re-export shim for the ToastContext. |

`ToastContext` provides `success/error/info` toasts with `aria-live`, spring slide-in, auto-dismiss
(4 s) and an animated progress bar; a `__auto` flag prevents duplicate viewports.

### 6.4 The 11 pages (what each demonstrates)

1. **`/` Dashboard** — `Promise.allSettled` of health, projects, alerts, audit logs, policies,
   metrics. Hero banner ("100% OPERATIONAL"), 4 stat cards, telemetry `TrendArea` + alert `Donut`,
   managed-projects table, quick-access buttons that actually navigate, animated "SRE Live Radar"
   widget, live audit trail, and a horizontal 10-stage lifecycle pipeline strip.
2. **`/login`** — animated orbs, feature chips, show/hide password, "Use local demo credentials"
   button (fills `admin`/`admin123`), error banner, local-environment footer.
3. **`/projects`** — CRUD table with create modal and delete confirm.
4. **`/projects/[id]`** — **the largest interactive hub (904 lines)**. Loads 8 data sets in parallel
   and presents **7 tabs**: Environments, Infrastructure Stacks (Plan/Apply buttons + console),
   Deployments (Scan/Rollback), CI/CD Runs (log `<pre>`), Compliance (evaluate button), Reliability
   & Debt (two registers), Cost & FinOps (stat tiles + service table). Top actions: "Run CI/CD
   Pipeline" and "Evaluate Compliance", both dumping JSON into a shared console.
5. **`/infrastructure`** — project picker, execution console, provisioned-stacks table with
   Plan/Apply, plus an academic Terraform-vs-CloudFormation comparison matrix.
6. **`/deployments`** — release history table with Scan Image / Rollback buttons.
7. **`/pipelines`** — Jenkins status banner (:8085), animated 8-stage flowchart advanced by a
   400 ms `setInterval` (Checkout → … → Deploy & S3), pipeline history, copyable console logs.
8. **`/security`** — severity stat cards, quality-gate banner, Recharts donut, vulnerability table
   with severity tabs + search + color-coded badges; calls `/scans/:id/gate`.
9. **`/monitoring`** — health/metrics/alerts, Golden-Signals-style cards, bar + donut charts, alerts
   table with a working **Resolve** button (`PUT /alerts/:id/resolve`), searchable telemetry table.
10. **`/cost`** — budget-utilized warning (>80%), service-cost bar chart, category donut, budget
    progress bar, FinOps recommendations table with sort/search/expand and one-click Apply.
11. **`/governance`** — policy catalog with severity tabs + search, compliance-coverage donut,
    immutable audit trail, create-policy modal.
12. **`/reliability`** — experiment and debt cards with tabs/search, priority bar chart, a 7-step
    "Failure Recovery Architecture" flow (Failure → Detect → Alert → Diagnose → Rollback → Verify → Resolved).
13. **`/syllabus`** — **the 1,308-line presentation centerpiece**, the "Curriculum Hub": 8 icon tabs
    — Master Architecture, Unit I (AWS/Azure matrix, Docker lifecycle, Netflix/Amazon/Uber cards),
    Unit II (IaC comparison + future tools), Unit III (SAFe vs LeSS, TDD/BDD Gherkin viewer,
    **interactive A/B canary slider** wired to `/syllabus/ab-test/split`), Unit IV (Golden Signals,
    Prometheus architecture), Unit V (shift-left gates, SLSA/SBOM/Cosign, zero trust), Unit VI
    (12-factor scorecard table, FinOps economics, serverless vs containers), and Practical Lab
    Syllabus (11 experiment cards with verification commands).

### 6.5 Styling, config, charts, animations

- `styles/globals.css` (1,395 lines) is a single global CSS-variable design system — deep navy
  `#060810`, glass panels, gradient borders, neon accents, monospace "log output" consoles,
  responsive breakpoints at 1024/900/560 px, and `prefers-reduced-motion` support. Two generations
  coexist: the original dashboard layer and an additive "Premium UI System — Session 2026–27" layer.
- `next.config.js`: the single rewrite rule to `http://backend:8080`. `tsconfig.json`: strict,
  `noEmit`, `@/*` → `src/*` alias (pages actually use relative imports). Dockerfile runs
  `npm run dev` on `0.0.0.0` (intentional for this local capstone).
- Recharts is used both through wrappers (Dashboard) and inline with custom tooltips/legends
  (Security, Monitoring, Cost, Governance, Reliability). Framer Motion drives route/modal/toast/card
  animations; the pipelines page uses JS `setInterval`-driven stage progression instead.

---

## 7. Infrastructure as Code — Terraform & CloudFormation

### 7.1 AWS reference modules (`infrastructure/terraform/modules/`)

- `vpc` — wraps community `terraform-aws-modules/vpc/aws` **v5.0.0**.
- `ecs_cluster` — wraps `terraform-aws-modules/ecs/aws` **v5.1.0**.
- `backend` — a 3-line self-referential placeholder (no real resources) — an honest "stub".
- `ec2_webserver` (163 lines) — Security Group (ingress 80/443/22 from `0.0.0.0/0`), t2.micro
  Amazon Linux 2 instance with `user_data` that installs/starts Nginx and writes a branded page.
- `iam` (157 lines) — groups `CloudOps-DevOpsEngineers` / `CloudOps-SecurityAuditors`, an
  `MFAEnforcedPolicy` with a **DenyAllWithoutMFA** statement (`BoolIfExists aws:MultiFactorAuthPresent = false`
  with `NotAction` exceptions for device setup), and a least-privilege `CloudOps-DeploymentRole`
  with `sts:AssumeRole` trust.
- `s3_storage` — versioned, AES256-encrypted bucket with all four public-access-block flags true.

### 7.2 Multi-environment stacks (`envs/dev`, `envs/prod`)

Identical structure (`main.tf`, `variables.tf`, `terraform.tfvars`), `[SAFE LOCAL DEMO MODE]` banner,
AWS provider `~> 5.0`, region `us-east-1`. Dev uses `10.0.0.0/16` with 2 AZs; prod uses
`10.100.0.0/16` with 3 AZs. These demonstrate reusable modules and environment separation.

### 7.3 The runnable Terraform (`terraform/local/`) — the proof

Uses `kreuzwerker/docker` provider (resolved 3.9.0). It maps AWS concepts to Docker resources:
- `docker_network` `tf-local-public` / `tf-local-private` (bridge networks = VPC/subnets),
- `docker_volume` `tf-local-webdata` (= EBS),
- `docker_image` nginx:alpine + custom `tf-local-webserver:latest`,
- `docker_container` `tf-local-webserver` (host **8088 → 80**, serves `TF-LOCAL-WEBSERVER-OK`),
- `docker_container` `tf-local-private-app` (private network, no published ports).

Evidence (`evidence/terraform/`) records a **real** run: `init` (provider 3.9.0), `validate`
"Success", `plan` "8 to add", `apply` "8 added, 0 changed, 0 destroyed", `curl :8088` → 200,
`terraform state list` = 8 resources. This is the strongest "IaC actually works" artifact.

### 7.4 CloudFormation templates (`infrastructure/cloudformation/`)

Four syntactically valid templates kept for **comparison** (no local CFN emulator exists):
`vpc.yaml` (VPC/IGW/public+private subnets with outputs), `ecs-cluster.yaml` (ECS cluster with
FARGATE + FARGATE_SPOT capacity providers), `ec2-webserver.yaml` (parameterized SG + t2.micro +
UserData Nginx, demonstrating stack rollback), `iam-rbac.yaml` (MFA-deny policy + deployer role).
Talking point: CFN is YAML/JSON, AWS-only, with AWS-managed state and a native drift API; Terraform
is HCL, multi-cloud, with explicit state/locking and `terraform plan -refresh-only` drift detection.

---

## 8. Kubernetes Manifests — Declarative Production Topology

**Location:** `kubernetes/` — 11 manifests, all in namespace `cloudops-sentinel`:

| Manifest | Kind & key settings |
|---|---|
| `namespace.yaml` | Namespace `cloudops-sentinel`. |
| `configmap.yaml` | Non-sensitive config: `DB_HOST=postgres`, `DB_PORT=5432`, `DB_NAME=cloudops_db`, `API_PORT=8080`. |
| `secret.yaml` | Opaque secret with DB user/password and `JWT_SECRET` (plaintext demo values — Trivy flags this class of issue). |
| `deployment.yaml` | Backend Deployment, **2 replicas**, image `cloudops-sentinel-backend:latest`, port 8080, resources 128Mi/100m → 256Mi/200m, **liveness** probe (`/api/v1/health`, initialDelay 15s, period 30s) and **readiness** probe (5s/10s), `runAsNonRoot: true`, `readOnlyRootFilesystem: true`. |
| `service.yaml` | Backend ClusterIP, `80 → 8080`. |
| `hpa.yaml` | HPA autoscaling/v2, **min 2 / max 10**, CPU 70%, memory 80%. |
| `networkpolicy.yaml` | **Zero trust**: backend ingress only from labelled frontend on TCP 8080; egress only to postgres on 5432 and DNS on UDP 53. |
| `postgres-deployment.yaml` | **StatefulSet** `postgres` (1 replica), `postgres:16-alpine`, PVC 1Gi RWO via `volumeClaimTemplates`. |
| `postgres-service.yaml` | ClusterIP `5432 → 5432`. |
| `frontend-deployment.yaml` | Frontend Deployment, 2 replicas, port 3000. |
| `frontend-service.yaml` | NodePort `80 → 3000`, nodePort 30000. |

**Zero-downtime + rollback narrative:** With `maxSurge=1`, a new pod is created alongside the old;
traffic is cut over only after the readiness probe passes. If `ServiceDown`/`HighErrorRate` fires, the
operator calls `/deployments/{id}/rollback` (§5.8), which redeploys the last known-good image tag.

**Consistency caveats to mention proactively (shows rigor):** the Secret is named `cloudops-secret`
but manifests reference `cloudops-sentinel-secret`; the HPA targets `cloudops-backend` while the
Deployment is named `cloudops-sentinel-backend`; NetworkPolicy selectors likewise differ. These are
real, honest "reference manifest" issues — explain that the *executable* local proof is Compose,
while these manifests document the intended production topology.

---

## 9. CI/CD — Jenkins Pipeline (Designed vs. Actually Run)

You must distinguish three things clearly — examiners love this nuance:

### 9.1 The designed declarative pipeline — `ci/Jenkinsfile` (13 stages)

`agent any`; `environment` (DOCKER_IMAGE, REGISTRY, DEPLOY_ENV=dev, HEALTH_URL, GO111MODULE);
`options` (timeout 30 min, disableConcurrentBuilds, timestamps, buildDiscarder keep 10).

Stages: **1 Checkout** → **2 Unit Tests** (`go test ./... -v -coverprofile`, archives coverage)
→ **3 Static Analysis** (example `golangci-lint`, commented) → **4 Dependency Scan** (example `trivy fs`)
→ **5 Secret Detection** (example `gitleaks`) → **6 Docker Build** (tag `:BUILD_NUMBER` and `:latest`)
→ **7 Container Scan** (example `trivy image`) → **8 IaC Validation** (example `terraform validate`)
→ **9 Security Gate** (placeholder boolean; fails on critical) → **10 Image Push** → **11 Deploy**
(`kubectl set image`) → **12 Health Check** (`curl` health URL) → **13 Monitor** (Prometheus health).
`post`: `always { cleanWs() }`, success/failure notifications (Slack examples commented).

### 9.2 The local Jenkins controller

`ci/Dockerfile`: `jenkins/jenkins:lts-alpine`, root adds docker-cli/curl/git/bash, then back to
`jenkins` user. `ci/init.groovy.d/basic-security.groovy` creates **admin/admin123** with
FullControl-once-logged-in and anonymous read. Compose runs it on **:8085** with `/var/run/docker.sock`
mounted so it can build images, and the repo mounted read-only at `/workspace`.

### 9.3 The pipeline that actually ran — `scripts/jenkins_setup.ps1` (6 real stages)

Creates job `cloudops-local-pipeline` via the Jenkins REST API (basic auth + CSRF crumb) with a
**Scripted Pipeline**: 1 Checkout → 2 Unit Tests (`golang:1.24-alpine`, `GOPROXY=off`, host module
cache mounted) → 3 Trivy FS scan (`--skip-db-update --exit-code 0`) → 4 Docker build
(`int378-backend-jenkins:local`) → 5 Deploy health check (`curl backend:8080/api/v1/health`) →
6 IaC validate (`hashicorp/terraform:1.16.1 init -backend=false && validate`).

**Evidence:** `evidence/jenkins/SUMMARY.md` and `build_console.txt` show **build #10 SUCCESS** in
~140 s, image ID `49d8bca32d56`. The frontend `/pipelines` page animates an 8-stage conceptual view;
the backend `TriggerPipeline` logs 8 stages; the designed Jenkinsfile has 13; the local job executed
6 real stages. **State all four numbers with their context** — that is the honest, defensible answer.

---

## 10. Monitoring & Observability — Prometheus, Grafana, Golden Signals

### 10.1 Prometheus (`monitoring/prometheus.yml`)

`global`: 15 s scrape + 15 s evaluation; `rule_files: alert_rules.yml`. Four scrape jobs:
- `prometheus` → `localhost:9090`
- `cloudops-backend` → `backend:8080/metrics` (the four custom collectors from §5.11)
- `node-exporter` → `node-exporter:9100` (host CPU/memory/disk/network; 128 `node_cpu_seconds_total` series)
- `cadvisor` → `cadvisor:8080` (per-container metrics)

Evidence confirms all **4 targets UP**.

### 10.2 Alert rules (`monitoring/alert_rules.yml`) — group `cloudops_alerts`

| Alert | Expression | For | Severity |
|---|---|---|---|
| `ServiceDown` | `up == 0` | 1m | critical |
| `HighErrorRate` | `rate(http_requests_total{status=~"5.."}[5m]) > 0.05` | 2m | critical |
| `HighRequestLatency` | `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) > 1.5` | 2m | warning |
| `CriticalVulnerabilitiesDetected` | `cloudops_security_vulnerabilities_total{severity="critical"} > 0` | 30s | critical |

A good exam answer: *"An alert must be actionable and have an owner; too many alerts destroy value."*
Honest note: Alertmanager is **not** deployed, so rules are defined but do not notify externally;
the dashboard's alert table + Resolve button provide the in-app incident-resolution loop.

### 10.3 Grafana provisioning

- Datasource: Prometheus at `http://prometheus:9090`, proxy access, default, non-editable.
- Dashboard provider: folder "CloudOps", file-based at `/var/lib/grafana/dashboards`.
- `grafana-dashboard.json`: **"CloudOps Sentinel - Executive Overview"**, uid `cloudops-overview`,
  refresh 5 s, six panels: API Request Rate, p99 Latency, Active Workloads, HTTP 5xx Error Rate,
  Backend Service Status, Critical Security Vulnerabilities.

### 10.4 The Four Golden Signals (concept to explain)

| Signal | Meaning | Our metric |
|---|---|---|
| **Latency** | Time to serve a request (success vs. failure) | `http_request_duration_seconds` histogram → `histogram_quantile` |
| **Traffic** | Demand on the system | `http_requests_total` counter → `rate()` |
| **Errors** | Rate of failed requests | `status=~"5.."` ratio → `HighErrorRate` |
| **Saturation** | How "full" the system is | CPU/memory (Node Exporter/cAdvisor), `cloudops_active_deployments` |

Also mention the advanced trajectory: Prometheus federation + remote write, Thanos/Cortex for
long-term retention, OpenTelemetry for unified traces/metrics/logs, and eBPF for kernel-level tracing.

---

## 11. Security — DevSecOps, Trivy, IAM/MFA/RBAC, Zero Trust

### 11.1 Shift-left pipeline and the gate

Security is moved as early as possible: Code → SAST → dependency scan → secret scan → image scan →
IaC scan → quality gate → deploy. The gate rule from `security/security-policy.yaml` (CRD-style
`SecurityGatePolicy` named `production-delivery-gate`, `enforcement: strict`):
- `no-critical-cve`: max 0,
- `high-cve-threshold`: max 3 (with remediation plan),
- `secrets-zero-tolerance`: max 0,
- `root-container-forbidden`: containers must `runAsNonRoot: true`, action `block`.

`security/trivy-config.yaml`: timeout 5m, severities CRITICAL/HIGH/MEDIUM, vuln types os+library,
checks vuln+config+secret, `exit-code: 1`, JSON output, `ignore-unfixed: true`.

### 11.2 Real Trivy results — `security/run_trivy_scan.ps1` + bundled Trivy 0.76.2

Three real scans into `evidence/security/`:
| Scan | Critical | High | Medium | Low | Unknown |
|---|---|---|---|---|---|
| Filesystem | 4 | 43 | 45 | 5 | 2 |
| Image (`int378-backend`) | 0 | 39 | 31 | 5 | 3 |
| IaC (`infrastructure/`) | 2 | 9 | 6 | 4 | 0 |

**Honest baseline:** 4 FS criticals trace to Next.js 14.2.3 (RCE/auth-bypass class CVEs); 2 IaC
criticals are unrestricted security-group egress; EOL Alpine 3.19; 0 secret findings. The strict
gate therefore **FAILS** on the real baseline — and the project *documents* this rather than hiding
it. This is a major credibility point: "we report real tool output, including failures, and provide a
prioritized remediation plan (P0/P1) in `evidence/security/SUMMARY.md`."

### 11.3 IAM / MFA / RBAC — `practicals/02-iam/`

- `totp_demo.py` — a **stdlib-only RFC 6238 TOTP engine**: HMAC-SHA1, base32 secret, 30-second step,
  6 digits, ±1-step verification with `hmac.compare_digest` (timing-safe). Local IAM engine with
  principals (alice/bob/carol/dave), groups, role policies (viewer `[read:*]`, deployer
  `[read:*, deploy:*, pipeline:trigger]`, admin `[*]`), MFA-gated `switch_role()` (STS AssumeRole
  analogue), and a JSON audit log (CloudTrail analogue).
- `verify_api.ps1` — 11 live checks against the Go API: HS256 signature matches `JWT_SECRET` from
  Compose (and not the old hardcoded value), admin POST 201, self-register forced to viewer
  (role=admin ignored), viewer POST/PUT **403**, anonymous POST **401**. Evidence: `evidence/iam/`.
- Measured: TOTP deltas −1/0/+1 accepted, bogus rejected; 15 audit events, 4 DENIED.

### 11.4 Container & Kubernetes security

Multi-stage Dockerfiles, non-root K8s securityContext, read-only root filesystem, secrets via
ConfigMap/Secret, zero-trust NetworkPolicy (§8), RBAC+JWT+bcrypt in the API. Supply-chain trends to
mention: **SLSA Levels 1–4** provenance, **SBOM** (SPDX/CycloneDX) inventory for zero-day cross-
referencing, and **Cosign/Sigstore** keyless OIDC image signing so admission controllers reject
untrusted images.

---

## 12. Serverless & FinOps — Lambda Runtime and Cost Simulator

**Location:** `serverless/`.

- `lambda/index.js` — the real handler: logs structured JSON telemetry (requestId, httpMethod, path,
  sourceIp), returns `{statusCode:200, headers, body}` with service/course/candidate metadata and
  metrics (duration, memory, `coldStart: !context.alreadyWarmed`), and sets `alreadyWarmed = true`
  so subsequent calls demonstrate warm starts.
- `template.yaml` — SAM template (`AWS::Serverless-2016-10-31`): Timeout 10, Memory 128,
  `nodejs18.x`, env STAGE/APP_NAME/COURSE; a 7-day-retention log group (FinOps); function
  `cloudops-sentinel-lambda` with `GET /health` and `POST /process` API events; least-privilege
  CloudWatch Logs role.
- `local-runtime.js` — a local Lambda + API Gateway emulator: builds synthetic proxy events, emulates
  the context (awsRequestId, 128 MB, log stream, `getRemainingTimeInMillis`), intercepts `console.log`
  into CloudWatch-style START/structured/END/REPORT lines. Runs **3 invocations** — GET /health
  (COLD 2.06 ms), POST /process (WARM 0.05 ms), GET /health (WARM 0.03 ms) — all HTTP 200.
- `local_cost_simulator.js` — an offline FinOps model with a documented RATE_CARD (container
  $0.05/hr, Lambda $0.20/1M + $0.0000166667/GB-s, API GW $3.50/1M, CloudWatch ingest/storage,
  transfer $0.09/GB). Applies 5 optimizations (schedule 24h→12h, 120→80 ms Lambda, 1.2M→960k
  requests, 30→7 day log retention, 5→3 GB transfer). Result: **$204.87/mo → $113.12/mo, saving
  $91.76 (44.8%)**, clearly labelled **"LOCAL ESTIMATE — NOT ACTUAL AWS BILLING."**

The conceptual comparison: Lambda/Fargate cost $0 at idle but have 100–800 ms cold starts; EKS/EC2
have sub-ms warm latency and fixed node overhead, becoming cheaper at sustained high volume. The
FinOps loop is **Inform → Optimize → Operate**; rightsizing flags workloads with <10% CPU/memory over
14 days (e.g., t3.large → t3.medium) and computes savings.

---

## 13. Automation Scripts, E2E Test, and Evidence

### 13.1 Scripts (`scripts/`, 24 files) — grouped by purpose

- **IaC workflows:** `terraform_workflow.ps1` (init → validate → plan -out → state list →
  apply/destroy instructions), `cloudformation_workflow.ps1` (validate-template, create-stack with
  ROLLBACK + CAPABILITY_IAM, drift commands, comparison matrix).
- **CI/registry:** `jenkins_setup.ps1`, `local_registry_lifecycle.ps1` (real tag→push→rmi→pull→run→
  catalog lifecycle on :5000; catalog shows `[cloudops-demo, int378-backend]`),
  `docker_hub_lifecycle.ps1` (build/pause/unpause/stop/rm + push/pull commands).
- **DB/telemetry:** `init-db.sh` (16 tables + seed admin/project/budget/costs/recommendations,
  mounted into Postgres), `seed_local_metrics.ps1` (queries **live Prometheus** and writes real
  samples via the API — no fabricated chart data).
- **Demo/verification:** `demo_walkthrough.ps1` (60-second automated demo: health → login →
  syllabus → case studies → 12-factor → A/B split update → golden signals → cost), `final_verify.ps1`
  (11 containers, 9 HTTP endpoints, Prometheus targets, Go tests, deliverables →
  `evidence/final_verification.txt`), `capture_screenshots.ps1`, `verify_ui.js`, `cdp_screenshot.js`,
  `diag_mobile.js`.
- **Deck generators (Python):** `generate_presentation.py`, `generate_syllabus_presentation.py`,
  `append_evidence_slides.py`, `append_ui_slides.py`, `generate_slide_assets.py`,
  `generate_rich_assets.py`, `generate_full_architecture.py`, `generate_all_side_banners.py`.

### 13.2 E2E lifecycle test — `tests/e2e/test_lifecycle.sh` (9 stages)

`set -e`, `API_BASE=http://localhost:8080/api/v1`:
1. Health check → 2. Authenticate admin (admin/password with admin/admin123 fallback) → 3. Query
   projects → 4. Create "E2E Test Workload" → 5. Create staging environment → 6. Provision Terraform
   stack + `/plan` + `/apply` → 7. Deploy image + security scan + quality gate → 8. Policy-as-Code
   compliance eval → 9. Cost engine + billing simulation. Ends "✅ ALL LIFECYCLE STAGES VERIFIED
   SUCCESSFULLY!" (the banner says "[n/8]" but there are 9 stages — a harmless labeling quirk).

### 13.3 Evidence index and measured outcomes

`evidence/` contains: `screenshots/` (21 PNGs), `ui/` (15 PNGs + `ui_report.json`), `security/`
(SUMMARY + 6 reports), `terraform/` (run log + verification), `jenkins/` (SUMMARY + 13 KB console),
`iam/` (demo output, API verification, audit log), `registry/` (13 KB lifecycle log), `serverless/`
(logs + cost report), and `final_verification.txt`.

**Verified results to quote:** 11 containers up and 9 endpoints HTTP 200; 4 Prometheus targets UP;
all Go packages pass; RBAC matrix (admin 200/201, viewer GET 200, viewer POST 403, anon 401);
TOTP ±1 with 15 audit events/4 DENIED; Terraform 8 resources applied + web endpoint 200; Jenkins
build #10 SUCCESS (6 real stages); Trivy real findings with a failing gate; Lambda 3/3 HTTP 200;
cost $204.87 → $113.12; zero browser JS errors in the UI verification.

---

## 14. Core Concepts Explained in Depth

*(These are the "define, then apply to our project" answers for viva questions.)*

1. **Modular monolith vs. microservices** — one deployable, in-process module calls; strict package
   boundaries allow future extraction. Chosen for simplicity and sub-ms latency.
2. **JWT (HS256)** — a signed, self-contained token: header (alg), payload (claims: sub, role, exp,
   iat), signature (HMAC-SHA256 with secret). The server is stateless — it verifies the signature,
   not a session store. We reject non-HMAC algorithms to prevent algorithm confusion. 24 h expiry.
3. **bcrypt** — adaptive, salted password hash; `DefaultCost` (10) means 2¹⁰ rounds, deliberately slow
   to resist brute force. We store only the hash and compare with `CompareHashAndPassword`.
4. **RBAC** — roles admin/editor/viewer; `RequireRole` is an Allow policy with admin bypass;
   `writeGuard` is applied to every mutating route (least privilege by default). Registration forces
   viewer. Equivalent to AWS IAM policies.
5. **IaC — declarative vs. imperative** — declarative describes the desired end state; the tool
   computes the diff. Terraform: HCL, multi-cloud, explicit state + locking, drift via
   `plan -refresh-only`. CloudFormation: YAML/JSON, AWS-only, AWS-managed state, native drift API.
6. **Terraform workflow** — write `.tf` → `init` (fetch providers) → `validate` (syntax/schema) →
   `plan` (diff + proposed changes) → `apply` (reach desired state) → state file. State is the source
   of truth mapping config to real resources.
7. **Drift detection** — comparing real infrastructure against declared/state; caught by a
   refresher plan or CFN drift detection; remediated by re-applying.
8. **12-Factor App** — a methodology for cloud-native SaaS: (1) one codebase, (2) declared deps,
   (3) config in env, (4) backing services as attached resources, (5) build/release/run separate,
   (6) stateless processes, (7) port binding, (8) concurrency via scaling, (9) disposable processes,
   (10) dev/prod parity, (11) logs as streams, (12) admin tasks as one-off processes. Our scorecard
   claims 12/12 with concrete implementation notes.
9. **CI vs. CD** — Continuous Integration (auto build+test on every commit) vs. Continuous
   Delivery/Deployment (auto release to staging/production). Our Jenkins pipeline covers both.
10. **TDD / BDD** — TDD: Red → Green → Refactor with `go test ./...`; BDD: Given/When/Then Gherkin
    scenarios (our `/syllabus` has an interactive spec viewer).
11. **SAFe vs. LeSS** — SAFe: 500–5000+ engineers, Agile Release Trains of 50–125, 8–12 week
    Program Increments, portfolio budgeting. LeSS: one Product Backlog, one PO, synchronized sprints,
    minimal overhead. Both are scaling frameworks; the choice depends on organization size.
12. **Canary / A-B testing** — release to a small subset (15% canary) while monitoring error/conversion
    telemetry; promote to 100% or roll back instantly. Our controller: 85/15 split with a live slider.
13. **Technical debt quadrants** — prudent/deliberate vs. reckless/accidental; tracked in our Debt
    Register with priority and status so it isn't invisible.
14. **The Four Golden Signals** — Latency, Traffic, Errors, Saturation (§10.4).
15. **Prometheus data model** — time-series identified by metric name + labels; counter (monotonic),
    gauge (up/down), histogram (bucketed observations → quantiles via `histogram_quantile`), summary.
    PromQL `rate()` computes per-second rates from counters. Pull-based scraping every 15 s.
16. **Alerting** — recording rules vs. alerting rules; expression + `for` duration + labels; a good
    alert is actionable, has an owner, and is not noisy. (Alertmanager intentionally not deployed.)
17. **HPA** — Horizontal Pod Autoscaler watches CPU/memory and changes replica count (2–10 here) to
    match demand; complements liveness/readiness probes and rolling updates for resilience.
18. **Zero-trust NetworkPolicy** — default-deny-style least privilege: frontend→backend on 8080,
    backend→postgres on 5432, DNS on 53; nothing else. Stops lateral movement to the database.
19. **Shift-left security & quality gates** — test security as early as possible; a gate is an
    automated threshold (0 critical, ≤3 high) that blocks promotion on violation.
20. **SLSA / SBOM / Cosign** — provenance levels (1–4) describing build-integrity maturity; SBOM is a
    machine-readable inventory (SPDX/CycloneDX) for rapid vulnerability cross-reference; Cosign signs
    images keylessly via OIDC identity so admission control can enforce trust.
21. **FinOps** — Inform → Optimize → Operate; showback/chargeback, rightsizing, budgets/alerts,
    and idle-resource detection; our engine models estimated vs. actual and applies recommendations.
22. **Serverless vs. containers** — event-driven, scale-to-zero, pay-per-use, cold starts vs. always-on
    orchestrated pods with predictable warm latency; choose by workload shape and cost curve.
23. **Immutable audit trail** — append-only `audit_logs` records who did what to which resource and
    when; supports SOC 2 / governance and cannot be silently rewritten.

---

## 15. Worked End-to-End Workflows (Narratives You Can Tell)

### Workflow A — Login and authorization
"User opens :3000 → `ProtectedRoute` sees no token → redirect `/login`. They enter admin/admin123;
`AuthContext.login()` calls `POST /api/v1/login`. The backend looks up the user, verifies the bcrypt
hash, and returns an HS256 JWT (24 h). The token is stored in localStorage. `getMe()` fetches the role.
On every subsequent API call the Axios interceptor attaches `Bearer <token>`; the JWT middleware
verifies the signature and injects claims; a POST additionally passes the `writeGuard` editor gate. A
viewer's POST is rejected with 403; no token at all gets 401."

### Workflow B — Terraform plan → apply from the UI
"On `/projects/:id` → Infrastructure Stacks tab, clicking Plan calls `POST /stacks/{id}/plan`. The
backend moves the stack `planning → planned` and returns a simulated plan (3 add, 1 change). Clicking
Apply calls `/apply`, which moves it to `applied` and stamps `last_applied_at`. Separately, the
*real* Terraform proof lives in `infrastructure/terraform/local/`: `init` → `validate` → `plan` →
`apply` creates 8 Docker resources including a Nginx web server on :8088 returning
`TF-LOCAL-WEBSERVER-OK`. The simulated API models the state machine; the local run proves the IaC concept."

### Workflow C — Security scan and quality gate
"Trigger a scan with `POST /deployments/{id}/scan`. The backend selects 2–6 representative CVEs,
stores them, and counts severities. The `/security` page shows a Recharts donut and the gate banner.
`GET /scans/{id}/gate` passes only if `critical_count == 0`. In the *real* Trivy run, the filesystem
and IaC scans contain critical findings, so the strict gate legitimately fails — we show that result
and a remediation plan instead of faking a pass. This demonstrates that a gate is a real control,
not a decorative green checkmark."

### Workflow D — Deployment, failure detection, rollback
"A deployment is created (`running → success` with a simulated 2 s finish). Prometheus scrapes
`/metrics` every 15 s; if `up == 0` or 5xx > 5% for 2 minutes, an alert rule fires. The `/monitoring`
page lists the incident; the operator clicks Resolve, or triggers `/deployments/{id}/rollback`. The
rollback handler marks the old release `rolled_back`, finds the previous successful image in the same
project+env, and inserts a new successful deployment with that tag — the API-level equivalent of a
Kubernetes rollback to the last good ReplicaSet."

### Workflow E — Full E2E lifecycle
"The `tests/e2e/test_lifecycle.sh` script runs the whole path unattended: health → JWT → create
project → create staging env → create/plan/apply Terraform stack → deploy → security scan → quality
gate → compliance evaluation → cost summary + billing simulation. It prints a success banner, which
we capture as evidence."

---

## 16. Syllabus Mapping and Presentations

### Unit-by-unit mapping (the academic justification)

| Unit | Syllabus domain | Where it is implemented |
|---|---|---|
| I | Advanced Cloud Infrastructure | AWS/Azure parity matrix + Docker lifecycle + Netflix/Amazon/Uber case studies (`syllabus` package + `/syllabus` tabs 1) |
| II | Infrastructure as Code | Terraform modules + CloudFormation templates + comparison + local Docker-provider run + future tools |
| III | Agile & CI/CD | SAFe/LeSS, TDD (`go test`), BDD Gherkin viewer, A/B canary slider, debt register, Jenkins pipeline |
| IV | Monitoring & Observability | Prometheus `/metrics`, exporters, Golden Signals, alert rules, Grafana, federation/Thanos notes |
| V | DevSecOps & Cloud Security | Shift-left, Trivy, quality gates, JWT/RBAC/bcrypt, zero-trust NetworkPolicy, SLSA/SBOM/Cosign |
| VI | Cloud-Native & Optimization | 12-factor scorecard (12/12), serverless vs containers, FinOps engine, governance + audit |

### PowerPoint decks (use the right one)

- **`CloudOps_Sentinel_INT378_Lean.pptx` (15 slides) — the one to present from.**
  Keyword-driven, one slide per essential topic: all six syllabus units, concise bullet points,
  flow diagrams, and a project summary. No lengthy paragraphs.
- **`CloudOps_Sentinel_INT378_Syllabus_Deck.pptx` (38 slides)** — detailed chapter-wise teaching
  and revision aid: six chapters in exact syllabus order with concept slides, diagrams and project
  examples. Best for *explaining concepts* in class or revision before viva.

---

## 17. Honest Limitations and Viva Questions

### Limitations you should state *before* the examiner asks (this builds trust)

- No AWS account or credentials were used; all "AWS" behavior is local emulation.
- CloudFormation templates are syntax/reference artifacts; no local CFN emulator exists. Executable
  IaC is Terraform with the Docker provider.
- VirtualBox/RDP desktops were not used; containers provide the compute simulation.
- SonarQube was not installed; Trivy covers filesystem, dependency, image, and IaC scanning.
- Alertmanager is not deployed; alert rules are defined but do not notify externally.
- The Trivy quality gate currently **fails** on real findings — documented, not hidden.
- Some backend endpoints (pipeline logs, governance evaluation) remain in-process simulations, not
  real external integrations.
- Cost figures are illustrative local estimates, not actual AWS billing.
- Minor K8s manifest naming inconsistencies (Secret name, HPA target, NetworkPolicy selectors) exist
  in the reference manifests; the executable local proof is Compose.

### Likely examiner questions — short model answers

- **"Why a monolith?"** → In-process speed, simple deployment, clean package boundaries that permit
  later extraction; no distributed-system overhead for a capstone.
- **"Zero cloud cost with an AWS SDK?"** → Three tiers: live SDK → LocalStack → in-memory fallback;
  no paid EC2/RDS ever provisioned; FinOps is offline; billing hooks are commented, not executed.
- **"Explain the shift-left gate."** → Trivy scans at commit/build; strict policy (0 critical, ≤3
  high); violation logs to PostgreSQL and blocks promotion with a non-zero exit.
- **"Terraform vs CloudFormation?"** → HCL/multi-cloud/explicit state vs YAML/AWS-only/managed state;
  drift via plan-refresh vs native drift API.
- **"Zero-downtime deploy?"** → maxSurge new pod + readiness probe gates traffic cutover; alerts
  trigger rollback to last known-good image.
- **"Four Golden Signals?"** → Latency, Traffic, Errors, Saturation with the exact Prometheus metrics.
- **"12-Factor compliance?"** → Walk the 12 factors with concrete code/config references.
- **"SAFe vs LeSS?"** → Large ARTs/PIs vs single backlog/minimal overhead.
- **"SLSA/SBOM/Cosign?"** → Provenance levels, inventory for zero-days, keyless image signing.
- **"Serverless vs containers?"** → Cold-start/pay-per-use vs warm latency/fixed overhead; choose by
  workload and cost curve.

---

## 18. A Ready-to-Speak 12–15 Minute Presentation Script

**(0:00–1:00) Open.** "Good morning. I'm Kakumani Phaneendra, and my project is **CloudOps
Sentinel** — a cloud-native DevSecOps, infrastructure automation, and observability platform built
for INT 378. The problem I tackled is that cloud teams use fragmented tools, find security bugs too
late, suffer config drift, and overspend. My answer is one local-first control plane over the ten-stage
lifecycle: Plan, Commit, Test, DevSecOps, Build, IaC, Deploy, Observe, Recover, Govern."

**(1:00–3:00) Architecture.** Draw the three tiers. "Next.js on port 3000; a Go modular monolith on
8080 with twelve domain engines; PostgreSQL on 5432, plus Prometheus, Grafana, Jenkins and a local
registry. A request passes through CORS, Prometheus timing, JWT verification, and an RBAC write-guard
before reaching a handler. I chose a monolith deliberately — in-process calls, one database, and clean
package boundaries that allow future microservice extraction."

**(3:00–5:00) Backend engines.** "Auth uses HS256 JWTs, salted bcrypt, and role gates where viewers
are read-only and registration always creates a viewer. The infrastructure engine models the
Terraform plan/apply state machine; the deployment engine can roll back to the last successful image.
The security engine stores CVEs and enforces a gate that passes only with zero critical findings. The
cost engine is a deterministic local billing model with AWS Cost Explorer and Stripe hooks left as
commented reference code."

**(5:00–7:00) Frontend.** "Eleven pages. The centerpiece is the interactive Curriculum Hub on
`/syllabus`, and the project detail page with seven tabs that let me run a pipeline, plan/apply
infrastructure, scan images, roll back deployments, evaluate compliance, and apply cost
recommendations live. Shared components include a full DataTable, accessible modals, toasts, and a
Ctrl-K command palette, all in a custom dark design system with Recharts and Framer Motion."

**(7:00–9:00) IaC, K8s, CI/CD.** "For IaC I have reusable Terraform modules, dev/prod environments,
and a runnable local Terraform config using the Docker provider that provisions eight real resources
and a web server on 8088. CloudFormation templates are kept for comparison. Kubernetes manifests
declare two backend replicas, readiness/liveness probes, an HPA from two to ten, and a zero-trust
NetworkPolicy. Jenkins has a designed 13-stage declarative pipeline, while the job that actually ran
locally executed six real stages — build number ten, success."

**(9:00–11:00) Observability, security, serverless, FinOps.** "Prometheus scrapes four targets every
15 seconds; alert rules cover ServiceDown, high error rate, latency, and critical CVEs, with Grafana
dashboards. Trivy 0.76.2 produced real findings — and I want to be clear that the strict gate fails
on that honest baseline, which is why I documented remediation rather than hiding it. The IAM/MFA
practical implements RFC 6238 TOTP and the API enforces the RBAC matrix. Lambda runs through a local
runtime three times with cold and warm timings. FinOps shows $204.87 dropping to $113.12 a month,
explicitly labelled a local estimate."

**(11:00–13:00) Verification & honesty.** "Everything is backed by evidence: Go tests pass, nine HTTP
endpoints respond 200, four Prometheus targets are up, Terraform applied eight resources, the E2E
script covers nine lifecycle stages, and the UI has zero browser errors. I'll state the limitations
openly: no AWS account was used, CloudFormation is a reference artifact, Alertmanager and SonarQube
are not deployed, some engine endpoints are simulations, and the Trivy gate fails on real findings.
That transparency is deliberate."

**(13:00–15:00) Close.** "The project maps to all six syllabus units, demonstrated live in the
Curriculum Hub. The future roadmap includes eBPF tracing, AI-assisted remediation, multi-region
failover, and GitOps with ArgoCD. Thank you — I'm happy to take questions."

---

## 19. Quick Reference Cheat Sheet

### Ports
`3000` UI · `8080` API (`/api/v1/health`) · `5432` Postgres · `9090` Prometheus · `3001` Grafana ·
`9100` Node Exporter · `8087` cAdvisor · `8085` Jenkins (+50000 agent) · `5000` registry ·
`8088` Terraform Nginx · `30000` K8s frontend NodePort.

### Credentials
Dashboard/API: **admin / admin123** · Grafana: **admin / admin** · Jenkins: **admin / admin123** ·
Compose Postgres: **cloudops / password** (docs also cite `cloudops_dev_secret`).

### Key commands
```powershell
docker compose up -d --build
docker compose -f docker-compose.registry.yml up -d
cd infrastructure/terraform/local; terraform apply -auto-approve
cd backend; go test ./... -v
cd frontend; npm run build; npx tsc --noEmit
bash tests/e2e/test_lifecycle.sh
powershell -File security\run_trivy_scan.ps1
node serverless\local-runtime.js
node serverless\local_cost_simulator.js
python practicals\02-iam\totp_demo.py demo
```

### Numbers to remember
**12** domain/engine packages · **69** API routes · **19** migration tables · **6** seeded policies ·
**7** mock CVEs · **4** Prometheus collectors/targets · **11** practical experiments · **8** real
Terraform resources · **6** real Jenkins stages / **13** designed / **8** UI-animated · **9** E2E
stages · **12/12** 12-Factor · **3/3** Lambda invocations · **$204.87→$113.12** local cost estimate ·
**38 / 13 / 25** slides in the three decks.

### Files to open during a viva
`backend/cmd/server/main.go` (routing) · `backend/internal/auth/auth.go` (JWT/RBAC) ·
`backend/internal/cost/cost.go` (FinOps + commented AWS hooks) · `backend/internal/cloud/aws.go`
(three-tier fallback) · `frontend/pages/syllabus.tsx` (Curriculum Hub) · `ci/Jenkinsfile` (13 stages) ·
`monitoring/alert_rules.yml` (alerts) · `security/security-policy.yaml` (gate) ·
`evidence/security/SUMMARY.md` (honest Trivy results) · `evidence/final_verification.txt` (proof).
