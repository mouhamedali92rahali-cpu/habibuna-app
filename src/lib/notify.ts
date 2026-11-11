import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { CardData, Settings } from './types';

/** نسخة الهاتف (Capacitor): إشعارات محلية يجدولها النظام وتصل والتطبيق مغلق */
export const isNative = Capacitor.isNativePlatform();

export const notifySupported = () => isNative || (typeof window !== 'undefined' && 'Notification' in window);

/** هل أذن المستخدم بالإشعارات؟ (دون أن يُسأل) */
export async function hasPermission(): Promise<boolean> {
  if (isNative) return (await LocalNotifications.checkPermissions()).display === 'granted';
  return notifySupported() && Notification.permission === 'granted';
}

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
// أهمية القناة لا تتغيّر بعد إنشائها، فرفعها يتطلب قناة باسم جديد
const CHANNEL = 'cards_v2';
const TEST_ID = 9999;
const short = (t: string) => (t.length > 160 ? t.slice(0, 157) + '…' : t);

async function ensureChannel() {
  if (Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.deleteChannel({ id: 'cards' }).catch(() => {});
  await LocalNotifications.createChannel({ id: CHANNEL, name: 'بطاقات حبيبنا', description: 'ثلاث بطاقات كل يوم: 10:00 و15:00 و20:00', importance: 4, visibility: 1 });
}

/**
 * هل يسمح النظام بالمواعيد الدقيقة؟ (أندرويد 14+ يمنعها افتراضيًّا).
 * لا نطلبها عند الجدولة، لأن الإضافة حينها تفتح شاشة الإعدادات فجأة؛ يطلبها المستخدم من زرّ في الإعدادات.
 */
export async function exactAllowed(): Promise<boolean> {
  if (Capacitor.getPlatform() !== 'android') return true;
  return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted';
}
export async function askExact(): Promise<boolean> {
  return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm === 'granted';
}

const nativeNote = (id: number, card: CardData, at: Date | null, exact: boolean) => ({
  id, title: TITLE, body: short(card.text), largeBody: card.text, channelId: CHANNEL,
  extra: { cardId: card.id }, isExactNotification: exact,
  ...(at ? { schedule: { at, allowWhileIdle: true } } : {}),
});

const errText = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e));

/** فحص حالة الإشعارات على الهاتف سطرًا سطرًا، لتصوير الشاشة عند المشكلة */
export async function diagnose(card: CardData): Promise<string[]> {
  const out: string[] = [];
  const step = async (label: string, f: () => Promise<string>) => {
    try { out.push(`${label}: ${await f()}`); } catch (e) { out.push(`${label}: ✗ ${errText(e)}`); }
  };
  await step('المنصّة', async () => `${Capacitor.getPlatform()} · ${navigator.userAgent.match(/Android [\d.]+/)?.[0] ?? '?'}`);
  await step('إذن الإشعارات', async () => (await LocalNotifications.checkPermissions()).display);
  await step('المواعيد الدقيقة', async () => (await LocalNotifications.checkExactNotificationSetting()).exact_alarm);
  await step('إنشاء القناة', async () => { await ensureChannel(); return 'تم'; });
  await step('القنوات', async () => (await LocalNotifications.listChannels()).channels.map((c) => `${c.id}(${c.importance})`).join('، ') || 'لا شيء');
  await step('إشعار بعد دقيقة', async () => (await testLater(card)) ?? 'جُدول (دقيق)');
  await step('المجدولة', async () => String((await LocalNotifications.getPending()).notifications.length));
  await step('أقرب المواعيد', async () => {
    const at = (await LocalNotifications.getPending()).notifications
      .map((n) => n.schedule?.at ? new Date(n.schedule.at) : null)
      .filter((d): d is Date => !!d && d.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime()).slice(0, 4);
    return at.map((d) => `${d.getDate()}/${d.getMonth() + 1} ${fmt(d.getHours() * 60 + d.getMinutes())}`).join('، ') || 'لا شيء';
  });
  return out;
}

/** تجربة إشعار مجدول بعد دقيقة، بالمواعيد الدقيقة إن سمح بها النظام؛ يُرجع رسالة خطأ أو null */
export async function testLater(card: CardData): Promise<string | null> {
  try {
    await ensureChannel();
    const exact = await exactAllowed().catch(() => false);
    await LocalNotifications.schedule({ notifications: [{ ...nativeNote(TEST_ID - 1, card, new Date(Date.now() + 60_000), exact), title: 'حبيبنا ﷺ — تجربة بعد دقيقة' }] });
    return exact ? null : 'جُدول الإشعار، لكن موعده تقريبي لأن المواعيد الدقيقة غير مفعّلة، فقد يتأخر قليلًا.';
  } catch (e) {
    return `لم يُجدول: ${errText(e)}`;
  }
}

