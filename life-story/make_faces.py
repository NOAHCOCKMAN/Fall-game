#!/usr/bin/env python3
"""Crop the face cutouts used by the life-story video.

Put two photos in life-story/photos/:
  nohat.jpg  (or .png/.jpeg/.webp/.heic)  - no hat, facing the camera
  hat.jpg                                   - wearing the Patagonia hat

Then run:  python3 make_faces.py
It finds the face (OpenCV, if installed), crops an oval with a soft edge, and
writes transparent PNGs plus faces/meta.json (where the face sits inside each
PNG and his skin tone, used for the cartoon neck and hands).

If the detector picks the wrong spot, pass the face box by hand, in pixels of
the original photo (left, top, width, height of the face from brow to chin):
  python3 make_faces.py --nohat-box 410,300,380,420 --hat-box 380,350,360,400

With no photos present it draws cartoon stand-in faces so the video still runs.
"""
import argparse, glob, json, os, sys
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
PHOTOS, OUT = os.path.join(ROOT, 'photos'), os.path.join(ROOT, 'faces')
OUT_H = 640  # px height of each cutout

# How far the crop extends around the detected face box (in face-box units).
# The hat crop reaches higher so the whole cap fits inside the oval.
CROP = {
    'nohat': dict(side=0.80, top=0.50, bottom=0.18, head_top=0.86),
    'hat':   dict(side=0.88, top=0.82, bottom=0.18, head_top=1.12),
}


def find_photo(key):
    for ext in ('jpg', 'jpeg', 'png', 'webp', 'heic', 'JPG', 'JPEG', 'PNG', 'HEIC'):
        hits = glob.glob(os.path.join(PHOTOS, f'{key}.{ext}'))
        if hits:
            return hits[0]
    return None


def load(path):
    if path.lower().endswith('.heic'):
        try:
            import pillow_heif
            pillow_heif.register_heif_opener()
        except ImportError:
            sys.exit('HEIC photo: run "pip install pillow-heif" or save it as JPG.')
    return ImageOps.exif_transpose(Image.open(path)).convert('RGB')


