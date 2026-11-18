# صفحة مراجعة «أحيِ سنّة» الدفعة 1: python3 data/sunnah/page.py
import json,html
src=open('data/seerah/review1.html').read()
css=src[src.index('<style>'):src.index('</style>')]+"""
.face{border-color:var(--frame);text-align:right;padding:18px 20px 14px}
.kick{font-family:var(--body);font-weight:600;color:#8a6a1f}
.orig{border-top:1px dashed #d8ccb0;margin-top:10px;padding-top:8px;font-size:.9rem;color:#3c382c}
.orig .o{font-family:var(--serif);font-size:1rem;line-height:1.9}
.weak .txt{font-style:italic}
h2{font-family:var(--serif);color:var(--gold);margin:8px 0 -8px;font-size:1.5rem}
.how ul{margin:.3em 0;padding-inline-start:1.2em}
</style>"""
script=src[src.index('<script>'):].replace('db.collection("seerah1")','db.collection("sunnah1")')
d=json.load(open('data/sunnah/batch1.json'))['sunnah']
o=['<title>أحيِ سنّة: الدفعة الأولى</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600&display=swap">',css,'<div class="wrap">',
'<header><h1>أحيِ سنّة: الدفعة الأولى</h1><div>52 سنّة من سننه ﷺ اليومية، تظهر سطرًا في أداة «يومك» تتبادل مع المهمة والسنن، ولمسها يُظهر أصلها. كل سنّة بحديثها ومصدره ودرجته.</div></header>',
'''<div class="how"><b>كيف تراجع:</b> «موافق» أو «أغيّر» أو «ملاحظة» تحت كل سنّة؛ ما لم تختر فيه شيئًا يُعدّ مقبولًا.
<ul><li>النص المعروض هو ما سيظهر على الشاشة، يسبقه «✦ أحيِ سنّة:».</li>
<li>الصحيح والحسن بصيغة الأمر؛ والضعيف بصيغة «رُوي أنه ﷺ…» وبخط مائل (المثال الأخير S52).</li>
<li>حذفتُ ما يتكرّر مع المهام الخفيّة أو «✦ جرّب» أو جمل الشريط: العطاس، والسلام على الأهل، والاستغفار مئة مرة، ودعاء المطر، والأكل باليمين، وركعتا الوضوء، وقراءة المعوّذات قبل النوم، ومساعدة الأهل في البيت.</li>
<li>الدرجات من أحكام عدّة علماء (الألباني، أحمد شاكر، الأرناؤوط، زبير علي زئي…)، وأرقام غير الصحيحين تُراجَع في الدرر قبل النشر.</li>
<li>الأحاديث الضعيفة قليلة في هذه الدفعة لأني بحثتُ في الكتب الستة المتوفّرة عندي؛ الدفعة الثانية تتوسّع في الضعيف من المسند والطبراني والبيهقي عبر الدرر.</li></ul></div>''']
cur=None
for t in d:
  if t['cat']!=cur: cur=t['cat']; o.append(f'<h2>{cur}</h2>')
  kick='✦ رُوي' if t['weak'] else '✦ أحيِ سنّة:'
  nt=f'<div class="note"><b>ملاحظتي:</b> {html.escape(t["note"])}</div>' if t.get('note') else ''
  o.append(f'<article class="q{" weak" if t["weak"] else ""}" style="--frame:#0f5c4d"><div class="num">{t["id"]}</div><div class="face"><div class="kick">{kick}</div><p class="txt">{html.escape(t["text"])}</p><div class="orig"><div>أصلها:</div><div class="o">{html.escape(t["origin"])}</div><div class="src">المصدر: {html.escape(t["source"])}</div><div class="grade">{html.escape(t["grade"])}</div></div></div>{nt}<div class="dec" data-id="{t["id"]}"><div class="btns"><button data-v="ok">موافق</button><button data-v="change">أغيّر</button><button data-v="note">ملاحظة</button></div><textarea id="n-{t["id"]}" placeholder="اكتب التعديل أو الملاحظة هنا" hidden></textarea><div class="st" aria-live="polite"></div></div></article>')
o.append('</div>'+script)
open('data/sunnah/review1.html','w').write('\n'.join(o)); print('ok')
