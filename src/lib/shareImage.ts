import type { CardData } from './types';

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

export async function cardToBlob(card: CardData): Promise<Blob | null> {
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
  ctx.font = '400 34px "Noto Naskh Arabic", serif'; ctx.fillText('من مواقف النبي ﷺ', W / 2, 190);
  ctx.fillStyle = gold; ctx.fillRect(W / 2 - 180, 240, 360, 3);
  ctx.fillStyle = '#243030';
  let fs = 50, lh = 92, bl: string[] = [];
  for (;;) {
    ctx.font = `400 ${fs}px "Noto Naskh Arabic", serif`; bl = wrap(ctx, card.text, W - 260);
    if (bl.length * lh <= 800 || fs <= 34) break; fs -= 4; lh -= 7;
  }
  let y = 330 + Math.max(0, (800 - bl.length * lh) / 2);
  for (const l of bl) { ctx.fillText(l, W / 2, y); y += lh; }
  ctx.fillStyle = frame; ctx.font = '400 32px "Noto Naskh Arabic", serif';
  ctx.fillText('المصدر: ' + card.source, W / 2, H - 250);
  ctx.fillStyle = gold; ctx.font = '700 40px Amiri, serif'; ctx.fillText('حبيبنا', W / 2, H - 170);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}

export async function shareCard(card: CardData) {
  const text = `${card.text}\n\n— ${card.source}\nتطبيق «حبيبنا»`;
  const blob = await cardToBlob(card);
  if (blob) {
    const file = new File([blob], 'card.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text }); return 'shared'; } catch { return 'cancel'; } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `qarib-${card.id}.png`; a.click(); return 'downloaded';
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'fail'; }
}