/** يُرجع رسالة خطأ مفهومة، أو null إن نجح */
export async function showCard(card: CardData): Promise<string | null> {
  if (isNative) {
    // على الهاتف: إشعار تجريبي فوري
    try {
      await ensureChannel();
      await LocalNotifications.schedule({ notifications: [nativeNote(TEST_ID, card, null, false)] });
      return null;
    } catch (e) {
      return `لم يُرسل الإشعار: ${errText(e)}`;
    }
  }
  if (!notifySupported() || Notification.permission !== 'granted') return 'فعّل الإشعارات أولًا في المتصفح.';
  const opts: NotificationOptions = { body: short(card.text), icon: 'icon.svg', tag: 'qarib', lang: 'ar', dir: 'rtl' };
  const reg = await navigator.serviceWorker?.getRegistration();
  if (reg) await reg.showNotification(TITLE, opts); else new Notification(TITLE, opts);
  return null;
}

/** أوقات ثابتة للبطاقات الثلاث (قرار المستخدم): العاشرة صباحًا، والثالثة ظهرًا، والثامنة مساءً */
const TIMES = [10 * 60, 15 * 60, 20 * 60];
export function slots(_s?: Settings): number[] {
  return TIMES;
}
export const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** رقم اليوم المحلي (يتغيّر عند منتصف الليل بتوقيت الهاتف) */
export const dayNumber = (at: Date) => Math.floor((at.getTime() - at.getTimezoneOffset() * 60_000) / 86_400_000);

/** أبواب «يتخيّله فيها»: البطاقة الأولى كل يوم منها (قرار المستخدم) */
export const FEATURED = new Set(['الملامح والشكل', 'حياته اليومية']);
/** باب بطاقات الصلاة على النبي ﷺ (تذكير وصيغ الدلائل): كل ثلاثة أيام والجمعة، ولا يُخفى */
export const REMINDER = 'الصلاة عليه';
/** يوما بطاقات الأدعية: day % 7 (يوم 0 خميس، فالاثنين 4) */
const DUA_DAYS = [4, 0];
/** يوم «قالوا عنه»: الأربعاء في موعد 15:00 (قرار المستخدم 2026-11-10) */
const QALU_DAY = 6;
/** ثلاث بطاقات ثابتة في اليوم (قرار المستخدم) */
export const PER_DAY = 3;

/**
 * بطاقة الموعد k من يوم ما: نفس الحساب للإشعارات وللبطاقات الظاهرة في التطبيق.
 * الصباح من الملامح والحياة اليومية يومًا بعد يوم، وبقية المواعيد من بقية الأبواب.
 * بطاقات الصلاة عليه ﷺ (قرار المستخدم 2026-11-11): لم تعد خاصة بالمساء؛ الجمعة 15:00
 * حديث الجمعة، وفي غيرها بطاقة صلاة كل ثلاثة أيام في موعد يتبدّل (10 ثم 15 ثم 20).
 */
