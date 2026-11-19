import { artNow } from './art';
import { registerPlugin } from '@capacitor/core';
import { isNative, dayNumber, type WeekSlot } from './notify';
import type { CardData } from './types';
import { WIDGET_LINES } from './widgetLines';
import { widgetLines, hijriFix } from './cards';
import { stripPlan, type Lines } from './strip';
import { loadSel, loadAdj, dayTimes, PRAYERS, PNAME, hhmm } from './prayer';
import { hijriToday } from './hijri';
import { taskFor, taskTime, taskDoneMap, type Task } from './tasks';
import { sunanFor } from './sunan';
import { kunFor } from './kunLines';
import type { Settings } from './types';
import { load } from './store';

interface PhoneSettingsPlugin {
  info(): Promise<{ manufacturer: string; brand: string }>;
  openAppSettings(): Promise<void>;
  openAutostart(): Promise<{ opened?: string }>;
  canOverlay(): Promise<{ allowed: boolean }>;
  openOverlaySettings(): Promise<void>;
  openPopupPermissions(): Promise<void>;
  schedulePopups(o: { items: { id: number; at: number; json: string; cardId: string }[] }): Promise<void>;
  previewPopup(o: { json: string; cardId: string }): Promise<{ shown: boolean }>;
  testPopup(o: { json: string; cardId: string }): Promise<void>;
  setPopupMode(o: { mode: string }): Promise<void>;
  closeCardViews(): Promise<void>;
  popupState(): Promise<{ inCall: boolean; media: boolean; dnd: boolean; ringing?: boolean; bubble?: boolean }>;
  takeOpenCard(): Promise<{ id: string | null }>;
  takePrays(): Promise<{ days: string }>;
  setFavIds(o: { ids: string }): Promise<void>;
  takeFavs(): Promise<{ ops: string }>;
  bgPopupState(): Promise<{ state: 'allowed' | 'denied' | 'unknown' }>;
  shareImage(o: { base64: string; text: string }): Promise<void>;
  setWidget(o: { items: string }): Promise<void>;
  setFormulas(o: { items: string; friday?: string; lines?: string; slots?: string }): Promise<void>;
  setWidgetHidden(o: { hidden: boolean }): Promise<void>;
  setPrayBase(o: { days: string }): Promise<void>;
  widgetState(): Promise<{ placed: boolean; canPin: boolean; hidden?: boolean }>;
  pinWidget(o?: { kind?: 'coin' | 'strip' }): Promise<{ asked: boolean }>;
  setHomeInfo(o: { days: string; prayers: string; tasks: string; rot: string }): Promise<void>;
  takeTaskDone(): Promise<{ days: string }>;
}
export const PhoneSettings = registerPlugin<PhoneSettingsPlugin>('PhoneSettings');

/** هواتف تُوقف التطبيقات المغلقة فتمسح إشعاراتها المجدولة، ما لم يُسمح لها بالتشغيل التلقائي */
const STRICT = ['xiaomi', 'redmi', 'poco', 'huawei', 'honor', 'oppo', 'realme', 'oneplus', 'vivo', 'iqoo', 'tecno', 'infinix'];

export type Maker = 'xiaomi' | 'huawei' | 'other-strict' | 'normal';
export async function phoneMaker(): Promise<Maker> {
  if (!isNative) return 'normal';
  try {
    const { manufacturer, brand } = await PhoneSettings.info();
    const m = `${manufacturer} ${brand}`.toLowerCase();
    if (/xiaomi|redmi|poco/.test(m)) return 'xiaomi';
    if (/huawei|honor/.test(m)) return 'huawei';
    return STRICT.some((k) => m.includes(k)) ? 'other-strict' : 'normal';
  } catch {
    return 'normal';
  }
}

/** بيانات نافذة البطاقة (public/popup.html): رقم الموعد k والرقم المعروض والبطاقة */
export const popupJson = (card: CardData, k: number, n: number, news = false) =>
  JSON.stringify({ slot: k, n, news, card: { id: card.id, kick: card.kick || '', chapter: card.chapter, title: card.title, text: card.text, source: card.source, grade: card.grade, theme: card.theme, dua: !!card.dua, qalu: !!card.qalu, dalail: !!card.dalail, weak: !!card.weak, shifa: !!card.shifa, abridged: !!card.abridged && !card.same, sharh: !!card.sharh,
    // ما يظهر داخل النافذة بزرّ «نص الحديث والشرح» (النسخة 3.35)
    matn: card.hadith && !card.same ? card.hadith.matn : '', narr: card.hadith?.narrator || '', excerpt: !!card.hadith?.excerpt,
    sharhText: card.sharh?.text || '', sharhSrc: card.sharh?.source || '', athar: card.athar || '',
    // الرسم داخل البطاقة تحت النص (2026-11-12): المسار المحلي في التطبيق
    art: (artNow.arts[card.id] ?? artNow.maps[card.id])?.fallback || '', artCap: (artNow.arts[card.id] ?? artNow.maps[card.id])?.caption || '' } });

/** جدولة نوافذ البطاقات على الشاشة لنفس مواعيد الإشعارات؛ قائمة فارغة تُلغيها */
export async function schedulePopups(entries: WeekSlot[], num: (id: string) => number, newsUntil = 0): Promise<void> {
  if (!isNative) return;
  // newsUntil: سطر «جديد ✦ زرّ الصلاة على شاشتك الرئيسية» في النوافذ قبل هذا الوقت (أسبوع، لمن لم يفعّله)
  await PhoneSettings.schedulePopups({ items: entries.map((e) => ({ id: e.id, at: e.at.getTime(), json: popupJson(e.card, e.k, num(e.card.id), e.at.getTime() < newsUntil), cardId: e.card.id })) });
}

