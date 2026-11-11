# يولّد صفحة مراجعة تفاعلية لدفعة بطاقات: python3 scripts/review-page.py BATCH.json OUT.html COLLECTION "العنوان" "سطر تحت العنوان" [notes.json]
import json,re,html,sys,collections
src=open('data/seerah/review1.html').read()
css=src[src.index('<style>'):src.index('</style>')+8].replace('.face{','.q{--frame:#6b4a2e}\n.face{')
bj,out,col,title,sub=sys.argv[1:6]; notes=json.load(open(sys.argv[6])) if len(sys.argv)>6 else {}
script=src[src.index('<script>'):].replace('db.collection("seerah1")','db.collection("'+col+'")')
cv=open('src/components/CardView.tsx').read(); MARK=dict(re.findall(r"'([^']+)':\s*'([^']+)'",cv[cv.index('MARK'):cv.index('MARK')+2600]))
b=json.load(open(bj)); Q={q['card']:q for q in b['quiz']}
FR={'brown':'#6b4a2e','emerald':'#0F5C4D','navy':'#17305C','plum':'#4A2A55','slate':'#3F4647','ivory':'#B39A5C'}
o=['<title>'+html.escape(title)+'</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;600&display=swap">',css,'<div class="wrap">',
 f'<header><h1>{html.escape(title)}</h1><div>{html.escape(sub)}</div></header>',
 '<div class="how"><b>كيف تراجع:</b> تحت كل بطاقة: «موافق»، أو «أغيّر» واكتب التعديل، أو «ملاحظة». يُحفظ اختيارك فورًا وأقرؤه أنا، وما لم تختر فيه شيئًا يُعدّ مقبولًا. النص الأصلي تحت كل بطاقة، والجواب الصحيح في السؤال عليه ✓.</div>']
if notes.get('_intro'): o.append('<div class="note">'+notes['_intro']+'</div>')
for c in b['cards']:
  q=Q.get(c['id']); h=c.get('hadith') or {}
  kick='تعرّف عليه ﷺ' if c['chapter']=='سيرته في سطور' else 'من دعائه ﷺ' if c.get('dua') else 'من مواقف النبي ﷺ'
  abr='<div class="grade weak">✂ اختصرنا الحديث، ونصّه كاملًا تحت البطاقة</div>' if c.get('abridged') and not c.get('same') else ''
  sh=f'<details><summary>الشرح</summary><p>{html.escape(c["sharh"]["text"])}</p><p class="muted">{html.escape(c["sharh"]["source"])}</p></details>' if c.get('sharh') else ''
  qz=('<div class="qz"><b>سؤال المراجعة:</b> '+html.escape(q['q'])+'<ul><li class="ok">'+html.escape(q['a'])+' ✓</li>'+''.join('<li>'+html.escape(w)+'</li>' for w in q['w'])+'</ul></div>') if q else ''
  nt=f'<div class="note"><b>ملاحظتي:</b> {notes[c["id"]]}</div>' if c['id'] in notes else ''
  o.append(f'<article class="q" style="--frame:{FR[c["theme"]]}"><div class="num">{c["id"]}</div>\n<div class="face"><div class="kick">{kick}</div><p class="txt">{html.escape(c["text"])}</p>\n<div class="src">المصدر: {html.escape(c["source"])}</div><div class="grade">{html.escape(c["grade"])}</div>{abr}<div class="tag">{MARK.get(c["chapter"],"✦")} {c["chapter"]}</div></div>\n<details><summary>النص الأصلي — {html.escape(h.get("narrator",""))}</summary><p class="matn">{html.escape(h.get("matn",""))}</p></details>{sh}\n{qz}{nt}<div class="dec" data-id="{c["id"]}"><div class="btns"><button data-v="ok">موافق</button><button data-v="change">أغيّر</button><button data-v="note">ملاحظة</button></div><textarea id="n-{c["id"]}" placeholder="اكتب التعديل أو الملاحظة هنا" hidden></textarea><div class="st" aria-live="polite"></div></div></article>')
o.append('</div>'+script)
s='\n'.join(o); assert '�' not in s; open(out,'w').write(s); print('ok',len(b['cards']))