type Slot = 'fri' | 'rem' | 'dua' | 'qalu' | 'pic' | 'feat' | 'rest';
type Has = { fri: boolean; rem: boolean; dua: boolean; qalu: boolean; pic: boolean; split: boolean };
/** نوع الموعد k من يوم ما. الأنواع تتكرّر كل 126 يومًا (2 × 9 × 7) */
function slotType(day: number, k: number, has: Has): Slot {
  const friday = day % 7 === 1;
  const duaDay = DUA_DAYS.includes(day % 7) && has.dua;
  const qaluDay = day % 7 === QALU_DAY && has.qalu;
  // الجمعة ظهرًا: «فأكثروا عليّ من الصلاة فيه»
  if (friday && has.fri && k === 1) return 'fri';
  // بطاقات الأدعية متباعدة (قرار المستخدم): يومي الاثنين والخميس في موعد الظهر
  if (k === 1 && duaDay) return 'dua';
  // قول من «قالوا عنه» مرة في الأسبوع: الأربعاء ظهرًا
  if (k === 1 && qaluDay) return 'qalu';
  const noon = duaDay || qaluDay || (friday && has.fri);
  // بطاقة صلاة كل ثلاثة أيام (غير الجمعة)، موعدها يتبدّل؛ إن كان الظهر مأخوذًا فالمساء
  if (has.rem && !friday && day % 3 === 1) {
    let rk = Math.floor(day / 3) % 3;
    if (rk === 1 && noon) rk = 2;
    if (k === rk) return 'rem';
  }
  // «يوم الصورة» كل ثلاثة أيام (طلب المستخدم): الظهر، وإن كان الظهر مأخوذًا فالصباح
  if (day % 3 === 0 && has.pic && k === (noon ? 0 : 1)) return 'pic';
  // بطاقة الملامح والحياة اليومية صباحًا يومًا بعد يوم (قرار المستخدم)
  if (has.split && k === 0 && day % 2 === 0) return 'feat';
  return 'rest';
}
const PERIOD = 126;
const posCache = new Map<string, { per: Record<Slot, number>; before: Record<Slot, number>[] }>();
/**
 * ترتيب الموعد بين مواعيد نوعه منذ اليوم 0: كل نوع يتقدّم بما يستعمله فعلًا من مواعيد،
 * فلا تُتخطّى بطاقةٌ حين يأخذ الدعاءُ أو الصورةُ موعدها (كانت بعض البطاقات تنتظر أكثر من سنة).
 */
function slotIndex(day: number, k: number, has: Has): number {
  const key = `${+has.fri}${+has.rem}${+has.dua}${+has.qalu}${+has.pic}${+has.split}`;
  let t = posCache.get(key);
  if (!t) {
    const zero = (): Record<Slot, number> => ({ fri: 0, rem: 0, dua: 0, qalu: 0, pic: 0, feat: 0, rest: 0 });
    const run = zero(); const before: Record<Slot, number>[] = [];
    for (let i = 0; i < PERIOD * PER_DAY; i++) { before.push({ ...run }); run[slotType(Math.floor(i / PER_DAY), i % PER_DAY, has)]++; }
    t = { per: run, before }; posCache.set(key, t);
  }
  const type = slotType(day, k, has);
  const d = ((day % PERIOD) + PERIOD) % PERIOD;
  return Math.floor(day / PERIOD) * t.per[type] + t.before[d * PER_DAY + k][type];
}

export function cardFor(pool: CardData[], day: number, k: number): CardData {
  const fri = pool.filter((c) => c.chapter === REMINDER && c.friday);
  const rem = pool.filter((c) => c.chapter === REMINDER && !c.friday);
  const qalu = pool.filter((c) => c.qalu);
  const duas = pool.filter((c) => c.dua && c.chapter !== REMINDER && !c.qalu);
  const pics = pool.filter((c) => c.pic && c.chapter !== REMINDER && !c.dua && !c.qalu);
  const body = pool.filter((c) => c.chapter !== REMINDER && !c.dua && !c.pic && !c.qalu);
  const feat = body.filter((c) => FEATURED.has(c.chapter));
  const rest = body.filter((c) => !FEATURED.has(c.chapter));
  const has: Has = { fri: fri.length > 0, rem: rem.length > 0, dua: duas.length > 0, qalu: qalu.length > 0, pic: pics.length > 0, split: feat.length > 0 && rest.length > 0 };
  const type = slotType(day, k, has);
  const i = slotIndex(day, k, has);
  const list = type === 'fri' ? fri : type === 'rem' ? rem : type === 'qalu' ? qalu : type === 'dua' ? duas : type === 'pic' ? pics : type === 'feat' ? feat : has.split ? rest : body;
  if (list.length === 0) return (body.length ? body : pool)[(day * PER_DAY + k) % (body.length || pool.length)];
  return list[i % list.length];
}

/** جدولة الويب: تعمل والتطبيق مفتوح فقط (على الهاتف تُستعمل scheduleWeek) */
export function schedule(s: Settings, pick: (k: number) => CardData | null): () => void {
  if (!s.notifyOn || isNative) return () => {};
  const timers: number[] = [];
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  slots(s).forEach((m, k) => {
    if (m <= nowMin) return;
    timers.push(window.setTimeout(() => { const c = pick(k); if (c) void showCard(c); }, (m - nowMin) * 60_000));
  });
  return () => timers.forEach((t) => clearTimeout(t));
}

