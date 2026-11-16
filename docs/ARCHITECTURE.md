# CloudOps Sentinel — System Architecture

CloudOps Sentinel is a cloud-native DevSecOps, infrastructure automation, and observability platform designed as a modular monolith exposing a high-performance REST API.

---

## 1. High-Level Architecture (Figure 2)

```
+-----------------------------------------------------------+
|              Web Dashboard (Next.js / TypeScript)          |
|              Port 3000                                    |
+-----------------------------+-----------------------------+
                              | REST / HTTP / WebSocket
                              v
+-----------------------------------------------------------+
|               Go REST API (Modular Monolith)              |
|               Port 8080                                   |
|                                                           |
|  [ Auth & RBAC ]    [ Projects & Envs ]   [ IaC Engine ]  |
|  [ Deployments ]    [ DevSecOps Gate ]    [ Monitoring ]  |
|  [ Governance  ]    [ Reliability     ]   [ Prometheus ]  |
+---------+-------------------+--------------------+--------+
          |                   |                    |
          v                   v                    v
+-------------------+ +------------------+ +----------------+
|    PostgreSQL 16  | | Terraform / CFN  | | Kubernetes API |
|    Port 5432      | | (AWS Provider)   | | Orchestration  |
+-------------------+ +------------------+ +----------------+
          ^                   ^                    ^
          |                   |                    |
+---------+---------+ +-------+----------+         |
| Prometheus (9090) | | Grafana (3001)   | <-------+
+-------------------+ +------------------+
```

---

## 2. End-to-End DevSecOps Lifecycle (Figure 1 & 3)

```
[ DEVELOP ] ──> [ COMMIT ] ──> [ UNIT TESTS ] ──> [ STATIC ANALYSIS ]
                                                          │
    ┌─────────────────────────────────────────────────────┘
    ▼
[ CONTAINER SCAN ] ──> [ QUALITY GATE ] ──> [ DOCKER BUILD ] ──> [ IaC PROVISION ]
                              │
                    (Block if Critical)
                              │
    ┌─────────────────────────┘
    ▼
[ KUBERNETES DEPLOY ] ──> [ HEALTH CHECK ] ──> [ PROMETHEUS OBSERVE ] ──> [ RECOVERY ]
```

---

## 3. Technology Stack Alignment

| Layer | Technologies Selected |
|---|---|
| **User Interface** | Next.js 14, React 18, TypeScript, Responsive CSS3 Dark Theme |
| **Backend API** | Go 1.22+, Gorilla Mux, Golang JWT v5, Bcrypt |
| **Data Layer** | PostgreSQL 16 Alpine, Connection Pooling |
| **IaC** | Terraform (HCL) & AWS CloudFormation (YAML) |
| **Containers & Orchestration** | Docker, Docker Compose, Kubernetes 1.28+, HPA |
| **CI/CD** | Jenkins Declarative Pipeline (13 stages) |
| **Observability** | Prometheus (metrics scraping), Grafana (dashboards) |
| **Security Gates** | Trivy vulnerability scanner, RBAC, least privilege, audit log |

---

## 4. Local-First Engineering Guarantee
The architecture executes locally via Docker Compose without requiring paid cloud subscriptions. Optional cloud deployment targets Amazon Web Services (AWS) using the provided Terraform modules and CloudFormation templates.

---

## 5. Academic Syllabus Integration (INT 378 Units I - VI)

| Unit | Syllabus Domain | Platform Implementation & Live Demonstrator |
|---|---|---|
| **Unit I** | Advanced Cloud Infrastructure & Services | • **AWS vs. Azure**: Enterprise service parity matrix.<br>• **Containerization**: Docker Architecture (Client, Daemon, Engine) & Lifecycle state machine (`Created` $\to$ `Running` $\to$ `Paused` $\to$ `Stopped` $\to$ `Deleted`).<br>• **Case Studies**: **Netflix** (Chaos Engineering / Simian Army), **Amazon** (Two-Pizza Teams & Multi-AZ VPCs), and **Uber** (DOMA architecture & Jaeger tracing). |
| **Unit II** | Infrastructure as Code (IaC) | • **Terraform & AWS CloudFormation**: Modular VPC/ECS infrastructure.<br>• **IaC Comparison**: Syntax, state management, portability, and drift detection.<br>• **Future Trends & Emerging Tools**: OpenTofu, Pulumi, Crossplane, AWS CDK, and Policy-as-Code (OPA). |
| **Unit III** | Agile & CI/CD for Scalable Product Development | • **Scaling Agile**: SAFe (Agile Release Trains) vs. LeSS (Single Backlog) framework comparison.<br>• **TDD & BDD**: Test-driven Go suites and executable Cucumber/Gherkin specifications (`Given-When-Then`).<br>• **A/B Testing & Canary**: Dynamic traffic split controller with real-time conversion telemetry.<br>• **Technical Debt**: Priority-ranked debt tracking register & 13-stage Jenkins delivery pipeline. |
| **Unit IV** | Monitoring & Observability | • **Prometheus & Grafana**: Time-series telemetry scraping, custom middleware, and provisioned executive dashboards.<br>• **Four Golden Signals**: Latency, Traffic, Errors, and Saturation.<br>• **Actionable Alerting**: Automated rules (`HighErrorRate`, `HighLatency`, `ServiceDown`) with recovery workflows.<br>• **Advanced Observability**: Prometheus federation and Thanos/Cortex long-term retention. |
| **Unit V** | DevSecOps & Cloud Security | • **Shift-Left Security**: Secret scanning, dependency audits, and Trivy CVE container vulnerability scans.<br>• **Quality Gates**: Automated threshold-enforced deployment blocking.<br>• **Cloud & K8s Security**: RBAC, JWT, least-privilege IAM, non-root users, and zero-trust `NetworkPolicy`.<br>• **Emerging Security Trends**: SLSA Provenance (Levels 1-4), SBOM generation (SPDX/CycloneDX), and Cosign/Sigstore image signing. |
| **Unit VI** | Cloud-Native Development & Optimization | • **12-Factor App Methodology**: 100% compliant interactive 12-factor audit scorecard.<br>• **Serverless vs. Containers**: AWS Lambda/Fargate vs. EKS/EC2 cost break-even and performance curves.<br>• **FinOps & Cost Optimization**: Automated rightsizing, idle resource deallocation, and local billing engine with AWS Cost Explorer & Stripe hooks.<br>• **Governance & Auditing**: Policy-as-Code engine and immutable compliance audit log trails. |

