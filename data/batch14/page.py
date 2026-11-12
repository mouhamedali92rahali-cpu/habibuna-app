import json,re,html
R='/home/user/mouhamedali92rahali-cpu/habibuna-app'
src=open(R+'/data/seerah/review1.html').read()
css=src[src.index('<style>'):src.index('</style>')+8]
script=src[src.index('<script>'):].replace('db.collection("seerah1")','db.collection("batch14")')
cv=open(R+'/src/components/CardView.tsx').read(); MARK=dict(re.findall(r"'([^']+)':\s*'([^']+)'",cv[cv.index('MARK'):cv.index('MARK')+2600]))
b=json.load(open('batch1.json')); notes=json.load(open('notes.json')); Q={q['card']:q for q in b['quiz']}
FR={'brown':'#6b4a2e','emerald':'#0F5C4D'}
e=html.escape
o=['<title>الدفعة 14: قالوا عنه ومواقف</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600&display=swap">',css.replace('</style>','h2{font-family:var(--serif);color:var(--gold);font-size:1.5rem;margin:12px 0 0}\n.sh{background:var(--notebg);border-radius:10px;padding:10px 14px;font-size:.95rem}\n</style>'),'<div class="wrap">',
 '<header><h1>قالوا عنه، ومواقف من سيرته</h1><div>الدفعة 14 للمراجعة · 50 بطاقة ومعها سؤال لكل بطاقة</div></header>',
 '<div class="how"><b>كيف تراجع:</b> تحت كل بطاقة: «موافق»، أو «أغيّر» واكتب التعديل، أو «ملاحظة». يُحفظ اختيارك فورًا وأقرؤه أنا، وما لم تختر فيه شيئًا يُعدّ مقبولًا. نص الحديث تحت كل بطاقة، والجواب الصحيح في السؤال عليه ✓.</div>',
 '<div class="note">'+notes['_intro']+'</div>']
for c in b['cards']:
  if c['id']=='KA01': o.append('<h2>أولًا: قالوا عنه ﷺ — 25 قولًا</h2>')
  if c['id']=='KB01': o.append('<h2>ثانيًا: مواقف من السيرة — 25 موقفًا</h2>')
  q=Q[c['id']]; h=c['hadith']
  kick=c.get('kick','من مواقف النبي ﷺ')
  abr='<div class="grade weak">✂ اختصرنا الحديث، ونصّه كاملًا تحت البطاقة</div>' if c.get('abridged') else ''
  sh=f'<div class="sh"><b>شرح الكلمات:</b> {e(c["sharh"]["text"])}<div class="muted" style="font-size:.85rem">المصدر: {e(c["sharh"]["source"])}</div></div>' if c.get('sharh') else ''
  qz='<div class="qz"><b>سؤال المراجعة:</b> '+e(q['q'])+'<ul><li class="ok">'+e(q['a'])+' ✓</li>'+''.join('<li>'+e(w)+'</li>' for w in q['w'])+'</ul></div>'
  nt=f'<div class="note"><b>ملاحظتي:</b> {notes[c["id"]]}</div>' if c['id'] in notes else ''
  o.append(f'<article class="q"><div class="num">{c["id"]}</div>\n<div class="face" style="border-color:{FR[c["theme"]]}"><div class="kick">{kick}</div><p class="txt">{e(c["text"])}</p>\n<div class="src">المصدر: {e(c["source"])}</div><div class="grade">{e(c["grade"])}</div>{abr}<div class="tag" style="color:{FR[c["theme"]]};border-color:{FR[c["theme"]]}">{MARK.get(c["chapter"],"✦")} {c["chapter"]}</div></div>\n<details><summary>نص الحديث — {e(h["narrator"])}</summary><p class="matn">{e(h["matn"])}</p></details>{sh}\n{qz}{nt}<div class="dec" data-id="{c["id"]}"><div class="btns"><button data-v="ok">موافق</button><button data-v="change">أغيّر</button><button data-v="note">ملاحظة</button></div><textarea id="n-{c["id"]}" placeholder="اكتب التعديل أو الملاحظة هنا" hidden></textarea><div class="st" aria-live="polite"></div></div></article>')
o.append('</div>'+script)
s='\n'.join(o); assert '�' not in s; open('review1.html','w').write(s); print('ok',len(s))
