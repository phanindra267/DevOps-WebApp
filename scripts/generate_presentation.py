import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ─────────────────────────────────────────────────────────────────────────────
# PALETTE DEFINITIONS (Clean, Modern Dark Theme)
# ─────────────────────────────────────────────────────────────────────────────
BG_COLOR       = RGBColor(11, 15, 25)      # #0B0F19 (Deep Obsidian)
CARD_BG        = RGBColor(24, 32, 47)      # #18202F (Subtle Slate Card)
CARD_BORDER    = RGBColor(45, 55, 72)      # #2D3748 (Clean Border)
TEXT_WHITE     = RGBColor(248, 250, 252)   # #F8FAFC (Bright Text)
TEXT_MUTED     = RGBColor(160, 174, 192)   # #A0AEC0 (Readable Gray)
TEXT_DIM       = RGBColor(113, 128, 150)   # #718096 (Subtle Muted)

# Accent Colors
ACCENT_BLUE    = RGBColor(56, 189, 248)    # #38BDF8
ACCENT_INDIGO  = RGBColor(99, 102, 241)    # #6366F1
ACCENT_GREEN   = RGBColor(16, 185, 129)    # #10B981
ACCENT_AMBER   = RGBColor(245, 158, 11)    # #F59E0B
ACCENT_ROSE    = RGBColor(244, 63, 94)     # #F43F5E

prs = pptx.Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

def set_slide_background(slide):
    bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    bg_shape.fill.solid()
    bg_shape.fill.fore_color.rgb = BG_COLOR
    bg_shape.line.color.rgb = BG_COLOR
    return bg_shape

def add_header(slide, title, subtitle="", tag="INT 378 ACADEMIC DEFENSE"):
    set_slide_background(slide)
    
    # Tag badge
    tb_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.38), Inches(6.0), Inches(0.28))
    tf_tag = tb_tag.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = tag.upper()
    p_tag.font.size = Pt(8.5)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_BLUE

    # Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.64), Inches(11.7), Inches(0.52))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(20)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE

    # Subtitle
    if subtitle:
        tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.16), Inches(11.7), Inches(0.35))
        tf_sub = tb_sub.text_frame
        tf_sub.word_wrap = True
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle
        p_sub.font.size = Pt(10.5)
        p_sub.font.color.rgb = TEXT_MUTED

def add_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=CARD_BG):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.0)
    return card

def add_card_content(slide, left, top, width, height, title, items, title_color=ACCENT_BLUE):
    add_card(slide, left, top, width, height, border_color=CARD_BORDER)
    tb = slide.shapes.add_textbox(Inches(left + 0.2), Inches(top + 0.16), Inches(width - 0.4), Inches(height - 0.32))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p0 = tf.paragraphs[0]
    p0.text = title
    p0.font.size = Pt(11.5)
    p0.font.bold = True
    p0.font.color.rgb = title_color
    p0.space_after = Pt(6)
    
    for item in items:
        p = tf.add_paragraph()
        p.text = f"•  {item}"
        p.font.size = Pt(9.5)
        p.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(4)

def add_table(slide, left, top, width, height, headers, rows, col_widths=None):
    num_rows = len(rows) + 1
    num_cols = len(headers)
    table_shape = slide.shapes.add_table(num_rows, num_cols, Inches(left), Inches(top), Inches(width), Inches(height))
    table = table_shape.table
    
    if col_widths:
        for idx, w in enumerate(col_widths):
            table.columns[idx].width = Inches(w)
            
    # Headers
    for c_idx, h in enumerate(headers):
        cell = table.cell(0, c_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(18, 26, 40)
        cell.text_frame.text = h
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE
        p.alignment = PP_ALIGN.LEFT
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE

    # Data rows
    for r_idx, row in enumerate(rows):
        bg = CARD_BG if r_idx % 2 == 0 else RGBColor(20, 27, 40)
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.text_frame.text = str(val)
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(8.5)
            p.font.color.rgb = TEXT_WHITE if c_idx == 0 else TEXT_MUTED
            if c_idx == 0:
                p.font.bold = True
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE

def add_stat_box(slide, left, top, width, height, number, label, num_color=ACCENT_GREEN):
    add_card(slide, left, top, width, height)
    tb = slide.shapes.add_textbox(Inches(left), Inches(top + 0.12), Inches(width), Inches(height - 0.24))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p_num = tf.paragraphs[0]
    p_num.text = str(number)
    p_num.font.size = Pt(20)
    p_num.font.bold = True
    p_num.font.color.rgb = num_color
    p_num.alignment = PP_ALIGN.CENTER
    
    p_lbl = tf.add_paragraph()
    p_lbl.text = label
    p_lbl.font.size = Pt(8.5)
    p_lbl.font.color.rgb = TEXT_MUTED
    p_lbl.alignment = PP_ALIGN.CENTER

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 1: TITLE SLIDE
# ─────────────────────────────────────────────────────────────────────────────
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1)

bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(1.5), Inches(0.06))
bar.fill.solid()
bar.fill.fore_color.rgb = ACCENT_INDIGO
bar.line.color.rgb = ACCENT_INDIGO

tb_main = s1.shapes.add_textbox(Inches(0.8), Inches(2.1), Inches(11.7), Inches(2.3))
tf = tb_main.text_frame
tf.word_wrap = True

p = tf.paragraphs[0]
p.text = "CloudOps Sentinel"
p.font.size = Pt(42)
p.font.bold = True
p.font.color.rgb = TEXT_WHITE

p2 = tf.add_paragraph()
p2.text = "A Cloud-Native DevSecOps, Infrastructure Automation & Observability Platform"
p2.font.size = Pt(17)
p2.font.bold = True
p2.font.color.rgb = ACCENT_BLUE
p2.space_before = Pt(8)

p3 = tf.add_paragraph()
p3.text = "Academic Project Defense for Course INT 378 (Units I through VI)"
p3.font.size = Pt(12)
p3.font.color.rgb = TEXT_MUTED
p3.space_before = Pt(6)

# Presenter Card
add_card(s1, 0.8, 4.8, 11.7, 1.8, border_color=ACCENT_INDIGO)
tb_pres = s1.shapes.add_textbox(Inches(1.1), Inches(5.0), Inches(11.1), Inches(1.4))
tf_pres = tb_pres.text_frame
tf_pres.word_wrap = True

p_name = tf_pres.paragraphs[0]
p_name.text = "Kakumani Phaneendra"
p_name.font.size = Pt(15)
p_name.font.bold = True
p_name.font.color.rgb = TEXT_WHITE

p_det = tf_pres.add_paragraph()
p_det.text = "Registration No: 12418953  |  Section: K202313  |  School of Computer Science & Engineering"
p_det.font.size = Pt(11)
p_det.font.color.rgb = ACCENT_BLUE
p_det.space_before = Pt(4)

p_inst = tf_pres.add_paragraph()
p_inst.text = "Lovely Professional University  |  Local-First & 100% Zero Cloud Cost Architecture"
p_inst.font.size = Pt(10)
p_inst.font.color.rgb = TEXT_MUTED
p_inst.space_before = Pt(4)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 2: EXECUTIVE SUMMARY (PROBLEM & SOLUTION)
# ─────────────────────────────────────────────────────────────────────────────
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Executive Overview: Governing the Cloud-Native Lifecycle", 
           "Consolidating fragmented toolchains into a single, automated DevSecOps control plane")

add_card_content(s2, 0.8, 1.8, 5.7, 4.0, "Industry Problem Statement", [
    "Fragmented Toolchains: Disconnected tools create blindspots between Dev, Ops, and Security.",
    "Late Security (Shift-Right): Critical CVEs detected only post-deployment or during audits.",
    "Configuration Drift: Manual infrastructure tweaks cause unrepeatable environment skew.",
    "Runaway Cloud Bills: Oversized compute clusters and idle resources drain project budgets."
], title_color=ACCENT_ROSE)

