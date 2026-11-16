import type { Settings } from './types';
import { load, save } from './store';
import { slots } from './notify';

/**
 * المهام الخفيّة «حسنات بلا جمهور» (فكرة المستخدم 2026-11-12؛ قرارات 2026-11-16):
 * مهمة خير صغيرة كل يوم، تصل في إشعار هادئ مستقلّ وتظهر في أعلى صفحة البطاقات من وقتها،
 * وبجانبها «فعلتُها» ثم جملة هادئة. بلا نقاط ولا عدّاد ولا سلاسل. كل شيء في الهاتف وحده.
 * المهام في public/tasks.json (تُحمَّل مثل cards.json، فتصل الجديدة بلا تحديث التطبيق).
 */
export interface Task { id: string; text: string; cat?: string; /** أصلها: آية أو حديث */ origin?: string; source?: string; grade?: string; }
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

/** مهمة اليوم: ترتيب ثابت مخلوط بمعرّف المهمة، فلا تتغيّر عند إعادة الجدولة وتتمازج الأبواب */
export function taskFor(tasks: Task[], day: number): Task {
  const idh = (id: string) => [...id].reduce((h, ch) => hash(h, ch.charCodeAt(0)), 7);
  const order = [...tasks].sort((a, b) => idh(a.id) - idh(b.id));
  return order[((day % order.length) + order.length) % order.length];
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
