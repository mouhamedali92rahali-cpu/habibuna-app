import { useLayoutEffect, useRef } from 'react';
import type { CardData } from '../lib/types';
import { Corner, Divider, Mihrab } from './Ornaments';

const MARK: Record<string, string> = {
  'ضحكه': '☺', 'ملاطفاته': '❀', 'فرحه': '☀', 'ما يحبه': '♥', 'بكاؤه': '◌', 'وصاياه': '✎', 'الملامح والشكل': '◈', 'التواضع': '❖',
  'تعامله مع الخدم': '✦', 'رحمته بالأطفال': '✿', 'كرمه': '❂', 'رحمته بغير المسلمين': '☪', 'حبه لأمته': '♡', 'رحمته بأعدائه': '❋',
  'محبة الصحابة له': '❤', 'شجاعته': '⚔', 'حلمه ويُسره': '☘', 'رفقه وتعليمه': '✧', 'مع أهله': '⌂', 'مكانته وفضله': '★', 'قالوا عنه': '❝', 'مواقف من السيرة': '⚑',
  'زهده': '◇', 'عبادته': '☾', 'رحمته بالحيوان': '✾', 'وفاؤه': '❁', 'صبره': '✥', 'دعاؤه لأصحابه': '✺',
  'رحمته ورأفته': '❦', 'حياته اليومية': '◎', 'الصلاة عليه': '❉',
};
/** الراوي على سطر المصدر حين يُخفى زرّ نص الحديث، إلا إذا ذكرته البطاقة («قال معاذ») */
const narrOnCard = (c: CardData) => !!(c.same && c.hadith?.narrator && !/قالت? /.test(c.text.slice(0, 12)));

export const markOf = (chapter: string) => MARK[chapter] ?? '✦';

/** حجم الخط المختار (--fz)، وإن لم يتّسع له إطار البطاقة يصغر في هذه البطاقة وحدها حتى يتّسع، ولا يقلّ عن الحجم الأصلي */
function useFitText() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const inner = el?.querySelector<HTMLElement>('.inner');
    if (!el || !inner) return;
    const fit = () => {
      let v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--fz')) || 1;
      el.style.setProperty('--fz', String(v));
      while (v > 1 && inner.scrollHeight > inner.clientHeight + 1) {
        v = Math.max(1, Math.round((v - 0.04) * 100) / 100);
        el.style.setProperty('--fz', String(v));
      }
    };
    fit();
    void document.fonts?.ready.then(fit);
  });
  return ref;
}

export function CardFront({ card }: { card: CardData }) {
  const ref = useFitText();
  return (
    <div ref={ref} className={`card face front t-${card.theme}${card.long ? ' long' : ''}`}>
      <Corner className="corner tl" /><Corner className="corner tr" /><Corner className="corner bl" /><Corner className="corner br" />
      <div className="inner">
        <div className="kicker">{card.chapter === 'الصلاة عليه' ? 'تذكير' : card.qalu ? 'قالوا عنه ﷺ' : 'من مواقف النبي ﷺ'}</div>
        <div className="num"><span>{card.chapter === 'الصلاة عليه' ? '❉' : '✦'}</span></div>
        <p className="ctext"><span>{card.text}</span></p>
        <Divider />
        <div className="src">
          {card.qalu && <div className="who">{card.title}</div>}
          {card.qalu ? <><div>المصدر:</div><div dir="ltr" className="ltr">{card.source}</div></> : <div>المصدر: {card.source}{narrOnCard(card) && <> <span className="nw">— عن {card.hadith!.narrator}</span></>}</div>}
          <div className={card.weak ? "grade weak" : "grade"}>{card.grade}</div>
          {card.shifa && <div className="grade weak">ذكره القاضي عياض في الشفا</div>}
        </div>
        <div className="chip"><b aria-hidden="true">{markOf(card.chapter)}</b> {card.chapter}</div>
      </div>
    </div>
  );
}

export function CardBack() {
  return (
    <div className="card face back t-emerald intro">
      <Corner className="corner tl" /><Corner className="corner tr" /><Corner className="corner bl" /><Corner className="corner br" />
      <div className="inner center">
        <div className="logo"><Mihrab /><span className="name">محمد<small>ﷺ</small></span></div>
        <div className="brand">حبيبنا</div>
        <p className="tag">مواقف صغيرة ..<br />تكشف لك عظمة شخصيته</p>
        <Divider />
        <div className="hint">مرّر للأسفل ↓</div>
      </div>
    </div>
  );
}
