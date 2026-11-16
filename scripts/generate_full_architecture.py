import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs('docs/slides_assets', exist_ok=True)

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

fig, ax = plt.subplots(figsize=(14, 7.6), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')
ax.set_xlim(0, 14)
ax.set_ylim(0, 8.2)
ax.axis('off')

# Header Title
ax.text(7.0, 7.85, "CloudOps Sentinel — Complete End-to-End System Architecture", 
        color='#FFFFFF', fontsize=15, weight='bold', ha='center', va='center')
ax.text(7.0, 7.55, "Integrated Control Plane, Micro-Engines, Telemetry Pipeline & Multi-Cloud Infrastructure", 
        color='#94A3B8', fontsize=10, ha='center', va='center')

# Helper for drawing container boundaries
def draw_layer_box(ax, x, y, w, h, title, bg_col="#131B2E", border_col="#1E293B"):
    box = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.12",
                                facecolor=bg_col, edgecolor=border_col, linewidth=1.2)
    ax.add_patch(box)
    ax.text(x + 0.18, y + h - 0.22, title.upper(), color=border_col, fontsize=8, weight='bold', va='center')

# Helper for component cards
def draw_card(ax, x, y, w, h, title, subtitle="", tech="", port="", bg_col="#1E293B", border_col="#38BDF8"):
    card = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06,rounding_size=0.1",
                                  facecolor=bg_col, edgecolor=border_col, linewidth=1.2)
    ax.add_patch(card)
    ax.text(x + w/2, y + h*0.72, title, color='#FFFFFF', fontsize=9, weight='bold', ha='center', va='center')
    if subtitle:
        ax.text(x + w/2, y + h*0.48, subtitle, color='#94A3B8', fontsize=7.5, ha='center', va='center')
    if tech:
        ax.text(x + w/2, y + h*0.26, tech, color='#CBD5E1', fontsize=7, ha='center', va='center')
    if port:
        ax.text(x + w/2, y + h*0.1, f"Port: {port}", color=border_col, fontsize=6.8, weight='bold', ha='center', va='center')

# ─────────────────────────────────────────────────────────────────────────────
# LAYER 1: CLIENT & USER INTERFACE LAYER (Top)
# ─────────────────────────────────────────────────────────────────────────────
draw_layer_box(ax, 0.5, 5.75, 13.0, 1.6, "Layer 1: Presentation & Client Interface", bg_col="#0F172A", border_col="#38BDF8")

# User Personas
draw_card(ax, 0.8, 5.95, 2.8, 1.15, "DevOps / SRE / Admin Personas", "RBAC Role-Based Access", "Web Browser (Chrome/Firefox)", "", bg_col="#1E293B", border_col="#818CF8")

# Frontend Dashboard
draw_card(ax, 4.2, 5.95, 8.8, 1.15, "CloudOps Sentinel Dashboard UI", 
          "Next.js 14 • React 18 • TypeScript • Tailwind Dark Theme • Recharts Visualizations", 
          "Routes: /projects, /infrastructure, /deployments, /pipelines, /security, /monitoring, /cost, /governance, /syllabus", 
          "3000", bg_col="#1E293B", border_col="#38BDF8")

# ─────────────────────────────────────────────────────────────────────────────
# LAYER 2: CONTROL PLANE & CORE APPLICATION ENGINE (Middle)
# ─────────────────────────────────────────────────────────────────────────────
draw_layer_box(ax, 0.5, 2.7, 13.0, 2.8, "Layer 2: Go 1.22 REST API Server & Modular Micro-Engines (Port 8080)", bg_col="#0F172A", border_col="#818CF8")

# Middleware Strip
mid_box = patches.FancyBboxPatch((0.8, 4.8), 12.4, 0.45, boxstyle="round,pad=0.04,rounding_size=0.08",
                                facecolor='#1E293B', edgecolor='#475569', linewidth=1.0)
ax.add_patch(mid_box)
ax.text(7.0, 5.02, "Global Middleware: Gorilla Mux Router  |  CORS Preflight  |  JWT Bearer Auth & RBAC  |  Prometheus Metrics Collector", 
        color='#CBD5E1', fontsize=8, weight='bold', ha='center', va='center')

# Micro-Engines Grid (10 Modules)
# Row 1 (5 modules)
row1_mods = [
    ("Auth & Identity", "JWT HMAC-SHA256", "Bcrypt Hashing", "#38BDF8"),
    ("Projects & Envs", "Multi-Tenant Workspaces", "Dev / Staging / Prod", "#38BDF8"),
    ("IaC Engine", "Terraform & CloudFormation", "Plan & Apply Runner", "#EAB308"),
    ("Deployments", "Rolling Zero-Downtime", "Instant Rollback Engine", "#10B981"),
    ("Pipeline Manager", "Jenkins CI/CD Automation", "13-Stage Declarative", "#A855F7"),
]
for idx, (t, s, tc, col) in enumerate(row1_mods):
    bx = 0.8 + idx * 2.52
    draw_card(ax, bx, 3.85, 2.35, 0.82, t, s, tc, "", bg_col="#1E293B", border_col=col)

