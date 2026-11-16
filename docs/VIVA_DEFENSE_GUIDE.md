# INT 378: Comprehensive Viva Voce Defense & Examiner Q&A Guide
> **Platform**: CloudOps Sentinel  
> **Candidate**: Kakumani Phaneendra (Reg: 12418953, Section: K202313) — Lovely Professional University  
> **Course**: INT 378 (Advanced Cloud Infrastructure, DevSecOps & FinOps)

---

## 🌟 Top 15 Expected Examiner Questions & Model Answers

### Question 1: Why did you choose a Modular Monolith in Go rather than distributed microservices for your control plane?
**Model Answer:**
> "We selected a modular monolith in Go 1.22 for our central control plane to achieve sub-millisecond in-process function invocation, zero network serialization latency, and simplified deployment without the operational overhead of managing distributed service discovery or mesh proxies. 
> 
> However, our architecture enforces strict domain isolation: each module (`auth`, `infra`, `deployment`, `pipeline`, `security`, `cost`, `monitor`, `governance`) has dedicated boundaries and communicates via well-defined data contracts. When workload demand requires it, any module can be extracted into an independent microservice container with zero refactoring."

---

### Question 2: How does your platform ensure zero cloud costs while demonstrating enterprise AWS SDK v2 workflows?
**Model Answer:**
> "In `backend/internal/cloud/aws.go`, we engineered a three-tier execution hierarchy:
> 1. **Live AWS SDK v2 Client**: Uses standard AWS credentials when available.
> 2. **LocalStack Emulation**: Targets `http://localhost:4566` for local AWS service mocking.
> 3. **In-Memory Fallback Guardrail**: If neither is reachable, all S3 artifact uploads and CloudWatch metrics execute safely in-memory with zero network calls and strict cost guardrails that prevent any paid EC2 or RDS instances from ever being provisioned.
> 
> Similarly, our FinOps engine (`backend/internal/cost/cost.go`) estimates EC2 and RDS pricing locally inside PostgreSQL, keeping external AWS Cost Explorer and Stripe payment calls as commented reference hooks."

---

### Question 3: How does your DevSecOps Shift-Left Quality Gate work, and what happens when a vulnerability is found?
**Model Answer:**
> "Shift-Left means identifying vulnerabilities as early in the delivery lifecycle as possible. In our 13-stage Jenkins pipeline (`ci/Jenkinsfile`), stage 7 executes Aqua Trivy to scan both OS package layers and Go dependencies. 
> 
> Stage 9 evaluates our security policy (`security/security-policy.yaml`). If the critical CVE count exceeds 0, or high CVEs exceed 2, the pipeline trips the quality gate, logs the finding to PostgreSQL, and immediately terminates with a non-zero exit code. This blocks the image from ever being pushed to the container registry or deployed to Kubernetes."

---

### Question 4: What is the architectural difference between HashiCorp Terraform and AWS CloudFormation in your platform?
**Model Answer:**
> "We provide side-by-side comparison in `frontend/pages/infrastructure.tsx`:
> - **Syntax**: Terraform uses HashiCorp Configuration Language (HCL), which is concise and composable. CloudFormation uses standard YAML/JSON templates.
> - **Cloud Portability**: Terraform is multi-cloud (AWS, Azure, GCP, Kubernetes), whereas CloudFormation is tightly coupled to AWS.
> - **State Management**: Terraform uses explicit remote state files (`terraform.tfstate`) that require locking (e.g. S3 + DynamoDB or PostgreSQL). CloudFormation automatically manages state internally within the AWS service.
> - **Drift Detection**: Terraform detects drift via `terraform plan -refresh-only`, whereas CloudFormation provides a native drift detection API."

---

