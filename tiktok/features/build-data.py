"""يولّد tiktok/features/data.js من ملفات التطبيق (البطاقات والسؤال والرسم والخريطة)، لأن صفحة file:// لا تقرأ JSON في المتصفح.
التشغيل: python3 tiktok/features/build-data.py — أعده كلما تغيّر نص بطاقة مستعملة."""
import json, os
here = os.path.dirname(os.path.abspath(__file__)); pub = os.path.join(here, '../../public')
cards = {c['id']: c for c in json.load(open(os.path.join(pub, 'cards.json')))['cards']}
quiz = next(q for q in json.load(open(os.path.join(pub, 'quiz.json')))['questions'] if q['card'] == 'M01')
art = json.load(open(os.path.join(pub, 'art.json')))
svg = lambda n: open(os.path.join(pub, 'art', n + '.svg')).read()
d = {'cards': {k: cards[k] for k in ('M01', 'Y04')}, 'quiz': quiz,
     'art': dict(art['cards']['C33'], svg=svg(art['cards']['C33']['art'])),
     'map': dict(art['maps']['C47'], svg=svg(art['maps']['C47']['art']))}
open(os.path.join(here, 'data.js'), 'w').write('window.FEAT = ' + json.dumps(d, ensure_ascii=False) + ';\n')
print('data.js', len(json.dumps(d)))
