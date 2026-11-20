import { load, save } from './store';
import { setKun } from './kunLines';
import { setAhl, type Line } from './ahlLines';

/**
 * «كن مثله ﷺ» و«من أهل بيته ﷺ» و«من أصحابه ﷺ» (2026-11-20): تُحمَّل من public/lines.json مثل tasks.json
 * (المرفق والمحفوظ والمنشور، والأحدث version)، فتصل الدفعات الجديدة بلا تحديث التطبيق؛ والمرفق في الكود احتياط.
 * يولّده scripts/build-lines.py من data/sunnah/batch1.json وdata/ahl/batch1.json.
 */
interface LinesFile { version: number; kun: string[]; ahl: Line[]; sahb: Line[] }
const REMOTE = (import.meta.env.VITE_CARDS_URL ?? 'https://mouhamedali92rahali-cpu.github.io/habibuna-app/cards.json').replace(/cards\.json$/, 'lines.json');

async function get(url: string, ms: number): Promise<LinesFile> {
  const ctl = new AbortController();
  const t = window.setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as LinesFile;
    if (!Array.isArray(d.kun) || !Array.isArray(d.ahl) || !Array.isArray(d.sahb)) throw new Error('bad');
    return d;
  } finally { window.clearTimeout(t); }
}

/** يعيد true إن تغيّرت الأسطر عمّا في الكود */
export async function loadLines(native: boolean): Promise<boolean> {
  try {
    const bundled = await get('lines.json', 15000).catch(() => null);
    const cached = native ? load<LinesFile | null>('linesCache', null) : null;
    const remote = native ? await get(REMOTE, 6000).catch(() => null) : null;
    if (remote) save('linesCache', remote);
    const best = [remote, cached, bundled].filter((d): d is LinesFile => !!d).sort((a, b) => (b.version ?? 0) - (a.version ?? 0))[0];
    if (!best) return false;
    setKun(best.kun); setAhl(best.ahl, best.sahb);
    return true;
  } catch { return false; }
}