add_card_content(s2, 6.8, 1.8, 5.7, 4.0, "The CloudOps Sentinel Platform", [
    "Unified Lifecycle Control: Governs Plan -> Commit -> Test -> Secure -> IaC -> Deploy -> Observe -> Recover.",
    "Shift-Left Quality Gates: Trivy container scanner automatically halts builds on severe CVEs.",
    "Multi-Cloud Declarative IaC: Terraform and AWS CloudFormation parity with drift detection.",
    "Deterministic FinOps: In-cluster cost estimation and automated rightsizing recommendations."
], title_color=ACCENT_GREEN)

# Stat Boxes
add_stat_box(s2, 0.8, 6.0, 3.7, 1.0, "100%", "INT 378 Syllabus Covered", ACCENT_BLUE)
add_stat_box(s2, 4.8, 6.0, 3.7, 1.0, "$0.00", "Cloud Spend (Local-First Guarantee)", ACCENT_GREEN)
add_stat_box(s2, 8.8, 6.0, 3.7, 1.0, "12 / 12", "12-Factor App Verified", ACCENT_AMBER)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 3: MASTER END-TO-END SYSTEM ARCHITECTURE DIAGRAM
# ─────────────────────────────────────────────────────────────────────────────
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "Master End-to-End System Architecture Diagram", 
           "Complete architectural blueprint: Presentation, Control Plane, Micro-Engines, Persistence, and Targets", "ARCHITECTURE")

# Display the master full-width architecture diagram
if os.path.exists('docs/slides_assets/full_architecture_diagram.png'):
    s3.shapes.add_picture('docs/slides_assets/full_architecture_diagram.png', Inches(0.8), Inches(1.65), Inches(11.73), Inches(5.45))


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 4: MICROSERVICES TIERS, WORKFLOWS & PORT TOPOLOGY
# ─────────────────────────────────────────────────────────────────────────────
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Microservices Topology, Component Workflows & Network Ports", 
           "Detailed specifications for the 5 containerized tiers, protocols, and security perimeters", "TOPOLOGY")

add_card_content(s4, 0.8, 1.8, 5.7, 4.0, "Containerized Service Topology", [
    "Frontend UI (Port 3000): Next.js 14, React 18, TypeScript, Tailwind Dark Theme, Recharts.",
    "API Server (Port 8080): Go 1.22 modular monolith with Gorilla Mux and JWT RBAC.",
    "Database (Port 5432): PostgreSQL 16 Alpine with connection pool & schema auto-migrations.",
    "Telemetry Engine (Port 9090): Prometheus scraping /metrics endpoints every 15s.",
    "Executive Visuals (Port 3001): Grafana OSS with pre-provisioned datasource & dashboards."
], title_color=ACCENT_BLUE)

add_card_content(s4, 6.8, 1.8, 5.7, 4.0, "Workflows & Communication Protocols", [
    "User Interaction: Browser sends HTTPS requests to Next.js; Axios injects JWT Bearer header.",
    "API to Database: High-performance pgx connection pooling over TCP port 5432.",
    "CI/CD Integration: Go API triggers Jenkins 13-stage pipelines and streams build logs.",
    "Telemetry Pipeline: Prometheus scrapes Go API /metrics; Grafana executes PromQL queries.",
    "Security Isolation: Kubernetes NetworkPolicy restricts ingress (Frontend -> Backend -> DB only)."
], title_color=ACCENT_GREEN)

# Bottom Architecture Summary Cards
add_stat_box(s4, 0.8, 6.0, 2.7, 1.0, "Port 3000", "Frontend Web UI", ACCENT_BLUE)
add_stat_box(s4, 3.8, 6.0, 2.7, 1.0, "Port 8080", "Core Go REST API", ACCENT_INDIGO)
add_stat_box(s4, 6.8, 6.0, 2.7, 1.0, "Port 5432", "PostgreSQL 16 DB", ACCENT_GREEN)
add_stat_box(s4, 9.8, 6.0, 2.7, 1.0, "9090 / 3001", "Prometheus & Grafana", ACCENT_AMBER)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 5: UNIT I — ADVANCED CLOUD SERVICES & CONTAINERIZATION
# ─────────────────────────────────────────────────────────────────────────────
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Unit I — Advanced Cloud Services & Containerization", 
           "AWS vs. Azure parity, Docker architecture/lifecycle, and scalable industry case studies", "UNIT I")

