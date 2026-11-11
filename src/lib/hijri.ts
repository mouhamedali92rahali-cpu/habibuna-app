// التاريخ الميلادي والهجري في أعلى صفحة البطاقات.
// البلد يُعرف من المنطقة الزمنية في الهاتف (بلا أي إذن). في البلدان التي تعتمد رؤية الهلال
// يُحسب أول الشهر من إمكان رؤيته مساء يوم الاقتران في عاصمة البلد (معيار عودة)، وفي غيرها تقويم أم القرى.
// ويُصحَّح آليًّا من الحقل `hijri` في cards.json المنشورة ({البلد: {"1448-6": "2026-11-21"}}) بعد الإعلان الرسمي.
import { Body, Equator, Horizon, Illumination, MakeTime, Observer, SearchMoonPhase, SearchRiseSet, AngleFromSun } from 'astronomy-engine';

type Place = { cc: string; lat: number; lon: number; sight: number | null };
// sight: الحدّ الأدنى لمعيار عودة V (5.65 بالعين المجرّدة، 2 بالمنظار)؛ null = أم القرى
const ZONES: Record<string, Place> = {
  'Africa/Tunis': { cc: 'TN', lat: 36.81, lon: 10.18, sight: 2 },
  'Africa/Casablanca': { cc: 'MA', lat: 34.02, lon: -6.83, sight: 5.65 },
  'Africa/El_Aaiun': { cc: 'MA', lat: 34.02, lon: -6.83, sight: 5.65 },
  'Africa/Algiers': { cc: 'DZ', lat: 36.75, lon: 3.06, sight: 2 },
  'Africa/Tripoli': { cc: 'LY', lat: 32.89, lon: 13.19, sight: 2 },
  'Africa/Cairo': { cc: 'EG', lat: 30.04, lon: 31.24, sight: 2 },
  'Africa/Nouakchott': { cc: 'MR', lat: 18.08, lon: -15.98, sight: 5.65 },
  'Asia/Amman': { cc: 'JO', lat: 31.95, lon: 35.93, sight: 2 },
  'Asia/Baghdad': { cc: 'IQ', lat: 33.31, lon: 44.37, sight: 2 },
  'Asia/Damascus': { cc: 'SY', lat: 33.51, lon: 36.29, sight: 2 },
  'Asia/Beirut': { cc: 'LB', lat: 33.89, lon: 35.5, sight: 2 },
  'Asia/Riyadh': { cc: 'SA', lat: 24.71, lon: 46.68, sight: null },
};
const GREG_LOCALE: Record<string, string> = { TN: 'ar-TN', DZ: 'ar-DZ', MA: 'ar-MA', LY: 'ar-LY' };
const HMONTHS = ['محرّم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'];

export type Overrides = Record<string, Record<string, string>>;

function place(): Place {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* */ }
  return ZONES[tz] ?? { cc: '', lat: 0, lon: 0, sight: null };
}

// يوم مدني محلّي (منتصف الليل بتوقيت الهاتف) كرقم أيام
const dayOf = (d: Date) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86_400_000);
const dateOfDay = (n: number) => { const d = new Date(n * 86_400_000); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12); };
const iso = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);

function umq(d: Date): { y: number; m: number; d: number } {
  const p = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(d);
  const g = (t: string) => parseInt(p.find((x) => x.type === t)?.value ?? '0', 10);
  return { y: g('year'), m: g('month'), d: g('day') };
}

