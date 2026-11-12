import { CalculationMethod, CalculationParameters, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan';
import { load, save } from './store';

/**
 * خط الصلاة القادمة تحت التاريخ (قرارات المستخدم 2026-11-12):
 * - بلا إذن الموقع: البلد من المنطقة الزمنية، والمدينة يختارها الشخص من قائمة.
 * - قبل الاختيار: وقت البلد عمومًا = أكثر مدنه تأخّرًا لكل صلاة، حتى لا يصلّي أحد قبل الوقت في مدينته.
 * - تونس بطريقتها (الفجر 18° والعشاء 18°، طريقة «Tunisia» في aladhan)؛ وما لم نتحقّق منه يأخذ أكثر الطرق تأخّرًا في الفجر والعشاء.
 * - «اضبط المواقيت على أذان مسجدك»: ±دقائق لكل صلاة في الهاتف وحده.
 */
export const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type Prayer = (typeof PRAYERS)[number];
export const PNAME: Record<Prayer, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

type City = [name: string, lat: number, lon: number];
interface Group { id: string; name: string; tz: string[]; tn?: boolean; cities: City[] }

export const GROUPS: Group[] = [
  { id: 'TN', name: 'تونس', tz: ['Africa/Tunis'], tn: true, cities: [
    ['تونس', 36.806, 10.181], ['أريانة', 36.862, 10.195], ['بن عروس', 36.753, 10.218], ['منوبة', 36.808, 10.097], ['نابل', 36.456, 10.737],
    ['زغوان', 36.402, 10.143], ['بنزرت', 37.274, 9.874], ['باجة', 36.726, 9.182], ['جندوبة', 36.501, 8.780], ['طبرقة', 36.954, 8.758],
    ['الكاف', 36.175, 8.705], ['سليانة', 36.085, 9.371], ['سوسة', 35.826, 10.636], ['المنستير', 35.778, 10.826], ['المهدية', 35.504, 11.062],
    ['صفاقس', 34.740, 10.760], ['القيروان', 35.678, 10.096], ['القصرين', 35.167, 8.836], ['سيدي بوزيد', 35.038, 9.484], ['قفصة', 34.425, 8.784],
    ['توزر', 33.920, 8.134], ['قبلي', 33.704, 8.969], ['قابس', 33.882, 10.098], ['مدنين', 33.354, 10.505], ['جربة', 33.875, 10.857],
    ['بن قردان', 33.138, 11.220], ['تطاوين', 32.930, 10.451]] },
  { id: 'DZ', name: 'الجزائر', tz: ['Africa/Algiers'], cities: [
    ['الجزائر العاصمة', 36.753, 3.059], ['وهران', 35.697, -0.633], ['قسنطينة', 36.365, 6.615], ['عنابة', 36.900, 7.766], ['سطيف', 36.190, 5.414],
    ['باتنة', 35.556, 6.174], ['تلمسان', 34.878, -1.315], ['البليدة', 36.470, 2.828], ['بجاية', 36.751, 5.084], ['بسكرة', 34.850, 5.728],
    ['ورقلة', 31.949, 5.325], ['بشار', 31.617, -2.217], ['تمنراست', 22.785, 5.523]] },
  { id: 'MA', name: 'المغرب', tz: ['Africa/Casablanca', 'Africa/El_Aaiun'], cities: [
    ['الرباط', 34.020, -6.832], ['الدار البيضاء', 33.573, -7.590], ['فاس', 34.033, -5.000], ['مراكش', 31.629, -7.981], ['طنجة', 35.759, -5.834],
    ['مكناس', 33.895, -5.555], ['أكادير', 30.427, -9.598], ['وجدة', 34.681, -1.908], ['تطوان', 35.578, -5.368], ['العيون', 27.154, -13.195]] },
  { id: 'LY', name: 'ليبيا', tz: ['Africa/Tripoli'], cities: [
    ['طرابلس', 32.887, 13.191], ['بنغازي', 32.117, 20.068], ['مصراتة', 32.377, 15.092], ['الزاوية', 32.757, 12.728], ['سبها', 27.037, 14.426]] },
  { id: 'EG', name: 'مصر', tz: ['Africa/Cairo'], cities: [
    ['القاهرة', 30.044, 31.236], ['الإسكندرية', 31.200, 29.919], ['الجيزة', 30.013, 31.209], ['أسيوط', 27.180, 31.183], ['أسوان', 24.089, 32.899]] },
  { id: 'MR', name: 'موريتانيا', tz: ['Africa/Nouakchott'], cities: [
    ['نواكشوط', 18.079, -15.965], ['نواذيبو', 20.942, -17.038], ['كيفة', 16.620, -11.404], ['النعمة', 16.617, -7.256], ['أطار', 20.517, -13.050]] },
  { id: 'SA', name: 'السعودية', tz: ['Asia/Riyadh'], cities: [
    ['مكة', 21.389, 39.858], ['المدينة', 24.468, 39.611], ['الرياض', 24.713, 46.675], ['جدة', 21.485, 39.193], ['الدمام', 26.434, 50.104]] },
  { id: 'FR', name: 'فرنسا', tz: ['Europe/Paris'], cities: [
    ['باريس', 48.857, 2.352], ['ليون', 45.764, 4.836], ['مرسيليا', 43.297, 5.381], ['تولوز', 43.605, 1.444], ['نيس', 43.710, 7.262],
    ['ليل', 50.629, 3.057], ['ستراسبورغ', 48.573, 7.752], ['بوردو', 44.838, -0.579], ['نانت', 47.218, -1.554], ['مونبلييه', 43.611, 3.877],
    ['رين', 48.117, -1.678]] },
  { id: 'DE', name: 'ألمانيا', tz: ['Europe/Berlin'], cities: [
    ['برلين', 52.520, 13.405], ['هامبورغ', 53.551, 9.994], ['ميونخ', 48.135, 11.582], ['كولونيا', 50.938, 6.960], ['فرانكفورت', 50.110, 8.682]] },
  { id: 'BE', name: 'بلجيكا', tz: ['Europe/Brussels'], cities: [['بروكسل', 50.850, 4.352], ['أنتويرب', 51.219, 4.402], ['لياج', 50.633, 5.567]] },
  { id: 'IT', name: 'إيطاليا', tz: ['Europe/Rome'], cities: [['روما', 41.903, 12.496], ['ميلانو', 45.464, 9.190], ['نابولي', 40.852, 14.268], ['باليرمو', 38.116, 13.361]] },
  { id: 'US-E', name: 'أمريكا (الشرق)', tz: ['America/New_York', 'America/Detroit'], cities: [['نيويورك', 40.713, -74.006], ['واشنطن', 38.907, -77.037], ['ديترويت', 42.331, -83.046], ['أتلانتا', 33.749, -84.388], ['ميامي', 25.762, -80.192]] },
  { id: 'US-C', name: 'أمريكا (الوسط)', tz: ['America/Chicago'], cities: [['شيكاغو', 41.878, -87.630], ['هيوستن', 29.760, -95.370], ['دالاس', 32.777, -96.797]] },
  { id: 'US-W', name: 'أمريكا (الغرب)', tz: ['America/Los_Angeles'], cities: [['لوس أنجلوس', 34.052, -118.244], ['سان فرانسيسكو', 37.775, -122.419], ['سياتل', 47.606, -122.332]] },
  { id: 'CA-E', name: 'كندا (الشرق)', tz: ['America/Toronto', 'America/Montreal'], cities: [['تورنتو', 43.653, -79.383], ['مونتريال', 45.502, -73.567], ['أوتاوا', 45.421, -75.697]] },
];

const tzNow = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } };
export const groupOfPhone = (): Group | undefined => GROUPS.find((g) => g.tz.includes(tzNow()));

