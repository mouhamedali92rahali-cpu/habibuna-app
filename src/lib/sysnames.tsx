// أسماء إعدادات الهاتف بلغة الهاتف (طلب المستخدم): تبقى الواجهة عربية، ويُضاف بجانب كل اسم إعداد
// اسمُه كما يراه المستخدم في هاتفه إن كانت لغة الهاتف فرنسية أو إنجليزية.
// الفرنسية: Démarrage automatique و«Économiseur de batterie / Pas de restrictions» من دليل Tchap الحكومي ومجتمع شاومي،
// و«Superposition sur d'autres applis» من أدلة Pixel ومنتدى شاومي، و«Alarmes et rappels» من وثائق Android.
// battery وnoRestrict مؤكّدة من لقطة هاتف المستخدم (Xiaomi 15، HyperOS، 2026-10-30): «Puissance» ثم «Pas de restriction» بالمفرد.
// bgPopup مؤكّد من لقطة «Autres autorisations» في هاتف المستخدم. autostart بالفرنسية لم يُرَ بعد في هاتفه.
type Key = 'autostart' | 'battery' | 'noRestrict' | 'overlay' | 'bgPopup' | 'alarms' | 'allow';
const NAMES: Record<Key, { ar: string; fr: string; en: string }> = {
  autostart: { ar: 'التشغيل التلقائي', fr: 'Démarrage automatique', en: 'Autostart' },
  battery: { ar: 'توفير البطارية', fr: 'Puissance › Économiseur de batterie', en: 'Battery saver' },
  noRestrict: { ar: 'بلا قيود', fr: 'Pas de restriction', en: 'No restrictions' },
  overlay: { ar: 'الظهور فوق التطبيقات الأخرى', fr: "Superposition sur d'autres applis", en: 'Display over other apps' },
  bgPopup: { ar: 'عرض النوافذ المنبثقة أثناء التشغيل في الخلفية', fr: "Ouvrir de nouvelles fenêtres contextuelles pendant l'exécution en arrière-plan", en: 'Display pop-up windows while running in the background' },
  alarms: { ar: 'المنبّهات والتذكيرات', fr: 'Alarmes et rappels', en: 'Alarms & reminders' },
  allow: { ar: 'السماح', fr: 'Autoriser', en: 'Allow' },
};
const lang = (): 'fr' | 'en' | null => {
  const l = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  return l.startsWith('fr') ? 'fr' : l.startsWith('en') ? 'en' : null;
};
/** الاسم في سطر نصّي (للرسائل القصيرة): «عربي» (Français) */
export const sysText = (k: Key) => { const n = NAMES[k], l = lang(); return `«${n.ar}»` + (l ? ` (${n[l]})` : ''); };
/** الاسم داخل الواجهة: «عربي» ثم اسمه بلغة الهاتف باتجاه سليم */
export function Sys({ k }: { k: Key }) {
  const n = NAMES[k], l = lang();
  return <>«{n.ar}»{l && <> <bdi dir="ltr" className="sysname">{n[l]}</bdi></>}</>;
}
