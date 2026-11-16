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
