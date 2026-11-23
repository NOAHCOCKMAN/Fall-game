#!/usr/bin/env python3
"""Bundle the life-story video into one self-contained HTML file.

  python3 make_faces.py      # crop faces from photos/ (or draw stand-ins)
  python3 build.py           # -> life-story.html
  node export.js             # -> out/life-story.mp4 (and a smaller one for texting)
"""
import base64, glob, json, os
R = os.path.dirname(os.path.abspath(__file__))
b64 = lambda p: base64.b64encode(open(os.path.join(R, p), 'rb').read()).decode()
cfg = json.load(open(os.path.join(R, 'config.json')))
meta = json.load(open(os.path.join(R, 'faces/meta.json')))
faces = {k: {'src': 'data:image/png;base64,' + b64(f'faces/{k}.png'), 'meta': meta[k]} for k in ('nohat', 'hat')}
js = '\n'.join(open(f).read() for f in sorted(glob.glob(os.path.join(R, 'src/[0-9]*.js'))))
html = open(os.path.join(R, 'src/template.html')).read()
for k, v in {'/*__LILITA__*/': b64('fonts/lilita.ttf'), '/*__FREDOKA__*/': b64('fonts/fredoka.ttf'),
             '/*__CFG__*/': json.dumps(cfg), '/*__FACES__*/': json.dumps(faces), '/*__SOURCES__*/': js}.items():
    html = html.replace(k, v)
out = os.path.join(R, 'life-story.html')
open(out, 'w').write(html)
print('built life-story.html', len(html) // 1024, 'KB')