headers_u1 = ["Service Domain", "Amazon Web Services (AWS)", "Microsoft Azure", "CloudOps Implementation"]
rows_u1 = [
    ["Virtual Compute", "Amazon EC2 / Auto Scaling", "Azure Virtual Machines (VM)", "Local Go microservices & simulated EC2 pricing"],
    ["Containers", "Amazon ECS / EKS", "Azure AKS / Container Apps", "Declarative K8s manifests, HPA, and ECS templates"],
    ["Object Storage", "Amazon S3", "Azure Blob Storage", "AWS SDK v2 with zero-cost fallback in internal/cloud"],
    ["Databases", "Amazon RDS PostgreSQL", "Azure Database for PostgreSQL", "PostgreSQL 16 Alpine container with connection pool"],
    ["Telemetry", "Amazon CloudWatch", "Azure Monitor", "Prometheus /metrics exporter + CloudWatch metric sync"]
]
add_table(s5, 0.8, 1.8, 11.7, 2.7, headers_u1, rows_u1, col_widths=[1.8, 2.9, 2.8, 4.2])

add_card_content(s5, 0.8, 4.7, 5.7, 2.3, "Docker Lifecycle State Machine", [
    "Engine Architecture: Docker Client -> Host Daemon (dockerd) -> Hub Registry.",
    "State Flow: Created -> Running -> Paused -> Stopped -> Deleted.",
    "Multi-Stage Build: Slim Alpine binary (<30MB) with non-root security execution."
], title_color=ACCENT_BLUE)

add_card_content(s5, 6.8, 4.7, 5.7, 2.3, "Scalable Case Studies (Netflix, Amazon, Uber)", [
    "Netflix: Chaos engineering (Simian Army) & automated canary deployments.",
    "Amazon: Decentralized Two-Pizza Teams owning isolated microservices & multi-AZ VPC.",
    "Uber: DOMA (Domain-Oriented Microservice Architecture) & Jaeger distributed tracing."
], title_color=ACCENT_GREEN)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 6: UNIT II — INFRASTRUCTURE AS CODE (IaC) & FUTURE TRENDS
# ─────────────────────────────────────────────────────────────────────────────
s6 = prs.slides.add_slide(blank_layout)
add_header(s6, "Unit II — Infrastructure as Code: Terraform vs. CloudFormation", 
           "Declarative automation, state management, and emerging tools shaping the future of IaC", "UNIT II")

headers_u2 = ["Evaluation Criteria", "HashiCorp Terraform", "AWS CloudFormation", "Platform Implementation"]
rows_u2 = [
    ["Syntax & DSL", "HCL (HashiCorp Config Language)", "JSON / YAML template schema", "Side-by-side template preview in /infrastructure"],
    ["Portability", "Multi-cloud (AWS, Azure, GCP)", "AWS-native managed engine", "Terraform provides neutrality; CFN offers native rollbacks"],
    ["State Storage", "Remote state (.tfstate in S3/PG)", "Managed automatically by AWS", "Automated plan dry-run verified before apply"],
    ["Modularity", "Composable reusable modules", "Nested Stacks & CFN Modules", "infrastructure/terraform/modules/ (VPC, ECS, Backend)"]
]
add_table(s6, 0.8, 1.8, 11.7, 2.6, headers_u2, rows_u2, col_widths=[2.0, 3.1, 3.1, 3.5])

add_card_content(s6, 0.8, 4.6, 2.7, 2.4, "OpenTofu", [
    "Linux Foundation open-source fork.",
    "Community governance.",
    "Full backwards compatibility.",
    "Zero licensing friction."
], title_color=ACCENT_BLUE)