### Question 5: How does your platform handle zero-downtime rolling deployments and failure recovery?
**Model Answer:**
> "Deployments are managed in `backend/internal/deployment/deployment.go` following Kubernetes rolling update principles:
> 1. New container pods are started alongside old pods (`maxSurge=1`).
> 2. Kubernetes readiness and liveness probes verify HTTP `/api/v1/health` responses.
> 3. Traffic is gradually cut over to the new pods only when healthy.
> 4. If health checks fail or Prometheus fires a `ServiceDown` or `HighErrorRate` alert, our platform automatically triggers `/deployments/{id}/rollback`, restoring the previous known-healthy container image without downtime."

---

### Question 6: What are the SRE Four Golden Signals, and how are they collected in CloudOps Sentinel?
**Model Answer:**
> "The Four Golden Signals from the Google SRE handbook are:
> 1. **Latency**: Time to service requests, collected via `http_request_duration_seconds` histogram buckets.
> 2. **Traffic**: Demand on the system, measured via `http_requests_total` counter.
> 3. **Errors**: Failure rate, tracked via HTTP 5xx status codes against total requests.
> 4. **Saturation**: Utilization of constrained resources, such as CPU and Memory.
> 
> Our Go backend uses Prometheus `client_golang` middleware to intercept all HTTP traffic and export standard metrics on `/metrics`. Prometheus scrapes these every 15 seconds, and Grafana visualizes them on port 3001."

---

### Question 7: How is Kubernetes Zero-Trust network security implemented in your manifests?
**Model Answer:**
> "In `kubernetes/networkpolicy.yaml`, we enforce a default-deny ingress posture:
> - Frontend pods can accept ingress traffic from external clients on port 3000.
> - Backend API pods accept ingress **only** from pods bearing the label `app.kubernetes.io/component: frontend` on port 8080.
> - PostgreSQL database pods accept ingress **only** from pods bearing the label `app.kubernetes.io/component: backend` on port 5432.
> 
> This ensures that if a frontend container is compromised, the attacker cannot pivot directly to the database, enforcing least-privilege zero-trust network segmentation."

---

### Question 8: Explain how CloudOps Sentinel achieves 100% compliance with the 12-Factor App methodology.
**Model Answer:**
> "We verified all 12 factors in `frontend/pages/syllabus.tsx`:
> - **I. Codebase**: One Git repository with multi-environment deployment branches.
> - **II. Dependencies**: Declared in `go.mod` and `package-lock.json` with strict lockfiles.
> - **III. Config**: Stored in environment variables (`os.Getenv`), ConfigMaps, and Secrets.
> - **IV. Backing Services**: Database, S3, and Prometheus attached via network URLs.
> - **V. Build/Release/Run**: Multi-stage Docker builds separating compilation from runtime.
> - **VI. Processes**: Stateless Go server and Next.js frontend; persistent state in Postgres.
> - **VII. Port Binding**: Self-contained HTTP listeners on `:8080` and `:3000`.
> - **VIII. Concurrency**: Scaled horizontally via Kubernetes Horizontal Pod Autoscaler (HPA).
> - **IX. Disposability**: Sub-2-second container boot time and graceful SIGTERM handling.
> - **X. Dev/Prod Parity**: Identical Docker containers and Terraform modules (`envs/dev` & `envs/prod`).
> - **XI. Logs**: Event streaming to stdout/stderr.
> - **XII. Admin Tasks**: Automated database schema migrations run at bootstrap via `db.Init()`."

---

### Question 9: What is the difference between SAFe and LeSS in scaling Agile?
**Model Answer:**
> "- **SAFe (Scaled Agile Framework)**: Designed for large enterprises (500–5000+ engineers). It coordinates multiple **Agile Release Trains (ARTs)** of 50–125 people on a synchronized 8–12 week **Program Increment (PI)** cadence, with formal portfolio budgeting and architecture runaways.
> - **LeSS (Large-Scale Scrum)**: Designed for organizations seeking lean scaling with minimal management overhead. Multiple cross-functional teams pull work from a **single Product Backlog** managed by one Product Owner, sharing common sprint start/end dates and sprint reviews."