/** عدد الأيام المجدولة مقدّمًا (كانت 7؛ صارت 30 حتى لا تنقطع البطاقات عمّن يقرؤها دون فتح التطبيق) */
export const WEEK = 30;
/** إشعار قبل نفاد المواعيد بيومين: الضغط عليه يفتح التطبيق فيجدّدها */
const KEEP_ID = 9000;
/** إشعارات مراجعة الأسبوع: 8000 + رقم اليوم من الآن */
const QUIZ_ID = 8000;

export interface WeekSlot { id: number; at: Date; k: number; card: CardData; }
/** مواعيد الأيام الثلاثين القادمة وبطاقة كل موعد (للإشعارات ولنوافذ البطاقة) */
export function weekSlots(s: Settings, pool: CardData[]): WeekSlot[] {
  if (pool.length === 0) return [];
  const soon = Date.now() + 60_000, end = Date.now() + WEEK * 86_400_000;
  const out: WeekSlot[] = [];
  for (let d = 0; d <= WEEK; d++) {
    slots(s).forEach((m, k) => {
      const at = new Date();
      at.setDate(at.getDate() + d);
      at.setHours(Math.floor(m / 60), m % 60, 0, 0);
      if (at.getTime() < soon || at.getTime() > end) return;
      out.push({ id: d * 10 + k + 1, at, k, card: cardFor(pool, dayNumber(at), k) });
    });
  }
  return out;
}

/**
 * جدولة أسبوع قادم دفعة واحدة على الهاتف. بطاقة كل موعد تُحسب من رقم اليوم في
 * الترتيب الثابت للبطاقات، فلا تتغيّر ولا تتكرّر عند إعادة الجدولة في الأيام التالية.
 * تُلغى الجدولة السابقة أولًا، فاستدعاؤها عند كل فتح للتطبيق يعيد الجدولة.
 */
export async function scheduleWeek(s: Settings, pool: CardData[]): Promise<number> {
  if (!isNative) return 0;
  const pending = await LocalNotifications.getPending();
  const old = pending.notifications.filter((n) => n.id !== TEST_ID && n.id !== TEST_ID - 1);
  if (old.length) await LocalNotifications.cancel({ notifications: old.map((n) => ({ id: n.id })) });
  if (!s.notifyOn || pool.length === 0) return 0;
  if ((await LocalNotifications.checkPermissions()).display !== 'granted') return 0;
  await ensureChannel();
  const exact = await exactAllowed().catch(() => false);

  const list: ReturnType<typeof nativeNote>[] = weekSlots(s, pool).map((e) => nativeNote(e.id, e.card, e.at, exact));
  // إشعار «مراجعة الأسبوع» كل أحد 11:00 (قرار المستخدم)، بدءًا من الأحد الذي يسبقه ثلاثة أيام من التثبيت على الأقل
  const installed = Number(localStorage.getItem('firstOpen') ?? 0) || Date.now();
  for (let d = 0; d <= WEEK; d++) {
    const at = new Date(); at.setDate(at.getDate() + d); at.setHours(11, 0, 0, 0);
    if (dayNumber(at) % 7 !== 3 || at.getTime() < Date.now() + 60_000 || at.getTime() - installed < 3 * 86_400_000) continue;
    list.push({ id: QUIZ_ID + d, title: TITLE, body: 'مراجعة الأسبوع جاهزة: اختبر نفسك فيما مرّ بك من بطاقات ✦', largeBody: 'مراجعة الأسبوع جاهزة: أسئلة قصيرة عمّا مرّ بك من بطاقات هذا الأسبوع، وبعد كل جواب تظهر البطاقة نفسها ✦', channelId: CHANNEL, extra: { cardId: 'quiz' }, isExactNotification: exact, schedule: { at, allowWhileIdle: true } });
  }
  const keep = new Date(); keep.setDate(keep.getDate() + WEEK - 2); keep.setHours(12, 30, 0, 0);
  list.push({ id: KEEP_ID, title: TITLE, body: 'اضغط هنا لتستمر بطاقاتك في الوصول ✦', largeBody: 'لم تفتح «حبيبنا» منذ مدة؛ اضغط هنا مرة واحدة لتستمر بطاقاتك في الوصول ✦', channelId: CHANNEL, extra: { cardId: '' }, isExactNotification: false, schedule: { at: keep, allowWhileIdle: true } });
  if (list.length) await LocalNotifications.schedule({ notifications: list });
  return list.filter((n) => n.id < QUIZ_ID).length;
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
