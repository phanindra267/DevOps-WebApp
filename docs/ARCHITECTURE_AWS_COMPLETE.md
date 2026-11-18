# CloudOps Sentinel — Complete AWS Architecture

> Full architecture of the infrastructure built in
> `infrastructure/terraform/aws-complete/`, `infrastructure/cloudformation/`
> and hosted on EKS via `kubernetes/eks/`.
> Every key value is `XX` — replace before applying.

**Rendered diagram:** [`docs/architecture-complete.png`](architecture-complete.png)
**Mermaid source:** [`docs/architecture-complete.mmd`](architecture-complete.mmd)
*(Export/regenerate: `npx -y @mermaid-js/mermaid-cli@11 -i docs/architecture-complete.mmd -o docs/architecture-complete.png -w 2200 -b white`)*

---

## Complete architecture diagram

```mermaid
flowchart TB
    classDef user fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    classDef net fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef sec fill:#f3e5f5,stroke:#6a1b9a,color:#4a148c
    classDef obs fill:#e0f7fa,stroke:#00838f,color:#004d40

    subgraph TIER0["① USERS"]
        U1["🌐 Browser"]
        U2["👤 Admin SSH / kubectl"]
        U3["🏢 On-Prem Router"]
        U4["👨‍💻 Developer git push"]
    end

    subgraph TIER1["② EDGE + DNS + TLS"]
        R53["Route 53 app.XX.com"]
        ACM["ACM Certificate XX"]
        ALB["ALB / Load Balancer Controller"]
    end

    subgraph TIER2["③ CI/CD + DevSecOps"]
        GH["GitHub webhook"]
        JEN["Jenkins pipeline"]
        TRIVY["Trivy CVE gate"]
        ECR["ECR / Docker Hub image XX"]
    end

    subgraph TIER3["④ VPC NETWORK (10.XX.0.0/16)"]
        IGW["Internet Gateway"]
        NAT["NAT GW + EIP"]
        WEB["EC2 Web Servers Nginx 80/443 SSH + EIP"]
        EKS["EKS Control Plane + Managed Nodes"]
        RDS[("RDS PostgreSQL private encrypted")]
        RT["Route Tables public→IGW private→NAT"]
        VPN["Site-to-Site VPN CustomerGW VGW BGP"]
        PEER["VPC Peering → Peer VPC 192.168.0.0/16"]
    end

    subgraph TIER4["⑤ KUBERNETES ON EKS"]
        ING["Ingress + ALB"]
        BEP["Backend Deployment + Service + HPA"]
        FEP["Frontend Deployment + Service"]
        CFG["ConfigMap Secret IRSA SA"]
        NP["NetworkPolicy"]
    end

    subgraph TIER5["⑥ IAM / SECURITY"]
        I1["RBAC Groups MFA policy"]
        I2["Deployer Role AssumeRole"]
        I3["OIDC IRSA EKS roles"]
        I4["SSH Key SG NACL"]
    end

    subgraph TIER6["⑦ STORAGE"]
        S1[("S3 Terraform State AES-256")]
        S2[("S3 CI/CD Artifacts")]
        S3[("S3 Logs")]
        S4["S3 Gateway Endpoint"]
    end

    subgraph TIER7["⑧ OBSERVABILITY + SERVERLESS + FINOPS"]
        O1["CloudWatch Logs Alarms Dashboard"]
        O2["SNS → alert@XX.com"]
        O3["Prometheus + Grafana"]
        SLS["Lambda + API Gateway"]
        FIN["Budgets + Cost Anomaly"]
    end

    U1 --> R53 --> ACM --> ALB --> ING
    ING --> BEP & FEP
    CFG -.- BEP & FEP
    NP -.- BEP
    U2 -->|SSH| WEB
    U2 -->|kubectl| EKS
    U3 --> VPN --> EKS
    PEER --> EKS
    U4 --> GH --> JEN --> TRIVY --> ECR
    JEN -->|apply| EKS
    JEN -->|artifacts| S2
    JEN -.->|state| S1
    WEB --> IGW
    EKS --> NAT --> IGW
    EKS --> RDS
    EKS --> S4 --> S2
    RT -.- IGW & NAT
    I1 -.-> WEB
    I2 -.-> JEN
    I3 -.-> EKS
    I4 -.-> WEB
    BEP & FEP & WEB & RDS --> O1 --> O2
    EKS --> O3
    SLS --> R53
    O1 & S3 --> FIN

    class U1,U2,U3,U4 user
    class IGW,NAT,WEB,EKS,RDS,RT,VPN,PEER net
    class I1,I2,I3,I4 sec
    class O1,O2,O3,SLS,FIN obs
```