---

### Question 10: How does your A/B Testing & Canary traffic controller work?
**Model Answer:**
> "Our Canary controller (`/api/v1/syllabus/ab-test`) routes production traffic between:
> - **Variant A (Stable)**: Standard rolling deployment (e.g. 85% traffic).
> - **Variant B (Canary Candidate)**: New release candidate (e.g. 15% traffic).
> 
> In `frontend/pages/syllabus.tsx`, users can interactively adjust the traffic allocation slider (`/ab-test/split`). The system tracks conversion rate and error rate telemetry in real-time, allowing automated promotion to 100% or instant rollback if anomalies are observed."

---

### Question 11: How does your FinOps engine compute rightsizing recommendations?
**Model Answer:**
> "Our FinOps engine (`backend/internal/cost/cost.go`) follows the FinOps Foundation's **Inform $\to$ Optimize $\to$ Operate** framework:
> 1. **Inform**: Aggregates resource costs across compute, storage, and databases.
> 2. **Optimize**: Analyzes historical utilization metrics. If an EC2 instance or container has averaged < 10% CPU and memory over 14 days, the engine flags it as oversized and calculates potential monthly dollar savings by downsizing (e.g., from `t3.large` to `t3.medium`).
> 3. **Operate**: Users can apply recommendations with a single click, updating the resource allocation and tracking budget thresholds."

---

### Question 12: What are SLSA, SBOM, and Cosign, and why are they considered emerging security trends?
**Model Answer:**
> "They represent modern **Software Supply Chain Security**:
> - **SLSA (Supply-chain Levels for Software Artifacts)**: A security framework establishing levels 1 through 4 to prevent source code tampering and guarantee build provenance.
> - **SBOM (Software Bill of Materials)**: A machine-readable inventory (SPDX or CycloneDX) of all open-source packages, libraries, and licenses in a build, enabling instant cross-referencing when new zero-day CVEs emerge.
> - **Cosign / Sigstore**: Cryptographically signs container images using OIDC identity tokens (keyless signing) so Kubernetes admission controllers can reject any untrusted image before execution."

---

### Question 13: How does your platform incorporate architectural lessons from Netflix, Amazon, and Uber?
**Model Answer:**
> "- **Netflix**: We implemented Chaos Engineering failure experiments (`backend/internal/reliability/reliability.go`) such as latency injection and pod killing to prove automated recovery.
> - **Amazon**: We adopted Two-Pizza Team decentralization, decoupled microservice APIs, and high-availability multi-AZ VPC infrastructure.
> - **Uber**: We adopted Domain-Oriented Microservice Architecture (DOMA), real-time telemetry streaming, and Kubernetes HPA elastic autoscaling."

---

### Question 14: What is the difference between Serverless and Containerized microservices in terms of cold starts and cost?
**Model Answer:**
> "- **Serverless (AWS Lambda / ECS Fargate)**: Costs **\$0.00 at idle** because compute is billed strictly per millisecond of execution. However, it incurs cold start latencies (100ms–800ms) during initial initialization.
> - **Containerized (EKS / Self-Managed K8s)**: Has **sub-millisecond latency** because container replicas are always warm and running. However, it incurs fixed baseline VM node overhead even when idle, but becomes more cost-effective at high, continuous volume."

---

### Question 15: How does your project support Policy-as-Code and compliance auditing?
**Model Answer:**
> "In `backend/internal/governance/governance.go`, we maintain an automated policy engine that checks:
> 1. Mandatory resource tagging (`Environment` and `Owner` tags).
> 2. Encryption-at-rest enforcement on databases and S3 buckets.
> 3. Restriction of public S3 buckets and public database endpoints.
> 
> The `/projects/{id}/evaluate` endpoint calculates an automated compliance score (0–100%) and records all actions to an immutable, append-only PostgreSQL `audit_logs` table for SOC2 and regulatory compliance."
