# CloudOps Sentinel — 100% Local Execution & Verification Guide
**INT 378 · Session 2026–27 · Kakumani Phaneendra (12418953, LPU)**

> This project runs **entirely on the local machine**. No AWS account, credentials,
> cloud resources, paid API, or external AI service is used anywhere in the
> execution path. AWS services are represented by genuine open-source local
> equivalents; the mapping is stated explicitly for every practical.

---

## 1. What is actually running (verified)

All services are Docker containers on the local engine. Verified with
`docker compose ps`, `curl`/`Invoke-WebRequest`, Prometheus target API and
Grafana API.

| Service | Local address | Verification |
|---|---|---|
| Next.js dashboard | http://localhost:3000 | HTTP 200 |
| Go REST API | http://localhost:8080/api/v1/health | `200 {"status":"healthy","database":true}` |
| PostgreSQL 16 | localhost:5432 | container healthy; migrations applied |
| Prometheus | http://localhost:9090 | `/api/v1/targets` → 4 targets `up` |
| Node Exporter | http://localhost:9100 | `/metrics` → 128 `node_cpu_seconds_total` series |
| cAdvisor | http://localhost:8087 | `/metrics/` → 200 |
| Grafana | http://localhost:3001 | dashboard `cloudops-overview` provisioned |
| Jenkins | http://localhost:8085 | job `cloudops-local-pipeline`, **build #10 SUCCESS**, admin/admin123 |
| Terraform Nginx web server | http://localhost:8088 | HTTP 200, `TF-LOCAL-WEBSERVER-OK` marker |
| Local Docker registry | http://localhost:5000/v2/ | `200 {}`, catalog has 2 repos |

Start everything:

```powershell
docker compose up -d --build
docker compose -f docker-compose.registry.yml up -d
cd infrastructure/terraform/local; terraform apply -auto-approve
powershell -ExecutionPolicy Bypass -File scripts\jenkins_setup.ps1
```

---

## 2. Practical-by-practical mapping and evidence

| # | Practical | Local implementation (real) | AWS concept simulated | Evidence |
|---|---|---|---|---|
| 1 | EC2 / VPC / Web server | Terraform Docker-provider config provisions two bridge networks (`tf-local-public`, `tf-local-private`), a volume, an Nginx image and `tf-local-webserver` on host port 8088. | VPC/subnet → Docker network; EC2 → container; SG → segmentation; public IP → port mapping; EBS → volume | `evidence/terraform/` |
| 2 | IAM / MFA / RBAC | Python stdlib TOTP (RFC 6238) simulator with users/groups/roles, permission boundaries, role switching and audit log. Go backend enforces JWT role gates on all mutating routes. | IAM user/group/policy → local principal/role/permission; virtual MFA → TOTP; AssumeRole → MFA-gated role switch | `evidence/iam/` |
| 3 | CloudFormation & IaC | Four syntactically valid CFN templates kept for comparison; Terraform is the executable local IaC. No AWS calls are made from templates. | CFN stack → Terraform config; template validation → `terraform validate` | `infrastructure/cloudformation/`, `evidence/terraform/` |
| 4 | Docker containerization | Multi-stage Dockerfiles, Compose stack, local `registry:2` on :5000 with real tag → push → remove → pull → run → catalog lifecycle. | Docker Hub/ECR → localhost:5000 | `evidence/registry/`, `scripts/local_registry_lifecycle.ps1` |
| 5 | Terraform local infrastructure | `kreuzwerker/docker` provider, real `init / validate / plan / apply / state`, 8 resources applied. | `hashicorp/aws` provider → Docker provider | `evidence/terraform/terraform_run.txt` |
| 6 | Jenkins CI/CD | Custom Jenkins image with Docker CLI + pipeline plugins; Scripted Pipeline job runs checkout, Go tests, Trivy scan, image build, health check and Terraform validate — **build #10 SUCCESS**. | Jenkins on EC2 → Jenkins container; webhook → local job trigger | `scripts/jenkins_setup.ps1`, `evidence/jenkins/SUMMARY.md`, `evidence/jenkins/build_console.txt` |
| 7 | DevSecOps | Trivy v0.76.2 (local binary) executed FS, image and IaC scans; JSON + TXT reports and honest summary. | Trivy/ECR scan → identical local Trivy invocation | `evidence/security/` |
| 8 | Prometheus monitoring | Go `/metrics` exporter plus Node Exporter :9100 and cAdvisor :8087; alert rules loaded; all four scrape targets UP. | CloudWatch metrics/agent → Prometheus + exporters | `monitoring/`, `evidence/screenshots/05,06,11,12` |
| 9 | Grafana dashboards | Datasource and `cloudops-overview` dashboard file-provisioned; HTTP API confirms dashboard exists. | CloudWatch dashboards → Grafana | `monitoring/grafana-*`, `evidence/screenshots/07` |
| 10 | Lambda + cost | Node local Lambda/API-Gateway runtime executes the real handler 3× (cold + warm) with structured logs; offline cost simulator produces **labelled local estimate**. | Lambda/API Gateway/CloudWatch → Node runner; Cost Explorer → offline model | `evidence/serverless/` |

