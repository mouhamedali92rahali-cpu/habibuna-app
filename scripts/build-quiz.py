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
json.dump({'version': int(time.strftime('%Y%m%d%H%M')), 'questions': out},
          open(os.path.join(root, 'public/quiz.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'questions -> public/quiz.json')
