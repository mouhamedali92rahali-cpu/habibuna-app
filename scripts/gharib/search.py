"""بحث فوري بلا تشكيل في كتب الشروح والغريب (نصوص OpenITI عن طبعات الشاملة نفسها)، مع الجزء والصفحة.
python3 scripts/gharib/search.py BOOK "عبارة" ["عبارة"...] [--n 3] [--len 450]
BOOK: nihaya (النهاية لابن الأثير، الشاملة 23691) | fath (فتح الباري، الشاملة 1673) | nawawi (شرح النووي على مسلم، الشاملة 1711)
العبارة تعبير نمطي (مدخل الجذر في النهاية: "\\(رجل\\)"). الكتب تُنزَّل مرة واحدة إلى scripts/gharib/.cache (خارج git).
OpenITI تضع علامة الصفحة PageVxxPyyy في آخر الصفحة، فالصفحة = أول علامة بعد الموضع."""
import os, re, sys, urllib.request
R = 'https://raw.githubusercontent.com/OpenITI/'
BOOKS = {
    'nihaya': ('النهاية في غريب الحديث', R + '0625AH/master/data/0606IbnAthirMajdDin/0606IbnAthirMajdDin.NihayaFiGharib/0606IbnAthirMajdDin.NihayaFiGharib.Shamela0023691-ara1'),
    'fath': ('فتح الباري', R + '0875AH/master/data/0852IbnHajarCasqalani/0852IbnHajarCasqalani.FathBari/0852IbnHajarCasqalani.FathBari.Shamela0001673-ara1'),
    'nawawi': ('شرح النووي على مسلم', R + '0700AH/master/data/0676Nawawi/0676Nawawi.MinhajFiSharhMuslim/0676Nawawi.MinhajFiSharhMuslim.Shamela0001711-ara1'),
}
args = sys.argv[1:]; n_hits = 3; ln = 450
if '--n' in args: i = args.index('--n'); n_hits = int(args[i + 1]); del args[i:i + 2]
if '--len' in args: i = args.index('--len'); ln = int(args[i + 1]); del args[i:i + 2]
book, pats = args[0], args[1:]
name, url = BOOKS[book]
cache = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.cache'); os.makedirs(cache, exist_ok=True)
f = os.path.join(cache, book + '.txt')
if not os.path.exists(f): urllib.request.urlretrieve(url, f)
D = re.compile(r'[ً-ْٰـ]')
n = D.sub('', open(f, encoding='utf-8').read())
pages = [(m.start(), int(m.group(1)), int(m.group(2))) for m in re.finditer(r'PageV(\d+)P(\d+)', n)]
import bisect
starts = [p[0] for p in pages]
def pg(pos):
    i = bisect.bisect_right(starts, pos)
    return f'{pages[i][1]}/{pages[i][2]}' if i < len(pages) else '?'
for pat in pats:
    hits = list(re.finditer(pat, n))
    print(f'##### {pat}  ({len(hits)})')
    for m in hits[:n_hits]:
        print(f'[{name} {pg(m.start())}]', n[max(0, m.start() - 80):m.start() + ln].replace('\n', ' ').replace('~~', ''), '\n')
