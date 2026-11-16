import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';
import { GROUPS, dayTimes, type Adj, type PrayerSel } from './prayer';
import { sunanFor, type Sunna } from './sunan';
import { dayNumber } from './notify';
import type { Overrides } from './hijri';

/**
 * شريط الصلاة مع أوقات الصلاة (قرار المستخدم 2026-11-16، المجموعة widget5):
 * يتبدّل ست مرات في اليوم: بعد الفجر أذكار الصباح، وفي الضحى (بعد الشروق بعشرين دقيقة) صلاة الضحى،
 * وبعد الظهر جملة عادية، وبعد العصر أذكار المساء، وبعد المغرب جملة عادية، وبعد العشاء الوتر.
 * التذكير نفسه يظهر في التطبيق تحت التاريخ في الوقت نفسه. أيام السنن مقدَّمة على الجمل العادية:
 * صيام الغد بعد المغرب، وسنن اليوم (العشر، ليلة القدر، شوّال، شعبان، المحرّم) بعد الظهر.
 * الجمعة بعد الظهر حديث الجمعة، والخميس بعد المغرب (ليلة الجمعة) من فضل الصلاة عليه ﷺ.
 * التطبيق يحسب 30 يومًا ويرسلها إلى الشريط؛ إن نفدت رجع الشريط إلى طريقته القديمة (11 و16 و21).
 */
export interface Line { t: string; s: string; g?: string; full?: string }
export interface Lines { q: Line[]; h: Line[]; s: Line[]; f: Line; t?: Record<Timed, Line[]> }
export type Timed = 'morning' | 'duha' | 'evening' | 'witr';
export interface StripItem { at: number; t: string; s: string; kind: Timed | 'q' | 'h' | 's' | 'f' | 'sunna'; full?: string; g?: string; sid?: string }

export const DUHA_AFTER_SUNRISE = 20 * 60_000;
// إن لم يُعرف البلد: أوقات تقريبية ثابتة
const FALLBACK = [5 * 60 + 30, 8 * 60, 13 * 60, 16 * 60, 18 * 60 + 30, 20 * 60];

const pick = <T,>(a: T[], i: number): T => a[((i % a.length) + a.length) % a.length];
// السنن الطويلة (شهرًا أو أسبوعًا) لا تأخذ مكان الجملة العادية كل يوم، بل يومًا من ثلاثة
const LONG = new Set(['shawwal', 'shaban', 'muharram']);

function sunrise(sel: PrayerSel, day: Date): Date | null {
  const g = GROUPS.find((x) => x.id === sel.group);
  if (!g) return null;
  const cities = sel.city ? g.cities.filter((c) => c[0] === sel.city) : g.cities;
  if (!cities.length) return null;
  // الشروق لا يتغيّر بطريقة الحساب؛ نأخذ أكثر المدن تأخّرًا كبقية المواقيت
  return new Date(Math.max(...cities.map((c) => new PrayerTimes(new Coordinates(c[1], c[2]), day, CalculationMethod.MuslimWorldLeague()).sunrise.getTime())));
}

/** أوقات المواضع الستة ليوم ما (ملّي ثانية) */
export function dayStops(sel: PrayerSel | null, adj: Adj, day: Date): number[] {
  const t = sel ? dayTimes(sel, day, adj) : null;
  const sr = sel ? sunrise(sel, day) : null;
  if (t && sr) return [t.fajr.getTime(), sr.getTime() + DUHA_AFTER_SUNRISE, t.dhuhr.getTime(), t.asr.getTime(), t.maghrib.getTime(), t.isha.getTime()];
  return FALLBACK.map((m) => { const d = new Date(day); d.setHours(Math.floor(m / 60), m % 60, 0, 0); return d.getTime(); });
}

const sunnaItem = (x: Sunna, at: number): StripItem => ({ at, t: x.line, s: x.source, kind: 'sunna', full: x.matn, g: x.grade, sid: x.id });

/** خطة الشريط من بداية اليوم لعدد من الأيام */
export function stripPlan(lines: Lines, sel: PrayerSel | null, adj: Adj, fix: Overrides, from: Date, days = 30): StripItem[] {
  const out: StripItem[] = [];
  const T = lines.t;
  for (let i = 0; i < days; i++) {
    const day = new Date(from); day.setDate(day.getDate() + i); day.setHours(12, 0, 0, 0);
    const n = dayNumber(day);
    const stops = dayStops(sel, adj, day);
    const wd = day.getDay();
    // السنن: ما يُنبَّه عليه في اليوم السابق («غدًا …») يكون بعد المغرب، وغيره بعد الظهر
    const su = sunanFor(day, fix).filter((x) => x.id !== 'jumua' && (!LONG.has(x.id) || n % 3 === 0));
    const tomorrow = su.filter((x) => x.line.startsWith('غدًا'));
    const today = su.filter((x) => !x.line.startsWith('غدًا'));
    const reg = (k: 0 | 1, at: number): StripItem => {
      const o = (n + k) % 2 === 0 ? pick(lines.q, n) : pick(lines.h, n);
      return { at, t: o.t, s: o.s, kind: (n + k) % 2 === 0 ? 'q' : 'h', g: o.g, full: o.full };
    };
    const timed = (k: Timed, at: number): StripItem | null => {
      const a = T?.[k];
      if (!a?.length) return null;
      const o = pick(a, n);
      return { at, t: o.t, s: o.s, kind: k, g: o.g, full: o.full };
    };
    const items: (StripItem | null)[] = [
      timed('morning', stops[0]) ?? reg(0, stops[0]),
      timed('duha', stops[1]) ?? reg(1, stops[1]),
      wd === 5 ? { at: stops[2], t: lines.f.t, s: lines.f.s, kind: 'f' } : today.length ? sunnaItem(pick(today, n), stops[2]) : reg(0, stops[2]),
      timed('evening', stops[3]) ?? reg(1, stops[3]),
      tomorrow.length ? sunnaItem(pick(tomorrow, n), stops[4])
        : wd === 4 ? { at: stops[4], ...pick(lines.s, Math.floor(n / 7)), kind: 's' } : reg(1, stops[4]),
      timed('witr', stops[5]) ?? reg(0, stops[5]),
    ];
    for (const x of items) if (x) out.push(x);
  }
  return out;
}

/** ما يظهر الآن (آخر موضع حان وقته) */
export function stripNow(plan: StripItem[], now = Date.now()): StripItem | null {
  let cur: StripItem | null = null;
  for (const x of plan) if (x.at <= now && (!cur || x.at > cur.at)) cur = x;
  return cur;
}