export interface PrayerSel { group: string; city?: string }
export type Adj = Partial<Record<Prayer, number>>;
export const loadSel = (): PrayerSel | null => {
  const s = load<PrayerSel | null>('prayerSel', null);
  if (s && GROUPS.some((g) => g.id === s.group)) return s;
  const g = groupOfPhone();
  return g ? { group: g.id } : null;
};
export const saveSel = (s: PrayerSel) => save('prayerSel', s);
export const loadAdj = (): Adj => load<Adj>('prayerAdj', {});
export const saveAdj = (a: Adj) => save('prayerAdj', a);

const custom = (fajr: number, isha: number) => { const p = CalculationMethod.Other(); p.fajrAngle = fajr; p.ishaAngle = isha; return p; };
// طرق شائعة؛ لما لم نتحقّق منه يُؤخذ أكثرها تأخّرًا في الفجر والعشاء (قرار المستخدم)
const SAFE = (): CalculationParameters[] => [
  CalculationMethod.MuslimWorldLeague(), CalculationMethod.Egyptian(), CalculationMethod.Karachi(), CalculationMethod.NorthAmerica(),
  CalculationMethod.UmmAlQura(), custom(18, 18), custom(18, 17), custom(19, 17),
];
const prep = (p: CalculationParameters) => { p.madhab = Madhab.Shafi; p.highLatitudeRule = HighLatitudeRule.SeventhOfTheNight; return p; };

