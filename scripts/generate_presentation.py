import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ─────────────────────────────────────────────────────────────────────────────
# PALETTE DEFINITIONS (Modern DevSecOps Dark Theme)
# ─────────────────────────────────────────────────────────────────────────────
BG_COLOR       = RGBColor(9, 13, 24)       # #090D18
CARD_BG        = RGBColor(17, 24, 39)      # #111827 (Glassmorphic Deep Slate)
CARD_BORDER    = RGBColor(37, 51, 74)      # #25334A
TEXT_WHITE     = RGBColor(248, 250, 252)   # #F8FAFC
TEXT_MUTED     = RGBColor(156, 163, 175)   # #9CA3AF
TEXT_DIM       = RGBColor(107, 114, 128)   # #6B7280

# Neon Accents
ACCENT_BLUE    = RGBColor(56, 189, 248)    # #38BDF8
ACCENT_INDIGO  = RGBColor(99, 102, 241)    # #6366F1
ACCENT_GREEN   = RGBColor(16, 185, 129)    # #10B981
ACCENT_AMBER   = RGBColor(245, 158, 11)    # #F59E0B
ACCENT_ROSE    = RGBColor(244, 63, 94)     # #F43F5E

prs = pptx.Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
blank_layout = prs.slide_layouts[6]

def set_slide_background(slide, is_title=False):
    bg_img = 'docs/slides_assets/slide_bg_title.png' if is_title else 'docs/slides_assets/slide_bg_content.png'
    if os.path.exists(bg_img):
        slide.shapes.add_picture(bg_img, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
    else:
        bg_shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(7.5))
        bg_shape.fill.solid()
        bg_shape.fill.fore_color.rgb = BG_COLOR
        bg_shape.line.color.rgb = BG_COLOR

def set_speaker_notes(slide, notes_text):
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = notes_text

def add_header(slide, title, subtitle="", tag="INT 378 ACADEMIC DEFENSE"):
    set_slide_background(slide, is_title=False)
    
    # Tag badge
    tb_tag = slide.shapes.add_textbox(Inches(0.8), Inches(0.35), Inches(6.0), Inches(0.28))
    tf_tag = tb_tag.text_frame
    tf_tag.word_wrap = True
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = tag.upper()
    p_tag.font.size = Pt(8.5)
    p_tag.font.bold = True
    p_tag.font.color.rgb = ACCENT_BLUE

    # Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.60), Inches(11.7), Inches(0.52))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.size = Pt(20)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_WHITE

    # Subtitle
    if subtitle:
        tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.12), Inches(11.7), Inches(0.35))
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
    card.line.width = Pt(1.2)
    return card

def add_card_content(slide, left, top, width, height, title, items, title_color=ACCENT_BLUE):
    add_card(slide, left, top, width, height, border_color=CARD_BORDER)
    tb = slide.shapes.add_textbox(Inches(left + 0.18), Inches(top + 0.14), Inches(width - 0.36), Inches(height - 0.28))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p0 = tf.paragraphs[0]
    p0.text = title
    p0.font.size = Pt(11)
    p0.font.bold = True
    p0.font.color.rgb = title_color
    p0.space_after = Pt(5)
    
    for item in items:
        p = tf.add_paragraph()
        p.text = f"•  {item}"
        p.font.size = Pt(9.0)
        p.font.color.rgb = TEXT_MUTED
        p.space_after = Pt(3.5)

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
        cell.fill.fore_color.rgb = RGBColor(15, 23, 42)
        cell.text_frame.text = h
        p = cell.text_frame.paragraphs[0]
        p.font.size = Pt(9.0)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE
        p.alignment = PP_ALIGN.LEFT
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE

    # Data rows
    for r_idx, row in enumerate(rows):
        bg = CARD_BG if r_idx % 2 == 0 else RGBColor(14, 20, 32)
        for c_idx, val in enumerate(row):
            cell = table.cell(r_idx + 1, c_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg
            cell.text_frame.text = str(val)
            p = cell.text_frame.paragraphs[0]
            p.font.size = Pt(8.2)
            p.font.color.rgb = TEXT_WHITE if c_idx == 0 else TEXT_MUTED
            if c_idx == 0:
                p.font.bold = True
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE

def add_stat_box(slide, left, top, width, height, number, label, num_color=ACCENT_GREEN):
    add_card(slide, left, top, width, height)
    tb = slide.shapes.add_textbox(Inches(left), Inches(top + 0.10), Inches(width), Inches(height - 0.20))
    tf = tb.text_frame
    tf.word_wrap = True
    
    p_num = tf.paragraphs[0]
    p_num.text = str(number)
    p_num.font.size = Pt(18)
    p_num.font.bold = True
    p_num.font.color.rgb = num_color
    p_num.alignment = PP_ALIGN.CENTER
    
    p_lbl = tf.add_paragraph()
    p_lbl.text = label
    p_lbl.font.size = Pt(8.0)
    p_lbl.font.color.rgb = TEXT_MUTED
    p_lbl.alignment = PP_ALIGN.CENTER

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 1: TITLE SLIDE (Rich Cyber Background)
# ─────────────────────────────────────────────────────────────────────────────
s1 = prs.slides.add_slide(blank_layout)
set_slide_background(s1, is_title=True)

# Glowing accent bar
bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(1.8), Inches(1.5), Inches(0.06))
bar.fill.solid()
bar.fill.fore_color.rgb = ACCENT_INDIGO
bar.line.color.rgb = ACCENT_INDIGO

