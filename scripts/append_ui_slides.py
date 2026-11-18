"""
Append a PREMIUM UI showcase section to the final deck.
Uses REAL screenshots from evidence/ui/ produced by scripts/verify_ui.js.
Output overwrites CloudOps_Sentinel_INT378_Presentation_FINAL.pptx.
"""
import os, json
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PPT = os.path.join(ROOT, 'CloudOps_Sentinel_INT378_Presentation_FINAL.pptx')
UI = os.path.join(ROOT, 'evidence', 'ui')

BG   = RGBColor(0x06, 0x08, 0x10)
PANEL= RGBColor(0x11, 0x18, 0x27)
LINE = RGBColor(0x23, 0x3A, 0x5C)
WHITE= RGBColor(0xF1, 0xF5, 0xFA)
MUTED= RGBColor(0x9F, 0xB3, 0xCC)
BLUE = RGBColor(0x4F, 0x8E, 0xF7)
CYAN = RGBColor(0x22, 0xD3, 0xEE)
GREEN= RGBColor(0x34, 0xD3, 0x99)
PURPLE=RGBColor(0xA7, 0x8B, 0xFA)

prs = Presentation(PPT)
BLANK = prs.slide_layouts[6]
SW, SH = prs.slide_width, prs.slide_height


def rect(s, l, t, w, h, fill, line=None, radius=True):
    shp = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, l, t, w, h)
    shp.fill.solid(); shp.fill.fore_color.rgb = fill
    if line: shp.line.color.rgb = line; shp.line.width = Pt(1)
    else: shp.line.fill.background()
    return shp


def txt(s, value, l, t, w, h, size=14, color=WHITE, bold=False, align=PP_ALIGN.LEFT):
    tb = s.shapes.add_textbox(l, t, w, h); tf = tb.text_frame
    tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.TOP
    for i, line in enumerate(str(value).split('\n')):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.alignment = align; p.space_after = Pt(5)
        for r in p.runs:
            r.font.name = 'Segoe UI'; r.font.size = Pt(size); r.font.bold = bold
            r.font.color.rgb = color
    return tb


def head(s, title, kicker, accent=BLUE):
    f = s.background.fill; f.solid(); f.fore_color.rgb = BG
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(.16), SH)
    bar.fill.solid(); bar.fill.fore_color.rgb = accent; bar.line.fill.background()
    txt(s, kicker.upper(), Inches(.55), Inches(.28), Inches(11), Inches(.3), 11, accent, True)
    txt(s, title, Inches(.55), Inches(.55), Inches(12.2), Inches(.62), 27, WHITE, True)
    ln = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(.55), Inches(1.22), Inches(12.2), Pt(2))
    ln.fill.solid(); ln.fill.fore_color.rgb = LINE; ln.line.fill.background()


def shot(s, name, l, t, maxw, maxh, caption=None):
    p = os.path.join(UI, name)
    if not os.path.exists(p):
        txt(s, f'[missing: {name}]', l, t, maxw, Inches(.4), 12, RGBColor(248,113,113)); return
    iw, ih = Image.open(p).size
    ratio = min(maxw / iw, maxh / ih); w, h = int(iw*ratio), int(ih*ratio)
    s.shapes.add_picture(p, l + int((maxw-w)/2), t + int((maxh-h)/2), width=w, height=h)
    if caption: txt(s, caption, l, t+maxh+Inches(.03), maxw, Inches(.28), 10, MUTED, align=PP_ALIGN.CENTER)


def chip(s, value, l, t, w, color=GREEN):
    rect(s, l, t, w, Inches(.42), PANEL, color)
    txt(s, value, l, t+Inches(.07), w, Inches(.3), 11.5, color, True, PP_ALIGN.CENTER)


# ── UI 1: overview ───────────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK)
head(s, 'Premium UI — Project-Wide Redesign', 'Modern · responsive · interactive', PURPLE)
chip(s, '11 DESKTOP PAGES', Inches(.6), Inches(1.45), Inches(2.5), PURPLE)
chip(s, '4 MOBILE VIEWS', Inches(3.25), Inches(1.45), Inches(2.3), CYAN)
chip(s, '0 BROWSER ERRORS', Inches(5.7), Inches(1.45), Inches(2.3), GREEN)
chip(s, 'LOCAL-ONLY FONTS', Inches(8.15), Inches(1.45), Inches(2.4), BLUE)
shot(s, 'desktop_dashboard.png', Inches(.6), Inches(2.0), Inches(7.5), Inches(4.4),
     'Live command center — real API data, telemetry charts, ambient surfaces')
rect(s, Inches(8.4), Inches(2.0), Inches(4.35), Inches(4.4), PANEL, LINE)
txt(s, 'DESIGN SYSTEM', Inches(8.65), Inches(2.22), Inches(3.9), Inches(.3), 13, PURPLE, True)
txt(s, '• Glass surfaces & ambient gradients\n'
       '• Consistent premium typography\n'
       '• Animated page transitions\n'
       '• Staggered card reveals\n'
       '• Micro-interactions & hover lift\n'
       '• Command palette (Ctrl / ⌘ + K)\n'
       '• Collapsible + mobile-drawer nav\n'
       '• Accessible toasts & tooltips\n'
       '• Recharts: area / bar / donut\n'
       '• prefers-reduced-motion support',
     Inches(8.65), Inches(2.65), Inches(3.9), Inches(3.4), 12.5, WHITE)
note = None

# ── UI 2: desktop pages ──────────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK)
head(s, 'Every Module — Premium & Complete', 'Desktop experience', BLUE)
for name, label in [('desktop_cost.png','Cost & FinOps — animated charts, filters'),
                    ('desktop_monitoring.png','Monitoring — real telemetry + alerts')]:
    pass
shot(s, 'desktop_cost.png', Inches(.55), Inches(1.5), Inches(6.05), Inches(2.55),
     'Cost & FinOps — gradients, tabs, search, real charts')
shot(s, 'desktop_monitoring.png', Inches(6.75), Inches(1.5), Inches(6.05), Inches(2.55),
     'Monitoring — real Prometheus samples & donut')
shot(s, 'desktop_security.png', Inches(.55), Inches(4.2), Inches(6.05), Inches(2.5),
     'Security — severity donut, project selector, gate')
shot(s, 'desktop_syllabus.png', Inches(6.75), Inches(4.2), Inches(6.05), Inches(2.5),
     'Curriculum Hub — 11 experiments, rich visuals')

# ── UI 3: responsive + auth ──────────────────────────────────────────────────
s = prs.slides.add_slide(BLANK)
head(s, 'Responsive & Polished', 'Mobile drawer · authentication', CYAN)
shot(s, 'mobile_dashboard.png', Inches(.6), Inches(1.5), Inches(3.7), Inches(4.7),
     'Dashboard @390×844')
shot(s, 'mobile_drawer.png', Inches(4.45), Inches(1.5), Inches(3.7), Inches(4.7),
     'Navigation drawer with full labels')
shot(s, 'login.png', Inches(8.3), Inches(1.5), Inches(4.45), Inches(4.7),
     'Sign-in with show/hide & demo credentials')

prs.save(PPT)
print(f'Saved {PPT} with {len(prs.slides)} slides')
