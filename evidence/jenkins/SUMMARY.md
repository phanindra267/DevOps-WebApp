# Jenkins CI/CD — Local Pipeline Evidence (INT 378)

**Job:** `cloudops-local-pipeline` · **URL:** http://localhost:8085/job/cloudops-local-pipeline/
**Credentials:** `admin` / `admin123` (local Jenkins bootstrap)
**Final build:** #10 — **SUCCESS** (duration ~140 s)
**Raw console:** `evidence/jenkins/build_console.txt`

## What is genuinely executed

| Stage | Real command / action | Result |
|---|---|---|
| 1. Checkout | `git clone --quiet /workspace $WORKSPACE/src` (repo bind-mounted into Jenkins) | CHECKOUT_OK |
| 2. Unit Tests | `docker run ... golang:1.24-alpine go test ./...` with host Go module cache mounted and `GOPROXY=off` | all packages `ok` |
| 3. DevSecOps Scan | `docker run ... aquasec/trivy:latest fs --skip-db-update --scanners vuln --exit-code 0 ... /src` | real CVE table emitted |
| 4. Docker Build | `docker build -t int378-backend-jenkins:local /workspace/backend` | image ID `49d8bca32d56`, tagged OK |
| 5. Deploy Health | `curl -fsS http://backend:8080/api/v1/health` | HTTP 200 JSON |
| 6. IaC Validate | `docker run --entrypoint sh hashicorp/terraform:1.16.1 -c '... terraform init ... && terraform validate'` | `Success! The configuration is valid.` |

`Finished: SUCCESS` is present in the captured console output.

## Set-up that made it real

- `ci/Dockerfile` — extends `jenkins/jenkins:lts-alpine`, adds Docker CLI, curl, git, bash.
- `docker-compose.yml` — Jenkins mounts the repo at `/workspace` and `/var/run/docker.sock`.
- Pipeline plugins installed with Jenkins' own `jenkins-plugin-cli` (workflow-job, workflow-cps,
  workflow-basic-steps, git, pipeline-model-definition).
- `scripts/jenkins_setup.ps1` — creates/updates the job through the Jenkins REST API with a
  CSRF crumb and triggers a build. Re-run it to reproduce.

## Notes / limitations

- Docker paths differ by context: `-v` uses a host path; the build context uses the
  in-container path `/workspace/backend`. This is recorded in the script.
- Earlier attempts failed (missing plugins, wrong path form, TLS to Go proxy, Terraform
  entrypoint). Each failure was diagnosed and fixed; the final build is green.
- Trivy uses `--exit-code 0` in the pipeline so the build reports findings without
  failing; the standalone scan in `evidence/security/` applies the real policy gate and
  honestly reports that the gate currently fails.
- No AWS, credentials, external CI service or paid API was used.