tb_main = s1.shapes.add_textbox(Inches(0.8), Inches(2.1), Inches(11.7), Inches(2.3))
tf = tb_main.text_frame
tf.word_wrap = True

p = tf.paragraphs[0]
p.text = "CloudOps Sentinel"
p.font.size = Pt(44)
p.font.bold = True
p.font.color.rgb = TEXT_WHITE

p2 = tf.add_paragraph()
p2.text = "A Cloud-Native DevSecOps, Infrastructure Automation & Observability Platform"
p2.font.size = Pt(17)
p2.font.bold = True
p2.font.color.rgb = ACCENT_BLUE
p2.space_before = Pt(8)

p3 = tf.add_paragraph()
p3.text = "Academic Capstone Project Defense for Course INT 378 (Units I through VI)"
p3.font.size = Pt(12)
p3.font.color.rgb = TEXT_MUTED
p3.space_before = Pt(6)

# Presenter Card with glowing accent
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

set_speaker_notes(s1, 
    "Respected professors, evaluators, and colleagues. Good morning/afternoon. "
    "My name is Kakumani Phaneendra, Registration Number 12418953, Section K202313, from the School of Computer Science & Engineering at Lovely Professional University. "
    "Today, I am proud to present my capstone project defense for course INT 378: CloudOps Sentinel — A Cloud-Native DevSecOps, Infrastructure Automation & Observability Platform. "
    "The platform governs the complete software engineering lifecycle from planning to governance, designed with a strict zero-cost, local-first engineering guarantee."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 2: EXECUTIVE SUMMARY (With Side Illustration)
# ─────────────────────────────────────────────────────────────────────────────
s2 = prs.slides.add_slide(blank_layout)
add_header(s2, "Executive Overview: Governing the Cloud-Native Lifecycle", 
           "Consolidating fragmented toolchains into a single, automated DevSecOps control plane", "EXECUTIVE SUMMARY")

add_card_content(s2, 0.8, 1.75, 4.55, 3.9, "Industry Problem Statement", [
    "Fragmented Toolchains: Disconnected tools create blindspots between Dev, Ops, and Security.",
    "Late Security (Shift-Right): Critical CVEs detected only post-deployment or during audits.",
    "Configuration Drift: Manual infrastructure tweaks cause unrepeatable environment skew.",
    "Runaway Cloud Bills: Oversized compute clusters and idle resources drain project budgets."
], title_color=ACCENT_ROSE)

add_card_content(s2, 5.55, 1.75, 4.55, 3.9, "The CloudOps Sentinel Solution", [
    "Unified Lifecycle Control: Governs Plan -> Commit -> Test -> Secure -> IaC -> Deploy -> Observe -> Recover.",
    "Shift-Left Quality Gates: Trivy container scanner automatically halts builds on severe CVEs.",
    "Multi-Cloud Declarative IaC: Terraform and AWS CloudFormation parity with drift detection.",
    "Deterministic FinOps: In-cluster cost estimation and automated rightsizing recommendations."
], title_color=ACCENT_GREEN)

# Side Graphic Banner
if os.path.exists('docs/slides_assets/side_banner_summary.png'):
    s2.shapes.add_picture('docs/slides_assets/side_banner_summary.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

# Stat Boxes
add_stat_box(s2, 0.8, 5.85, 2.9, 0.95, "100%", "INT 378 Syllabus Covered", ACCENT_BLUE)
add_stat_box(s2, 3.9, 5.85, 2.9, 0.95, "$0.00", "Cloud Spend (Local Guarantee)", ACCENT_GREEN)
add_stat_box(s2, 7.0, 5.85, 3.1, 0.95, "12 / 12", "12-Factor App Verified", ACCENT_AMBER)

set_speaker_notes(s2,
    "Let us examine the core industry dilemma that motivated this project. "
    "In modern engineering teams, developers, operations engineers, and security analysts often operate in silos using disconnected tools. "
    "Security audits are traditionally conducted at the very end of the release cycle, creating costly release delays when critical CVEs are uncovered late. "
    "Moreover, manual changes to cloud infrastructure introduce configuration drift, while uncontrolled cluster provisioning bleeds budgets. "
    "CloudOps Sentinel bridges these disconnected processes into a single, automated control plane governing a 10-stage lifecycle with Shift-Left quality gates and in-cluster FinOps."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 3: MASTER END-TO-END SYSTEM ARCHITECTURE DIAGRAM
# ─────────────────────────────────────────────────────────────────────────────
s3 = prs.slides.add_slide(blank_layout)
add_header(s3, "Master End-to-End System Architecture Diagram", 
           "Complete architectural blueprint: Presentation, Control Plane, Micro-Engines, Persistence, and Targets", "ARCHITECTURE")

if os.path.exists('docs/slides_assets/full_architecture_diagram.png'):
    s3.shapes.add_picture('docs/slides_assets/full_architecture_diagram.png', Inches(0.8), Inches(1.65), Inches(11.73), Inches(5.45))

set_speaker_notes(s3,
    "This is our Master End-to-End System Architecture Diagram, illustrating the entire platform blueprint across three operational layers. "
    "At Layer 1, the client presentation layer is delivered via Next.js 14 and TypeScript, featuring a dark DevOps theme with real-time Recharts visualizations. "
    "At Layer 2, our core Go 1.22 modular monolith REST API runs on port 8080. It incorporates 10 dedicated micro-engines: Auth & RBAC, Projects, IaC Stacks, Deployments, Jenkins Pipelines, Trivy Security Gates, SRE Monitoring, FinOps Billing, Policy-as-Code Governance, and the AWS SDK v2 integration. "
    "At Layer 3, we have state persistence in PostgreSQL 16 Alpine, automated CI/CD runners, Kubernetes cluster orchestration with HPA autoscaling, Prometheus telemetry scraping on port 9090, Grafana dashboards on port 3001, and our zero-cost AWS fallback."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 4: MICROSERVICES TIERS & NETWORK TOPOLOGY (With Side Illustration)
# ─────────────────────────────────────────────────────────────────────────────
s4 = prs.slides.add_slide(blank_layout)
add_header(s4, "Microservices Topology, Component Workflows & Network Ports", 
           "Detailed specifications for the 5 containerized tiers, protocols, and security perimeters", "TOPOLOGY")

add_card_content(s4, 0.8, 1.75, 4.55, 3.9, "Containerized Service Topology", [
    "Frontend UI (Port 3000): Next.js 14, React 18, TypeScript, Tailwind Dark Theme, Recharts.",
    "API Server (Port 8080): Go 1.22 modular monolith with Gorilla Mux and JWT RBAC.",
    "Database (Port 5432): PostgreSQL 16 Alpine with connection pool & schema auto-migrations.",
    "Telemetry Engine (Port 9090): Prometheus scraping /metrics endpoints every 15s.",
    "Executive Visuals (Port 3001): Grafana OSS with pre-provisioned datasource & dashboards."
], title_color=ACCENT_BLUE)

add_card_content(s4, 5.55, 1.75, 4.55, 3.9, "Workflows & Security Protocols", [
    "User Interaction: Browser sends HTTPS requests to Next.js; Axios injects JWT Bearer header.",
    "API to Database: High-performance pgx connection pooling over TCP port 5432.",
    "CI/CD Integration: Go API triggers Jenkins 13-stage pipelines and streams build logs.",
    "Telemetry Pipeline: Prometheus scrapes Go API /metrics; Grafana executes PromQL queries.",
    "Security Isolation: Kubernetes NetworkPolicy restricts ingress (Frontend -> Backend -> DB only)."
], title_color=ACCENT_GREEN)

# Embed Side Illustrated Panel
if os.path.exists('docs/slides_assets/side_banner_devops.png'):
    s4.shapes.add_picture('docs/slides_assets/side_banner_devops.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

# Bottom Port Badges
add_stat_box(s4, 0.8, 5.85, 2.2, 0.95, "Port 3000", "Frontend Web UI", ACCENT_BLUE)
add_stat_box(s4, 3.2, 5.85, 2.2, 0.95, "Port 8080", "Core Go REST API", ACCENT_INDIGO)
add_stat_box(s4, 5.6, 5.85, 2.2, 0.95, "Port 5432", "PostgreSQL 16 DB", ACCENT_GREEN)
add_stat_box(s4, 8.0, 5.85, 2.1, 0.95, "9090 / 3001", "Prometheus & Grafana", ACCENT_AMBER)

set_speaker_notes(s4,
    "Here we break down the microservices topology and communication protocols across the 5 primary container tiers. "
    "All client communications use HTTPS with automatic JWT Bearer token injection. "
    "The Go API interacts with PostgreSQL over port 5432 using a connection pool for maximum throughput. "
    "Prometheus queries our /metrics endpoint every 15 seconds, and Grafana connects via PromQL to display dashboards on port 3001. "
    "Crucially, our Kubernetes NetworkPolicy enforces a zero-trust default-deny ingress model: frontend pods cannot directly touch the database, eliminating lateral movement vectors."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 5: UNIT I — ADVANCED CLOUD SERVICES & CONTAINERIZATION (Exp 1 & 4)
# ─────────────────────────────────────────────────────────────────────────────
s5 = prs.slides.add_slide(blank_layout)
add_header(s5, "Unit I — Cloud Compute, VPC Networking & Docker Lifecycle", 
           "Syllabus Exp 1 (EC2/VPC/Nginx/Public IP) & Exp 4 (Docker Build/Ports/Hub/Lifecycle)", "UNIT I | EXP 1 & 4")

headers_u1 = ["Service Domain", "Amazon Web Services (AWS)", "Microsoft Azure", "CloudOps Implementation"]
rows_u1 = [
    ["Virtual Compute", "Amazon EC2 / Auto Scaling", "Azure Virtual Machines (VM)", "EC2 Nginx web server module (Exp 1) & multi-container runtime"],
    ["Containers", "Amazon ECS / EKS", "Azure AKS / Container Apps", "Declarative K8s manifests, HPA, and ECS Fargate templates"],
    ["Object Storage", "Amazon S3", "Azure Blob Storage", "AWS SDK v2 with zero-cost fallback in internal/cloud"],
    ["Databases", "Amazon RDS PostgreSQL", "Azure Database for PostgreSQL", "PostgreSQL 16 Alpine container with connection pool"],
    ["Telemetry", "Amazon CloudWatch", "Azure Monitor", "Prometheus /metrics exporter + CloudWatch metric sync"]
]
add_table(s5, 0.8, 1.75, 9.3, 2.65, headers_u1, rows_u1, col_widths=[1.5, 2.4, 2.3, 3.1])

if os.path.exists('docs/slides_assets/side_banner_cloud_compare.png'):
    s5.shapes.add_picture('docs/slides_assets/side_banner_cloud_compare.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

add_card_content(s5, 0.8, 4.60, 4.55, 2.15, "Docker Lifecycle State Machine (Exp 4)", [
    "Engine Architecture: Docker Client -> Host Daemon (dockerd) -> Hub Registry.",
    "State Flow: Created -> Running -> Paused -> Stopped -> Deleted (Verified).",
    "Multi-Stage Build: Slim Alpine binary (<30MB) with non-root security execution."
], title_color=ACCENT_BLUE)

add_card_content(s5, 5.55, 4.60, 4.55, 2.15, "EC2 & Scalable Case Studies (Exp 1)", [
    "EC2 Nginx Deployment: Automated UserData provisioning with public IP accessibility.",
    "Netflix: Chaos engineering (Simian Army) & automated canary deployments.",
    "Uber: DOMA (Domain-Oriented Microservice Architecture) & distributed tracing."
], title_color=ACCENT_GREEN)

set_speaker_notes(s5,
    "Unit I covers Advanced Cloud Infrastructure and Containerization, directly satisfying Lab Experiment 1 and Experiment 4. "
    "For Experiment 1, we implemented EC2 instance provisioning with VPC networking, ingress security groups for ports 80, 443, and 22, and automated Nginx web server installation with public IP verification. "
    "For Experiment 4, our container engine implements the full Docker lifecycle state machine from Created to Running, Paused, Stopped, and Deleted, using multi-stage builds to compress our Go binary under 30MB, ready for Docker Hub tagging and distribution. "
    "We also synthesized scalable cloud architectures from Netflix, Amazon, and Uber."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 6: UNIT II — INFRASTRUCTURE AS CODE: CLOUDFORMATION & TERRAFORM (Exp 3 & 5)
# ─────────────────────────────────────────────────────────────────────────────
s6 = prs.slides.add_slide(blank_layout)
add_header(s6, "Unit II — Infrastructure as Code: Terraform vs. CloudFormation", 
           "Syllabus Exp 3 (CloudFormation Stacks & Rollbacks) & Exp 5 (Terraform EC2/S3 & State)", "UNIT II | EXP 3 & 5")

headers_u2 = ["Evaluation Criteria", "HashiCorp Terraform (Exp 5)", "AWS CloudFormation (Exp 3)", "Platform Implementation"]
rows_u2 = [
    ["Syntax & DSL", "HCL (HashiCorp Config Language)", "JSON / YAML template schema", "Side-by-side template preview in /infrastructure"],
    ["Portability", "Multi-cloud (AWS, Azure, GCP)", "AWS-native managed engine", "Terraform provides neutrality; CFN offers native rollbacks"],
    ["State Storage", "Remote state (.tfstate in S3/PG)", "Managed automatically by AWS", "Automated plan dry-run verified before apply"],
    ["Modularity", "Composable modules (VPC, S3, EC2)", "Nested Stacks & CFN Modules", "infrastructure/terraform/modules/ & cloudformation/"]
]
add_table(s6, 0.8, 1.75, 9.3, 2.65, headers_u2, rows_u2, col_widths=[1.6, 2.5, 2.5, 2.7])

if os.path.exists('docs/slides_assets/side_banner_iac.png'):
    s6.shapes.add_picture('docs/slides_assets/side_banner_iac.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

add_card_content(s6, 0.8, 4.60, 2.15, 2.15, "OpenTofu", [
    "Linux Foundation OSS.",
    "Community governed.",
    "Full backward compat.",
    "Zero licensing lock-in."
], title_color=ACCENT_BLUE)

add_card_content(s6, 3.15, 4.60, 2.15, 2.15, "Pulumi", [
    "Real code (TS, Go, Py).",
    "Type-safe compilation.",
    "OOP modular patterns.",
    "Native test assertions."
], title_color=ACCENT_INDIGO)

add_card_content(s6, 5.50, 4.60, 2.15, 2.15, "Crossplane", [
    "K8s cloud control plane.",
    "Cloud resources as CRDs.",
    "Reconciliation loop.",
    "Self-healing infrastructure."
], title_color=ACCENT_GREEN)

add_card_content(s6, 7.85, 4.60, 2.25, 2.15, "Policy-as-Code", [
    "Open Policy Agent / Rego.",
    "Pre-apply guardrails.",
    "Tag & encrypt mandate.",
    "Automated audit blocks."
], title_color=ACCENT_AMBER)

set_speaker_notes(s6,
    "Unit II covers Infrastructure as Code, directly fulfilling Lab Experiment 3 and Experiment 5. "
    "For Experiment 3, we developed declarative AWS CloudFormation templates in infrastructure/cloudformation/ with validation commands, stack updates, and automated rollback configuration (on-failure ROLLBACK). "
    "For Experiment 5, we authored Terraform HCL modules for both EC2 and S3 storage, demonstrating the complete lifecycle: terraform init, validate, plan, apply, state inspection with .tfstate, and clean destroy. "
    "We also evaluated emerging IaC trends including OpenTofu, Pulumi, Crossplane, and OPA Policy-as-Code."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 7: UNIT III — AGILE, JENKINS CI/CD & CANARY A/B TESTING (Exp 6)
# ─────────────────────────────────────────────────────────────────────────────
s7 = prs.slides.add_slide(blank_layout)
add_header(s7, "Unit III — Agile at Scale, Jenkins CI/CD & A/B Testing", 
           "Syllabus Exp 6 (Jenkins Pipeline, GitHub Webhooks, Automated Delivery) & SAFe/LeSS", "UNIT III | EXP 6")

if os.path.exists('docs/slides_assets/devsecops_pipeline.png'):
    s7.shapes.add_picture('docs/slides_assets/devsecops_pipeline.png', Inches(0.8), Inches(1.75), Inches(9.3), Inches(2.35))

if os.path.exists('docs/slides_assets/ab_testing_pie.png'):
    s7.shapes.add_picture('docs/slides_assets/ab_testing_pie.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(2.35))

add_card_content(s7, 0.8, 4.30, 3.75, 2.55, "Scaling Agile: SAFe vs. LeSS", [
    "SAFe: Agile Release Trains (50-125 engineers) & 8-12 week Program Increments.",
    "LeSS: Single Product Backlog, shared sprints, and cross-functional teams.",
    "Product Strategy: Trunk-based delivery with semantic versioning."
], title_color=ACCENT_BLUE)

add_card_content(s7, 4.75, 4.30, 3.75, 2.55, "TDD & BDD Specifications", [
    "TDD: Red -> Green -> Refactor cycle with Go unit tests (100% pass).",
    "BDD: Executable Gherkin syntax (Given-When-Then) for security gates.",
    "Technical Debt: Priority-ranked debt register tracking architectural debt."
], title_color=ACCENT_INDIGO)

add_card_content(s7, 8.70, 4.30, 3.83, 2.55, "A/B & Canary Deployments", [
    "Canary Splitting: 85% Stable (v1.4.2) / 15% Canary (v2.0.0).",
    "Dynamic Controller: Real-time slider via /api/v1/syllabus/ab-test/split.",
    "Automated Rollback: Reverts to 100% Stable if 5xx errors breach threshold."
], title_color=ACCENT_GREEN)

set_speaker_notes(s7,
    "Unit III examines Agile and CI/CD Practices for Scalable Product Development. "
    "We compare SAFe, which coordinates multi-train dependencies across large enterprises, with LeSS, which prioritizes a single backlog for lean execution. "
    "Our engineering combines Test-Driven Development via Go unit tests with Behavior-Driven Development using executable Cucumber/Gherkin specifications. "
    "We integrated an automated 13-stage Jenkins declarative pipeline, as well as an interactive Canary A/B testing controller allowing real-time traffic splitting with automated rollback if error thresholds are exceeded."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 8: UNIT IV — MONITORING & OBSERVABILITY (Exp 8 & 9)
# ─────────────────────────────────────────────────────────────────────────────
s8 = prs.slides.add_slide(blank_layout)
add_header(s8, "Unit IV — Observability: Prometheus Metrics & Grafana Dashboards", 
           "Syllabus Exp 8 (Prometheus & Node Exporter Metrics/Alerts) & Exp 9 (Grafana Dashboards)", "UNIT IV | EXP 8 & 9")

if os.path.exists('docs/slides_assets/golden_signals.png'):
    s8.shapes.add_picture('docs/slides_assets/golden_signals.png', Inches(0.8), Inches(1.75), Inches(11.73), Inches(2.45))

add_card_content(s8, 0.8, 4.40, 5.75, 2.55, "Prometheus & Node Exporter (Exp 8)", [
    "Prometheus Engine (:9090): Custom Go middleware & Node Exporter (:9100).",
    "Metric Collection: CPU, Memory, Disk space, and Network bandwidth.",
    "Latency & Traffic: Tracked via http_request_duration_seconds & counters.",
    "Alerting Rules: HighErrorRate (>5% for 2m), HighLatency (p95 > 1s), ServiceDown.",
    "Prometheus Federation: Thanos/Cortex for scalable long-term metric retention."
], title_color=ACCENT_BLUE)

add_card_content(s8, 6.75, 4.40, 5.78, 2.55, "Grafana Dashboards & Incident Recovery (Exp 9)", [
    "Grafana OSS (:3001): Pre-provisioned Prometheus datasource & executive panels.",
    "Resource Visualization: Live gauges for CPU, memory, storage, and network trends.",
    "Automated Incident Recovery: Reverts deployments automatically on ServiceDown alert.",
    "Closed-Loop Workflow: Detect -> Alert -> Diagnose -> Rollback -> Verify.",
    "Audit Recording: All alerts and recovery actions saved to immutable log."
], title_color=ACCENT_ROSE)

set_speaker_notes(s8,
    "In Unit IV, we address Monitoring and Observability, fulfilling Lab Experiment 8 and Experiment 9. "
    "For Experiment 8, we deployed Prometheus on port 9090 and Node Exporter on port 9100 to collect CPU, memory, disk, and network metrics, defining alerting rules such as HighErrorRate and ServiceDown. "
    "For Experiment 9, we integrated Grafana on port 3001 with Prometheus as a datasource, designing executive dashboards that track SRE Golden Signals and historical performance trends. "
    "When an alert fires, our closed-loop controller automatically triggers a zero-downtime rollback to restore service stability."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 9: UNIT V — DEVSECOPS, IAM RBAC/MFA & SUPPLY CHAIN (Exp 2 & 7)
# ─────────────────────────────────────────────────────────────────────────────
s9 = prs.slides.add_slide(blank_layout)
add_header(s9, "Unit V — DevSecOps: IAM RBAC/MFA, Trivy Gates & SLSA", 
           "Syllabus Exp 2 (IAM Users/Roles/MFA/RBAC) & Exp 7 (DevSecOps Jenkins Scan & Secrets)", "UNIT V | EXP 2 & 7")

add_card_content(s9, 0.8, 1.75, 3.0, 3.2, "DevSecOps Gates (Exp 7)", [
    "SAST Analysis: Early secret scanning in PRs.",
    "Trivy Scanner: Scans container image & OS.",
    "Blocking Gate: Rejects if Critical CVEs > 0.",
    "Secrets: Encrypted Kubernetes Secrets."
], title_color=ACCENT_ROSE)

add_card_content(s9, 3.95, 1.75, 3.0, 3.2, "IAM RBAC & MFA (Exp 2)", [
    "IAM Groups: DevOpsEngineers & Auditors.",
    "MFA Enforcement: DenyAllWithoutMFA policy.",
    "Role Assumption: STS AssumeRole trust.",
    "RBAC: Admin, DevOps, Auditor JWT roles."
], title_color=ACCENT_GREEN)

add_card_content(s9, 7.10, 1.75, 3.0, 3.2, "Supply Chain Security", [
    "SLSA Framework: Levels 1-4 provenance.",
    "SBOM: SPDX and CycloneDX inventory.",
    "Cosign / Sigstore: Keyless image signing.",
    "Admission: Verifies signed images only."
], title_color=ACCENT_BLUE)

# Side Graphic Banner
if os.path.exists('docs/slides_assets/side_banner_security.png'):
    s9.shapes.add_picture('docs/slides_assets/side_banner_security.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

add_card(s9, 0.8, 5.15, 9.3, 1.5, border_color=ACCENT_INDIGO)
tb = s9.shapes.add_textbox(Inches(1.0), Inches(5.25), Inches(8.9), Inches(1.3))
tf = tb.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.text = "DevSecOps & IAM Principle in CloudOps Sentinel:"
p.font.size = Pt(11)
p.font.bold = True
p.font.color.rgb = ACCENT_INDIGO
p2 = tf.add_paragraph()
p2.text = "Experiment 2 enforces least-privilege IAM and Multi-Factor Authentication with STS role assumption. Experiment 7 embeds Aqua Trivy vulnerability scanning directly into Jenkins stage 7, stopping vulnerable images before promotion to Kubernetes or AWS ECS."
p2.font.size = Pt(9.5)
p2.font.color.rgb = TEXT_MUTED
p2.space_before = Pt(4)

set_speaker_notes(s9,
    "Unit V covers DevSecOps and Cloud Security, directly addressing Lab Experiment 2 and Experiment 7. "
    "For Experiment 2, we engineered IAM users, groups, custom least-privilege policies, MFA enforcement via conditional denies, and STS AssumeRole trust policies. "
    "For Experiment 7, we embedded DevSecOps practices into our Jenkins pipeline: static code analysis, Aqua Trivy container image scanning with automated blocking gates on severe CVEs, secure Kubernetes secrets management, and automated security assessment reporting. "
    "We also implemented SLSA Levels 1 through 4 and Sigstore cryptographic signing."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 10: UNIT VI — 12-FACTOR APP & SERVERLESS LAMBDA (Exp 10)
# ─────────────────────────────────────────────────────────────────────────────
s10 = prs.slides.add_slide(blank_layout)
add_header(s10, "Unit VI — 12-Factor App & AWS Lambda Serverless Architecture", 
           "Syllabus Exp 10 (AWS Lambda Serverless, API Gateway & CloudWatch Telemetry)", "UNIT VI | EXP 10")

if os.path.exists('docs/slides_assets/twelve_factor_bar.png'):
    s10.shapes.add_picture('docs/slides_assets/twelve_factor_bar.png', Inches(0.8), Inches(1.75), Inches(5.6), Inches(3.2))

headers_serv = ["Dimension", "Serverless (Lambda / Fargate) - Exp 10", "Containerized (EKS / K8s)"]
rows_serv = [
    ["Cold Start Latency", "100ms - 800ms during init", "Sub-millisecond (active replicas)"],
    ["Cost Scaling Curve", "$0 at idle; billed per ms", "Fixed baseline VM node overhead"],
    ["Maintenance", "Zero server/OS patching", "Requires managing node groups & K8s"],
    ["Implementation", "serverless/lambda/ & SAM template", "Kubernetes manifests with HPA"]
]
add_table(s10, 6.6, 1.75, 5.9, 3.2, headers_serv, rows_serv, col_widths=[1.5, 2.2, 2.2])

add_card_content(s10, 0.8, 5.15, 11.73, 1.75, "The 12-Factor App Methodology & Lambda Serverless Integration", [
    "Serverless Lambda (Exp 10): serverless/lambda/index.js integrated with API Gateway, logging to /aws/lambda/cloudops-serverless.",
    "I. Codebase (Git)  |  II. Dependencies (go.mod, package-lock)  |  III. Config (Env vars)  |  IV. Backing Services (Attached URLs)",
    "V. Build/Release/Run (Docker multi-stage)  |  VI. Processes (Stateless)  |  VII. Port Binding (:8080)  |  VIII. Concurrency (HPA Replicas)",
    "IX. Disposability (<2s boot)  |  X. Dev/Prod Parity  |  XI. Logs (stdout stream & CloudWatch)  |  XII. Admin Tasks (Auto-migrations)"
], title_color=ACCENT_GREEN)

set_speaker_notes(s10,
    "Unit VI examines Cloud-Native Development and Serverless Architectures, satisfying Lab Experiment 10. "
    "For Experiment 10, we developed an AWS Lambda serverless application in serverless/lambda/ with an API Gateway proxy event handler, CloudWatch structured JSON telemetry, and execution duration metrics. "
    "Furthermore, CloudOps Sentinel is 100% compliant with all Twelve Factors of the 12-Factor App methodology. "
    "We also evaluated Serverless versus Containerized microservices, comparing cold start latency, cost break-even curves, and operational overhead."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 11: UNIT VI — FINOPS, AWS COST EXPLORER & BUDGETS (Exp 11)
# ─────────────────────────────────────────────────────────────────────────────
s11 = prs.slides.add_slide(blank_layout)
add_header(s11, "Unit VI — FinOps Cost Optimization, AWS Budgets & Rightsizing", 
           "Syllabus Exp 11 (AWS Cost Explorer, Billing Reports, AWS Budgets & Rightsizing)", "UNIT VI | EXP 11")

if os.path.exists('docs/slides_assets/finops_breakdown.png'):
    s11.shapes.add_picture('docs/slides_assets/finops_breakdown.png', Inches(0.8), Inches(1.75), Inches(5.1), Inches(3.4))

add_card_content(s11, 6.1, 1.75, 4.0, 4.9, "FinOps Engine & AWS Budgets (Exp 11)", [
    "FinOps Lifecycle: Inform (visibility) -> Optimize (rightsizing) -> Operate (budget alerts).",
    "Granular Workload Costing: Simulates EC2 compute, EKS, RDS, EBS, and CloudWatch spend.",
    "Rightsizing Engine: Detects idle resources & oversized memory, saving up to 35% monthly spend.",
    "Budget Alarms: Threshold-based alerts trigger when spending exceeds 80% of monthly cap.",
    "Policy-as-Code: Enforces mandatory environment tags, encryption at rest, and S3 restrictions.",
    "Immutable Audit Trail: Append-only log recording timestamp, user, action, and IP.",
    "Zero-Cost Demo: 100% offline local billing in PostgreSQL (no cloud charges incurred)."
], title_color=ACCENT_BLUE)

# Embed FinOps Side Banner
if os.path.exists('docs/slides_assets/side_banner_finops.png'):
    s11.shapes.add_picture('docs/slides_assets/side_banner_finops.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

add_card(s11, 0.8, 5.35, 5.1, 1.3, border_color=ACCENT_GREEN)
tb = s11.shapes.add_textbox(Inches(1.0), Inches(5.45), Inches(4.7), Inches(1.1))
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

set_speaker_notes(s11,
    "Continuing Unit VI, we delve into FinOps, satisfying Lab Experiment 11. "
    "We model AWS Cost Explorer and billing reports across EC2 compute, EKS clusters, RDS databases, S3 storage, and CloudWatch metrics. "
    "Our platform implements automated AWS Budget alarms configured at an 80% spending threshold, and identifies underutilized resources to recommend rightsizing measures yielding up to 35% in cost savings. "
    "All FinOps economics execute locally in PostgreSQL with strict $0.00 cloud spend."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 12: PLATFORM VERIFICATION & 11 EXPERIMENTS VALIDATION
# ─────────────────────────────────────────────────────────────────────────────
s12 = prs.slides.add_slide(blank_layout)
add_header(s12, "Platform Verification: 11 Practical Experiments Verified", 
           "Empirical test results, endpoint health, and 100% syllabus experiment fulfillment", "VERIFICATION | 11/11 EXPS")

add_card_content(s12, 0.8, 1.75, 4.55, 3.9, "Local Platform Endpoints", [
    "Frontend Dashboard: http://localhost:3000 (Next.js 14 Web UI)",
    "API Server Health: http://localhost:8080/api/v1/health (Go REST API)",
    "Prometheus Telemetry: http://localhost:9090 (Metrics Scraper)",
    "Grafana Dashboards: http://localhost:3001 (admin / admin)",
    "PostgreSQL Database: localhost:5432 (Stateful Data Store)",
    "Curriculum Hub: http://localhost:3000/syllabus (Interactive Center)"
], title_color=ACCENT_BLUE)

add_card_content(s12, 5.55, 1.75, 4.55, 3.9, "Empirical Test Results", [
    "Backend Unit Tests: 100% PASS rate across all Go modules (go test ./...).",
    "Frontend Production Build: 15 / 15 static routes compiled with 0 errors.",
    "End-to-End Lifecycle Test: 9-stage verification in tests/e2e/test_lifecycle.sh.",
    "Security Gate Test: Verified blocking behavior on severe CVEs.",
    "Local-First Guarantee: All 5 containers start via docker compose up -d."
], title_color=ACCENT_GREEN)

# Side Graphic Banner
if os.path.exists('docs/slides_assets/side_banner_verification.png'):
    s12.shapes.add_picture('docs/slides_assets/side_banner_verification.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

# Stat boxes
add_stat_box(s12, 0.8, 5.85, 2.2, 0.95, "15 / 15", "Routes Compiled", ACCENT_BLUE)
add_stat_box(s12, 3.2, 5.85, 2.2, 0.95, "100%", "Go Tests Passing", ACCENT_GREEN)
add_stat_box(s12, 5.6, 5.85, 2.2, 0.95, "$0.00", "Cloud Charges", ACCENT_AMBER)
add_stat_box(s12, 8.0, 5.85, 2.1, 0.95, "0 Errors", "Build Status", ACCENT_INDIGO)

set_speaker_notes(s12,
    "Here are our empirical verification and test results. "
    "All Go backend unit tests pass with a 100% success rate. "
    "The Next.js frontend compiles cleanly across all 15 routes with zero TypeScript errors. "
    "Our automated 9-stage integration test script verifies the full lifecycle: authentication, project creation, Terraform planning, Docker deployment, Trivy CVE evaluation, and FinOps budgeting. "
    "The platform is live and demonstratable locally across ports 3000, 8080, 9090, 3001, and 5432."
)

# ─────────────────────────────────────────────────────────────────────────────
# SLIDE 13: CONCLUSION & DEFENSE SUMMARY (With Side Banner)
# ─────────────────────────────────────────────────────────────────────────────
s13 = prs.slides.add_slide(blank_layout)
add_header(s13, "Conclusion, Future Roadmap & Defense Summary", 
           "CloudOps Sentinel demonstrates enterprise-grade DevSecOps, IaC, and FinOps governance", "CONCLUSION")

add_card_content(s13, 0.8, 1.75, 4.55, 3.9, "Key Academic Achievements", [
    "Complete Syllabus Coverage: Implements 100% of INT 378 across Units I through VI.",
    "End-to-End Lifecycle: Integrates Plan, Commit, Test, Secure, Build, IaC, Deploy, Observe, Recover, and Govern.",
    "Zero-Cost Architecture: Production-grade enterprise emulation requiring $0.00 cloud spend.",
    "Scalable Case Studies: Incorporates architectural patterns from Netflix, Amazon, and Uber.",
    "Production Ready: Docker Compose orchestration and declarative Kubernetes manifests with HPA."
], title_color=ACCENT_BLUE)

add_card_content(s13, 5.55, 1.75, 4.55, 3.9, "Future Engineering Horizons", [
    "eBPF Observability: Kernel-level network packet tracing without user-space overhead.",
    "AI-Driven Remediation: Automated LLM root-cause analysis and self-healing PRs.",
    "Multi-Region Active-Active: Automated cross-cloud disaster recovery between AWS and Azure.",
    "GitOps Promotion: ArgoCD integration with declarative pull-based Kubernetes synchronization."
], title_color=ACCENT_INDIGO)

# Side Graphic Banner
if os.path.exists('docs/slides_assets/side_banner_conclusion.png'):
    s13.shapes.add_picture('docs/slides_assets/side_banner_conclusion.png', Inches(10.3), Inches(1.75), Inches(2.23), Inches(4.9))

# Thank you banner
add_card(s13, 0.8, 5.85, 9.3, 0.95, border_color=ACCENT_GREEN)
tb_ty = s13.shapes.add_textbox(Inches(1.0), Inches(5.95), Inches(8.9), Inches(0.75))
tf_ty = tb_ty.text_frame
p_ty = tf_ty.paragraphs[0]
p_ty.text = "Thank you! Open for Questions & Evaluation  |  Kakumani Phaneendra (Reg: 12418953, LPU)"
p_ty.font.size = Pt(12)
p_ty.font.bold = True
p_ty.font.color.rgb = ACCENT_GREEN
p_ty.alignment = PP_ALIGN.CENTER

set_speaker_notes(s13,
    "In conclusion, CloudOps Sentinel successfully fulfills 100% of the INT 378 syllabus, unifying DevSecOps, Infrastructure as Code, Observability, and FinOps into an end-to-end, local-first platform. "
    "Looking forward, future horizons include eBPF kernel-level tracing, AI-driven self-healing incident remediation, and cross-cloud active-active failover. "
    "Thank you very much for your time, attention, and valuable guidance. I am now open to answer any questions from the evaluators."
)

# ─────────────────────────────────────────────────────────────────────────────
# SAVE PRESENTATION
# ─────────────────────────────────────────────────────────────────────────────
output_path = "CloudOps_Sentinel_INT378_Presentation.pptx"
prs.save(output_path)
print(f"Richly styled presentation saved successfully to: {output_path} ({len(prs.slides)} slides)")
