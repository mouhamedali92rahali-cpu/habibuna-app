// يولّد أيقونات أندرويد (التطبيق والإشعار) من تصميم البطاقة: محراب ذهبي و«محمد ﷺ» بخط Amiri.
// التشغيل: NODE_PATH=$(npm root -g) node scripts/gen-android-icons.mjs   (يحتاج playwright)
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const res = `${root}/android/app/src/main/res`;
const font = `file://${root}/node_modules/@fontsource/amiri/files/amiri-arabic-700-normal.woff2`;

const EMERALD = '#0f5c4d', GOLD = '#d4b25c', CREAM = '#f3e7c4';

// الرسم في مربع 108×108 (مقاس الأيقونة التكيّفية)، والمحتوى داخل الدائرة الآمنة (66)
const art = (bg) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="100%" height="100%">
  ${bg}
  <g transform="translate(54 55) scale(.42) translate(-60 -78)">
    <path d="M60 6c6 14 38 26 38 62v76H22V68C22 32 54 20 60 6z" fill="none" stroke="${GOLD}" stroke-width="4.5"/>
    <path d="M60 18c5 11 28 21 28 50v68H32V68c0-29 23-39 28-50z" fill="none" stroke="${GOLD}" stroke-width="1.8" opacity=".6"/>
    <text x="60" y="96" text-anchor="middle" font-family="A" font-size="31" fill="${CREAM}">محمد</text>
    <text x="60" y="124" text-anchor="middle" font-family="A" font-size="22" fill="${GOLD}">ﷺ</text>
  </g>
</svg>`;
const page = (svg) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:A;src:url(${font}) format('woff2')}
html,body{margin:0;background:transparent}div{width:100vw;height:100vh}</style></head><body><div>${svg}</div></body></html>`;

const shapes = {
  foreground: '',
  legacy: `<rect x="4" y="4" width="100" height="100" rx="22" fill="${EMERALD}"/>`,
  round: `<circle cx="54" cy="54" r="50" fill="${EMERALD}"/>`,
};
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const browser = await chromium.launch();
const p = await browser.newPage();
async function shot(svg, px, out, zoom = 1) {
  await p.setViewportSize({ width: px, height: px });
  await p.setContent(page(zoom === 1 ? svg : svg.replace('viewBox="0 0 108 108"', `viewBox="${54 - 54 / zoom} ${54 - 54 / zoom} ${108 / zoom} ${108 / zoom}"`)));
  await p.evaluate(() => document.fonts.ready);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, await p.screenshot({ omitBackground: true }));
}
for (const [d, k] of Object.entries(dens)) {
  await shot(art(shapes.foreground), 108 * k, `${res}/mipmap-${d}/ic_launcher_foreground.png`);
  // الأيقونة القديمة (قبل أندرويد 8) بمقاس 48، مكبّرة لتملأ الإطار
  await shot(art(shapes.legacy), 48 * k, `${res}/mipmap-${d}/ic_launcher.png`, 108 / 100);
  await shot(art(shapes.round), 48 * k, `${res}/mipmap-${d}/ic_launcher_round.png`, 108 / 100);
}
await shot(art(`<rect width="108" height="108" fill="${EMERALD}"/>`), 512, `${root}/scripts/out/icon-preview.png`);
// شاشة البداية (قبل أندرويد 12): خلفية زمردية والشعار في الوسط
const splash = { '': [480, 320], 'land-mdpi': [480, 320], 'land-hdpi': [800, 480], 'land-xhdpi': [1280, 720], 'land-xxhdpi': [1600, 960], 'land-xxxhdpi': [1920, 1280],
  'port-mdpi': [320, 480], 'port-hdpi': [480, 800], 'port-xhdpi': [720, 1280], 'port-xxhdpi': [960, 1600], 'port-xxxhdpi': [1280, 1920] };
for (const [q, [w, h]] of Object.entries(splash)) {
  const side = Math.min(w, h) * 0.6;
  await p.setViewportSize({ width: w, height: h });
  await p.setContent(page(art('')).replace('div{width:100vw;height:100vh}',
    `body{background:${EMERALD};display:grid;place-items:center;width:100vw;height:100vh}div{width:${side}px;height:${side}px}`));
  await p.evaluate(() => document.fonts.ready);
  writeFileSync(`${res}/drawable${q ? '-' + q : ''}/splash.png`, await p.screenshot());
}
await browser.close();

writeFileSync(`${res}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${EMERALD.toUpperCase()}</color>\n</resources>\n`);
console.log('done');
