import { registerPlugin } from '@capacitor/core';
import { isNative, type WeekSlot } from './notify';
import type { CardData } from './types';

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
  bgPopupState(): Promise<{ state: 'allowed' | 'denied' | 'unknown' }>;
  shareImage(o: { base64: string; text: string }): Promise<void>;
  setWidget(o: { items: string }): Promise<void>;
  setFormulas(o: { items: string; friday?: string }): Promise<void>;
  setWidgetHidden(o: { hidden: boolean }): Promise<void>;
  setPrayBase(o: { days: string }): Promise<void>;
  widgetState(): Promise<{ placed: boolean; canPin: boolean; hidden?: boolean }>;
  pinWidget(o?: { kind?: 'coin' | 'strip' }): Promise<{ asked: boolean }>;
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
  JSON.stringify({ slot: k, n, news, card: { id: card.id, chapter: card.chapter, title: card.title, text: card.text, source: card.source, grade: card.grade, theme: card.theme, dua: !!card.dua, qalu: !!card.qalu, dalail: !!card.dalail, weak: !!card.weak, shifa: !!card.shifa, sharh: !!card.sharh,
    // ما يظهر داخل النافذة بزرّ «نص الحديث والشرح» (النسخة 3.35)
    matn: card.hadith && !card.same ? card.hadith.matn : '', narr: card.hadith?.narrator || '', excerpt: !!card.hadith?.excerpt,
    sharhText: card.sharh?.text || '', sharhSrc: card.sharh?.source || '', athar: card.athar || '' } });

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
  await PhoneSettings.setFormulas({ items: JSON.stringify(items), friday: fri ? fri.text : '' });
}

/** مواعيد البطاقات للزرّ على الشاشة الرئيسية: لون إطاره يتبع باب البطاقة الحالية ويتجدّد في الموعد القادم */
export async function sendWidget(entries: { at: number; k: number; card: CardData }[]): Promise<void> {
  if (!isNative) return;
  const items = entries.map((e) => ({ at: e.at, theme: e.card.theme, cardId: e.card.id }));
  await PhoneSettings.setWidget({ items: JSON.stringify(items) });
}
