import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { CardData, Settings } from './types';

/** نسخة الهاتف (Capacitor): إشعارات محلية يجدولها النظام وتصل والتطبيق مغلق */
export const isNative = Capacitor.isNativePlatform();

export const notifySupported = () => isNative || (typeof window !== 'undefined' && 'Notification' in window);

export async function askPermission(): Promise<boolean> {
  if (isNative) {
    if ((await LocalNotifications.checkPermissions()).display === 'granted') return true;
    return (await LocalNotifications.requestPermissions()).display === 'granted';
  }
  if (!notifySupported()) return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

const TITLE = 'حبيبنا ﷺ';
const CHANNEL = 'cards';
const TEST_ID = 9999;
const short = (t: string) => (t.length > 160 ? t.slice(0, 157) + '…' : t);

async function ensureChannel() {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({ id: CHANNEL, name: 'بطاقات حبيبنا', description: 'بطاقة في الأوقات التي تختارها', importance: 3, visibility: 1 });
}

const nativeNote = (id: number, card: CardData, at: Date) => ({
  id, title: TITLE, body: short(card.text), largeBody: card.text, channelId: CHANNEL,
  extra: { cardId: card.id }, schedule: { at, allowWhileIdle: true },
});

export async function showCard(card: CardData) {
  if (isNative) {
    // على الهاتف: إشعار تجريبي بعد ثوانٍ، فيمكن رؤيته والتطبيق في الخلفية
    await ensureChannel();
    await LocalNotifications.schedule({ notifications: [nativeNote(TEST_ID, card, new Date(Date.now() + 5000))] });
    return;
  }
  if (!notifySupported() || Notification.permission !== 'granted') return;
  const opts: NotificationOptions = { body: short(card.text), icon: 'icon.svg', tag: 'qarib', lang: 'ar', dir: 'rtl' };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(TITLE, opts); else new Notification(TITLE, opts);
}

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** أوقات الإشعارات موزعة بالتساوي داخل النافذة الزمنية */
export function slots(s: Settings): number[] {
  const a = toMin(s.from), b = Math.max(toMin(s.to), a + 30);
  if (s.perDay <= 1) return [Math.round((a + b) / 2)];
  return Array.from({ length: s.perDay }, (_, i) => Math.round(a + ((b - a) * i) / (s.perDay - 1)));
}
export const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** جدولة الويب: تعمل والتطبيق مفتوح فقط (على الهاتف تُستعمل scheduleWeek) */
export function schedule(s: Settings, pick: () => CardData | null): () => void {
  if (!s.notifyOn || isNative) return () => {};
  const timers: number[] = [];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  for (const m of slots(s)) {
    if (m <= nowMin) continue;
    timers.push(window.setTimeout(() => { const c = pick(); if (c) void showCard(c); }, (m - nowMin) * 60_000));
  }
  return () => timers.forEach((t) => clearTimeout(t));
}

export const WEEK = 7;

/**
 * جدولة أسبوع قادم دفعة واحدة على الهاتف. بطاقة كل موعد تُحسب من رقم اليوم في
 * الترتيب الثابت للبطاقات، فلا تتغيّر ولا تتكرّر عند إعادة الجدولة في الأيام التالية.
 * تُلغى الجدولة السابقة أولًا، فاستدعاؤها عند كل فتح للتطبيق يعيد الجدولة.
 */
export async function scheduleWeek(s: Settings, pool: CardData[]): Promise<number> {
  if (!isNative) return 0;
  const pending = await LocalNotifications.getPending();
  const old = pending.notifications.filter((n) => n.id !== TEST_ID);
  if (old.length) await LocalNotifications.cancel({ notifications: old.map((n) => ({ id: n.id })) });
  if (!s.notifyOn || pool.length === 0) return 0;
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return 0;
  await ensureChannel();

  const times = slots(s);
  const soon = Date.now() + 60_000, end = Date.now() + WEEK * 86_400_000;
  const list: ReturnType<typeof nativeNote>[] = [];
  for (let d = 0; d <= WEEK; d++) {
    times.forEach((m, k) => {
      const at = new Date();
      at.setDate(at.getDate() + d);
      at.setHours(Math.floor(m / 60), m % 60, 0, 0);
      if (at.getTime() < soon || at.getTime() > end) return;
      const day = Math.floor((at.getTime() - at.getTimezoneOffset() * 60_000) / 86_400_000);
      list.push(nativeNote(d * 10 + k + 1, pool[(day * times.length + k) % pool.length], at));
    });
  }
  if (list.length) await LocalNotifications.schedule({ notifications: list });
  return list.length;
}

/** الضغط على الإشعار يفتح البطاقة نفسها؛ يُحفظ الطلب إن وصل قبل تحميل البطاقات */
let tapped: string | null = null;
let onTap: ((id: string) => void) | null = null;
if (isNative) {
  void LocalNotifications.addListener('localNotificationActionPerformed', (e) => {
    const id = (e.notification.extra as { cardId?: string } | undefined)?.cardId;
    if (!id) return;
    if (onTap) onTap(id); else tapped = id;
  });
}
export function listenTaps(cb: (id: string) => void): () => void {
  onTap = cb;
  if (tapped) { cb(tapped); tapped = null; }
  return () => { onTap = null; };
}
