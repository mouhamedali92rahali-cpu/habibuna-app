# المراجعة الشاملة 2026-11-26: فحص آلي لبيانات «حبيبنا». python3 scripts/audit/full_audit.py [مجلد نصوص fawazahmed0]
import json,re,sys,os,difflib,collections
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
J=lambda p:json.load(open(os.path.join(R,p)))
D=re.compile(r'[ً-ْٰـ]')
def n(t): t=D.sub('',t or ''); t=re.sub('[أإآٱ]','ا',t).replace('ة','ه').replace('ى','ي'); return re.sub(r'[^ء-ي ]',' ',t)
W=lambda t:[w for w in n(t).split() if len(w)>2]
out=collections.defaultdict(list)
def add(k,i,m): out[k].append(f'{i}: {m}')
cards=J('public/cards.json'); C=cards['cards']
if J('data/cards.json')!=cards: add('مزامنة','data/cards.json','يختلف عن public/cards.json')
ids=collections.Counter(c['id'] for c in C)
for i,k in ids.items():
    if k>1: add('بنية',i,'معرّف مكرّر')
cv=open(os.path.join(R,'src/components/CardView.tsx')).read(); pop=open(os.path.join(R,'public/popup.html')).read()
THEMES={'emerald','navy','plum','brown','slate','ivory'}
for c in C:
    i=c['id']
    for f in ('title','text','source','grade'):
        if not (c.get(f) or '').strip(): add('بنية',i,f'الحقل {f} فارغ')
    if c['theme'] not in THEMES: add('بنية',i,'سمة غير معروفة '+c['theme'])
    if f"'{c['chapter']}'" not in cv: add('بنية',i,'الباب بلا علامة في CardView: '+c['chapter'])
    if c['chapter'] not in pop: add('بنية',i,'الباب بلا علامة في النافذة: '+c['chapter'])
    for f,t in (('text',c['text']),('matn',(c.get('hadith') or {}).get('matn')),('sharh',(c.get('sharh') or {}).get('text'))):
        if not t: continue
        if t.count('«')!=t.count('»'): add('علامات',i,f'«» غير متوازنة في {f}')
        if t.count('(')!=t.count(')'): add('علامات',i,f'() غير متوازنة في {f}')
        if re.search(r'  |\s[،.؛:]|،،|\.\.(?!\.)|ﷺﷺ',t): add('إملاء',i,f'مسافة أو علامة زائدة في {f}: '+re.search(r'.{0,12}(  |\s[،.؛:]|،،|\.\.(?!\.)|ﷺﷺ).{0,12}',t).group(0))
        if re.search('[A-Za-z]',t) and f!='sharh': add('إملاء',i,f'حرف لاتيني في {f}')
        if 'صلى الله عليه وسلم' in t and f=='text': add('إملاء',i,'«صلى الله عليه وسلم» مكتوبة بدل ﷺ في النص')
    if c.get('same') and c.get('abridged'): add('بنية',i,'same مع abridged')
    if c.get('same') and not c.get('hadith'): add('بنية',i,'same بلا hadith')
    if c.get('weak') and 'ضعيف' not in c['grade']: add('درجات',i,'weak بلا كلمة «ضعيف» في الدرجة')
    if not c.get('weak') and re.match(r'\s*ضعيف',c['grade']): add('درجات',i,'درجة تبدأ بـ«ضعيف» بلا weak')
    if c['chapter']!='الصلاة عليه' and not c.get('dalail') and not c.get('line') and '—' not in c['grade'] and 'كتب السيرة' not in c['grade']: add('درجات',i,'الدرجة بلا «—» (من حكم بها): '+c['grade'][:50])
    L=len(c['text'])
    if c.get('long') != (L>200) and not c.get('long'): 
        if L>230: add('طول',i,f'نص {L} حرفًا بلا long')
    if L>330: add('طول',i,f'نص طويل {L} حرفًا')
# تكرار
items=[(c['id'],n((c.get('hadith') or {}).get('matn') or c['text'])) for c in C if c['chapter']!='الصلاة عليه']
for a in range(len(items)):
    for b in range(a+1,len(items)):
        x,y=items[a][1],items[b][1]
        if min(len(x),len(y))<40: continue
        r=difflib.SequenceMatcher(None,x,y,autojunk=False).quick_ratio()
        if r>0.8 and difflib.SequenceMatcher(None,x,y,autojunk=False).ratio()>0.72:
            add('تكرار',items[a][0],'يشبه '+items[b][0])
