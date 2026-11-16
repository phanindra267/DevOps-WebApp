# CLOUDOPS SENTINEL
## A Cloud-Native DevSecOps, Infrastructure Automation & Observability Platform
### Comprehensive Academic Project Report for Course INT 378 (Units I – VI)

---

**Submitted by:**  
**Kakumani Phaneendra**  
Registration Number: **12418953** | Section: **K202313**  
Department of Computer Science & Engineering  
**Lovely Professional University, Punjab, India**  

**Course:** INT 378 — Advanced Cloud Infrastructure, DevSecOps & FinOps  
**Project Repository:** `cloudops-sentinel`  
**License:** MIT / Open Source  

---

## 1. Executive Summary & Abstract
In modern software engineering organizations, developers, operations engineers, and security analysts often operate in isolated silos using fragmented toolchains. Security vulnerability inspections are typically postponed until late in the release cycle, creating costly release delays when critical Common Vulnerabilities and Exposures (CVEs) are discovered right before production promotion. Simultaneously, manual modifications to cloud infrastructure introduce configuration drift, while uncontrolled cluster provisioning results in severe budget overruns.

**CloudOps Sentinel** is an integrated cloud-native platform designed to govern the complete software engineering and infrastructure lifecycle:
$$\text{Plan} \longrightarrow \text{Commit} \longrightarrow \text{Test} \longrightarrow \text{DevSecOps} \longrightarrow \text{Build} \longrightarrow \text{IaC} \longrightarrow \text{Deploy} \longrightarrow \text{Observe} \longrightarrow \text{Recover} \longrightarrow \text{Govern}$$

The platform unifies multi-cloud Infrastructure as Code (HashiCorp Terraform and AWS CloudFormation), containerized microservices (Docker and Kubernetes), automated delivery pipelines (Jenkins), Shift-Left security gates (Aqua Trivy and Policy-as-Code), time-series observability (Prometheus and Grafana), and in-cluster FinOps billing optimization into a centralized, modern web dashboard. The platform is engineered with a **strict zero-cost, local-first guarantee**, allowing complete academic evaluation without incurring cloud charges.

---

## 2. High-Level System Architecture & Topology

CloudOps Sentinel is structured into three distinct operational layers:

### Layer 1: Presentation & Client Interface (Port 3000)
- **Framework**: Next.js 14, React 18, TypeScript, Tailwind CSS Dark Theme.
- **Visualizations**: Recharts time-series graphs, interactive traffic allocation sliders, and responsive data tables.
- **Authentication**: Axios API client with automatic JWT Bearer token injection.
- **Routes**: `/` (Overview Dashboard), `/projects`, `/infrastructure`, `/deployments`, `/pipelines`, `/security`, `/monitoring`, `/cost`, `/governance`, `/reliability`, and `/syllabus` (Curriculum Hub).

### Layer 2: Control Plane & Modular Go REST API (Port 8080)
- **Runtime**: Go 1.22+ Modular Monolith exposing standard REST endpoints with Gorilla Mux routing.
- **Global Middleware**: CORS preflight handler, JWT Bearer authentication, Role-Based Access Control (RBAC), and Prometheus HTTP request metrics interception.
- **10 Core Internal Engines**:
  1. `auth`: JWT token generation (HMAC-SHA256) and salted Bcrypt password hashing.
  2. `project` & `environment`: Multi-tenant project and isolated environment tiers (Dev, Staging, Prod).
  3. `infra`: Terraform (HCL) and AWS CloudFormation (YAML) execution, dry-run plan, and apply engine.
  4. `deployment`: Rolling zero-downtime updates, pod status tracking, and automated rollback controller.
  5. `pipeline`: Jenkins 13-stage declarative pipeline triggers and real-time log streaming.
  6. `security`: Aqua Trivy vulnerability scanning and automated blocking quality gates.
  7. `monitor`: Prometheus telemetry handler (`/metrics`), SRE Golden Signals, and alert rules.
  8. `cost`: FinOps local billing engine, rightsizing algorithms, and budget breach alarms.
  9. `governance`: Policy-as-Code compliance evaluation and immutable audit log trails.
  10. `cloud`: AWS SDK v2 client for S3 artifacts and CloudWatch metrics with safe in-memory fallback.

### Layer 3: Persistence, Orchestration & Multi-Cloud Targets
- **PostgreSQL 16 Alpine (Port 5432)**: Relational store with automated schema migrations (`db.Init()`).
- **Kubernetes Cluster**: Production deployment manifests with Horizontal Pod Autoscaler (HPA, 2–5 replicas) and zero-trust `NetworkPolicy` (default-deny ingress).
- **Observability Stack**: Prometheus (Port 9090) scraping metrics every 15s; Grafana OSS (Port 3001) rendering executive dashboards.
- **Local-First Container Stack**: Orchestrated cleanly via `docker-compose.yml` across 5 isolated containers.

---

## 3. Academic Syllabus Alignment & Implementation (INT 378)

