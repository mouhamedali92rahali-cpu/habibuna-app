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

// معيار عودة لإمكان رؤية الهلال مساء اليوم day في المكان pl: 'yes' أو 'no' أو 'maybe'
// (maybe: قريب من الحدّ بأقل من 1.5 درجة، فقد يُرى وقد لا يُرى، ولا يُجزم فيه بالحساب)
type Vis = 'yes' | 'no' | 'maybe';
const visCache = new Map<string, Vis>();
function visible(day: number, pl: Place): Vis {
  const key = pl.cc + day;
  const hit = visCache.get(key);
  if (hit) return hit;
  const obs = new Observer(pl.lat, pl.lon, 0);
  const noon = new Date(day * 86_400_000 + (12 - pl.lon / 15) * 3_600_000);
  const sunset = SearchRiseSet(Body.Sun, obs, -1, MakeTime(noon), 1);
  const moonset = SearchRiseSet(Body.Moon, obs, -1, MakeTime(noon), 1.5);
  let r: Vis = 'no';
  if (sunset && moonset && moonset.ut > sunset.ut) {
    const best = sunset.AddDays((4 / 9) * (moonset.ut - sunset.ut));
    const alt = (b: Body) => { const e = Equator(b, best, obs, true, true); return Horizon(best, obs, e.ra, e.dec).altitude; };
    const arcv = alt(Body.Moon) - alt(Body.Sun);
    const arcl = AngleFromSun(Body.Moon, best);
    const distKm = Illumination(Body.Moon, best).geo_dist * 149_597_870.7;
    const sd = (Math.asin(1737.4 / distKm) * 180) / Math.PI * 60; // نصف القطر بالدقائق
    const w = sd * (1 - Math.cos((arcl * Math.PI) / 180));
    const v = arcv - (-0.1018 * w ** 3 + 0.7319 * w ** 2 - 6.3226 * w + 7.1651);
    const th = pl.sight ?? 2;
    r = v >= th + MARGIN ? 'yes' : v < th - MARGIN ? 'no' : 'maybe';
  }
  visCache.set(key, r);
  return r;
}
const MARGIN = 1.5;

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

// كل شهر بداية مؤكّدة (lo == hi) أو محتملة بين يومين (lo < hi) حين تكون الرؤية حدّية.
// التطبيق لا يكتب رقم اليوم ما دام الشكّ قائمًا، ولا يكتب التاريخ الهجري يوم الانتقال المشكوك فيه؛
// ويزول الشكّ بتصحيح رسمي في cards.json، أو حين تلتقي الاحتمالات في شهر لاحق.
type Month = { lo: number; hi: number; y: number; m: number };
const fmt = (d: number, m: number, y: number) => `${d} ${HMONTHS[m - 1]} ${y} هـ`;
function monthsFor(today: number, pl: Place, ov: Record<string, string>): Month[] {
  const months: Month[] = [];
  const fixes = Object.values(ov).map((d) => Math.round(Date.parse(d + 'T00:00:00Z') / 86_400_000)).filter((d) => d <= today);
  const anchor = fixes.length ? Math.max(...fixes) : null;
  let t = MakeTime(dateOfDay(Math.min(today - 75, (anchor ?? today) - 15)));
  for (let i = 0; i < 16; i++) {
    const conj = SearchMoonPhase(0, t, 40);
    if (!conj) break;
    const cd = dayOf(conj.date);
    // اسم الشهر ورقم السنة من أم القرى في منتصف الشهر الذي يلي الاقتران
    const mid = umq(dateOfDay(cd + 12));
    let lo: number, hi: number;
    const prev = months[months.length - 1];
    if (pl.sight === null) {
      lo = hi = cd + 12 - (mid.d - 1);
    } else if (prev) {
      // كما في البلاغ الرسمي: يُتحرّى الهلال مساء التاسع والعشرين، فإن لم يُرَ أُكمل الشهر ثلاثين
      const c: number[] = [];
      for (let s0 = prev.lo; s0 <= prev.hi; s0++) {
        const v = visible(s0 + 28, pl);
        if (v !== 'no') c.push(s0 + 29);
        if (v !== 'yes') c.push(s0 + 30);
      }
      lo = Math.min(...c); hi = Math.max(...c);
    } else {
      // أول شهر في الحساب: بعد أول مساء يُرى فيه الهلال
      const c: number[] = [];
      let e = cd;
      for (; e <= cd + 2; e++) { const v = visible(e, pl); if (v !== 'no') c.push(e + 1); if (v === 'yes') break; }
      if (e > cd + 2) c.push(cd + 3);
      lo = Math.min(...c); hi = Math.max(...c);
    }
    const o = ov[`${mid.y}-${mid.m}`];
    if (o) lo = hi = Math.round(Date.parse(o + 'T00:00:00Z') / 86_400_000);
    months.push({ lo, hi, y: mid.y, m: mid.m });
    if (lo > today + 40) break;
    t = conj.AddDays(5);
  }
  return months;
}

