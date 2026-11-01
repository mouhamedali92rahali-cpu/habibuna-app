"""يجمع أسئلة اللعبة من data/quiz/batch*.json في public/quiz.json (بلا الملاحظات الداخلية).
التشغيل: python3 scripts/build-quiz.py — ثم يُرفع public/quiz.json مع cards.json."""
import json, glob, time, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cards = {c['id'] for c in json.load(open(os.path.join(root, 'public/cards.json')))['cards']}
out = []
for f in sorted(glob.glob(os.path.join(root, 'data/quiz/batch*.json'))):
    for x in json.load(open(f)):
        assert x['card'] in cards, (f, x['card'])
        assert len(x['w']) == 3 and x['a'] not in x['w'], (f, x['card'])
        out.append({'card': x['card'], 'q': x['q'], 'a': x['a'], 'w': x['w']})
# حارس: إن تغيّر نص بطاقة بعد كتابة سؤالها فقد لا يطابقه السؤال؛ نحفظ بصمة النص ونُنبّه عند تغيّرها
import hashlib
fp_path = os.path.join(root, 'data/quiz/fingerprints.json')
texts = {c['id']: c['text'] for c in json.load(open(os.path.join(root, 'public/cards.json')))['cards']}
fp = json.load(open(fp_path)) if os.path.exists(fp_path) else {}
changed = []
for x in out:
    h = hashlib.sha1(texts[x['card']].encode()).hexdigest()[:12]
    if x['card'] in fp and fp[x['card']] != h: changed.append(x['card'])
    fp.setdefault(x['card'], h)
if changed:
    raise SystemExit('تغيّر نص هذه البطاقات بعد كتابة أسئلتها؛ راجع أسئلتها ثم احذف بصماتها من data/quiz/fingerprints.json: ' + ', '.join(sorted(set(changed))))
json.dump(fp, open(fp_path, 'w'), ensure_ascii=False, indent=0, sort_keys=True)
json.dump({'version': int(time.strftime('%Y%m%d%H%M')), 'questions': out},
          open(os.path.join(root, 'public/quiz.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'questions -> public/quiz.json')
