# صفحة مراجعة «من أصحابه ﷺ» الدفعة 2: python3 data/ahl/page2.py
import json,html
src=open('data/seerah/review1.html').read()
css=src[src.index('<style>'):src.index('</style>')]+"""
.face{border-color:var(--frame);text-align:right;padding:18px 20px 14px}
.kick{font-family:var(--body);font-weight:700;color:#8a6a1f}
.orig{border-top:1px dashed #d8ccb0;margin-top:10px;padding-top:8px;font-size:.9rem;color:#3c382c}
.orig .o{font-family:var(--serif);font-size:1rem;line-height:1.9}
h2{font-family:var(--serif);color:var(--gold);margin:8px 0 -8px;font-size:1.5rem}
.how ul{margin:.3em 0;padding-inline-start:1.2em}
</style>"""
script=src[src.index('<script>'):].replace('db.collection("seerah1")','db.collection("ahl2")')
d=json.load(open('data/ahl/batch2.json'))['lines']
o=['<title>أهل بيته وأصحابه ﷺ</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600&display=swap">',css,'<div class="wrap">',
'<header><h1>من أصحابه ﷺ: الدفعة الثانية</h1><div>17 صحابيًّا جديدًا (كان 17 فصار 34، فيتكرّر الاسم كل 34 يومًا بدل 17). الأقرب فالأقرب: المبشّرون والسابقون أولًا، ثم أهل المناقب المشهورة.</div></header>',
'''<div class="how"><b>كيف تراجع:</b> «موافق» أو «أغيّر» أو «ملاحظة» تحت كل جملة؛ ما لم تختر فيه شيئًا يُعدّ مقبولًا.
<ul><li>تحت كل جملة أصلها ومصدرها ودرجتها، ولا يظهر المصدر في السطر نفسه.</li>
<li>فحصتُ كل جملة مقابل البطاقات و«قالوا عنه»؛ ومن له بطاقة عندنا (عبد الله بن سلام، أسماء) اخترتُ له خبرًا آخر.</li>
<li>تركتُ: أبا أيوب (بطاقة KA18 عنه)، وزيد بن ثابت (KN46)، وجريرًا (D17)، وعمرو بن العاص (الترمذي: غريب)، وما فيه خلاف أو حساسية سياسية.</li>
<li>بعد موافقتك تصل للناس بلا تحديث للتطبيق (الملف المنشور الجديد lines.json).</li></ul></div>''']
cur=None
for t in d:
  if t['cat']!=cur: cur=t['cat']; o.append(f'<h2>{cur}</h2>')
  nt=f'<div class="note"><b>ملاحظتي:</b> {html.escape(t["note"])}</div>' if t.get('note') else ''
  fr='#0f5c4d' if t['head'].startswith('من أهل') else '#1f3a5f'
  o.append(f'<article class="q" style="--frame:{fr}"><div class="num">{t["id"]}</div><div class="face"><div class="kick">{t["head"]}</div><p class="txt">{html.escape(t["text"])}</p><div class="orig"><div>أصلها:</div><div class="o">{html.escape(t["origin"])}</div><div class="src">المصدر: {html.escape(t["source"])}</div><div class="grade">{html.escape(t["grade"])}</div></div></div>{nt}<div class="dec" data-id="{t["id"]}"><div class="btns"><button data-v="ok">موافق</button><button data-v="change">أغيّر</button><button data-v="note">ملاحظة</button></div><textarea id="n-{t["id"]}" placeholder="اكتب التعديل أو الملاحظة هنا" hidden></textarea><div class="st" aria-live="polite"></div></div></article>')
o.append('</div>'+script)
open('data/ahl/review2.html','w').write('\n'.join(o)); print('ok')
