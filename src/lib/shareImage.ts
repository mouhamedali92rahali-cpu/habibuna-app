import { isNative } from './notify';
import { PhoneSettings } from './phone';
import type { CardData } from './types';
import type { Art } from './art';

const PALETTE: Record<string, [string, string, string]> = {
  emerald: ['#0f5c4d', '#f6f0e1', '#c9a24b'], navy: ['#17305c', '#f6f0e1', '#c9a24b'], plum: ['#4a2a55', '#f6f0e1', '#c9a24b'],
  brown: ['#5b3a1e', '#f6f0e1', '#c9a24b'], slate: ['#3f4647', '#f6f0e1', '#c9a24b'], ivory: ['#d9c58f', '#fbf6e8', '#a8822f'],
};

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/), lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** صورة الرسم (SVG) جاهزة للرسم على canvas؛ من الموقع أولًا إن كان أحدث، ثم المرفق */
async function loadImg(art: Art): Promise<HTMLImageElement | null> {
  for (const src of [art.src, art.fallback]) {
    const img = new Image(); img.crossOrigin = 'anonymous';
    const ok = await new Promise<boolean>((res) => { const t = window.setTimeout(() => res(false), 4000); img.onload = () => { window.clearTimeout(t); res(true); }; img.onerror = () => { window.clearTimeout(t); res(false); }; img.src = src; });
    if (ok) return img;
  }
  return null;
}

export async function cardToBlob(card: CardData, art?: Art): Promise<Blob | null> {
  try { await document.fonts.load('700 40px Amiri'); await document.fonts.load('400 30px "Noto Naskh Arabic"'); } catch { /* تجاهل */ }
  const [frame, paper, gold] = PALETTE[card.theme] ?? PALETTE.emerald;
  const W = 1080, H = 1500, m = 56;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'); if (!ctx) return null;
  ctx.direction = 'rtl'; ctx.textAlign = 'center';
  ctx.fillStyle = frame; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = paper; ctx.fillRect(m, m, W - 2 * m, H - 2 * m);
  ctx.strokeStyle = gold; ctx.lineWidth = 4; ctx.strokeRect(m + 22, m + 22, W - 2 * m - 44, H - 2 * m - 44);
  ctx.fillStyle = frame;
  ctx.font = '400 34px "Noto Naskh Arabic", serif'; ctx.fillText(card.dalail ? 'من دلائل الخيرات' : card.qalu ? 'قالوا عنه ﷺ' : 'من مواقف النبي ﷺ', W / 2, 190);
  ctx.fillStyle = gold; ctx.fillRect(W / 2 - 180, 240, 360, 3);
  ctx.fillStyle = '#243030';
  // البطاقة التي لها رسم: الرسم صغيرًا تحت النص (فيضيق مكان النص)
  const img = art ? await loadImg(art) : null;
  const box = img ? 560 : 800;
  let fs = 50, lh = 92, bl: string[] = [];
  for (;;) {
    ctx.font = `400 ${fs}px "Noto Naskh Arabic", serif`; bl = wrap(ctx, card.text, W - 260);
    if (bl.length * lh <= box || fs <= 30) break; fs -= 4; lh -= 7;
  }
  // النص والرسم كتلة واحدة في وسط المساحة
  const iw = 330, ih = iw * 0.8, artH = img ? 30 + ih + 44 : 0;
  let y = 330 + Math.max(0, ((img ? 860 : box) - bl.length * lh - artH) / 2);
  for (const l of bl) { ctx.fillText(l, W / 2, y); y += lh; }
  if (img && art) {
    const iy = y - lh / 2 + 30;
    try { ctx.drawImage(img, W / 2 - iw / 2, iy, iw, ih); } catch { /* تجاهل */ }
    ctx.fillStyle = '#6b5a36'; ctx.font = '400 26px "Noto Naskh Arabic", serif';
    ctx.fillText(art.caption, W / 2, iy + ih + 36);
  }
  ctx.fillStyle = frame; ctx.font = '400 32px "Noto Naskh Arabic", serif';
  ctx.fillText(card.qalu ? '— ' + card.title : 'المصدر: ' + card.source, W / 2, H - 250);
  ctx.fillStyle = gold; ctx.font = '700 40px Amiri, serif'; ctx.fillText('حبيبنا', W / 2, H - 170);
  ctx.fillStyle = frame; ctx.font = '400 26px "Noto Naskh Arabic", serif'; ctx.fillText('mouhamedali92rahali-cpu.github.io/habibuna-app', W / 2, H - 125);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}

const toBase64 = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] ?? ''); r.onerror = rej; r.readAsDataURL(b); });

export async function shareCard(card: CardData, art?: Art) {
  // رابط صفحة التحميل في آخر النص المشارَك (اقتراح وافق عليه المستخدم): كل مشاركة دعوة للتطبيق
  const text = `${card.text}\n\n— ${card.qalu ? card.title + '، ' : ''}${card.source}\n\nحمّل تطبيق «حبيبنا»: https://mouhamedali92rahali-cpu.github.io/habibuna-app/download.html`;
  const blob = await cardToBlob(card, art);
  // تطبيق الهاتف: قائمة المشاركة في أندرويد (الصورة والنص معًا)
  if (isNative && blob) {
    try { await PhoneSettings.shareImage({ base64: await toBase64(blob), text }); return 'native'; } catch { /* نكمل بالطرق الأخرى */ }
  }
  if (blob) {
    const file = new File([blob], 'card.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text }); return 'shared'; } catch { return 'cancel'; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `qarib-${card.id}.png`; a.click(); return 'downloaded';
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'fail'; }
}
