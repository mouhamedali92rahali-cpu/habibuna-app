export type Theme = 'emerald' | 'navy' | 'plum' | 'brown' | 'slate' | 'ivory';
export interface Hadith { matn: string; narrator: string; excerpt: boolean; }
export interface CardData { id: string; chapter: string; title: string; text: string; source: string; grade: string; theme: Theme; long: boolean; hadith: Hadith | null; sharh?: { text: string; source: string }; friday?: boolean; dua?: boolean;
  weak?: boolean; shifa?: boolean; /** نص البطاقة مختصر من حديث أطول: سطر «اختصرنا الحديث…» ويظهر زرّ «نص الحديث كاملًا» دائمًا (قرار المستخدم 2026-11-11) */ abridged?: boolean; /** نص البطاقة يطابق نص الحديث: يُخفى زرّ «نص الحديث كاملًا» ويُذكر الراوي في سطر المصدر */ same?: boolean; /** قول من باب «قالوا عنه»: title = القائل، grade = وصفه وسطر الترجمة */ qalu?: boolean; /** «أثر اليوم»: عمل صغير من الحديث نفسه، يظهر تحت البطاقة بعد «✦ جرّب:» (النسخة 3.37) */ athar?: string; /** صيغة من «دلائل الخيرات» في موعد التذكير المسائي (النسخة 3.39) */ dalail?: boolean; /** العلامة فوق النص بدل «من مواقف النبي ﷺ» (الدفعة 14: «من أقوال أصحابه عنه ﷺ») */ kick?: string;
  /** للبطاقة رسم أو خريطة (build-art.py): تأتي في «يوم الصورة» كل ثلاثة أيام */
  pic?: boolean; }
export interface Settings { perDay: number; from: string; to: string; notifyOn: boolean; popupOn?: boolean; fontScale?: number; popupMode?: 'full' | 'bubble' | 'unlock'; /* unlock حُذف في 3.22، ويُعامَل كـ full */
  /** أوقات البطاقات الثلاث بالدقائق (الأصل 10:00 و15:00 و20:00؛ يغيّرها صاحب الهاتف داخل مجال كل موعد) */
  times?: number[];
  /** المهام الخفيّة (مفعّلة افتراضيًّا)، ووقت إشعارها: null = وقت مختلف كل يوم */
  taskOn?: boolean; taskAt?: number | null; lockDay?: boolean; }
