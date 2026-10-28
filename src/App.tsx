import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardData, Settings } from './lib/types';
import { advance, defaultSettings, load, save, syncDeck, today, type Deck } from './lib/store';
import { askPermission, fmt, notifySupported, schedule, showCard, slots } from './lib/notify';
import { shareCard } from './lib/shareImage';
import { CardBack, CardFront, markOf } from './components/CardView';

type Tab = 'feed' | 'favs' | 'settings';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'البطاقات', icon: '✦' }, { id: 'favs', label: 'المفضلة', icon: '♡' }, { id: 'settings', label: 'الإعدادات', icon: '⚙' },
];
function CardBlock({ c, n, fav, onFav, onShare }: { c: CardData; n: number; fav: boolean; onFav: () => void; onShare: () => void }) {
    const [showSrc, setShowSrc] = useState(false);
    const [showSharh, setShowSharh] = useState(false);
    return (
      <article className="block">
        <CardFront card={c} n={n} />
        <div className="under">
          <button className={'srcbtn' + (showSrc ? ' on' : '')} onClick={() => setShowSrc((v) => !v)} aria-expanded={showSrc}>
            {showSrc ? 'إخفاء مصدر الحديث' : 'إظهار مصدر الحديث'}
          </button>
          {c.sharh && <button className={'srcbtn sm' + (showSharh ? ' on' : '')} onClick={() => setShowSharh((v) => !v)} aria-expanded={showSharh}>شرح موجز</button>}
          <div className="mini">
            <button className={'icon' + (fav ? ' on' : '')} onClick={() => onFav()} aria-label="مفضلة">{fav ? '♥' : '♡'}</button>
            <button className="icon" onClick={() => onShare()} aria-label="مشاركة">⇪</button>
          </div>
        </div>
        {showSharh && c.sharh && (
          <div className="hadith sharh">
            <b>شرح موجز</b>
            <p className="matn">{c.sharh.text}</p>
            <div className="meta"><b>المصدر:</b> {c.sharh.source}</div>
          </div>
        )}
        {showSrc && (
          <div className="hadith">
            {c.hadith ? (
              <>
                {c.hadith.narrator && <div className="narr">عن {c.hadith.narrator}</div>}
                <p className="matn">{c.hadith.matn}</p>
                {c.hadith.excerpt && <div className="exc">مقتطف من الحديث الطويل</div>}
              </>
            ) : <p className="matn soon">نص الحديث الكامل قيد الإضافة.</p>}
            <div className="meta"><b>المصدر:</b> {c.source}<br /><b>الدرجة:</b> {c.grade}</div>
          </div>
        )}
      </article>
    );
  }

const PAGE = 8;

