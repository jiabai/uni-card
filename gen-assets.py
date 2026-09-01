# -*- coding: utf-8 -*-
"""Generate PNG assets (replacing inline SVG) for mp-weixin compatibility."""
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = str(Path(__file__).resolve().parent / "src" / "static")

def cubic(p0, p1, p2, p3, n=48):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0]
        y = u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]
        pts.append((x, y))
    return pts

# ---------------------------------------------------------------- scribble
# design viewBox 0 0 800 28 ; render at 6x then downscale to 2x
S = 6
W, H = 800 * S, 28 * S
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))

# main wavy path: M10 18 C 50 4,90 22,130 10 then S segments (reflected ctrl)
segs = []
p0 = (10, 18); c1 = (50, 4); c2 = (90, 22); p3 = (130, 10)
segs.append((p0, c1, c2, p3))
s_points = [(230, 26, 270, 12), (370, 6, 410, 20), (510, 8, 550, 18),
            (650, 24, 690, 10), (770, 14, 790, 18)]
for c2x, c2y, ex, ey in s_points:
    nc1 = (2*p3[0]-c2[0], 2*p3[1]-c2[1])
    nc2 = (c2x, c2y); np3 = (ex, ey)
    segs.append((p3, nc1, nc2, np3))
    p3, c2 = np3, nc2

poly = []
for s in segs:
    poly.extend(cubic(*s))
poly = [(x*S, y*S) for (x, y) in poly]

d = ImageDraw.Draw(img)
w_main = 2.2 * S
d.line(poly, fill=(42, 42, 42, 255), width=round(w_main), joint="curve")
# rounded caps
r = w_main / 2
for end in (poly[0], poly[-1]):
    d.ellipse([end[0]-r, end[1]-r, end[0]+r, end[1]+r], fill=(42, 42, 42, 255))

# dashed underline: M14 21 L786 22, dasharray 3 4, opacity .55
ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(ov)
a, b = (14*S, 21*S), (786*S, 22*S)
length = math.hypot(b[0]-a[0], b[1]-a[1])
ux, uy = (b[0]-a[0])/length, (b[1]-a[1])/length
dash, gap = 3*S, 4*S
w_dash = max(2, round(1.4*S))
t = 0.0
while t < length:
    t2 = min(t + dash, length)
    od.line([(a[0]+ux*t, a[1]+uy*t), (a[0]+ux*t2, a[1]+uy*t2)],
            fill=(42, 42, 42, 140), width=w_dash)
    t = t2 + gap
img = Image.alpha_composite(img, ov)

img = img.resize((1600, 56), Image.LANCZOS)
img.save(OUT + r"\ticket-scribble.png")
print("ticket-scribble.png ok")

# ---------------------------------------------------------------- barcode
# design viewBox 0 0 300 80 -> displayed stretched to 340x80 (preserveAspectRatio=none)
rects = [
    (2,3),(7,1),(11,4),(18,1.5),(22,2),(27,1),(31,3),(37,1.5),(42,2),(47,1),
    (51,4),(59,1.5),(64,2),(69,1),(73,3),(79,1.5),(84,2),(89,1),(93,4),(101,1),
    (105,3),(111,1.5),(116,2),(121,1),(125,4),(133,1.5),(138,2),(143,1),(147,3),
    (153,1.5),(158,2),(163,1),(167,4),(175,1.5),(180,2),(185,1),(189,3),(195,1.5),
    (200,2),(205,1),(209,4),(217,1),(221,3),(227,1.5),(232,2),(237,1),(241,4),
    (249,1.5),(254,2),(259,1),(263,3),(269,1.5),(274,2),(279,1),(283,4),(291,3),
]
K = 4  # supersample
disp_w, disp_h = 340, 80
bc = Image.new("RGBA", (disp_w*K, disp_h*K), (0, 0, 0, 0))
bd = ImageDraw.Draw(bc)
for x, w in rects:
    x0 = x / 300 * disp_w * K
    x1 = (x + w) / 300 * disp_w * K
    bd.rectangle([x0, 0, x1, disp_h*K], fill=(26, 26, 26, 255))
bc.save(OUT + r"\ticket-barcode.png")
print("ticket-barcode.png ok")

# ---------------------------------------------------------------- bicycle icon
# design viewBox 0 0 24 24, stroke #9e9580 width 2
S = 20
W = H = 24 * S
ic = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(ic)
col = (158, 149, 128, 255)
lw = 2 * S

def circle(cx, cy, r):
    cd.ellipse([(cx-r)*S, (cy-r)*S, (cx+r)*S, (cy+r)*S], outline=col, width=lw)

circle(5.5, 17.5, 3.5)   # rear wheel
circle(18.5, 17.5, 3.5)  # front wheel
circle(15, 5, 1)         # head

body = [(12, 17.5), (12, 14), (9, 11), (13, 8), (15, 11), (18, 11)]
body = [(x*S, y*S) for x, y in body]
cd.line(body, fill=col, width=lw, joint="curve")
rr = lw / 2
for end in (body[0], body[-1]):
    cd.ellipse([end[0]-rr, end[1]-rr, end[0]+rr, end[1]+rr], fill=col)

ic = ic.resize((112, 112), Image.LANCZOS)
ic.save(OUT + r"\glow-bicycle-icon.png")
print("glow-bicycle-icon.png ok")
