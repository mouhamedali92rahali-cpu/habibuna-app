# يولّد public/lines.json («كن مثله ﷺ» و«من أهل بيته ﷺ» و«من أصحابه ﷺ») من data/sunnah/batch1.json وdata/ahl/batch1.json
# تُحمَّل في التطبيق مثل tasks.json (src/lib/lines.ts)، فتصل الإضافات بلا تحديث؛ ويُرفع version عند كل تغيير
import json, os
P = 'public/lines.json'
old = json.load(open(P)) if os.path.exists(P) else {'version': 0}
kun = [x['text'] for x in json.load(open('data/sunnah/batch1.json'))['sunnah'] if not x.get('weak')]
d = json.load(open('data/ahl/batch1.json'))['lines']
ahl = [{'h': x['head'], 't': x['text']} for x in d if x['id'][0] in 'AB']
sahb = [{'h': x['head'], 't': x['text']} for x in d if x['id'][0] == 'S']
new = {'kun': kun, 'ahl': ahl, 'sahb': sahb}
v = old.get('version', 0)
if {k: old.get(k) for k in new} != new: v += 1
json.dump({'version': v, **new}, open(P, 'w'), ensure_ascii=False, indent=1)
print('lines.json v%d: kun %d, ahl %d, sahb %d' % (v, len(kun), len(ahl), len(sahb)))