/** زرّ الصلاة على الشاشة الرئيسية (تجربة 2026-11-10): صيغ «دلائل الخيرات» القصيرة، صيغة لكل يوم */
export async function sendFormulas(cards: CardData[]): Promise<void> {
  if (!isNative) return;
  const items = cards.filter((c) => c.dalail).flatMap((c) => c.text.split('\n')).map((l) => l.trim()).filter((l) => l && l.length <= 90);
  const fri = cards.find((c) => c.friday);
  const lines = stripLines();
  // الشريط مع أوقات الصلاة (2026-11-16): 31 يومًا من أمس، فيبقى الشريط صحيحًا وإن لم يُفتح التطبيق شهرًا
  const from = new Date(); from.setDate(from.getDate() - 1);
  const slots = stripPlan(lines, loadSel(), loadAdj(), hijriNow(), from, 31).map((x) => ({ at: x.at, t: x.t, s: x.s }));
  await PhoneSettings.setFormulas({ items: JSON.stringify(items), friday: fri ? fri.text : '', lines: JSON.stringify(lines), slots: JSON.stringify(slots) });
}

/** مواعيد البطاقات للزرّ على الشاشة الرئيسية: لون إطاره يتبع باب البطاقة الحالية ويتجدّد في الموعد القادم */
export async function sendWidget(entries: { at: number; k: number; card: CardData }[]): Promise<void> {
  if (!isNative) return;
  const items = entries.map((e) => ({ at: e.at, theme: e.card.theme, cardId: e.card.id }));
  await PhoneSettings.setWidget({ items: JSON.stringify(items) });
}

/** جمل الشريط: المنشورة في cards.json، ويُكمَّل ما ليس فيها من المرفقة (تذكيرات الأوقات والجمل الجديدة قبل نشرها) */
export function stripLines(): Lines {
  const B = WIDGET_LINES as unknown as Lines;
  const P = (widgetLines ?? null) as Lines | null;
  if (!P) return B;
  const add = (a: Lines['q'], b: Lines['q']) => [...a, ...b.filter((x) => !a.some((y) => y.t === x.t))];
  return { ...P, q: add(P.q, B.q), h: add(P.h, B.h), t: P.t ?? B.t };
}

/** تصحيحات التاريخ الهجري: الرسمية تغلب ما اختاره صاحب الهاتف */
export function hijriNow(): Record<string, Record<string, string>> {
  const m = load<Record<string, Record<string, string>>>('hijriMine', {});
  const r = { ...m };
  for (const k of Object.keys(hijriFix)) r[k] = { ...(m[k] ?? {}), ...hijriFix[k] };
  return r;
}

/** أدوات الشاشة الرئيسية الثلاث (تجربة للمستخدم وحده، 2026-11-18): التاريخ، والصلاة القادمة، والمهمة الخفيّة.
 * تُحسب هنا لثلاثين يومًا من أمس وتُرسل مرة واحدة، فتتجدّد الأدوات وحدها وإن لم يُفتح التطبيق */
export async function sendHomeInfo(s: Settings, tasks: Task[]): Promise<void> {
  if (!isNative) return;
  const fix = hijriNow(), sel = loadSel(), adj = loadAdj(), done = taskDoneMap();
  const days: { start: number; greg: string; hijri: string; sunan: string[]; kun: string[] }[] = [];
  const prayers: { at: number; name: string; hm: string }[] = [];
  const tk: { start: number; at: number; day: number; text: string; hm: string; done: boolean }[] = [];
  for (let i = -1; i <= 30; i++) {
    const start = new Date(); start.setDate(start.getDate() + i); start.setHours(0, 0, 0, 0);
    const noon = new Date(start); noon.setHours(12);
    const h = hijriToday(noon, fix);
    days.push({ start: start.getTime(), greg: h.greg, hijri: h.hijri, sunan: sunanFor(noon, fix).map((x) => x.line), kun: kunFor(noon) });
    const t = sel ? dayTimes(sel, noon, adj) : null;
    if (t) for (const p of PRAYERS) prayers.push({ at: t[p].getTime(), name: PNAME[p], hm: hhmm(t[p]) });
    if (s.taskOn !== false && tasks.length && i >= 0) {
      const day = dayNumber(noon), m = taskTime(s, day), at = new Date(start); at.setHours(Math.floor(m / 60), m % 60);
      tk.push({ start: start.getTime(), at: at.getTime(), day, text: taskFor(tasks, day).text, hm: hhmm(at), done: !!done[day] });
    }
  }
  // تذكير الوقت (أذكار الصباح، الضحى، أذكار المساء، الوتر) كما في التطبيق: يبقى حتى الموضع التالي في الخطة
  const y = new Date(); y.setDate(y.getDate() - 1);
  const rot = stripPlan(stripLines(), sel, adj, fix, y, 32).map((x) => ({ at: x.at, line: ['morning', 'duha', 'evening', 'witr'].includes(x.kind) ? x.t.replace(/^﴿|﴾$/g, '') : '' }));
  await PhoneSettings.setHomeInfo({ days: JSON.stringify(days), prayers: JSON.stringify(prayers), tasks: JSON.stringify(tk), rot: JSON.stringify(rot) });
}
