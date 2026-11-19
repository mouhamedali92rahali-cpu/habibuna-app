# يولّد src/lib/kunLines.ts من data/sunnah/batch1.json («كن مثله ﷺ»؛ بلا الضعيف بقرار المستخدم 2026-11-19)
import json
d=json.load(open('data/sunnah/batch1.json'))['sunnah']
L=[x['text'] for x in d if not x.get('weak')]
open('src/lib/kunLines.ts','w').write('// مولَّد من data/sunnah/batch1.json بـ data/sunnah/export.py — لا تعدّله يدويًّا\n'
 '// «كن مثله ﷺ»: سنّة واحدة في اليوم، تتبادل مع المهمة والسنن في التطبيق وفي أداة «يومك»، بلا مصدر ولا لمس\n'
 'import { dayNumber } from \'./notify\';\nexport const KUN: string[] = '+json.dumps(L,ensure_ascii=False,indent=1)+';\n'
 'export const kunFor = (d: Date): string => KUN.length ? KUN[((dayNumber(d) % KUN.length) + KUN.length) % KUN.length] : \'\';\n')
print(len(L))
