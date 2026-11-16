"""يضيف تذكيرات الأوقات (data/widget/lines5.json، المجموعة widget5) إلى جمل الشريط المرفقة بالتطبيق (src/lib/widgetLines.ts):
المفتاح t = {morning, duha, evening, witr} كل عنصر {t, s, g, full?}، والجمل العادية الجديدة تُلحق بـ q وh.
لا يمسّ public/cards.json (المنشور لكل الناس) حتى يطلب المستخدم النشر."""
import json, re
P = 'src/lib/widgetLines.ts'
src = open(P).read()
pre, body = src.split('export const WIDGET_LINES = ', 1)
W = json.loads(body.rstrip().rstrip(';'))
d = json.load(open('data/widget/lines5.json'))
GR = {'M1': 'حسن — الترمذي، وحسّنه الألباني', 'M3': 'حسن — الترمذي', 'E3': 'حسن — الترمذي', 'E4': 'حسن صحيح غريب — الترمذي',
      'W2': 'حسن — الترمذي', 'R2': 'حسن صحيح غريب — الترمذي'}
def grade(x):
    if x['id'] in GR: return GR[x['id']]
    s = x['src']
    if 'البخاري' in s and 'مسلم' in s: return 'صحيح — البخاري ومسلم'
    if 'البخاري' in s: return 'صحيح — البخاري'
    if 'مسلم' in s: return 'صحيح — مسلم'
    return ''
def item(x):
    o = {'t': x['text'], 's': x['src']}
    if not x['text'].startswith('﴿'): o['g'] = grade(x)
    if x.get('full') and x['full'] != x['text']: o['full'] = x['full']
    return o
W['t'] = {k: [item(x) for x in d[k]] for k in ('morning', 'duha', 'evening', 'witr')}
norm = lambda s: re.sub(r'[ً-ْٰ\s«»﴿﴾،.]', '', s)
have = {norm(x['t']) for k in ('q', 'h') for x in W[k]}
for x in d['regular']:
    k = 'q' if x['text'].startswith('﴿') else 'h'
    if norm(x['text']) not in have: W[k].append({'t': x['text'], 's': x['src']})
open(P, 'w').write(pre + 'export const WIDGET_LINES = ' + json.dumps(W, ensure_ascii=False) + ';\n')
print({k: len(W[k]) for k in ('q', 'h', 's')}, {k: len(v) for k, v in W['t'].items()})
