import type { Settings } from './types';

export function load<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
export function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* التخزين غير متاح */ }
}
export const defaultSettings: Settings = { perDay: 3, from: '09:00', to: '21:00', notifyOn: false, popupOn: true };

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const today = () => new Date().toISOString().slice(0, 10);

/** ترتيب عشوائي بلا تكرار: يُعاد الخلط عند انتهاء كل البطاقات، ويُضاف الجديد من التحديثات */
export interface Deck { order: string[]; pos: number; day: string; }
export function syncDeck(deck: Deck | null, ids: string[]): Deck {
  if (!deck) return { order: shuffle(ids), pos: 0, day: today() };
  const known = new Set(deck.order);
  const fresh = ids.filter((i) => !known.has(i));
  const order = deck.order.filter((i) => ids.includes(i));
  const pos = Math.min(deck.pos, order.length);
  // لا يُعاد خلط الباقي إلا عند وصول بطاقات جديدة، ليبقى الترتيب (وجدول الإشعارات) ثابتًا
  if (fresh.length === 0) return { ...deck, order, pos };
  return { ...deck, order: [...order.slice(0, pos), ...shuffle([...order.slice(pos), ...fresh])], pos };
}
export function advance(deck: Deck, ids: string[]): Deck {
  const pos = deck.pos + 1;
  if (pos >= deck.order.length) return { order: shuffle(ids), pos: 0, day: today() };
  return { ...deck, pos, day: today() };
}
