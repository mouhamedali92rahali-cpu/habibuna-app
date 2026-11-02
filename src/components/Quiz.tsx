import { useRef, useState } from 'react';
import type { QuizItem } from '../lib/quiz';
import { CardFront } from './CardView';
import { useArt } from '../lib/art';

/**
 * شاشة «مراجعة الأسبوع»: سؤال بأربعة خيارات، ثم صح/خطأ والبطاقة نفسها بنصها ومصدرها،
 * ثم النتيجة في النهاية. لا يُرسل شيء خارج الهاتف.
 */
export function Quiz({ items, streak, practice, favs, onFav, onFinish, onClose }: {
  items: QuizItem[];
  favs: string[];
  onFav: (id: string) => void;
  streak: number;
  practice?: boolean;
  onFinish: (score: number, wrong: string[]) => void;
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [end, setEnd] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toTop = () => root.current?.parentElement?.scrollTo({ top: 0 });
  const it = items[i];
  const arts = useArt();

  const choose = (o: string) => {
    if (picked) return;
    setPicked(o);
    if (o === it.a) setScore((s) => s + 1); else setWrong((w) => [...w, it.card.id]);
  };
  const next = () => {
    if (i + 1 < items.length) { setI(i + 1); setPicked(null); toTop(); return; }
    setEnd(true); toTop();
    onFinish(score, wrong);
  };

  if (end) {
    const all = score === items.length;
    return (
      <div className="quiz" ref={root}>
        <div className="qcard qend">
          <div className="qkick">مراجعة الأسبوع</div>
          <div className="qscore"><b>{score}</b> من {items.length}</div>
          <p>{all ? 'أحسنت! أجبت عن الأسئلة كلها ✦' : score >= items.length / 2 ? 'أحسنت ✦' : 'بارك الله فيك، والمهمّ أنك قرأتها مرة أخرى ✦'}</p>
          {practice ? <p className="muted small">هذه تجربة، لا تُحسب نتيجتها.</p> : wrong.length > 0 && <p className="muted small">ما أخطأت فيه يعود في مراجعة الأسبوع القادم.</p>}
          {streak + 1 >= 2 && <p className="qstreak">✦ أتممت المراجعة {streak + 1 === 2 ? 'أسبوعين' : `${streak + 1} أسابيع`} متتالية</p>}
          <p className="qpray">اللهم صلِّ وسلِّم على نبيّنا محمد</p>
          <button className="primary" onClick={onClose}>عودة إلى البطاقات</button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz" ref={root}>
      <div className="qtop">
        <span>{practice ? 'تجربة المراجعة' : 'مراجعة الأسبوع'} · {i + 1} من {items.length}</span>
        <button className="linkbtn" onClick={onClose}>إغلاق</button>
      </div>
      <div className="qbar" aria-hidden="true"><i style={{ width: `${(100 * (i + (picked ? 1 : 0))) / items.length}%` }} /></div>
      <div className="qcard">
        {it.pic && arts[it.card.id] && (
          // الرسم وحده بلا سطره (قد يكشف السطرُ الجواب)
          <img className="qpic" src={arts[it.card.id].src} alt="" onError={(e) => { const a = arts[it.card.id]; const im = e.currentTarget; if (!im.src.endsWith(a.fallback)) im.src = a.fallback; }} />
        )}
        <p className="qtext">{it.q}</p>
        <div className="qopts" role="group" aria-label="الخيارات">
          {it.options.map((o) => {
            const cls = !picked ? '' : o === it.a ? ' right' : o === picked ? ' wrong' : ' dim';
            return <button key={o} className={'qopt' + cls} onClick={() => choose(o)} disabled={!!picked}>{o}</button>;
          })}
        </div>
      </div>
      {picked && (
        <>
          <p className={'qverdict' + (picked === it.a ? ' ok' : ' no')} role="status">
            {picked === it.a ? 'إجابة صحيحة ✦' : 'الجواب الصحيح مُعلَّم بالأخضر'}
          </p>
          <button className="primary" onClick={next}>{i + 1 < items.length ? 'السؤال التالي' : 'النتيجة'}</button>
          <p className="muted small qhint">البطاقة التي جاء منها السؤال:</p>
          <div className="qreveal"><CardFront card={it.card} /></div>
          {arts[it.card.id] && !it.pic && (
            <figure className="hadith artbox qart">
              <img src={arts[it.card.id].src} alt={arts[it.card.id].caption} onError={(e) => { const a = arts[it.card.id]; const im = e.currentTarget; if (!im.src.endsWith(a.fallback)) im.src = a.fallback; }} />
              <figcaption>{arts[it.card.id].caption}</figcaption>
            </figure>
          )}
          <button className={'qfav' + (favs.includes(it.card.id) ? ' on' : '')} onClick={() => onFav(it.card.id)} aria-pressed={favs.includes(it.card.id)}>
            {favs.includes(it.card.id) ? '♥ محفوظة في المفضلة' : '♡ احفظها في المفضلة'}
          </button>
        </>
      )}
    </div>
  );
}