def detect(img):
    try:
        import cv2, numpy as np
    except ImportError:
        return None
    g = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2GRAY)
    casc = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    m = max(40, min(img.size) // 10)
    faces = casc.detectMultiScale(g, scaleFactor=1.08, minNeighbors=6, minSize=(m, m))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    # Haar boxes start mid-forehead and stop a bit above the chin; nudge to brow-to-chin.
    return int(x), int(y + h * 0.02), int(w), int(h * 1.06)


def cutout(img, box, key):
    x, y, w, h = box
    c = CROP[key]
    cx = x + w / 2
    left, right = cx - w * c['side'], cx + w * c['side']
    top, bottom = y - h * c['top'], y + h * (1 + c['bottom'])
    cw, ch = int(round(right - left)), int(round(bottom - top))
    canvas = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    canvas.paste(img.convert('RGBA'), (int(round(-left)), int(round(-top))))
    scale = OUT_H / ch
    ow = int(round(cw * scale))
    canvas = canvas.resize((ow, OUT_H), Image.LANCZOS)
    # oval mask with a soft, feathered edge
    feather = int(ow * 0.045)
    mask = Image.new('L', (ow, OUT_H), 0)
    ImageDraw.Draw(mask).ellipse((feather, feather, ow - feather, OUT_H - feather), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(feather * 0.7))
    alpha = Image.composite(canvas.getchannel('A'), Image.new('L', canvas.size, 0), mask)
    canvas.putalpha(alpha)
    meta = dict(w=ow, h=OUT_H,
                fcx=(cx - left) / cw, fcy=(y + h / 2 - top) / ch, fh=h / ch,
                headTop=-c['head_top'])  # top of head, in face-heights above face centre
    # skin tone from the cheeks
    sx0, sx1 = int(x + w * 0.25), int(x + w * 0.75)
    sy0, sy1 = int(y + h * 0.55), int(y + h * 0.72)
    raw = img.crop((sx0, sy0, sx1, sy1)).resize((24, 8)).convert('RGB').tobytes()
    px = sorted((raw[i:i + 3] for i in range(0, len(raw), 3)), key=sum)
    r, g, b = px[len(px) // 2]
    meta['skin'] = '#%02x%02x%02x' % (r, g, b)
    return canvas, meta


def placeholder(key, hat_color):
    """A friendly cartoon stand-in, drawn as if it were a photo."""
    W, H = 600, 800
    im = Image.new('RGB', (W, H), (205, 222, 236))
    d = ImageDraw.Draw(im)
    skin, hair = (233, 186, 150), (92, 62, 40)
    fx, fy, fw, fh = 180, 250, 240, 300           # face box: brow to chin
    d.ellipse((fx - 30, fy - 120, fx + fw + 30, fy + fh + 10), fill=hair)       # hair mass
    d.ellipse((fx - 26, fy + 90, fx + 14, fy + 170), fill=skin)                  # ears
    d.ellipse((fx + fw - 14, fy + 90, fx + fw + 26, fy + 170), fill=skin)
    d.ellipse((fx - 5, fy - 60, fx + fw + 5, fy + fh), fill=skin)               # face
    d.chord((fx - 12, fy - 110, fx + fw + 12, fy + 40), 180, 360, fill=hair)    # fringe
    d.polygon([(fx + 30, fy - 5), (fx + 120, fy - 40), (fx + 200, fy + 5), (fx + 120, fy - 10)], fill=hair)
    for ex in (fx + 70, fx + 170):
        d.ellipse((ex - 17, fy + 92, ex + 17, fy + 122), fill='white')
        d.ellipse((ex - 9, fy + 98, ex + 9, fy + 118), fill=(60, 40, 25))
        d.line((ex - 24, fy + 70, ex + 22, fy + 64), fill=hair, width=9)
    d.arc((fx + 104, fy + 120, fx + 140, fy + 175), 300, 90, fill=(190, 130, 100), width=5)
    d.chord((fx + 62, fy + 185, fx + 178, fy + 255), 0, 180, fill=(140, 40, 40))
    d.rectangle((fx + 75, fy + 220, fx + 165, fy + 228), fill='white')
    d.ellipse((fx + 25, fy + 170, fx + 65, fy + 195), fill=(240, 160, 150))
    d.ellipse((fx + 175, fy + 170, fx + 215, fy + 195), fill=(240, 160, 150))
    if key == 'hat':
        hc = tuple(int(hat_color.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
        dark = tuple(int(v * 0.72) for v in hc)
        d.chord((fx - 25, fy - 175, fx + fw + 25, fy + 70), 180, 360, fill=hc)
        d.ellipse((fx - 30, fy + 20, fx + fw + 30, fy + 70), fill=dark)
        d.rectangle((fx - 30, fy + 20, fx + fw + 30, fy + 45), fill=hc)
        d.rectangle((fx + 85, fy - 85, fx + 155, fy - 40), fill=(245, 245, 240))
        d.polygon([(fx + 90, fy - 45), (fx + 110, fy - 72), (fx + 122, fy - 58), (fx + 135, fy - 78), (fx + 150, fy - 45)], fill=(40, 40, 60))
    return im, (fx, fy - 40, fw, fh + 40)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--nohat-box'); ap.add_argument('--hat-box')
    ap.add_argument('--placeholder', action='store_true', help='ignore photos, draw stand-ins')
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(ROOT, 'config.json')))
    os.makedirs(OUT, exist_ok=True)
    meta = {}
    for key in ('nohat', 'hat'):
        path = None if a.placeholder else find_photo(key)
        manual = getattr(a, key + '_box')
        if path:
            img = load(path)
            box = tuple(int(v) for v in manual.split(',')) if manual else detect(img)
            if not box:
                sys.exit(f'Could not find a face in {path}. Pass --{key}-box left,top,width,height.')
            src = os.path.basename(path)
        else:
            img, box = placeholder(key, cfg.get('hatColor', '#2f4a3a'))
            src = 'placeholder'
        cut, m = cutout(img, box, key)
        m['source'] = src
        cut.save(os.path.join(OUT, key + '.png'), optimize=True)
        meta[key] = m
        print(f'{key}: {src}, face box {box}, skin {m["skin"]}')
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)


if __name__ == '__main__':
    main()