// معيار عودة لإمكان رؤية الهلال مساء اليوم day في المكان pl
function visible(day: number, pl: Place): boolean {
  const obs = new Observer(pl.lat, pl.lon, 0);
  const noon = new Date(day * 86_400_000 + (12 - pl.lon / 15) * 3_600_000);
  const sunset = SearchRiseSet(Body.Sun, obs, -1, MakeTime(noon), 1);
  const moonset = SearchRiseSet(Body.Moon, obs, -1, MakeTime(noon), 1.5);
  if (!sunset || !moonset) return false;
  const lag = moonset.ut - sunset.ut;
  if (lag <= 0) return false;
  const best = sunset.AddDays((4 / 9) * lag);
  const alt = (b: Body) => { const e = Equator(b, best, obs, true, true); return Horizon(best, obs, e.ra, e.dec).altitude; };
  const arcv = alt(Body.Moon) - alt(Body.Sun);
  const arcl = AngleFromSun(Body.Moon, best);
  const distKm = Illumination(Body.Moon, best).geo_dist * 149_597_870.7;
  const sd = (Math.asin(1737.4 / distKm) * 180) / Math.PI * 60; // نصف القطر بالدقائق
  const w = sd * (1 - Math.cos((arcl * Math.PI) / 180));
  const v = arcv - (-0.1018 * w ** 3 + 0.7319 * w ** 2 - 6.3226 * w + 7.1651);
  return v >= (pl.sight ?? 2);
}

// أول يوم في الشهر الذي يبدأ بعد الاقتران conj (بالرؤية)
function monthStart(conj: Date, pl: Place): number {
  const c = dayOf(conj);
  for (let e = c; e <= c + 2; e++) if (visible(e, pl)) return e + 1;
  return c + 3;
}

const cache = new Map<string, string>();

export function hijriToday(now = new Date(), over: Overrides = {}): { greg: string; hijri: string } {
  const pl = place();
  const today = dayOf(now);
  const gregLoc = GREG_LOCALE[pl.cc] ?? 'ar';
  const greg = new Intl.DateTimeFormat(gregLoc + '-u-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const key = pl.cc + ':' + today + ':' + JSON.stringify(over[pl.cc] ?? {});
  let hij = cache.get(key);
  if (!hij) {
    hij = compute(today, pl, over[pl.cc] ?? {});
    cache.set(key, hij);
  }
  return { greg, hijri: hij };
}

function compute(today: number, pl: Place, ov: Record<string, string>): string {
  const fmt = (d: number, m: number, y: number) => `${d} ${HMONTHS[m - 1]} ${y} هـ`;
  // بدايات الأشهر القريبة: من أم القرى أو من الرؤية، ثم التصحيح الرسمي إن وُجد
  const starts: { day: number; y: number; m: number }[] = [];
  // آخر تصحيح رسمي معروف لهذا البلد: نبدأ منه ونعدّ الأشهر بعده بالرؤية مساء التاسع والعشرين
  const fixes = Object.values(ov).map((d) => Math.round(Date.parse(d + 'T00:00:00Z') / 86_400_000)).filter((d) => d <= today);
  const anchor = fixes.length ? Math.max(...fixes) : null;
  const t0 = MakeTime(dateOfDay(Math.min(today - 75, (anchor ?? today) - 15)));
  let t = t0;
  for (let i = 0; i < 16; i++) {
    const conj = SearchMoonPhase(0, t, 40);
    if (!conj) break;
    const cd = dayOf(conj.date);
    // اسم الشهر ورقم السنة من أم القرى في منتصف الشهر الذي يلي الاقتران
    const mid = umq(dateOfDay(cd + 12));
    let start = pl.sight === null ? cd + 12 - (mid.d - 1) : monthStart(conj.date, pl);
    const prev = starts[starts.length - 1];
    // بعد التصحيح الرسمي: الشهر 29 يومًا إن رُئي الهلال مساء التاسع والعشرين، وإلا 30 (كما يُعمل في الإعلان)
    if (pl.sight !== null && anchor !== null && prev && prev.day >= anchor) start = prev.day + (visible(prev.day + 28, pl) ? 29 : 30);
    const o = ov[`${mid.y}-${mid.m}`];
    if (o) start = Math.round(Date.parse(o + 'T00:00:00Z') / 86_400_000);
    starts.push({ day: start, y: mid.y, m: mid.m });
    if (start > today + 40) break;
    t = conj.AddDays(5);
  }
  const cur = starts.filter((s) => s.day <= today).pop();
  if (!cur) { const u = umq(dateOfDay(today)); return fmt(u.d, u.m, u.y); }
  return fmt(today - cur.day + 1, cur.m, cur.y);
}

export const _test = { compute, iso, ZONES };
