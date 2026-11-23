#!/usr/bin/env python3
"""Bundle ELIJAH into one self-contained HTML page.

  python3 faces.py          # cut faces out of photos/ -> faces/
  python3 build_audio.py    # voices + timeline -> build/
  python3 build.py          # -> elijah.html
  node export.js            # -> out/elijah-1080p.mp4 and out/elijah-text.mp4
"""
import base64, glob, json, os
R = os.path.dirname(os.path.abspath(__file__))
b64 = lambda p: base64.b64encode(open(os.path.join(R, p), 'rb').read()).decode()
meta = json.load(open(os.path.join(R, 'faces/meta.json')))
faces = {k: {'src': 'data:image/png;base64,' + b64(f'faces/{k}.png'), 'meta': m} for k, m in meta.items()}
tl = json.load(open(os.path.join(R, 'build/timeline.json')))
js = '\n'.join(open(f).read() for f in sorted(glob.glob(os.path.join(R, 'src/[0-9]*.js'))))
html = open(os.path.join(R, 'src/template.html')).read()
for k, v in {'/*__LILITA__*/': b64('fonts/lilita.ttf'), '/*__FREDOKA__*/': b64('fonts/fredoka.ttf'), '/*__TL__*/': json.dumps(tl, separators=(',', ':')),
             '/*__VOICE__*/': json.dumps('data:audio/ogg;base64,' + b64('build/voice.ogg')), '/*__FACES__*/': json.dumps(faces), '/*__SOURCES__*/': js}.items():
    assert k in html, k; html = html.replace(k, v)
open(os.path.join(R, 'elijah.html'), 'w').write(html)
print('built elijah.html', len(html) // 1024, 'KB')
