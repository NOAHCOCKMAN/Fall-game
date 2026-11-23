// Render elijah.html frame by frame and encode MP4s.
//   node export.js                 -> out/elijah-1080p.mp4 + out/elijah-text.mp4 (720p, small enough to text)
//   node export.js --from 120 --to 150   (preview a slice, writes out/preview.mp4)
//   node export.js --reuse-music   (skip re-rendering build/music.wav)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('--fps', 30), FROM = +arg('--from', 0), TO = arg('--to', null), WORKERS = +arg('--workers', 4);
const html = path.join(__dirname, 'elijah.html'), out = path.join(__dirname, 'out'), build = path.join(__dirname, 'build');
fs.mkdirSync(out, { recursive: true });
const run = (cmd, a) => new Promise((res, rej) => { const p = spawn(cmd, a, { stdio: ['ignore', 'inherit', 'inherit'] }); p.on('close', c => c ? rej(new Error(cmd + ' exited ' + c)) : res()); });

(async () => {
  const browser = await chromium.launch();
  const open = async () => { const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } }); pg.on('pageerror', e => console.error('page error:', e));
    await pg.goto('file://' + html + '?export=1'); await pg.waitForFunction(() => window.STORY_READY, null, { timeout: 120000 }); return pg; };
  const page = await open();
  const dur = await page.evaluate(() => window.STORY_DURATION), end = TO ? Math.min(+TO, dur) : dur;
  const music = path.join(build, 'music.wav');
  if (!process.argv.includes('--reuse-music') || !fs.existsSync(music)) {
    console.log('rendering music + sound effects...'); const t = Date.now();
    fs.writeFileSync(music, Buffer.from(await page.evaluate(() => window.renderMusicWav()), 'base64')); console.log('  done in', ((Date.now() - t) / 1000).toFixed(0), 's'); }
  // frames: several pages render in parallel, frames are written in order
  const pages = [page]; for (let i = 1; i < WORKERS; i++) pages.push(await open());
  const n = Math.round((end - FROM) * FPS), dst = path.join(out, TO || FROM ? 'preview.mp4' : 'elijah-1080p.mp4');
  const mix = `[1:a]atrim=start=${FROM}:end=${end},asetpts=PTS-STARTPTS,volume=0.85[m];[2:a]atrim=start=${FROM}:end=${end},asetpts=PTS-STARTPTS,volume=1.25[v];[m][v]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=11[a]`;
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', music, '-i', path.join(build, 'voice.wav'),
    '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-shortest', '-movflags', '+faststart', dst],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r)); const t0 = Date.now(); let next = 0; const buf = new Map(); let written = 0;
  const grab = (pg, i) => pg.evaluate(T => { window.renderAt(T); return document.getElementById('c').toDataURL('image/jpeg', .92).slice(23); }, FROM + i / FPS);
  async function flush() { while (buf.has(written)) { const b = Buffer.from(buf.get(written), 'base64'); buf.delete(written); written++; if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r)); } }
  await Promise.all(pages.map(async pg => { while (true) { const i = next++; if (i >= n) break; buf.set(i, await grab(pg, i));
    if (i % (FPS * 10) === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`); while (buf.size > 120 && !buf.has(written)) await new Promise(r => setTimeout(r, 5)); await flush(); } }));
  await flush(); ff.stdin.end(); await done; await browser.close();
  if (!TO && !FROM) { console.log('making the small version for texting...');
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', dst, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', path.join(out, 'elijah-text.mp4')]); }
  for (const f of fs.readdirSync(out)) console.log(f, (fs.statSync(path.join(out, f)).size / 1e6).toFixed(1) + ' MB');
})();
