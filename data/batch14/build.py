import json,sys,html
sys.path.insert(0,'../hj'); sys.path.insert(0,'.')
import f
from cards import C
import importlib
SH=json.load(open('sharh.json')) if __import__('os').path.exists('sharh.json') else {}
R='/home/user/mouhamedali92rahali-cpu/habibuna-app'
out={'chapter':'قالوا عنه + مواقف من السيرة','cards':[],'quiz':[]}
for (id_,ch,title,text,src,grade,narr,sp,exc,q,a,w,ex) in C:
    m=ex.get('matn') or f.matn(*sp)
    if ex.get('matn2'): m+=' … '+f.matn(*ex['matn2'])
    c={'id':id_,'chapter':ch,'title':title,'text':text,'source':src,'grade':grade,
       'theme':'emerald' if ch=='قالوا عنه' else 'brown','long':len(text)>200,
       'hadith':{'matn':m,'narrator':narr,'excerpt':exc}}
    if exc: c['abridged']=True
    if ch=='قالوا عنه': c['kick']='من أقوال التابعين عنه ﷺ' if ex.get('kick') else 'من أقوال أصحابه عنه ﷺ'
    if id_ in SH: c['sharh']=SH[id_]
    out['cards'].append(c); out['quiz'].append({'card':id_,'q':q,'a':a,'w':w})
json.dump(out,open('batch1.json','w'),ensure_ascii=False,indent=1)
# dup re-check of final matn
for c in out['cards']:
    d=[x for x in f.dup(c['hadith']['matn']+' '+c['text']) if x[0]>=0.3]
    if d: print('DUP?',c['id'],d)
print('cards',len(out['cards']),'sharh',sum('sharh' in c for c in out['cards']))
