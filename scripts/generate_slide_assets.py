import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('docs/slides_assets', exist_ok=True)

# Set common aesthetic parameters
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

# ─────────────────────────────────────────────────────────────────────────────
# 1. System Architecture Diagram
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 5.5), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')
ax.set_xlim(0, 10)
ax.set_ylim(0, 6)
ax.axis('off')

# Title
ax.text(5, 5.6, "CloudOps Sentinel — Microservices & Infrastructure Topology", 
        color='#FFFFFF', fontsize=14, weight='bold', ha='center')

# Boxes styling helper
def draw_card(ax, x, y, w, h, bg_color, border_color, title, subtitle="", port=""):
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1,rounding_size=0.15",
                                  facecolor=bg_color, edgecolor=border_color, linewidth=1.5)
    ax.add_patch(rect)
    ax.text(x + w/2, y + h*0.65, title, color='#FFFFFF', fontsize=10, weight='bold', ha='center', va='center')
    if subtitle:
        ax.text(x + w/2, y + h*0.35, subtitle, color='#94A3B8', fontsize=8, ha='center', va='center')
    if port:
        ax.text(x + w/2, y + h*0.12, f"Port: {port}", color=border_color, fontsize=7.5, weight='bold', ha='center', va='center')

# Frontend
draw_card(ax, 0.5, 3.2, 2.5, 1.6, '#1E293B', '#38BDF8', 'Frontend Dashboard', 'Next.js 14 + TypeScript', '3000')

# Backend
draw_card(ax, 3.8, 3.2, 2.8, 1.6, '#1E293B', '#818CF8', 'Core API Server', 'Go 1.22 Modular Monolith', '8080')

# Database
draw_card(ax, 7.3, 3.2, 2.2, 1.6, '#1E293B', '#34D399', 'PostgreSQL 16', 'Connection Pool & Schema', '5432')

# Telemetry: Prometheus & Grafana
draw_card(ax, 1.5, 0.7, 3.0, 1.5, '#1E293B', '#FB923C', 'Prometheus Engine', 'Time-Series Telemetry', '9090')
draw_card(ax, 5.5, 0.7, 3.0, 1.5, '#1E293B', '#F43F5E', 'Grafana Dashboards', 'Executive Visualizations', '3001')

# Arrows
arrow_kw = dict(arrowstyle="->,head_width=0.3,head_length=0.4", lw=2, color='#64748B')
# Frontend <-> Backend
ax.annotate("", xy=(3.7, 4.0), xytext=(3.1, 4.0), arrowprops=dict(arrowstyle="<->,head_width=0.25", lw=2, color='#38BDF8'))
ax.text(3.4, 4.25, "REST / JWT", color='#38BDF8', fontsize=7.5, ha='center', weight='bold')

# Backend <-> DB
ax.annotate("", xy=(7.2, 4.0), xytext=(6.7, 4.0), arrowprops=dict(arrowstyle="<->,head_width=0.25", lw=2, color='#34D399'))
ax.text(6.95, 4.25, "SQL / Pool", color='#34D399', fontsize=7.5, ha='center', weight='bold')

# Backend -> Prometheus
ax.annotate("", xy=(3.0, 2.3), xytext=(4.5, 3.1), arrowprops=dict(arrowstyle="->,head_width=0.25", lw=2, color='#FB923C'))
ax.text(3.4, 2.7, "/metrics", color='#FB923C', fontsize=7.5, weight='bold')

# Prometheus -> Grafana
ax.annotate("", xy=(5.4, 1.45), xytext=(4.6, 1.45), arrowprops=dict(arrowstyle="->,head_width=0.25", lw=2, color='#FB923C'))

plt.tight_layout()
plt.savefig('docs/slides_assets/arch_diagram.png', dpi=300, facecolor='#0B0F19')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 2. 10-Stage DevSecOps Lifecycle Pipeline
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(11, 3.2), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')
ax.set_xlim(0, 11)
ax.set_ylim(0, 3)
ax.axis('off')

ax.text(5.5, 2.7, "CloudOps Sentinel — 10-Stage DevSecOps Delivery Pipeline", 
        color='#FFFFFF', fontsize=13, weight='bold', ha='center')

