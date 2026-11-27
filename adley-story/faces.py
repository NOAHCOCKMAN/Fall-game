#!/usr/bin/env python3
"""Cut every cast member's face out of photos/ into faces/<key>.png + faces/meta.json.

Each entry: photo, the width the box was measured at (boxes scale to the real photo size),
face box (left, top, width, height: brow to chin), crop margins, and where the mouth and eyes
sit inside the box (fractions), used for talking jaws and heart eyes.
"""
import json, os
from PIL import Image, ImageOps
import make_faces as mf

R = os.path.dirname(os.path.abspath(__file__))
# key: (photo, measured_width, box, crop(side, top, bottom, head_top), extras)
FACES = {
    'adley': ('adley.jpg', 1500, (478, 835, 430, 330), (.95, 1.35, .22, 1.6), dict(my=.62, ey=.06, ex=.22)),
    'lilah': ('lilah.jpg', 1500, (392, 632, 448, 448), (.74, .85, .16, 1.3), dict(my=.79, ey=.2, ex=.2)),
    'noah':  ('noah.jpg', 1500, (527, 575, 312, 288), (.76, 1.0, .18, 1.36), dict(my=.58, ey=.12, ex=.2)),
}
# rectangular photo props (no oval mask): key: (photo, measured_width, crop box)
PROPS = {'primp': ('primp.jpg', 1500, (640, 430, 720, 1000)), 'sandwich1': ('sandwich1.jpg', 1500, (300, 470, 900, 1100)), 'sandwich2': ('sandwich2.jpg', 1500, (150, 520, 1050, 800))}


def fix_redeye(img, pts, s):
    px = img.load()
    for ex, ey in pts:
        cx, cy, r = int(ex * s), int(ey * s), int(22 * s)
        for y in range(cy - r, cy + r):
            for x in range(cx - r, cx + r):
                if (x - cx) ** 2 + (y - cy) ** 2 > r * r: continue
                R_, G, B = px[x, y]
                if R_ > 90 and R_ > 1.5 * G and R_ > 1.3 * B:
                    v = int((G + B) / 2 * .6); px[x, y] = (v + 8, v + 6, v + 6)


def main(only=None):
    os.makedirs(os.path.join(R, 'faces'), exist_ok=True)
    meta = {}
    for key, (photo, ref, box, crop, ex) in FACES.items():
        img = mf.load(os.path.join(R, 'photos', photo))
        s = img.size[0] / ref if ref else 1
        if ex.get('redeye'): fix_redeye(img, ex['redeye'], s)
        if ex.get('tint'):
            g = ImageOps.autocontrast(img.convert('L'), cutoff=1)
            img = ImageOps.colorize(g, black='#2e1d16', mid='#c48d72', white='#fff1e6', midpoint=120)
        b = tuple(int(v * s) for v in box)
        mf.CROP[key] = dict(side=crop[0], top=crop[1], bottom=crop[2], head_top=crop[3])
        cut, m = mf.cutout(img, b, key)
        cut.save(os.path.join(R, 'faces', key + '.png'), optimize=True)
        bw, bh = b[2], b[3]
        m.update(mouth=ex['my'] - .5, eyeY=ex['ey'] - .5, eyeDX=ex['ex'] * bw / bh)
        m['source'] = photo
        meta[key] = m
    for key, (photo, ref, box) in PROPS.items():
        img = mf.load(os.path.join(R, 'photos', photo)); s = img.size[0] / ref; b = tuple(int(v * s) for v in box)
        im = img.crop((b[0], b[1], b[0] + b[2], b[1] + b[3])).resize((640, int(640 * b[3] / b[2])))
        im.save(os.path.join(R, 'faces', key + '.png'), optimize=True); meta[key] = dict(w=im.width, h=im.height, prop=True, fcx=.5, fcy=.5, fh=1, headTop=-.5, mouth=0, eyeY=0, eyeDX=0, skin='#000')
    json.dump(meta, open(os.path.join(R, 'faces/meta.json'), 'w'), indent=1)
    print('faces:', ', '.join(meta))


if __name__ == '__main__':
    main()