add_card_content(s6, 3.8, 4.6, 2.7, 2.4, "Pulumi", [
    "Multi-Language IaC (TS, Python, Go).",
    "IDE autocompletion & type safety.",
    "Object-oriented modular reuse.",
    "Native unit testing support."
], title_color=ACCENT_INDIGO)

add_card_content(s6, 6.8, 4.6, 2.7, 2.4, "Crossplane", [
    "Kubernetes-native control plane.",
    "Cloud resources via K8s CRDs.",
    "Continuous reconciliation loop.",
    "Self-healing infrastructure."
], title_color=ACCENT_GREEN)

add_card_content(s6, 9.8, 4.6, 2.7, 2.4, "Policy-as-Code", [
    "Open Policy Agent (OPA) / Rego.",
    "Automated pre-apply guardrails.",
    "Enforces tags & encryption.",
    "Integrated governance engine."
], title_color=ACCENT_AMBER)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 7: UNIT III — AGILE AT SCALE, CI/CD & DEPLOYMENT STRATEGIES
# ─────────────────────────────────────────────────────────────────────────────
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "Unit III — Agile at Scale, CI/CD Automation & A/B Testing", 
           "SAFe vs. LeSS, 13-stage Jenkins pipeline, BDD specifications, and Canary traffic splitting", "UNIT III")

if os.path.exists('docs/slides_assets/devsecops_pipeline.png'):
    s7.shapes.add_picture('docs/slides_assets/devsecops_pipeline.png', Inches(0.8), Inches(1.8), Inches(11.7), Inches(2.2))

add_card_content(s7, 0.8, 4.2, 3.7, 2.8, "Scaling Agile: SAFe vs. LeSS", [
    "SAFe: Agile Release Trains (50-125 engineers) & 8-12 week Program Increments.",
    "LeSS: Single Product Backlog, shared sprints, and cross-functional teams.",
    "Product Strategy: Trunk-based delivery with semantic versioning."
], title_color=ACCENT_BLUE)

add_card_content(s7, 4.8, 4.2, 3.7, 2.8, "TDD & BDD Specifications", [
    "TDD: Red -> Green -> Refactor cycle with Go unit tests (100% pass).",
    "BDD: Executable Gherkin syntax (Given-When-Then) for security gates.",
    "Technical Debt: Priority-ranked debt register tracking architectural debt."
], title_color=ACCENT_INDIGO)

add_card_content(s7, 8.8, 4.2, 3.7, 2.8, "A/B & Canary Deployments", [
    "Canary Splitting: 85% Stable (v1.4.2) / 15% Canary (v2.0.0).",
    "Dynamic Controller: Real-time slider via /api/v1/syllabus/ab-test/split.",
    "Automated Rollback: Reverts to 100% Stable if 5xx errors breach threshold."
], title_color=ACCENT_GREEN)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 8: UNIT IV — MONITORING & OBSERVABILITY (PROMETHEUS & GRAFANA)
# ─────────────────────────────────────────────────────────────────────────────
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Unit IV — Observability: Prometheus Metrics & Grafana Dashboards", 
           "High-cardinality time-series collection, SRE Golden Signals, and automated incident recovery", "UNIT IV")

if os.path.exists('docs/slides_assets/golden_signals.png'):
    s8.shapes.add_picture('docs/slides_assets/golden_signals.png', Inches(0.8), Inches(1.8), Inches(11.7), Inches(2.5))

add_card_content(s8, 0.8, 4.5, 5.7, 2.5, "Telemetry & Golden Signals", [
    "Prometheus Engine: Custom Go middleware exposing /metrics endpoint.",
    "Latency & Traffic: Tracked via http_request_duration_seconds & counters.",
    "Errors & Saturation: Real-time 5xx monitoring and CPU/memory utilization.",
    "Grafana Dashboards: Pre-provisioned executive panels on port 3001.",
    "Scaling Strategy: Prometheus federation with Thanos/Cortex for long-term retention."
], title_color=ACCENT_BLUE)