# Row 2 (5 modules)
row2_mods = [
    ("DevSecOps Gate", "Aqua Trivy CVE Scans", "Blocking Quality Gates", "#F43F5E"),
    ("Monitoring & SRE", "Four Golden Signals", "Prometheus Client (/metrics)", "#FB923C"),
    ("FinOps Billing", "In-Cluster Cost Modeling", "Rightsizing & Budgets", "#10B981"),
    ("Governance Engine", "Policy-as-Code & OPA", "Immutable Audit Logs", "#06B6D4"),
    ("Cloud SDK v2", "AWS S3 & CloudWatch", "Zero-Cost Local Fallback", "#818CF8"),
]
for idx, (t, s, tc, col) in enumerate(row2_mods):
    bx = 0.8 + idx * 2.52
    draw_card(ax, bx, 2.85, 2.35, 0.82, t, s, tc, "", bg_col="#1E293B", border_col=col)

# ─────────────────────────────────────────────────────────────────────────────
# LAYER 3: PERSISTENCE, RUNTIME & EXTERNAL TARGETS (Bottom)
# ─────────────────────────────────────────────────────────────────────────────
draw_layer_box(ax, 0.5, 0.35, 13.0, 2.1, "Layer 3: Data Persistence, Orchestration, Telemetry & Multi-Cloud Targets", bg_col="#0F172A", border_col="#10B981")

# 1. PostgreSQL Database
draw_card(ax, 0.8, 0.55, 2.2, 1.55, "PostgreSQL 16 Alpine", "Relational Data Store", "Users, Stacks, Deploys,\nScans, Debt, Audit Logs", "5432", bg_col="#1E293B", border_col="#34D399")

# 2. CI/CD & Delivery Engine
draw_card(ax, 3.2, 0.55, 2.3, 1.55, "CI/CD & Security Tools", "Jenkins Declarative Runner", "Aqua Trivy Vulnerability Scanner\nMulti-Stage Docker Builds", "8080", bg_col="#1E293B", border_col="#A855F7")

# 3. Kubernetes & Docker Runtime
draw_card(ax, 5.7, 0.55, 2.6, 1.55, "Kubernetes & Containers", "Cluster Runtime & HPA", "Auto-scaling (2-5 Replicas)\nZero-Trust NetworkPolicy", "K8s API", bg_col="#1E293B", border_col="#10B981")

# 4. Observability Stack: Prometheus & Grafana
draw_card(ax, 8.5, 0.55, 2.5, 1.55, "Observability Stack", "Prometheus & Grafana OSS", "Scrapes /metrics every 15s\nExecutive SRE Dashboards", "9090 / 3001", bg_col="#1E293B", border_col="#FB923C")

# 5. Cloud Providers & Free-Tier Guardrail
draw_card(ax, 11.2, 0.55, 2.0, 1.55, "Cloud Providers", "AWS SDK v2 / LocalStack", "S3 Storage • CloudWatch\n$0.00 Cost Guardrails", "Offline", bg_col="#1E293B", border_col="#818CF8")

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS & COMMUNICATION WORKFLOWS
# ─────────────────────────────────────────────────────────────────────────────
# User -> Frontend
ax.annotate("", xy=(4.1, 6.5), xytext=(3.6, 6.5), 
            arrowprops=dict(arrowstyle="->,head_width=0.25,head_length=0.35", lw=1.8, color='#38BDF8'))
ax.text(3.85, 6.65, "HTTPS", color='#38BDF8', fontsize=7, ha='center', weight='bold')

# Frontend -> API Gateway
ax.annotate("", xy=(7.0, 5.3), xytext=(7.0, 5.9), 
            arrowprops=dict(arrowstyle="->,head_width=0.25,head_length=0.35", lw=2.0, color='#38BDF8'))
ax.text(7.0, 5.55, "REST API (Axios Bearer JWT)", color='#38BDF8', fontsize=7.5, ha='center', weight='bold')

# API -> DB
ax.annotate("", xy=(1.9, 2.15), xytext=(1.9, 2.8), 
            arrowprops=dict(arrowstyle="<->,head_width=0.25", lw=1.8, color='#34D399'))
ax.text(1.9, 2.45, "pgx Pool (TCP 5432)", color='#34D399', fontsize=7, ha='center', weight='bold')

# API -> CI/CD
ax.annotate("", xy=(4.35, 2.15), xytext=(4.35, 2.8), 
            arrowprops=dict(arrowstyle="->,head_width=0.25", lw=1.8, color='#A855F7'))
ax.text(4.35, 2.45, "Triggers & Scans", color='#A855F7', fontsize=7, ha='center', weight='bold')

# API -> Kubernetes
ax.annotate("", xy=(7.0, 2.15), xytext=(7.0, 2.8), 
            arrowprops=dict(arrowstyle="->,head_width=0.25", lw=1.8, color='#10B981'))
ax.text(7.0, 2.45, "Rollout / Rollback", color='#10B981', fontsize=7, ha='center', weight='bold')

# Prometheus -> API (Scrapes)
ax.annotate("", xy=(8.7, 2.8), xytext=(8.7, 2.15), 
            arrowprops=dict(arrowstyle="->,head_width=0.25", lw=1.8, color='#FB923C'))
ax.text(9.25, 2.45, "Scrapes /metrics", color='#FB923C', fontsize=7, ha='center', weight='bold')

# API -> Cloud
ax.annotate("", xy=(12.2, 2.15), xytext=(12.2, 2.8), 
            arrowprops=dict(arrowstyle="<->,head_width=0.25", lw=1.8, color='#818CF8'))
ax.text(12.2, 2.45, "SDK v2 Telemetry", color='#818CF8', fontsize=7, ha='center', weight='bold')

plt.tight_layout()
plt.savefig('docs/slides_assets/full_architecture_diagram.png', dpi=300, facecolor='#0B0F19')
plt.close()

print("Complete Master Architecture Diagram generated successfully!")
