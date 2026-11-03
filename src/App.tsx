import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CardData, Settings } from './lib/types';
import { advance, defaultSettings, load, save, syncDeck, today, type Deck } from './lib/store';
import { askExact, askPermission, hasPermission, cardFor, FEATURED, weekSlots, WEEK, dayNumber, PER_DAY, REMINDER, diagnose, exactAllowed, testLater, fmt, isNative, listenTaps, notifySupported, schedule, scheduleWeek, showCard, slots } from './lib/notify';
import { latestApp, loadCards, newer } from './lib/cards';
import { PhoneSettings, phoneMaker, popupJson, schedulePopups, type Maker } from './lib/phone';
import { shareCard } from './lib/shareImage';
import { countUse } from './lib/count';
import { CardFront, markOf } from './components/CardView';
import { Corner, Divider, Mihrab } from './components/Ornaments';
import { Sys, SysLine, sysAr, sysText } from './lib/sysnames';
import { buildQuiz, loadQuiz, QUIZ_AT, QUIZ_MIN, streak, weekKey, type Question, type QuizItem, type QuizRecord } from './lib/quiz';
import { Quiz } from './components/Quiz';
import { App as NativeApp } from '@capacitor/app';
import { useArt, useMaps, openZoom, type ZoomReq } from './lib/art';
import { Zoom } from './components/Zoom';

type Tab = 'feed' | 'favs' | 'settings';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'feed', label: 'البطاقات', icon: '✦' }, { id: 'favs', label: 'المفضلة', icon: '♡' }, { id: 'settings', label: 'الإعدادات', icon: '⚙' },
];
// إطار بشكل البطاقة (وجه عاجي وإطار زمردي وزخارف ذهبية) لصفحات الإعدادات والمساعدة
function Frame({ title, className, children }: { title?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={'panel framed' + (className ? ' ' + className : '')}>
      <Corner className="corner tl" /><Corner className="corner tr" /><Corner className="corner bl" /><Corner className="corner br" />
      {title && <h2 className="ptitle">{title}</h2>}
      {children}
    </div>
  );
}
type Intro = { day: number; ids: string[] };
// بطاقات البداية (قرار المستخدم): ثلاث بطاقات اعتباطية تظهر لمن ثبّت التطبيق حديثًا في يومه الأول،
// ثم تُستثنى من البطاقات القادمة فلا تتكرّر عليه. واحدة من الملامح والحياة اليومية واثنتان من بابين آخرين،
// بلا أدعية ولا تذكير ولا ضعيف ولا طويل.
function pickIntro(cards: CardData[]): string[] {
  const ok = cards.filter((c) => c.chapter !== REMINDER && !c.dua && !c.weak && !c.long && !c.shifa);
  const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const feat = ok.filter((c) => FEATURED.has(c.chapter));
  const out: CardData[] = feat.length ? [rnd(feat)] : [];
  while (out.length < 3) {
    const left = ok.filter((c) => !FEATURED.has(c.chapter) && !out.some((o) => o.chapter === c.chapter));
    if (!left.length) break;
    out.push(rnd(left));
  }
  return out.map((c) => c.id);
}

// «مرة» بالعدد العربي السليم: مرة واحدة، مرتين، 3–10 مرات، 11+ مرة
const times_ = (n: number) => (n === 1 ? 'مرة واحدة' : n === 2 ? 'مرتين' : n <= 10 ? `${n} مرات` : `${n} مرة`);

