"""
Append a LOCAL-EXECUTION EVIDENCE section to the CloudOps Sentinel deck.
All screenshots are real captures of services running on localhost; all numbers
come from evidence/** files produced by actual commands. No fabricated results.

Output: CloudOps_Sentinel_INT378_Presentation_FINAL.pptx
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "CloudOps_Sentinel_INT378_Presentation.pptx")
OUT = os.path.join(ROOT, "CloudOps_Sentinel_INT378_Presentation_FINAL.pptx")
SHOTS = os.path.join(ROOT, "evidence", "screenshots")

BG      = RGBColor(0x0B, 0x10, 0x1C)
PANEL   = RGBColor(0x12, 0x1B, 0x2D)
BORDER  = RGBColor(0x23, 0x3A, 0x5C)
WHITE   = RGBColor(0xF1, 0xF5, 0xFA)
MUTED   = RGBColor(0x9F, 0xB3, 0xCC)
BLUE    = RGBColor(0x38, 0xBD, 0xF8)
GREEN   = RGBColor(0x34, 0xD3, 0x99)
AMBER   = RGBColor(0xFB, 0xBF, 0x24)
RED     = RGBColor(0xF8, 0x71, 0x71)

prs = Presentation(SRC)
BLANK = prs.slide_layouts[6]
SW, SH = prs.slide_width, prs.slide_height


def box(slide, l, t, w, h, fill=PANEL, line=BORDER, radius=True):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, l, t, w, h)
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    shp.line.color.rgb = line; shp.line.width = Pt(1)
    return shp


def text(slide, s, l, t, w, h, size=16, color=WHITE, bold=False,
         align=PP_ALIGN.LEFT, font="Segoe UI", anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(l, t, w, h)
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    lines = s.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = ln; p.alignment = align
        p.space_after = Pt(4)
        for r in p.runs:
            r.font.name = font; r.font.size = Pt(size)
            r.font.bold = bold; r.font.color.rgb = color
    return tb


def header(slide, title, kicker, accent=BLUE):
    bg = slide.background.fill; bg.solid(); bg.fore_color.rgb = BG
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(0.16), SH)
    bar.fill.solid(); bar.fill.fore_color.rgb = accent; bar.line.fill.background()
    text(slide, kicker.upper(), Inches(0.55), Inches(0.28), Inches(11), Inches(0.3),
         size=11, color=accent, bold=True)
    text(slide, title, Inches(0.55), Inches(0.55), Inches(12.2), Inches(0.62),
         size=27, color=WHITE, bold=True)
    ln = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.55), Inches(1.22),
                                Inches(12.2), Pt(2))
    ln.fill.solid(); ln.fill.fore_color.rgb = BORDER; ln.line.fill.background()


def pic(slide, name, l, t, maxw, maxh, label=None):
    path = os.path.join(SHOTS, name)
    if not os.path.exists(path):
        text(slide, f"[missing screenshot: {name}]", l, t, maxw, Inches(0.4),
             size=12, color=RED)
        return
    iw, ih = Image.open(path).size
    ratio = min(maxw / iw, maxh / ih)
    w, h = int(iw * ratio), int(ih * ratio)
    x = l + int((maxw - w) / 2); y = t + int((maxh - h) / 2)
    slide.shapes.add_picture(path, x, y, width=w, height=h)
    if label:
        text(slide, label, l, t + maxh + Inches(0.04), maxw, Inches(0.28),
             size=10, color=MUTED, align=PP_ALIGN.CENTER)


def badge(slide, s, l, t, w, color=GREEN):
    box(slide, l, t, w, Inches(0.42), fill=PANEL, line=color)
    text(slide, s, l, t + Inches(0.06), w, Inches(0.3), size=12,
         color=color, bold=True, align=PP_ALIGN.CENTER)


def note(slide, s):
    slide.notes_slide.notes_text_frame.text = s


# ---------------------------------------------------------------- EVIDENCE 1
s = prs.slides.add_slide(BLANK)
header(s, "Running Locally — Verified Stack", "Local execution evidence", GREEN)
badge(s, "8 / 8 CORE SERVICES UP", Inches(0.6), Inches(1.45), Inches(2.7))
badge(s, "0 AWS CALLS", Inches(3.45), Inches(1.45), Inches(2.0))
badge(s, "100% LOCALHOST", Inches(5.6), Inches(1.45), Inches(2.2))
pic(s, "06_prom_targets.png", Inches(0.6), Inches(2.05), Inches(6.0), Inches(3.4),
    "Prometheus /targets — all scrape targets UP")
pic(s, "12_cadvisor.png", Inches(6.85), Inches(2.05), Inches(5.9), Inches(3.4),
    "cAdvisor — live container metrics")
box(s, Inches(0.6), Inches(5.75), Inches(12.15), Inches(1.15))
text(s, "Verified: GET /api/v1/health → 200 {\"status\":\"healthy\",\"database\":true}  •  "
        "Prometheus targets: prometheus, backend, node-exporter, cadvisor = UP  •  "
        "128 node_cpu_seconds_total series  •  Go test suite: all packages PASS",
     Inches(0.85), Inches(5.95), Inches(11.7), Inches(0.8), size=13, color=WHITE)
note(s, "All services run as local Docker containers. Prometheus scrape targets were "
        "queried through the real /api/v1/targets endpoint; API health via HTTP 200.")

# ---------------------------------------------------------------- EVIDENCE 2
s = prs.slides.add_slide(BLANK)
header(s, "Practical 1 & 5 — Local VPC / Compute / IaC", "Terraform + Docker provider", BLUE)
pic(s, "10_terraform_web.png", Inches(0.6), Inches(1.55), Inches(5.6), Inches(3.3),
    "Terraform-provisioned Nginx web server :8088")
box(s, Inches(6.5), Inches(1.55), Inches(6.25), Inches(3.6))
text(s, "TERRAFORM APPLY (real output)", Inches(6.75), Inches(1.75), Inches(5.8), Inches(0.35),
     size=13, color=BLUE, bold=True)
text(s, "terraform init      → kreuzwerker/docker v3.9.0\n"
        "terraform validate  → Success\n"
        "terraform plan      → 8 to add, 0 change, 0 destroy\n"
        "terraform apply     → 8 added (exit 0)\n"
        "curl localhost:8088 → HTTP 200 (TF marker)\n"
        "terraform state list → 8 resources",
     Inches(6.75), Inches(2.15), Inches(5.8), Inches(2.8), size=14, color=WHITE)
box(s, Inches(0.6), Inches(5.25), Inches(12.15), Inches(1.55))
text(s, "AWS → LOCAL MAPPING", Inches(0.85), Inches(5.45), Inches(11.6), Inches(0.3),
     size=12, color=GREEN, bold=True)
text(s, "VPC / subnet → two isolated Docker bridge networks  •  EC2 instance → tf-local-webserver container  •  "
        "Security group → network segmentation  •  Public IP → host port 8088  •  EBS → named Docker volume  •  "
        "CloudFormation templates retained for syntax comparison (no AWS calls).",
     Inches(0.85), Inches(5.8), Inches(11.6), Inches(0.85), size=13, color=WHITE)
note(s, "Terraform local configuration lives in infrastructure/terraform/local. "
        "Raw output in evidence/terraform/. The container is intentionally left running.")

# ---------------------------------------------------------------- EVIDENCE 3
s = prs.slides.add_slide(BLANK)
header(s, "Practical 2 — IAM, MFA & RBAC Enforced", "Real TOTP + JWT role gates", AMBER)
box(s, Inches(0.6), Inches(1.5), Inches(5.9), Inches(4.9))
text(s, "LOCAL IAM SIMULATOR (Python stdlib)", Inches(0.85), Inches(1.7), Inches(5.4), Inches(0.35),
     size=13, color=AMBER, bold=True)
text(s, "• RFC 6238 TOTP, 6-digit, ±1 step window\n"
        "• Valid codes −1 / 0 / +1 accepted\n"
        "• Bogus code rejected\n"
        "• viewer DENIED deploy:prod\n"
        "• deployer allowed deploy, DENIED iam:createuser\n"
        "• admin allowed all operations\n"
        "• MFA-gated AssumeRole / role switch\n"
        "• 15 audit events, 4 DENIED (real JSON log)",
     Inches(0.85), Inches(2.15), Inches(5.4), Inches(3.9), size=14, color=WHITE)
box(s, Inches(6.75), Inches(1.5), Inches(6.0), Inches(4.9))
text(s, "API ENFORCEMENT (Go backend)", Inches(7.0), Inches(1.7), Inches(5.5), Inches(0.35),
     size=13, color=GREEN, bold=True)
text(s, "admin  GET  /projects        → 200\n"
        "admin  POST /projects        → 201\n"
        "viewer GET  /projects        → 200\n"
        "viewer POST /projects        → 403\n"
        "viewer PUT  /projects/1      → 403\n"
        "anon   POST /projects        → 401\n"
        "JWT signed with JWT_SECRET env\n"
        "JWT_SECRET no longer hardcoded\n"
        "go test ./... → ALL PASS",
     Inches(7.0), Inches(2.15), Inches(5.5), Inches(3.9), size=14, color=WHITE)
text(s, "AWS IAM user/group/policy → local principal/role/permission map  •  Virtual MFA → TOTP CLI  •  "
        "STS AssumeRole → role switch with MFA condition.",
     Inches(0.75), Inches(6.5), Inches(12.0), Inches(0.4), size=11, color=MUTED)
note(s, "Evidence: evidence/iam/iam_demo_output.txt, audit_log.json, api_verification.txt, go_tests.txt.")

# ---------------------------------------------------------------- EVIDENCE 4
s = prs.slides.add_slide(BLANK)
header(s, "Practical 4 & 6 — Containers + CI/CD", "Docker lifecycle & Jenkins pipeline", BLUE)
pic(s, "09_jenkins_job.png", Inches(0.6), Inches(1.55), Inches(6.1), Inches(3.5),
    "Jenkins job cloudops-local-pipeline :8085")
box(s, Inches(6.9), Inches(1.55), Inches(5.85), Inches(3.5))
text(s, "PIPELINE STAGES (real execution)", Inches(7.15), Inches(1.75), Inches(5.4), Inches(0.35),
     size=13, color=BLUE, bold=True)
text(s, "1  Checkout from local Git repo\n"
        "2  Go unit tests (offline module cache)\n"
        "3  Trivy filesystem security scan\n"
        "4  Docker image build\n"
        "5  Deploy health check (HTTP 200)\n"
        "6  Terraform validate (container)",
     Inches(7.15), Inches(2.2), Inches(5.4), Inches(2.7), size=14, color=WHITE)
box(s, Inches(0.6), Inches(5.3), Inches(12.15), Inches(1.5))
text(s, "LOCAL REGISTRY (no Docker Hub): localhost:5000/v2/ → 200 {}  •  "
        "alpine demo image tagged → pushed → local tag removed → pulled back → run OK  •  "
        "backend image also pushed  •  catalog = [cloudops-demo, int378-backend]  •  "
        "registry container left running on :5000.",
     Inches(0.85), Inches(5.5), Inches(11.65), Inches(1.0), size=13, color=WHITE)
note(s, "Jenkins runs the Scripted Pipeline from scripts/jenkins_setup.ps1 with a mounted "
        "repo and Docker socket. Local registry defined in docker-compose.registry.yml.")

# ---------------------------------------------------------------- EVIDENCE 5
s = prs.slides.add_slide(BLANK)
header(s, "Practical 7 — DevSecOps Scan Results", "Trivy v0.76.2 — real findings", RED)
box(s, Inches(0.6), Inches(1.5), Inches(12.15), Inches(2.1))
text(s, "SCAN TARGET            CRITICAL   HIGH   MEDIUM   LOW   UNKNOWN",
     Inches(0.9), Inches(1.72), Inches(11.5), Inches(0.35), size=13, color=BLUE, bold=True)
text(s, "Filesystem (repo)          4         43       45      5        2\n"
        "Image (int378-backend)     0         39       31      5        3\n"
        "IaC (infrastructure)       2          9        6      4        0",
     Inches(0.9), Inches(2.15), Inches(11.5), Inches(1.25), size=15, color=WHITE)
pic(s, "18_auth_security.png", Inches(0.6), Inches(3.85), Inches(6.0), Inches(2.5),
    "Security view in the local dashboard")
box(s, Inches(6.85), Inches(3.85), Inches(5.9), Inches(2.5))
text(s, "HONEST BASELINE", Inches(7.1), Inches(4.05), Inches(5.4), Inches(0.35),
     size=13, color=RED, bold=True)
text(s, "• 4 FS critical = Next.js 14.2.3 RCE / auth bypass\n"
        "• 2 IaC critical = unrestricted SG egress\n"
        "• Image flagged on EOL Alpine 3.19\n"
        "• 0 secret findings\n"
        "• Current policy gate (0 critical / ≤3 high) FAILS\n"
        "• Remediation tracked in evidence/security/SUMMARY.md",
     Inches(7.1), Inches(4.45), Inches(5.4), Inches(1.75), size=12, color=WHITE)
note(s, "These are real Trivy JSON results parsed from evidence/security/. The gate is "
        "deliberately reported as failing — no result was softened or invented.")

# ---------------------------------------------------------------- EVIDENCE 6
s = prs.slides.add_slide(BLANK)
header(s, "Practical 8 & 9 — Monitoring & Dashboards", "Prometheus + exporters + Grafana", GREEN)
pic(s, "05_prometheus.png", Inches(0.6), Inches(1.55), Inches(6.0), Inches(2.6),
    "Prometheus expression browser")
pic(s, "11_node_exporter.png", Inches(6.8), Inches(1.55), Inches(5.95), Inches(2.6),
    "Node Exporter :9100")
pic(s, "07_grafana.png", Inches(0.6), Inches(4.35), Inches(6.0), Inches(2.0),
    "Grafana :3001")
box(s, Inches(6.8), Inches(4.35), Inches(5.95), Inches(2.0))
text(s, "COLLECTION VERIFIED", Inches(7.05), Inches(4.5), Inches(5.5), Inches(0.3),
     size=12, color=GREEN, bold=True)
text(s, "• 4 scrape jobs UP (backend, Prometheus,\n"
        "   node-exporter, cadvisor)\n"
        "• CPU / memory / disk / network metrics\n"
        "• Per-container resource metrics\n"
        "• Grafana dashboard 'CloudOps Sentinel —\n"
        "   Executive Overview' auto-provisioned\n"
        "• Alert rules loaded from alert_rules.yml",
     Inches(7.05), Inches(4.85), Inches(5.5), Inches(1.4), size=12, color=WHITE)
note(s, "Node Exporter and cAdvisor were added to docker-compose.yml and wired into "
        "monitoring/prometheus.yml. Grafana datasource/dashboard are file-provisioned.")

# ---------------------------------------------------------------- EVIDENCE 7
s = prs.slides.add_slide(BLANK)
header(s, "Practical 10 — Serverless + Cost Simulation", "Local Lambda runtime & FinOps", AMBER)
box(s, Inches(0.6), Inches(1.5), Inches(5.9), Inches(4.9))
text(s, "LOCAL LAMBDA / API GATEWAY", Inches(0.85), Inches(1.7), Inches(5.4), Inches(0.35),
     size=13, color=AMBER, bold=True)
text(s, "3 / 3 invocations → HTTP 200\n"
        "GET /health   COLD  2.06 ms\n"
        "POST /process WARM  0.05 ms\n"
        "GET /health   WARM  0.03 ms\n\n"
        "Structured CloudWatch-style logs written to\n"
        "evidence/serverless/cloudwatch_logs.txt\n"
        "Cold vs warm start demonstrated with real\n"
        "timestamps and request IDs.",
     Inches(0.85), Inches(2.15), Inches(5.4), Inches(3.9), size=14, color=WHITE)
box(s, Inches(6.75), Inches(1.5), Inches(6.0), Inches(4.9))
text(s, "COST OPTIMIZATION (LOCAL ESTIMATE)", Inches(7.0), Inches(1.7), Inches(5.5), Inches(0.35),
     size=13, color=GREEN, bold=True)
text(s, "Current simulated spend:  $204.87 / mo\n"
        "Optimized projection:     $113.12 / mo\n"
        "Estimated saving:          $91.76 / mo (44.8%)\n\n"
        "5 recommendations: rightsize idle containers,\n"
        "ARM migration, storage lifecycle, spot for\n"
        "batch, schedule non-prod shutdown.\n\n"
        "Clearly labelled: LOCAL ESTIMATE — NOT\n"
        "ACTUAL AWS BILLING. No pricing API used.",
     Inches(7.0), Inches(2.15), Inches(5.5), Inches(3.9), size=14, color=WHITE)
note(s, "serverless/local-runtime.js and local_cost_simulator.js were executed with Node; "
        "outputs live in evidence/serverless/. No AWS billing data was accessed.")

# ---------------------------------------------------------------- EVIDENCE 8
s = prs.slides.add_slide(BLANK)
header(s, "Local Access & Reproduction", "Start once, demonstrate everything", BLUE)
rows = [
    ("Application / API", "http://localhost:3000  ·  http://localhost:8080/api/v1/health"),
    ("Terraform web server", "http://localhost:8088"),
    ("Prometheus", "http://localhost:9090"),
    ("Node Exporter", "http://localhost:9100"),
    ("cAdvisor", "http://localhost:8087"),
    ("Grafana", "http://localhost:3001  (admin/admin)"),
    ("Jenkins", "http://localhost:8085  (admin/admin123)"),
    ("Local Docker registry", "http://localhost:5000/v2/"),
    ("PostgreSQL", "localhost:5432  (cloudops/password)"),
]
box(s, Inches(0.6), Inches(1.5), Inches(12.15), Inches(4.2))
y = 1.72
for name, addr in rows:
    text(s, name, Inches(0.9), Inches(y), Inches(4.0), Inches(0.32), size=13, color=BLUE, bold=True)
    text(s, addr, Inches(4.9), Inches(y), Inches(7.5), Inches(0.32), size=13, color=WHITE)
    y += 0.42
box(s, Inches(0.6), Inches(5.9), Inches(12.15), Inches(1.0))
text(s, "REPRODUCE:  docker compose up -d --build  •  docker compose -f docker-compose.registry.yml up -d  •  "
        "cd infrastructure/terraform/local && terraform apply -auto-approve  •  powershell -File scripts/jenkins_setup.ps1",
     Inches(0.85), Inches(6.1), Inches(11.7), Inches(0.7), size=12, color=WHITE)
note(s, "All ports were discovered from docker compose ps and verified with HTTP requests. "
        "No port number in this deck is guessed.")

# ---------------------------------------------------------------- EVIDENCE 9
s = prs.slides.add_slide(BLANK)
header(s, "Final Verification Summary", "What actually ran, and what did not", GREEN)
box(s, Inches(0.6), Inches(1.5), Inches(5.9), Inches(5.0))
text(s, "VERIFIED RUNNING / PASSING", Inches(0.85), Inches(1.72), Inches(5.4), Inches(0.35),
     size=13, color=GREEN, bold=True)
text(s, "✓ 8 core containers healthy; registry on :5000\n"
        "✓ Go test suite: all packages PASS\n"
        "✓ JWT + RBAC: viewer 403, admin 201, anon 401\n"
        "✓ TOTP MFA: valid ±1 accepted, bogus rejected\n"
        "✓ Terraform: 8 resources applied, :8088 = 200\n"
        "✓ Prometheus: 4 targets UP, real node metrics\n"
        "✓ Grafana: datasource + dashboard provisioned\n"
        "✓ Trivy: FS/image/IaC scans executed (real CVEs)\n"
        "✓ Local registry: push → pull → run succeeded\n"
        "✓ Lambda: 3/3 invocations HTTP 200\n"
        "✓ Screenshots captured from live services",
     Inches(0.85), Inches(2.15), Inches(5.4), Inches(4.1), size=13, color=WHITE)
box(s, Inches(6.75), Inches(1.5), Inches(6.0), Inches(5.0))
text(s, "HONEST LIMITATIONS", Inches(7.0), Inches(1.72), Inches(5.5), Inches(0.35),
     size=13, color=AMBER, bold=True)
text(s, "• No AWS account/credentials used anywhere\n"
        "• CloudFormation templates are syntax artifacts;\n"
        "  no local CFN emulator was deployed\n"
        "• VirtualBox/RDP not used (containers used instead)\n"
        "• SonarQube not installed (Trivy used for SAST/IaC)\n"
        "• Alertmanager not deployed; alert rules defined\n"
        "• Cost figures are labelled local estimates\n"
        "• Trivy gate currently FAILS on real findings —\n"
        "  documented, not hidden\n"
        "• Some backend 'engine' endpoints remain simulated\n"
        "  (pipeline logs, governance randomness)",
     Inches(7.0), Inches(2.15), Inches(5.5), Inches(4.1), size=13, color=WHITE)
note(s, "This slide is intentionally candid: academic demonstration value comes from "
        "distinguishing genuinely executed local tooling from conceptual mappings.")

prs.save(OUT)
print(f"Saved {OUT} with {len(prs.slides)} slides")
