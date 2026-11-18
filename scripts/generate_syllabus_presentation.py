"""
CloudOps Sentinel — chapter-wise syllabus presentation (Session 2026-27)
COMPLETELY NEW DECK. Not derived from the experiment-wise presentation.

Output: CloudOps_Sentinel_ChapWise_2026-27.pptx
Design: 16:9, deep navy + teal/blue/amber/violet accents, concise content,
shape-drawn diagrams, chapter-wise flow, fade slide transitions.
Local-only: no network calls, no external assets required.
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.oxml import parse_xml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "CloudOps_Sentinel_ChapWise_2026-27.pptx")
UI = os.path.join(ROOT, "evidence", "ui")

# ── Palette ────────────────────────────────────────────────────────────────
BG      = RGBColor(0x08, 0x0E, 0x1C)
BG2     = RGBColor(0x0C, 0x15, 0x2B)
SURF    = RGBColor(0x11, 0x1D, 0x38)
SURF2   = RGBColor(0x16, 0x25, 0x46)
BORDER  = RGBColor(0x2A, 0x3E, 0x66)
TEXT    = RGBColor(0xEE, 0xF4, 0xFF)
MUTED   = RGBColor(0x9B, 0xAE, 0xD0)
DIM     = RGBColor(0x5F, 0x75, 0xA0)
BLUE    = RGBColor(0x3B, 0x82, 0xF6)
TEAL    = RGBColor(0x2D, 0xD4, 0xBF)
AMBER   = RGBColor(0xF5, 0x9E, 0x0B)
VIOLET  = RGBColor(0xA7, 0x8B, 0xFA)
GREEN   = RGBColor(0x34, 0xD3, 0x99)
RED     = RGBColor(0xFB, 0x71, 0x85)
WHITE   = RGBColor(0xFF, 0xFF, 0xFF)
FONT    = "Segoe UI"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
SW, SH = prs.slide_width, prs.slide_height

CHAPTERS = [
    ("1", "Advanced Cloud Infrastructure\nand Services", BLUE),
    ("2", "Infrastructure as Code (IaC)", TEAL),
    ("3", "Agile and CI/CD Practices\nfor Scalable Product Development", AMBER),
    ("4", "Monitoring and Observability", GREEN),
    ("5", "DevSecOps and Cloud Security", RED),
    ("6", "Cloud-Native Development\nand Optimization", VIOLET),
]


# ── primitives ─────────────────────────────────────────────────────────────
def rect(s, x, y, w, h, fill, line=None, radius=False, lw=1):
    shp = s.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,
        Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line:
        shp.line.color.rgb = line; shp.line.width = Pt(lw)
    else:
        shp.line.fill.background()
    if radius:
        try: shp.adjustments[0] = 0.12
        except Exception: pass
    return shp


def circle(s, x, y, d, fill, line=None, lw=1):
    shp = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line: shp.line.color.rgb = line; shp.line.width = Pt(lw)
    else: shp.line.fill.background()
    return shp


def txt(s, value, x, y, w, h, size=14, color=TEXT, bold=False,
        align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.0, italic=False):
    tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Inches(0.02)
    tf.margin_top = tf.margin_bottom = Inches(0.01)
    for i, line in enumerate(str(value).split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line
        p.alignment = align
        p.space_after = Pt(4 * spacing)
        p.line_spacing = spacing
        for r in p.runs:
            r.font.name = FONT
            r.font.size = Pt(size)
            r.font.bold = bold
            r.font.italic = italic
            r.font.color.rgb = color
    return tb


def line(s, x1, y1, x2, y2, color=BORDER, width=1.4, dashed=False):
    ln = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,
                                Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    ln.line.color.rgb = color
    ln.line.width = Pt(width)
    if dashed:
        from pptx.enum.dml import MSO_LINE_DASH_STYLE
        ln.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    return ln


def arrow(s, x1, y1, x2, y2, color=TEAL, width=2):
    ln = line(s, x1, y1, x2, y2, color, width)
    from pptx.enum.dml import MSO_LINE_DASH_STYLE
    ln.line.end_arrowhead = None  # python-pptx has no public API; draw triangle instead
    # small triangle at the end
    tri = s.shapes.add_shape(MSO_SHAPE.ISOSCELES_TRIANGLE,
                             Inches(x2 - .07), Inches(y2 - .06), Inches(.14), Inches(.12))
    tri.rotation = 90 if x2 >= x1 else 270
    tri.fill.solid(); tri.fill.fore_color.rgb = color
    tri.line.fill.background()
    return ln


def chip(s, x, y, w, label, color=BLUE, h=.34, size=10.5, fill=None):
    rect(s, x, y, w, h, fill or SURF2, color, radius=True)
    txt(s, label, x + .07, y + .055, w - .14, h - .08, size, color, True,
        align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)


def card(s, x, y, w, h, title, lines, accent=BLUE, icon=None, title_size=13.5, body_size=11.5):
    rect(s, x, y, w, h, SURF, BORDER, radius=True)
    rect(s, x, y + .16, .055, h - .32, accent)
    if icon:
        txt(s, icon, x + .2, y + .16, .34, .34, 15, accent, True)
        tx = x + .58
    else:
        tx = x + .22
    txt(s, title, tx, y + .16, w - (tx - x) - .16, .34, title_size, TEXT, True)
    yy = y + .62
    for item in lines:
        txt(s, "• " + item, x + .24, yy, w - .42, .32, body_size, MUTED)
        yy += .34 if len(item) < 48 else .52
    return (x, y, w, h)


def bullets(s, x, y, w, items, size=13, color=MUTED, accent=TEAL, gap=.44):
    yy = y
    for it in items:
        circle(s, x, yy + .09, .075, accent)
        txt(s, it, x + .2, yy, w - .2, gap, size, color)
        yy += gap
    return yy


def table(s, x, y, w, headers, rows, widths=None, row_h=.46, head_h=.44,
          header_color=BLUE, size=11):
    widths = widths or [w / len(headers)] * len(headers)
    cx = x
    for i, h in enumerate(headers):
        rect(s, cx, y, widths[i] - .03, head_h, SURF2, header_color, radius=True)
        txt(s, h, cx + .09, y + .09, widths[i] - .2, head_h - .12, size - .5, header_color, True)
        cx += widths[i]
    yy = y + head_h + .07
    for ri, row in enumerate(rows):
        cx = x
        for ci, val in enumerate(row):
            fill = SURF if ri % 2 == 0 else BG2
            rect(s, cx, yy, widths[ci] - .03, row_h - .04, fill, BORDER)
            txt(s, str(val), cx + .09, yy + .08, widths[ci] - .2, row_h - .14,
                size, TEXT if ci == 0 else MUTED, ci == 0)
            cx += widths[ci]
        yy += row_h
    return yy


def flow(s, x, y, w, steps, colors=None, h=.92, box_w=None, size=11.5):
    colors = colors or [BLUE, TEAL, AMBER, VIOLET, GREEN, RED]
    n = len(steps)
    gap = .34
    bw = box_w or (w - gap * (n - 1)) / n
    for i, st in enumerate(steps):
        bx = x + i * (bw + gap)
        rect(s, bx, y, bw, h, SURF2, colors[i % len(colors)], radius=True)
        txt(s, st, bx + .08, y + .12, bw - .16, h - .2, size, TEXT, True,
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        if i < n - 1:
            arrow(s, bx + bw + .04, y + h / 2, bx + bw + gap - .04, y + h / 2,
                  colors[(i + 1) % len(colors)], 1.8)
    return y + h


def bg(s, accent=None):
    f = s.background.fill; f.solid(); f.fore_color.rgb = BG
    # subtle upper-right glow + bottom band
    c = circle(s, 11.5, -1.5, 4.4, BG2)
    c.fill.transparency = 35
    rect(s, 0, 7.34, 13.333, .16, BG2)


def footer(s, chapter_no, chapter_title):
    txt(s, f"INT 378  ·  SESSION 2026–27  ·  CHAPTER {chapter_no}: {chapter_title}",
        .6, 7.06, 10.6, .22, 8.5, DIM)
    txt(s, str(len(prs.slides)).zfill(2), 12.25, 7.02, .5, .26, 10, DIM, True,
        align=PP_ALIGN.RIGHT)
    line(s, .6, 7.0, 12.73, 7.0, BORDER, .8)


def slide(kicker, title, subtitle=None, chapter=None, accent=BLUE):
    s = prs.slides.add_slide(BLANK)
    bg(s, accent)
    txt(s, kicker.upper(), .62, .32, 11.8, .26, 10.5, accent, True)
    txt(s, title, .62, .58, 12.1, .52, 25, TEXT, True)
    if subtitle:
        txt(s, subtitle, .64, 1.13, 11.9, .34, 11.8, MUTED)
    line(s, .62, 1.6, 12.7, 1.6, accent, 1.6)
    if chapter:
        no, name, _ = CHAPTERS[chapter - 1]
        footer(s, no, name.replace("\n", " "))
    return s


def divider(chapter_index, topics):
    no, name, accent = CHAPTERS[chapter_index]
    s = prs.slides.add_slide(BLANK)
    bg(s, accent)
    rect(s, 0, 0, .18, 7.5, accent)
    circle(s, 9.6, 1.2, 4.6, BG2)
    txt(s, "CHAPTER", .9, 1.32, 4, .3, 12, accent, True)
    txt(s, no, .85, 1.55, 3.2, 2.3, 128, accent, True)
    txt(s, name, .9, 3.5, 9.6, 1.2, 30, TEXT, True)
    line(s, .92, 4.85, 7.7, 4.85, accent, 2)
    x = .92
    for t in topics:
        w = max(1.5, min(3.1, 0.13 * len(t) + .75))
        if x + w > 12.5: break
        chip(s, x, 5.25, w, t, accent, h=.42, size=10.5, fill=SURF)
        x += w + .16
    txt(s, f"{len(topics)} core topics  ·  concepts + diagrams + local examples",
        .92, 6.15, 10, .3, 11, MUTED)
    footer(s, no, name.replace("\n", " "))
    return s


def add_transition(s):
    """Fade transition on every slide (PowerPoint-compatible XML)."""
    xml = ('<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
           'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" spd="med" advClick="1">'
           '<p:fade/></p:transition>')
    try:
        s._element.append(parse_xml(xml))
    except Exception:
        pass


def note(s, text):
    s.notes_slide.notes_text_frame.text = text


def screenshot(s, name, x, y, w, h, caption=None):
    from PIL import Image
    p = os.path.join(UI, name)
    if not os.path.exists(p):
        txt(s, "[screenshot unavailable]", x, y, w, .4, 11, DIM); return
    iw, ih = Image.open(p).size
    r = min(w / iw, h / ih); ww, hh = int(iw * r), int(ih * r)
    rect(s, x - .04, y - .04, ww + .08, hh + .08, SURF, BORDER, radius=True)
    s.shapes.add_picture(p, Inches(x + (w - ww) / 2), Inches(y + (h - hh) / 2),
                         width=Inches(ww), height=Inches(hh))
    if caption:
        txt(s, caption, x, y + h + .04, w, .26, 9.5, DIM, align=PP_ALIGN.CENTER)


# ═══════════════════════════════ COVER ═════════════════════════════════════
s = prs.slides.add_slide(BLANK)
bg(s)
rect(s, 0, 0, .22, 7.5, TEAL)
circle(s, 9.4, -.8, 5.2, BG2)
circle(s, 11.2, 5.1, 2.4, SURF)
txt(s, "INT 378  ·  SESSION 2026–27", .95, .95, 8, .3, 12, TEAL, True)
txt(s, "Advanced Cloud, DevOps &\nCloud-Native Systems", .9, 1.55, 11.3, 1.8, 38, TEXT, True)
line(s, .95, 3.55, 6.6, 3.55, TEAL, 2.4)
txt(s, "Chapter-wise syllabus guide  ·  concepts, diagrams & practical examples",
    .95, 3.78, 10.5, .4, 15, MUTED)
txt(s, "Kakumani Phaneendra  ·  Reg: 12418953  ·  Lovely Professional University",
    .95, 4.65, 10.8, .34, 12.5, MUTED)
txt(s, "100% local demonstrations  ·  No cloud credentials or charges",
    .95, 5.05, 10.8, .32, 12, TEAL, True)
x = .95
for no, name, col in CHAPTERS:
    chip(s, x, 6.1, 1.82, "CH " + no, col, h=.42, size=11, fill=SURF)
    x += 1.96
note(s, "Chapter-wise deck. Six chapters in exact syllabus order. Each chapter has a "
        "divider, concise concept slides, diagrams and at least one practical/local example.")

# ═══════════════════════════════ AGENDA ════════════════════════════════════
s = slide("Syllabus map", "Six chapters — one continuous learning path",
          "Follow the order: infrastructure → code → delivery → visibility → security → optimization")
agenda = [
    ("1", "Cloud Infrastructure", "AWS/Azure services · provisioning · Docker lifecycle · case studies", BLUE),
    ("2", "Infrastructure as Code", "Terraform · CloudFormation · comparison · future trends", TEAL),
    ("3", "Agile & CI/CD", "SAFe/LeSS · TDD/BDD · Jenkins · A/B testing · debt", AMBER),
    ("4", "Monitoring & Observability", "Metrics · Prometheus · Grafana · alerting · scaling", GREEN),
    ("5", "DevSecOps & Security", "Pipeline gates · IAM · containers · secrets · trends", RED),
    ("6", "Cloud-Native & Optimization", "12-Factor · serverless · FinOps · governance", VIOLET),
]
for i, (no, title, sub, col) in enumerate(agenda):
    x = .65 + (i % 3) * 4.15
    y = 1.95 + (i // 3) * 2.4
    rect(s, x, y, 3.9, 2.05, SURF, BORDER, radius=True)
    circle(s, x + .2, y + .22, .55, col)
    txt(s, no, x + .2, y + .28, .55, .4, 17, WHITE, True, align=PP_ALIGN.CENTER)
    txt(s, title, x + .92, y + .22, 2.75, .62, 14, TEXT, True)
    txt(s, sub, x + .25, y + 1.0, 3.4, .85, 10.8, MUTED)
note(s, "Use this as the revision map. Each chapter builds on the previous one.")

# ═══════════════════════════ CHAPTER 1 ═════════════════════════════════════
divider(0, ["AWS & Azure services", "Provisioning & optimization", "Docker Hub & lifecycle", "Scalable case studies"])

s = slide("Chapter 1 · Cloud services", "Advanced services: AWS and Azure",
          "Same capability families, different product names — the concepts transfer", 1, BLUE)
table(s, .65, 1.95, 12.05,
      ["Capability", "AWS", "Microsoft Azure", "Local equivalent used here"],
      [["Virtual compute", "EC2", "Virtual Machines", "Docker containers"],
       ["Managed containers", "ECS / EKS", "ACI / AKS", "Docker Compose, kind"],
       ["Object storage", "S3", "Blob Storage", "Local filesystem / volume"],
       ["Managed database", "RDS", "Azure SQL", "PostgreSQL container"],
       ["Network isolation", "VPC", "Virtual Network", "Docker bridge networks"],
       ["Edge & AI", "CloudFront, SageMaker", "Front Door, AI Studio", "Nginx, local Ollama (optional)"]],
      widths=[2.5, 2.8, 3.1, 3.65], row_h=.56, head_h=.5, size=11.5)
rect(s, .65, 6.25, 12.05, .62, SURF2, TEAL, radius=True)
txt(s, "Key idea: providers differ in naming and managed services; architecture patterns (compute, network, storage, observability) stay the same.",
    .85, 6.4, 11.7, .35, 11, TEXT)
note(s, "Teach by mapping concepts rather than memorising product names.")

s = slide("Chapter 1 · Provisioning", "Resource provisioning & optimization",
          "Provision only what is needed, then continuously right-size it", 1, BLUE)
flow(s, .7, 2.05, 11.9,
     ["Define need", "Provision (IaC)", "Observe usage", "Right-size", "Automate policy"],
     [BLUE, TEAL, AMBER, VIOLET, GREEN], h=1.05, size=12)
card(s, .7, 3.5, 3.8, 2.5, "Provisioning techniques",
     ["Infrastructure as Code templates", "Golden images / base images", "Environment parity (dev/prod)", "Self-service catalogs"], BLUE, "◈")
card(s, 4.75, 3.5, 3.8, 2.5, "Optimization levers",
     ["Auto-scaling & scheduling", "Reserved / spot capacity", "Idle resource shutdown", "Storage lifecycle policies"], TEAL, "◇")
card(s, 8.8, 3.5, 3.8, 2.5, "Guardrails",
     ["Cost & quota budgets", "Mandatory resource tags", "Policy checks before apply", "Drift detection"], AMBER, "⬡")
txt(s, "Practical: Terraform provisions the local Nginx web server; unused containers can be stopped without losing data.",
    .75, 6.35, 11.8, .35, 11, MUTED)

s = slide("Chapter 1 · Containerization", "Docker, Docker Hub and the container lifecycle",
          "Containers package an app with its dependencies for consistent runs anywhere", 1, BLUE)
rect(s, .7, 1.95, 5.9, 4.85, SURF, BORDER, radius=True)
txt(s, "Docker architecture", .95, 2.15, 5.4, .35, 14, BLUE, True)
rect(s, .95, 2.7, 1.5, .72, SURF2, BLUE, radius=True)
txt(s, "Docker CLI", 1.02, 2.92, 1.36, .3, 11, TEXT, True, align=PP_ALIGN.CENTER)
arrow(s, 2.5, 3.06, 3.05, 3.06, TEAL)
rect(s, 3.1, 2.62, 1.85, .86, SURF2, TEAL, radius=True)
txt(s, "Docker daemon", 3.18, 2.88, 1.7, .34, 11, TEXT, True, align=PP_ALIGN.CENTER)
arrow(s, 5.0, 3.06, 5.55, 3.06, AMBER)
rect(s, 5.6, 2.62, .78, .86, SURF2, AMBER, radius=True)
txt(s, "API", 5.66, 2.9, .66, .3, 10, TEXT, True, align=PP_ALIGN.CENTER)
for i, it in enumerate(["Images (read-only templates)", "Containers (running instances)",
                        "Networks (isolation)", "Volumes (persistent data)"]):
    rect(s, .98 + (i % 2) * 2.72, 3.95 + (i // 2) * .72, 2.5, .56, BG2, BORDER, radius=True)
    txt(s, it, 1.1 + (i % 2) * 2.72, 4.1 + (i // 2) * .72, 2.3, .3, 10.2, MUTED)
txt(s, "Registry: push / pull images", .98, 5.62, 5.2, .3, 11, TEAL, True)

rect(s, 6.85, 1.95, 5.8, 4.85, SURF, BORDER, radius=True)
txt(s, "Lifecycle & Docker Hub", 7.1, 2.15, 5.3, .35, 14, TEAL, True)
flow(s, 7.1, 2.75, 5.3,
     ["Dockerfile", "build → image", "run → container", "push / pull"],
     [BLUE, TEAL, AMBER, VIOLET], h=.86, box_w=1.07, size=9.5)
txt(s, "stop → remove when finished", 7.15, 3.72, 5.2, .26, 9.5, DIM)
bullets(s, 7.15, 4.05, 5.2, [
    "Docker Hub = public image registry (external)",
    "Local registry = localhost:5000 (offline, no charges)",
    "Layers make builds fast and reusable",
    "Volumes survive container removal",
], size=11.5, gap=.6)
note(s, "Emphasise: image vs container, and why a local registry replaces Docker Hub in this project.")

s = slide("Chapter 1 · Case studies", "Scalable cloud solutions in practice",
          "Three industry patterns — same underlying cloud primitives", 1, BLUE)
cases = [
    ("Netflix", "Streaming at global scale", "Microservices + auto-scaling + chaos testing", "Resilient, region-independent streaming", BLUE),
    ("Amazon", "Peak-demand commerce", "Decoupled services, queues, elastic compute", "Handles flash sales without over-provisioning", AMBER),
    ("Uber", "Real-time matching", "Event-driven, geo-distributed, containerised services", "Low-latency trips and surge handling", VIOLET),
]
for i, (name, challenge, approach, outcome, col) in enumerate(cases):
    x = .7 + i * 4.15
    rect(s, x, 2.0, 3.9, 4.35, SURF, BORDER, radius=True)
    rect(s, x, 2.0, 3.9, .55, col)
    txt(s, name, x + .2, 2.12, 3.5, .32, 15, WHITE, True)
    txt(s, "CHALLENGE", x + .22, 2.8, 3.4, .25, 9.5, col, True)
    txt(s, challenge, x + .22, 3.05, 3.45, .6, 11.5, TEXT)
    txt(s, "APPROACH", x + .22, 3.78, 3.4, .25, 9.5, TEAL, True)
    txt(s, approach, x + .22, 4.02, 3.45, .75, 11.2, MUTED)
    txt(s, "OUTCOME", x + .22, 4.85, 3.4, .25, 9.5, GREEN, True)
    txt(s, outcome, x + .22, 5.08, 3.45, .75, 11.2, MUTED)
txt(s, "Common lesson: scale horizontally, decouple components, automate recovery, and observe everything.",
    .75, 6.55, 11.8, .35, 11.5, TEAL, True)
note(s, "Keep case studies short: challenge → approach → outcome. Avoid deep vendor history.")

# ═══════════════════════════ CHAPTER 2 ═════════════════════════════════════
divider(1, ["IaC fundamentals", "Terraform workflow", "CloudFormation", "Comparison & trends"])

s = slide("Chapter 2 · Fundamentals", "Infrastructure as Code: why it matters",
          "Describe infrastructure in files; let automation create and manage it", 2, TEAL)
rect(s, .7, 2.0, 5.75, 4.55, BG2, RED, radius=True)
txt(s, "WITHOUT IaC", .95, 2.2, 5.2, .35, 13, RED, True)
bullets(s, 1.0, 2.75, 5.15, [
    "Manual clicks → configuration drift",
    "No review history or repeatability",
    "Slow, error-prone environment setup",
    "Disaster recovery depends on memory",
], size=12, gap=.72, accent=RED)
rect(s, 6.85, 2.0, 5.75, 4.55, BG2, TEAL, radius=True)
txt(s, "WITH IaC", 7.1, 2.2, 5.2, .35, 13, TEAL, True)
bullets(s, 7.15, 2.75, 5.15, [
    "Versioned, reviewable source of truth",
    "Repeatable dev / test / prod environments",
    "Fast provisioning and safe teardown",
    "Drift detection and policy enforcement",
], size=12, gap=.72, accent=TEAL)
rect(s, .7, 6.1, 11.9, .55, SURF, BORDER, radius=True)
txt(s, "Declarative = describe desired state (Terraform, CloudFormation). Imperative = describe steps (scripts).",
    .9, 6.25, 11.5, .3, 11, MUTED)

s = slide("Chapter 2 · Terraform", "Terraform: hands-on workflow",
          "Providers connect declarative configs to real platforms", 2, TEAL)
flow(s, .7, 2.05, 11.9,
     ["write .tf", "init", "validate", "plan", "apply", "state / destroy"],
     [TEAL, BLUE, AMBER, VIOLET, GREEN, RED], h=.92, size=11.5)
card(s, .7, 3.35, 3.75, 2.85, "Core building blocks",
     ["provider — platform plugin", "resource — managed object", "module — reusable unit", "variables / outputs"], TEAL, "◈")
card(s, 4.72, 3.35, 3.75, 2.85, "State & safety",
     ["state maps config → real objects", "plan shows changes before apply", "lock state for teams", "destroy removes managed resources"], BLUE, "◇")
card(s, 8.74, 3.35, 3.88, 2.85, "Local example",
     ["Docker provider (kreuzwerker)", "2 networks + volume + containers", "Nginx web server on :8088", "8 resources applied, 0 destroyed"], GREEN, "⬡")
txt(s, "Exam tip: init downloads providers, plan is read-only, apply changes infrastructure, destroy reverses it.",
    .75, 6.5, 11.8, .32, 11, MUTED)

s = slide("Chapter 2 · CloudFormation", "CloudFormation and the two-tool comparison",
          "CloudFormation is AWS-native; Terraform is multi-provider", 2, TEAL)
rect(s, .7, 1.95, 4.5, 4.75, SURF, BORDER, radius=True)
txt(s, "Template anatomy", .95, 2.15, 4, .32, 13, TEAL, True)
for i, k in enumerate(["AWSTemplateFormatVersion", "Parameters", "Resources (required)", "Outputs", "Mappings / Conditions"]):
    rect(s, .98, 2.68 + i * .62, 3.94, .5, BG2, BORDER, radius=True)
    txt(s, k, 1.12, 2.8 + i * .62, 3.7, .3, 11, TEXT, i == 2)
txt(s, "Stack = a set of resources created/updated together from one template.",
    .98, 5.95, 3.95, .6, 10.5, MUTED)
table(s, 5.45, 1.95, 7.2,
      ["Aspect", "Terraform", "CloudFormation"],
      [["Language", "HCL (declarative)", "YAML / JSON"],
       ["Scope", "Multi-cloud + local", "AWS only"],
       ["State", "Explicit state file", "Managed by AWS"],
       ["Ecosystem", "Large provider registry", "AWS-native services"],
       ["Best for", "Hybrid / multi-cloud", "AWS-only stacks"]],
      widths=[1.7, 2.75, 2.75], row_h=.62, head_h=.5, size=11, header_color=TEAL)
txt(s, "Choose by scope: one cloud → CloudFormation; several providers or local simulation → Terraform.",
    5.55, 5.72, 7.0, .8, 11, MUTED)

s = slide("Chapter 2 · Trends", "Where Infrastructure as Code is heading",
          "IaC is merging with policy, Git workflows and AI assistance", 2, TEAL)
trends = [
    ("Policy as Code", "Validate security & cost before apply", BLUE),
    ("GitOps", "Git is the source of truth; agents reconcile", TEAL),
    ("Drift Detection", "Detect out-of-band changes continuously", AMBER),
    ("Real-language IaC", "Pulumi, AWS CDK use Python/TypeScript", VIOLET),
    ("AI-assisted IaC", "Generate & review templates with local models", GREEN),
    ("Multi-cloud abstraction", "One definition, several providers", RED),
]
for i, (t, d, c) in enumerate(trends):
    x = .7 + (i % 3) * 4.15
    y = 2.05 + (i // 3) * 2.25
    card(s, x, y, 3.9, 1.9, t, [d], c, "◈", title_size=12.5, body_size=11)
txt(s, "Local practice: `terraform validate` + a policy file in `security/` demonstrates pre-apply checks.",
    .75, 6.65, 11.8, .3, 11, MUTED)

# ═══════════════════════════ CHAPTER 3 ═════════════════════════════════════
divider(2, ["SAFe & LeSS", "TDD / BDD", "CI/CD & Jenkins", "A/B testing & debt"])

s = slide("Chapter 3 · Agile at scale", "Scaling Agile: SAFe and LeSS",
          "Two ways to coordinate many teams without losing agility", 3, AMBER)
table(s, .7, 1.95, 12.0,
      ["Dimension", "SAFe", "LeSS"],
      [["Structure", "Teams → Program → Solution trains", "Few teams, one product backlog"],
       ["Roles", "Product Owner, Scrum Master, Architects", "PO + Scrum Masters (minimal extras)"],
       ["Planning", "PI planning, multi-level backlog", "One sprint & one integrated increment"],
       ["Best for", "Large enterprises, many dependencies", "Product-focused organisations"]],
      widths=[2.2, 4.9, 4.9], row_h=.68, head_h=.5, size=11.5, header_color=AMBER)
rect(s, .7, 5.4, 5.85, 1.25, SURF, BLUE, radius=True)
txt(s, "SAFe flow", .95, 5.6, 5.3, .3, 11.5, BLUE, True)
txt(s, "Team → Program → Solution → Portfolio", .95, 5.95, 5.3, .35, 11, MUTED)
rect(s, 6.85, 5.4, 5.85, 1.25, SURF, TEAL, radius=True)
txt(s, "LeSS flow", 7.1, 5.6, 5.3, .3, 11.5, TEAL, True)
txt(s, "Shared backlog → Teams → One product increment", 7.1, 5.95, 5.3, .35, 11, MUTED)

s = slide("Chapter 3 · Quality", "TDD and BDD: tests that drive design",
          "Write the expectation first, then build just enough to satisfy it", 3, AMBER)
rect(s, .7, 2.0, 5.85, 4.55, SURF, BLUE, radius=True)
txt(s, "TDD — Test Driven Development", .95, 2.2, 5.3, .35, 13.5, BLUE, True)
flow(s, .95, 2.8, 5.3, ["RED\nfailing test", "GREEN\nminimal code", "REFACTOR\nclean up"],
     [RED, GREEN, AMBER], h=1.05, size=11)
txt(s, "Example: expect total() = 0 → implement sum → simplify loop.",
    .98, 4.35, 5.25, .6, 11.2, MUTED)
txt(s, "Benefit: fewer defects, safer refactoring, living documentation.",
    .98, 5.3, 5.25, .8, 11.2, TEXT)
rect(s, 6.85, 2.0, 5.85, 4.55, SURF, TEAL, radius=True)
txt(s, "BDD — Behavior Driven Development", 7.1, 2.2, 5.3, .35, 13.5, TEAL, True)
rect(s, 7.1, 2.85, 5.25, 1.5, BG2, BORDER, radius=True)
txt(s, "GIVEN a logged-in user\nWHEN they submit an order\nTHEN an order ID is returned",
    7.3, 3.05, 4.9, 1.1, 11.5, TEXT)
txt(s, "Scenarios are written in plain language shared by devs, testers and product owners.",
    7.15, 4.65, 5.2, .8, 11.2, MUTED)
txt(s, "Benefit: shared understanding of behaviour before code is written.",
    7.15, 5.55, 5.2, .7, 11.2, TEXT)

s = slide("Chapter 3 · Delivery", "CI/CD: the automated delivery pipeline",
          "Every commit is verified and can reach production safely", 3, AMBER)
flow(s, .65, 2.0, 12.0,
     ["Commit", "Build", "Unit tests", "SAST / deps", "Image scan", "IaC check", "Deploy", "Monitor"],
     [BLUE, TEAL, GREEN, VIOLET, RED, AMBER, BLUE, TEAL], h=1.0, size=10.5)
card(s, .65, 3.45, 3.85, 2.6, "Continuous Integration",
     ["Frequent merges to main", "Automated build + tests", "Fast feedback (<10 min)", "Fail fast on red builds"], BLUE, "◈")
card(s, 4.75, 3.45, 3.85, 2.6, "Continuous Delivery",
     ["Release-ready artifacts", "Automated quality gates", "One-click or auto deploy", "Repeatable rollback"], AMBER, "◇")
card(s, 8.85, 3.45, 3.85, 2.6, "Jenkins locally",
     ["Pipeline as code (Jenkinsfile)", "Docker CLI via mounted socket", "6 real stages executed", "Build verified: SUCCESS"], GREEN, "⬡")
screenshot(s, "09_jenkins_job.png", 9.0, 6.1, 3.5, .9, None)

s = slide("Chapter 3 · Product", "Product strategy and distributed teams",
          "Align people around outcomes, not just tasks", 3, AMBER)
flow(s, .7, 2.05, 11.9, ["Vision", "Roadmap", "Epics", "Squads", "Increments"],
     [AMBER, BLUE, TEAL, VIOLET, GREEN], h=.95, size=12)
card(s, .7, 3.4, 3.8, 2.75, "Strategy",
     ["Problem-first vision", "Prioritised outcomes", "Explicit trade-offs", "Short feedback loops"], AMBER, "◈")
card(s, 4.75, 3.4, 3.8, 2.75, "Distributed teams",
     ["Shared backlog & definitions", "Async documentation", "Timezone-friendly rituals", "Ownership boundaries"], BLUE, "◇")
card(s, 8.8, 3.4, 3.8, 2.75, "Collaboration habits",
     ["Small batch sizes", "Pair / mob reviews", "Blameless retros", "Visible work boards"], TEAL, "⬡")
txt(s, "Rule: optimise the flow of value, not the utilisation of individuals.",
    .75, 6.45, 11.8, .32, 11.5, MUTED)

s = slide("Chapter 3 · Experimentation", "A/B testing and technical debt",
          "Learn from users; keep the codebase changeable", 3, AMBER)
rect(s, .7, 1.95, 5.9, 4.75, SURF, BORDER, radius=True)
txt(s, "A/B testing", .95, 2.15, 5.4, .35, 13.5, BLUE, True)
rect(s, .95, 2.72, 2.6, .85, SURF2, BLUE, radius=True)
txt(s, "90%  Control (A)", 1.05, 2.98, 2.4, .32, 11.5, TEXT, True, align=PP_ALIGN.CENTER)
rect(s, 3.72, 2.72, 2.6, .85, SURF2, TEAL, radius=True)
txt(s, "10%  Variant (B)", 3.82, 2.98, 2.4, .32, 11.5, TEXT, True, align=PP_ALIGN.CENTER)
bullets(s, 1.0, 3.85, 5.2, [
    "One hypothesis, one primary metric",
    "Guardrails: latency, errors, revenue",
    "Run long enough for significance",
], size=11.5, gap=.62)
rect(s, 6.85, 1.95, 5.8, 4.75, SURF, BORDER, radius=True)
txt(s, "Technical debt", 7.1, 2.15, 5.3, .35, 13.5, AMBER, True)
table(s, 7.1, 2.7, 5.25, ["", "Prudent", "Reckless"],
      [["Deliberate", "Ship now, document debt", "Skip tests / review"],
       ["Accidental", "Discovery after release", "Ignored design decay"]],
      widths=[1.55, 1.95, 1.75], row_h=.68, head_h=.44, size=10.5, header_color=AMBER)
bullets(s, 7.15, 4.95, 5.15, [
    "Track debt in the backlog",
    "Time-box repayment each sprint",
], size=11.5, gap=.6, accent=AMBER)

s = slide("Chapter 3 · Best practice", "Jenkins automation & agile delivery habits",
          "Automate the boring, repeatable parts; keep humans for judgement", 3, AMBER)
card(s, .7, 1.95, 5.85, 2.15, "A good Jenkins pipeline",
     ["Pipeline-as-code in the repository", "Fast stages first, expensive later", "Ephemeral agents and cached deps", "Post-build reports + notifications"], BLUE, "◈")
card(s, 6.85, 1.95, 5.85, 2.15, "Triggers & feedback",
     ["Push / PR webhook (local: manual trigger)", "Build status visible to the team", "Artifacts tagged with commit SHA", "Rollback is one command"], TEAL, "◇")
card(s, .7, 4.3, 11.98, 2.2, "Best-practice checklist",
     ["Small commits · trunk-based development · automated tests · security gates · idempotent deploys · blameless reviews · measurable lead time"],
     AMBER, "⬡", body_size=12)
note(s, "Tie best practices to the local Jenkins run: stages were checkout, tests, Trivy, build, health, validate.")

# ═══════════════════════════ CHAPTER 4 ═════════════════════════════════════
divider(3, ["Metrics, logs, traces", "Prometheus & PromQL", "Grafana dashboards", "Alerting & scale"])

s = slide("Chapter 4 · Foundations", "Monitoring vs Observability",
          "Monitoring answers “is it broken?”; observability explains “why?”", 4, GREEN)
rect(s, .7, 2.0, 5.85, 2.05, BG2, BLUE, radius=True)
txt(s, "MONITORING", .95, 2.2, 5.3, .32, 13, BLUE, True)
txt(s, "Predefined checks, dashboards and alerts for known failure modes.",
    .95, 2.62, 5.3, .9, 12, MUTED)
rect(s, 6.85, 2.0, 5.85, 2.05, BG2, GREEN, radius=True)
txt(s, "OBSERVABILITY", 7.1, 2.2, 5.3, .32, 13, GREEN, True)
txt(s, "Enough telemetry to investigate unknown problems without new code.",
    7.1, 2.62, 5.3, .9, 12, MUTED)
txt(s, "Three pillars", .75, 4.35, 4, .3, 12, TEXT, True)
pillars = [("Metrics", "Numeric time series", BLUE), ("Logs", "Discrete timestamped events", TEAL), ("Traces", "Request paths across services", VIOLET)]
for i, (t, d, c) in enumerate(pillars):
    x = .75 + i * 4.08
    rect(s, x, 4.8, 3.85, 1.4, SURF, c, radius=True)
    circle(s, x + .18, 5.05, .34, c)
    txt(s, t, x + .65, 5.02, 2.9, .34, 13, TEXT, True)
    txt(s, d, x + .65, 5.42, 2.95, .5, 10.8, MUTED)
txt(s, "Golden signals: latency · traffic · errors · saturation.",
    .75, 6.55, 11.8, .32, 11.5, GREEN, True)

s = slide("Chapter 4 · Prometheus", "Prometheus architecture in one diagram",
          "Pull-based metrics, local time-series DB and a separate alerting path", 4, GREEN)
rect(s, .7, 2.0, 3.0, 3.9, SURF, BLUE, radius=True)
txt(s, "Targets & exporters", .9, 2.2, 2.6, .32, 12.5, BLUE, True)
for i, t in enumerate(["App /metrics", "Node Exporter", "cAdvisor", "Pushgateway (optional)"]):
    rect(s, .92, 2.75 + i * .68, 2.55, .5, BG2, BORDER, radius=True)
    txt(s, t, 1.03, 2.88 + i * .68, 2.35, .28, 10.5, MUTED)
arrow(s, 3.75, 3.9, 4.35, 3.9, TEAL, 2.4)
rect(s, 4.4, 2.0, 3.5, 3.9, SURF, TEAL, radius=True)
txt(s, "Prometheus server", 4.65, 2.2, 3.0, .32, 12.5, TEAL, True)
for i, t in enumerate(["Service discovery", "Scrape + TSDB", "PromQL engine", "Recording rules"]):
    rect(s, 4.62, 2.75 + i * .68, 3.05, .5, BG2, BORDER, radius=True)
    txt(s, t, 4.73, 2.88 + i * .68, 2.85, .28, 10.5, MUTED)
arrow(s, 7.95, 3.9, 8.55, 3.9, AMBER, 2.4)
rect(s, 8.6, 2.0, 4.05, 3.9, SURF, AMBER, radius=True)
txt(s, "Consumers", 8.85, 2.2, 3.5, .32, 12.5, AMBER, True)
for i, t in enumerate(["Grafana dashboards", "Alertmanager → notifications", "Ad-hoc queries / API", "Capacity reports"]):
    rect(s, 8.82, 2.75 + i * .68, 3.6, .5, BG2, BORDER, radius=True)
    txt(s, t, 8.93, 2.88 + i * .68, 3.4, .28, 10.5, MUTED)
txt(s, "Metric types: Counter (monotonic) · Gauge (up/down) · Histogram (buckets) · Summary (quantiles).",
    .75, 6.25, 11.8, .4, 11.2, MUTED)

s = slide("Chapter 4 · Dashboards", "Grafana: from metrics to decisions",
          "Dashboards turn time series into fast operational answers", 4, GREEN)
flow(s, .7, 2.0, 11.9, ["Prometheus source", "Queries / PromQL", "Panels", "Dashboard", "Alert rules"],
     [GREEN, BLUE, TEAL, VIOLET, AMBER], h=.95, size=11.5)
card(s, .7, 3.35, 3.8, 2.75, "Panel types",
     ["Time series (trends)", "Gauge / stat (single value)", "Bar gauge (comparison)", "Table (details)"], BLUE, "◈")
card(s, 4.75, 3.35, 3.8, 2.75, "Design rules",
     ["Lead with golden signals", "Use consistent units", "Add thresholds & annotations", "Avoid too many panels"], TEAL, "◇")
card(s, 8.8, 3.35, 3.88, 2.75, "Local verification",
     ["Datasource: Prometheus", "Dashboard auto-provisioned", "4 scrape targets UP", "Node + cAdvisor metrics"], GREEN, "⬡")
screenshot(s, "07_grafana.png", 9.0, 6.1, 3.5, .85, None)

s = slide("Chapter 4 · Scale", "Collection, alerting and scaling observability",
          "Keep signals useful, bounded and actionable", 4, GREEN)
rect(s, .7, 1.95, 5.9, 4.8, SURF, BORDER, radius=True)
txt(s, "An alert rule", .95, 2.15, 5.4, .32, 13, AMBER, True)
rect(s, .95, 2.65, 5.35, 1.5, BG2, BORDER, radius=True)
txt(s, "expr: up == 0\nfor: 1m\nlabels: severity=critical\nannotations: summary=\"Service down\"",
    1.12, 2.82, 5.05, 1.15, 10.8, TEXT)
bullets(s, 1.0, 4.45, 5.25, [
    "Alert on symptoms, not every spike",
    "Include runbook link and owner",
    "Dedupe and group related alerts",
], size=11.5, gap=.62)
rect(s, 6.85, 1.95, 5.8, 4.8, SURF, BORDER, radius=True)
txt(s, "Scaling & advanced strategies", 7.1, 2.15, 5.3, .32, 13, TEAL, True)
bullets(s, 7.15, 2.7, 5.2, [
    "Federation / remote write for many clusters",
    "Control cardinality (avoid user IDs as labels)",
    "Retention tiers and downsampling",
    "OpenTelemetry for unified traces",
    "eBPF for kernel-level visibility",
    "SLOs and error budgets drive priorities",
], size=11.2, gap=.6, accent=TEAL)
note(s, "Stress: a good alert is actionable and has an owner. Too many alerts destroy value.")

# ═══════════════════════════ CHAPTER 5 ═════════════════════════════════════
divider(4, ["Shift-left security", "IAM & least privilege", "Container / K8s security", "Secrets & trends"])

s = slide("Chapter 5 · DevSecOps", "Shift-left: security inside the pipeline",
          "Find problems early, when they are cheapest to fix", 5, RED)
flow(s, .65, 2.0, 12.0,
     ["Code", "SAST", "Dependencies", "Secrets", "Image scan", "IaC scan", "Deploy", "Runtime"],
     [BLUE, VIOLET, AMBER, RED, RED, AMBER, GREEN, TEAL], h=.98, size=10.8)
card(s, .65, 3.4, 3.85, 2.6, "Principles",
     ["Security is everyone's job", "Automate gates, not meetings", "Fail the build on critical findings", "Keep evidence for audits"], RED, "◈")
card(s, 4.75, 3.4, 3.85, 2.6, "Pipeline checks",
     ["SAST: source weaknesses", "SCA: vulnerable dependencies", "Image: OS & runtime CVEs", "IaC: risky cloud config"], BLUE, "◇")
card(s, 8.85, 3.4, 3.85, 2.6, "Local evidence",
     ["Trivy filesystem / image / IaC", "JSON + text reports stored", "Real CVE counts reported", "Gate failing honestly documented"], AMBER, "⬡")
screenshot(s, "18_auth_security.png", 9.0, 6.08, 3.5, .9, None)

s = slide("Chapter 5 · IAM", "Cloud security: identity, MFA and least privilege",
          "Identity is the new perimeter — prove who you are and limit what you can do", 5, RED)
flow(s, .7, 2.0, 11.9, ["Identify", "Authenticate (MFA)", "Authorize (RBAC)", "Audit"],
     [RED, AMBER, BLUE, TEAL], h=.95, size=12)
table(s, .7, 3.35, 11.95,
      ["AWS concept", "Meaning", "Local equivalent in this project"],
      [["IAM user / group", "Identity and collection of identities", "Local principal + role in iam_local.py"],
       ["Policy", "Allowed / denied actions", "Permission map (deploy, iam:createuser)"],
       ["MFA", "Second factor (TOTP)", "RFC 6238 TOTP with ±1 step window"],
       ["AssumeRole", "Temporary elevated role", "MFA-gated role switch"],
       ["CloudTrail", "Audit events", "audit_log.json (15 events)"]],
      widths=[2.6, 4.4, 4.95], row_h=.6, head_h=.48, size=11, header_color=RED)
txt(s, "Rule of least privilege: grant the minimum permission needed, for the shortest time possible.",
    .78, 6.5, 11.8, .32, 11.2, TEXT)

s = slide("Chapter 5 · Workloads", "Container and Kubernetes security",
          "Secure every layer: image → registry → runtime → cluster", 5, RED)
layers = [
    ("Build", "Minimal base image · non-root user · pinned deps", BLUE),
    ("Registry", "Scan on push · image signatures · private access", TEAL),
    ("Runtime", "Read-only rootfs · CPU/memory limits · seccomp", AMBER),
    ("Cluster", "RBAC · network policies · secrets · admission control", RED),
]
for i, (t, d, c) in enumerate(layers):
    y = 1.98 + i * 1.12
    rect(s, .8, y, 11.7, .95, SURF, c, radius=True)
    rect(s, .8, y, 1.7, .95, c)
    txt(s, t.upper(), .95, y + .3, 1.45, .35, 11.5, WHITE, True, align=PP_ALIGN.CENTER)
    txt(s, d, 2.75, y + .3, 9.4, .35, 12, TEXT)
txt(s, "Kubernetes adds: service accounts, namespace isolation, pod security standards, and encrypted etcd.",
    .85, 6.55, 11.6, .32, 11, MUTED)

s = slide("Chapter 5 · Secrets", "Secrets and key management",
          "Never store credentials in source code, images or reports", 5, RED)
table(s, .7, 1.95, 12.0,
      ["Do", "Avoid"],
      [["Use a secret manager / environment injection", "Hard-coded passwords or API keys"],
       ["Generate unique secrets per environment", "Reusing one key everywhere"],
       ["Rotate and expire credentials", "Long-lived static tokens"],
       ["Audit access to secrets", "Printing secrets in logs or CI output"],
       ["Use short-lived role credentials", "Committing .env files to Git"]],
      widths=[6.0, 6.0], row_h=.62, head_h=.5, size=11.5, header_color=RED)
rect(s, .7, 5.85, 12.0, .85, SURF2, TEAL, radius=True)
txt(s, "Lifecycle: generate → store securely → grant scoped access → rotate → revoke → audit.",
    .95, 6.1, 11.5, .35, 11.5, TEXT)
txt(s, "Local project: JWT_SECRET is read from the environment; demo values are labelled, not real secrets.",
    .95, 6.42, 11.5, .28, 10, MUTED)

s = slide("Chapter 5 · Trends", "Emerging trends in DevOps security",
          "From point-in-time scanning to continuous supply-chain assurance", 5, RED)
tr = [("SBOM & SLSA", "Know what is in your software and how it was built", RED),
      ("Provenance signing", "Verify artifact origin before deployment", BLUE),
      ("Zero Trust", "Never trust by default; verify every request", TEAL),
      ("Policy as Code", "Security rules versioned and automated", AMBER),
      ("Confidential computing", "Protect data in use, not just at rest", VIOLET),
      ("AI-assisted detection", "Prioritise anomalies and remediation", GREEN)]
for i, (t, d, c) in enumerate(tr):
    x = .7 + (i % 3) * 4.15
    y = 2.05 + (i // 3) * 2.25
    card(s, x, y, 3.9, 1.9, t, [d], c, "◈", title_size=12.5, body_size=10.8)

# ═══════════════════════════ CHAPTER 6 ═════════════════════════════════════
divider(5, ["Cloud-native design", "12-Factor App", "Serverless", "FinOps & governance"])

s = slide("Chapter 6 · Architecture", "What makes an application cloud-native",
          "Design for elasticity, resilience and fast change", 6, VIOLET)
traits = [("Containers", "Consistent packaging & isolation", BLUE),
          ("Microservices", "Small, independently deployable units", TEAL),
          ("Declarative APIs", "Desired state, automated reconciliation", AMBER),
          ("Observability", "Metrics, logs and traces built in", GREEN),
          ("Resilience", "Retry, circuit breakers, graceful degradation", RED),
          ("Automation", "CI/CD, IaC and self-healing", VIOLET)]
for i, (t, d, c) in enumerate(traits):
    x = .7 + (i % 3) * 4.15
    y = 1.98 + (i // 3) * 2.2
    card(s, x, y, 3.9, 1.88, t, [d], c, "◈", title_size=12.5, body_size=10.8)
txt(s, "Cloud-native is an approach to building and running software — not a specific vendor or tool.",
    .75, 6.62, 11.8, .3, 11, MUTED)

s = slide("Chapter 6 · 12-Factor", "The 12-Factor App methodology",
          "A checklist for portable, scalable, maintainable services", 6, VIOLET)
groups = [
    ("FOUNDATION", BLUE, ["1 Codebase", "2 Dependencies", "3 Config", "4 Backing services"]),
    ("BUILD & RUN", TEAL, ["5 Build → release → run", "6 Processes (stateless)", "7 Port binding", "8 Concurrency (scale out)"]),
    ("OPERATE", AMBER, ["9 Disposability", "10 Dev/prod parity", "11 Logs as streams", "12 Admin processes"]),
]
for i, (title, col, items) in enumerate(groups):
    x = .7 + i * 4.15
    rect(s, x, 2.0, 3.9, 4.45, SURF, BORDER, radius=True)
    rect(s, x, 2.0, 3.9, .55, col)
    txt(s, title, x + .2, 2.14, 3.5, .32, 12.5, WHITE, True)
    yy = 2.85
    for it in items:
        circle(s, x + .22, yy + .06, .1, col)
        txt(s, it, x + .48, yy, 3.15, .5, 11.5, TEXT)
        yy += .82
txt(s, "Exam focus: config in environment, stateless processes, logs as event streams, dev/prod parity.",
    .75, 6.62, 11.8, .3, 11, MUTED)

s = slide("Chapter 6 · Serverless", "Serverless and function-as-a-service",
          "Run code on events; the platform manages servers and scaling", 6, VIOLET)
flow(s, .7, 2.0, 11.9,
     ["Event", "API Gateway", "Function", "Backend service", "Logs & metrics"],
     [VIOLET, BLUE, TEAL, GREEN, AMBER], h=.98, size=11.5)
card(s, .7, 3.4, 3.8, 2.7, "Characteristics",
     ["No server management", "Scale to zero / automatic", "Pay per invocation", "Short, stateless functions"], VIOLET, "◈")
card(s, 4.75, 3.4, 3.8, 2.7, "Execution details",
     ["Cold start vs warm start", "Memory & timeout limits", "Structured logs", "Idempotent handlers"], BLUE, "◇")
card(s, 8.8, 3.4, 3.88, 2.7, "Local simulation",
     ["Node local Lambda runtime", "API Gateway proxy event", "CloudWatch-style JSON logs", "3/3 invocations HTTP 200"], GREEN, "⬡")
txt(s, "Use serverless for event-driven, spiky workloads — not long-running or low-latency-stable processes.",
    .75, 6.45, 11.8, .32, 11, MUTED)

s = slide("Chapter 6 · FinOps", "Cost optimization strategies",
          "Continuous practice: observe → allocate → optimize → verify", 6, VIOLET)
flow(s, .7, 2.0, 11.9, ["Observe", "Allocate", "Optimize", "Verify"],
     [VIOLET, BLUE, TEAL, GREEN], h=.95, size=12.5)
costs = [("Rightsizing", "Match instance to real usage", BLUE),
         ("Scheduling", "Stop non-prod outside hours", TEAL),
         ("Spot / reserved", "Cheaper capacity for flexible work", AMBER),
         ("Storage tiers", "Move cold data to cheaper storage", VIOLET),
         ("Egress control", "Reduce cross-region transfers", RED),
         ("Autoscaling", "Add/remove capacity with demand", GREEN)]
for i, (t, d, c) in enumerate(costs):
    x = .7 + (i % 3) * 4.15
    y = 3.3 + (i // 3) * 1.55
    card(s, x, y, 3.9, 1.35, t, [d], c, None, title_size=12, body_size=10.5)
txt(s, "Local estimate in this project is clearly labelled: it is NOT actual AWS billing.",
    .75, 6.62, 11.8, .3, 11, TEAL, True)

s = slide("Chapter 6 · Billing & governance", "Billing models, monitoring and governance",
          "Know what you pay for, prove what you did, and stay compliant", 6, VIOLET)
table(s, .7, 1.95, 6.0,
      ["Billing model", "Best for"],
      [["On-demand", "Unpredictable, short workloads"],
       ["Reserved / savings plan", "Steady, long-running baseline"],
       ["Spot / preemptible", "Fault-tolerant batch jobs"]],
      widths=[2.5, 3.5], row_h=.68, head_h=.5, size=11.5, header_color=VIOLET)
rect(s, 7.0, 1.95, 5.65, 3.0, SURF, BORDER, radius=True)
txt(s, "Cost monitoring", 7.25, 2.15, 5.1, .32, 13, BLUE, True)
bullets(s, 7.3, 2.7, 5.0, [
    "Tag resources by owner & environment",
    "Budgets + threshold alerts",
    "Showback / chargeback reports",
], size=11.5, gap=.68)
rect(s, .7, 5.25, 11.95, 1.5, SURF2, TEAL, radius=True)
txt(s, "Governance, compliance & secure architecture", .95, 5.45, 11.4, .32, 13, TEAL, True)
txt(s, "Policy-as-code · immutable audit trail · encryption at rest & in transit · least privilege · shared-responsibility model · evidence for audits",
    .95, 5.9, 11.4, .6, 11.3, MUTED)

# ═══════════════════════════ FINAL REVISION ════════════════════════════════
s = slide("Revision", "One-page chapter map",
          "Use this to recall the structure of the whole syllabus before an exam", None, TEAL)
final_map = [
    ("1", "Infrastructure", "AWS/Azure services · provisioning · Docker lifecycle · 3 case studies", BLUE),
    ("2", "IaC", "Why IaC · Terraform init→apply · CloudFormation · comparison · trends", TEAL),
    ("3", "Agile & CI/CD", "SAFe vs LeSS · TDD/BDD · pipeline · A/B · debt · Jenkins", AMBER),
    ("4", "Observability", "Metrics/logs/traces · Prometheus · Grafana · alerts · scale", GREEN),
    ("5", "DevSecOps", "Shift-left · IAM/MFA · containers · secrets · supply chain", RED),
    ("6", "Cloud-native", "12-Factor · serverless · FinOps · billing · governance", VIOLET),
]
for i, (no, t, d, c) in enumerate(final_map):
    y = 1.9 + i * .76
    rect(s, .7, y, 11.95, .64, SURF, BORDER, radius=True)
    rect(s, .7, y, .62, .64, c)
    txt(s, no, .7, y + .16, .62, .3, 12, WHITE, True, align=PP_ALIGN.CENTER)
    txt(s, t, 1.5, y + .1, 2.5, .35, 12, TEXT, True)
    txt(s, d, 4.0, y + .13, 8.4, .35, 10.8, MUTED)

s = prs.slides.add_slide(BLANK)
bg(s)
rect(s, 0, 0, .22, 7.5, TEAL)
txt(s, "Questions & revision checklist", 1.0, 2.0, 11.2, .7, 34, TEXT, True)
line(s, 1.0, 2.95, 6.4, 2.95, TEAL, 2.2)
txt(s, "Can you explain each chapter in one diagram and one example?", 1.0, 3.25, 11.0, .45, 15, MUTED)
bullets(s, 1.05, 4.0, 10.5, [
    "Map AWS services to Azure equivalents and to local tools",
    "Draw the Terraform and CI/CD workflows from memory",
    "Explain the three observability pillars and an alert rule",
    "List the IAM lifecycle and one container security control",
    "Recall all 12 factors and three cost-optimisation tactics",
], size=13, gap=.52, accent=TEAL)
txt(s, "Thank you  ·  INT 378  ·  Session 2026–27", 1.0, 6.75, 10, .35, 12, TEAL, True)

# transitions (subtle fade on every slide)
for sl in prs.slides:
    add_transition(sl)

prs.save(OUT)
print(f"Saved {OUT} with {len(prs.slides)} slides")
