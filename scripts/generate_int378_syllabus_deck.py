"""
INT 378 — Complete Syllabus Presentation (Spring 2025 / Session 2026-27)
Covers every topic in the CA brief across 6 units, mapped to the
CloudOps Sentinel project. Output: CloudOps_Sentinel_INT378_Syllabus_Deck.pptx
Offline, no external assets. Run: python scripts/generate_int378_syllabus_deck.py
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "CloudOps_Sentinel_INT378_Syllabus_Deck.pptx")

BG = RGBColor(0x08, 0x0E, 0x1C)
SURF = RGBColor(0x11, 0x1D, 0x38)
SURF2 = RGBColor(0x16, 0x25, 0x46)
BORDER = RGBColor(0x2A, 0x3E, 0x66)
TEXT = RGBColor(0xEE, 0xF4, 0xFF)
MUTED = RGBColor(0x9B, 0xAE, 0xD0)
BLUE = RGBColor(0x3B, 0x82, 0xF6)
TEAL = RGBColor(0x2D, 0xD4, 0xBF)
AMBER = RGBColor(0xF5, 0x9E, 0x0B)
GREEN = RGBColor(0x34, 0xD3, 0x99)
RED = RGBColor(0xFB, 0x71, 0x85)
VIOLET = RGBColor(0xA7, 0x8B, 0xFA)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Segoe UI"

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]
SW, SH = prs.slide_width, prs.slide_height


def rect(s, x, y, w, h, fill, line=None, radius=False, lw=1):
    shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
                             Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line:
        shp.line.color.rgb = line; shp.line.width = Pt(lw)
    else:
        shp.line.fill.background()
    if radius:
        try: shp.adjustments[0] = 0.10
        except Exception: pass
    return shp


def txt(s, value, x, y, w, h, size=14, color=TEXT, bold=False,
        align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, italic=False, font=FONT):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.02)
    tf.margin_top = tf.margin_bottom = Inches(0.01)
    lines = str(value).split("\n")
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.alignment = align
        p.space_after = Pt(3)
        for r in p.runs:
            r.font.size = Pt(size); r.font.bold = bold; r.font.italic = italic
            r.font.name = font; r.font.color.rgb = color
    return tb


def bullet_card(s, x, y, w, h, title, items, accent, size=13):
    rect(s, x, y, w, h, SURF, BORDER, radius=True)
    rect(s, x, y, 0.08, h, accent)
    txt(s, title, x + 0.22, y + 0.12, w - 0.35, 0.42, size=size + 2, color=accent, bold=True)
    lines = []
    for it in items:
        lines.append("- " + it)
    txt(s, "\n".join(lines), x + 0.22, y + 0.58, w - 0.4, h - 0.7, size=size, color=TEXT)


def arrow(s, x, y, w, color=TEAL):
    ln = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x), Inches(y), Inches(w), Inches(0.22))
    ln.fill.solid(); ln.fill.fore_color.rgb = color; ln.line.fill.background()


def base(title, subtitle, chapter, accent, page):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, 13.333, 7.5, BG)
    rect(s, 0, 0, 13.333, 0.12, accent)
    rect(s, 0.55, 0.42, 0.11, 0.62, accent)
    txt(s, title, 0.82, 0.40, 11.6, 0.55, size=25, color=WHITE, bold=True)
    txt(s, subtitle, 0.84, 0.98, 11.6, 0.36, size=13, color=MUTED)
    txt(s, "INT 378 - CLOUD-NATIVE DEVOPS - " + chapter, 0.6, 7.02, 10.5, 0.3, size=9, color=MUTED)
    txt(s, str(page), 12.3, 7.0, 0.5, 0.3, size=10, color=MUTED, align=PP_ALIGN.RIGHT)
    return s


def chapter_divider(num, name, topics, accent, page):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, 13.333, 7.5, BG)
    rect(s, 0, 0, 13.333, 0.12, accent)
    txt(s, "CHAPTER", 0.8, 1.5, 3, 0.4, size=15, color=accent, bold=True)
    txt(s, num, 0.75, 1.9, 2.5, 1.5, size=80, color=accent, bold=True)
    txt(s, name, 3.0, 2.0, 9.3, 1.1, size=34, color=WHITE, bold=True)
    txt(s, topics, 3.05, 3.3, 9.0, 1.6, size=16, color=MUTED)
    rect(s, 3.05, 5.2, 3.0, 0.06, accent)
    txt(s, "INT 378 - SESSION 2026-27 - CLOUDOPS SENTINEL", 3.05, 5.5, 8, 0.4, size=11, color=MUTED)
    txt(s, str(page), 12.3, 7.0, 0.5, 0.3, size=10, color=MUTED, align=PP_ALIGN.RIGHT)
    return s


# ---------------- TITLE ----------------
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, BG)
rect(s, 0, 0, 13.333, 0.16, TEAL)
rect(s, 7.7, 1.4, 4.9, 4.6, SURF, BORDER, radius=True)
txt(s, "INT 378", 0.9, 1.15, 6.5, 0.5, size=17, color=TEAL, bold=True)
txt(s, "Advanced Cloud &\nDevOps Syllabus", 0.85, 1.85, 7.0, 1.8, size=45, color=WHITE, bold=True)
txt(s, "Six units - concepts, diagrams and project mapping", 0.9, 3.85, 6.6, 0.5, size=17, color=MUTED)
txt(s, "CloudOps Sentinel - CA 3 Presentation", 0.9, 4.6, 6.6, 0.5, size=15, color=AMBER, bold=True)
txt(s, "Kakumani Phaneendra  |  Reg: 12418953", 0.9, 5.2, 6.6, 0.4, size=13, color=MUTED)
txt(s, "Prepared for: Continuous Assessment 3 - Spring 2025", 0.9, 5.75, 6.6, 0.4, size=12, color=MUTED)
for i, (lab, col) in enumerate([("Infrastructure", BLUE), ("IaC", TEAL), ("CI/CD", AMBER),
                                ("Observability", GREEN), ("DevSecOps", RED), ("Cloud-Native", VIOLET)]):
    rect(s, 7.95, 1.75 + i * 0.68, 4.2, 0.5, SURF2, BORDER, radius=True)
    rect(s, 7.95, 1.75 + i * 0.68, 0.1, 0.5, col)
    txt(s, f"UNIT {i+1}   {lab}", 8.2, 1.85 + i * 0.68, 3.8, 0.3, size=13, color=WHITE, bold=True)

# ---------------- SYLLABUS MAP ----------------
s = base("Syllabus map - one continuous learning path", "Infrastructure -> Code -> Delivery -> Visibility -> Security -> Optimization", "SYLLABUS OVERVIEW", TEAL, 2)
units = [
    ("1", "Advanced Cloud Infrastructure", "AWS/Azure, provisioning, containers, case studies", BLUE),
    ("2", "Infrastructure as Code", "Terraform, CloudFormation, comparison, trends", TEAL),
    ("3", "Agile & CI/CD", "SAFe, LeSS, TDD, BDD, Jenkins, A/B testing", AMBER),
    ("4", "Monitoring & Observability", "Prometheus, Grafana, alerts, scaling", GREEN),
    ("5", "DevSecOps & Security", "IAM, K8s, containers, secrets, supply chain", RED),
    ("6", "Cloud-Native & Optimization", "12-factor, serverless, FinOps, governance", VIOLET),
]
for i, (n, name, desc, col) in enumerate(units):
    x = 0.6 + (i % 3) * 4.25
    y = 1.7 + (i // 3) * 2.5
    rect(s, x, y, 3.95, 2.15, SURF, BORDER, radius=True)
    txt(s, n, x + 0.2, y + 0.15, 0.7, 0.6, size=34, color=col, bold=True)
    txt(s, name, x + 0.95, y + 0.25, 2.85, 0.75, size=15, color=WHITE, bold=True)
    txt(s, desc, x + 0.25, y + 1.15, 3.5, 0.8, size=12, color=MUTED)

# ================= UNIT 1 =================
chapter_divider("1", "Advanced Cloud Infrastructure and Services",
                "AWS & Azure advanced services | Resource provisioning & optimization | Containerization: Docker Hub, architecture, lifecycle | Case studies: Netflix, Amazon, Uber", BLUE, 3)

s = base("Advanced cloud services - AWS and Azure", "Same capability families, different product names - the concepts transfer", "UNIT 1 - ADVANCED CLOUD INFRASTRUCTURE", BLUE, 4)
bullet_card(s, 0.6, 1.6, 3.9, 4.6, "Compute", ["AWS EC2 / ECS / EKS / Lambda", "Azure VMs / AKS / Container Instances / Functions", "Auto Scaling groups and VM Scale Sets", "Spot / Reserved vs. Savings Plans"], BLUE)
bullet_card(s, 4.7, 1.6, 3.9, 4.6, "Storage & Data", ["AWS S3 / EBS / RDS / DynamoDB", "Azure Blob / Disk / SQL / Cosmos DB", "Object versioning, encryption at rest", "Lifecycle policies move data to cheaper tiers"], TEAL)
bullet_card(s, 8.8, 1.6, 3.9, 4.6, "Network & Identity", ["AWS VPC / IAM / CloudFront / Route 53", "Azure VNet / Entra ID / CDN / DNS", "Public vs. private subnets, security groups", "RBAC, MFA and least privilege everywhere"], VIOLET)
txt(s, "PROJECT: Local Docker networks = VPC/subnets; containers = EC2; local registry = S3; IAM simulated in Go + TOTP", 0.6, 6.4, 12.1, 0.4, size=12, color=AMBER, bold=True)

s = base("Resource provisioning and optimization", "Provision only what is needed, then continuously right-size it", "UNIT 1 - ADVANCED CLOUD INFRASTRUCTURE", BLUE, 5)
bullet_card(s, 0.6, 1.6, 5.9, 2.15, "Provisioning techniques", ["Infrastructure as Code (Terraform / CloudFormation)", "Gold AMI / golden container images", "Auto Scaling based on demand", "Immutable infrastructure - replace, don't patch"], BLUE)
bullet_card(s, 6.8, 1.6, 5.9, 2.15, "Optimization techniques", ["Right-size instances using CPU/memory data", "Schedule non-prod environments off-hours", "Use Spot / Reserved for steady workloads", "Delete idle resources; set budgets and alerts"], GREEN)
bullet_card(s, 0.6, 4.0, 12.1, 2.4, "Project mapping", ["Free-tier t2/t3.micro EC2 + small EBS + 5 GB S3; NO NAT Gateway, Load Balancer or EKS in the CA prototype.", "Local FinOps engine in backend/internal/cost estimates workload cost, detects idle resources and suggests rightsizing.", "AWS Cost Explorer + Budgets covered in Unit 6; account SCP currently blocks real provisioning."], AMBER, size=13)

s = base("Containerization - Docker Hub, architecture and lifecycle", "Containers package an app with dependencies for consistent runs anywhere", "UNIT 1 - ADVANCED CLOUD INFRASTRUCTURE", BLUE, 6)
rect(s, 0.6, 1.6, 5.6, 4.8, SURF, BORDER, radius=True)
txt(s, "Docker architecture", 0.85, 1.75, 5.1, 0.4, size=17, color=BLUE, bold=True)
for i, (a, b) in enumerate([
    ("Docker Client", "docker build / run / push CLI"),
    ("Docker Daemon", "Builds images, runs containers"),
    ("Images", "Read-only layered templates"),
    ("Registry (Docker Hub)", "Push / pull versioned images"),
    ("Containers", "Running isolated processes"),
]):
    y = 2.3 + i * 0.78
    rect(s, 0.95, y, 4.9, 0.62, SURF2, BORDER, radius=True)
    txt(s, a, 1.15, y + 0.06, 2.3, 0.3, size=13, color=WHITE, bold=True)
    txt(s, b, 3.2, y + 0.08, 2.5, 0.3, size=11, color=MUTED)
rect(s, 6.5, 1.6, 6.2, 4.8, SURF, BORDER, radius=True)
txt(s, "Container lifecycle", 6.75, 1.75, 5.7, 0.4, size=17, color=TEAL, bold=True)
stages = [("CREATED", BLUE), ("RUNNING", GREEN), ("PAUSED", AMBER), ("STOPPED", VIOLET), ("DELETED", RED)]
for i, (st, col) in enumerate(stages):
    x = 6.8 + i * 1.18
    rect(s, x, 2.6, 1.05, 0.7, SURF2, col, radius=True)
    txt(s, st, x + 0.04, 2.8, 0.97, 0.3, size=9, color=col, bold=True, align=PP_ALIGN.CENTER)
    if i < 4: arrow(s, x + 1.06, 2.84, 0.12, col)
txt(s, "Dockerfile -> docker build -> image -> docker run -> container -> docker push -> Docker Hub -> pull on another host -> verify",
    6.8, 3.7, 5.6, 1.0, size=12, color=TEXT)
txt(s, "PROJECT: Multi-stage Go + Next.js Dockerfiles; local registry:5000 demonstrates real tag -> push -> remove -> pull -> run lifecycle.",
    6.8, 5.1, 5.6, 1.0, size=12, color=AMBER, bold=True)

s = base("Case studies - scalable cloud solutions", "Three industry patterns built from the same cloud primitives", "UNIT 1 - ADVANCED CLOUD INFRASTRUCTURE", BLUE, 7)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Netflix - chaos & resilience", ["Simian Army / Chaos Monkey inject failures", "Multi-region active-active on AWS", "Microservices + stateless autoscaling", "Lesson: design for constant failure"], RED)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Amazon - scale & ownership", ["Two-Pizza Teams own services end-to-end", "Multi-AZ VPC, S3 and DynamoDB primitives", "Everything exposed as APIs / self-service", "Lesson: decentralise with strong guardrails"], AMBER)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Uber - microservices at speed", ["DOMA domain-oriented microservice architecture", "Jaeger distributed tracing across services", "Kubernetes + multi-region failover", "Lesson: observability is mandatory at scale"], VIOLET)
txt(s, "PROJECT: Chaos experiments + technical debt register (Reliability page) and Prometheus/Jaeger-style tracing concepts echo these patterns.",
    0.6, 6.5, 12.1, 0.4, size=12, color=TEAL, bold=True)

# ================= UNIT 2 =================
chapter_divider("2", "Infrastructure as Code (IaC)",
                "IaC fundamentals & significance | Terraform hands-on | CloudFormation hands-on | Terraform vs CloudFormation | Future trends & emerging tools", TEAL, 8)

s = base("Infrastructure as Code - why it matters", "Describe infrastructure in files; let automation create and manage it", "UNIT 2 - INFRASTRUCTURE AS CODE", TEAL, 9)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Principles & benefits", ["Declarative desired state, version-controlled in Git", "Repeatable, reproducible environments", "Peer review, diffs and automated testing", "Eliminates configuration drift; faster recovery", "Documentation that is executable"], TEAL)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "DevOps significance", ["One pipeline can test and apply infra changes", "Immutable infrastructure and blue/green deploys", "Self-service environments for developers", "Policy-as-Code enforces compliance early", "Audit trail: who changed what, when"], BLUE)
txt(s, "PROJECT: 7 CloudFormation templates + modular Terraform (VPC/ECS/S3/IAM/EC2) + local Docker-provider stack", 0.6, 6.4, 12.1, 0.4, size=12, color=AMBER, bold=True)

s = base("Terraform - hands-on workflow", "Providers connect declarative HCL configuration to real platforms", "UNIT 2 - INFRASTRUCTURE AS CODE", TEAL, 10)
steps = [("1. WRITE", "main.tf / variables.tf / outputs.tf"), ("2. INIT", "terraform init - download providers"),
         ("3. VALIDATE", "terraform validate / fmt -check"), ("4. PLAN", "terraform plan - preview changes"),
         ("5. APPLY", "terraform apply - provision"), ("6. STATE", "terraform state / output")]
for i, (t, d) in enumerate(steps):
    x = 0.6 + i * 2.1
    rect(s, x, 1.7, 1.95, 1.5, SURF, BORDER, radius=True)
    txt(s, t, x + 0.1, 1.85, 1.75, 0.35, size=13, color=TEAL, bold=True, align=PP_ALIGN.CENTER)
    txt(s, d, x + 0.1, 2.25, 1.75, 0.75, size=10, color=MUTED, align=PP_ALIGN.CENTER)
bullet_card(s, 0.6, 3.55, 6.0, 2.7, "Key concepts", ["Providers, resources, modules and data sources", "State file tracks real-world resources", "Plan shows create/update/destroy before apply", "Lock files pin provider versions"], TEAL)
bullet_card(s, 6.8, 3.55, 5.9, 2.7, "Project usage", ["Local Docker provider: networks, volumes, containers", "AWS stack: VPC, subnets, VPN, peering, EC2, S3, EKS, RDS, Lambda", "Commands run: init / fmt / validate / plan / apply / destroy", "Evidence stored in evidence/terraform/"], AMBER)

s = base("CloudFormation and the two-tool comparison", "CloudFormation is AWS-native; Terraform is multi-provider", "UNIT 2 - INFRASTRUCTURE AS CODE", TEAL, 11)
rect(s, 0.6, 1.6, 6.0, 3.9, SURF, BORDER, radius=True)
txt(s, "CloudFormation (YAML/JSON)", 0.85, 1.75, 5.5, 0.4, size=16, color=AMBER, bold=True)
txt(s, "AWSTemplateFormatVersion, Parameters, Resources, Outputs\nIntrinsics: !Ref, !GetAtt, !Sub, !If, DependsOn\nStacks, change sets, rollback, drift detection\nFree AWS-managed state and native IAM integration",
    0.85, 2.3, 5.5, 2.8, size=13, color=TEXT)
rect(s, 6.8, 1.6, 5.9, 3.9, SURF, BORDER, radius=True)
txt(s, "Comparison", 7.05, 1.75, 5.4, 0.4, size=16, color=TEAL, bold=True)
txt(s, "CFN: AWS-only, YAML/JSON, AWS-managed state\nTerraform: multi-cloud, HCL, state file to manage\nCFN: change sets  |  TF: plan diffs\nCFN: rollback on failure  |  TF: apply is atomic per graph\nUse both: CFN for AWS demos, TF for portability",
    7.05, 2.3, 5.4, 2.9, size=12, color=TEXT)
bullet_card(s, 0.6, 5.7, 12.1, 1.1, "Project mapping", ["7 validated CFN templates (VPC, EC2, IAM, ECS, EKS, complete-stack, ca-prototype) demonstrate parameters, outputs and dependencies."], AMBER, size=12)

s = base("Where IaC is heading - future trends", "IaC is merging with policy, Git workflows and AI assistance", "UNIT 2 - INFRASTRUCTURE AS CODE", TEAL, 12)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Emerging tools", ["OpenTofu - open-source Terraform fork", "Pulumi - IaC in real languages", "Crossplane - control planes in Kubernetes", "AWS CDK - define infra in code", "Terragrunt / Atlantis for workflow"], TEAL)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Policy & security", ["OPA / Sentinel / Checkov policy-as-code", "Shift-left IaC scanning (Trivy, tfsec)", "Drift detection and auto-remediation", "Signed plans and provenance (SLSA)"], RED)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Platform engineering", ["GitOps with ArgoCD / Flux", "Internal developer platforms & templates", "AI-assisted config generation & review", "Secrets-native workflows (Vault, SOPS)"], VIOLET)
txt(s, "PROJECT: Policy-as-code in backend/internal/governance, OPA-like security-policy.yaml and Terraform/CFN comparison page in the dashboard.",
    0.6, 6.5, 12.1, 0.4, size=12, color=AMBER, bold=True)

# ================= UNIT 3 =================
chapter_divider("3", "Agile and CI/CD Practices for Scalable Product Development",
                "SAFe & LeSS | TDD & BDD | CI/CD | Product strategy & distributed teams | A/B testing & technical debt | Jenkins automation", AMBER, 13)

s = base("Scaling Agile - SAFe and LeSS", "Two ways to coordinate many teams without losing agility", "UNIT 3 - AGILE AND CI/CD", AMBER, 14)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "SAFe (Scaled Agile Framework)", ["Agile Release Trains (ARTs) sync teams", "Program Increment (PI) planning", "Roles: Product Owner, Scrum Master, architects", "Portfolio -> Program -> Team hierarchy", "Heavyweight governance for large enterprises"], AMBER)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "LeSS (Large-Scale Scrum)", ["One product backlog, one Product Owner", "One team-level Sprint across all teams", "Cross-team coordination and shared definition of done", "Minimal extra roles; keep Scrum simple", "Works best when teams are co-located"], TEAL)
txt(s, "PROJECT: Syllabus hub demonstrates both models; Jenkins pipeline and project/environment CRUD model sprint-style delivery.", 0.6, 6.4, 12.1, 0.4, size=12, color=BLUE, bold=True)

s = base("TDD and BDD - tests that drive design", "Write the expectation first, then build just enough to satisfy it", "UNIT 3 - AGILE AND CI/CD", AMBER, 15)
rect(s, 0.6, 1.6, 5.9, 4.7, SURF, BORDER, radius=True)
txt(s, "TDD - Test Driven Development", 0.85, 1.75, 5.4, 0.4, size=16, color=AMBER, bold=True)
txt(s, "Red  ->  Green  ->  Refactor\n\n1. Write a failing unit test\n2. Implement minimal code to pass\n3. Refactor for clarity\n\nPROJECT: Go tests in backend/internal/auth, cloud, cost, project, syllabus - all PASS via go test ./...",
    0.85, 2.3, 5.4, 3.7, size=13, color=TEXT)
rect(s, 6.8, 1.6, 5.9, 4.7, SURF, BORDER, radius=True)
txt(s, "BDD - Behaviour Driven Development", 7.05, 1.75, 5.4, 0.4, size=16, color=TEAL, bold=True)
txt(s, "Given - When - Then scenarios\n\nGiven a user with viewer role\nWhen they attempt a mutation\nThen access is denied by RBAC\n\nPROJECT: Interactive Gherkin specification tester in the Syllabus hub (given/when/then input).",
    7.05, 2.3, 5.4, 3.7, size=13, color=TEXT)

s = base("CI/CD - the automated delivery pipeline", "Every commit is verified and can reach production safely", "UNIT 3 - AGILE AND CI/CD", AMBER, 16)
stages = ["COMMIT", "BUILD", "TEST", "SCAN", "PUSH", "DEPLOY", "VERIFY"]
for i, st in enumerate(stages):
    x = 0.6 + i * 1.8
    rect(s, x, 2.0, 1.6, 0.8, SURF2, BORDER, radius=True)
    txt(s, st, x + 0.05, 2.25, 1.5, 0.3, size=11, color=AMBER if i % 2 == 0 else TEAL, bold=True, align=PP_ALIGN.CENTER)
    if i < 6: arrow(s, x + 1.62, 2.29, 0.16, MUTED)
bullet_card(s, 0.6, 3.3, 5.9, 3.0, "Continuous Integration", ["GitHub webhook triggers build on every push", "Compile and run unit tests with coverage", "Static analysis and dependency scanning", "Fail fast: broken code never merges"], AMBER)
bullet_card(s, 6.8, 3.3, 5.9, 3.0, "Continuous Delivery / Deployment", ["Build once, promote the same artefact", "Automated deploy with health-gated rollout", "Rollback on failed verification", "Evidence archived per build"], GREEN)
txt(s, "PROJECT: Jenkins 13-stage declarative pipeline, build #10 SUCCESS with console evidence in evidence/jenkins/", 0.6, 6.5, 12.1, 0.4, size=12, color=TEAL, bold=True)

s = base("Product strategy, distributed teams and A/B testing", "Align people around outcomes; learn from real user behaviour", "UNIT 3 - AGILE AND CI/CD", AMBER, 17)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Product strategy", ["Vision, roadmap and OKRs", "Prioritise by user value and risk", "Minimum viable product then iterate", "Measure outcomes, not output"], AMBER)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Distributed teams", ["Overlap hours and async documentation", "Clear interfaces and API contracts", "Shared CI/CD and environments", "Time-zone friendly handoffs"], BLUE)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "A/B testing", ["Split traffic between variants A and B", "Define success metric before launch", "Collect conversion telemetry", "Roll out winner, discard loser"], VIOLET)
txt(s, "PROJECT: /syllabus A/B split slider + conversion telemetry endpoint demonstrates traffic split and measurement.", 0.6, 6.5, 12.1, 0.4, size=12, color=TEAL, bold=True)

s = base("Technical debt and Jenkins automation", "Automate the repeatable; keep humans for judgement", "UNIT 3 - AGILE AND CI/CD", AMBER, 18)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Technical debt management", ["Debt register: item, severity, impact, owner", "Prioritise by interest (cost of delay)", "Allocate a fixed % of each sprint", "Track trend; prevent debt with CI gates"], RED)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "Jenkins automation & best practice", ["Declarative pipeline as code (Jenkinsfile)", "Credentials bindings, no secrets in jobs", "Parallel stages, timeouts, build retention", "Webhooks, notifications and audit logs", "Small commits, frequent merges, feature flags"], AMBER)
txt(s, "PROJECT: Reliability page debt register + chaos experiments; Jenkinsfile is version-controlled and archived with evidence.", 0.6, 6.4, 12.1, 0.4, size=12, color=TEAL, bold=True)

# ================= UNIT 4 =================
chapter_divider("4", "Monitoring and Observability",
                "Prometheus & Grafana | Data collection, metrics, alerting | Performance dashboards | Scaling monitoring | Advanced observability", GREEN, 19)

s = base("Monitoring vs. observability", "Monitoring answers 'is it broken?'; observability explains 'why?'", "UNIT 4 - MONITORING AND OBSERVABILITY", GREEN, 20)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Monitoring", ["Known failure modes, predefined checks", "Metrics, thresholds and alerts", "Dashboards show current state", "Answers: is the service up?"], GREEN)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "Observability", ["Explore unknown failure modes", "High-cardinality metrics, logs and traces", "Correlate signals to find root cause", "Answers: why did latency spike?"], TEAL)
txt(s, "PROJECT: Four golden signals - latency, traffic, errors, saturation - via Go /metrics, Node Exporter and cAdvisor, visualised in Grafana.",
    0.6, 6.4, 12.1, 0.4, size=12, color=AMBER, bold=True)

s = base("Prometheus - architecture in one diagram", "Pull-based metrics, local time-series DB and a separate alerting path", "UNIT 4 - MONITORING AND OBSERVABILITY", GREEN, 21)
rect(s, 0.6, 1.7, 3.6, 2.0, SURF, BORDER, radius=True)
txt(s, "Targets", 0.85, 1.85, 3.1, 0.35, size=15, color=GREEN, bold=True)
txt(s, "Go API /metrics\nNode Exporter :9100\ncAdvisor :8087\nPrometheus self", 0.85, 2.3, 3.1, 1.2, size=12, color=TEXT)
arrow(s, 4.3, 2.5, 0.5, GREEN)
rect(s, 4.9, 1.7, 3.6, 2.0, SURF, BORDER, radius=True)
txt(s, "Prometheus Server", 5.15, 1.85, 3.1, 0.35, size=15, color=GREEN, bold=True)
txt(s, "Pull every 15s\nTime-series DB\nPromQL queries\nAlert evaluation", 5.15, 2.3, 3.1, 1.2, size=12, color=TEXT)
arrow(s, 8.6, 2.5, 0.5, GREEN)
rect(s, 9.2, 1.7, 3.5, 2.0, SURF, BORDER, radius=True)
txt(s, "Consumers", 9.45, 1.85, 3.0, 0.35, size=15, color=GREEN, bold=True)
txt(s, "Grafana dashboards\nAlertmanager / SNS\nCloudWatch alarms", 9.45, 2.3, 3.0, 1.2, size=12, color=TEXT)
bullet_card(s, 0.6, 4.1, 12.1, 2.4, "Project verification", ["4/4 scrape targets UP: cloudops-backend, node-exporter, cadvisor, prometheus.", "Alert rules: ServiceDown, HighErrorRate, HighRequestLatency, CriticalVulnerabilitiesDetected.", "Grafana datasource auto-provisioned; dashboard 'CloudOps Sentinel - Executive Overview' confirmed via API."], GREEN, size=13)

s = base("Grafana - from metrics to decisions", "Dashboards turn time series into fast operational answers", "UNIT 4 - MONITORING AND OBSERVABILITY", GREEN, 22)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Dashboard design", ["Goal-first: answer a question per panel", "Use rate() for counters, histograms for latency", "Compare current vs. baseline / previous period", "Annotate deploys and incidents", "Keep refresh intervals realistic (5s-1m)"], GREEN)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "Operational use", ["Triage: start at the service-level panel", "Drill down from latency to dependencies", "Use alerts to page, dashboards to diagnose", "Share links in incident channels", "Review capacity trends weekly"], TEAL)
txt(s, "PROJECT: Grafana at :3001 with 6 panels - request rate, p99 latency, active workloads, 5xx rate, backend status, critical CVEs.",
    0.6, 6.4, 12.1, 0.4, size=12, color=AMBER, bold=True)

s = base("Data collection, alerting and scaling observability", "Keep signals useful, bounded and actionable", "UNIT 4 - MONITORING AND OBSERVABILITY", GREEN, 23)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Collection", ["Push (statsD) vs. Pull (Prometheus)", "Exporters bridge legacy systems", "Labels add dimensions but raise cardinality", "Retention and storage sizing matter"], GREEN)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Alerting", ["Symptom-based alerts, not cause-based", "Avoid flapping: for-clauses and dedup", "Route by severity to the right team", "Every alert needs a runbook"], AMBER)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Scaling & advanced", ["Federation / Thanos / Cortex for long retention", "OpenTelemetry unified traces+metrics+logs", "Service-level objectives (SLOs) and error budgets", "Sampling and aggregation control cost"], VIOLET)
txt(s, "PROJECT: Prometheus federation, Thanos/Cortex and OpenTelemetry documented in the Syllabus hub as advanced strategies.", 0.6, 6.5, 12.1, 0.4, size=12, color=TEAL, bold=True)

# ================= UNIT 5 =================
chapter_divider("5", "DevSecOps and Cloud Security",
                "Shift-left in CI/CD | IAM & cloud security | Kubernetes & container security | Secrets & keys | Emerging DevOps security", RED, 24)

s = base("Shift-left - security inside the pipeline", "Find problems early, when they are cheapest to fix", "UNIT 5 - DEVSECOPS AND CLOUD SECURITY", RED, 25)
stages = ["CODE", "BUILD", "TEST", "SCAN", "GATE", "DEPLOY", "RUN"]
for i, st in enumerate(stages):
    x = 0.6 + i * 1.8
    rect(s, x, 2.0, 1.6, 0.8, SURF2, BORDER, radius=True)
    txt(s, st, x + 0.05, 2.25, 1.5, 0.3, size=11, color=RED if i in (0, 3, 4) else MUTED, bold=True, align=PP_ALIGN.CENTER)
    if i < 6: arrow(s, x + 1.62, 2.29, 0.16, MUTED)
bullet_card(s, 0.6, 3.3, 5.9, 3.0, "Practices", ["SAST / SCA on source and dependencies", "Container image CVE scanning (Trivy)", "Secret detection before commit", "IaC misconfiguration scanning", "Policy gate blocks critical findings"], RED)
bullet_card(s, 6.8, 3.3, 5.9, 3.0, "Project implementation", ["Jenkins stages: dependency, secret, container, IaC scans", "Security gate fails on CRITICAL CVEs", "Trivy evidence with real findings", "SBOM/SLSA and Cosign signing documented"], AMBER)
txt(s, "NOTE: The original stub gate always passed; it was replaced with a real Trivy-report-driven gate that fails the build on critical findings.",
    0.6, 6.5, 12.1, 0.4, size=11, color=TEAL, bold=True)

s = base("Cloud security - identity, MFA and least privilege", "Identity is the new perimeter - prove who you are and limit what you can do", "UNIT 5 - DEVSECOPS AND CLOUD SECURITY", RED, 26)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "IAM fundamentals", ["Users, groups, roles and policies", "RBAC: grant only necessary actions", "AssumeRole for short-lived access", "Resource policies and permission boundaries", "SCPs set account-wide guardrails"], RED)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "MFA & authentication", ["Virtual MFA devices (TOTP)", "Deny all when MFA not present", "JWT with signed tokens and expiry", "Bcrypt password hashing", "No credentials in source control"], AMBER)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Project implementation", ["IAM user/role/MFA/policies created in AWS (verified)", "MFA-enforcement IAM policy with BoolIfExists", "Go JWT RBAC gates on mutating routes", "SCP p-6k0fjqz3 blocks EC2/S3 - reported honestly"], VIOLET)
txt(s, "Least privilege in action: SSH ingress restricted to admin CIDR; S3 public access fully blocked; deployment role limited to read-only identity actions.",
    0.6, 6.5, 12.1, 0.4, size=11, color=TEAL, bold=True)

s = base("Container and Kubernetes security", "Secure every layer: image -> registry -> runtime -> cluster", "UNIT 5 - DEVSECOPS AND CLOUD SECURITY", RED, 27)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Image & registry", ["Minimal, pinned base images", "Scan images for CVEs before push", "Never run containers as root", "Sign and verify images (Cosign)", "Trusted registry with access control"], RED)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Runtime & cluster", ["Security contexts: non-root, read-only rootfs", "NetworkPolicies for zero-trust segmentation", "RBAC and IRSA for pod identities", "Resource requests/limits; pod security standards"], TEAL)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Project implementation", ["Multi-stage Dockerfiles, non-root Next.js runner", "K8s manifests: Deployments, Services, Ingress, HPA", "NetworkPolicy + IRSA ServiceAccount + Secrets", "EKS cluster and node-group templates provided"], VIOLET)
txt(s, "K8s note: NetworkPolicy was fixed to allow ALB ingress, and RDS security-group access was wired for EKS workers.", 0.6, 6.5, 12.1, 0.4, size=11, color=AMBER, bold=True)

s = base("Secrets and key management", "Never store credentials in source code, images or reports", "UNIT 5 - DEVSECOPS AND CLOUD SECURITY", RED, 28)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Practices", ["Use a secret manager (AWS Secrets Manager / Vault)", "Inject at runtime via env or CSI driver", "Encrypt secrets at rest and in transit", "Rotate keys; short-lived credentials", "Scan history for leaked secrets; ignore in .gitignore"], RED)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "Project implementation", ["JWT secret fails fast in production", "DB_SSLMODE configurable for RDS TLS", "CORS restrictable to explicit origins", "terraform.tfvars, state files and .terraform/ git-ignored", "XX placeholders instead of real values in templates", "AWS keys never printed or stored in files"], AMBER)
txt(s, "A leaked AWS key was reported to the user and recommended for rotation; it was never written to any project file.", 0.6, 6.4, 12.1, 0.4, size=11, color=TEAL, bold=True)

s = base("Emerging trends in DevOps security", "From point-in-time scanning to continuous supply-chain assurance", "UNIT 5 - DEVSECOPS AND CLOUD SECURITY", RED, 29)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Supply chain", ["SLSA provenance levels 1-4", "SBOM (SPDX / CycloneDX)", "Cosign image signing + verification", "Reproducible builds"], RED)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Continuous assurance", ["Continuous controls monitoring", "Policy-as-code (OPA / Conftest)", "Runtime threat detection (Falco)", "Cloud security posture management"], VIOLET)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Zero trust & AI", ["Never trust, always verify", "Workload identity over static keys", "AI-assisted anomaly detection", "Automated remediation playbooks"], TEAL)
txt(s, "PROJECT: Emerging trends documented in the Security page; SBOM/SLSA/Cosign explained with the Trivy evidence.", 0.6, 6.5, 12.1, 0.4, size=11, color=AMBER, bold=True)

# ================= UNIT 6 =================
chapter_divider("6", "Cloud-Native Development and Optimization",
                "Cloud-native architecture & 12-factor | Serverless | Cost optimization & billing | Cost monitoring | Governance, compliance & secure architecture", VIOLET, 30)

s = base("What makes an application cloud-native", "Design for elasticity, resilience and fast change", "UNIT 6 - CLOUD-NATIVE DEVELOPMENT", VIOLET, 31)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Architecture traits", ["Microservices with clear bounded contexts", "Containerised and orchestrated (Kubernetes)", "Stateless services, externalised state", "API-driven, declarative, observable"], VIOLET)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Delivery traits", ["CI/CD with independent deployments", "Immutable infrastructure via IaC", "Feature flags and canary releases", "Fast rollback and blast-radius control"], TEAL)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Project mapping", ["Go modular monolith + Next.js dashboard", "Docker Compose -> EKS manifests provided", "HPA for scaling; rolling deploys + rollback handlers", "12-factor audit scorecard in Syllabus hub"], AMBER)
txt(s, "Case studies: Netflix chaos engineering, Amazon service ownership and Uber microservices all rely on these traits.", 0.6, 6.5, 12.1, 0.4, size=11, color=BLUE, bold=True)

s = base("The 12-Factor App methodology", "A checklist for portable, scalable, maintainable services", "UNIT 6 - CLOUD-NATIVE DEVELOPMENT", VIOLET, 32)
factors = [
    ("I Codebase", "II Dependencies", "III Config", "IV Backing services"),
    ("V Build/release/run", "VI Processes", "VII Port binding", "VIII Concurrency"),
    ("IX Disposability", "X Dev/prod parity", "XI Logs", "XII Admin processes"),
]
for i, group in enumerate(factors):
    y = 1.7 + i * 1.15
    for j, f in enumerate(group):
        x = 0.6 + j * 3.1
        rect(s, x, y, 2.9, 0.95, SURF, BORDER, radius=True)
        rect(s, x, y, 0.08, 0.95, VIOLET if i % 2 == 0 else TEAL)
        txt(s, f, x + 0.2, y + 0.28, 2.6, 0.45, size=12, color=WHITE, bold=True)
txt(s, "PROJECT: Interactive 12-factor audit scorecard in the Syllabus hub checks the application against each factor.",
    0.6, 6.6, 12.1, 0.4, size=12, color=AMBER, bold=True)

s = base("Serverless and Function-as-a-Service", "Run code on events; the platform manages servers and scaling", "UNIT 6 - CLOUD-NATIVE DEVELOPMENT", VIOLET, 33)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Characteristics", ["No server management; auto-scaling to zero", "Pay per invocation / duration", "Event-driven (HTTP, queues, schedules)", "Stateless, short-lived functions", "Cold starts; keep packages small"], VIOLET)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "AWS & project mapping", ["AWS Lambda + API Gateway + CloudWatch Logs", "SAM template in serverless/template.yaml", "Node runtime executes the real handler locally", "3/3 invocations HTTP 200; cold+warm logs", "CloudWatch execution metrics documented"], AMBER)
txt(s, "Compare: Lambda/Fargate serverless vs. EKS/EC2 containers - cost and scaling curves explained in the Cost page.",
    0.6, 6.4, 12.1, 0.4, size=12, color=TEAL, bold=True)

s = base("Cost optimization and billing models", "Continuous practice: observe -> allocate -> optimize -> verify", "UNIT 6 - CLOUD-NATIVE DEVELOPMENT", VIOLET, 34)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Billing models", ["On-demand: pay as you go", "Reserved / Savings Plans: committed discount", "Spot: spare capacity, interruptible", "Free Tier: limited monthly allowance"], VIOLET)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Optimization levers", ["Right-size EC2 and RDS", "Delete idle / unattached resources", "S3 lifecycle to cheaper storage classes", "Schedule non-production shutdowns", "Set budgets + anomaly alerts"], GREEN)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Monitoring tools", ["AWS Cost Explorer + Cost and Usage Report", "AWS Budgets with email alerts", "Cost allocation tags by Project/Environment", "Local FinOps engine in the Go backend", "Offline cost simulator for serverless"], AMBER)
txt(s, "PROJECT: Budget $20, t2/t3.micro, db.t3.micro, no NAT/LB/EKS; Cost Explorer readable in the account even though EC2/S3 are SCP-denied.",
    0.6, 6.5, 12.1, 0.4, size=11, color=TEAL, bold=True)

s = base("Governance, compliance and secure architecture", "Know what you pay for, prove what you did, and stay compliant", "UNIT 6 - CLOUD-NATIVE DEVELOPMENT", VIOLET, 35)
bullet_card(s, 0.6, 1.6, 3.9, 4.8, "Governance", ["Policy-as-code with central definitions", "Tagging standards for ownership/cost", "Guardrails via SCP and IAM", "Approval workflows for changes"], VIOLET)
bullet_card(s, 4.7, 1.6, 3.9, 4.8, "Compliance auditing", ["Continuous evidence collection", "Immutable audit trail of actions", "Compliance scoring and exceptions", "Reports for reviewers / regulators"], TEAL)
bullet_card(s, 8.8, 1.6, 3.9, 4.8, "Secure architecture", ["Well-Architected: security, reliability, cost, performance", "Encryption at rest and in transit", "Least privilege + MFA + network isolation", "Secret management and supply-chain assurance"], RED)
txt(s, "PROJECT: Governance page with policies, compliance scoring, audit log; AWS resources tagged Project/Environment/Owner; SCP denial reported transparently.",
    0.6, 6.5, 12.1, 0.4, size=11, color=AMBER, bold=True)

# ---------------- PROJECT SUMMARY ----------------
s = base("CloudOps Sentinel - what was actually delivered", "Concepts from all six units implemented in one working prototype", "PROJECT SUMMARY", TEAL, 36)
bullet_card(s, 0.6, 1.6, 5.9, 4.7, "Working local prototype", ["13 Docker containers running; 11 HTTP health checks PASS", "Go REST API + Next.js dashboard + PostgreSQL", "Prometheus (4 targets UP) + Grafana dashboard", "Jenkins build #10 SUCCESS; Trivy evidence", "Serverless 3/3; go test all packages PASS", "Individual VPC/subnet/EC2/S3 components running"], TEAL)
bullet_card(s, 6.8, 1.6, 5.9, 4.7, "AWS deliverables", ["7 parameterised CloudFormation templates (validated)", "5 individual Terraform component stacks", "Full AWS stack with VPN, peering, EKS, RDS, Lambda, monitoring", "Free-tier cost assessment and deployment plan", "Deployment blocked by SCP - no bypass, no charges"], AMBER)
txt(s, "Repo: github.com/phanindra267/DevOps-WebApp  |  SRS: docs/SRS_CloudOps_Sentinel.md  |  Quickstart: CA_DEMO_QUICKSTART.md",
    0.6, 6.4, 12.1, 0.4, size=11, color=WHITE, bold=True)

# ---------------- REVISION ----------------
s = base("Revision checklist", "Can you explain each unit with one diagram and one project example?", "REVISION", BLUE, 37)
questions = [
    "UNIT 1: Name 3 AWS/Azure service pairs; explain Docker lifecycle; recap Netflix/Amazon/Uber lessons.",
    "UNIT 2: Terraform vs CloudFormation - state, syntax, change sets; list 3 emerging IaC tools.",
    "UNIT 3: SAFe vs LeSS; TDD red-green-refactor; BDD Given-When-Then; what does the Jenkins gate enforce?",
    "UNIT 4: Monitoring vs observability; Prometheus pull model; 4 golden signals; how do alerts reach SNS?",
    "UNIT 5: Shift-left practices; IAM/MFA/least privilege; K8s security layers; secret handling rules.",
    "UNIT 6: 12 factors; serverless trade-offs; right-sizing and budgets; governance and audit evidence.",
]
for i, q in enumerate(questions):
    y = 1.6 + i * 0.78
    rect(s, 0.6, y, 12.1, 0.68, SURF, BORDER, radius=True)
    rect(s, 0.6, y, 0.08, 0.68, [BLUE, TEAL, AMBER, GREEN, RED, VIOLET][i])
    txt(s, q, 0.85, y + 0.17, 11.7, 0.4, size=12, color=TEXT)

s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, BG)
rect(s, 0, 0, 13.333, 0.12, TEAL)
txt(s, "Questions & Discussion", 0.8, 2.7, 11.7, 1.0, size=46, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
txt(s, "CloudOps Sentinel - INT 378 CA 3", 0.8, 3.9, 11.7, 0.5, size=20, color=TEAL, align=PP_ALIGN.CENTER)
txt(s, "Kakumani Phaneendra  |  Reg: 12418953", 0.8, 4.6, 11.7, 0.4, size=15, color=MUTED, align=PP_ALIGN.CENTER)
txt(s, "github.com/phanindra267/DevOps-WebApp", 0.8, 5.2, 11.7, 0.4, size=14, color=AMBER, align=PP_ALIGN.CENTER)

prs.save(OUT)
print("SAVED:", OUT, "slides:", len(prs.slides._sldIdLst))
