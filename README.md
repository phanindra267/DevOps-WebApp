# CloudOps Sentinel
> **A Cloud-Native DevSecOps, Infrastructure Automation & Observability Platform**  
> *Submitted by: Kakumani Phaneendra (Reg: 12418953, Section: K202313) — Lovely Professional University*

---

## 🌟 Executive Overview
**CloudOps Sentinel** is an integrated platform for governing the complete cloud-native software engineering lifecycle:
$$\text{Plan} \longrightarrow \text{Commit} \longrightarrow \text{Test} \longrightarrow \text{DevSecOps} \longrightarrow \text{Build} \longrightarrow \text{IaC} \longrightarrow \text{Deploy} \longrightarrow \text{Observe} \longrightarrow \text{Recover} \longrightarrow \text{Govern}$$

The system connects Infrastructure as Code (Terraform & AWS CloudFormation), containerized workloads (Docker & Kubernetes), CI/CD pipelines (Jenkins), security vulnerability gates (Trivy & Policy-as-Code), observability telemetry (Prometheus & Grafana), failure recovery, and compliance tracking into a centralized, modern web dashboard.

---

## 📁 Repository Structure

```
cloudops-sentinel/
├── backend/                       # Go REST API (Modular Monolith)
│   ├── cmd/server/main.go         # API Server entry point & routing
│   ├── internal/
│   │   ├── auth/                  # JWT auth, RBAC middleware, password hashing
│   │   ├── cost/                  # FinOps local billing engine & cost recommendations
│   │   ├── db/                    # PostgreSQL pool & automated migrations
│   │   ├── deployment/            # Rolling deployments & zero-downtime rollback
│   │   ├── environment/           # Multi-tier environment management
│   │   ├── governance/            # Policy-as-code & immutable audit trail
│   │   ├── infra/                 # Terraform & CloudFormation execution engine
│   │   ├── middleware/            # CORS & request pipeline
│   │   ├── models/                # Database entities and data contracts
│   │   ├── monitor/               # Prometheus instrumentation & alerts engine
│   │   ├── pipeline/              # Jenkins CI/CD pipeline automation
│   │   ├── project/               # Project management CRUD
│   │   ├── reliability/           # Chaos engineering & technical debt tracker
│   │   └── security/              # DevSecOps scans & quality gates
│   ├── Dockerfile                 # Multi-stage optimized Go build
│   └── go.mod / go.sum            # Go 1.22 dependencies
│
├── frontend/                      # Next.js 14 + TypeScript Dashboard UI
│   ├── pages/
│   │   ├── index.tsx              # Executive operational dashboard
│   │   ├── login.tsx              # Secure authentication & sign-up
│   │   ├── projects/              # Project list & detailed tabs view
│   │   ├── infrastructure.tsx     # IaC stacks & Terraform/CFN comparison
│   │   ├── deployments.tsx        # Container deployment & rollback center
│   │   ├── pipelines.tsx          # CI/CD pipeline executions & live log streams
│   │   ├── security.tsx           # DevSecOps scans & CVE quality gates
│   │   ├── monitoring.tsx         # Telemetry metrics & alert incident resolution
│   │   ├── cost.tsx               # FinOps cost optimization, budgets & rightsizing
│   │   ├── governance.tsx         # Governance policies & audit trail
│   │   └── reliability.tsx        # Failure experiments & tech debt register
│   ├── src/
│   │   ├── components/            # Reusable Cards, Tables, Modals, Status Badges
│   │   ├── context/               # AuthProvider & session management
│   │   └── lib/api.ts             # Axios API client with automatic JWT bearer injection
│   ├── styles/globals.css         # Modern DevOps dark theme
│   └── Dockerfile                 # Containerized Next.js runner
│
├── infrastructure/
│   ├── terraform/                 # Multi-environment reusable IaC modules
│   │   ├── modules/ (vpc, ecs_cluster, backend)
│   │   └── envs/ (dev, prod with variables & tfvars)
│   └── cloudformation/            # AWS-native CloudFormation templates (VPC, ECS)
│
├── kubernetes/                    # Declarative Kubernetes Manifests
│   ├── namespace.yaml             # Dedicated `cloudops-sentinel` namespace
│   ├── configmap.yaml             # Non-sensitive configuration
│   ├── secret.yaml                # Encrypted database & JWT secrets
│   ├── deployment.yaml            # Backend deployment with liveness/readiness probes
│   ├── service.yaml               # Backend ClusterIP service
│   ├── frontend-deployment.yaml   # Frontend dashboard deployment
│   ├── frontend-service.yaml      # NodePort frontend service
│   ├── postgres-deployment.yaml   # Stateful PostgreSQL workload
│   ├── postgres-service.yaml      # PostgreSQL service
│   ├── hpa.yaml                   # Horizontal Pod Autoscaler (CPU/Memory scaling)
│   └── networkpolicy.yaml         # Least-privilege zero-trust pod isolation
│
├── ci/
│   └── Jenkinsfile                # 13-stage declarative DevSecOps delivery pipeline
│
├── monitoring/
│   ├── prometheus.yml             # Prometheus scrape configuration
│   ├── alert_rules.yml            # Actionable alerting rules (Latency, 5xx, Down)
│   ├── grafana-datasources.yml    # Auto-provisioned Prometheus datasource
│   ├── grafana-dashboards.yml     # Automated dashboard loader
│   └── grafana-dashboard.json     # Pre-configured CloudOps executive dashboard
│
├── security/
│   ├── trivy-config.yaml          # Vulnerability scanner configuration
│   └── security-policy.yaml       # Strict DevSecOps quality gate policy
│
├── scripts/
│   └── init-db.sh                 # Database DDL schema & seed initialization
│
├── tests/
│   └── e2e/test_lifecycle.sh      # Automated end-to-end integration lifecycle test
│
├── docs/
│   ├── API.md                     # REST API reference documentation
│   └── ARCHITECTURE.md            # System architecture & lifecycle specifications
│
└── docker-compose.yml             # Complete 5-service local orchestration stack
```

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24+ with Compose v2+)
- [Node.js](https://nodejs.org/) (v18+)
- [Go](https://go.dev/) (v1.22+)

### Step 1: Launch the Platform Stack
Start Docker Desktop on your machine, then run:
```bash
docker compose up -d --build
```

This starts all five platform containers:
| Service | Container Name | Local Port | URL |
|---|---|---|---|
| **Frontend UI** | `cloudops-frontend` | `3000` | [http://localhost:3000](http://localhost:3000) |
| **Backend REST API** | `cloudops-backend` | `8080` | [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) |
| **PostgreSQL Database** | `cloudops-postgres` | `5432` | `localhost:5432` |
| **Prometheus Telemetry**| `cloudops-prometheus` | `9090` | [http://localhost:9090](http://localhost:9090) |
| **Grafana Dashboards** | `cloudops-grafana` | `3001` | [http://localhost:3001](http://localhost:3001) |

---

### Step 2: Accessing the Dashboard & Default Credentials
1. Open **[http://localhost:3000](http://localhost:3000)** in your browser.
2. Sign in with the pre-seeded credentials:
   - **Username**: `admin`
   - **Password**: `admin123`
   *(Or click "Register" on the login screen to create a new user profile)*.
3. Access pre-configured Grafana metrics at **[http://localhost:3001](http://localhost:3001)** (`admin` / `admin`).

---

## 🧪 Automated Testing & Verification

### Run Backend Unit Tests
```bash
cd backend
go test ./... -v
```
*Output: All authentication, JWT generation, and project handlers pass cleanly.*

### Verify Frontend Production Build
```bash
cd frontend
npm run build
```
*Output: Next.js statically renders all 14 application routes with zero type errors.*

### Run End-to-End DevSecOps & FinOps Lifecycle Test
```bash
bash tests/e2e/test_lifecycle.sh
```
*Executes a 9-stage automated verification: health check → JWT authentication → project creation → staging environment → Terraform IaC plan & apply → container deployment → DevSecOps CVE scan → quality gate evaluation → FinOps cost simulation & budget check.*

---

## 🎓 Academic Syllabus Mapping (INT 378)

| Unit | Syllabus Domain | Platform Implementation |
|---|---|---|
| **Unit I** | Advanced Cloud Infrastructure & Services | Multi-tier architecture, VPC networking, containerized microservices, Docker & Docker Hub workflow. |
| **Unit II** | Infrastructure as Code | Modular Terraform modules (VPC, ECS), environment isolation (`dev`/`prod`), AWS CloudFormation side-by-side comparison. |
| **Unit III** | Agile / CI/CD Delivery | 13-stage Jenkins declarative pipeline (`ci/Jenkinsfile`), automated test runs, container builds, zero-downtime rollbacks. |
| **Unit IV** | Monitoring & Observability | Prometheus custom metrics (`/metrics`), actionable alerts (`alert_rules.yml`), interactive Grafana dashboard (`:3001`). |
| **Unit V** | DevSecOps & Cloud Security | Role-based access control (RBAC), JWT authentication, Bcrypt hashing, Trivy scanning rules, blocking quality gates. |
| **Unit VI** | Cloud-Native, Reliability & Cost | Kubernetes manifests (Deployment, HPA, NetworkPolicy), chaos engineering simulations, FinOps local cost optimization engine. |

---

## ⚖️ Cost Optimization & Billing Implementation
- **Local FinOps Engine (`backend/internal/cost/cost.go`)**: Deterministically estimates workload cost from active IaC resources, container requests/limits, and database instances. Supports budget thresholds, utilization analytics, idle resource detection, and rightsizing actions.
- **External Billing / Payment Gateway Hooks**: The real external API calls (e.g. AWS Cost Explorer API `GetCostAndUsage` and Stripe Payment Invoicing `invoice.Pay`) are provided as detailed commented code blocks in `backend/internal/cost/cost.go` so evaluators can inspect the cloud-provider implementation without incurring real cloud or credit card charges during local demonstration.
- **Pull Request Automation**: Kept manual/local-first without requiring external git webhooks.
- **Local-First Execution**: The platform is self-contained and demonstratable locally.
