"""البحث في «النهاية في غريب الحديث والأثر» لابن الأثير (نسخة OpenITI عن الشاملة 23691) بلا تشكيل، مع الجزء والصفحة.
python3 scripts/gharib/nihaya.py "الركوة" "\\(صخب\\)"    — العبارة تعبير نمطي؛ مدخل الجذر يُكتب بين قوسين مهرَّبين.
الكتاب يُنزَّل مرة واحدة إلى scripts/gharib/.cache (مستثنى من git). OpenITI تضع علامة الصفحة في آخرها."""
import os, re, sys, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); CACHE = os.path.join(HERE, '.cache'); os.makedirs(CACHE, exist_ok=True)
URL = 'https://raw.githubusercontent.com/OpenITI/0625AH/master/data/0606IbnAthirMajdDin/0606IbnAthirMajdDin.NihayaFiGharib/0606IbnAthirMajdDin.NihayaFiGharib.Shamela0023691-ara1'
F = os.path.join(CACHE, 'nihaya.txt')
if not os.path.exists(F): urllib.request.urlretrieve(URL, F)
D = re.compile(r'[ً-ْٰـ]')
txt = open(F, encoding='utf-8').read(); norm = D.sub('', txt)
idx = [i for i, ch in enumerate(txt) if not D.match(ch)]
pages = [(m.start(), int(m.group(1)), int(m.group(2))) for m in re.finditer(r'PageV(\d+)P(\d+)', norm)]
def page_at(pos):
    for s, v, p in pages:
        if s > pos: return f'{v}/{p}'
for w in sys.argv[1:]:
    print('#####', w)
    for n, m in enumerate(re.finditer(w, norm)):
        if n >= 3: break
        a = idx[max(0, m.start() - 80)]; b = idx[min(len(idx) - 1, m.start() + 450)]
        print(f'[النهاية {page_at(m.start())}]', txt[a:b].replace('\n', ' '), '\n')
