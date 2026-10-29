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
  takeOpenCard(): Promise<{ id: string | null }>;
}
export const PhoneSettings = registerPlugin<PhoneSettingsPlugin>('PhoneSettings');

/** هواتف تُوقف التطبيقات المغلقة فتمسح إشعاراتها المجدولة، ما لم يُسمح لها بالتشغيل التلقائي */
const STRICT = ['xiaomi', 'redmi', 'poco', 'huawei', 'honor', 'oppo', 'realme', 'oneplus', 'vivo', 'iqoo', 'tecno', 'infinix'];

export type Maker = 'xiaomi' | 'other-strict' | 'normal';
export async function phoneMaker(): Promise<Maker> {
  if (!isNative) return 'normal';
  try {
    const { manufacturer, brand } = await PhoneSettings.info();
    const m = `${manufacturer} ${brand}`.toLowerCase();
    if (/xiaomi|redmi|poco/.test(m)) return 'xiaomi';
    return STRICT.some((k) => m.includes(k)) ? 'other-strict' : 'normal';
  } catch {
    return 'normal';
  }
}

/** بيانات نافذة البطاقة (public/popup.html): رقم الموعد k والرقم المعروض والبطاقة */
export const popupJson = (card: CardData, k: number, n: number) =>
  JSON.stringify({ slot: k, n, card: { id: card.id, chapter: card.chapter, title: card.title, text: card.text, source: card.source, grade: card.grade, theme: card.theme, dua: !!card.dua, weak: !!card.weak } });

/** جدولة نوافذ البطاقات على الشاشة لنفس مواعيد الإشعارات؛ قائمة فارغة تُلغيها */
export async function schedulePopups(entries: WeekSlot[], num: (id: string) => number): Promise<void> {
  if (!isNative) return;
  await PhoneSettings.schedulePopups({ items: entries.map((e) => ({ id: e.id, at: e.at.getTime(), json: popupJson(e.card, e.k, num(e.card.id)), cardId: e.card.id })) });
}