function CardBlock({ c, fav, onFav, onShare, onPray }: { c: CardData; fav: boolean; onFav: () => void; onShare: () => void; onPray?: () => void }) {
    const [showSrc, setShowSrc] = useState(false);
    const [showSharh, setShowSharh] = useState(false);
    const [showArt, setShowArt] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const art = useArt()[c.id];
    const map = useMaps()[c.id];
    return (
      <article className="block">
        <CardFront card={c} />
        {onPray && c.chapter === REMINDER && <button className="praybtn" onClick={onPray}>اللهم صلِّ وسلِّم على نبيّنا محمد</button>}
        <div className="under">
          <button className={'srcbtn' + (showSrc ? ' on' : '')} onClick={() => setShowSrc((v) => !v)} aria-expanded={showSrc}>
            {showSrc ? 'إخفاء مصدر الحديث' : 'إظهار مصدر الحديث'}
          </button>
          {c.sharh && <button className={'srcbtn sm' + (showSharh ? ' on' : '')} onClick={() => setShowSharh((v) => !v)} aria-expanded={showSharh}>شرح موجز</button>}
          {art && <button className={'srcbtn sm' + (showArt ? ' on' : '')} onClick={() => setShowArt((v) => !v)} aria-expanded={showArt}>صورة</button>}
          {map && <button className={'srcbtn sm' + (showMap ? ' on' : '')} onClick={() => setShowMap((v) => !v)} aria-expanded={showMap}>خريطة</button>}
          <div className="mini">
            <button className={'icon' + (fav ? ' on' : '')} onClick={() => onFav()} aria-label="مفضلة">{fav ? '♥' : '♡'}</button>
            <button className="icon share" onClick={() => onShare()} aria-label="مشاركة"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg></button>
          </div>
        </div>
        {showArt && art && (
          <figure className="hadith artbox">
            <img src={art.src} alt={art.caption} onClick={() => openZoom(art)} onError={(e) => { const i = e.currentTarget; if (!i.src.endsWith(art.fallback)) i.src = art.fallback; }} />
            <figcaption>{art.caption}</figcaption>
            <div className="muted small">رسمٌ تقريبي للتوضيح · المسه لتكبيره</div>
          </figure>
        )}
        {showMap && map && (
          <figure className="hadith artbox mapbox">
            <img src={map.src} alt={map.caption} onClick={() => openZoom(map)} onError={(e) => { const i = e.currentTarget; if (!i.src.endsWith(map.fallback)) i.src = map.fallback; }} />
            <figcaption>{map.caption}</figcaption>
            <div className="muted small">خريطة تقريبية؛ المسافات خطٌّ مستقيم · المسها لتكبيرها</div>
          </figure>
        )}
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
  // الترحيب في صفحتين (الفكرة، ثم إذن الإشعارات)، ثم صفحة الإعدادات، ثم البطاقات (قرار المستخدم)
  const [isNew] = useState(() => !load('welcomeSeen', false) && !load('firstOpen', 0));
  const [welcome, setWelcome] = useState<0 | 1 | 2>(() => (!load('welcomeSeen', false) ? 1 : 0));
  const [firstRun, setFirstRun] = useState(false);
  // بعد الترحيب: شاومي وأمثالها إلى الإعدادات (خطوة البطارية)، وبقية الهواتف إلى البطاقات مباشرة
  const closeWelcome = (granted = settings.notifyOn) => {
    setWelcome(0); save('welcomeSeen', true);
    if (isNative && maker !== 'normal' && granted && !load('guideSeen', false)) { setTab('settings'); setFirstRun(true); }
  };
  // خطوة البطارية لشاومي وأمثالها: في صفحة الإعدادات الأولى حتى يضغط «تم»
  const [phoneStep, setPhoneStep] = useState(() => !load('guideSeen', false));
  const donePhoneStep = () => { setPhoneStep(false); save('guideSeen', true); };
  const [sub, setSub] = useState<'main' | 'help'>('main');
  // عدّاد الصلاة على النبي ﷺ (اقتراح وافق عليه المستخدم): {رقم اليوم: عدد} في الهاتف وحده، لا يُرسل لأحد.
  // يُحسب من زرّ النافذة على الشاشة (يُؤخذ من الجزء الأصلي بـ takePrays) ومن الزرّ تحت بطاقة التذكير
  const [prays, setPrays] = useState<Record<string, number>>(() => load('prays', {}));
  const addPrays = useCallback((add: Record<string, number>) => setPrays((p) => {
    const n = { ...p };
    for (const [k, v] of Object.entries(add)) n[k] = (n[k] ?? 0) + v;
    // لا نحتفظ إلا بآخر 60 يومًا
    const keys = Object.keys(n).map(Number).sort((a, b) => b - a);
    for (const k of keys.slice(60)) delete n[k];
    save('prays', n); return n;
  }), []);
  // كل صفحة تُفتح من أعلاها
  useEffect(() => { document.querySelector('main')?.scrollTo(0, 0); }, [tab, sub]);
  const [intro, setIntro] = useState<Intro | null>(() => load<Intro | null>('introCards', null));
  // نافذة البطاقة على الشاشة: إذن «الظهور فوق التطبيقات»، ومعاينتها على الويب في إطار
  const [overlay, setOverlay] = useState<boolean | null>(null);
  // إذن شاومي الإضافي (النسخة 3.6): يُقرأ إن أمكن (bgPopupState)، وإلا اختفت خانته بعد زيارة صفحة الإذن (bgPopupVisited)
  const [bgPopup, setBgPopup] = useState<'allowed' | 'denied' | 'unknown' | null>(null);
  const [bgVisited, setBgVisited] = useState(() => load('bgPopupVisited', false));
  // عرض النافذة بعد يومين من أول فتح، مرة واحدة، لمن لم يفعّلها (قرار المستخدم: لا تُطلب أذوناتها في الترحيب)
  // مراجعة الأسبوع (اللعبة): بنك الأسئلة، ونتائج كل أسبوع وأخطاؤه، في الهاتف وحده
  const [bank, setBank] = useState<Question[]>([]);
  const [quizDone, setQuizDone] = useState<Record<string, QuizRecord>>(() => load('quizDone', {}));
  const [quizMiss, setQuizMiss] = useState<string[]>(() => load('quizMiss', []));
  const [quizLater, setQuizLater] = useState(() => load<number>('quizLater', 0));
  const [quiz, setQuiz] = useState<QuizItem[] | null>(null);
  const [firstOpen] = useState<number>(() => { const t = load<number>('firstOpen', 0) || Date.now(); save('firstOpen', t); return t; });
  // زرّ التحديث (طلب المستخدم): يظهر حين تكون في cards.json نسخة أحدث من نسخة التطبيق، و«لاحقًا» يخفيه حتى الغد
  const [updLater, setUpdLater] = useState(() => load<number>('updateLater', 0));
  const [offer, setOffer] = useState<'ask' | 'done' | null>(() => (load('popupOffer', false) ? null : 'ask'));
  const closeOffer = () => { setOffer(null); save('popupOffer', true); };
  const [preview, setPreview] = useState<string | null>(null);
  const previewSrc = useMemo(() => (preview ? `popup.html?t=${Date.now()}#${encodeURIComponent(preview)}` : null), [preview]);
  useEffect(() => { void phoneMaker().then(setMaker); }, []);
  const toastT = useRef<number | undefined>(undefined);

  useEffect(() => {
    loadCards().then(setCards).catch(() => setErr(true));
    loadQuiz().then(setBank).catch(() => {});
  }, []);

  useEffect(() => {
    if (!cards || !isNew || intro) return;
    const it = { day: dayNumber(new Date()), ids: pickIntro(cards) };
    setIntro(it); save('introCards', it);
  }, [cards, isNew, intro]);

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
  // العدّاد المجهول: عند الفتح وعند العودة للتطبيق (مرة في اليوم على الأكثر)
  useEffect(() => {
    countUse();
    const onVis = () => { if (document.visibilityState === 'visible') countUse(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  // الإشعارات بلا زرّ إيقاف داخل التطبيق (قرار المستخدم): مفعّلة ما دام الإذن موجودًا، وتُطفأ من إعدادات الهاتف فقط
  useEffect(() => {
    const sync = () => { void hasPermission().then((g) => setSettings((s) => (s.notifyOn === g ? s : { ...s, notifyOn: g }))).catch(() => {}); };
    sync();
    const onVis = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  useEffect(() => { save('hiddenChapters', hidden); }, [hidden]);

  const say = useCallback((m: string) => { setToast(m); window.clearTimeout(toastT.current); toastT.current = window.setTimeout(() => setToast(''), Math.max(2200, m.length * 70)); }, []);

  // ترتيب البطاقات المحفوظ بلا الأنواع المخفيّة؛ منه تُحسب بطاقات كل يوم (في التطبيق وفي الإشعارات)
  // بطاقات البداية مستثناة منه، فلا تعود في الأيام القادمة
  const pool = useMemo(() => {
    const skip = new Set(intro?.ids ?? []);
    return (deck?.order ?? []).map((id) => byId.get(id)?.c).filter((c): c is CardData => !!c && !skip.has(c.id) && (c.chapter === REMINDER || !hidden.includes(c.chapter)));
  }, [deck?.order, byId, hidden, intro]);

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
  // العدّ يبدأ من التثبيت (قرار المستخدم): في يوم التثبيت لا تظهر إلا مواعيد ما بعد ساعة التثبيت
  const installDay = dayNumber(new Date(firstOpen));
  const installMin = new Date(firstOpen).getHours() * 60 + new Date(firstOpen).getMinutes();
  const slotOk = (day: number, m: number) => day > installDay || (day === installDay && m > installMin);
  // سجلّ ما وصل فعلًا: بطاقة كل موعد تُثبَّت قبل حلوله ولا تتغيّر بعده، فلا تتبدّل بطاقات الأيام الماضية
  // (ولا أسئلة مراجعة الأسبوع) إذا وصلت بطاقات جديدة فأُعيد خلط الترتيب، أو أُخفي باب. في الهاتف وحده.
  const [hist, setHist] = useState<Record<string, string[]>>(() => load('cardHist', {}));
  useEffect(() => {
    if (pool.length === 0) return;
    const n = new Date(), today = dayNumber(n), nm = n.getHours() * 60 + n.getMinutes();
    const h: Record<string, string[]> = {};
    for (const [d, v] of Object.entries(hist)) if (Number(d) >= today - 40) h[d] = [...v];
    for (let d = today - 7; d <= today + WEEK; d++) {
      const row = h[d] ?? [];
      times.forEach((m, k) => { if (d > today || (d === today && m > nm) || !row[k]) row[k] = cardFor(pool, d, k).id; });
      h[d] = row;
    }
    if (JSON.stringify(h) !== JSON.stringify(hist)) { setHist(h); save('cardHist', h); }
  }, [pool, times, dayNo]); // eslint-disable-line react-hooks/exhaustive-deps
  const cardAt = (day: number, k: number): CardData => byId.get(hist[day]?.[k] ?? '')?.c ?? cardFor(pool, day, k);
  const feed = useMemo(() => {
    if (pool.length === 0) return [] as { c: CardData; n: number }[];
    return times
      .map((m, k) => ({ m, k, e: byId.get(cardAt(dayNo, k).id) }))
      .filter((x) => x.e && x.m <= nowMin && slotOk(dayNo, x.m))
      .map((x) => x.e!);
  }, [pool, times, dayNo, nowMin, byId, hist]); // eslint-disable-line react-hooks/exhaustive-deps
  const prayWeek = Array.from({ length: 7 }, (_, i) => prays[dayNo - i] ?? 0).reduce((a, b) => a + b, 0);
  const pray = () => { addPrays({ [dayNo]: 1 }); say('صلّى الله عليه وسلّم ✦'); };
  const introCards = useMemo(() => (intro ? intro.ids.map((id) => byId.get(id)?.c).filter((c): c is CardData => !!c) : []), [intro, byId]);
  const introToday = intro && intro.day === dayNo ? introCards : [];
  const nextAt = times.find((m) => m > nowMin);
  // بطاقات الأيام السبعة الماضية (قرار المستخدم): حتى لا تضيع بطاقة فاتت صاحبها
  // تمتلئ يومًا بعد يوم من التثبيت حتى سبعة أيام؛ ويوم التثبيت فيه بطاقات البداية وما وصل بعدها
  const past = useMemo(() => {
    if (pool.length === 0) return [] as { label: string; cards: CardData[] }[];
    return Array.from({ length: 7 }, (_, i) => {
      const day = dayNo - i - 1;
      const d = new Date(now.getTime() - (i + 1) * 86_400_000);
      const label = i === 0 ? 'أمس' : d.toLocaleDateString('ar', { weekday: 'long' });
      const cards = times.flatMap((m, k) => (slotOk(day, m) ? [cardAt(day, k)] : []));
      return { label, cards: intro && intro.day === day ? [...introCards, ...cards] : cards };
    }).filter((g) => g.cards.length > 0);
  }, [pool, times, dayNo, intro, introCards, hist]); // eslint-disable-line react-hooks/exhaustive-deps

  // مراجعة الأسبوع: كل أحد من 11:00 وتبقى متاحة طوال الأسبوع حتى تُنجز.
  // أسئلتها من بطاقات الأيام السبعة قبل الأحد وبطاقة صباح الأحد، كما وصلت صاحبها (العدّ من التثبيت)
  const qKey = weekKey(dayNo);
  const quizOpenNow = dayNo > qKey || nowMin >= QUIZ_AT;
  const weekCards = useMemo(() => {
    if (pool.length === 0) return [] as CardData[];
    const out: CardData[] = [];
    for (let day = qKey - 7; day <= qKey; day++) {
      if (intro && intro.day === day) out.push(...introCards);
      times.forEach((m, k) => { if ((day < qKey || m < QUIZ_AT) && slotOk(day, m)) out.push(cardAt(day, k)); });
    }
    return out;
  }, [pool, times, qKey, intro, introCards, hist]); // eslint-disable-line react-hooks/exhaustive-deps
  const quizReady = useMemo(() => new Set(bank.map((q) => q.card)), [bank]);
  const weekQs = weekCards.filter((c) => quizReady.has(c.id)).length;
  const quizAvail = quizOpenNow && !quizDone[qKey] && weekQs >= QUIZ_MIN;
  const [quizTap, setQuizTap] = useState(false);
  const startQuiz = useCallback(() => {
    const missed = quizMiss.map((id) => byId.get(id)?.c).filter((c): c is CardData => !!c);
    const items = buildQuiz(weekCards, missed, bank);
    if (items.length >= QUIZ_MIN) setQuiz(items);
  }, [weekCards, quizMiss, bank, byId]);
  useEffect(() => {
    if (!quizTap || bank.length === 0) return;
    setQuizTap(false);
    if (quizAvail) startQuiz(); else say(quizDone[qKey] ? 'أتممت مراجعة هذا الأسبوع ✦' : 'لم تمرّ بك بطاقات كافية هذا الأسبوع؛ تأتيك المراجعة الأحد القادم بإذن الله ✦');
  }, [quizTap, bank, quizAvail, startQuiz, quizDone, qKey, say]);
  const finishQuiz = (score: number, wrong: string[]) => {
    const d = { ...quizDone, [qKey]: { score, total: quiz?.length ?? 0 } };
    setQuizDone(d); save('quizDone', d);
    setQuizMiss(wrong); save('quizMiss', wrong);
  };
  const qStreak = streak(quizDone, qKey - 7);

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
      PhoneSettings.bgPopupState().then(({ state }) => setBgPopup(state)).catch(() => setBgPopup('unknown'));
      PhoneSettings.takePrays().then(({ days }) => { const d = JSON.parse(days || '{}') as Record<string, number>; if (Object.keys(d).length) addPrays(d); }).catch(() => {});
      PhoneSettings.takeOpenCard().then(({ id }) => { const e = id ? byId.get(id) : undefined; if (e) setOpen(e.c); }).catch(() => {});
    };
    run();
    const onVis = () => { if (document.visibilityState === 'visible') run(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pool, settings, byId, addPrays]);

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
    return listenTaps((id) => { if (id === 'quiz') { setQuizTap(true); return; } const e = byId.get(id); if (e) setOpen(e.c); });
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
    if (!r.shown) say(`يلزم أولًا السماح بـ${sysText('overlay')}.`);
  };

  // زرّ الرجوع في الهاتف: يغلق النافذة المفتوحة أولًا (المراجعة، البطاقة، التصفية، الإرشاد، المعاينة)،
  // ثم يعود من «المساعدة» إلى الإعدادات، ومن أي صفحة إلى البطاقات؛ وفي البطاقات يُصغّر التطبيق بدل إغلاقه
  const backRef = useRef<() => void>(() => {});
  backRef.current = () => {
    if (zoom) setZoom(null);
    else if (quiz) setQuiz(null);
    else if (open) setOpen(null);
    else if (filterOpen) setFilterOpen(false);
    else if (guide) setGuide(false);
    else if (preview) setPreview(null);
    else if (welcome !== 0) void NativeApp.minimizeApp();
    else if (tab === 'settings' && sub === 'help') setSub('main');
    else if (tab !== 'feed') setTab('feed');
    else void NativeApp.minimizeApp();
  };
  useEffect(() => {
    if (!isNative) return;
    const h = NativeApp.addListener('backButton', () => backRef.current());
    return () => { void h.then((x) => x.remove()); };
  }, []);
  const toggleFav = (id: string) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const arts = useArt();
  // تكبير الصورة (openZoom من أي مكان)، وتنبيه «جديد» مرة واحدة لمن حدّث التطبيق (لا للمثبّت حديثًا)
  const [zoom, setZoom] = useState<ZoomReq | null>(null);
  useEffect(() => {
    const h = (e: Event) => setZoom((e as CustomEvent<ZoomReq>).detail);
    window.addEventListener('hb-zoom', h);
    return () => window.removeEventListener('hb-zoom', h);
  }, []);
  const [artNews, setArtNews] = useState(() => !isNew && !load('artNews', false));
  const doShare = async (c: CardData) => {
    const r = await shareCard(c, arts[c.id]);
    say(r === 'downloaded' ? 'تم حفظ صورة البطاقة' : r === 'copied' ? 'تم نسخ النص' : r === 'shared' ? 'تمت المشاركة' : '');
  };
  const toggleChapter = (ch: string) => setHidden((h) => (h.includes(ch) ? h.filter((x) => x !== ch) : [...h, ch]));

  if (err) return <div className="splash">تعذّر تحميل البطاقات. تحقّق من الاتصال ثم أعد المحاولة.</div>;
  if (!cards || !deck) return <div className="splash"><div className="spin" />جارٍ التحميل…</div>;

  return (
    <div className={'app' + (tab === 'settings' ? ' dressed' : '')}>
      <header className="top">
        <span className="brandmark">حبيبنا</span>
        {tab === 'feed' && (
          <button className={'filterbtn' + (hidden.length ? ' on' : '')} onClick={() => setFilterOpen(true)} aria-label="تصفية الأنواع">⋯</button>
        )}
      </header>
      <main>
        {tab === 'feed' && (
          <section className="page feed">
            {isNative && !settings.notifyOn && welcome === 0 && (
              <div className="offer notify-off">
                <b>الإشعارات غير مفعّلة</b>
                <p>بدونها لا تصلك البطاقات في مواعيدها.</p>
                <div className="btns"><button className="primary" onClick={async () => { if (!(await enableNotify())) void PhoneSettings.openAppSettings().catch(() => {}); }}>فعّل الإشعارات</button></div>
              </div>
            )}
            {isNative && latestApp && newer(latestApp, __APP_VERSION__) && updLater !== dayNo && (
              <div className="offer update">
                <b>نسخة جديدة من «حبيبنا»</b>
                <p>تنفتح صفحة التحميل: اضغط فيها «تحميل التطبيق»، ثم افتح الملف واضغط <Sys k="update" />. تبقى مفضلتك وإعداداتك كما هي.</p>
                <div className="btns">
                  <a className="primary" href="https://mouhamedali92rahali-cpu.github.io/habibuna-app/download.html" target="_blank" rel="noopener">تحميل التحديث</a>
                  <button className="linkbtn" onClick={() => { setUpdLater(dayNo); save('updateLater', dayNo); }}>لاحقًا</button>
                </div>
              </div>
            )}
            {artNews && (
              <div className="offer news">
                <b>جديد في «حبيبنا» ✦</b>
                <p>تحت بعض البطاقات زرّ <b>«صورة»</b> لرسمٍ توضيحي لما ورد فيها، وزرّ <b>«خريطة»</b> للأماكن في المدينة ومكة. والمس الصورة لتكبيرها.</p>
                <div className="btns"><button className="primary" onClick={() => { setArtNews(false); save('artNews', true); }}>حسنًا</button></div>
              </div>
            )}
            {quizAvail && quizLater !== dayNo && (
              <div className="offer quizoffer">
                <b>مراجعة الأسبوع جاهزة ✦</b>
                <p>أسئلة قصيرة عمّا مرّ بك من بطاقات هذا الأسبوع. بعد كل جواب تظهر البطاقة نفسها بنصّها ومصدرها.</p>
                <div className="btns">
                  <button className="primary" onClick={startQuiz}>ابدأ المراجعة</button>
                  <button className="linkbtn" onClick={() => { setQuizLater(dayNo); save('quizLater', dayNo); }}>لاحقًا</button>
                </div>
              </div>
            )}
            {feed.length > 0 && <h2 className="today">{feed.length > 1 ? 'بطاقات اليوم' : 'بطاقة اليوم'}</h2>}
            {feed.map((e) => <CardBlock key={e.c.id} c={e.c} fav={favs.includes(e.c.id)} onFav={() => toggleFav(e.c.id)} onShare={() => doShare(e.c)} onPray={pray} />)}
            {introToday.length > 0 && (
              <>
                <h2 className="today">ثلاث بطاقات للبداية</h2>
                <p className="muted small intro-note">لتتعرّف على «حبيبنا». وبعدها تصلك البطاقات في مواعيدها: العاشرة صباحًا، والثالثة ظهرًا، والثامنة مساءً.</p>
                {introToday.map((c) => <CardBlock key={c.id} c={c} fav={favs.includes(c.id)} onFav={() => toggleFav(c.id)} onShare={() => doShare(c)} />)}
              </>
            )}
            {feed.length === 0 && introToday.length === 0 && pool.length > 0 && (
              <div className="waiting">
                <p>«حبيبنا» مواقف صغيرة موثّقة تكشف لك عظمة شخصيته ﷺ، تصلك ثلاث بطاقات كل يوم: العاشرة صباحًا، والثالثة ظهرًا، والثامنة مساءً.</p>
                <b>{nextAt !== undefined ? `البطاقة القادمة اليوم عند ${fmt(nextAt)}` : `البطاقة القادمة غدًا عند ${fmt(times[0])} بإذن الله`}</b>
                <small>ما تحفظه بـ ♡ تجده في «المفضلة» متى شئت.</small>
              </div>
            )}
            {quizDone[qKey] && <p className="praycount">✦ مراجعة هذا الأسبوع: {quizDone[qKey].score} من {quizDone[qKey].total}</p>}
            {prayWeek > 0 && <p className="praycount">✦ صلّيت على النبي ﷺ هذا الأسبوع {times_(prayWeek)}</p>}
            {(feed.length > 0 || introToday.length > 0) && <p className="muted next">{nextAt !== undefined ? `البطاقة القادمة اليوم عند ${fmt(nextAt)}` : `البطاقة القادمة غدًا عند ${fmt(times[0])} بإذن الله`}</p>}
            {pool.length === 0 && <p className="muted">كل الأنواع مخفيّة. افتح ⋯ لإظهارها.</p>}
            {isNative && offer && settings.notifyOn && (offer === 'done' || (settings.popupOn === false && Date.now() - firstOpen > 2 * 86_400_000)) && (
              <div className="offer">
                {offer === 'ask' ? (
                  <>
                    <b>ميزة اختيارية: البطاقة على شاشتك</b>
                    <p>بدل التنبيه الصغير، تنفتح البطاقة نفسها على شاشتك في مواعيدها، ولو كنت في تطبيق آخر، ثم تغلقها بزرّ «اللهم صلِّ وسلِّم على نبيّنا محمد».</p>
                    <div className="safe">
                      <p>تحتاج إذن <Sys k="overlay" />. قد تكون سمعت تحذيرًا منه، لكن «حبيبنا» لا يستعمله إلا لإظهار بطاقته: لا يرى شاشتك، ولا يجمع عنك شيئًا، وتوقفها متى شئت من «الإعدادات ⚙».</p>
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
                    {maker === 'xiaomi' && <p>وفي هواتف شاومي: فعّل أيضًا <Sys k="bgPopup" /> من صفحة أذونات «حبيبنا».</p>}
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

        {tab === 'settings' && sub === 'main' && (
          <section className="page settings">
            <h1><span>✦</span> الإعدادات <span>✦</span></h1>
            {isNative && maker !== 'normal' && phoneStep && settings.notifyOn && (
              <Frame title="خطوة خاصة بهاتفك" className="hl">
                <p>{maker === 'xiaomi' ? 'هواتف شاومي' : 'بعض الهواتف'} توقف التطبيقات المغلقة توفيرًا للبطارية، فقد لا تصلك البطاقات. يكفي أن تغيّر مرةً واحدة:</p>
                <ul className="steps">
                  <li><Sys k="battery" /> ← <Sys k="noRestrict" /></li>
                  <li><Sys k="autostart" /> ← فعّله إن وجدته</li>
                </ul>
                <div className="safe"><p>لن يعمل التطبيق في الخلفية ولن يستهلك بطاريتك؛ فقط تبقى مواعيد البطاقات محفوظة.</p></div>
                <button className="primary" onClick={() => void PhoneSettings.openAppSettings().catch(() => {})}>افتح إعدادات الهاتف</button>
                <button className="ghost" onClick={() => { donePhoneStep(); if (firstRun) { setFirstRun(false); setTab('feed'); } }}>{firstRun ? 'تم، ابدأ الآن ✦ وصلِّ عليه ﷺ' : 'تم'}</button>
              </Frame>
            )}
            <Frame title="مواعيد البطاقات">
              <div className="times">{slots().map((m, k) => <span key={m}><b>{fmt(m)}</b><small>{['صباحًا', 'ظهرًا', 'مساءً'][k]}</small></span>)}</div>
            </Frame>
            <Frame title="البطاقة على شاشتك">
              {isNative ? (
                <label className="row">
                  <span><b>إظهار البطاقة على الشاشة</b><small>تنفتح البطاقة على شاشتك في موعدها</small></span>
                  <input type="checkbox" checked={settings.popupOn !== false} onChange={(e) => setSettings({ ...settings, popupOn: e.target.checked })} />
                </label>
              ) : <p className="muted small">في نسخة الهاتف تنفتح البطاقة على شاشتك في موعدها.</p>}
              {isNative && settings.popupOn !== false && overlay === false && (
                <div className="perm">
                  <p>لتظهر البطاقة على شاشتك، اسمح بـ{sysAr('overlay')}، ثم ارجع إلى التطبيق.</p>
                  <SysLine k="overlay" />
                  <button className="primary" onClick={() => void PhoneSettings.openOverlaySettings().catch(() => {})}>اضغط هنا للسماح</button>
                </div>
              )}
              {isNative && settings.popupOn !== false && maker === 'xiaomi' && (bgPopup === 'denied' || (bgPopup !== 'allowed' && !bgVisited)) && (
                <div className="perm">
                  <p>وفي هواتف شاومي إذن إضافي لتظهر البطاقة وأنت في تطبيق آخر: {sysAr('bgPopup')}، ثم ارجع إلى التطبيق.</p>
                  <SysLine k="bgPopup" />
                  <button className="ghost" onClick={() => { setBgVisited(true); save('bgPopupVisited', true); void PhoneSettings.openPopupPermissions().catch(() => {}); }}>اضغط هنا للسماح</button>
                </div>
              )}
              <button className="ghost" onClick={() => void previewPopup()}>معاينة</button>
            </Frame>
            <button className="helplink" onClick={() => setSub('help')}>لا تصلك البطاقات؟ المساعدة وتجربة الإشعارات ‹</button>
          </section>
        )}

        {tab === 'settings' && sub === 'help' && (
          <section className="page settings">
            <button className="backbtn" onClick={() => setSub('main')}>› الإعدادات</button>
            <h1><span>✦</span> المساعدة <span>✦</span></h1>
            <Frame title="تجربة الإشعارات">
              <button className="ghost" onClick={async () => {
                if (!(await askPermission())) { say(isNative ? 'فعّل الإشعارات أولًا من إعدادات الهاتف.' : 'فعّل الإشعارات أولًا في المتصفح.'); return; }
                say((await showCard(feed[0]?.c ?? cards[0])) ?? 'أُرسل إشعار تجريبي.');
              }}>إشعار تجريبي الآن</button>
              {isNative && (
                <button className="ghost" onClick={async () => {
                  if (!(await askPermission().catch(() => false))) { say('فعّل الإشعارات أولًا من إعدادات الهاتف.'); return; }
                  say((await testLater(cardFor(pool, dayNo + 1, 0) ?? cards[0])) ?? 'سيصلك إشعار بعد دقيقة. ارجع إلى الشاشة الرئيسية، ولا تغلق التطبيق من قائمة التطبيقات الأخيرة.');
                }}>تجربة إشعار بعد دقيقة</button>
              )}
              {isNative && (
                <button className="ghost" onClick={async () => { await askPermission().catch(() => false); setDiag(['…']); const d = await diagnose(feed[0]?.c ?? cards[0]); if (maker === 'xiaomi') d.splice(2, 0, `إذن شاومي للنوافذ: ${(await PhoneSettings.bgPopupState().catch(() => ({ state: 'خطأ' }))).state}`); setDiag(d); }}>فحص الإشعارات</button>
              )}
              {isNative && settings.notifyOn && planned !== null && <p className="muted small">إشعارات مجدولة للأيام الثلاثين القادمة: {planned}</p>}
              {diag && <pre className="diag">{diag.join('\n')}</pre>}
            </Frame>
            {isNative && (maker !== 'normal' || exact === false) && (
              <Frame title="إن لم تصل البطاقات">
                {maker !== 'normal' && <button className="ghost" onClick={() => setGuide(true)}>لتصل البطاقات والتطبيق مغلق</button>}
                {maker === 'xiaomi' && <button className="ghost" onClick={() => void PhoneSettings.openPopupPermissions().catch(() => {})}>لا تظهر البطاقة على الشاشة؟ إذن شاومي للنوافذ</button>}
                {exact === false && (
                  <button className="ghost" onClick={async () => { const ok = await askExact().catch(() => false); setExact(ok); say(ok ? 'ستصل البطاقات في وقتها بالضبط.' : 'ستبقى المواعيد تقريبية، وقد تتأخر البطاقة دقائق قليلة.'); }}>
                    لتصل في وقتها بالضبط: اسمح بـ<Sys k="alarms" />
                  </button>
                )}
              </Frame>
            )}
            <Frame title="كيف تعمل الإشعارات؟">
              <p>{isNative
                ? `يُجهّز التطبيق مواعيد بطاقات الأيام الثلاثين القادمة، ويجدّدها كلما فتحته، فتصلك البطاقات ولو كان مغلقًا. وفي هواتف شاومي وهواوي وأوبو: فعّل ${sysText('autostart')} إن وجدته، واجعل ${sysText('battery')} على ${sysText('noRestrict')}، وإلا فقد تتأخر البطاقات أو لا تصل.`
                : 'في المتصفح لا تصل الإشعارات إلا والتطبيق مفتوح. أما وصولها والتطبيق مغلق فيحتاج إلى نسخة الهاتف.'}</p>
              {isNative && <p className="muted small">ولتغيير صوت الإشعارات أو طريقة ظهورها: إعدادات الهاتف ← التطبيقات ← «حبيبنا» ← الإشعارات.</p>}
            </Frame>
          </section>
        )}
      </main>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => { setTab(t.id); setSub('main'); }}>
            <i>{t.icon}</i>{t.label}
          </button>
        ))}
      </nav>

      {zoom && <Zoom z={zoom} onClose={() => setZoom(null)} />}
      {quiz && (
        <div className="modal qmodal">
          <Quiz items={quiz} streak={qStreak} favs={favs} onFav={toggleFav} onFinish={finishQuiz} onClose={() => setQuiz(null)} />
        </div>
      )}
      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <CardBlock c={open} fav={favs.includes(open.id)} onFav={() => toggleFav(open.id)} onShare={() => doShare(open)} />
            <button className="ghost" onClick={() => setOpen(null)}>إغلاق</button>
          </div>
        </div>
      )}
      {welcome !== 0 && (
        <div className="modal wmodal">
          <div className="wcard">
            <Corner className="corner tl" /><Corner className="corner tr" /><Corner className="corner bl" /><Corner className="corner br" />
            <div className="winner">
              {welcome === 1 ? (
                <>
                  <div className="logo"><Mihrab /><span className="name">محمد<small>ﷺ</small></span></div>
                  <h2>حبيبنا</h2>
                  <p className="tagline">مواقف صغيرة .. تكشف لك عظمة شخصيته ﷺ</p>
                  <Divider />
                  <p>مواقف قصيرة موثّقة من السنة، تُقرّبك منه ﷺ وتزيدك له حبًّا.</p>
                  <p><b>لا تحتاج إلى البحث عنها؛ تصلك كل يوم ثلاث بطاقات:</b></p>
                  <ul className="wtimes">
                    <li><b>{fmt(times[0])}</b><span>من ملامحه ﷺ وحياته اليومية، أو من مواقفه</span></li>
                    <li><b>{fmt(times[1])}</b><span>موقف من مواقفه وأخلاقه</span></li>
                    <li><b>{fmt(times[2])}</b><span>تذكير بالصلاة عليه ﷺ</span></li>
                  </ul>
                  <p className="wquiz">وكل ثلاثة أيام بطاقة برسمٍ توضيحي أو خريطة،<br />وكل أحد مراجعة قصيرة لما مرّ بك من بطاقات الأسبوع ✦</p>
                  <button className="primary" onClick={() => (settings.notifyOn ? closeWelcome(true) : setWelcome(2))}>{settings.notifyOn ? 'ابدأ' : 'التالي'}</button>
                </>
              ) : (
                <>
                  <h2>إذن واحد فقط</h2>
                  <p>لننبّهك حين يحين موعد البطاقة، ثلاث مرات في اليوم لا أكثر.</p>
                  <div className="safe">
                    <p>«حبيبنا» لا يطلب حسابًا ولا رقم هاتف، ولا يصل إلى رسائلك أو صورك أو جهات اتصالك، ولا يجمع عنك أي معلومة. ويمكنك إيقافها متى شئت من إعدادات الهاتف.</p>
                  </div>
                  <p className="muted small">بعد الضغط ستظهر لك رسالة من الهاتف؛ اختر فيها <Sys k="allow" />.</p>
                  <button className="primary" onClick={async () => { if (await enableNotify()) closeWelcome(true); }}>فعّل الإشعارات</button>
                  <button className="linkbtn" onClick={() => closeWelcome(false)}>لاحقًا</button>
                </>
              )}
              <div className="wdots"><i className={welcome === 1 ? 'on' : ''} /><i className={welcome === 2 ? 'on' : ''} /></div>
            </div>
          </div>
        </div>
      )}
      {guide && (
        <div className="modal" onClick={() => setGuide(false)}>
          <div className="sheet guide" onClick={(e) => e.stopPropagation()}>
            <h2>لتصلك البطاقات والتطبيق مغلق</h2>
            <p className="muted small">يكفي أن تغيّر مرةً واحدة في إعدادات «حبيبنا»:</p>
            <ul className="steps">
              <li><Sys k="battery" /> ← <Sys k="noRestrict" /></li>
              <li><Sys k="autostart" /> ← فعّله إن وجدته</li>
            </ul>
            {maker === 'xiaomi' && <button className="primary" onClick={() => void PhoneSettings.openAutostart().catch(() => {})}>فتح <Sys k="autostart" /></button>}
            <button className={maker === 'xiaomi' ? 'ghost' : 'primary'} onClick={() => void PhoneSettings.openAppSettings().catch(() => {})}>افتح إعدادات الهاتف</button>
            <p className="muted small">ثم جرّب «تجربة إشعار بعد دقيقة» وأغلق التطبيق.</p>
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
