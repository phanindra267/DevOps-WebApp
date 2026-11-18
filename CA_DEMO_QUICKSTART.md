# INT 378 CA — Working Prototype Quickstart

> Verified 2026-11-18. Everything below runs **locally with Docker**, zero cloud cost.
> The AWS CloudFormation template for the mandatory AWS services is in
> `infrastructure/cloudformation/ca-prototype.yaml`; deployment is blocked by an
> AWS Organizations SCP (see `infrastructure/cloudformation/CA_PROTOTYPE_GUIDE.md`),
> so the same concepts are demonstrated locally.

## 1. Start the stack (one command)

```powershell
docker compose up -d --build
docker compose -f docker-compose.registry.yml up -d
cd infrastructure\terraform\local; terraform apply -auto-approve
```

## 2. What is running (all verified HTTP 200)

| Service | URL | Practical demonstrated |
|---|---|---|
| Next.js dashboard | http://localhost:3000 | Full UI (login: `admin` / `admin123`) |
| Go REST API | http://localhost:8080/api/v1/health | Backend, JWT auth, RBAC, 3 projects |
| PostgreSQL | localhost:5432 | Database + migrations |
| Prometheus | http://localhost:9090 | 4 targets UP (backend, node-exporter, cadvisor, prometheus) |
| Grafana | http://localhost:3001 | `CloudOps Sentinel - Executive Overview` dashboard |
| Node Exporter | http://localhost:9100/metrics | Host CPU/memory/disk metrics |
| cAdvisor | http://localhost:8087/metrics | Container metrics |
| Jenkins | http://localhost:8085 | Job `cloudops-local-pipeline`, build #10 **SUCCESS** |
| Local registry | http://localhost:5000/v2/ | Docker image push/pull lifecycle |
| Terraform Nginx | http://localhost:8088 | VPC/subnet/EC2 simulation via Docker provider |

## 3. Verify everything (copy/paste)

```powershell
# Health of all services
$urls = @('http://localhost:3000','http://localhost:8080/api/v1/health',
  'http://localhost:9090/-/healthy','http://localhost:3001/api/health',
  'http://localhost:9100/metrics','http://localhost:8087/metrics',
  'http://localhost:8085/login','http://localhost:5000/v2/','http://localhost:8088')
foreach ($u in $urls) { try { $r=Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 5; "OK $($r.StatusCode) $u" } catch { "FAIL $u" } }

# Auth + data
$login = Invoke-RestMethod http://localhost:8080/api/v1/login -Method Post -ContentType application/json -Body '{"username":"admin","password":"admin123"}'
Invoke-RestMethod http://localhost:8080/api/v1/projects -Headers @{Authorization="Bearer $($login.token)"}

# Monitoring targets
(Invoke-RestMethod 'http://localhost:9090/api/v1/targets?state=active').data.activeTargets |
  Select-Object @{n='job';e={$_.labels.job}}, health

# Serverless practical (3/3 invocations)
node serverless/local-runtime.js

# Backend tests
cd backend; go test ./...
```

## 4. Practical-to-feature map

| Practical | Where | Evidence |
|---|---|---|
| EC2 / VPC / web server | Terraform Docker provider (public/private bridge networks, Nginx container) | http://localhost:8088, `evidence/terraform/` |
| IAM / MFA / RBAC | Go JWT roles + local TOTP simulator | `practicals/02-iam/`, `evidence/iam/` |
| CloudFormation / IaC | 6 CFN templates + Terraform | `infrastructure/cloudformation/`, `infrastructure/terraform/` |
| Docker | Multi-stage Dockerfiles, registry push/pull | `evidence/registry/` |
| Jenkins CI/CD | Pipeline build #10 SUCCESS | `evidence/jenkins/`, http://localhost:8085 |
| DevSecOps | Trivy FS/image/IaC scans (real findings) | `evidence/security/SUMMARY.md` |
| Prometheus | 4 scrape targets UP | http://localhost:9090 |
| Grafana | Executive dashboard provisioned | http://localhost:3001 |
| Serverless / FinOps | Local Lambda runner + cost simulator | `evidence/serverless/` |

## 5. AWS part (mandatory services, template ready)

`infrastructure/cloudformation/ca-prototype.yaml` provisions VPC, public subnet + IGW,
private subnet + route table, free-tier EC2 (Nginx), and a secure S3 bucket.
Deployment is blocked by SCP `p-6k0fjqz3` (not a code issue). When the org admin
authorizes the actions listed in `CA_PROTOTYPE_GUIDE.md`, run the commands in that
guide to deploy and verify with `aws cloudformation describe-stacks`.
