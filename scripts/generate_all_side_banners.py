import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

os.makedirs('docs/slides_assets', exist_ok=True)
os.makedirs('frontend/public', exist_ok=True)

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

def create_side_banner(filename, title, subtitle, header_color, nodes, icon_type="shield"):
    fig, ax = plt.subplots(figsize=(3.2, 6.5), facecolor='#0B0F19')
    ax.set_facecolor('#0B0F19')
    ax.set_xlim(0, 3.2)
    ax.set_ylim(0, 6.5)
    ax.axis('off')

    # Background frame with subtle gradient effect
    frame = patches.FancyBboxPatch((0.1, 0.1), 3.0, 6.3, boxstyle="round,pad=0.06,rounding_size=0.18",
                                   facecolor='#111827', edgecolor=header_color, linewidth=1.6, alpha=0.95)
    ax.add_patch(frame)

    # Ambient glow orb in top
    ax.add_patch(patches.Circle((1.6, 5.8), 1.2, facecolor=header_color, alpha=0.12, edgecolor='none'))

    # Title & Subtitle
    ax.text(1.6, 5.95, title.upper(), color=header_color, fontsize=9.5, weight='bold', ha='center')
    ax.text(1.6, 5.70, subtitle, color='#94A3B8', fontsize=7.5, ha='center')

    # Visual Accent Graphic / Icon per type
    if icon_type == "shield":
        # Draw decorative shield
        shield = patches.Polygon([[1.6, 5.45], [2.1, 5.25], [2.1, 4.85], [1.6, 4.55], [1.1, 4.85], [1.1, 5.25]],
                                 closed=True, facecolor=header_color, alpha=0.25, edgecolor=header_color, lw=1.5)
        ax.add_patch(shield)
        ax.text(1.6, 4.95, "PROTECTED", color='#FFFFFF', fontsize=6.5, weight='bold', ha='center')
    elif icon_type == "iac":
        # Draw declarative blocks
        for idx, (bx, by, col) in enumerate([(1.2, 5.1, '#38BDF8'), (1.8, 5.1, '#6366F1'), (1.5, 4.65, '#10B981')]):
            b = patches.FancyBboxPatch((bx-0.25, by-0.18), 0.5, 0.36, boxstyle="round,pad=0.02,rounding_size=0.06",
                                       facecolor='#1E293B', edgecolor=col, lw=1.2)
            ax.add_patch(b)
        ax.plot([1.2, 1.5], [4.92, 4.83], color='#94A3B8', lw=1.2, linestyle=':')
        ax.plot([1.8, 1.5], [4.92, 4.83], color='#94A3B8', lw=1.2, linestyle=':')
    elif icon_type == "finops":
        # Draw circular cost gauge
        wedge = patches.Wedge((1.6, 5.0), 0.45, 0, 270, width=0.18, facecolor=header_color, alpha=0.85, edgecolor='none')
        ax.add_patch(wedge)
        wedge2 = patches.Wedge((1.6, 5.0), 0.45, 270, 360, width=0.18, facecolor='#F59E0B', alpha=0.6, edgecolor='none')
        ax.add_patch(wedge2)
        ax.text(1.6, 4.93, "$0.00", color='#FFFFFF', fontsize=7.5, weight='bold', ha='center')
    elif icon_type == "verify":
        # Verified gold star circle
        star_circle = patches.Circle((1.6, 5.0), 0.45, facecolor='#10B981', alpha=0.2, edgecolor='#10B981', lw=1.5)
        ax.add_patch(star_circle)
        ax.text(1.6, 4.92, "✓ 100%", color='#10B981', fontsize=9, weight='bold', ha='center')
    elif icon_type == "cloud":
        # Dual cloud icons
        c1 = patches.Circle((1.35, 5.05), 0.3, facecolor='#38BDF8', alpha=0.25, edgecolor='#38BDF8', lw=1.2)
        c2 = patches.Circle((1.85, 5.05), 0.3, facecolor='#F59E0B', alpha=0.25, edgecolor='#F59E0B', lw=1.2)
        ax.add_patch(c1)
        ax.add_patch(c2)
        ax.text(1.6, 4.95, "MULTI-CLOUD", color='#FFFFFF', fontsize=6.5, weight='bold', ha='center')
    else:
        # Default telemetry pulse wave
        x_w = np.linspace(0.4, 2.8, 80)
        y_w = 5.0 + 0.22 * np.sin(x_w * 7)
        ax.plot(x_w, y_w, color=header_color, lw=1.8)

    # Separator line
    ax.plot([0.3, 2.9], [4.35, 4.35], color='#1E293B', lw=1.0)

    # Micro node cards
    for idx, (label, sub, col, y_pos) in enumerate(nodes):
        c = patches.FancyBboxPatch((0.26, y_pos), 2.68, 0.72, boxstyle="round,pad=0.04,rounding_size=0.08",
                                   facecolor='#1E293B', edgecolor=col, linewidth=1.0)
        ax.add_patch(c)
        # Small accent indicator dot
        ax.add_patch(patches.Circle((0.48, y_pos + 0.48), 0.06, facecolor=col, edgecolor='none'))
        ax.text(0.64, y_pos + 0.44, label, color='#FFFFFF', fontsize=7.5, weight='bold')
        ax.text(0.64, y_pos + 0.18, sub, color=col, fontsize=6.8, weight='bold')

    # Footer signature
    ax.text(1.6, 0.28, "CLOUDOPS SENTINEL | INT 378", color='#475569', fontsize=6.5, ha='center', weight='bold')

    plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
    plt.savefig(f'docs/slides_assets/{filename}', dpi=300, facecolor='#0B0F19')
    plt.savefig(f'frontend/public/{filename}', dpi=300, facecolor='#0B0F19')
    plt.close()
    print(f"Generated {filename}")

