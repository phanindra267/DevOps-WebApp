# CloudOps Sentinel — REST API Specification

Base URL: `http://localhost:8080/api/v1`

All protected endpoints require an `Authorization: Bearer <JWT>` header obtained via `/login` or `/register`.

---

## 1. Authentication & Identity
| Method | Endpoint | Description | Public / Auth |
|---|---|---|---|
| `POST` | `/api/v1/login` | Login with username and password, returns JWT | Public |
| `POST` | `/api/v1/register` | Register new user account | Public |
| `GET` | `/api/v1/me` | Fetch authenticated user profile and roles | Protected |

### Example Login
```json
POST /api/v1/login
{
  "username": "admin",
  "password": "password"
}

Response (200 OK):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Projects & Environments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects` | List all managed projects |
| `POST` | `/api/v1/projects` | Create a new project |
| `GET` | `/api/v1/projects/{id}` | Retrieve project details |
| `PUT` | `/api/v1/projects/{id}` | Update project metadata |
| `DELETE` | `/api/v1/projects/{id}` | Delete a project and cascading resources |
| `GET` | `/api/v1/projects/{pid}/environments` | List environments (dev, staging, prod) |
| `POST` | `/api/v1/projects/{pid}/environments` | Add an environment |

---

## 3. Infrastructure as Code (IaC)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{pid}/stacks` | List registered Terraform / CFN stacks |
| `POST` | `/api/v1/projects/{pid}/stacks` | Register a new infrastructure stack |
| `POST` | `/api/v1/stacks/{id}/plan` | Trigger simulated Terraform plan |
| `POST` | `/api/v1/stacks/{id}/apply` | Execute Terraform apply and update state |

---

## 4. Delivery & Deployments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{pid}/deployments` | List deployments for project |
| `POST` | `/api/v1/projects/{pid}/deployments` | Trigger rolling deployment |
| `POST` | `/api/v1/deployments/{id}/rollback` | Rollback to prior stable image release |
| `GET` | `/api/v1/deployments/{id}/status` | Check deployment health status |

---

## 5. CI/CD Pipelines
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/projects/{pid}/pipelines` | List pipeline executions |
| `POST` | `/api/v1/projects/{pid}/pipelines` | Trigger 8-stage Jenkins pipeline |
| `GET` | `/api/v1/pipelines/{id}` | Inspect pipeline stage logs |

---

## 6. DevSecOps & Security
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/deployments/{did}/scan` | Trigger vulnerability / container scan |
| `GET` | `/api/v1/deployments/{did}/scans` | List security scans for deployment |
| `GET` | `/api/v1/scans/{id}` | View scan breakdown and CVEs |
| `GET` | `/api/v1/scans/{id}/gate` | Evaluate production quality gate |

---

## 7. Observability & Monitoring
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | System health check (Database ping) |
| `GET` | `/metrics` | Prometheus exposition endpoint |
| `GET` | `/api/v1/alerts` | Active and historical alert records |
| `PUT` | `/api/v1/alerts/{id}/resolve` | Resolve operational incident alert |

---

## 8. Governance & Reliability
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/policies` | Catalog of governance policies |
| `POST` | `/api/v1/projects/{pid}/evaluate` | Evaluate Policy-as-Code against project |
| `GET` | `/api/v1/audit-logs` | Immutable audit trail |
| `GET` | `/api/v1/projects/{pid}/debt` | Technical debt register |
| `GET` | `/api/v1/projects/{pid}/experiments` | Chaos / reliability experiments |

---

## 9. Cost Optimization & Billing Engine (FinOps)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/costs/summary` | Global cloud cost & savings overview across all projects |
| `GET` | `/api/v1/projects/{pid}/costs` | Project-level service cost breakdown (Estimated vs Actual) |
| `GET` | `/api/v1/projects/{pid}/cost-recommendations` | Over-provisioned & idle resource rightsizing recommendations |
| `POST` | `/api/v1/cost-recommendations/{id}/apply` | Execute simulated rightsizing action and adjust spend |
| `GET` | `/api/v1/projects/{pid}/budget` | Monthly budget status, spend percentage & alert thresholds |
| `POST` | `/api/v1/projects/{pid}/budget` | Update monthly budget and alert threshold percent |
| `POST` | `/api/v1/projects/{pid}/simulate-billing` | Run local FinOps cost calculation for project workloads |

> **Note on Billing Integrations:** The codebase in `backend/internal/cost/cost.go` includes fully documented, commented hooks for live AWS Cost Explorer (`GetCostAndUsage`) and Stripe Subscription Invoicing (`invoice.Pay`). In local development mode, costs are deterministically estimated from active IaC stacks, container memory/CPU requests, and database allocations to eliminate recurring cloud fees.