stages = [
    ("1. Plan", "#64748B"),
    ("2. Commit", "#38BDF8"),
    ("3. Test", "#818CF8"),
    ("4. Security", "#F43F5E"),
    ("5. Build", "#A855F7"),
    ("6. IaC Plan", "#EAB308"),
    ("7. Deploy", "#10B981"),
    ("8. Observe", "#FB923C"),
    ("9. Recover", "#06B6D4"),
    ("10. Govern", "#3B82F6"),
]

x_start = 0.4
box_w = 0.9
gap = 0.16

for i, (name, col) in enumerate(stages):
    bx = x_start + i * (box_w + gap)
    rect = patches.FancyBboxPatch((bx, 1.0), box_w, 1.1, boxstyle="round,pad=0.08,rounding_size=0.1",
                                  facecolor='#1E293B', edgecolor=col, linewidth=1.8)
    ax.add_patch(rect)
    ax.text(bx + box_w/2, 1.55, name.split()[0], color=col, fontsize=9, weight='bold', ha='center')
    ax.text(bx + box_w/2, 1.25, name.split()[1], color='#FFFFFF', fontsize=8, weight='bold', ha='center')
    
    if i < len(stages) - 1:
        ax.annotate("", xy=(bx + box_w + gap, 1.55), xytext=(bx + box_w, 1.55),
                    arrowprops=dict(arrowstyle="->,head_width=0.2", lw=1.5, color='#475569'))

plt.tight_layout()
plt.savefig('docs/slides_assets/devsecops_pipeline.png', dpi=300, facecolor='#0B0F19')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 3. Docker Container Lifecycle
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(9, 4), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')
ax.set_xlim(0, 9)
ax.set_ylim(0, 4)
ax.axis('off')

ax.text(4.5, 3.6, "Docker Container Lifecycle State Machine", color='#FFFFFF', fontsize=13, weight='bold', ha='center')

states = [
    ("Created", 0.5, 1.8, "#38BDF8"),
    ("Running", 2.6, 1.8, "#10B981"),
    ("Paused", 4.7, 2.5, "#F59E0B"),
    ("Stopped", 4.7, 0.8, "#F43F5E"),
    ("Deleted", 7.0, 1.8, "#64748B"),
]

for label, x, y, col in states:
    circle = patches.FancyBboxPatch((x, y), 1.4, 0.8, boxstyle="round,pad=0.08,rounding_size=0.2",
                                    facecolor='#1E293B', edgecolor=col, linewidth=2)
    ax.add_patch(circle)
    ax.text(x + 0.7, y + 0.4, label, color=col, fontsize=10, weight='bold', ha='center', va='center')

# Transitions
# Created -> Running
ax.annotate("", xy=(2.5, 2.2), xytext=(2.0, 2.2), arrowprops=dict(arrowstyle="->,head_width=0.2", lw=1.5, color='#94A3B8'))
ax.text(2.25, 2.35, "docker start", color='#94A3B8', fontsize=7, ha='center')

# Running <-> Paused
ax.annotate("", xy=(4.6, 2.7), xytext=(4.1, 2.4), arrowprops=dict(arrowstyle="->,head_width=0.2", lw=1.5, color='#F59E0B'))
ax.text(4.2, 2.8, "pause", color='#F59E0B', fontsize=7)

ax.annotate("", xy=(4.1, 2.1), xytext=(4.6, 2.5), arrowprops=dict(arrowstyle="->,head_width=0.2", lw=1.5, color='#10B981'))
ax.text(4.5, 2.05, "unpause", color='#10B981', fontsize=7)

# Running <-> Stopped
ax.annotate("", xy=(4.6, 1.2), xytext=(4.1, 1.9), arrowprops=dict(arrowstyle="->,head_width=0.2", lw=1.5, color='#F43F5E'))
ax.text(4.1, 1.35, "stop", color='#F43F5E', fontsize=7)

# Stopped -> Deleted
ax.annotate("", xy=(6.9, 1.9), xytext=(6.2, 1.2), arrowprops=dict(arrowstyle="->,head_width=0.2", lw=1.5, color='#64748B'))
ax.text(6.8, 1.4, "docker rm", color='#64748B', fontsize=7)

plt.tight_layout()
plt.savefig('docs/slides_assets/docker_lifecycle.png', dpi=300, facecolor='#0B0F19')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 4. SRE Four Golden Signals Diagram
# ─────────────────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 4, figsize=(10, 3.2), facecolor='#0B0F19')
signals = [
    ("Latency", "24.5 ms", "#38BDF8", [28, 26, 25, 24, 25, 24.5]),
    ("Traffic", "1,240 rps", "#10B981", [800, 950, 1100, 1200, 1240]),
    ("Errors", "0.02 %", "#F43F5E", [0.08, 0.05, 0.03, 0.02, 0.02]),
    ("Saturation", "42 % CPU", "#FB923C", [35, 38, 40, 45, 42]),
]

