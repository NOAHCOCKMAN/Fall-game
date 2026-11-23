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
    'elijah_baby': ('elijah_baby.jpg', 1179, (240, 345, 720, 560), (.66, .55, .08, 1.05), dict(my=.66, ey=.12, ex=.22)),
    'elijah_kid':  ('elijah_sisters.jpg', 1030, (690, 420, 255, 190), (.72, 1.1, .16, 1.5), dict(my=.70, ey=.10, ex=.2)),
    'elijah':      ('emma_elijah.jpg', None, (308, 405, 312, 258), (.74, 1.02, .16, 1.37), dict(my=.59, ey=.08, ex=.2)),
    'elijah_trex': ('elijah_trex.jpg', 542, (213, 198, 155, 136), (.8, 1.0, .18, 1.36), dict(my=.68, ey=.10, ex=.2)),
    'elijah_sleep': ('elijah_sleep.jpg', 1179, (318, 330, 250, 230), (.8, .7, .25, 1.1), dict(my=.78, ey=.42, ex=.18)),
    'luke':        ('parents.jpg', 1179, (662, 292, 280, 195), (.72, .85, .12, 1.3), dict(my=.64, ey=.12, ex=.22)),
    'stephanie':   ('parents.jpg', 1179, (190, 448, 205, 240), (.74, .7, .12, 1.12), dict(my=.68, ey=.18, ex=.22)),
    'alyssa_kid':  ('elijah_sisters.jpg', 1030, (88, 725, 210, 168), (.72, 1.25, .16, 1.5), dict(my=.69, ey=.10, ex=.2)),
    'naomi_kid':   ('elijah_sisters.jpg', 1030, (395, 893, 252, 182), (.7, 1.1, .16, 1.55), dict(my=.62, ey=.08, ex=.2)),
    'alyssa':      ('alyssa.jpg', 1179, (368, 440, 478, 535), (.72, .75, .14, 1.14), dict(my=.70, ey=.17, ex=.2)),
    'naomi':       ('naomi.jpg', 1179, (360, 195, 440, 420), (.7, .45, .16, .95), dict(my=.72, ey=.18, ex=.2)),
    'joseph':      ('joseph.jpg', None, (218, 432, 250, 232), (.78, .9, .18, 1.2), dict(my=.63, ey=.14, ex=.2)),
    'noah':        ('noah.jpg', None, (285, 790, 470, 450), (.72, .86, .18, 1.22), dict(my=.70, ey=.21, ex=.2)),
    'emma':        ('emma_elijah.jpg', None, (763, 600, 243, 214), (.74, .95, .18, 1.25), dict(my=.72, ey=.16, ex=.2)),
    'eli':         ('eli.jpg', 1179, (345, 482, 490, 420), (.72, .82, .16, 1.23), dict(my=.70, ey=.18, ex=.2)),
    'adam':        ('adam.jpg', 1179, (305, 545, 450, 420), (.74, .82, .18, 1.23), dict(my=.60, ey=.14, ex=.22, redeye=[(405, 625), (607, 595)])),
    'vivian':      ('vivian.jpg', 654, (118, 520, 355, 360), (.72, .8, .16, 1.25), dict(my=.68, ey=.17, ex=.2)),
    'levi':        ('levi.png', 924, (275, 590, 350, 290), (.74, .95, .16, 1.22), dict(my=.64, ey=.22, ex=.2)),
    'mia':         ('mia.jpg', 491, (52, 175, 290, 245), (.6, .75, .18, 1.1), dict(my=.67, ey=.21, ex=.2, tint=True)),
}


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
    json.dump(meta, open(os.path.join(R, 'faces/meta.json'), 'w'), indent=1)
    print('faces:', ', '.join(meta))


if __name__ == '__main__':
    main()
