"""
INT 378 - LEAN presentation. One slide per essential topic.
Keyword/short-form content only. Complete syllabus coverage.
Output: CloudOps_Sentinel_INT378_Lean.pptx
Run: python scripts/generate_lean_deck.py
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "CloudOps_Sentinel_INT378_Lean.pptx")

BG = RGBColor(0x08, 0x0E, 0x1C)
SURF = RGBColor(0x11, 0x1D, 0x38)
SURF2 = RGBColor(0x16, 0x25, 0x46)
BORDER = RGBColor(0x2A, 0x3E, 0x66)
TEXT = RGBColor(0xEE, 0xF4, 0xFF)
MUTED = RGBColor(0x9B, 0xAE, 0xD0)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
COLORS = {
    "U1": RGBColor(0x3B, 0x82, 0xF6), "U2": RGBColor(0x2D, 0xD4, 0xBF),
    "U3": RGBColor(0xF5, 0x9E, 0x0B), "U4": RGBColor(0x34, 0xD3, 0x99),
    "U5": RGBColor(0xFB, 0x71, 0x85), "U6": RGBColor(0xA7, 0x8B, 0xFA),
}

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
BLANK = prs.slide_layouts[6]


def rect(s, x, y, w, h, fill, line=None, radius=False):
    shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
                             Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line: shp.line.color.rgb = line; shp.line.width = Pt(1)
    else: shp.line.fill.background()
    if radius:
        try: shp.adjustments[0] = 0.10
        except Exception: pass
    return shp


def txt(s, v, x, y, w, h, size=14, color=TEXT, bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.02)
    tf.margin_top = tf.margin_bottom = Inches(0.01)
    for i, line in enumerate(str(v).split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.alignment = align; p.space_after = Pt(4)
        for r in p.runs:
            r.font.size = Pt(size); r.font.bold = bold
            r.font.name = "Segoe UI"; r.font.color.rgb = color
    return tb


def slide(title, tag, accent, num):
    s = prs.slides.add_slide(BLANK)
    rect(s, 0, 0, 13.333, 7.5, BG)
    rect(s, 0, 0, 13.333, 0.1, accent)
    rect(s, 0.55, 0.38, 0.1, 0.5, accent)
    txt(s, title, 0.8, 0.36, 11.4, 0.5, size=24, color=WHITE, bold=True)
    txt(s, tag, 0.82, 0.9, 11.4, 0.3, size=11, color=MUTED)
    txt(s, "INT 378  |  CLOUDOPS SENTINEL", 0.6, 7.05, 8, 0.25, size=9, color=MUTED)
    txt(s, str(num), 12.3, 7.03, 0.5, 0.25, size=10, color=MUTED, align=PP_ALIGN.RIGHT)
    return s


def cards(s, blocks, accent, cols=3, y=1.6, h=4.9, size=13):
    """blocks: list of (heading, [short lines])"""
    n = len(blocks)
    x0, gap = 0.6, 0.25
    w = (12.1 - gap * (cols - 1)) / cols
    for i, (head, lines) in enumerate(blocks):
        col = i % cols; row = i // cols
        x = x0 + col * (w + gap)
        yy = y + row * (h / ((n + cols - 1) // cols) + 0.2)
        rect(s, x, yy, w, h if n <= cols else 2.35, SURF, BORDER, radius=True)
        rect(s, x, yy, 0.07, h if n <= cols else 2.35, accent)
        txt(s, head, x + 0.2, yy + 0.15, w - 0.35, 0.4, size=size + 2, color=accent, bold=True)
        txt(s, "\n".join("• " + l for l in lines), x + 0.2, yy + 0.65, w - 0.4,
            (h if n <= cols else 2.35) - 0.8, size=size, color=TEXT)


def flow(s, items, accent, y=2.4):
    n = len(items)
    w = 11.9 / n
    for i, it in enumerate(items):
        x = 0.65 + i * w
        rect(s, x, y, w - 0.25, 1.4, SURF2, accent, radius=True)
        txt(s, it, x + 0.05, y + 0.45, w - 0.35, 0.6, size=12, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
        if i < n - 1:
            a = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x + w - 0.25), Inches(y + 0.6), Inches(0.24), Inches(0.2))
            a.fill.solid(); a.fill.fore_color.rgb = accent; a.line.fill.background()


N = 1
# TITLE
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, BG); rect(s, 0, 0, 13.333, 0.14, COLORS["U2"])
txt(s, "INT 378  |  CLOUDOPS SENTINEL", 0.9, 1.4, 11, 0.5, size=18, color=COLORS["U2"], bold=True)
txt(s, "Cloud Infrastructure & DevOps", 0.85, 2.1, 11.5, 1.2, size=46, color=WHITE, bold=True)
txt(s, "6 units  •  key concepts  •  project mapping", 0.9, 3.5, 11, 0.5, size=18, color=MUTED)
txt(s, "Kakumani Phaneendra  |  12418953  |  CA 3", 0.9, 5.2, 11, 0.4, size=15, color=COLORS["U3"])
txt(s, "github.com/phanindra267/DevOps-WebApp", 0.9, 5.75, 11, 0.4, size=13, color=MUTED)

# UNIT 1
a = COLORS["U1"]
s = slide("AWS & Azure services", "UNIT 1  •  ADVANCED CLOUD INFRASTRUCTURE", a, N); N += 1
cards(s, [("COMPUTE", ["AWS: EC2 / ECS / EKS / Lambda", "Azure: VM / AKS / Functions", "Autoscaling + Spot/Reserved"]),
          ("STORAGE", ["AWS: S3 / EBS / RDS", "Azure: Blob / Disk / SQL", "Versioning + encryption"]),
          ("NETWORK & IAM", ["AWS: VPC / IAM / Route53", "Azure: VNet / Entra ID", "Subnets + least privilege"])], a)

s = slide("Provisioning & optimization", "UNIT 1  •  RESOURCE MANAGEMENT", a, N); N += 1
cards(s, [("PROVISION", ["IaC (Terraform / CFN)", "Golden AMI / images", "Auto Scaling"]),
          ("OPTIMIZE", ["Right-size via metrics", "Schedule non-prod OFF", "Spot / Reserved", "Delete idle resources"]),
          ("PROJECT", ["t2/t3.micro, small EBS", "No NAT / LB / EKS", "FinOps engine + budgets"])], a)

s = slide("Containerization + case studies", "UNIT 1  •  DOCKER & SCALE PATTERNS", a, N); N += 1
cards(s, [("DOCKER", ["Client → Daemon → Registry", "Image → Container lifecycle", "Docker Hub: push / pull"]),
          ("CASE STUDIES", ["Netflix: chaos engineering", "Amazon: two-pizza teams", "Uber: microservices + tracing"]),
          ("PROJECT", ["Multi-stage Dockerfiles", "Local registry push/pull", "13 containers running"])], a)

# UNIT 2
a = COLORS["U2"]
s = slide("Infrastructure as Code", "UNIT 2  •  IaC FUNDAMENTALS", a, N); N += 1
flow(s, ["WRITE HCL/YAML", "init", "validate", "plan", "apply", "state"], a)
cards(s, [("WHY IaC", ["Declarative + versioned", "Repeatable environments", "No config drift"]),
          ("TERRAFORM", ["HCL, multi-cloud", "State file + modules", "init/plan/apply"]),
          ("CLOUDFORMATION", ["YAML/JSON, AWS-only", "Stacks + change sets", "AWS-managed state"])], a, y=4.0, h=2.6, size=12)

s = slide("IaC comparison & future", "UNIT 2  •  TOOLS & TRENDS", a, N); N += 1
cards(s, [("TERRAFORM vs CFN", ["HCL vs YAML", "Multi-cloud vs AWS-only", "State file vs managed", "plan vs change set"]),
          ("EMERGING TOOLS", ["OpenTofu, Pulumi", "Crossplane, AWS CDK", "Policy-as-Code (OPA)"]),
          ("PROJECT", ["7 CFN templates", "7 Terraform stacks", "IaC comparison dashboard"])], a)

# UNIT 3
a = COLORS["U3"]
s = slide("Agile at scale + quality", "UNIT 3  •  AGILE & CI/CD PRACTICES", a, N); N += 1
cards(s, [("SAFe vs LeSS", ["SAFe: ARTs, PI planning", "LeSS: 1 backlog, 1 PO", "Both scale coordination"]),
          ("TDD / BDD", ["Red → Green → Refactor", "Given-When-Then", "Go tests all PASS"]),
          ("PRODUCT", ["OKRs + roadmap", "Distributed teams", "A/B testing + technical debt"])], a)

s = slide("CI/CD & Jenkins", "UNIT 3  •  AUTOMATED DELIVERY", a, N); N += 1
flow(s, ["COMMIT", "BUILD", "TEST", "SCAN", "PUSH", "DEPLOY", "VERIFY"], a)
cards(s, [("PIPELINE", ["GitHub webhook", "13-stage Jenkinsfile", "Health-gated rollout"]),
          ("BEST PRACTICE", ["Small commits", "Feature flags", "Fast rollback", "Build retention"]),
          ("PROJECT", ["Build #10 SUCCESS", "Console evidence saved"])], a, y=4.0, h=2.6, size=12)

# UNIT 4
a = COLORS["U4"]
s = slide("Monitoring & observability", "UNIT 4  •  TELEMETRY", a, N); N += 1
flow(s, ["TARGETS", "PROMETHEUS", "ALERTS", "GRAFANA"], a)
cards(s, [("PROMETHEUS", ["Pull every 15s", "PromQL + time-series", "4/4 targets UP"]),
          ("GRAFANA", ["6-panel dashboard", "Prometheus datasource", "p99, 5xx, status"]),
          ("SCALE", ["Node Exporter + cAdvisor", "Federation / Thanos", "OpenTelemetry, SLOs"])], a, y=4.0, h=2.6, size=12)

# UNIT 5
a = COLORS["U5"]
s = slide("DevSecOps & cloud security", "UNIT 5  •  SHIFT-LEFT SECURITY", a, N); N += 1
cards(s, [("PIPELINE", ["SAST / SCA", "Trivy image + IaC", "Secret scan", "Gate blocks CRITICAL"]),
          ("IDENTITY", ["IAM users / roles / MFA", "RBAC + least privilege", "JWT + bcrypt"]),
          ("WORKLOADS", ["Non-root containers", "Kubernetes NetworkPolicy + IRSA", "Secrets manager"])], a)

s = slide("Security trends & secrets", "UNIT 5  •  EMERGING PRACTICES", a, N); N += 1
cards(s, [("SECRETS", ["No keys in Git", "Vault / Secrets Manager", "Rotate + scan history"]),
          ("SUPPLY CHAIN", ["SLSA + SBOM", "Cosign signing", "SPDX / CycloneDX"]),
          ("PROJECT", ["MFA policy + JWT", "Terraform state ignored", "SCP denial reported"])], a)

# UNIT 6
a = COLORS["U6"]
s = slide("Cloud-native & 12-factor", "UNIT 6  •  ARCHITECTURE", a, N); N += 1
cards(s, [("CLOUD-NATIVE", ["Microservices + containers", "Stateless + external state", "API-driven + observable"]),
          ("12-FACTOR", ["Codebase, deps, config", "Backing services, logs", "Dev/prod parity, processes"]),
          ("PROJECT", ["Go + Next.js", "Docker → EKS manifests", "HPA + audit scorecard"])], a)

s = slide("Serverless, FinOps & governance", "UNIT 6  •  OPTIMIZATION", a, N); N += 1
cards(s, [("SERVERLESS", ["Lambda + API Gateway", "Pay per invocation", "Cold/warm starts"]),
          ("FinOps", ["Cost Explorer + Budgets", "Right-size + lifecycle", "Free Tier guard"]),
          ("GOVERNANCE", ["Policy-as-Code", "Audit trail", "Well-Architected + tags"])], a)

# PROJECT + CLOSE
a = COLORS["U2"]
s = slide("Project delivered", "CLOUDOPS SENTINEL  •  SUMMARY", a, N); N += 1
cards(s, [("WORKING LOCAL", ["13 containers up", "16 browser shots, 0 errors", "Jenkins #10 SUCCESS", "Prometheus 4/4 UP"]),
          ("AWS DELIVERABLES", ["7 CFN templates", "5 individual components", "Free-tier cost plan"]),
          ("BLOCKER", ["SCP p-6k0fjqz3", "EC2/S3/VPC denied", "No bypass, no charges"])], a)

s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, 13.333, 7.5, BG); rect(s, 0, 0, 13.333, 0.12, COLORS["U2"])
txt(s, "Questions?", 0.8, 2.8, 11.7, 1.0, size=48, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
txt(s, "INT 378  |  CloudOps Sentinel  |  CA 3", 0.8, 4.0, 11.7, 0.5, size=18, color=COLORS["U2"], align=PP_ALIGN.CENTER)
txt(s, "github.com/phanindra267/DevOps-WebApp", 0.8, 4.7, 11.7, 0.4, size=14, color=MUTED, align=PP_ALIGN.CENTER)

prs.save(OUT)
print("SAVED:", OUT, "slides:", len(prs.slides._sldIdLst))