add_card_content(s8, 6.8, 4.5, 5.7, 2.5, "Actionable Alerting & Incident Recovery", [
    "HighErrorRate (>5% for 2m): Automated zero-downtime rollback triggered.",
    "HighLatency (p95 > 1s): Kubernetes HPA scales pod replicas from 2 to 5.",
    "ServiceDown (up == 0): Container restart policy and liveness reboot.",
    "Closed-Loop Workflow: Detect -> Alert -> Diagnose -> Rollback -> Verify.",
    "Audit Recording: All alerts and recovery actions saved to immutable log."
], title_color=ACCENT_ROSE)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 9: UNIT V — DEVSECOPS, CLOUD SECURITY & EMERGING TRENDS
# ─────────────────────────────────────────────────────────────────────────────
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Unit V — DevSecOps: Shift-Left Gates, K8s Zero-Trust & SLSA", 
           "Embedding security early in CI/CD with blocking gates and supply chain integrity", "UNIT V")

add_card_content(s9, 0.8, 1.8, 3.7, 3.0, "Shift-Left Quality Gates", [
    "Early Scanning: Secret detection and static analysis during pull requests.",
    "Trivy Vulnerability Scanner: Scans container image and OS packages.",
    "Blocking Gate Policy: Rejects builds if Critical CVEs > 0 or High > 2.",
    "Audited Results: Vulnerability reports persisted in PostgreSQL."
], title_color=ACCENT_ROSE)

add_card_content(s9, 4.8, 1.8, 3.7, 3.0, "Cloud Security & Zero-Trust", [
    "IAM RBAC: Admin, DevOps, Auditor roles with JWT & salted Bcrypt.",
    "K8s Network Isolation: Default-deny ingress (kubernetes/networkpolicy.yaml).",
    "Container Hardening: Non-root execution and read-only root filesystems.",
    "Secrets Management: Base64 encrypted Secret manifests, zero code secrets."
], title_color=ACCENT_GREEN)

add_card_content(s9, 8.8, 1.8, 3.7, 3.0, "Emerging Security Trends", [
    "SLSA Framework (Levels 1–4): Cryptographic build provenance verification.",
    "SBOM Generation: SPDX and CycloneDX dependency inventory.",
    "Cosign / Sigstore: Keyless image signing verified by admission controllers.",
    "Zero-Trust Supply Chain: Only signed, verified images reach production."
], title_color=ACCENT_BLUE)

add_card(s9, 0.8, 5.0, 11.7, 1.9, border_color=ACCENT_INDIGO)
tb = s9.shapes.add_textbox(Inches(1.0), Inches(5.1), Inches(11.3), Inches(1.7))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "DevSecOps Shift-Left Principle in CloudOps Sentinel:"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_INDIGO
p2 = tf.add_paragraph()
p2.text = "Traditional DevOps tests security post-deployment, causing costly launch delays. CloudOps Sentinel enforces automated Trivy CVE gates in Jenkins stage 7, stopping vulnerable images before they can be promoted to Kubernetes or AWS ECS."
p2.font.size = Pt(9.5)
p2.font.color.rgb = TEXT_MUTED
p2.space_before = Pt(4)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 10: UNIT VI — 12-FACTOR APP & CLOUD-NATIVE ARCHITECTURE
# ─────────────────────────────────────────────────────────────────────────────
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Unit VI — The 12-Factor App Methodology & Serverless Tradeoffs", 
           "100% compliance verification (12/12 factors) and Serverless vs. Container analysis", "UNIT VI")

if os.path.exists('docs/slides_assets/twelve_factor_bar.png'):
    s10.shapes.add_picture('docs/slides_assets/twelve_factor_bar.png', Inches(0.8), Inches(1.8), Inches(5.8), Inches(3.2))

headers_serv = ["Dimension", "Serverless (Lambda / Fargate)", "Containerized (EKS / K8s)"]
rows_serv = [
    ["Cold Start Latency", "100ms - 800ms during init", "Sub-millisecond (active replicas)"],
    ["Cost Scaling Curve", "$0 at idle; billed per ms", "Fixed baseline VM node overhead"],
    ["Maintenance", "Zero server/OS patching", "Requires managing node groups & K8s"],
    ["Implementation", "ECS Fargate IaC templates", "Kubernetes manifests with HPA"]
]
add_table(s10, 6.8, 1.8, 5.7, 3.2, headers_serv, rows_serv, col_widths=[1.5, 2.1, 2.1])