---

## Layer-by-layer explanation

| # | Layer | What happens |
|---|---|---|
| ① | **Users** | Browser (HTTPS), admin (SSH + kubectl), on-prem router (VPN), developer (git push) |
| ② | **Edge / DNS / TLS** | Route 53 → ACM certificate → ALB (AWS Load Balancer Controller) |
| ③ | **CI/CD DevSecOps** | GitHub webhook → Jenkins → Trivy CVE gate → ECR/Docker Hub image |
| ④ | **VPC network** | Public subnets (IGW, NAT, EC2 Nginx web servers + EIP); private subnets (EKS nodes + RDS); route tables, Site-to-Site VPN, VPC Peering |
| ⑤ | **Kubernetes on EKS** | Ingress → backend/frontend Deployments + Services + HPA; ConfigMap/Secret, IRSA ServiceAccount, NetworkPolicy |
| ⑥ | **IAM / Security** | RBAC groups + Virtual MFA policy, Deployer Role (AssumeRole), OIDC/IRSA, SSH key pair, Security Groups + NACL |
| ⑦ | **Storage** | S3 state / artifacts / logs (versioned, AES-256, lifecycle), S3 gateway endpoint |
| ⑧ | **Observability / Serverless / FinOps** | CloudWatch + SNS alerts, Prometheus/Grafana, Lambda + API Gateway, Budgets + Cost Anomaly |

## Network topology detail

```mermaid
flowchart TB
    VPC["VPC XX (e.g. 10.0.0.0/16)"]
    PUB["Public 10.0.1.0/24 + 10.0.2.0/24 (AZ1, AZ2)"]
    PRIV["Private 10.0.11.0/24 + 10.0.12.0/24 (AZ1, AZ2)"]
    IGW["Internet Gateway"]
    NAT["NAT Gateway (egress only)"]
    WEB["EC2 Web: 80, 443, SSH 22"]
    EKS["EKS Nodes"]
    RDS[("RDS :5432")]
    CGW["Customer Gateway (on-prem)"]
    VGW["VPN Gateway + BGP routes"]
    PEERGW["VPC Peering"]
    PEERVPC["Peer VPC 192.168.0.0/16"]

    VPC --> PUB & PRIV
    PUB --> IGW & NAT & WEB
    PRIV --> EKS & RDS
    PRIV --> NAT
    CGW --> VGW --> PRIV
    VPC --> PEERGW --> PEERVPC
    WEB -->|SG 80/443/22| PUB
    EKS -->|SG 8080| PRIV
    RDS -->|SG 5432| PRIV
```

## Resource-to-file map

| Layer | Terraform | CloudFormation | Kubernetes |
|---|---|---|---|
| VPC / subnets / NAT / routes | `network.tf` | `complete-stack.yaml` | — |
| Site-to-Site VPN | `network.tf` | `complete-stack.yaml` | — |
| VPC Peering | `peering.tf` | `complete-stack.yaml` | — |
| Security groups / NACL | `security.tf` | `complete-stack.yaml` | `networkpolicy.yaml` |
| IAM / RBAC / MFA / IRSA | `iam.tf` | `complete-stack.yaml` | `serviceaccount.yaml` |
| EC2 Nginx web server | `ec2.tf` | `complete-stack.yaml` | — |
| S3 (state/artifacts/logs) | `s3.tf` | `complete-stack.yaml` | — |
| EKS control plane + nodes | `eks.tf` | `eks-cluster.yaml` | `deployment.yaml`, `service.yaml`, `ingress.yaml`, `hpa.yaml` |
| RDS PostgreSQL | `rds.tf` | — (add separately) | `configmap.yaml`, `secret.yaml` |
| Lambda + API Gateway | `lambda.tf` | `complete-stack.yaml` | — |
| Monitoring / alerts | `monitoring.tf` | `complete-stack.yaml` | `prometheus.yml`, Grafana JSON |
| Budgets / cost | `cost.tf` | `complete-stack.yaml` | — |

> Mermaid renders on GitHub and at https://mermaid.live. The PNG was exported with mermaid-cli.
