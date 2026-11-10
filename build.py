#!/usr/bin/env python3
"""Bundle src/*.js into a single self-contained page.
Outputs:
  index.html          full HTML document (open locally or host on GitHub Pages)
  dist/artifact.html  body fragment (same game, no <html>/<head> wrapper)
"""
import glob, os
root = os.path.dirname(os.path.abspath(__file__))
tpl = open(os.path.join(root, 'src/template.html')).read()
js = '\n'.join(open(f).read() for f in sorted(glob.glob(os.path.join(root, 'src/[0-9]*.js'))))
frag = tpl.replace('/*__SOURCES__*/', js)
os.makedirs(os.path.join(root, 'dist'), exist_ok=True)
open(os.path.join(root, 'dist/artifact.html'), 'w').write(frag)
head_end = frag.index('</style>') + len('</style>')
full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n'
        + frag[:head_end] + '\n</head>\n<body>\n' + frag[head_end:] + '\n</body>\n</html>\n')
open(os.path.join(root, 'index.html'), 'w').write(full)
print('built', len(full) // 1024, 'KB')