export default function App() {
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<Tab>('feed');
  const [deck, setDeck] = useState<Deck | null>(() => load<Deck | null>('deck', null));
  const [favs, setFavs] = useState<string[]>(() => load('favs', []));
  const [settings, setSettings] = useState<Settings>(() => ({ ...defaultSettings, ...load<Partial<Settings>>('settings', {}) }));
  const [hidden, setHidden] = useState<string[]>(() => load('hiddenChapters', []));
  const [filterOpen, setFilterOpen] = useState(false);
  const [count, setCount] = useState(PAGE);
  const [open, setOpen] = useState<CardData | null>(null);
  const [toast, setToast] = useState('');
  const toastT = useRef<number | undefined>(undefined);
  const sentinel = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('cards.json').then((r) => r.json()).then((d: { cards: CardData[] }) => setCards(d.cards)).catch(() => setErr(true));
  }, []);

  const ids = useMemo(() => (cards ?? []).map((c) => c.id), [cards]);
  const byId = useMemo(() => new Map((cards ?? []).map((c, i) => [c.id, { c, n: i + 1 }])), [cards]);
  const chapters = useMemo(() => [...new Set((cards ?? []).map((c) => c.chapter))], [cards]);

  useEffect(() => {
    if (!cards) return;
    let d = syncDeck(deck, ids);
    if (d.day !== today()) d = advance(d, ids);
    setDeck(d); save('deck', d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  useEffect(() => { save('favs', favs); }, [favs]);
  useEffect(() => { save('settings', settings); }, [settings]);
  useEffect(() => { save('hiddenChapters', hidden); setCount(PAGE); }, [hidden]);

  const say = useCallback((m: string) => { setToast(m); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(''), 2200); }, []);

  useEffect(() => {
    if (!cards) return;
    return schedule(settings, () => cards[Math.floor(Math.random() * cards.length)]);
  }, [cards, settings]);

  // البطاقات تباعًا بحسب الترتيب العشوائي المحفوظ، مع تجاوز الأنواع المخفيّة
  const feed = useMemo(() => {
    if (!deck) return [] as { c: CardData; n: number }[];
    const L = deck.order.length;
    const out: { c: CardData; n: number }[] = [];
    for (let k = 0; k < L; k++) {
      const e = byId.get(deck.order[(deck.pos + k) % L]);
      if (e && !hidden.includes(e.c.chapter)) out.push(e);
    }
    return out;
  }, [deck, byId, hidden]);

  const shown = feed.slice(0, count);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || tab !== 'feed') return;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) setCount((c) => Math.min(c + PAGE, feed.length)); }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [feed.length, tab, shown.length]);

  const toggleFav = (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const doShare = async (c: CardData) => {
    const r = await shareCard(c);
    say(r === 'downloaded' ? 'تم حفظ صورة البطاقة' : r === 'copied' ? 'تم نسخ النص' : r === 'shared' ? 'تمت المشاركة' : '');
  };
  const toggleChapter = (ch: string) => setHidden((h) => (h.includes(ch) ? h.filter((x) => x !== ch) : [...h, ch]));

  if (err) return <div className="splash">تعذّر تحميل البطاقات. تحقّق من الاتصال ثم أعد المحاولة.</div>;
  if (!cards || !deck) return <div className="splash"><div className="spin" />جارٍ التحميل…</div>;

  return (
    <div className="app">
      <header className="top">
        <span className="brandmark">حبيبنا</span>
        {tab === 'feed' && (
          <button className={'filterbtn' + (hidden.length ? ' on' : '')} onClick={() => setFilterOpen(true)} aria-label="تصفية الأنواع">⋯</button>
        )}
      </header>
      <main>
        {tab === 'feed' && (
          <section className="page feed">
            <CardBack />
            {shown.map((e) => <CardBlock key={e.c.id} c={e.c} n={e.n} fav={favs.includes(e.c.id)} onFav={() => toggleFav(e.c.id)} onShare={() => doShare(e.c)} />)}
            {shown.length < feed.length && <div ref={sentinel} className="more">…</div>}
            {feed.length === 0 && <p className="muted">كل الأنواع مخفيّة. افتح ⋯ لإظهارها.</p>}
          </section>
        )}

        {tab === 'favs' && (
          <section className="page">
            <h1>المفضلة</h1>
            {favs.length === 0 ? <p className="muted">لم تحفظ أي بطاقة بعد. اضغط ♡ على بطاقة تعجبك.</p> : (
              <ul className="list">
                {cards.filter((c) => favs.includes(c.id)).map((c) => (
                  <li key={c.id}><button onClick={() => setOpen(c)}><b><i aria-hidden="true">{markOf(c.chapter)}</i> {c.title}</b><span>{c.text}</span></button></li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'settings' && (
          <section className="page settings">
            <h1>الإعدادات</h1>
            <div className="panel">
              <label className="row">
                <span><b>إشعارات البطاقات</b><small>بطاقة تصلك في أوقات تحددها</small></span>
                <input type="checkbox" checked={settings.notifyOn} onChange={async (e) => {
                  const on = e.target.checked;
                  if (on && !(await askPermission())) { say(notifySupported() ? 'لم يُسمح بالإشعارات من المتصفح' : 'المتصفح لا يدعم الإشعارات'); return; }
                  setSettings({ ...settings, notifyOn: on });
                }} />
              </label>
              <label className="row">
                <span><b>عدد البطاقات في اليوم</b></span>
                <select value={settings.perDay} onChange={(e) => setSettings({ ...settings, perDay: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="row"><span><b>من الساعة</b></span><input type="time" value={settings.from} onChange={(e) => setSettings({ ...settings, from: e.target.value })} /></label>
              <label className="row"><span><b>إلى الساعة</b><small>خارج هذه الفترة لا تصلك إشعارات</small></span><input type="time" value={settings.to} onChange={(e) => setSettings({ ...settings, to: e.target.value })} /></label>
              <p className="muted small">الأوقات المتوقعة: {slots(settings).map(fmt).join(' · ')}</p>
              <button className="ghost" onClick={async () => { if (await askPermission()) { await showCard(cards[0]); say('أُرسل إشعار تجريبي'); } else say('فعّل الإشعارات من المتصفح أولًا'); }}>إشعار تجريبي</button>
              <p className="note">على الويب تصل الإشعارات المجدولة والتطبيق مفتوح. الإشعارات في الخلفية وعند إغلاق التطبيق تأتي مع نسخة الهاتف (أندرويد وآيفون).</p>
            </div>
            <div className="panel">
              <b>عن التطبيق</b>
              <p className="muted">«حبيبنا» — مواقف صغيرة موثّقة من السنة الصحيحة، تكشف لك عظمة شخصية النبي ﷺ. عدد البطاقات: {cards.length}.</p>
            </div>
          </section>
        )}
      </main>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <i>{t.icon}</i>{t.label}
          </button>
        ))}
      </nav>

      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <CardBlock c={open} n={byId.get(open.id)?.n ?? 0} fav={favs.includes(open.id)} onFav={() => toggleFav(open.id)} onShare={() => doShare(open)} />
            <button className="ghost" onClick={() => setOpen(null)}>إغلاق</button>
          </div>
        </div>
      )}
      {filterOpen && (
        <div className="modal" onClick={() => setFilterOpen(false)}>
          <div className="sheet filter" onClick={(e) => e.stopPropagation()}>
            <h2>أنواع البطاقات</h2>
            <p className="muted small">اختر ما تريد أن يظهر لك في التتابع</p>
            <div className="chips">
              {chapters.map((ch) => (
                <button key={ch} className={'fchip' + (hidden.includes(ch) ? '' : ' on')} onClick={() => toggleChapter(ch)}>
                  <b aria-hidden="true">{markOf(ch)}</b> {ch}
                </button>
              ))}
            </div>
            <div className="frow">
              <button className="ghost" onClick={() => setHidden([])}>إظهار الكل</button>
              <button className="primary" onClick={() => setFilterOpen(false)}>تم</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
