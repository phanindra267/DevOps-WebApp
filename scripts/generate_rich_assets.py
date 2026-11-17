import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('docs/slides_assets', exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Slide Background: Title Slide (Full 16:9 300 DPI)
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(13.333, 7.5), facecolor='#070B14')
ax.set_facecolor('#070B14')
ax.set_xlim(0, 13.333)
ax.set_ylim(0, 7.5)
ax.axis('off')

# Cyber grid background
grid_x = np.linspace(0, 13.333, 28)
grid_y = np.linspace(0, 7.5, 16)
for gx in grid_x:
    ax.axvline(gx, color='#1E293B', lw=0.5, alpha=0.35)
for gy in grid_y:
    ax.axhline(gy, color='#1E293B', lw=0.5, alpha=0.35)

# Radial Glowing Orbs
circle1 = patches.Circle((10.5, 5.0), 3.2, facecolor='#4F46E5', alpha=0.14, edgecolor='none')
circle2 = patches.Circle((2.5, 2.0), 2.8, facecolor='#06B6D4', alpha=0.10, edgecolor='none')
circle3 = patches.Circle((11.8, 1.5), 2.2, facecolor='#10B981', alpha=0.08, edgecolor='none')
ax.add_patch(circle1)
ax.add_patch(circle2)
ax.add_patch(circle3)

# Isometric decorative cubes / server nodes on the right
def draw_iso_cube(ax, x, y, size=0.4, color='#38BDF8', alpha=0.7):
    # Top face
    top = patches.Polygon([[x, y + size], [x + size*0.866, y + size*0.5], 
                           [x, y], [x - size*0.866, y + size*0.5]],
                          closed=True, facecolor=color, alpha=alpha, edgecolor='#60A5FA', lw=0.8)
    ax.add_patch(top)

for i in range(5):
    draw_iso_cube(ax, 11.0 + (i%2)*0.8, 2.0 + i*0.9, size=0.35, color='#6366F1' if i%2==0 else '#06B6D4', alpha=0.6)

# Connecting circuit lines
ax.plot([10.5, 11.2, 11.8, 12.5], [6.2, 5.5, 5.5, 4.8], color='#38BDF8', lw=1.2, alpha=0.5, linestyle='--')
ax.plot([9.5, 10.2, 11.0], [2.2, 2.2, 3.0], color='#10B981', lw=1.2, alpha=0.5)

plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
plt.savefig('docs/slides_assets/slide_bg_title.png', dpi=300, facecolor='#070B14')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 2. Slide Background: Content Slides (Full 16:9 300 DPI)
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(13.333, 7.5), facecolor='#090D18')
ax.set_facecolor('#090D18')
ax.set_xlim(0, 13.333)
ax.set_ylim(0, 7.5)
ax.axis('off')

# Subtle grid
for gx in np.linspace(0, 13.333, 28):
    ax.axvline(gx, color='#172033', lw=0.4, alpha=0.25)
for gy in np.linspace(0, 7.5, 16):
    ax.axhline(gy, color='#172033', lw=0.4, alpha=0.25)

# Ambient soft glow in top right & bottom left
ax.add_patch(patches.Circle((12.5, 6.8), 2.5, facecolor='#6366F1', alpha=0.08, edgecolor='none'))
ax.add_patch(patches.Circle((0.8, 0.8), 2.5, facecolor='#06B6D4', alpha=0.06, edgecolor='none'))

# Sleek header horizontal accent glow line
ax.plot([0.8, 12.5], [6.05, 6.05], color='#1E293B', lw=1.0, alpha=0.6)
ax.plot([0.8, 2.8], [6.05, 6.05], color='#38BDF8', lw=2.0, alpha=0.8)

# Subtle corner watermark node
ax.plot([12.2, 12.6, 12.9], [0.6, 0.6, 1.0], color='#334155', lw=1.0, alpha=0.4)

plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
plt.savefig('docs/slides_assets/slide_bg_content.png', dpi=300, facecolor='#090D18')
plt.close()

# ─────────────────────────────────────────────────────────────────────────────
# 3. Side Graphics: Cloud Security & SRE Waveform (Side Visual)
# ─────────────────────────────────────────────────────────────────────────────
fig, ax = plt.subplots(figsize=(3.2, 6.5), facecolor='#0F172A')
ax.set_facecolor('#0F172A')
ax.set_xlim(0, 3.2)
ax.set_ylim(0, 6.5)
ax.axis('off')

# Gradient border
rect = patches.FancyBboxPatch((0.1, 0.1), 3.0, 6.3, boxstyle="round,pad=0.05,rounding_size=0.15",
                              facecolor='#131D31', edgecolor='#38BDF8', linewidth=1.5, alpha=0.9)
ax.add_patch(rect)

# Title badge
ax.text(1.6, 5.9, "CLOUDOPS ENGINE", color='#38BDF8', fontsize=9, weight='bold', ha='center')
ax.text(1.6, 5.65, "Zero-Trust Architecture", color='#94A3B8', fontsize=7.5, ha='center')

# Visual Waveform
x_wave = np.linspace(0.4, 2.8, 100)
y_wave = 4.8 + 0.25 * np.sin(x_wave * 6) * np.cos(x_wave * 2)
ax.plot(x_wave, y_wave, color='#10B981', lw=2.0)
ax.text(1.6, 5.15, "TELEMETRY METRICS (P99)", color='#10B981', fontsize=7, weight='bold', ha='center')

# Micro Nodes
nodes = [
    ("K8s Ingress", "Default-Deny", "#38BDF8", 3.8),
    ("Trivy Scanner", "0 Critical CVEs", "#F43F5E", 2.8),
    ("IaC Engine", "Terraform & CFN", "#F59E0B", 1.8),
    ("FinOps Billing", "$0.00 Local Spend", "#10B981", 0.8),
]

for label, sub, col, y_pos in nodes:
    card = patches.FancyBboxPatch((0.3, y_pos), 2.6, 0.75, boxstyle="round,pad=0.04,rounding_size=0.08",
                                  facecolor='#1E293B', edgecolor=col, linewidth=1.0)
    ax.add_patch(card)
    ax.text(0.5, y_pos + 0.45, label, color='#FFFFFF', fontsize=7.5, weight='bold')
    ax.text(0.5, y_pos + 0.2, sub, color=col, fontsize=6.8, weight='bold')

plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
plt.savefig('docs/slides_assets/side_banner_devops.png', dpi=300, facecolor='#0F172A')
plt.close()

print("Background & Side visual assets generated successfully!")
