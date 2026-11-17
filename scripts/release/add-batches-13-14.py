"""يُشغَّل مع النسخة القادمة فقط (الدفعتان تحتاجان كودها: علامة «تعرّف عليه ﷺ» والحقل kick).
python3 scripts/release/add-batches-13-14.py          — فحص فقط (لا يكتب شيئًا)
python3 scripts/release/add-batches-13-14.py --write  — يضيف البطاقات وشروح الدفعة 14 إلى cards.json (public وdata) ويرفع version،
                                                       ويكتب الأسئلة في data/quiz/batch8.json (الدفعة 14) وbatch9.json (الدفعة 13)؛ ثم شغّل scripts/build-quiz.py"""
import json, re, sys
W = '--write' in sys.argv
D = re.compile(r'[ً-ْٰـ]')
norm = lambda s: re.sub(r'[^ء-ي]', '', D.sub('', s or ''))
C = json.load(open('public/cards.json'))
assert C == json.load(open('data/cards.json')), 'public و data مختلفان'
ids = {c['id'] for c in C['cards']}
old = {c['id']: norm((c.get('hadith') or {}).get('matn', '')) for c in C['cards']}
B13 = json.load(open('data/batch13/batch1.json')); B14 = json.load(open('data/batch14/batch1.json'))
SH = json.load(open('data/batch14/sharh.json'))
new = []
for c in B13['cards'] + B14['cards']:
    c = dict(c)
    assert c['id'] not in ids, ('معرّف مكرّر', c['id'])
    if c['id'] in SH and not c.get('sharh'): c['sharh'] = SH[c['id']]
    m = norm((c.get('hadith') or {}).get('matn', ''))[:45]
    dup = [k for k, v in old.items() if m and len(m) > 30 and m in v]
    if dup: print('تكرار محتمل:', c['id'], dup)
    for f in ('id', 'chapter', 'title', 'text', 'source', 'grade', 'theme'): assert c.get(f), (c['id'], f)
    t = c['text']; assert t.count('«') == t.count('»'), ('«»', c['id'])
    if c.get('hadith') and c['hadith'].get('matn'):
        mt = c['hadith']['matn']
        if mt.count('«') != mt.count('»'): print('«» غير متوازنة في نص الحديث:', c['id'])
    new.append(c)
q13, q14 = B13['quiz'], B14['quiz']
print(len(new), 'بطاقة جديدة؛ أسئلة', len(q13), '+', len(q14), '؛ بشرح', sum(1 for c in new if c.get('sharh')))
if W:
    C['cards'] += new; C['version'] += 1
    for f in ('public/cards.json', 'data/cards.json'): json.dump(C, open(f, 'w'), ensure_ascii=False, indent=1)
    json.dump(q14, open('data/quiz/batch8.json', 'w'), ensure_ascii=False, indent=1)
    json.dump(q13, open('data/quiz/batch9.json', 'w'), ensure_ascii=False, indent=1)
    print('كُتب: cards.json الإصدار', C['version'])
