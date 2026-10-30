// الأدوات المشتركة لقوالب الفيديو: كل إطار يُحسب من الزمن (render(t))، والمؤثرات الصوتية تُسجَّل في SFX ليركّبها sfx.py.
// قاعدة الصوت (اختيار المستخدم، النسخة A): نقرة خافتة لكل كلمة من الترجمة السفلية، ولا صوت لكلمات نص البطاقة.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, d) => clamp((t - a) / d);
const eo = x => 1 - Math.pow(1 - x, 3);
const ei = x => x * x * x;
const back = x => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const h = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
const css = (el, o) => Object.assign(el.style, o);
const SFX = [];
const TITLE_STEP = .2; // سرعة ظهور كلمات العنوان (أبطأ بطلب المستخدم؛ كانت .11)
const sfx = (t, kind, gain = 1) => SFX.push({ t: +t.toFixed(3), kind, gain });

const CORNER = `<svg class="corner CLS" viewBox="0 0 100 100"><g fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2h56M2 2v56" stroke-width="2.4"/><path d="M10 10h40M10 10v40"/><g transform="translate(34 34)"><rect x="-15" y="-15" width="30" height="30"/><rect x="-15" y="-15" width="30" height="30" transform="rotate(45)"/><circle r="5.5"/></g><path d="M34 19v-9M19 34h-9M49 34h9M34 49v9"/></g></svg>`;
const corners = () => ['tl', 'tr', 'bl', 'br'].map(c => CORNER.replace('CLS', c)).join('');
const ICON = `<svg viewBox="0 0 512 512"><rect width="512" height="512" fill="#0f5c4d"/><path d="M256 70c60 40 110 70 110 150v170H146V220c0-80 50-110 110-150z" fill="none" stroke="#d4b25c" stroke-width="10"/><text x="256" y="320" text-anchor="middle" font-size="150" fill="#f3e7c4" font-family="Amiri">محمد</text></svg>`;
const MIHRAB = `<svg viewBox="0 0 200 260" width="46%"><path d="M100 10c40 26 74 48 74 104v136H26V114c0-56 34-78 74-104z" fill="none" stroke="currentColor" stroke-width="5"/><path d="M100 34c30 20 54 38 54 82v116H46V116c0-44 24-62 54-82z" fill="none" stroke="currentColor" stroke-width="2" opacity=".6"/><text x="100" y="170" text-anchor="middle" font-size="58" fill="#f3e7c4" font-family="Amiri">محمد</text></svg>`;
const MARK = { 'الملامح والشكل': '◈', 'حياته اليومية': '✧', 'ما يحبه': '♥', 'الصلاة عليه': '✦' };
// الأقواس والأرقام بخط Naskh: Tajawal المحمَّل بلا أرقام ولا أقواس، فتؤخذ من Amiri الذي يقلب الأقواس في النص العربي
const bidiNums = s => s.replace(/\([^()]*\d[^()]*\)/g, x => `<span style="font-family:Naskh,sans-serif">${x}</span>`);

// نص بكلمة مُبرزة بين [ ] (و _ مسافة داخلها) → كلمات منفصلة تظهر واحدة واحدة
function words(text) {
  return text.split(' ').map(w => {
    const m = w.match(/^\[(.+)\]([؟?!.،:]*)$/), acc = !!m;  // علامة الترقيم بعد ] تبقى خارج الإبراز
    w = (acc ? m[1] : w).replace(/_/g, ' ').replace('ﷺ', '<span class="saw">ﷺ</span>');
    return `<span class="w${acc ? ' acc' : ''}">${acc ? `<span style="position:relative">${w}<i class="ul"></i></span>${m[2]}` : w}</span>`;
  }).join(' ');
}
function revealWords(el, lt, start, step, { dy = 26, blur = 8 } = {}) {
  [...el.querySelectorAll('.w')].forEach((w, i) => {
    const a = start + i * step, p = eo(seg(lt, a, .28));
    css(w, { opacity: p, transform: `translateY(${(1 - p) * dy}px)`, filter: `blur(${(1 - p) * blur}px)` });
    const ul = w.querySelector('.ul');
    if (ul) ul.style.transform = `scaleX(${eo(seg(lt, a + .25, .35))})`;
  });
}
const wordCount = el => el.querySelectorAll('.w').length;
const wordTimes = (el, start, step) => [...el.querySelectorAll('.w')].map((_, i) => start + i * step);

// كلمات القول بين «» تُلوَّن بلون الباب داخل البطاقة
function quoteMark(html) {
  let inQ = false;
  return html.replace(/<span class="w">([^]*?)<\/span>/g, (m, w) => {
    if (w.includes('«')) inQ = true;
    const out = `<span class="w${inQ ? ' q' : ''}">${w}</span>`;
    if (w.includes('»')) inQ = false;
    return out;
  });
}
// وجه البطاقة من بيانات cards.json كما هي (العنوان والنص والمصدر والدرجة)
function cardFace(c, { textSize } = {}) {
  return `<div class="card ${c.theme || 'ivory'}"><div class="inner">${corners()}
    <div class="kicker">${MARK[c.chapter] || '✦'} ${c.chapter}</div><div class="num"><span>✦</span></div><div class="ctitle">${c.title}</div>
    <div class="ctext"${textSize ? ` style="font-size:${textSize}px"` : ''}>${quoteMark(words(c.text))}</div>
    <div class="divider"><span></span><i></i><span></span></div>
    <div class="src"><div>${bidiNums(c.source)}</div><div class="grade">${c.grade}</div></div></div></div>`;
}

