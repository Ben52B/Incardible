#!/usr/bin/env python3
"""Garage door shop drawing GD-01 Rev F - A3 landscape SVG (units = mm on paper)."""
import math

OUT = []
def a(s): OUT.append(s)

FONT = "Liberation Sans, Arial, Helvetica, sans-serif"

def text(x, y, s, size=2.2, weight="normal", anchor="start", rot=None, fill="#000", bg=False):
    t = f' transform="rotate({rot} {x:.2f} {y:.2f})"' if rot is not None else ""
    if bg:
        w = len(s) * size * 0.56
        if rot is None:
            x0 = x - (w / 2 if anchor == "middle" else (w if anchor == "end" else 0))
            a(f'<rect x="{x0-0.4:.2f}" y="{y-size*0.85:.2f}" width="{w+0.8:.2f}" height="{size*1.1:.2f}" fill="#fff"/>')
        else:
            a(f'<rect x="{x-w/2-0.4:.2f}" y="{y-size*0.85:.2f}" width="{w+0.8:.2f}" height="{size*1.1:.2f}" fill="#fff"{t}/>')
    a(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{fill}"{t}>{s}</text>')

def line(x1, y1, x2, y2, w=0.25, col="#000", dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    a(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{col}" stroke-width="{w}"{d}/>')

def rect(x, y, w, h, fill="none", stroke="#000", sw=0.25, dash=None, extra=""):
    if w < 0: x, w = x + w, -w
    if h < 0: y, h = y + h, -h
    d = f' stroke-dasharray="{dash}"' if dash else ""
    a(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}{extra}/>')

def circle(cx, cy, r, fill="none", stroke="#000", sw=0.25, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    a(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

def arrow(x, y, ang):
    """Filled arrowhead with tip at (x,y) pointing in direction ang (radians)."""
    L, W = 1.5, 0.45
    bx, by = x - L * math.cos(ang), y - L * math.sin(ang)
    px, py = -math.sin(ang) * W, math.cos(ang) * W
    a(f'<path d="M{x:.2f},{y:.2f} L{bx+px:.2f},{by+py:.2f} L{bx-px:.2f},{by-py:.2f} Z" fill="#000"/>')

def hdim(x1, x2, y, label, sub=None, ext_from=None, below=False, size=2.4, bold=True, tsub=1.9, bg=False):
    if ext_from is not None:
        for x in (x1, x2):
            e = 1.0 if ext_from > y else -1.0
            line(x, ext_from, x, y - e, 0.13)
    line(x1, y, x2, y, 0.18)
    arrow(x1, y, math.pi); arrow(x2, y, 0)
    cx = (x1 + x2) / 2
    if below:
        text(cx, y + 3.0, label, size, "bold" if bold else "normal", "middle", bg=bg)
        if sub: text(cx, y + 5.4, sub, tsub, anchor="middle", bg=bg)
    else:
        ty = y - (3.1 if sub else 0.8)
        text(cx, ty, label, size, "bold" if bold else "normal", "middle", bg=bg)
        if sub: text(cx, y - 0.8, sub, tsub, anchor="middle", bg=bg)

def vdim(y1, y2, x, label, sub=None, ext_from=None, side="left", size=2.4, tsub=1.9, horiz=False, bg=False):
    """Vertical dimension; y1 > y2 not required. Text rotated unless horiz."""
    if ext_from is not None:
        for y in (y1, y2):
            e = 1.0 if ext_from > x else -1.0
            line(ext_from, y, x - e, y, 0.13)
    line(x, y1, x, y2, 0.18)
    top, bot = min(y1, y2), max(y1, y2)
    arrow(x, top, -math.pi / 2); arrow(x, bot, math.pi / 2)
    cy = (y1 + y2) / 2
    if horiz:
        tx = x + 1.5 if side == "right" else x - 1.5
        anc = "start" if side == "right" else "end"
        if sub:
            text(tx, cy - 0.2, label, size, "bold", anc, bg=bg)
            text(tx, cy + 2.4, sub, tsub, anchor=anc, bg=bg)
        else:
            text(tx, cy + 0.9, label, size, "bold", anc, bg=bg)
    else:
        off = -0.9 if side == "left" else 2.6
        if sub:
            text(x + off - (2.3 if side == "left" else -0.0), cy, label, size, "bold", "middle", rot=-90, bg=bg)
            text(x + off + (0 if side == "left" else 2.3), cy, sub, tsub, anchor="middle", rot=-90, bg=bg)
        else:
            text(x + off, cy, label, size, "bold", "middle", rot=-90, bg=bg)

def leader(x1, y1, x2, y2, label, anchor="start", size=1.95, lines=None):
    line(x1, y1, x2, y2, 0.15)
    ang = math.atan2(y1 - y2, x1 - x2)
    arrow(x1, y1, ang)
    dx = 0.8 if anchor == "start" else -0.8
    rows = lines or [label]
    for i, r in enumerate(rows):
        text(x2 + dx, y2 + 0.7 + i * 2.4, r, size, anchor=anchor)

def breakline_v(x, y1, y2):
    m = (y1 + y2) / 2
    a(f'<path d="M{x:.2f},{y1:.2f} L{x:.2f},{m-1.6:.2f} L{x-1.0:.2f},{m-0.6:.2f} L{x+1.0:.2f},{m+0.6:.2f} L{x:.2f},{m+1.6:.2f} L{x:.2f},{y2:.2f}" fill="none" stroke="#000" stroke-width="0.2"/>')

def breakline_h(x1, x2, y):
    m = (x1 + x2) / 2
    a(f'<path d="M{x1:.2f},{y:.2f} L{m-1.6:.2f},{y:.2f} L{m-0.6:.2f},{y-1.0:.2f} L{m+0.6:.2f},{y+1.0:.2f} L{m+1.6:.2f},{y:.2f} L{x2:.2f},{y:.2f}" fill="none" stroke="#000" stroke-width="0.2"/>')

# ---------------------------------------------------------------- sheet
a('<svg xmlns="http://www.w3.org/2000/svg" width="420mm" height="297mm" viewBox="0 0 420 297">')
a(f'<style>text{{font-family:{FONT};}}</style>')
a('''<defs>
<pattern id="hatch" patternUnits="userSpaceOnUse" width="1.2" height="1.2" patternTransform="rotate(45)">
  <rect width="1.2" height="1.2" fill="#f3f3f3"/><line x1="0" y1="0" x2="0" y2="1.2" stroke="#888" stroke-width="0.14"/></pattern>
<pattern id="hatchH" patternUnits="userSpaceOnUse" width="0.8" height="0.8" patternTransform="rotate(-45)">
  <rect width="0.8" height="0.8" fill="#d9d9d9"/><line x1="0" y1="0" x2="0" y2="0.8" stroke="#555" stroke-width="0.12"/></pattern>
<pattern id="perf" patternUnits="userSpaceOnUse" width="0.75" height="0.65">
  <rect width="0.75" height="0.65" fill="#141414"/>
  <circle cx="0.19" cy="0.16" r="0.11" fill="#9a9a9a"/><circle cx="0.56" cy="0.49" r="0.11" fill="#9a9a9a"/></pattern>
<pattern id="perf11" patternUnits="userSpaceOnUse" width="9.53" height="16.506">
  <rect width="9.53" height="16.506" fill="#0d0d0d"/>
  <circle cx="0" cy="0" r="3.975" fill="#fff"/><circle cx="9.53" cy="0" r="3.975" fill="#fff"/>
  <circle cx="0" cy="16.506" r="3.975" fill="#fff"/><circle cx="9.53" cy="16.506" r="3.975" fill="#fff"/>
  <circle cx="4.765" cy="8.253" r="3.975" fill="#fff"/></pattern>
</defs>''')
rect(0, 0, 420, 297, fill="#fff", stroke="none")
rect(6, 6, 408, 285, sw=0.5)

# ================================================================ FRONT ELEVATION 1:40
S = 1 / 40
X0, Y0 = 95.0, 100.0           # door centre line, floor level
fx = lambda X: X0 + X * S
fz = lambda Z: Y0 - Z * S
text(12, 15, "FRONT ELEVATION (EXTERNAL VIEW)", 4.0, "bold")
text(12, 19.6, "SCALE 1:40", 2.3)

# wall face (front wall incl. lintel) with opening cut out
wl, wr, wt = fx(-1960), fx(1960), fz(2900)
a(f'<path d="M{wl:.2f},{wt:.2f} H{wr:.2f} V{Y0:.2f} H{fx(1660):.2f} V{fz(2410):.2f} H{fx(-1660):.2f} V{Y0:.2f} H{wl:.2f} Z" fill="url(#hatch)" stroke="#000" stroke-width="0.35"/>')
breakline_v(wl, wt, Y0); breakline_v(wr, wt, Y0)
text(X0, fz(2700), "EXISTING CONCRETE WALL / LINTEL", 1.9, anchor="middle", bg=True)
text(X0, fz(2410) - 1.0, "HEADER PANEL 70 (BY CLIENT)", 1.8, "bold", anchor="middle", bg=True)
# header panel
rect(fx(-1660), fz(2410), 3320 * S, 70 * S, fill="url(#hatchH)", sw=0.25)
# door visible through opening
for i in range(4):
    zb = i * 585
    rect(fx(-1660), fz(zb + 585), 3320 * S, 585 * S, fill="#1e1e1e", stroke="#000", sw=0.2)
    rect(fx(-1660) + 0.0, fz(zb + 585) + 0.9, 3320 * S, 585 * S - 1.8, fill="url(#perf)", stroke="#444", sw=0.15)
    line(fx(-1660), fz(zb), fx(1660), fz(zb), 0.35, "#000")
rect(fx(-1660), fz(2410), 3320 * S, 2410 * S, sw=0.4)
# hidden door edges (30 overlap behind wall)
rect(fx(-1690), fz(2340), 3380 * S, 2340 * S, stroke="#000", sw=0.22, dash="1.2,0.7")
# ground
line(wl - 4, Y0, wr + 4, Y0, 0.5)
rect(wl - 4, Y0, wr - wl + 8, 1.6, fill="url(#hatch)", stroke="none")

# dimensions - bottom
hdim(fx(-1960), fx(-1660), Y0 + 8.5, "300", ext_from=Y0 + 0.5, size=2.2)
hdim(fx(-1660), fx(1660), Y0 + 8.5, "3320", "(STRUCTURAL OPENING WIDTH)", ext_from=Y0 + 0.5)
hdim(fx(1660), fx(1960), Y0 + 8.5, "300", ext_from=Y0 + 0.5, size=2.2)
hdim(fx(-1690), fx(1690), fz(2900) - 2.5, "3380", "(DOOR WIDTH - 30 OVERLAP EACH SIDE, HIDDEN)", size=2.2)
for X in (-1690, 1690):
    line(fx(X), fz(2900) - 3.5, fx(X), fz(2340), 0.13, dash="1.2,0.7")
# dimensions - left
vdim(fz(0), fz(2340), wl - 6.5, "2340", "(CLEAR OPENING / DOOR HEIGHT)", ext_from=wl - 1)
vdim(fz(0), fz(2410), wl - 14.5, "2410", "(STRUCTURAL OPENING)", ext_from=wl - 1)
vdim(fz(2340), fz(2410), wl - 6.5, "", ext_from=wl - 1)
text(wl - 7.3, fz(2420) - 1.8, "70", 2.0, "bold", "middle")
# dimensions - right (panels)
for i in range(4):
    z1, z2 = 2340 - i * 585, 2340 - (i + 1) * 585
    vdim(fz(z2), fz(z1), wr + 6, "585", f"(PANEL {i+1})", ext_from=fx(1690), side="right", horiz=True, size=2.2, tsub=1.8)

# ================================================================ PLAN VIEW 1:40
P0y = 220.0                     # inside face of front wall
px = lambda X: X0 + X * S
py = lambda D: P0y - D * S       # D = depth into garage from inside face of front wall
text(12, 118, "PLAN VIEW (LOOKING UP TO CEILING)", 4.0, "bold")
text(12, 122.6, "SCALE 1:40   -   SERVICES OMITTED FOR CLARITY", 2.3)
DMAX = 3750
# front wall piers (300 each side) and side walls (assumed 200 thk - existing)
for sgn in (-1, 1):
    xa, xb = sorted((px(sgn * 1660), px(sgn * 2160)))
    rect(xa, py(0), xb - xa, 250 * S, fill="url(#hatch)", sw=0.35)
    xa, xb = sorted((px(sgn * 1960), px(sgn * 2160)))
    rect(xa, py(DMAX), xb - xa, DMAX * S, fill="url(#hatch)", sw=0.35)
    line(xa, py(0), xb, py(0), 0.4, "#f3f3f3")  # merge corner
breakline_h(px(-2160), px(2160), py(DMAX))
line(px(-1960), py(DMAX), px(-1960), py(0), 0.35); line(px(1960), py(DMAX), px(1960), py(0), 0.35)
text(px(-2060), py(1900), "SIDE WALL", 1.7, anchor="middle", rot=-90)
text(px(2060), py(1900), "SIDE WALL", 1.7, anchor="middle", rot=-90)
text(px(-1910), py(-140) + 0.7, "FRONT WALL", 1.6, anchor="middle", bg=False)
# door (closed)
rect(px(-1690), py(60), 3380 * S, 40 * S, fill="#111", stroke="#000", sw=0.2)
# vertical track angles + flag brackets
for sgn in (-1, 1):
    xa, xb = sorted((px(sgn * 1690), px(sgn * 1770)))
    rect(xa, py(110), xb - xa, 100 * S, fill="#9a9a9a", sw=0.2)
# horizontal tracks
for sgn in (-1, 1):
    xa, xb = sorted((px(sgn * 1715), px(sgn * 1760)))
    rect(xa, py(2900), xb - xa, (2900 - 110) * S, fill="#c8c8c8", sw=0.22)
    # rear track hangers to soffit
    for d in (1600, 2850):
        rect(min(px(sgn * 1700), px(sgn * 1840)), py(d) - 0.5, 140 * S, 1.0, fill="#000", stroke="none")
# torsion shaft & spring (front mount on wall)
line(px(-1790), py(150), px(1790), py(150), 0.45)
rect(px(-1150), py(150) - 0.75, 1000 * S, 1.5, fill="#333", stroke="#000", sw=0.15)
rect(px(150), py(150) - 0.75, 1000 * S, 1.5, fill="#333", stroke="#000", sw=0.15)
for X in (-1790, 1790, 0):
    rect(px(X) - 0.5, py(150) - 1.4, 1.0, 2.8, fill="#777", sw=0.12)
for sgn in (-1, 1):
    rect(min(px(sgn * 1700), px(sgn * 1760)), py(150) - 1.4, 60 * S, 2.8, fill="#555", sw=0.12)
# opener rail and motor
rect(px(-20), py(3200), 40 * S, (3200 - 200) * S, fill="#bdbdbd", sw=0.2)
rect(px(-170), py(3550), 340 * S, 350 * S, fill="#2b2b2b", sw=0.25)
for X in (-240, 240):
    rect(px(X) - 0.6, py(3375) - 0.6, 1.2, 1.2, fill="#000", stroke="none")
line(px(-240), py(3375), px(240), py(3375), 0.2)
# labels
leader(px(0) + 0.6, py(3400), px(450), py(3550) - 2.5, "", lines=["GRIFCO LS DRIVE OPENER"])
leader(px(0) + 0.6, py(1900), px(400), py(2050), "", lines=["OPENER RAIL"])
leader(px(-1737), py(2300), px(-1350), py(2450), "", lines=["HORIZONTAL TRACK", "(TYP. BOTH SIDES)"])
leader(px(1770), py(1600), px(1300), py(1450), "", anchor="end", lines=["TRACK HANGER FIXED", "TO SOFFIT (TYP.)"])
leader(px(-600), py(150) - 0.8, px(-1400), py(1150), "", lines=["TORSION SPRING ASSEMBLY", "(FRONT MOUNT ON WALL)"])
leader(px(1200), py(40) - 0.6, px(300), py(1150), "", lines=["SECTIONAL DOOR 3380 WIDE", "(RECESSED BEHIND WALL)"])
# dimensions
hdim(px(-1960), px(1960), py(3020), "3920", "(BETWEEN SIDE WALLS)", size=2.2, bg=True)
hdim(px(-1960), px(-1690), py(420), "270", ext_from=None, size=2.0, bg=True)
hdim(px(-1690), px(1690), py(420), "3380", "(DOOR WIDTH)", ext_from=py(60), size=2.2, bg=True)
hdim(px(1690), px(1960), py(420), "270", size=2.0, bg=True)
y_b = py(-250) + 3.6
hdim(px(-1960), px(-1660), y_b, "300", ext_from=py(-250) + 0.4, below=True, size=2.0)
hdim(px(-1660), px(1660), y_b, "3320", "(STRUCTURAL OPENING)", ext_from=py(-250) + 0.4, below=True, size=2.2)
hdim(px(1660), px(1960), y_b, "300", ext_from=py(-250) + 0.4, below=True, size=2.0)
leader(px(-1675), py(40), px(-2300), py(-350), "", anchor="end", lines=["30 OVERLAP", "(TYP.)"])
text(X0, py(-250) + 10.5, "EXTERNAL", 1.7, "bold", "middle")
text(px(-900), py(2650), "INTERNAL (GARAGE)", 1.7, "bold", "middle")
xr = px(2160)
vdim(py(0), py(2900), xr + 5, "2900", "(HORIZONTAL TRACK)", ext_from=px(1760), side="right", size=2.1, tsub=1.7)
vdim(py(0), py(3600), xr + 12, "3600", "(BACKROOM MIN.)", ext_from=xr + 0.2, side="right", size=2.1, tsub=1.7)
line(px(170), py(3550), xr + 13, py(3550), 0.13, dash="0.6,0.5")

# ================================================================ SIDE SECTION 1:25
SS = 1 / 25
SX0, SY0 = 212.0, 148.0          # inside face of front wall, floor level
sx = lambda D: SX0 + D * SS
sz = lambda Z: SY0 - Z * SS
text(186, 15, "SIDE SECTION (THROUGH OPENING)", 4.0, "bold")
text(186, 19.6, "SCALE 1:25", 2.3)
DEND = 3900
CEIL = 2900
# floor slab
line(sx(-700), SY0, sx(DEND), SY0, 0.5)
rect(sx(-700), SY0, (DEND + 700) * SS, 3.0, fill="url(#hatch)", stroke="none")
# ceiling slab (inside) and lintel (front wall above opening)
rect(sx(-250), sz(CEIL + 200), (DEND + 250) * SS, 200 * SS, fill="url(#hatch)", sw=0.35)
rect(sx(-250), sz(CEIL), 250 * SS, (CEIL - 2410) * SS, fill="url(#hatch)", sw=0.35)
breakline_v(sx(DEND), sz(CEIL + 200), sz(CEIL))
# header panel 70 (by client)
rect(sx(-250), sz(2410), 250 * SS, 70 * SS, fill="url(#hatchH)", sw=0.3)
text(sx(-250) - 0.8, sz(CEIL + 200) - 1.0, "EXTERNAL", 1.7, "bold", "end")
text(sx(1950), sz(CEIL + 200) - 1.0, "INTERNAL (GARAGE)", 1.7, "bold", "middle")
text(sx(-125), sz(2650) + 0.6, "LINTEL", 1.5, anchor="middle", rot=-90)

# --- services (existing pipes, approx.) - clipped to soffit
PIPE_R = 55
pipe_cz = CEIL - 40 - PIPE_R     # 2805 -> underside 2750
for d in (110, 1050, 2200, 3050):
    line(sx(d), sz(CEIL), sx(d), sz(pipe_cz), 0.3, "#666")
    circle(sx(d), sz(pipe_cz), PIPE_R * SS, fill="#e9e9e9", stroke="#333", sw=0.3)
    circle(sx(d), sz(pipe_cz), PIPE_R * SS * 0.78, fill="none", stroke="#999", sw=0.12)
# services zone band
rect(sx(0), sz(CEIL), DEND * SS, (CEIL - 2750) * SS, fill="none", stroke="#777", sw=0.15, dash="0.8,0.6")
line(sx(0), sz(2700), sx(DEND), sz(2700), 0.15, "#b00", dash="2,0.8")
text(sx(2560), sz(2700) - 0.6, "50 MIN. CLEARANCE LINE", 1.5, anchor="middle", fill="#b00")

# --- door closed
rect(sx(20), sz(2340), 40 * SS, 2340 * SS, fill="#151515", sw=0.2)
for i in range(1, 4):
    line(sx(20), sz(i * 585), sx(60), sz(i * 585), 0.35, "#fff")
for z in (40, 585, 1170, 1755, 2300):
    rect(sx(60), sz(z) - 0.35, 25 * SS, 0.7, fill="#666", stroke="none")
# bottom seal
rect(sx(18), sz(15), 45 * SS, 15 * SS, fill="#444", stroke="none")

# --- tracks: vertical -> R305 radius -> horizontal (track centre line)
TC_D = 85                    # vertical track centre depth
TR = 305                     # radius
TH_Z = 2610                  # horizontal track centre line height
z_tan = TH_Z - TR            # 2305
track_path = (f"M{sx(TC_D):.2f},{sz(30):.2f} L{sx(TC_D):.2f},{sz(z_tan):.2f} "
              f"A{TR*SS:.2f},{TR*SS:.2f} 0 0 1 {sx(TC_D+TR):.2f},{sz(TH_Z):.2f} L{sx(2900):.2f},{sz(TH_Z):.2f}")
a(f'<path d="{track_path}" fill="none" stroke="#000" stroke-width="{50*SS+0.3:.2f}" stroke-linejoin="round"/>')
a(f'<path d="{track_path}" fill="none" stroke="#cfcfcf" stroke-width="{50*SS-0.35:.2f}" stroke-linejoin="round"/>')
# horizontal track top line marker (2640)
# track support angle on wall (vertical) and flag bracket
rect(sx(0), sz(2560), 20 * SS, 2560 * SS - 0.2, fill="#8c8c8c", sw=0.15)
# --- torsion assembly (front mount): end bearing plate + drum + shaft
rect(sx(0), sz(2590), 230 * SS, 220 * SS, fill="#bdbdbd", sw=0.2)
circle(sx(150), sz(2480), 55 * SS, fill="#4a4a4a", stroke="#000", sw=0.25)
circle(sx(150), sz(2480), 0.35, fill="#fff", stroke="none")
# cable from drum to bottom bracket (dashed)
line(sx(150 - 55), sz(2480), sx(75), sz(60), 0.12, "#000", dash="0.8,0.5")
# --- door open position (dashed)
door_open = (f"M{sx(TC_D-25):.2f},{sz(z_tan-120):.2f} L{sx(TC_D-25):.2f},{sz(z_tan):.2f} "
             f"A{(TR+25)*SS:.2f},{(TR+25)*SS:.2f} 0 0 1 {sx(TC_D+TR):.2f},{sz(TH_Z-TR-25+TR):.2f}")
open_y_top, open_y_bot = sz(TH_Z - 30), sz(TH_Z - 70)
a(f'<path d="M{sx(TC_D+TR):.2f},{open_y_top:.2f} H{sx(TC_D+TR+2050):.2f} V{open_y_bot:.2f} H{sx(TC_D+TR):.2f}" fill="none" stroke="#000" stroke-width="0.22" stroke-dasharray="1.2,0.7"/>')
a(f'<path d="M{sx(TC_D+TR):.2f},{open_y_top:.2f} A{(TR-55)*SS:.2f},{(TR-55)*SS:.2f} 0 0 0 {sx(TC_D-30+55):.2f},{sz(z_tan):.2f} L{sx(TC_D-30+55):.2f},{sz(z_tan-260):.2f}" fill="none" stroke="#000" stroke-width="0.22" stroke-dasharray="1.2,0.7"/>')

# --- opener: rail + motor head (top of rail = 2640)
RAIL_TOP = 2640
rect(sx(260), sz(RAIL_TOP), (3200 - 260) * SS, 35 * SS, fill="#bdbdbd", sw=0.2)
rect(sx(3200), sz(RAIL_TOP), 350 * SS, 170 * SS, fill="#2b2b2b", sw=0.25)
# door arm from top panel bracket to trolley
line(sx(62), sz(2200), sx(420), sz(RAIL_TOP - 35), 0.45)
rect(sx(400), sz(RAIL_TOP - 35) - 0.2, 80 * SS, 1.4, fill="#555", stroke="none")
# front rail bracket to wall
rect(sx(0), sz(RAIL_TOP), 260 * SS, 20 * SS, fill="#8c8c8c", sw=0.15)

# --- hangers: fixed to concrete soffit only (between pipes)
def hanger(d, z_bot):
    rect(sx(d) - 0.35, sz(CEIL), 0.7, (CEIL - z_bot) * SS, fill="#777", sw=0.12)
    rect(sx(d) - 1.0, sz(CEIL), 2.0, 0.5, fill="#000", stroke="none")  # anchor plate
for d in (1600, 2850):
    hanger(d, TH_Z - 25)
for d in (3260, 3490):
    hanger(d, RAIL_TOP)

# --- leaders / callouts (in clear space)
leader(sx(2200), sz(2750), sx(2300), sz(2150), "", lines=["EXISTING SERVICE PIPES \u00D8110 (APPROX.)", "NO FIXINGS / LOADS ON PIPES"])
leader(sx(1600) - 0.4, sz(2680), sx(1700), sz(2380), "", lines=["HANGERS FIXED TO CONCRETE", "SOFFIT ONLY (M10 ANCHORS)"])
leader(sx(1000), sz(TH_Z) + 0.8, sx(650), sz(2380), "", lines=["HORIZ. TRACK", "305 RADIUS"])
leader(sx(3350), sz(2470), sx(2950), sz(2380), "", lines=["GRIFCO LS DRIVE OPENER", "& RAIL (SOFFIT HUNG)"])
leader(sx(1450), sz(TH_Z - 70) + 0.2, sx(1300), sz(1950), "", lines=["DOOR OPEN POSITION"])
leader(sx(150) + 1.2, sz(2480) + 1.2, sx(300), sz(2150), "", lines=["TORSION SPRING", "ASSY. (FRONT MOUNT)"])
leader(sx(-125), sz(2375), sx(350), sz(1800), "", lines=["HEADER PANEL 70", "(BY CLIENT - MATERIAL TBC)"])
leader(sx(60), sz(1450), sx(350), sz(1450), "", lines=["SECTIONAL DOOR (CLOSED)", "RECESSED BEHIND FRONT WALL"])
leader(sx(85) + 0.8, sz(820), sx(350), sz(800), "", lines=["VERTICAL TRACK & ANGLE", "FIXED TO WALL (BOTH SIDES)"])

# --- dimensions: right chain (heights AFL)
xd = sx(DEND) + 4.5
for z in (0, 2340, RAIL_TOP, 2750, CEIL):
    line(sx(DEND) if z in (0,) else sx(3560 if z == RAIL_TOP else DEND - 50), sz(z), xd + 1, sz(z), 0.12)
vdim(sz(0), sz(2340), xd, "2340", "CLEAR OPENING", side="right", horiz=True, size=2.2, tsub=1.7)
vdim(sz(2340), sz(RAIL_TOP), xd, "300", "HEADROOM", side="right", horiz=True, size=2.0, tsub=1.6)
vdim(sz(RAIL_TOP), sz(2750), xd, "", side="right", horiz=True)
text(xd + 1.5, sz(2695) + 0.9, "110 CLEAR", 1.7, "bold")
vdim(sz(2750), sz(CEIL), xd, "", side="right", horiz=True)
text(xd + 1.5, sz(2825) + 0.9, "150 SERVICES", 1.7, "bold")
# left dims (structural)
xl = sx(-250) - 4.0
for z in (0, 2340, 2410, CEIL):
    line(sx(-250), sz(z), xl - (7.5 if z in (0, CEIL) else 0) - 1, sz(z), 0.12)
vdim(sz(0), sz(2410), xl, "2410", "(STRUCTURAL)", size=2.1, tsub=1.6)
vdim(sz(2340), sz(2410), xl, "")
text(xl - 1.0, sz(2440) - 1.5, "70", 1.8, "bold", "middle")
vdim(sz(0), sz(CEIL), xl - 7.5, "≈2900", "CEILING - VERIFY ON SITE", size=2.1, tsub=1.6)
# horizontal dims below floor
hdim(sx(0), sx(2900), SY0 + 8.0, "2900", "(HORIZONTAL TRACK)", ext_from=SY0 + 3.2, below=False, size=2.0, tsub=1.6, bg=True)
hdim(sx(0), sx(3600), SY0 + 14.5, "3600", "(BACKROOM REQUIRED - MIN.)", ext_from=SY0 + 3.2, below=False, size=2.0, tsub=1.6, bg=True)
line(sx(3600), sz(2470), sx(3600), SY0, 0.12, dash="0.6,0.5")

# ================================================================ PERFORATION DETAIL
bx, by, bw, bh = 186, 168, 104, 70
rect(bx, by, bw, bh, sw=0.35)
text(bx + 3, by + 6, "PERFORATION DETAIL (SCALE 1:1)", 2.8, "bold")
a(f'<clipPath id="pc"><rect x="{bx+3}" y="{by+10}" width="44" height="54"/></clipPath>')
a(f'<rect x="{bx+3}" y="{by+10}" width="44" height="54" fill="url(#perf11)" clip-path="url(#pc)"/>')
rect(bx + 3, by + 10, 44, 54, sw=0.2)
tx = bx + 51
text(tx, by + 15, "PERFTECH P7995 - ROUND HOLE", 2.2, "bold")
text(tx, by + 18.2, "(60° STAGGERED)", 2.2, "bold")
for i, (k, v) in enumerate([("Hole Diameter:", "7.95 mm"), ("Pitch:", "9.53 mm"), ("Open Area:", "62% (nominal)"),
                             ("Finish:", "Black powder coat"), ("Panels:", "4 x 585 mm")]):
    text(tx, by + 25 + i * 4.0, k, 2.0)
    text(tx + 24, by + 25 + i * 4.0, v, 2.0)

# ================================================================ HEIGHT & CLEARANCE SCHEDULE
cx0, cy0, cw, ch = 296, 168, 112, 70
rect(cx0, cy0, cw, ch, sw=0.35)
text(cx0 + 3, cy0 + 6, "HEIGHT & CLEARANCE SCHEDULE", 2.8, "bold")
rows = [("Concrete soffit (ceiling)", "≈ 2900 AFL", "VERIFY ON SITE"),
        ("Underside of service pipes", "≈ 2750 AFL", "VERIFY ON SITE"),
        ("Top of track / opener rail", "2640 AFL", ""),
        ("Underside of lintel", "2410 AFL", "STRUCTURAL"),
        ("Underside of header panel", "2340 AFL", "CLEAR OPENING"),
        ("Track / opener to pipes", "110", "50 MIN."),
        ("Headroom (opening to track top)", "300", "MIN. REQUIRED"),
        ("Side room (door edge to side wall)", "270", "EACH SIDE"),
        ("Backroom (wall to rear of opener)", "3600", "MIN. REQUIRED")]
text(cx0 + 3, cy0 + 11.5, "ITEM", 1.8, "bold"); text(cx0 + 66, cy0 + 11.5, "LEVEL / DIM.", 1.8, "bold"); text(cx0 + 87, cy0 + 11.5, "REMARK", 1.8, "bold")
line(cx0 + 2, cy0 + 12.8, cx0 + cw - 2, cy0 + 12.8, 0.2)
for i, (k, v, r) in enumerate(rows):
    yy = cy0 + 17 + i * 5.7
    text(cx0 + 3, yy, k, 1.95)
    text(cx0 + 66, yy, v, 1.95, "bold")
    text(cx0 + 87, yy, r, 1.6, fill="#b00" if "VERIFY" in r else "#000")
    line(cx0 + 2, yy + 1.9, cx0 + cw - 2, yy + 1.9, 0.08, "#999")

# ================================================================ TITLE BLOCK
ty0, ty1 = 243, 289
rect(10, ty0, 400, ty1 - ty0, sw=0.35)
for xv in (112, 186, 318):
    line(xv, ty0, xv, ty1, 0.3)
# specifications
text(13, ty0 + 5, "SPECIFICATIONS", 2.6, "bold")
spec = [("Door Type:", "Sectional Garage Door (Perforated Panels)"),
        ("Structural Opening:", "3,320 W x 2,410 H mm"),
        ("Header Panel:", "70 mm (by client, material TBC)"),
        ("Clear Opening:", "3,320 W x 2,340 H mm"),
        ("Door Size:", "3,380 W x 2,340 H mm"),
        ("Overlap / Side Room:", "30 mm each side / 270 mm each side"),
        ("Panels:", "4 No. x 585 mm high"),
        ("Track:", "Standard lift, 305 mm radius"),
        ("Colour / Finish:", "Black (powder coat)")]
for i, (k, v) in enumerate(spec):
    text(13, ty0 + 9.6 + i * 4.1, k, 1.95)
    text(43, ty0 + 9.6 + i * 4.1, v, 1.95)
# motor
text(115, ty0 + 5, "MOTOR", 2.6, "bold")
mot = [("Model:", "Grifco LS Drive"), ("Location:", "Ceiling mounted, rear centre"),
       ("Support:", "Hangers to concrete soffit"), ("", "(no fixing to services)"),
       ("Clearance:", "110 mm to pipes (50 min.)"), ("Power Supply:", "GPO at ceiling (by others)"),
       ("Electrician:", "TBD (confirm with supplier)")]
for i, (k, v) in enumerate(mot):
    text(115, ty0 + 9.6 + i * 4.1, k, 1.95)
    text(137, ty0 + 9.6 + i * 4.1, v, 1.95)
# notes
text(189, ty0 + 5, "NOTES", 2.6, "bold")
notes = ["All dimensions in millimetres (mm). Do not scale - use figured dimensions.",
         "Door installed on internal face of front wall (recessed), 30 mm overlap each jamb.",
         "Header panel (70 mm) supplied & installed by client prior to door installation.",
         "Ceiling height and pipe positions are approximate - verify on site before fabrication.",
         "All hangers & opener brackets fixed to concrete soffit ONLY. No fixings to, or loads on, pipes.",
         "Maintain min. 50 mm clearance between moving parts and existing services.",
         "Check pipe drop at internal RH corner (viewed from inside) clear of track & flag bracket.",
         "Perforated panels: Perftech P7995, black powder coat, interior & exterior.",
         "Drawing for builder coordination. Final details to be confirmed by door manufacturer."]
for i, n in enumerate(notes):
    text(189, ty0 + 9.3 + i * 4.05, f"{i+1}.", 1.8)
    text(193, ty0 + 9.3 + i * 4.05, n, 1.8)
# project block
rows_tb = [("PROJECT:", "GARAGE DOOR SHOP DRAWING", True), ("ADDRESS:", "118 Glass St, Essendon VIC 3040", True),
           ("JOB No.:", "207904", False), ("DATE:", "05 NOVEMBER 2026", False),
           ("SCALE:", "AS SHOWN @ A3", False), ("REVISION:", "F - REDRAWN TO SITE OPENING", False),
           ("DRAWING No.:", "GD-01        SHEET: 1 OF 1", True)]
hrow = (ty1 - ty0) / len(rows_tb)
for i, (k, v, b) in enumerate(rows_tb):
    yy = ty0 + i * hrow
    if i: line(318, yy, 410, yy, 0.18)
    text(320, yy + hrow / 2 + 0.75, k, 1.9)
    text(343, yy + hrow / 2 + 0.75, v, 2.05, "bold" if b else "normal")
line(340, ty0, 340, ty1, 0.18)

a('</svg>')
open("drawing.svg", "w").write("\n".join(OUT))
print("ok")
