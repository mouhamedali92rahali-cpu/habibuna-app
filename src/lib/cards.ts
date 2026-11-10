import type { CardData } from './types';
import { isNative } from './notify';
import { load, save } from './store';

interface CardsFile { version: number; app?: string; cards: CardData[]; widget?: unknown; }
/** جمل زرّ الصلاة على الشاشة الرئيسية من cards.json المنشورة (تصل الدفعات الجديدة بلا تحديث التطبيق) */
export let widgetLines: unknown = null;

/** أحدث نسخة منشورة من التطبيق (الحقل app في cards.json المنشورة)؛ لا اتصال جديد، فهي في الملف نفسه */
export let latestApp: string | null = null;
/** هل النسخة a أحدث من b؟ (3.10 > 3.9) */
export const newer = (a: string, b: string) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0); } return false; };

/** نسخة البطاقات المنشورة على الويب؛ منها تصل البطاقات الجديدة إلى تطبيق الهاتف دون تحديثه */
const REMOTE = import.meta.env.VITE_CARDS_URL ?? 'https://mouhamedali92rahali-cpu.github.io/habibuna-app/cards.json';

const get = async (url: string, ms: number): Promise<CardsFile> => {
  const ctl = new AbortController();
  const t = window.setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as CardsFile;
    if (!Array.isArray(d.cards) || d.cards.length === 0) throw new Error('empty');
    return d;
  } finally { window.clearTimeout(t); }
};

/**
 * الويب: cards.json بجانب الصفحة (والـ service worker يقدّم الشبكة أولًا).
 * الهاتف: النسخة المنشورة إن وصلت، وإلا آخر نسخة محفوظة، وإلا المرفقة بالتطبيق؛ ويُؤخذ الأحدث رقمًا.
 */
/** أقوال «قالوا عنه» في ملف مستقل (qalu.json)، حتى لا تظهر في النسخ القديمة بطاقاتٍ عادية؛ تُحمَّل مثل cards.json */
async function loadQalu(): Promise<CardData[]> {
  try {
    if (!isNative) return (await get('qalu.json', 15000)).cards;
    const bundled = await get('qalu.json', 15000).catch(() => null);
    const cached = load<CardsFile | null>('qaluCache', null);
    const remote = await get(REMOTE.replace('cards.json', 'qalu.json'), 6000).catch(() => null);
    if (remote) save('qaluCache', remote);
    const best = [remote, cached, bundled].filter((d): d is CardsFile => !!d).sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
    return (best?.cards ?? []).map((c) => ({ ...c, qalu: true }));
  } catch { return []; }
}

export async function loadCards(): Promise<CardData[]> {
  const [cards, qalu] = await Promise.all([loadMain(), loadQalu()]);
  return [...cards, ...qalu];
}

async function loadMain(): Promise<CardData[]> {
  if (!isNative) return (await get('cards.json', 15000)).cards;
  const bundled = await get('cards.json', 15000).catch(() => null);
  const cached = load<CardsFile | null>('cardsCache', null);
  const remote = await get(REMOTE, 6000).catch(() => null);
  if (remote) save('cardsCache', remote);
  latestApp = (remote ?? cached)?.app ?? null;
  const best = [remote, cached, bundled].filter((d): d is CardsFile => !!d).sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
  if (!best) throw new Error('no cards');
  widgetLines = best.widget ?? null;
  return best.cards;
}