// التاريخ يُكتب دائمًا كاملًا (قرار المستخدم 2026-11-11): في الشهر المشكوك يُؤخذ الاحتمال الأبعد (أن يُكمل الشهر الماضي)،
// وهو نفسه الخيار العريض في سؤال «هل اليوم في بلدك»، ومن رأى غيره في بلده صحّحه بضغطة.
function compute(today: number, pl: Place, ov: Record<string, string>): string {
  const cur = monthsFor(today, pl, ov).filter((s) => s.hi <= today).pop();
  if (!cur) { const u = umq(dateOfDay(today)); return fmt(u.d, u.m, u.y); }
  return fmt(today - cur.hi + 1, cur.m, cur.y);
}

/** سؤال الشهر (ما لم يصل تصحيح رسمي لهذا الشهر، وما لم يختر صاحب الهاتف): «هل اليوم في بلدك …؟» بثلاثة خيارات
 *  هي يوم الحساب وما قبله وما بعده، وتتقدّم مع الأيام (30/1/2 ثم 1/2/3 ثم 2/3/4…) حتى يختار؛ يبدأ ليلة أول الشهر. */
export function hijriAsk(now = new Date(), over: Overrides = {}): { id: string; cc: string; key: string; calc: string; options: { start: string; label: string }[] } | null {
  const pl = place();
  if (!pl.cc || pl.cc === 'SA') return null;
  const today = dayOf(now);
  const ov = over[pl.cc] ?? {};
  const months = monthsFor(today, pl, ov);
  let i = -1;
  months.forEach((s, j) => { if (s.lo <= today + 1) i = j; });
  if (i < 1) return null;
  const cur = months[i], prev = months[i - 1];
  const key = `${cur.y}-${cur.m}`;
  if (ov[key]) return null;
  const base = cur.lo === cur.hi ? cur.lo : cur.hi; // بداية الحساب (وفي الشكّ: الأرجح أن يُكمل الشهر الماضي)
  const opts: { s: number; label: string }[] = [];
  for (const s0 of [base - 1, base, base + 1]) {
    let label: string, st = s0;
    if (s0 <= today) label = fmt(today - s0 + 1, cur.m, cur.y);
    else {
      // اليوم من الشهر الماضي: إن كان الثلاثين فالشهر الجديد يبدأ غدًا حتمًا
      const d = today - prev.lo + 1; if (d > 30) continue;
      label = fmt(d, prev.m, prev.y); if (d === 30) st = today + 1;
    }
    if (!opts.some((o) => o.label === label)) opts.push({ s: st, label });
  }
  // من اليمين: الأصغر يومًا (أي البداية الأبعد)
  const options = opts.sort((a, b) => b.s - a.s).map((o) => ({ start: iso(o.s), label: o.label }));
  return options.length > 1 ? { id: `${pl.cc}-${key}`, cc: pl.cc, key, calc: iso(base), options } : null;
}

export const _test = { compute, iso, ZONES, hijriAsk };
