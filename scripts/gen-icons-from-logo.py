# أيقونة التطبيق من شعار الثلث (docs/tiktok/habibuna-logo-thuluth-b.png) بطلب المستخدم (2026-11-01):
# أيقونات أندرويد (التكيّفية والقديمة والدائرية) وشاشة البداية وصورة صفحة التحميل.
# التشغيل: python3 scripts/gen-icons-from-logo.py
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parent.parent
res = root / 'android/app/src/main/res'
src = Image.open(root / 'docs/tiktok/habibuna-logo-thuluth-b.png').convert('RGB')
BG = src.getpixel((8, 8))  # لون زوايا الشعار

def faded(size):
    """الشعار بحواف تذوب في لون الخلفية، حتى لا يظهر خط بينهما"""
    im = src.resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size, size), 0)
    ImageDraw.Draw(m).ellipse([size * .04, size * .04, size * .96, size * .96], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(size * .03))
    out = Image.new('RGB', (size, size), BG); out.paste(im, (0, 0), m)
    return out

def canvas(px, logo_frac):
    """مربع بلون الخلفية والشعار في وسطه بنسبة logo_frac"""
    c = Image.new('RGB', (px, px), BG)
    s = round(px * logo_frac); c.paste(faded(s), ((px - s) // 2, (px - s) // 2))
    return c

dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for d, k in dens.items():
    # التكيّفية: 108dp يظهر منها الوسط (72dp)، فالشعار 66dp ليبقى المحراب كاملًا داخل القناع
    fg = canvas(round(108 * k), 66 / 108).convert('RGBA')
    fg.save(res / f'mipmap-{d}/ic_launcher_foreground.png')
    px = round(48 * k)
    full = faded(px)
    sq = Image.new('L', (px, px), 0); ImageDraw.Draw(sq).rounded_rectangle([0, 0, px - 1, px - 1], radius=px * .22, fill=255)
    a = full.convert('RGBA'); a.putalpha(sq); a.save(res / f'mipmap-{d}/ic_launcher.png')
    ci = Image.new('L', (px, px), 0); ImageDraw.Draw(ci).ellipse([0, 0, px - 1, px - 1], fill=255)
    b = full.convert('RGBA'); b.putalpha(ci); b.save(res / f'mipmap-{d}/ic_launcher_round.png')

(res / 'values/ic_launcher_background.xml').write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % BG)

# شاشة البداية (قبل أندرويد 12)
for f in res.glob('drawable*/splash.png'):
    w, h = Image.open(f).size
    c = Image.new('RGB', (w, h), BG); s = round(min(w, h) * .6)
    c.paste(faded(s), ((w - s) // 2, (h - s) // 2)); c.save(f)

# صورة صفحة التحميل وأيقونة الويب
faded(512).save(root / 'public/logo.png', optimize=True)
canvas(512, .92).save(root / 'scripts/out/icon-preview.png')
print('done', BG)