// ---------- المشاهد ----------
const root = document.getElementById('root');
const scenes = [];
let T0 = 0;
function scene(dur, build) {
  const el = h('<div class="scene abs"></div>'); root.appendChild(el);
  const s = { start: T0, dur, el }; T0 += dur; s.update = build(el, s); scenes.push(s); return s;
}
// شارة الخطوة والعنوان والترجمة السفلية (بنقرة لكل كلمة)
function chrome(el, s, { step, title, sub, subStart = .7, subStep = .27 }) {
  let badge = null;
  if (typeof step === 'string') {
    badge = h(`<div class="badge abs"><div class="pill"><i></i>${step.replace('ﷺ', '<span class="saw">ﷺ</span>')}</div></div>`);
    el.appendChild(badge);
  } else if (step) {
    badge = h(`<div class="badge abs"><div class="pill"><i></i>${step[2] ? step[2].replace('ﷺ', '<span class="saw">ﷺ</span>') + '&nbsp; · &nbsp;' : ''}${step[0]}/${step[1]}</div><div class="dots">${Array.from({ length: step[1] }, (_, i) => `<b class="${i < step[0] ? 'on' : ''}"></b>`).join('')}</div></div>`);
    el.appendChild(badge);
  }
  const ti = h(`<div class="title abs">${words(title)}</div>`); el.appendChild(ti);
  // العنوان الطويل يصغر ليبقى في سطر؛ فإن صار أصغر من 90px انقسم سطرين بخط 96px (كأسئلة الهوك الطويلة)
  if (ti.scrollWidth > 1000) {
    const fs = Math.floor(108 * 1000 / ti.scrollWidth);
    if (fs >= 90) ti.style.fontSize = fs + 'px';
    else css(ti, { fontSize: '96px', whiteSpace: 'normal', left: '60px', right: '60px', lineHeight: '1.45' });
  }
  const su = sub ? h(`<div class="sub abs">${words(sub)}</div>`) : null;
  if (su) { el.appendChild(su); wordTimes(su, subStart, subStep).forEach((t, i) => sfx(s.start + t, 'tick', i % 2 ? .85 : 1)); }
  const upd = lt => {
    if (badge) { const p = eo(seg(lt, .05, .4)); css(badge, { opacity: p, transform: `translateX(-50%) translateY(${(1 - p) * -20}px)` }); }
    revealWords(ti, lt, .12, TITLE_STEP, { dy: 60, blur: 14 });
    if (su) revealWords(su, lt, subStart, subStep);
  };
  upd.titleEl = ti;
  return upd;
}

