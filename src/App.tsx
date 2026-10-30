import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardData, Settings } from './lib/types';
import { advance, defaultSettings, load, save, syncDeck, today, type Deck } from './lib/store';
import { askExact, askPermission, cardFor, weekSlots, dayNumber, PER_DAY, REMINDER, diagnose, exactAllowed, testLater, fmt, isNative, listenTaps, notifySupported, schedule, scheduleWeek, showCard, slots } from './lib/notify';
import { loadCards } from './lib/cards';
import { PhoneSettings, phoneMaker, popupJson, schedulePopups, type Maker } from './lib/phone';
import { shareCard } from './lib/shareImage';
import { CardBack, CardFront, markOf } from './components/CardView';

type Tab = 'feed' | 'favs' | 'settings';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'البطاقات', icon: '✦' }, { id: 'favs', label: 'المفضلة', icon: '♡' }, { id: 'settings', label: 'الإعدادات', icon: '⚙' },
];
function CardBlock({ c, fav, onFav, onShare }: { c: CardData; fav: boolean; onFav: () => void; onShare: () => void }) {
    const [showSrc, setShowSrc] = useState(false);
    const [showSharh, setShowSharh] = useState(false);
    return (
      <article className="block">
        <CardFront card={c} />
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
  // صفحة الترحيب (أول فتح): إذن الإشعارات وحده، وفي شاومي وأمثالها خطوة واحدة لإعدادات التطبيق.
  // نافذة البطاقة على الشاشة لا تُطلب هنا؛ تُعرض بعد يومين في بطاقة «popupOffer» (قرار المستخدم)
  // الغلاف الكبير في أول فتح فقط، وبعده يبدأ التطبيق من بطاقات اليوم
  const [showCover] = useState(() => !load('coverSeen', false));
  useEffect(() => { save('coverSeen', true); }, []);
  const [welcome, setWelcome] = useState<0 | 1 | 2>(() => (!load('welcomeSeen', false) ? 1 : 0));
  const closeWelcome = () => { if (welcome === 2) save('guideSeen', true); setWelcome(0); save('welcomeSeen', true); };
  // نافذة البطاقة على الشاشة: إذن «الظهور فوق التطبيقات»، ومعاينتها على الويب في إطار
  const [overlay, setOverlay] = useState<boolean | null>(null);
  // عرض النافذة بعد يومين من أول فتح، مرة واحدة، لمن لم يفعّلها (قرار المستخدم: لا تُطلب أذوناتها في الترحيب)
  const [firstOpen] = useState<number>(() => { const t = load<number>('firstOpen', 0) || Date.now(); save('firstOpen', t); return t; });
  const [offer, setOffer] = useState<'ask' | 'done' | null>(() => (load('popupOffer', false) ? null : 'ask'));
  const closeOffer = () => { setOffer(null); save('popupOffer', true); };
  const [preview, setPreview] = useState<string | null>(null);
  const previewSrc = useMemo(() => (preview ? `popup.html?t=${Date.now()}#${encodeURIComponent(preview)}` : null), [preview]);
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
  // بطاقات الأيام السبعة الماضية (قرار المستخدم): حتى لا تضيع بطاقة فاتت صاحبها
  const past = useMemo(() => {
    if (pool.length === 0) return [] as { label: string; cards: CardData[] }[];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (i + 1) * 86_400_000);
      const label = i === 0 ? 'أمس' : d.toLocaleDateString('ar', { weekday: 'long' });
      return { label, cards: times.map((_m, k) => cardFor(pool, dayNo - i - 1, k)) };
    });
  }, [pool, times, dayNo]); // eslint-disable-line react-hooks/exhaustive-deps

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
      PhoneSettings.canOverlay().then(({ allowed }) => {
        setOverlay(allowed);
        const on = settings.notifyOn && settings.popupOn !== false && allowed;
        return schedulePopups(on ? weekSlots(settings, pool) : [], (id) => byId.get(id)?.n ?? 0);
      }).catch(() => {});
      PhoneSettings.takeOpenCard().then(({ id }) => { const e = id ? byId.get(id) : undefined; if (e) setOpen(e.c); }).catch(() => {});
    };
    run();
    const onVis = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pool, settings, byId]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const what = (e.data as { habibunaPopup?: string } | null)?.habibunaPopup;
      if (!what || !preview) return;
      if (what === 'open') { const id = (JSON.parse(preview) as { card: { id: string } }).card.id; const c = byId.get(id)?.c; if (c) setOpen(c); }
      setPreview(null);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [preview, byId]);

  useEffect(() => {
    if (!cards) return;
    return listenTaps((id) => { const e = byId.get(id); if (e) setOpen(e.c); });
  }, [cards, byId]);


  const enableNotify = async () => {
    if (!(await askPermission())) { say(isNative ? 'لم تُفعَّل الإشعارات. يمكنك تفعيلها من إعدادات الهاتف.' : notifySupported() ? 'لم تُفعَّل الإشعارات في المتصفح.' : 'هذا المتصفح لا يدعم الإشعارات.'); return false; }
    setSettings((s) => ({ ...s, notifyOn: true }));
    return true;
  };

  const previewPopup = async () => {
    const last = feed[feed.length - 1];
    const c = last?.c ?? cardFor(pool, dayNo, 0);
    const json = popupJson(c, last ? feed.length - 1 : 0, byId.get(c.id)?.n ?? 0);
    if (!isNative) { setPreview(json); return; }
    const r = await PhoneSettings.previewPopup({ json, cardId: c.id }).catch(() => ({ shown: false }));
    if (!r.shown) say('يلزم أولًا السماح بـ«الظهور فوق التطبيقات الأخرى».');
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
            {showCover && <CardBack />}
            {feed.length > 0 && <h2 className="today">{feed.length > 1 ? 'بطاقات اليوم' : 'بطاقة اليوم'}</h2>}
            {feed.map((e) => <CardBlock key={e.c.id} c={e.c} fav={favs.includes(e.c.id)} onFav={() => toggleFav(e.c.id)} onShare={() => doShare(e.c)} />)}
            {feed.length === 0 && pool.length > 0 && (
              <div className="waiting">
                <p>«حبيبنا» مواقف صغيرة موثّقة تكشف لك عظمة شخصيته ﷺ، تصلك ثلاث بطاقات كل يوم: العاشرة صباحًا، والثالثة ظهرًا، والثامنة مساءً.</p>
                <b>البطاقة القادمة اليوم عند {fmt(times[0])}</b>
                <small>ما تحفظه بـ ♡ تجده في «المفضلة» متى شئت.</small>
              </div>
            )}
            {feed.length > 0 && <p className="muted next">{nextAt !== undefined ? `البطاقة القادمة اليوم عند ${fmt(nextAt)}` : `البطاقة القادمة غدًا عند ${fmt(times[0])} بإذن الله`}</p>}
            {pool.length === 0 && <p className="muted">كل الأنواع مخفيّة. افتح ⋯ لإظهارها.</p>}
            {isNative && offer && settings.notifyOn && (offer === 'done' || (settings.popupOn === false && Date.now() - firstOpen > 2 * 86_400_000)) && (
              <div className="offer">
                {offer === 'ask' ? (
                  <>
                    <b>ميزة اختيارية: البطاقة على شاشتك</b>
                    <p>تصلك البطاقة الآن تنبيهًا صغيرًا في أعلى الشاشة، وقد يضيع بين التنبيهات الكثيرة.</p>
                    <p>وإن شئت، تنفتح البطاقة نفسها على شاشتك في مواعيدها: العاشرة صباحًا، والثالثة ظهرًا، والثامنة مساءً، حتى لو كنت تستعمل تطبيقًا آخر؛ فتقرؤها، ثم تغلقها بزرّ «اللهم صلِّ وسلِّم على نبيّنا محمد». ولترى شكلها اضغط «معاينة».</p>
                    <div className="safe">
                      <p>تحتاج هذه الميزة إلى إذن «الظهور فوق التطبيقات الأخرى». ربما سمعت تحذيرًا من هذا الإذن، لأن بعض التطبيقات تسيء استعماله؛ أما «حبيبنا» فلا يستعمله إلا لأمر واحد: إظهار بطاقته في مواعيدها الثلاثة.</p>
                      <p>فهو لا يرى ما على شاشتك، ولا يقرأ ما تكتبه، ولا يجمع عنك أي معلومة. ويمكنك إيقاف الميزة متى شئت من «الإعدادات ⚙».</p>
                    </div>
                    <div className="btns">
                      <button className="primary" onClick={() => { setSettings({ ...settings, popupOn: true }); setOffer('done'); if (overlay !== true) void PhoneSettings.openOverlaySettings().catch(() => {}); }}>نعم، فعّلها</button>
                      <button className="ghost" onClick={() => void previewPopup()}>معاينة</button>
                      <button className="linkbtn" onClick={closeOffer}>لا، شكرًا</button>
                    </div>
                  </>
                ) : (
                  <>
                    <b>{overlay ? 'تم تفعيل البطاقة على الشاشة' : 'بقيت خطوة واحدة'}</b>
                    {!overlay && <p>في الصفحة التي ستنفتح، فعّل الزرّ المقابل لـ«حبيبنا»، ثم عُد إلى التطبيق.</p>}
                    {!overlay && <button className="ghost" onClick={() => void PhoneSettings.openOverlaySettings().catch(() => {})}>فتح صفحة الإذن</button>}
                    {maker === 'xiaomi' && <p>وفي هواتف شاومي: فعّل أيضًا «عرض النوافذ المنبثقة أثناء التشغيل في الخلفية» من صفحة أذونات «حبيبنا».</p>}
                    {maker === 'xiaomi' && <button className="ghost" onClick={() => void PhoneSettings.openPopupPermissions().catch(() => {})}>فتح أذونات «حبيبنا»</button>}
                    <button className="linkbtn" onClick={closeOffer}>تم</button>
                  </>
                )}
              </div>
            )}
            {past.length > 0 && (
              <details className="past">
                <summary>بطاقات الأيام الماضية</summary>
                {past.map((g) => (
                  <div key={g.label} className="pastday">
                    <h3>{g.label}</h3>
                    <ul className="list">
                      {g.cards.map((c) => (
                        <li key={c.id}><button onClick={() => setOpen(c)}><b><i aria-hidden="true">{markOf(c.chapter)}</i> {c.chapter === REMINDER ? 'تذكير' : c.title}</b><span>{c.text}</span></button></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            )}
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
                  if (on && !(await askPermission())) { say(isNative ? 'لم تُفعَّل الإشعارات. يمكنك تفعيلها من إعدادات الهاتف.' : notifySupported() ? 'لم تُفعَّل الإشعارات في المتصفح.' : 'هذا المتصفح لا يدعم الإشعارات.'); return; }
                  setSettings({ ...settings, notifyOn: on });
                  // هواتف شاومي وأمثالها: إرشاد مرة واحدة لتصل الإشعارات والتطبيق مغلق
                  if (on && maker !== 'normal' && !load('guideSeen', false)) { setGuide(true); save('guideSeen', true); }
                }} />
              </label>
              <p className="muted small">تصلك ثلاث بطاقات كل يوم: {slots().map(fmt).join(' · ')}</p>
              <button className="ghost" onClick={async () => {
                if (!(await askPermission())) { say(isNative ? 'فعّل الإشعارات أولًا من إعدادات الهاتف.' : 'فعّل الإشعارات أولًا في المتصفح.'); return; }
                say((await showCard(feed[0]?.c ?? cards[0])) ?? 'أُرسل إشعار تجريبي.');
              }}>إشعار تجريبي</button>
              {isNative && settings.notifyOn && planned !== null && <p className="muted small">إشعارات مجدولة للأيام السبعة القادمة: {planned}</p>}
              {isNative && (
                <label className="row">
                  <span><b>إظهار البطاقة على الشاشة</b><small>تنفتح البطاقة على شاشتك في موعدها</small></span>
                  <input type="checkbox" checked={settings.popupOn !== false} onChange={(e) => setSettings({ ...settings, popupOn: e.target.checked })} />
                </label>
              )}
              {isNative && settings.popupOn !== false && overlay === false && (
                <button className="ghost" onClick={() => void PhoneSettings.openOverlaySettings().catch(() => {})}>السماح بـ«الظهور فوق التطبيقات الأخرى»</button>
              )}
              {isNative && settings.popupOn !== false && maker === 'xiaomi' && (
                <button className="linkbtn" onClick={() => void PhoneSettings.openPopupPermissions().catch(() => {})}>في شاومي: السماح بـ«عرض النوافذ المنبثقة أثناء التشغيل في الخلفية»</button>
              )}
              <button className="ghost" onClick={() => void previewPopup()}>معاينة البطاقة على الشاشة</button>
              {maker !== 'normal' && <button className="linkbtn" onClick={() => setGuide(true)}>لا تصلك البطاقات حين يكون التطبيق مغلقًا؟</button>}
              <button className="linkbtn" onClick={() => setWelcome(isNative ? 2 : 1)}>كيف تعمل الإشعارات؟</button>
              {isNative && (
                <button className="ghost" onClick={async () => {
                  if (!(await askPermission().catch(() => false))) { say('فعّل الإشعارات أولًا من إعدادات الهاتف.'); return; }
                  say((await testLater(cardFor(pool, dayNo + 1, 0) ?? cards[0])) ?? 'سيصلك إشعار بعد دقيقة. ارجع إلى الشاشة الرئيسية، ولا تغلق التطبيق من قائمة التطبيقات الأخيرة.');
                }}>تجربة إشعار بعد دقيقة</button>
              )}
              {isNative && (
                <button className="ghost" onClick={async () => { await askPermission().catch(() => false); setDiag(['…']); setDiag(await diagnose(feed[0]?.c ?? cards[0])); }}>فحص الإشعارات</button>
              )}
              {diag && <pre className="diag">{diag.join('\n')}</pre>}
              {isNative && exact === false && (
                <button className="ghost" onClick={async () => { const ok = await askExact().catch(() => false); setExact(ok); say(ok ? 'ستصل البطاقات في وقتها بالضبط.' : 'ستبقى المواعيد تقريبية، وقد تتأخر البطاقة دقائق قليلة.'); }}>
                  لتصل البطاقات في وقتها بالضبط: اسمح بـ«المنبّهات والتذكيرات»
                </button>
              )}
              <p className="note">{isNative
                ? 'يُجهّز التطبيق مواعيد بطاقات الأيام السبعة القادمة، ويجدّدها كلما فتحته. وفي هواتف شاومي وهواوي وأوبو: فعّل «التشغيل التلقائي» واجعل «توفير البطارية» على «بلا قيود»، وإلا فقد تتأخر البطاقات أو لا تصل.'
                : 'في المتصفح لا تصل الإشعارات إلا والتطبيق مفتوح. أما وصولها والتطبيق مغلق فيحتاج إلى نسخة الهاتف.'}</p>
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
            <CardBlock c={open} fav={favs.includes(open.id)} onFav={() => toggleFav(open.id)} onShare={() => doShare(open)} />
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
                  <li><b>{fmt(times[0])}</b> — يومًا من ملامحه ﷺ وحياته اليومية كأنك تراه، ويومًا من مواقفه.</li>
                  <li><b>{fmt(times[1])}</b> — موقف من مواقفه وأخلاقه.</li>
                  <li><b>{fmt(times[2])}</b> — تذكير بالصلاة عليه ﷺ (ويوم الجمعة تذكير خاص).</li>
                </ul>
                {settings.notifyOn ? (
                  <button className="primary" onClick={() => (isNative && maker !== 'normal' ? setWelcome(2) : closeWelcome())}>{isNative && maker !== 'normal' ? 'التالي' : 'ابدأ'}</button>
                ) : (
                  <>
                    <div className="safe">
                      <b>إذن واحد: الإشعارات</b>
                      <p>لننبّهك حين يحين موعد البطاقة، ثلاث مرات في اليوم لا أكثر.</p>
                      <p>«حبيبنا» لا يطلب حسابًا ولا رقم هاتف، ولا يصل إلى رسائلك أو صورك أو جهات اتصالك، ولا يجمع عنك أي معلومة. ويمكنك إيقاف الإشعارات متى شئت من «الإعدادات ⚙».</p>
                    </div>
                    <p className="muted small">بعد الضغط ستظهر لك رسالة من الهاتف؛ اختر فيها «السماح».</p>
                    <button className="primary" onClick={async () => { if (await enableNotify()) { if (isNative && maker !== 'normal') setWelcome(2); else closeWelcome(); } }}>فعّل الإشعارات</button>
                    <button className="ghost" onClick={closeWelcome}>لاحقًا</button>
                  </>
                )}
              </>
            ) : maker !== 'normal' ? (
              <>
                <h2>خطوة أخيرة خاصة بهاتفك</h2>
                <p>{maker === 'xiaomi' ? 'توقف هواتف شاومي' : 'توقف بعض الهواتف'} التطبيقاتِ المغلقة توفيرًا للبطارية، فتضيع معها مواعيد البطاقات. ولكي تصلك البطاقات وإن أغلقت التطبيق، اضغط الزرّ أدناه، ثم غيّر في الصفحة التي ستنفتح أمرين، مرةً واحدة فقط:</p>
                <ol>
                  <li><b>التشغيل التلقائي:</b> فعّله.</li>
                  <li><b>توفير البطارية:</b> اختر «بلا قيود».</li>
                </ol>
                <div className="safe">
                  <p>لن يبقى التطبيق يعمل في الخلفية، ولن يستهلك بطاريتك؛ كلّ ما في الأمر أن مواعيد البطاقات الثلاث تبقى محفوظة بعد إغلاقه.</p>
                </div>
                <button className="primary" onClick={() => void PhoneSettings.openAppSettings().catch(() => {})}>فتح إعدادات «حبيبنا»</button>
                <button className="ghost" onClick={closeWelcome}>تم</button>
              </>
            ) : (
              <>
                <h2>كيف تعمل الإشعارات؟</h2>
                <p className="muted small">يُجهّز التطبيق مواعيد بطاقات الأيام السبعة القادمة، ويجدّدها كلما فتحته، فتصلك البطاقات ولو كان مغلقًا. ولتغيير صوت الإشعارات أو طريقة ظهورها: إعدادات الهاتف ← التطبيقات ← «حبيبنا» ← الإشعارات.</p>
                <button className="primary" onClick={closeWelcome}>تم</button>
              </>
            )}
          </div>
        </div>
      )}
      {guide && (
        <div className="modal" onClick={() => setGuide(false)}>
          <div className="sheet guide" onClick={(e) => e.stopPropagation()}>
            <h2>لتصلك البطاقات وإن كان التطبيق مغلقًا</h2>
            <p className="muted small">يوقف هاتفك التطبيقات المغلقة ويمسح مواعيدها توفيرًا للبطارية. يكفي أن تغيّر أمرين، مرةً واحدة فقط:</p>
            <ol>
              <li><b>{maker === 'xiaomi' ? 'التشغيل التلقائي' : 'التشغيل التلقائي / التشغيل في الخلفية'}:</b> فعّله لـ«حبيبنا».</li>
              <li><b>توفير البطارية:</b> اختر «بلا قيود» لـ«حبيبنا».</li>
            </ol>
            {maker === 'xiaomi' && <button className="primary" onClick={() => void PhoneSettings.openAutostart().catch(() => {})}>فتح «التشغيل التلقائي»</button>}
            <button className={maker === 'xiaomi' ? 'ghost' : 'primary'} onClick={() => void PhoneSettings.openAppSettings().catch(() => {})}>فتح إعدادات «حبيبنا»</button>
            <p className="muted small">بعد ذلك جرّب زرّ «تجربة إشعار بعد دقيقة»، ثم أغلق التطبيق وانتظر.</p>
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
      {previewSrc && <iframe className="popframe" title="معاينة البطاقة" src={previewSrc} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