The repo's 11 "syllabus" experiments map to these 10 practicals by merging
experiment 10 (serverless) and 11 (FinOps) into required practical 10.

---

## 3. Verification commands and real results

```powershell
# Go unit tests — all packages PASS
cd backend; go test ./...

# API health
curl http://localhost:8080/api/v1/health

# Prometheus target health
curl http://localhost:9090/api/v1/targets?state=active

# Terraform (8 resources applied)
cd infrastructure/terraform/local; terraform validate; terraform plan; terraform apply -auto-approve

# Security scans (real findings)
powershell -File security\run_trivy_scan.ps1

# Serverless (3/3 HTTP 200)
node serverless\local-runtime.js
node serverless\local_cost_simulator.js

# Local registry lifecycle
powershell -File scripts\local_registry_lifecycle.ps1

# IAM/MFA/RBAC demo
python practicals\02-iam\iam_local.py
python practicals\02-iam\totp_demo.py

# Screenshots of the running stack
powershell -File scripts\capture_screenshots.ps1
node scripts\cdp_screenshot.js <jwt-file> evidence\screenshots
```

### Measured outcomes
- Go tests: **all packages PASS**
- RBAC: admin GET/POST 200/201, viewer GET 200, viewer POST/PUT **403**, anonymous POST **401**
- TOTP: deltas −1/0/+1 accepted, bogus rejected; 15 audit events, 4 DENIED
- Terraform: `8 added, 0 changed, 0 destroyed`; web endpoint HTTP 200
- Trivy: FS **4 critical / 43 high**, image **0 critical / 39 high**, IaC **2 critical / 9 high**
- Jenkins: **6/6 stages executed, build #10 SUCCESS** (`Finished: SUCCESS` in console)
- Lambda: **3/3 invocations HTTP 200** (cold 2.06 ms, warm 0.05 / 0.03 ms)
- Cost simulator: **$204.87 → $113.12 / mo, saving $91.76 (44.8%)** — local estimate only

---

## 4. Honest limitations

- No AWS account or credentials were used; all "AWS" behaviour is local emulation.
- CloudFormation templates are reference artifacts; no local CFN emulator was deployed.
- VirtualBox desktops and RDP were not used — containers provide the compute simulation.
- SonarQube was not installed; Trivy covers filesystem, dependency, image and IaC scanning.
- Alertmanager is not deployed; Prometheus alert rules are defined but do not notify.
- The Trivy quality gate currently **fails** on real findings — the failures are
  documented, not hidden.
- A few backend endpoints (pipeline log generation, governance scoring) remain
  in-memory simulations; they are not represented as real external integrations.
- Cost figures are illustrative local estimates, **not actual AWS billing**.

---

## 4b. Premium UI (Session 2026–27)

The complete 11-page interface was redesigned project-wide: shared glass/dark
design system, Framer Motion page transitions and reveals, collapsible desktop
sidebar and a true mobile drawer, command palette (Ctrl/⌘+K), toasts, tooltips,
animated modals, upgraded tables with search/sort/pagination/CSV export, and
Recharts visualisations driven by real local data. No external font CDN is used.

- Design & verification: `docs/UI_DESIGN_GUIDE.md`
- Real desktop + mobile screenshots: `evidence/ui/`
- Browser verification report: `evidence/ui/ui_report.json`
- Reproduction: `node scripts/verify_ui.js <jwt-file> evidence/ui`
- TypeScript check: `cd frontend; npx tsc --noEmit` → clean

The dashboard's "quick actions" open real modules rather than printing simulated
success messages. Telemetry charts are populated from genuine Prometheus samples
written through the API by `scripts/seed_local_metrics.ps1`.

## 5. Deliverables index

- Source: `backend/`, `frontend/`, `serverless/`, `infrastructure/`, `kubernetes/`, `monitoring/`, `security/`
- Runtime: `docker-compose.yml`, `docker-compose.registry.yml`, `ci/Dockerfile`, `ci/Jenkinsfile`
- Automation: `scripts/` (Terraform, CloudFormation, Jenkins, registry, screenshots, security)
- Evidence: `evidence/terraform/`, `evidence/iam/`, `evidence/security/`, `evidence/serverless/`, `evidence/registry/`, `evidence/jenkins/`, `evidence/screenshots/`
- Documentation: `README.md`, `docs/PROJECT_REPORT.md`, `docs/ARCHITECTURE.md`, `docs/API.md`, `docs/VIVA_DEFENSE_GUIDE.md`, `docs/UI_DESIGN_GUIDE.md`, this guide
- Presentations:
  - `CloudOps_Sentinel_ChapWise_2026-27.pptx` — **new chapter-wise syllabus deck** (38 slides, 6 chapters in exact order, shape-drawn diagrams, fade transitions)
  - `CloudOps_Sentinel_INT378_Presentation_FINAL.pptx` — earlier project/evidence deck (25 slides)