// مشهد بطاقة: تصعد مقلوبة ثم تنقلب، يظهر نصها كلمة كلمة (بلا صوت)، ثم الشرح إن طُلب (sharhTitle).
// step: [رقم، عدد، موضوع] أو نص للشارة وحده.
function cardScene(it, step) {
  const c = it.card;
  const tmp = h(`<div>${words(c.text)}</div>`); const n = wordCount(tmp);
  // البطاقة تأتي بعد اكتمال العنوان (d)، وتبقى بعد اكتمال نصها hold ثانية
  const d = Math.max(0, .12 + it.label.split(' ').length * TITLE_STEP + .3 - .7) + (it.pause || 0); // pause: وقفة على العنوان وحده
  const T = 1.85 + d, textEnd = T + n * .2 + .3, readEnd = textEnd + (it.hold || 2.6);
  const withSharh = !!(it.sharhTitle && c.sharh);
  const sharhN = withSharh ? c.sharh.text.split(' ').length : 0;
  const P = readEnd, sharhStart = P + 1.0, dur = withSharh ? sharhStart + .6 + sharhN * .08 + 5.5 : readEnd;
  return scene(dur, (el, s) => {
    const ch = chrome(el, s, { step, title: it.label });
    const flip = h(`<div class="flip abs" style="left:110px;top:560px;width:860px;height:760px"><div class="back">${MIHRAB}</div><div class="face">${cardFace(c)}</div></div>`);
    el.appendChild(flip);
    const [bk, face] = flip.children, tx = face.querySelector('.ctext'), su = el.querySelector('.sub');
    // البطاقة الطويلة (كبطاقة الجمعة) يصغر خطها حتى لا تتجاوز 900px فتغطي أسفل الشاشة
    // العنوان المقسوم سطرين يدفع البطاقة إلى الأسفل بقدر السطر الزائد
    const extra = Math.max(0, ch.titleEl.offsetHeight - 150);
    if (extra) flip.style.top = (560 + extra) + 'px';
    for (let fs = 50; face.firstChild.offsetHeight > 900 - extra && fs > 34; fs -= 2) tx.style.fontSize = fs + 'px';
    const fit = Math.min(1, (1530 - 560 - extra) / face.firstChild.offsetHeight); // وإن بقيت طويلة تُصغَّر كلها حتى لا تصل إلى الشعار
    let panel = null, pt = null;
    if (withSharh) {
      panel = h(`<div class="panel abs"><h3>${words(it.sharhTitle)}</h3><p>${words(c.sharh.text)}</p><small>${c.sharh.source}</small></div>`);
      el.appendChild(panel); pt = panel.querySelector('p');
      sfx(s.start + P + .1, 'whoosh', .5); sfx(s.start + sharhStart, 'pop', .8);
    }
    sfx(s.start + 1.3 + d, 'pop');
    return lt => {
      ch(lt);
      // الصعود ثم القلب من الظهر إلى الوجه
      const up = back(seg(lt, .7 + d, .55)), rot = 180 * (1 - eo(seg(lt, 1.1 + d, .7)));
      bk.style.transform = `rotateY(${rot - 180}deg)`; face.style.transform = `rotateY(${rot}deg)`;
      const shrink = withSharh ? eo(seg(lt, P, .8)) : 0;
      css(flip, { opacity: clamp(up * 1.5), transform: `translateY(${(1 - up) * 160 - shrink * 120}px) scale(${(.92 + .08 * up) * (1 - .4 * shrink) * fit})`, transformOrigin: '50% 0%' });
      revealWords(tx, lt, T, .2, { dy: 14, blur: 6 });
      if (withSharh) {
        if (su) su.style.visibility = lt > P + .5 ? 'hidden' : '';
        if (su) css(su, { opacity: 1 - seg(lt, P, .4) });
        const q = back(seg(lt, sharhStart - .2, .6));
        css(panel, { opacity: clamp(q * 1.5), transform: `translateY(${(1 - q) * 80}px)` });
        revealWords(panel.querySelector('h3'), lt, sharhStart, .12, { dy: 20 });
        revealWords(pt, lt, sharhStart + .5, .08, { dy: 10, blur: 4 });
        panel.querySelector('small').style.opacity = eo(seg(lt, sharhStart + .6 + sharhN * .08, .5)) * .9;
      }
    };
  });
}

// آخر كل فيديو (قرار المستخدم): كود QR مع «حمّل تطبيقنا من هنا» يبقى ثلاث ثوانٍ تقريبًا
function qrScene() {
  return scene(3.8, (el, s) => {
    const ti = h(`<div class="title abs" style="font-size:100px">${words('حمّل [تطبيقنا] من هنا')}</div>`); el.appendChild(ti);
    const box = h(`<div class="qr abs"><img src="qr.svg"><div class="qrcap">${ICON}<span>حبيبنا ﷺ — أندرويد</span></div></div>`); el.appendChild(box);
    const hint = h(`<div class="hint abs">أو الرابط في البايو</div>`); el.appendChild(hint);
    sfx(s.start + .2, 'pop');
    return lt => {
      revealWords(ti, lt, .05, .08, { dy: 40, blur: 10 });
      const p = back(seg(lt, .1, .5)); css(box, { opacity: clamp(p * 1.5), transform: `translateX(-50%) scale(${.88 + .12 * p})` });
      css(hint, { opacity: eo(seg(lt, .6, .4)) * .85 });
    };
  });
}

function finish() {
  const logo = h(`<div class="logo abs">${ICON}حبيبنا ﷺ</div>`); document.body.appendChild(logo);
  scenes.slice(1).forEach(s => sfx(s.start - .12, 'whoosh'));
  sfx(0, 'whoosh', .6);
  window.render = function (t) {
    document.getElementById('pat').style.transform = `translate(${-(t * 6) % 120}px, ${-(t * 10) % 120}px)`;
    css(logo, { opacity: eo(seg(t, .3, .6)) * (1 - seg(t, scenes[scenes.length - 1].start, .3)) });
    scenes.forEach(s => {
      const lt = t - s.start, on = lt >= -.01 && lt < s.dur + .01;
      s.el.style.display = on ? '' : 'none';
      if (!on) return;
      s.update(lt);
      const last = s === scenes[scenes.length - 1];
      const o = last ? seg(lt, s.dur - .45, .45) : ei(seg(lt, s.dur - .3, .3));
      const i = s.start > 0 ? eo(seg(lt, 0, .25)) : 1;
      css(s.el, { opacity: i * (1 - o), transform: `translateY(${(1 - i) * 30 - o * 70}px)`, filter: o > 0 ? `blur(${o * 12}px)` : 'none' });
    });
  };
  window.META = { duration: T0, sfx: SFX.sort((a, b) => a.t - b.t) };
  render(+(location.hash.slice(1) || 0));
}
