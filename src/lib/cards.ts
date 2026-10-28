import type { CardData } from './types';
import { isNative } from './notify';
import { load, save } from './store';

interface CardsFile { version: number; cards: CardData[]; }

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
export async function loadCards(): Promise<CardData[]> {
  if (!isNative) return (await get('cards.json', 15000)).cards;
  const bundled = await get('cards.json', 15000).catch(() => null);
  const cached = load<CardsFile | null>('cardsCache', null);
  const remote = await get(REMOTE, 6000).catch(() => null);
  if (remote) save('cardsCache', remote);
  const best = [remote, cached, bundled].filter((d): d is CardsFile => !!d).sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
  if (!best) throw new Error('no cards');
  return best.cards;
}