add_card_content(s10, 0.8, 5.2, 11.7, 1.8, "The 12-Factor App Methodology — 12/12 Verified Compliant", [
    "I. Codebase (Git)  |  II. Dependencies (go.mod, package-lock)  |  III. Config (Environment variables)  |  IV. Backing Services (Attached URLs)",
    "V. Build/Release/Run (Docker multi-stage)  |  VI. Processes (Stateless Go API)  |  VII. Port Binding (:8080, :3000)  |  VIII. Concurrency (HPA Replicas)",
    "IX. Disposability (<2s boot, SIGTERM)  |  X. Dev/Prod Parity (Docker containers)  |  XI. Logs (stdout stream)  |  XII. Admin Tasks (Auto-migrations)"
], title_color=ACCENT_GREEN)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 11: UNIT VI — FINOPS COST OPTIMIZATION & GOVERNANCE
# ─────────────────────────────────────────────────────────────────────────────
s11 = prs.slides.add_slide(blank_layout)
add_header(s11, "Unit VI — FinOps Cost Optimization & Policy-as-Code Governance", 
           "Granular cloud workload billing, rightsizing recommendations, and compliance audit trails", "UNIT VI")

if os.path.exists('docs/slides_assets/finops_breakdown.png'):
    s11.shapes.add_picture('docs/slides_assets/finops_breakdown.png', Inches(0.8), Inches(1.8), Inches(5.5), Inches(3.5))

add_card_content(s11, 6.5, 1.8, 6.0, 5.0, "FinOps Engine & Policy Governance", [
    "FinOps Lifecycle: Inform (visibility) -> Optimize (rightsizing) -> Operate (budget alerts).",
    "Granular Workload Costing: Simulates EC2 compute, EKS, RDS, EBS, and CloudWatch spend.",
    "Rightsizing Engine: Detects idle resources & oversized memory, saving up to 35% monthly spend.",
    "Budget Alarms: Threshold-based alerts trigger when spending exceeds 80% of monthly cap.",
    "Policy-as-Code: Enforces mandatory environment tags, encryption at rest, and S3 restrictions.",
    "Immutable Audit Trail: Append-only log recording timestamp, user, action, and IP.",
    "Zero-Cost Demo: 100% offline local billing in PostgreSQL (no cloud charges incurred)."
], title_color=ACCENT_BLUE)

add_card(s11, 0.8, 5.5, 5.5, 1.3, border_color=ACCENT_GREEN)
tb = s11.shapes.add_textbox(Inches(1.0), Inches(5.6), Inches(5.1), Inches(1.1))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "Monthly Simulated Spend: $348.00"
p.font.size = Pt(12)
p.font.bold = True
p.font.color.rgb = ACCENT_GREEN
p2 = tf.add_paragraph()
p2.text = "Offline billing simulation allows realistic FinOps demonstration with zero cloud bill risk."
p2.font.size = Pt(9)
p2.font.color.rgb = TEXT_MUTED


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 12: PLATFORM VERIFICATION & LIVE DEMONSTRATION
# ─────────────────────────────────────────────────────────────────────────────
s12 = prs.slides.add_slide(blank_layout)
add_header(s12, "Platform Verification, Empirical Test Results & Live Endpoints", 
           "Verifying 100% build health, unit test coverage, and local demo readiness", "VERIFICATION")

add_card_content(s12, 0.8, 1.8, 5.7, 3.8, "Local Platform Endpoints", [
    "Frontend Dashboard: http://localhost:3000 (Next.js 14 Web UI)",
    "API Server Health: http://localhost:8080/api/v1/health (Go REST API)",
    "Prometheus Telemetry: http://localhost:9090 (Metrics Scraper)",
    "Grafana Dashboards: http://localhost:3001 (admin / admin)",
    "PostgreSQL Database: localhost:5432 (Stateful Data Store)",
    "Curriculum Hub: http://localhost:3000/syllabus (Interactive Center)"
], title_color=ACCENT_BLUE)