type Times = Record<Prayer, Date>;
function cityTimes(g: Group, c: City, day: Date): Times {
  const co = new Coordinates(c[1], c[2]);
  const sets = (g.tn ? [custom(18, 18)] : SAFE()).map((p) => new PrayerTimes(co, day, prep(p)));
  const out = {} as Times;
  for (const k of PRAYERS) out[k] = new Date(Math.max(...sets.map((s) => (s[k] as Date).getTime())));
  return out;
}

/** مواقيت يوم: للمدينة المختارة، أو أكثر مدن البلد تأخّرًا لكل صلاة؛ ثم ضبط صاحب الهاتف */
export function dayTimes(sel: PrayerSel, day: Date, adj: Adj = {}): Times | null {
  const g = GROUPS.find((x) => x.id === sel.group);
  if (!g) return null;
  const cities = sel.city ? g.cities.filter((c) => c[0] === sel.city) : g.cities;
  if (!cities.length) return null;
  const all = cities.map((c) => cityTimes(g, c, day));
  const out = {} as Times;
  for (const k of PRAYERS) out[k] = new Date(Math.max(...all.map((t) => t[k].getTime())) + (adj[k] ?? 0) * 60_000);
  return out;
}

/** الصلاة القادمة؛ وبعد دخول وقتها بعشرين دقيقة يبقى السطر «حان الآن» */
export const NOW_WINDOW = 20 * 60_000;
export function nextPrayer(sel: PrayerSel, now: Date, adj: Adj = {}): { p: Prayer; at: Date; now: boolean } | null {
  for (let i = 0; i < 2; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    const t = dayTimes(sel, d, adj);
    if (!t) return null;
    for (const p of PRAYERS) {
      const ms = t[p].getTime() - now.getTime();
      if (ms > -NOW_WINDOW && (ms > 0 || i === 0)) return { p, at: t[p], now: ms <= 0 };
    }
  }
  return null;
}

const hours = (h: number) => (h === 1 ? 'ساعة' : h === 2 ? 'ساعتين' : h <= 10 ? `${h} ساعات` : `${h} ساعة`);
const mins = (m: number) => (m === 1 ? 'دقيقة' : m === 2 ? 'دقيقتين' : m <= 10 ? `${m} دقائق` : `${m} دقيقة`);
/** «بعد ساعتين و20 دقيقة» */
export function untilText(ms: number): string {
  const t = Math.ceil(ms / 60_000);
  if (t < 1) return 'بعد أقل من دقيقة';
  const h = Math.floor(t / 60), m = t % 60;
  if (!h) return 'بعد ' + mins(m);
  return 'بعد ' + hours(h) + (m ? ' و' + mins(m) : '');
}
export const hhmm = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
