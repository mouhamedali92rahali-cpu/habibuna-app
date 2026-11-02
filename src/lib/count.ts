import { isNative, dayNumber } from './notify';
import { load, save } from './store';

/**
 * عدّاد مجهول (قرار المستخدم 2026-11-02): GoatCounter لا يحفظ عنوان IP ولا يستعمل ملفات تتبّع.
 * إشارتان فقط، بلا أي معلومة عن الشخص: «/app/install» مرة واحدة لكل هاتف (أول فتح بعد التحديث يُحسب كذلك)،
 * و«/app/day» مرة في اليوم لمعرفة عدد من يستعملونه. الويب المنشور «/web/...»، ولا شيء من التجارب المحلية.
 */
const URL_ = 'https://habibuna.goatcounter.com/count';

const ping = (p: string) => {
  try {
    void fetch(`${URL_}?p=${encodeURIComponent(p)}&rnd=${Math.random().toString(36).slice(2)}`, { mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => {});
  } catch { /* لا شيء */ }
};

export function countUse() {
  if (!isNative && !location.hostname.endsWith('github.io')) return;
  const where = isNative ? 'app' : 'web';
  if (!load('countedInstall', false)) { ping(`/${where}/install`); save('countedInstall', true); }
  const d = dayNumber(new Date());
  if (load<number>('countedDay', 0) !== d) { ping(`/${where}/day`); save('countedDay', d); }
}
