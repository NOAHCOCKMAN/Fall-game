// Render life-story.html frame by frame with Playwright and encode MP4s with ffmpeg.
//   node export.js            -> out/life-story-1080p.mp4 and out/life-story-text.mp4 (720p, small for texting)
//   node export.js --fps 24   (optional)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');

const args = process.argv.slice(2), fps = +(args[args.indexOf('--fps') + 1] || 0) || 30;
const html = path.join(__dirname, 'life-story.html'), out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });

function run(cmd, a) { return new Promise((res, rej) => { const p = spawn(cmd, a, { stdio: ['ignore', 'inherit', 'inherit'] }); p.on('close', c => c ? rej(new Error(cmd + ' exited ' + c)) : res()); }); }

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('page error:', e));
  await page.goto('file://' + html + '?export=1');
  await page.waitForFunction(() => window.STORY_READY);
  const dur = await page.evaluate(() => window.STORY_DURATION);

  console.log('rendering soundtrack...');
  const wav = path.join(out, 'soundtrack.wav');
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.renderAudioWav()), 'base64'));

  const big = path.join(out, 'life-story-1080p.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-15:TP=-1.5:LRA=11', '-ar', '44100', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', big],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r));
  const n = Math.round(dur * fps), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const b64 = await page.evaluate(T => { window.renderAt(T); return document.getElementById('c').toDataURL('image/jpeg', .93).slice(23); }, i / fps);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (fps * 5) === 0) console.log(`frame ${i}/${n}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end(); await done; await browser.close();

  console.log('making the small version for texting...');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', big, '-vf', 'scale=1280:720', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', path.join(out, 'life-story-text.mp4')]);
  fs.unlinkSync(wav);
  for (const f of fs.readdirSync(out)) console.log(f, (fs.statSync(path.join(out, f)).size / 1e6).toFixed(1) + ' MB');
})();
