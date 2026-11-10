export type Theme = 'emerald' | 'navy' | 'plum' | 'brown' | 'slate' | 'ivory';
export interface Hadith { matn: string; narrator: string; excerpt: boolean; }
export interface CardData { id: string; chapter: string; title: string; text: string; source: string; grade: string; theme: Theme; long: boolean; hadith: Hadith | null; sharh?: { text: string; source: string }; friday?: boolean; dua?: boolean;
  weak?: boolean; shifa?: boolean; /** نص البطاقة يطابق نص الحديث: يُخفى زرّ «نص الحديث كاملًا» ويُذكر الراوي في سطر المصدر */ same?: boolean; /** قول من باب «قالوا عنه»: title = القائل، grade = وصفه وسطر الترجمة */ qalu?: boolean;
  /** للبطاقة رسم أو خريطة (build-art.py): تأتي في «يوم الصورة» كل ثلاثة أيام */
  pic?: boolean; }
export interface Settings { perDay: number; from: string; to: string; notifyOn: boolean; popupOn?: boolean; fontScale?: number; popupMode?: 'full' | 'bubble' | 'unlock'; /* unlock حُذف في 3.22، ويُعامَل كـ full */ }
