# يولّد src/lib/ahlLines.ts من data/ahl/batch1.json («من أهل بيته ﷺ» و«من أصحابه ﷺ»)
import json
d=json.load(open('data/ahl/batch1.json'))['lines']
A=[{'h':x['head'],'t':x['text']} for x in d if x['id'][0] in 'AB']
S=[{'h':x['head'],'t':x['text']} for x in d if x['id'][0]=='S']
j=lambda v: json.dumps(v,ensure_ascii=False,indent=1)
open('src/lib/ahlLines.ts','w').write('// مولَّد من data/ahl/batch1.json بـ data/ahl/export.py — لا تعدّله يدويًّا\n'
 '// مساران (قرار المستخدم 2026-11-19): كل يوم اسم من أهل بيته ﷺ بترتيبهم (أزواجه، أولاده، أحفاده، أقاربه) واسم من أصحابه ﷺ الأقرب فالأقرب،\n'
 '// يتبادلان مع المهمة والسنن و«كن مثله ﷺ» في التطبيق وفي أداة «يومك»، بلا مصدر ولا لمس\n'
 "import { dayNumber } from './notify';\n"
 'export interface Line { h: string; t: string }\n'
 'export let AHL: Line[] = '+j(A)+';\n'
 'export let SAHB: Line[] = '+j(S)+';\n'
 '// تأتي الأحدث من public/lines.json المنشورة (src/lib/lines.ts) فتصل الإضافات بلا تحديث\n'
 'export function setAhl(a: Line[], s: Line[]) { if (a.length) AHL = a; if (s.length) SAHB = s; }\n'
 'const at = (a: Line[], d: number) => a[((d % a.length) + a.length) % a.length];\n'
 'export function ahlFor(d: Date): Line[] { const n = dayNumber(d); return [at(AHL, n), at(SAHB, n)]; }\n')
print(len(A),len(S))
import subprocess; subprocess.run(['python3','scripts/build-lines.py'],check=True)