add_card_content(s12, 6.8, 1.8, 5.7, 3.8, "Empirical Test Results", [
    "Backend Unit Tests: 100% PASS rate across all Go modules (go test ./...).",
    "Frontend Production Build: 15 / 15 static routes compiled with 0 errors.",
    "End-to-End Lifecycle Test: 9-stage verification in tests/e2e/test_lifecycle.sh.",
    "Security Gate Test: Verified blocking behavior on severe CVEs.",
    "Local-First Guarantee: All 5 containers start via docker compose up -d."
], title_color=ACCENT_GREEN)

# Stat boxes
add_stat_box(s12, 0.8, 5.8, 2.7, 1.1, "15 / 15", "Routes Compiled", ACCENT_BLUE)
add_stat_box(s12, 3.8, 5.8, 2.7, 1.1, "100%", "Go Tests Passing", ACCENT_GREEN)
add_stat_box(s12, 6.8, 5.8, 2.7, 1.1, "$0.00", "Cloud Charges", ACCENT_AMBER)
add_stat_box(s12, 9.8, 5.8, 2.7, 1.1, "0 Errors", "Build Status", ACCENT_INDIGO)


# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 13: CONCLUSION & DEFENSE SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
s13 = prs.slides.add_slide(blank_layout)
add_header(s13, "Conclusion, Future Roadmap & Defense Summary", 
           "CloudOps Sentinel demonstrates enterprise-grade DevSecOps, IaC, and FinOps governance", "CONCLUSION")

add_card_content(s13, 0.8, 1.8, 5.7, 4.0, "Key Academic Achievements", [
    "Complete Syllabus Coverage: Implements 100% of INT 378 across Units I through VI.",
    "End-to-End Lifecycle: Integrates Plan, Commit, Test, Secure, Build, IaC, Deploy, Observe, Recover, and Govern.",
    "Zero-Cost Architecture: Production-grade enterprise emulation requiring $0.00 cloud spend.",
    "Scalable Case Studies: Incorporates architectural patterns from Netflix, Amazon, and Uber.",
    "Production Ready: Docker Compose orchestration and declarative Kubernetes manifests with HPA."
], title_color=ACCENT_BLUE)

add_card_content(s13, 6.8, 1.8, 5.7, 4.0, "Future Engineering Horizons", [
    "eBPF Observability: Kernel-level network packet tracing without user-space overhead.",
    "AI-Driven Remediation: Automated LLM root-cause analysis and self-healing PRs.",
    "Multi-Region Active-Active: Automated cross-cloud disaster recovery between AWS and Azure.",
    "GitOps Promotion: ArgoCD integration with declarative pull-based Kubernetes synchronization."
], title_color=ACCENT_INDIGO)

# Thank you banner
add_card(s13, 0.8, 6.0, 11.7, 1.0, border_color=ACCENT_GREEN)
tb_ty = s13.shapes.add_textbox(Inches(1.0), Inches(6.1), Inches(11.3), Inches(0.8))
tf_ty = tb_ty.text_frame
p_ty = tf_ty.paragraphs[0]
p_ty.text = "Thank you! Open for Questions & Evaluation  |  Kakumani Phaneendra (Reg: 12418953, LPU)"
p_ty.font.size = Pt(13)
p_ty.font.bold = True
p_ty.font.color.rgb = ACCENT_GREEN
p_ty.alignment = PP_ALIGN.CENTER

# ─────────────────────────────────────────────────────────────────────────────
# SAVE PRESENTATION
# ─────────────────────────────────────────────────────────────────────────────
output_path = "CloudOps_Sentinel_INT378_Presentation.pptx"
prs.save(output_path)
print(f"Master presentation with complete architecture visuals saved successfully to: {output_path} ({len(prs.slides)} slides)")
