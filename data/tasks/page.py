# صفحة مراجعة المهام الخفيّة: python3 data/tasks/page.py
import json,html
src=open('data/seerah/review1.html').read()
css=src[src.index('<style>'):src.index('</style>')].replace('/* صفحة مراجعة بشكل بطاقات التطبيق','/* صفحة مراجعة المهام بشكل سطر المهمة في التطبيق: إطار ذهبي ورسالة')+"""
.face{border-color:var(--frame);text-align:right;padding:18px 20px 14px}
.kick{font-family:var(--body);font-weight:600;color:#8a6a1f}
.when{display:inline-block;font-size:.78rem;color:#7a5b12;background:#f3e5bf;border-radius:99px;padding:0 10px;margin-inline-start:6px}
.orig{border-top:1px dashed #d8ccb0;margin-top:10px;padding-top:8px;font-size:.92rem;color:#3c382c}
.orig .o{font-family:var(--serif);font-size:1.05rem}
.none{font-size:.82rem;color:#8b846f;margin-top:8px}
h2{font-family:var(--serif);color:var(--gold);margin:8px 0 -8px;font-size:1.5rem}
.how ul{margin:.3em 0;padding-inline-start:1.2em}
</style>"""
script=src[src.index('<script>'):].replace('db.collection("seerah1")','db.collection("tasks1")')
d=json.load(open('data/tasks/batch1.json'))['tasks']
o=['<title>المهام الخفيّة: الدفعة الأولى</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600&display=swap">',css,'<div class="wrap">',
'<header><h1>المهام الخفيّة: الدفعة الأولى</h1><div>مهامك المئة كما كتبتها، وتحت كل مهمة أصلها من آية أو حديث تحقّقتُ من نصّه ورقمه ودرجته.</div></header>',
'''<div class="how"><b>كيف تراجع:</b> تحت كل مهمة: «موافق»، أو «أغيّر» واكتب التعديل، أو «ملاحظة». يُحفظ اختيارك فورًا وأقرؤه أنا، وما لم تختر فيه شيئًا يُعدّ مقبولًا. الشكل كما تظهر المهمة في التطبيق، و«أصلها» يظهر حين يلمسها الشخص.</div>''',
'''<div class="note"><b>ما وجدته إجمالًا:</b><ul>
<li>79 مهمة لها أصل صحيح أو حسن (آية، أو حديث من الصحيحين أو السنن بدرجته). و21 مهمة بلا أصل ظاهر لأنها خير عام لا يحتاج نصًّا بعينه، أو لأني لم أجد لها نصًّا ثابتًا مطابقًا؛ هذه تظهر بلا سطر «أصلها».</li>
<li>نصوص المهام كما كتبتها حرفيًّا؛ لم أغيّر شيئًا، واقتراحاتي في «ملاحظتي» تحت عشر مهام، أهمها 11 و12 و32 و66 و97 و100.</li>
<li><b>مهام المناسبات</b> تظهر في وقتها فقط: الجمعة (89، 90)، ورمضان (91، 92)، والعشر الأواخر (93)، والبرد ديسمبر إلى فبراير (94، 95)، والحر جوان إلى أوت (96)، وسبتمبر للعودة المدرسية (98)، ويوما العيدين (99). اقتراحي: يوم الجمعة دائمًا مهمة من مهمتيه بالتناوب، ويوما العيد مهمة العيد، وفي رمضان مهمة من مهامه كل ثلاثة أيام، ومهام البرد والحر والمدرسة مرة في الأسبوع في موسمها؛ وبقية الأيام من المهام العامة. اكتب ملاحظتك على المهمة 89 إن أردت غير ذلك.</li>
</ul></div>''']
cur=None
for t in d:
  if t['cat']!=cur: cur=t['cat']; o.append(f'<h2>{cur}</h2>')
  when=f'<span class="when">{html.escape(t["whenText"])}</span>' if t.get('whenText') and t['whenText']!='—' else ''
  org=(f'<div class="orig"><div>أصلها:</div><div class="o">{html.escape(t["origin"])}</div><div class="src">المصدر: {html.escape(t["source"])}</div>'+(f'<div class="grade">{html.escape(t["grade"])}</div>' if t.get('grade') else '')+'</div>') if t.get('origin') else '<div class="none">بلا أصل ظاهر</div>'
  nt=f'<div class="note"><b>ملاحظتي:</b> {html.escape(t["note"])}</div>' if t.get('note') else ''
  o.append(f'<article class="q" style="--frame:#b58a3a"><div class="num">{t["n"]}</div><div class="face"><div class="kick">✉ مهمّتك الخفيّة اليوم{when}</div><p class="txt">{html.escape(t["text"])}</p>{org}</div>{nt}<div class="dec" data-id="{t["id"]}"><div class="btns"><button data-v="ok">موافق</button><button data-v="change">أغيّر</button><button data-v="note">ملاحظة</button></div><textarea id="n-{t["id"]}" placeholder="اكتب التعديل أو الملاحظة هنا" hidden></textarea><div class="st" aria-live="polite"></div></div></article>')
o.append('</div>'+script)
open('data/tasks/review1.html','w').write('\n'.join(o)); print('ok')
