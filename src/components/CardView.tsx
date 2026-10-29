import type { CardData } from '../lib/types';
import { Corner, Divider, Mihrab } from './Ornaments';

const MARK: Record<string, string> = {
  'ضحكه': '☺', 'ملاطفاته': '❀', 'فرحه': '☀', 'ما يحبه': '♥', 'بكاؤه': '◌', 'وصاياه': '✎', 'الملامح والشكل': '◈', 'التواضع': '❖',
  'تعامله مع الخدم': '✦', 'رحمته بالأطفال': '✿', 'كرمه': '❂', 'رحمته بغير المسلمين': '☪', 'حبه لأمته': '♡', 'رحمته بأعدائه': '❋',
  'محبة الصحابة له': '❤', 'شجاعته': '⚔', 'حلمه ويُسره': '☘', 'رفقه وتعليمه': '✧', 'مع أهله': '⌂',
  'زهده': '◇', 'عبادته': '☾', 'رحمته بالحيوان': '✾', 'وفاؤه': '❁', 'صبره': '✥', 'دعاؤه لأصحابه': '✺',
  'رحمته ورأفته': '❦', 'حياته اليومية': '◎', 'الصلاة عليه': '❉',
};
export const markOf = (chapter: string) => MARK[chapter] ?? '✦';

export function CardFront({ card, n }: { card: CardData; n: number }) {
  return (
    <div className={`card face front t-${card.theme}${card.long ? ' long' : ''}`}>
      <Corner className="corner tl" /><Corner className="corner tr" /><Corner className="corner bl" /><Corner className="corner br" />
      <div className="inner">
        <div className="kicker">{card.chapter === 'الصلاة عليه' ? 'تذكير' : 'من مواقف النبي ﷺ'}</div>
        <div className="num"><span>{card.chapter === 'الصلاة عليه' ? '❉' : n}</span></div>
        <p className="ctext"><span>{card.text}</span></p>
        <Divider />
        <div className="src">
          <div>المصدر: {card.source}</div>
          <div className="grade">{card.grade}</div>
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