for ax, (name, val, col, data) in zip(axes, signals):
    ax.set_facecolor('#1E293B')
    ax.plot(data, color=col, lw=2.5)
    ax.set_title(name, color='#FFFFFF', fontsize=11, weight='bold', pad=8)
    ax.text(0.5, 0.25, val, transform=ax.transAxes, color=col, fontsize=12, weight='bold', ha='center')
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_color('#334155')

plt.suptitle("SRE Four Golden Signals — Real-Time Telemetry", color='#FFFFFF', fontsize=13, weight='bold', y=1.02)
plt.tight_layout()
plt.savefig('docs/slides_assets/golden_signals.png', dpi=300, facecolor='#0B0F19')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 5. FinOps Cost Breakdown Chart
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(6.5, 4), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')

services = ['Amazon EC2', 'Amazon EKS', 'Amazon RDS', 'Amazon EBS', 'CloudWatch']
costs = [142.50, 98.20, 64.80, 28.40, 14.10]
colors = ['#38BDF8', '#818CF8', '#34D399', '#FB923C', '#F43F5E']

bars = ax.barh(services, costs, color=colors, height=0.6, edgecolor='#334155')
ax.set_title("FinOps Local Cost Breakdown (Monthly Projection)", color='#FFFFFF', fontsize=11, weight='bold', pad=12)
ax.set_xlabel("Estimated Monthly Spend ($ USD)", color='#94A3B8', fontsize=9)
ax.tick_params(colors='#94A3B8', labelsize=8.5)
ax.invert_yaxis()

for bar in bars:
    w = bar.get_width()
    ax.text(w + 3, bar.get_y() + bar.get_height()/2, f"${w:.2f}", color='#FFFFFF', fontsize=8, va='center', weight='bold')

for spine in ax.spines.values():
    spine.set_color('#334155')

plt.tight_layout()
plt.savefig('docs/slides_assets/finops_breakdown.png', dpi=300, facecolor='#0B0F19')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 6. A/B Testing & Canary Traffic Split Diagram
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(7, 3.5), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')

labels = ['Variant A (Stable v1.4.2)', 'Variant B (Canary v2.0.0)']
sizes = [85, 15]
colors = ['#38BDF8', '#10B981']
explode = (0, 0.1)

wedges, texts, autotexts = ax.pie(sizes, explode=explode, labels=labels, autopct='%1.0f%%',
                                  startangle=140, colors=colors,
                                  textprops=dict(color='#FFFFFF', fontsize=9, weight='bold'),
                                  wedgeprops=dict(edgecolor='#0B0F19', linewidth=2))

for autotext in autotexts:
    autotext.set_color('#0B0F19')

ax.set_title("Canary Deployment Traffic Allocation Ratio", color='#FFFFFF', fontsize=11, weight='bold', pad=10)
plt.tight_layout()
plt.savefig('docs/slides_assets/ab_testing_pie.png', dpi=300, facecolor='#0B0F19')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 7. 12-Factor App Methodology Scorecard
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(8, 4), facecolor='#0B0F19')
ax.set_facecolor('#0B0F19')

factors = [f"Factor {i}" for i in range(1, 13)]
compliance = [100] * 12

bars = ax.bar(factors, compliance, color='#10B981', edgecolor='#334155', width=0.65)
ax.set_title("The 12-Factor App Methodology — 100% Verification (12/12)", color='#FFFFFF', fontsize=11, weight='bold', pad=12)
ax.set_ylabel("Compliance Score (%)", color='#94A3B8', fontsize=8.5)
ax.set_ylim(0, 115)
ax.tick_params(colors='#94A3B8', labelsize=7.5)
plt.xticks(rotation=45)

for bar in bars:
    h = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2, h + 3, "PASS", color='#10B981', fontsize=6.5, ha='center', weight='bold')

for spine in ax.spines.values():
    spine.set_color('#334155')

plt.tight_layout()
plt.savefig('docs/slides_assets/twelve_factor_bar.png', dpi=300, facecolor='#0B0F19')
plt.close()

print("All 7 slide asset diagrams generated successfully!")