| Unit | Syllabus Focus | Technical Implementation in CloudOps Sentinel |
|---|---|---|
| **Unit I** | Advanced Cloud & Containers | AWS vs. Azure service parity matrix; Docker Client/Daemon/Registry architecture; full container lifecycle (`Created` $\to$ `Running` $\to$ `Paused` $\to$ `Stopped` $\to$ `Deleted`); scalable case studies (**Netflix** Chaos Engineering, **Amazon** Two-Pizza Teams & Multi-AZ VPC, **Uber** DOMA & Jaeger tracing). |
| **Unit II** | Infrastructure as Code (IaC) | Modular Terraform modules (`vpc`, `ecs_cluster`, `backend`); AWS CloudFormation templates; side-by-side template comparison; emerging tools (**OpenTofu**, **Pulumi**, **Crossplane**, **Policy-as-Code**). |
| **Unit III** | Agile, CI/CD & Delivery | SAFe vs. LeSS scaling Agile frameworks; Test-Driven Development (Go unit tests) & Behavior-Driven Development (Cucumber/Gherkin specifications); 13-stage Jenkins declarative pipeline (`ci/Jenkinsfile`); interactive Canary A/B testing controller (`85% Stable / 15% Canary`); technical debt register. |
| **Unit IV** | Monitoring & Observability | Custom Go Prometheus exporter (`/metrics`); pre-configured Grafana executive dashboards (`:3001`); SRE Four Golden Signals (Latency, Traffic, Errors, Saturation); production alert rules (`HighErrorRate`, `HighLatency`, `ServiceDown`); automated closed-loop rollback recovery. |
| **Unit V** | DevSecOps & Cloud Security | Shift-Left security; Aqua Trivy container CVE scanning; blocking quality gate policy (0 Critical, $\le$ 2 High); RBAC with JWT & Bcrypt; Kubernetes default-deny `NetworkPolicy`; non-root containers; modern software supply chain security (**SLSA Levels 1–4**, **SBOM SPDX/CycloneDX**, **Cosign/Sigstore signing**). |
| **Unit VI** | Cloud-Native & FinOps | Complete 12-Factor App methodology compliance audit (**12/12 Compliant**); Serverless (AWS ECS Fargate/Lambda) vs. Containerized (EKS/EC2) tradeoff matrix; FinOps billing engine (EC2, EKS, RDS, EBS); rightsizing recommendations; budget thresholds; Policy-as-Code compliance auditing. |

---

## 4. Empirical Test Verification & Results

### Backend Unit Tests (100% Pass Rate)
```bash
cd backend && go test ./... -v
```
- `internal/auth`: Token generation, validation, and role extraction pass cleanly.
- `internal/cloud`: AWS SDK v2 local fallback initializes with zero cloud charges.
- `internal/cost`: FinOps service categorization and budget evaluation pass.
- `internal/project`: Data contracts and model validations pass.
- `internal/syllabus`: Syllabus overview, case studies, 12-factor audit, and A/B split controllers pass.

### Frontend Production Build
```bash
cd frontend && npm run build
```
- **Static Page Generation**: All 15 Next.js routes statically compiled without errors.
- **Type Checking**: 0 TypeScript or linting errors.

### End-to-End Lifecycle Verification
```bash
bash tests/e2e/test_lifecycle.sh
```
- Successfully executes 9 verification stages: Health $\to$ Auth $\to$ Projects $\to$ Staging $\to$ Terraform Plan $\to$ Deployment $\to$ Trivy Scan $\to$ Quality Gate $\to$ FinOps Billing.

---

## 5. Local Demonstration Endpoints

| Service | Port | Local Endpoint | Credentials |
|---|---|---|---|
| **Frontend Web Dashboard** | `3000` | `http://localhost:3000` | `admin` / `admin123` |
| **Curriculum Hub** | `3000` | `http://localhost:3000/syllabus` | *(Direct Link in Navigation)* |
| **Core REST API** | `8080` | `http://localhost:8080/api/v1/health` | Bearer JWT |
| **Prometheus Telemetry** | `9090` | `http://localhost:9090` | Open Access |
| **Grafana Dashboards** | `3001` | `http://localhost:3001` | `admin` / `admin` |
| **PostgreSQL 16 DB** | `5432` | `localhost:5432` | `cloudops` / `cloudops_dev_secret` |

---

## 6. Conclusion & Future Roadmap
CloudOps Sentinel successfully fulfills 100% of the academic requirements established in the INT 378 syllabus. By unifying Infrastructure as Code, DevSecOps quality gates, SRE observability, and FinOps cost modeling into an open-source, local-first platform, it demonstrates production-grade software engineering without incurring cloud expenditure.

Future enhancements include:
1. **eBPF Kernel-Level Tracing**: Granular packet and syscall observability without user-space runtime overhead.
2. **AI-Driven Automated Remediation**: LLM-assisted root-cause diagnosis and automated remediation pull requests.
3. **Multi-Region Cross-Cloud Failover**: Dynamic workload evacuation between AWS and Azure during regional outages.

---
*Report certified for submission for INT 378 Evaluation at Lovely Professional University.*
