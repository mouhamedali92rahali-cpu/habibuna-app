import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardData, Settings } from './lib/types';
import { advance, defaultSettings, load, save, syncDeck, today, type Deck } from './lib/store';
import { askExact, askPermission, cardFor, dayNumber, PER_DAY, REMINDER, diagnose, exactAllowed, testLater, fmt, isNative, listenTaps, notifySupported, schedule, scheduleWeek, showCard, slots } from './lib/notify';
import { loadCards } from './lib/cards';
import { PhoneSettings, phoneMaker, type Maker } from './lib/phone';
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


export default function App() {
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [err, setErr] = useState(false);
  const [tab, setTab] = useState<Tab>('feed');
  const [deck, setDeck] = useState<Deck | null>(() => load<Deck | null>('deck', null));
  const [favs, setFavs] = useState<string[]>(() => load('favs', []));
  const [settings, setSettings] = useState<Settings>(() => {
    const s = { ...defaultSettings, ...load<Partial<Settings>>('settings', {}) };
    return { ...s, perDay: PER_DAY };
  });
  const [hidden, setHidden] = useState<string[]>(() => load('hiddenChapters', []));
  const [filterOpen, setFilterOpen] = useState(false);
  const [open, setOpen] = useState<CardData | null>(null);
  const [toast, setToast] = useState('');
  const [planned, setPlanned] = useState<number | null>(null);
  const [exact, setExact] = useState<boolean | null>(null);
  const [diag, setDiag] = useState<string[] | null>(null);
  const [maker, setMaker] = useState<Maker>('normal');
  const [guide, setGuide] = useState(false);
  // صفحة الترحيب: تظهر أول مرة يُفتح فيها التطبيق، وتشرح البطاقات والإشعارات وإعدادات الهاتف
  const [welcome, setWelcome] = useState<0 | 1 | 2>(() => (load('welcomeSeen', false) ? 0 : 1));
  const closeWelcome = () => { if (welcome === 2) save('guideSeen', true); setWelcome(0); save('welcomeSeen', true); };
  useEffect(() => { void phoneMaker().then(setMaker); }, []);
  const toastT = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadCards().then(setCards).catch(() => setErr(true));
  }, []);

  const ids = useMemo(() => (cards ?? []).map((c) => c.id), [cards]);
  const byId = useMemo(() => new Map((cards ?? []).map((c, i) => [c.id, { c, n: i + 1 }])), [cards]);
  const chapters = useMemo(() => [...new Set((cards ?? []).map((c) => c.chapter))].filter((ch) => ch !== REMINDER), [cards]);

  useEffect(() => {
    if (!cards) return;
    let d = syncDeck(deck, ids);
    if (d.day !== today()) d = advance(d, ids);
    setDeck(d); save('deck', d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  useEffect(() => { save('favs', favs); }, [favs]);
  useEffect(() => { save('settings', settings); }, [settings]);
  useEffect(() => { save('hiddenChapters', hidden); }, [hidden]);

  const say = useCallback((m: string) => { setToast(m); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(''), Math.max(2200, m.length * 70)); }, []);

  // ترتيب البطاقات المحفوظ بلا الأنواع المخفيّة؛ منه تُحسب بطاقات كل يوم (في التطبيق وفي الإشعارات)
  const pool = useMemo(() => (deck?.order ?? []).map((id) => byId.get(id)?.c).filter((c): c is CardData => !!c && (c.chapter === REMINDER || !hidden.includes(c.chapter))), [deck?.order, byId, hidden]);

  // الساعة الحالية، تُحدَّث كل دقيقة وعند العودة للتطبيق، لتظهر بطاقة الموعد حين يحين
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const t = window.setInterval(tick, 60_000);
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { window.clearInterval(t); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // بطاقات اليوم فقط: بطاقة الموعد الأول تظهر من بداية اليوم، والبقية حين يحين وقتها
  const times = useMemo(() => slots(settings), [settings]);
  const dayNo = dayNumber(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const feed = useMemo(() => {
    if (pool.length === 0) return [] as { c: CardData; n: number }[];
    return times
      .map((m, k) => ({ m, k, e: byId.get(cardFor(pool, dayNo, k).id) }))
      .filter((x) => x.e && x.m <= nowMin)
      .map((x) => x.e!);
  }, [pool, times, dayNo, nowMin, byId]);
  const nextAt = times.find((m) => m > nowMin);

  useEffect(() => {
    if (pool.length === 0) return;
    return schedule(settings, (k) => cardFor(pool, dayNumber(new Date()), k));
  }, [pool, settings]);

  // الهاتف: جدولة إشعارات أسبوع قادم بنفس بطاقات كل يوم، وإعادتها عند كل فتح أو عودة للتطبيق
  useEffect(() => {
    if (!isNative || pool.length === 0) return;
    const run = () => {
      scheduleWeek(settings, pool).then(setPlanned).catch(() => setPlanned(0));
      exactAllowed().then(setExact).catch(() => {});
    };
    run();
    const onVis = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pool, settings]);

  useEffect(() => {
    if (!cards) return;
    return listenTaps((id) => { const e = byId.get(id); if (e) setOpen(e.c); });
  }, [cards, byId]);


  const enableNotify = async () => {
    if (!(await askPermission())) { say(isNative ? 'لم يُسمح بالإشعارات. فعّلها من إعدادات الهاتف' : notifySupported() ? 'لم يُسمح بالإشعارات من المتصفح' : 'المتصفح لا يدعم الإشعارات'); return false; }
    setSettings((s) => ({ ...s, notifyOn: true }));
    return true;
  };

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
            {feed.length > 0 && <h2 className="today">{feed.length > 1 ? 'بطاقات اليوم' : 'بطاقة اليوم'}</h2>}
            {feed.map((e) => <CardBlock key={e.c.id} c={e.c} n={e.n} fav={favs.includes(e.c.id)} onFav={() => toggleFav(e.c.id)} onShare={() => doShare(e.c)} />)}
            {feed.length === 0 && pool.length > 0 && (
              <div className="waiting">
                <p>«حبيبنا» مواقف صغيرة موثّقة تكشف لك عظمة شخصيته ﷺ، تصلك بطاقةً بطاقة في المواعيد التي تختارها.</p>
                <b>البطاقة القادمة اليوم عند {fmt(times[0])}</b>
                <small>ما تحفظه بـ ♡ تجده في «المفضلة» متى شئت.</small>
              </div>
            )}
            {feed.length > 0 && <p className="muted next">{nextAt !== undefined ? `البطاقة القادمة اليوم عند ${fmt(nextAt)}` : `البطاقة القادمة غدًا عند ${fmt(times[0])} بإذن الله`}</p>}
            {pool.length === 0 && <p className="muted">كل الأنواع مخفيّة. افتح ⋯ لإظهارها.</p>}
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
                <span><b>إشعارات البطاقات</b><small>ثلاث بطاقات تصلك كل يوم</small></span>
                <input type="checkbox" checked={settings.notifyOn} onChange={async (e) => {
                  const on = e.target.checked;
                  if (on && !(await askPermission())) { say(isNative ? 'لم يُسمح بالإشعارات. فعّلها من إعدادات الهاتف' : notifySupported() ? 'لم يُسمح بالإشعارات من المتصفح' : 'المتصفح لا يدعم الإشعارات'); return; }
                  setSettings({ ...settings, notifyOn: on });
                  // هواتف شاومي وأمثالها: إرشاد مرة واحدة لتصل الإشعارات والتطبيق مغلق
                  if (on && maker !== 'normal' && !load('guideSeen', false)) { setGuide(true); save('guideSeen', true); }
                }} />
              </label>
              <p className="muted small">تصلك ثلاث بطاقات كل يوم: {slots().map(fmt).join(' · ')}</p>
              <button className="ghost" onClick={async () => {
                if (!(await askPermission())) { say(isNative ? 'فعّل الإشعارات من إعدادات الهاتف أولًا' : 'فعّل الإشعارات من المتصفح أولًا'); return; }
                say((await showCard(feed[0]?.c ?? cards[0])) ?? 'أُرسل إشعار تجريبي');
              }}>إشعار تجريبي</button>
              {isNative && settings.notifyOn && planned !== null && <p className="muted small">إشعارات مجدولة للأيام السبعة القادمة: {planned}</p>}
              {maker !== 'normal' && <button className="linkbtn" onClick={() => setGuide(true)}>لا تصل الإشعارات والتطبيق مغلق؟ اضغط هنا</button>}
              <button className="linkbtn" onClick={() => setWelcome(isNative ? 2 : 1)}>كيف تعمل الإشعارات؟</button>
              {isNative && (
                <button className="ghost" onClick={async () => {
                  if (!(await askPermission().catch(() => false))) { say('فعّل الإشعارات من إعدادات الهاتف أولًا'); return; }
                  say((await testLater(cardFor(pool, dayNo + 1, 0) ?? cards[0])) ?? 'سيصلك إشعار بعد دقيقة. اخرج من التطبيق بزر الرجوع للرئيسية ولا تغلقه من قائمة التطبيقات');
                }}>تجربة إشعار بعد دقيقة</button>
              )}
              {isNative && (
                <button className="ghost" onClick={async () => { await askPermission().catch(() => false); setDiag(['…']); setDiag(await diagnose(feed[0]?.c ?? cards[0])); }}>فحص الإشعارات</button>
              )}
              {diag && <pre className="diag">{diag.join('\n')}</pre>}
              {isNative && exact === false && (
                <button className="ghost" onClick={async () => { const ok = await askExact().catch(() => false); setExact(ok); say(ok ? 'ستصل الإشعارات في وقتها بالضبط' : 'بقيت المواعيد تقريبية'); }}>
                  مواعيد دقيقة: اسمح بـ«المنبّهات والتذكيرات»
                </button>
              )}
              <p className="note">{isNative
                ? 'تُجدول إشعارات الأيام السبعة القادمة، وتتجدّد كلما فتحت التطبيق. في هواتف شاومي وهواوي وأوبو: اجعل «توفير البطارية» لهذا التطبيق على «بلا قيود» وفعّل «التشغيل التلقائي»، وإلا قد تتأخر الإشعارات أو لا تصل.'
                : 'على الويب تصل الإشعارات المجدولة والتطبيق مفتوح. الإشعارات في الخلفية وعند إغلاق التطبيق تأتي مع نسخة الهاتف.'}</p>
            </div>
            <div className="panel">
              <b>عن التطبيق</b>
              <p className="muted">«حبيبنا» — مواقف صغيرة موثّقة من السنة النبوية، تكشف لك عظمة شخصية النبي ﷺ. عدد البطاقات: {cards.filter((c) => c.chapter !== REMINDER).length}.</p>
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
      {welcome !== 0 && (
        <div className="modal">
          <div className="sheet guide welcome">
            {welcome === 1 ? (
              <>
                <h2>مرحبًا بك في «حبيبنا»</h2>
                <p>مواقف صغيرة موثّقة من السنة، تكشف لك عظمة شخصيته ﷺ وتقرّبك منه.</p>
                <b>تصلك ثلاث بطاقات كل يوم:</b>
                <ul>
                  <li><b>{fmt(times[0])}</b> — من ملامحه ﷺ وحياته اليومية، كأنك تراه.</li>
                  <li><b>{fmt(times[1])}</b> — موقف من مواقفه وأخلاقه.</li>
                  <li><b>{fmt(times[2])}</b> — تذكير بالصلاة عليه ﷺ (ويوم الجمعة تذكير خاص).</li>
                </ul>
                <p className="muted small">تظهر كل بطاقة في التطبيق حين يحين وقتها. وما يعجبك احفظه بـ ♡ لتجده في «المفضلة»، وتحت كل بطاقة مصدر الحديث ودرجته.</p>
                {settings.notifyOn ? (
                  <button className="primary" onClick={() => (isNative ? setWelcome(2) : closeWelcome())}>{isNative ? 'التالي' : 'ابدأ'}</button>
                ) : (
                  <button className="primary" onClick={async () => { if (await enableNotify()) { if (isNative) setWelcome(2); else closeWelcome(); } }}>فعّل الإشعارات لتصلك البطاقات</button>
                )}
                {!settings.notifyOn && <button className="ghost" onClick={closeWelcome}>لاحقًا</button>}
              </>
            ) : (
              <>
                <h2>لتصلك البطاقات في وقتها</h2>
                {maker !== 'normal' ? (
                  <>
                    <p className="muted small">هاتفك {maker === 'xiaomi' ? 'من شاومي، وهو' : 'من الهواتف التي'} يُوقف التطبيقات المغلقة ويمسح إشعاراتها. خطوتان مرة واحدة فقط:</p>
                    <ol>
                      <li><b>التشغيل التلقائي:</b> فعّله لتطبيق «حبيبنا».</li>
                      <li><b>توفير البطارية:</b> اجعله «بلا قيود».</li>
                    </ol>
                    {maker === 'xiaomi' && <button className="primary" onClick={() => void PhoneSettings.openAutostart().catch(() => {})}>فتح «التشغيل التلقائي»</button>}
                    <button className={maker === 'xiaomi' ? 'ghost' : 'primary'} onClick={() => void PhoneSettings.openAppSettings().catch(() => {})}>فتح إعدادات التطبيق (البطارية)</button>
                  </>
                ) : (
                  <p className="muted small">الإشعارات مجدولة لأسبوع كامل، وتتجدّد كلما فتحت التطبيق، فتصلك ولو كان مغلقًا.</p>
                )}
                {exact === false && (
                  <>
                    <p className="muted small"><b>مواعيد دقيقة:</b> يؤخّر أندرويد الإشعارات قليلًا ما لم تسمح بـ«المنبّهات والتذكيرات».</p>
                    <button className="ghost" onClick={async () => { const ok = await askExact().catch(() => false); setExact(ok); }}>السماح بالمواعيد الدقيقة</button>
                  </>
                )}
                <p className="muted small"><b>لتغيير الإشعارات لاحقًا:</b> من «الإعدادات ⚙» في التطبيق تُوقفها أو تشغّلها وتجرّبها. ولتغيير صوتها أو طريقة ظهورها: إعدادات الهاتف ← التطبيقات ← «حبيبنا» ← الإشعارات.</p>
                <button className="primary" onClick={closeWelcome}>ابدأ</button>
              </>
            )}
          </div>
        </div>
      )}
      {guide && (
        <div className="modal" onClick={() => setGuide(false)}>
          <div className="sheet guide" onClick={(e) => e.stopPropagation()}>
            <h2>لكي تصلك البطاقات والتطبيق مغلق</h2>
            <p className="muted small">هاتفك {maker === 'xiaomi' ? 'من شاومي' : 'من الهواتف التي'} يُوقف التطبيقات المغلقة ويمسح إشعاراتها. خطوتان مرة واحدة فقط:</p>
            <ol>
              <li><b>{maker === 'xiaomi' ? 'التشغيل التلقائي' : 'التشغيل التلقائي / التشغيل في الخلفية'}:</b> فعّله لتطبيق «حبيبنا».</li>
              <li><b>توفير البطارية:</b> اجعله «بلا قيود» لتطبيق «حبيبنا».</li>
            </ol>
            {maker === 'xiaomi' && <button className="primary" onClick={() => void PhoneSettings.openAutostart().catch(() => {})}>فتح «التشغيل التلقائي»</button>}
            <button className={maker === 'xiaomi' ? 'ghost' : 'primary'} onClick={() => void PhoneSettings.openAppSettings().catch(() => {})}>فتح إعدادات التطبيق (البطارية)</button>
            <p className="muted small">في صفحة إعدادات التطبيق: «توفير البطارية» ← «بلا قيود». بعدها جرّب «تجربة إشعار بعد دقيقة» ثم أغلق التطبيق.</p>
            <button className="ghost" onClick={() => setGuide(false)}>تم</button>
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
