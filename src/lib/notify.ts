import type { CardData, Settings } from './types';

export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;

export async function askPermission(): Promise<boolean> {
  if (!notifySupported()) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

export async function showCard(card: CardData) {
  if (!notifySupported() || Notification.permission !== 'granted') return;
  const body = card.text.length > 160 ? card.text.slice(0, 157) + '…' : card.text;
  const opts: NotificationOptions = { body, icon: 'icon.svg', tag: 'qarib', lang: 'ar', dir: 'rtl' };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification('حبيبنا ﷺ', opts); else new Notification('حبيبنا ﷺ', opts);
}

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** أوقات الإشعارات موزعة بالتساوي داخل النافذة الزمنية */
export function slots(s: Settings): number[] {
  const a = toMin(s.from), b = Math.max(toMin(s.to), a + 30);
  if (s.perDay <= 1) return [Math.round((a + b) / 2)];
  return Array.from({ length: s.perDay }, (_, i) => Math.round(a + ((b - a) * i) / (s.perDay - 1)));
}
export const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** جدولة محلية تعمل والتطبيق مفتوح؛ في نسخة الهاتف تُستبدل بإشعارات الجدولة الأصلية */
export function schedule(s: Settings, pick: () => CardData | null): () => void {
  if (!s.notifyOn) return () => {};
  const timers: number[] = [];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (const m of slots(s)) {
    if (m <= nowMin) continue;
    timers.push(window.setTimeout(() => { const c = pick(); if (c) void showCard(c); }, (m - nowMin) * 60_000));
  }
  return () => timers.forEach((t) => clearTimeout(t));
}
