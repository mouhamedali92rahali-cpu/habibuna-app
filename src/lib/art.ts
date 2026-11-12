import { useEffect, useState } from 'react';
import { isNative } from './notify';
import { load, save } from './store';

/** رسوم البطاقات الخطية (scripts/build-art.py): تظهر خلف زرّ «صورة» لا على وجه البطاقة */
export interface Art { src: string; fallback: string; caption: string; }
type Entry = { art: string; caption: string };
interface ArtFile { version: number; cards: Record<string, Entry>; maps?: Record<string, Entry>; }
interface Loaded { arts: Record<string, Art>; maps: Record<string, Art>; }

const BASE = 'https://mouhamedali92rahali-cpu.github.io/habibuna-app/';
const get = async (url: string, ms: number): Promise<ArtFile> => {
  const ctl = new AbortController();
  const t = window.setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { cache: 'no-cache', signal: ctl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as ArtFile;
    if (!d.cards) throw new Error('bad');
    return d;
  } finally { window.clearTimeout(t); }
};

/** مثل البطاقات والأسئلة: المرفق والمحفوظ والمنشور، ويُؤخذ الأحدث. إن كان الأحدث من الموقع تُحمَّل الرسوم منه (فتصل الرسوم الجديدة بلا تحديث)، ومع انقطاع الشبكة يُرجع إلى المرفق */
async function loadArt(): Promise<Loaded> {
  const bundled = await get('art.json', 15000).catch(() => null);
  let best = bundled, web = false;
  if (isNative) {
    const cached = load<ArtFile | null>('artCache', null);
    const remote = await get(BASE + 'art.json', 6000).catch(() => null);
    if (remote) save('artCache', remote);
    const top = remote ?? cached;
    if (top && (!bundled || top.version > bundled.version)) { best = top; web = true; }
  }
  const conv = (src?: Record<string, Entry>) => {
    const out: Record<string, Art> = {};
    for (const [id, a] of Object.entries(src ?? {})) {
      const local = `art/${a.art}.svg`;
      out[id] = { src: web ? `${BASE}${local}?v=${best!.version}` : local, fallback: local, caption: a.caption };
    }
    return out;
  };
  const out = { arts: conv(best?.cards), maps: conv(best?.maps) };
  artNow = out;
  return out;
}

let shared: Promise<Loaded> | null = null;
/** آخر رسوم محمَّلة، للنافذة على الشاشة (popupJson): الرسم المحلي داخل التطبيق */
export let artNow: Loaded = { arts: {}, maps: {} };
export const startArt = () => { shared ??= loadArt().catch(() => ({ arts: {}, maps: {} })); return shared; };
function useLoaded(): Loaded {
  const [m, setM] = useState<Loaded>({ arts: {}, maps: {} });
  useEffect(() => {

    let live = true;
    startArt().then((x) => { if (live) setM(x); });
    return () => { live = false; };
  }, []);
  return m;
}
/** الرسوم الخطية للبطاقات */
export const useArt = () => useLoaded().arts;
/** خرائط المدينة التقريبية لبطاقات الأماكن (قباء، العوالي، أُحد، الخندق) */
export const useMaps = () => useLoaded().maps;

/** تكبير الصورة: يفتح نافذة على الشاشة كلها (Zoom.tsx في App) */
export interface ZoomReq { src: string; fallback: string; caption: string; }
export const openZoom = (z: ZoomReq) => window.dispatchEvent(new CustomEvent<ZoomReq>('hb-zoom', { detail: z }));