# مطابقة المصدر
hj=sys.argv[1] if len(sys.argv)>1 else ''
BOOK={'البخاري':'bukhari','مسلم':'muslim','الترمذي':'tirmidhi','أبو داود':'abudawud','ابن ماجه':'ibnmajah'}
H={}
if hj:
    for ar,b in BOOK.items():
        hs=json.load(open(f'{hj}/ara-{b}.json'))['hadiths']; m=collections.defaultdict(str)
        for h in hs:
            v=str(h.get('arabicnumber') if b=='muslim' else h['hadithnumber']).split('.')[0]
            if not v.isdigit(): continue
            k=int(v)
            m[k]+=' '+n(h['text'])
        H[ar]=m
    rep=[]
    for c in C:
        src=c['source']; ref=(c.get('hadith') or {}).get('matn') or ''
        if not ref or c.get('line'): continue
        for ar in BOOK:
            for mm in re.finditer(re.escape(ar)+r'(?! في| تعليقًا)\s*\(?([\d،, و\-–]+)\)?',src):
                nums=[int(x) for x in re.findall(r'\d+',mm.group(1))]
                if ar=='الترمذي' and 'الشمائل' in src[max(0,mm.start()-3):mm.end()+12]: continue
                w=set(W(ref));
                if len(w)<4: continue
                best=max(((len(w & set(H[ar][k].split()))/len(w),k) for k in nums),default=(0,0))
                if best[0]<0.5:
                    near=max(((len(w & set(H[ar][k].split()))/len(w),k) for x in nums for k in range(x-3,x+4)),default=(0,0))
                    add('مصادر',c['id'],f'{ar} {nums}: تطابق {best[0]:.0%}'+(f'؛ الأقرب {near[1]} ({near[0]:.0%})' if near[0]>=0.5 else ''))
# الرسوم
art=J('public/art.json'); A=art.get('cards',{}); M=art.get('maps',{})
cid={c['id'] for c in C}
for k,v in list(A.items())+list(M.items()):
    if k not in cid: add('رسوم',k,'رسم لبطاقة غير موجودة')
    f=v.get('art') or v.get('src') or ''
    if f and not os.path.exists(os.path.join(R,'public',f if '/' in f else 'art/'+f+('' if f.endswith('.svg') else '.svg'))): add('رسوم',k,'ملف الرسم غير موجود '+f)
for c in C:
    if bool(c.get('pic')) != (c['id'] in A or c['id'] in M): add('رسوم',c['id'],'pic لا يطابق art.json')
# الأسئلة
qz=J('public/quiz.json'); Q=qz.get('questions') or qz.get('items') or []
byid={c['id']:c for c in C}
for q in Q:
    cidq=q.get('card') or q.get('id'); c=byid.get(cidq)
    if not c: add('أسئلة',cidq,'سؤال لبطاقة غير موجودة'); continue
    if c.get('weak'): add('أسئلة',cidq,'سؤال على بطاقة ضعيفة')
    opts=[q.get('a')]+list(q.get('w') or [])
    if len(set(opts))!=4: add('أسئلة',cidq,'الخيارات ليست أربعة مختلفة')
    # الجواب الخاطئ يطابق نص البطاقة؟
    full=n(c['text']+' '+((c.get('hadith') or {}).get('matn') or ''))
    for w in q.get('w') or []:
        wn=n(w).strip()
        if len(wn)>5 and wn in full: add('أسئلة',cidq,'خيار خاطئ موجود في نص البطاقة: '+w)
# ملفات أخرى
for p in ('public/qalu.json','public/lines.json','public/tasks.json','public/hijri.json','public/art.json','public/quiz.json'):
    try: d=J(p); assert 'version' in d or p.endswith('hijri.json')
    except Exception as e: add('ملفات',p,str(e))
qa=J('public/qalu.json'); 
for c in qa.get('cards',[]):
    t=c['text']
    if t.count('«')!=t.count('»'): add('علامات',c['id'],'«» غير متوازنة')
tk=J('public/tasks.json')
tc=collections.Counter(n(t['text']) for t in tk['tasks'])
for t,k in tc.items():
    if k>1: add('مهام','-','مهمة مكرّرة: '+t[:40])
ln=J('public/lines.json')
for key in ('kun','ahl','sahb'):
    for x in ln.get(key,[]):
        t=x if isinstance(x,str) else (x.get('t') or x.get('text') or '')
        if t.count('«')!=t.count('»'): add('علامات','lines.'+key,'«» غير متوازنة: '+t[:30])
w=cards.get('widget',{})
for key,arr in w.items():
    if isinstance(arr,list):
        for x in arr:
            t=x.get('t','') if isinstance(x,dict) else str(x)
            if t.count('«')!=t.count('»') or t.count('﴿')!=t.count('﴾'): add('علامات','widget.'+key,'علامات غير متوازنة: '+t[:30])
print(json.dumps({k:v for k,v in out.items()},ensure_ascii=False,indent=1))
print({k:len(v) for k,v in out.items()},file=sys.stderr)
