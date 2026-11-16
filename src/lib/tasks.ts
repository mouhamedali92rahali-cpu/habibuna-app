import type { Settings } from './types';
import { load, save } from './store';
import { slots } from './notify';
import { hijriFix } from './cards';
import { hijriDM } from './sunan';

/**
 * المهام الخفيّة «حسنات بلا جمهور» (فكرة المستخدم 2026-11-12؛ قرارات 2026-11-16):
 * مهمة خير صغيرة كل يوم، تصل في إشعار هادئ مستقلّ وتظهر في أعلى صفحة البطاقات من وقتها،
 * وبجانبها «فعلتُها» ثم جملة هادئة. بلا نقاط ولا عدّاد ولا سلاسل. كل شيء في الهاتف وحده.
 * المهام في public/tasks.json (تُحمَّل مثل cards.json، فتصل الجديدة بلا تحديث التطبيق).
 */
/** when: مهمة مناسبة لا تظهر إلا في وقتها (fri الجمعة، ramadan، last10 العشر الأواخر، eid العيدان، cold ديسمبر–فبراير، hot جوان–أوت، school سبتمبر) */
export interface Task { id: string; text: string; when?: string; }
interface TasksFile { version: number; tasks: Task[]; }

const REMOTE = (import.meta.env.VITE_CARDS_URL ?? 'https://mouhamedali92rahali-cpu.github.io/habibuna-app/cards.json').replace(/cards\.json$/, 'tasks.json');

async function get(url: string, ms: number): Promise<TasksFile> {
  const ctl = new AbortController();
  const t = window.setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as TasksFile;
    if (!Array.isArray(d.tasks)) throw new Error('bad');
    return d;
  } finally { window.clearTimeout(t); }
}

export async function loadTasks(native: boolean): Promise<Task[]> {
  try {
    const bundled = await get('tasks.json', 15000).catch(() => null);
    if (!native) return bundled?.tasks ?? [];
    const cached = load<TasksFile | null>('tasksCache', null);
    const remote = await get(REMOTE, 6000).catch(() => null);
    if (remote) save('tasksCache', remote);
    const best = [remote, cached, bundled].filter((d): d is TasksFile => !!d).sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
    return best?.tasks ?? [];
  } catch { return []; }
}

/** رقم ثابت لكل هاتف، حتى لا تصل المهمة إلى الناس كلهم في الدقيقة نفسها */
function seed(): number {
  let v = load<number>('taskSeed', 0);
  if (!v) { v = 1 + Math.floor(Math.random() * 2_000_000_000); save('taskSeed', v); }
  return v;
}
function hash(a: number, b: number): number {
  let h = (a ^ Math.imul(b, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * مهمة اليوم (قرار المستخدم 2026-11-16): العيدان مهمة العيد؛ في رمضان كل ثلاثة أيام مهمة من مهامه (والعشر الأواخر معها)؛
 * كل جمعة إحدى مهمتي الجمعة بالتناوب؛ مهام البرد والحر والمدرسة كل ثلاثاء في موسمها؛ وبقية الأيام من المهام العامة
 * بترتيب ثابت مخلوط بمعرّف المهمة، فلا تتغيّر عند إعادة الجدولة وتتمازج الأبواب.
 */
const idh = (id: string) => [...id].reduce((h, ch) => hash(h, ch.charCodeAt(0)), 7);
const dateOfDay = (day: number) => { const t = new Date(day * 86_400_000 + 12 * 3_600_000); return new Date(t.getTime() + t.getTimezoneOffset() * 60_000); };
export function taskFor(tasks: Task[], day: number): Task {
  const of = (w: string) => tasks.filter((t) => t.when === w);
  const rot = (l: Task[], i: number) => l[((i % l.length) + l.length) % l.length];
  const d = dateOfDay(day);
  const h = hijriDM(d, hijriFix);
  if (h && ((h.m === 10 && h.d === 1) || (h.m === 12 && h.d === 10)) && of('eid').length) return of('eid')[0];
  if (h?.m === 9 && day % 3 === 0) { const l = h.d >= 21 ? [...of('ramadan'), ...of('last10')] : of('ramadan'); if (l.length) return rot(l, Math.floor(day / 3)); }
  if (day % 7 === 1 && of('fri').length) return rot(of('fri'), Math.floor(day / 7));
  if (day % 7 === 5) {
    const mo = d.getMonth() + 1;
    const season = mo === 12 || mo <= 2 ? of('cold') : mo >= 6 && mo <= 8 ? of('hot') : mo === 9 ? of('school') : [];
    if (season.length) return rot(season, Math.floor(day / 7));
  }
  const order = tasks.filter((t) => !t.when).sort((a, b) => idh(a.id) - idh(b.id));
  return rot(order.length ? order : tasks, day);
}

/** المجال المسموح لإشعار المهمة: من 8:00 إلى 18:00، لا متأخرًا في الليل حتى يتّسع اليوم لفعلها (طلب المستخدم 2026-11-16) */
export const TASK_RANGE: [number, number] = [8 * 60, 18 * 60];
/** وقت ثابت يختاره صاحب الهاتف: من 6:00 إلى 19:00 */
export const TASK_FIXED: [number, number] = [6 * 60, 19 * 60];
/** لا يقترب من موعد بطاقة بأقل من 45 دقيقة (قرار المستخدم: لا يأتي مع الإشعارات العادية) */
const GAP = 45;

/** وقت إشعار المهمة يومًا ما: الثابت إن اختاره، وإلا وقت مختلف كل يوم يُحسب من رقم اليوم (فلا يتغيّر عند إعادة الجدولة) */
export function taskTime(s: Settings, day: number): number {
  if (s.taskAt != null && Number.isFinite(s.taskAt)) return Math.min(TASK_FIXED[1], Math.max(TASK_FIXED[0], s.taskAt));
  const cards = slots(s);
  const ok: number[] = [];
  for (let m = TASK_RANGE[0]; m <= TASK_RANGE[1]; m += 5) if (cards.every((c) => Math.abs(c - m) >= GAP)) ok.push(m);
  if (!ok.length) return TASK_RANGE[0];
  return ok[hash(day, seed()) % ok.length];
}

/** ما فُعل: {رقم اليوم: معرّف المهمة}، آخر 60 يومًا، في الهاتف وحده */
export const taskDoneMap = () => load<Record<string, string>>('taskDone', {});
export function markTaskDone(day: number, id: string): Record<string, string> {
  const m: Record<string, string> = { ...taskDoneMap(), [day]: id };
  for (const k of Object.keys(m).map(Number).sort((a, b) => b - a).slice(60)) delete m[k];
  save('taskDone', m);
  return m;
}
