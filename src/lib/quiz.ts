import type { CardData } from './types';
import { isNative } from './notify';
import { load, save } from './store';

/** سؤال «مراجعة الأسبوع»: الجواب الصحيح من نص البطاقة، وثلاثة خيارات خاطئة يقينًا (انظر CLAUDE.md، المهمة 4) */
export interface Question { card: string; q: string; a: string; w: string[]; pic?: boolean; }
interface QuizFile { version: number; questions: Question[]; pics?: Question[]; picSafe?: string[]; }

const REMOTE = 'https://mouhamedali92rahali-cpu.github.io/habibuna-app/quiz.json';
const get = async (url: string, ms: number): Promise<QuizFile> => {
  const ctl = new AbortController();
  const t = window.setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as QuizFile;
    if (!Array.isArray(d.questions)) throw new Error('bad');
    return d;
  } finally { window.clearTimeout(t); }
};
/** أسئلة «بالرسم»: رسم البطاقة فوق السؤال؛ للأسئلة التي لا يكشفها الرسم (picSafe) ولأسئلة كُتبت للرسم (pics) */
function withPics(d: QuizFile | null | undefined): Question[] {
  if (!d) return [];
  const safe = new Set(d.picSafe ?? []);
  return [...d.questions.map((q) => (safe.has(q.card) ? { ...q, pic: true } : q)), ...(d.pics ?? []).map((q) => ({ ...q, pic: true }))];
}
/** مثل البطاقات: المرفقة، والمحفوظة، والمنشورة (فتصل الأسئلة الجديدة دون تحديث التطبيق)؛ ويُؤخذ الأحدث */
export async function loadQuiz(): Promise<Question[]> {
  const bundled = await get('quiz.json', 15000).catch(() => null);
  if (!isNative) return withPics(bundled);
  const cached = load<QuizFile | null>('quizCache', null);
  const remote = await get(REMOTE, 6000).catch(() => null);
  if (remote) save('quizCache', remote);
  const best = [remote, cached, bundled].filter((d): d is QuizFile => !!d).sort((a, b) => b.version - a.version)[0];
  return withPics(best);
}

/** يوم الأحد الساعة 11:00 (قرار المستخدم: السبت يوم عمل عند كثيرين). يوم 0 (1970/1/1) خميس، فالأحد day % 7 === 3 */
export const SUNDAY = 3;
export const QUIZ_AT = 11 * 60;
/** رقم يوم الأحد الأخير (اليوم نفسه إن كان أحدًا): مفتاح مراجعة الأسبوع */
export const weekKey = (day: number) => day - ((day - SUNDAY + 7) % 7);
export const QUIZ_SIZE = 7;
/** لا تُعرض المراجعة بأقل من خمسة أسئلة (المثبّت حديثًا) */
export const QUIZ_MIN = 5;
/** ما أخطأ فيه يعود في الأسبوع التالي، بحدّ أقصى ثلاثة */
const MISSED_MAX = 3;

export interface QuizItem { card: CardData; q: string; a: string; options: string[]; pic?: boolean; }
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** أسئلة المراجعة: أخطاء الأسبوع الماضي أولًا، ثم بطاقات الأسبوع بترتيب عشوائي، بلا تكرار، وخيارات مخلوطة */
export function buildQuiz(weekCards: CardData[], missed: CardData[], bank: Question[]): QuizItem[] {
  const by = new Map<string, Question[]>();
  for (const q of bank) by.set(q.card, [...(by.get(q.card) ?? []), q]);
  const seen = new Set<string>();
  const pick = (cs: CardData[]) => cs.filter((c) => by.has(c.id) && !seen.has(c.id) && seen.add(c.id));
  const chosen = [...pick(missed).slice(0, MISSED_MAX), ...pick(shuffle(weekCards))].slice(0, QUIZ_SIZE);
  return chosen.map((card) => {
    const qs = by.get(card.id)!;
    const x = qs[Math.floor(Math.random() * qs.length)];
    return { card, q: x.q, a: x.a, options: shuffle([x.a, ...x.w]), pic: x.pic };
  });
}

export interface QuizRecord { score: number; total: number; }
/** عدد الأسابيع المتتالية التي أُتمّت فيها المراجعة، إلى هذا الأسبوع */
export function streak(done: Record<string, QuizRecord>, key: number): number {
  let n = 0;
  for (let k = key; done[k]; k -= 7) n++;
  return n;
}