# 1. Executive Summary Side Banner
create_side_banner(
    "side_banner_summary.png",
    "Mission Control",
    "Full-Lifecycle Platform",
    "#38BDF8",
    [
        ("Syllabus Parity", "100% Units I-VI", "#38BDF8", 3.4),
        ("Cost Guarantee", "$0.00 Cloud Spend", "#10B981", 2.5),
        ("Security Gate", "0 Critical CVEs Allowed", "#F43F5E", 1.6),
        ("App Standard", "12/12 Factors Verified", "#F59E0B", 0.7),
    ],
    icon_type="verify"
)

# 2. Cloud Parity Side Banner (Unit I)
create_side_banner(
    "side_banner_cloud_compare.png",
    "Cloud & Containers",
    "AWS vs Azure & Docker",
    "#818CF8",
    [
        ("Compute Parity", "EC2 & ECS vs Azure VM", "#38BDF8", 3.4),
        ("Docker Lifecycle", "5-State Engine Cycle", "#818CF8", 2.5),
        ("Resilience Pattern", "Netflix Chaos Engineering", "#10B981", 1.6),
        ("DOMA Architecture", "Uber Distributed Tracing", "#F59E0B", 0.7),
    ],
    icon_type="cloud"
)

# 3. IaC Side Banner (Unit II)
create_side_banner(
    "side_banner_iac.png",
    "IaC Automation",
    "Declarative Multi-Cloud",
    "#38BDF8",
    [
        ("HashiCorp Terraform", "HCL & Modular State", "#38BDF8", 3.4),
        ("AWS CloudFormation", "Native Managed Engine", "#F59E0B", 2.5),
        ("Future IaC Tools", "OpenTofu, Pulumi, K8s", "#818CF8", 1.6),
        ("Policy-as-Code", "OPA / Rego Guardrails", "#10B981", 0.7),
    ],
    icon_type="iac"
)

# 4. Security Side Banner (Unit V)
create_side_banner(
    "side_banner_security.png",
    "DevSecOps Defense",
    "Shift-Left Quality Gates",
    "#F43F5E",
    [
        ("Trivy CVE Scanner", "Automated Image Audit", "#F43F5E", 3.4),
        ("Zero-Trust Perimeter", "Default-Deny Ingress", "#38BDF8", 2.5),
        ("IAM & Secrets", "JWT, Bcrypt & K8s Secret", "#10B981", 1.6),
        ("Supply Chain SLSA", "Levels 1-4 & SBOM Sign", "#F59E0B", 0.7),
    ],
    icon_type="shield"
)

# 5. FinOps Side Banner (Unit VI)
create_side_banner(
    "side_banner_finops.png",
    "FinOps Governance",
    "Cost & Policy Optimization",
    "#10B981",
    [
        ("FinOps Lifecycle", "Inform -> Optimize -> Operate", "#38BDF8", 3.4),
        ("Workload Costing", "EC2, EKS, RDS In-Cluster", "#10B981", 2.5),
        ("Rightsizing Engine", "Up to 35% Cost Savings", "#F59E0B", 1.6),
        ("Policy Compliance", "Mandatory Tags & Encrypt", "#818CF8", 0.7),
    ],
    icon_type="finops"
)

# 6. Verification Side Banner (Slide 12)
create_side_banner(
    "side_banner_verification.png",
    "Defense Readiness",
    "Empirical Verification",
    "#10B981",
    [
        ("Backend Go Tests", "100% Pass (All Modules)", "#10B981", 3.4),
        ("Frontend Next.js", "15/15 Routes (0 Errors)", "#38BDF8", 2.5),
        ("Zero-Cost Verified", "$0.00 Spend Enforced", "#F59E0B", 1.6),
        ("Candidate Details", "Reg: 12418953 (LPU)", "#818CF8", 0.7),
    ],
    icon_type="verify"
)

# 7. Defense Summary Side Banner (Slide 13)
create_side_banner(
    "side_banner_conclusion.png",
    "Capstone Defense",
    "INT 378 Evaluation",
    "#818CF8",
    [
        ("Units I through VI", "100% Syllabus Coverage", "#38BDF8", 3.4),
        ("Full-Stack Control", "Go + Next.js + K8s + Prom", "#10B981", 2.5),
        ("Future Roadmap", "eBPF Tracing & LLM Heals", "#F59E0B", 1.6),
        ("Defense Ready", "Kakumani Phaneendra", "#818CF8", 0.7),
    ],
    icon_type="verify"
)

print("All side banners generated successfully!")
