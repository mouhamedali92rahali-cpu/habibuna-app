export type Theme = 'emerald' | 'navy' | 'plum' | 'brown' | 'slate' | 'ivory';
export interface Hadith { matn: string; narrator: string; excerpt: boolean; }
export interface CardData { id: string; chapter: string; title: string; text: string; source: string; grade: string; theme: Theme; long: boolean; hadith: Hadith | null; sharh?: { text: string; source: string }; friday?: boolean; dua?: boolean;
  weak?: boolean; }
export interface Settings { perDay: number; from: string; to: string; notifyOn: boolean; popupOn?: boolean; }
