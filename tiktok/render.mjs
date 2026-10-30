// يسجّل مشهد HTML إطارًا إطارًا (render(t)) ثم يركّب المؤثرات الصوتية ويُخرج mp4 عموديًّا 1080×1920.
// الاستعمال: node tiktok/render.mjs tiktok/video1/scene.html tiktok/out/video1.mp4 [--stills 1,5,10]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn, execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , src, out, flag, list] = process.argv;
const FPS = 30;
const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(dirname(resolve(out)), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + resolve(src));
await page.evaluate(() => document.fonts.ready);
const meta = await page.evaluate(() => window.META);

if (flag === '--stills') {
  for (const t of list.split(',').map(Number)) {
    await page.evaluate(t => render(t), t);
    await page.screenshot({ path: out.replace(/\.mp4$/, '') + `-${t}s.png` });
  }
  await browser.close();
  process.exit(0);
}

const frames = Math.round(meta.duration * FPS);
const silent = out.replace(/\.mp4$/, '.silent.mp4');
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
for (let f = 0; f < frames; f++) {
  await page.evaluate(t => render(t), f / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`frame ${f}/${frames}`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();

// الصوت: مؤثرات مولّدة (sfx.py) في مواضعها من الجدول
const cues = out.replace(/\.mp4$/, '.sfx.json'), wav = out.replace(/\.mp4$/, '.sfx.wav');
writeFileSync(cues, JSON.stringify(meta));
execFileSync('python3', ['-I', join(here, 'sfx.py'), cues, wav], { stdio: 'inherit' });
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
console.log('done', out, meta.duration + 's');
