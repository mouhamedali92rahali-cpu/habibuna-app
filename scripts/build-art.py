"""رسوم «حبيبنا» الخطية: كل رسم SVG مستقل (ذهبي وزمردي على دائرة عاجية)، يُكتب في public/art/<name>.svg،
وتُكتب الخريطة {version, cards: {رقم البطاقة: {art, caption}}} في public/art.json. التشغيل: python3 scripts/build-art.py"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G, E, F, F2, BG, INK = '#b8923f', '#0f5c4d', '#ecdcae', '#d9bf7f', '#efe4c6', '#7a5a22'
STYLE = f'''<style>
.g{{fill:none;stroke:{G};stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}}
.gt{{fill:none;stroke:{G};stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}}
.e{{fill:none;stroke:{E};stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}}
.et{{fill:none;stroke:{E};stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}}
.f{{fill:{F}}}.f2{{fill:{F2}}}.fe{{fill:#cfe0d6}}.w{{fill:#fffaf0}}.ink{{fill:{INK}}}
</style>'''
def svg(body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">{STYLE}'
            f'<circle cx="100" cy="80" r="72" fill="{BG}"/>{body}</svg>')

def date(x, y, a=0, dry=False, s=1.0):
    rx, ry = 7.5*s, 12*s
    wr = '' if not dry else f'<path class="gt" d="M{x-3*s} {y-6*s} q2 4 0 8 M{x+2*s} {y-7*s} q2 5 0 11"/>'
    fill = 'f2' if dry else 'f'
    hl = '' if dry else f'<path d="M{x-3*s} {y-5*s} q-1 4 0 7" stroke="#fffaf0" stroke-width="2" fill="none" stroke-linecap="round"/>'
    return (f'<g transform="rotate({a} {x} {y})"><ellipse class="{fill}" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}"/>'
            f'<ellipse class="g" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}"/>{hl}{wr}'
            f'<path class="e" d="M{x} {y-ry} l0 -3"/></g>')

ART = {}
# 1. السواك: عودان من الأراك بطرف منكوش وغصين بورقتين
def miswak(x1, y1, x2, y2, w=15):
    import math
    ang = math.degrees(math.atan2(y2-y1, x2-x1)); L = math.hypot(x2-x1, y2-y1)
    rings = ''.join(f'<path class="gt" d="M{x1+t} {y1-w/2+2} q3 {w/2-2} 0 {w-4}"/>' for t in (L*0.22, L*0.45, L*0.66))
    bristles = ''.join(f'<path class="e" d="M{x1+L} {y1+o} l{13+abs(o)*0.4} {o*1.1}"/>' for o in (-6, -3, 0, 3, 6))
    return (f'<g transform="rotate({ang:.1f} {x1} {y1})"><rect class="f" x="{x1}" y="{y1-w/2}" width="{L}" height="{w}" rx="{w/2}"/>'
            f'<rect class="g" x="{x1}" y="{y1-w/2}" width="{L}" height="{w}" rx="{w/2}"/>{rings}'
            f'<rect class="w" x="{x1+L-6}" y="{y1-w/2+2}" width="7" height="{w-4}" rx="3"/>{bristles}</g>')
ART['miswak'] = svg(miswak(42, 118, 150, 50) + miswak(58, 128, 158, 78, 13) +
  '<path class="e" d="M48 52 C60 46 70 48 78 56"/><path class="fe" d="M58 49 C52 38 60 30 70 34 C70 44 64 48 58 49Z"/><path class="et" d="M58 49 C52 38 60 30 70 34 C70 44 64 48 58 49Z M60 46 L67 37"/>'
  '<path class="fe" d="M70 53 C72 42 82 40 88 46 C84 54 76 56 70 53Z"/><path class="et" d="M70 53 C72 42 82 40 88 46 C84 54 76 56 70 53Z M73 51 L84 46"/>')
# 2. الدُّبّاء: قرعة وورقة ومحلاق
ART['dubba'] = svg(
  # قرعة قارورية ملساء: انتفاخ صغير فوق انتفاخ كبير، بلا فصوص
  '<path class="f" d="M100 34 C108 34 112 44 110 54 C108 62 104 64 106 70 C130 76 142 96 138 114 C134 132 66 132 62 114 C58 96 70 76 94 70 C96 64 92 62 90 54 C88 44 92 34 100 34Z"/>'
  '<path class="g" d="M100 34 C108 34 112 44 110 54 C108 62 104 64 106 70 C130 76 142 96 138 114 C134 132 66 132 62 114 C58 96 70 76 94 70 C96 64 92 62 90 54 C88 44 92 34 100 34Z"/>'
  '<path d="M74 96 q-2 12 4 20 M96 44 q-3 6 -1 12" stroke="#fffaf0" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="1.3" fill="#c9a96a"/>' for x, y in ((112,92),(120,104),(104,110),(90,100),(116,118),(98,122),(126,96)))
  + '<path class="e" d="M100 34 C100 26 104 20 110 18"/>'
  '<path class="fe" d="M110 20 C116 8 136 8 142 20 C138 32 122 34 110 20Z"/><path class="et" d="M110 20 C116 8 136 8 142 20 C138 32 122 34 110 20Z M112 20 L138 18 M124 19 L128 11 M124 19 L130 27"/>'
  '<path class="et" d="M98 28 C88 24 82 30 86 35 C90 38 94 32 90 30"/>')
# 3. القِثّاء والرُّطَب
ART['qiththa'] = svg(
  '<path class="f" d="M40 108 C70 92 120 70 150 42 C160 34 168 44 160 52 C132 82 84 110 50 122 C38 126 32 114 40 108Z"/>'
  '<path class="g" d="M40 108 C70 92 120 70 150 42 C160 34 168 44 160 52 C132 82 84 110 50 122 C38 126 32 114 40 108Z"/>'
  '<path class="gt" d="M50 112 C80 98 120 76 152 48 M56 118 C90 102 126 80 156 52"/>'
  '<path class="e" d="M160 46 l8 -8"/>'
  + date(70, 58, -20) + date(88, 50, 10) + date(80, 72, -5))
# 4. فطور: رُطَبات ثم تمرات ثم ماء
ART['iftar'] = svg(
  date(52, 70, -15) + date(66, 64, 10) + date(60, 86, 0) +
  date(96, 78, -10, True) + date(110, 72, 15, True) + date(104, 94, 0, True) +
  '<path class="w" d="M134 70 h30 l-4 44 h-22 Z"/><path class="g" d="M134 70 h30 l-4 44 h-22 Z"/>'
  '<path class="fe" d="M136 84 h26 l-2.6 28 h-20.8 Z"/><path class="et" d="M136 84 h26"/>'
  '<path class="gt" d="M42 122 h126"/>')
# 5. تمرات (يابسة) في طبق صغير
ART['tamr'] = svg(
  '<ellipse class="w" cx="100" cy="106" rx="56" ry="14"/><path class="g" d="M44 104 C48 122 152 122 156 104"/><ellipse class="g" cx="100" cy="104" rx="56" ry="12"/>'
  + date(82, 92, -70, True) + date(104, 88, -100, True) + date(124, 94, -60, True) + date(96, 72, -80, True, 0.95))
# 6. العسل: جرّة وشمعة شهد وقطرة
ART['honey'] = svg(
  '<path class="f" d="M74 62 h40 c0 6 -4 8 -4 12 c14 6 20 20 18 34 c-2 16 -18 22 -34 22 c-16 0 -32 -6 -34 -22 c-2 -14 4 -28 18 -34 c0 -4 -4 -6 -4 -12Z"/>'
  '<path class="g" d="M74 62 h40 c0 6 -4 8 -4 12 c14 6 20 20 18 34 c-2 16 -18 22 -34 22 c-16 0 -32 -6 -34 -22 c-2 -14 4 -28 18 -34 c0 -4 -4 -6 -4 -12Z"/>'
  '<path class="e" d="M70 62 h48"/><path class="f2" d="M82 66 c0 8 -2 12 2 16 c3 3 3 7 0 9 c-3 -2 -3 -6 0 -9" />'
  '<path class="gt" d="M66 100 h56"/>'
  + ''.join(f'<path class="g" d="M{x} {y} l7 -4 l7 4 v8 l-7 4 l-7 -4 Z"/>' for x, y in ((130, 48), (144, 48), (137, 60), (151, 60), (144, 72)))
  + '<path class="f2" d="M140 86 c-4 6 -4 10 0 10 c4 0 4 -4 0 -10Z"/><path class="gt" d="M140 86 c-4 6 -4 10 0 10 c4 0 4 -4 0 -10Z"/>')
# 7. الحصير: حصير من خوص النخل منسوج نسجًا متقاطعًا، مبسوط في منظور وطرفه ملفوف، وبجانبه سعفة
def _hasir():
    # شبكة النسج بين حافتين: قريبة (y=124) وبعيدة (y=70)، والطرف الأيمن ملفوف
    xl0, xl1, xr0, xr1, yb, yt = 24, 46, 136, 128, 124, 72
    n, m = 8, 6
    lerp = lambda a, b, t: a + (b - a) * t
    def pt(u, v):  # u عبر العرض 0..1، v من القريب 0 إلى البعيد 1
        y = lerp(yb, yt, v); xl = lerp(xl0, xl1, v); xr = lerp(xr0, xr1, v)
        return lerp(xl, xr, u), y
    cells = ''
    for i in range(n):
        for j in range(m):
            q = [pt(i/n, j/m), pt((i+1)/n, j/m), pt((i+1)/n, (j+1)/m), pt(i/n, (j+1)/m)]
            cls = 'f2' if (i + j) % 2 else 'f'
            cells += f'<path class="{cls}" d="M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in q) + 'Z"/>'
    lines = ''.join(f'<path class="gt" d="M{pt(i/n,0)[0]:.1f} {yb} L{pt(i/n,1)[0]:.1f} {yt}"/>' for i in range(1, n))
    lines += ''.join(f'<path class="gt" d="M{pt(0,j/m)[0]:.1f} {pt(0,j/m)[1]:.1f} L{pt(1,j/m)[0]:.1f} {pt(1,j/m)[1]:.1f}"/>' for j in range(1, m))
    edge = f'<path class="g" d="M{xl0} {yb} L{xl1} {yt} L{xr1} {yt} L{xr0} {yb} Z"/>'
    fringe = ''.join(f'<path class="gt" d="M{pt(i/n+0.06,0)[0]:.1f} {yb} l-1 6"/>' for i in range(n))
    # اللفّة: أسطوانة عند الطرف الأيمن
    roll = (f'<path class="f2" d="M{xr1} {yt-6} L{xr0+6} {yb-2} c4 8 18 8 20 -2 L{xr1+16} {yt-8} c-2 -8 -14 -8 -16 2Z"/>'
            f'<path class="g" d="M{xr1} {yt-6} L{xr0+6} {yb-2} M{xr1+16} {yt-8} L{xr0+26} {yb-4}"/>'
            f'<ellipse class="f" cx="{xr0+16}" cy="{yb-3}" rx="10" ry="7" transform="rotate(-10 {xr0+16} {yb-3})"/>'
            f'<ellipse class="g" cx="{xr0+16}" cy="{yb-3}" rx="10" ry="7" transform="rotate(-10 {xr0+16} {yb-3})"/>'
            f'<path class="gt" d="M{xr0+16} {yb-3} m-6 0 a6 4 -10 1 1 6 4 a3.5 2.5 -10 1 1 -2 -3"/>'
            + ''.join(f'<path class="gt" d="M{xr1+3+k*3.2:.1f} {yt-5-k*0.4:.1f} L{xr0+9+k*3.2:.1f} {yb-1-k*0.4:.1f}"/>' for k in range(1, 4)))
    # سعفة نخل في الأعلى: أصل الخوص
    frond = ('<path class="e" d="M40 52 C70 40 110 36 150 44"/>'
             + ''.join(f'<path class="et" d="M{48+i*12} {49-i*1.3:.1f} l{-5+i*0.3:.1f} -11 M{48+i*12} {49-i*1.3:.1f} l{-4+i*0.3:.1f} 10"/>' for i in range(9)))
    return svg(frond + cells + lines + edge + fringe + roll)
ART['hasir'] = _hasir()
# 8. فراش من أَدَم حشوه ليف: فراش جلدي في منظور، بخياطة على حوافه، وفتقٌ في طرفه يظهر منه الليف، وحزمة ليف بجانبه
def _firash():
    import random
    rnd = random.Random(7)
    # فراش منتفخ: وجه علوي مقوّس وجانب أمامي، والحواف مدوّرة
    top = 'M30 86 C34 72 52 62 66 60 L156 60 C168 60 174 66 172 74 C164 82 156 86 146 88 L44 92 C36 92 30 90 30 86Z'
    front = 'M30 86 C30 90 36 92 44 92 L146 88 C156 86 164 82 172 74 L172 92 C172 102 164 110 152 112 L46 116 C36 116 30 110 30 104 Z'
    stitch = ('<path class="et" stroke-dasharray="2.5 3.5" d="M38 89 L146 85 C155 83 163 79 168 73"/>'
              '<path class="et" stroke-dasharray="2.5 3.5" d="M38 112 L150 108 C160 106 166 100 168 92"/>')
    # غرز تثبيت الحشو على الوجه العلوي
    tufts = ''.join(f'<path class="gt" d="M{x-3} {y} l3 1.5 l3 -1.5"/>' for x, y in ((70, 70), (100, 69), (130, 68), (85, 79), (115, 78), (145, 76)))
    # الليف: خيوط بنية متشابكة
    def fibers(cx, cy, w, h, k, lw=1.1):
        out = ''
        for _ in range(k):
            x0 = cx + rnd.uniform(-w, w); y0 = cy + rnd.uniform(-h, h)
            dx = rnd.uniform(8, 18) * rnd.choice((-1, 1)); dy = rnd.uniform(-6, 6)
            out += (f'<path fill="none" stroke="{INK}" stroke-width="{lw}" stroke-linecap="round" '
                    f'd="M{x0:.1f} {y0:.1f} q{dx/2+rnd.uniform(-5,5):.1f} {dy/2+rnd.uniform(-6,6):.1f} {dx:.1f} {dy:.1f}"/>')
        return out
    # فتقٌ في زاوية الفراش الأمامية اليسرى يخرج منه الليف
    gap = '<path class="ink" opacity=".6" d="M34 98 c6 -4 14 -2 18 4 c-6 6 -14 6 -18 -4Z"/>'
    spill = fibers(40, 101, 8, 4, 16)
    bundle = (fibers(70, 130, 18, 5, 34, 1.2)
              + '<path class="g" d="M68 122 q4 8 0 16"/>')  # حزمة ليف مربوطة
    return svg(f'<path class="f" d="{top}"/><path class="f2" d="{front}"/>'
               f'<path class="g" d="{top}"/><path class="g" d="{front}"/>' + stitch + tufts + gap + spill + bundle)
ART['firash'] = _firash()
# 9. المُدّ والصاع: أربعة أمداد = صاع
cup = lambda x, y, s=1: (f'<path class="f" d="M{x-14*s} {y} h{28*s} c0 {12*s} -{5*s} {18*s} -{14*s} {18*s} c-{9*s} 0 -{14*s} -{6*s} -{14*s} -{18*s}Z"/>'
                         f'<path class="g" d="M{x-14*s} {y} h{28*s} c0 {12*s} -{5*s} {18*s} -{14*s} {18*s} c-{9*s} 0 -{14*s} -{6*s} -{14*s} -{18*s}Z"/>'
                         f'<ellipse class="w" cx="{x}" cy="{y}" rx="{14*s}" ry="{3.5*s}"/><ellipse class="g" cx="{x}" cy="{y}" rx="{14*s}" ry="{3.5*s}"/>')
ART['mudd'] = svg(cup(150, 56, 1) + cup(118, 56, 1) + cup(150, 96, 1) + cup(118, 96, 1) +
  '<path class="e" d="M88 74 h-10 M88 82 h-10"/>' + cup(48, 66, 1.75))
# 10. جذع النخلة والمنبر ذو الدرجات الثلاث
ART['jidh'] = svg(
  '<path class="f" d="M62 132 C64 100 66 70 70 42 h12 C80 70 80 100 82 132 Z"/><path class="g" d="M62 132 C64 100 66 70 70 42 h12 C80 70 80 100 82 132 Z"/>'
  + ''.join(f'<path class="gt" d="M{66-i*0.2} {124-i*11} q6 4 14 0"/>' for i in range(8))
  + '<path class="e" d="M76 42 C64 28 50 26 38 34 M76 42 C86 26 102 22 114 30 M76 42 C70 24 72 14 80 8 M76 42 C92 38 104 44 110 54 M76 42 C60 40 48 46 44 58"/>'
  '<path class="f" d="M112 132 v-18 h16 v-14 h16 v-14 h16 v46 Z"/><path class="g" d="M112 132 v-18 h16 v-14 h16 v-14 h16 v46 Z"/>'
  '<path class="gt" d="M160 86 v-10 M144 100 h16 M128 114 h32"/><path class="e" d="M48 132 h120"/>')
# 11. الهلال
ART['hilal'] = svg(
  # هلال رقيق: دائرة يُطرح منها دائرة مزاحة؛ الحافّتان تُرسمان بالقناع نفسه فلا حساب يدويًّا للأقواس
  '<defs><mask id="m"><rect width="200" height="160" fill="#fff"/><circle cx="110" cy="70" r="41" fill="#000"/></mask>'
  '<clipPath id="o"><circle cx="96" cy="80" r="44"/></clipPath></defs>'
  '<circle class="f" cx="96" cy="80" r="44" mask="url(#m)"/><circle class="g" cx="96" cy="80" r="44" mask="url(#m)"/>'
  '<circle class="g" cx="110" cy="70" r="41" clip-path="url(#o)"/>'
  + ''.join(f'<path class="e" d="M{x} {y-5} v10 M{x-5} {y} h10"/>' for x, y in ((146, 40), (158, 70), (140, 112)))
  + '<path class="gt" d="M40 136 C80 130 120 130 160 136"/>')
# 12. المطر
cloud = lambda x, y, s=1: (f'<path class="w" d="M{x} {y} c-{10*s} 0 -{14*s} -{12*s} -{4*s} -{16*s} c0 -{12*s} {16*s} -{16*s} {22*s} -{6*s} c{6*s} -{8*s} {22*s} -{4*s} {20*s} {8*s} c{10*s} 2 {8*s} {14*s} -{2*s} {14*s} Z"/>'
                           f'<path class="g" d="M{x} {y} c-{10*s} 0 -{14*s} -{12*s} -{4*s} -{16*s} c0 -{12*s} {16*s} -{16*s} {22*s} -{6*s} c{6*s} -{8*s} {22*s} -{4*s} {20*s} {8*s} c{10*s} 2 {8*s} {14*s} -{2*s} {14*s} Z"/>')
drops = ''.join(f'<path class="et" d="M{x} {y} l-4 10"/>' for x, y in ((64, 78), (78, 86), (92, 78), (106, 90), (120, 80), (134, 88), (148, 80), (72, 104), (100, 106), (128, 104), (86, 120), (114, 122)))
ART['matar'] = svg(cloud(66, 66, 1.3) + cloud(108, 58, 1.6) + drops + '<path class="e" d="M44 136 C80 130 120 130 156 136"/>')
# 13. الكبشان الأقرنان
def ram(x, flip=1):
    t = f'translate({x} 0) scale({flip} 1)'
    return (f'<g transform="{t}"><path class="f" d="M0 52 C18 50 26 66 24 84 C22 104 12 118 0 120 C-12 118 -22 104 -24 84 C-26 66 -18 50 0 52Z"/>'
            f'<path class="g" d="M0 52 C18 50 26 66 24 84 C22 104 12 118 0 120 C-12 118 -22 104 -24 84 C-26 66 -18 50 0 52Z"/>'
            f'<path class="gt" d="M-6 108 q6 6 12 0"/><circle cx="-9" cy="80" r="2" fill="{E}"/><circle cx="9" cy="80" r="2" fill="{E}"/>'
            f'<path class="f2" d="M-16 62 C-40 52 -46 80 -30 88 C-20 92 -16 82 -24 78"/><path class="e" d="M-16 62 C-40 52 -46 80 -30 88 C-20 92 -16 82 -24 78"/>'
            f'<path class="f2" d="M16 62 C40 52 46 80 30 88 C20 92 16 82 24 78"/><path class="e" d="M16 62 C40 52 46 80 30 88 C20 92 16 82 24 78"/>'
            f'<path class="gt" d="M-8 58 q8 -6 16 0 M-6 64 q6 -4 12 0"/></g>')
ART['kabsh'] = svg('<g transform="translate(100 84) scale(1.0) translate(-100 -80)">' + ram(64) + ram(136, -1) + '</g>')
# 14. الناقة
ART['naqa'] = svg(
  '<path class="f" d="M40 118 v-26 C40 80 48 70 62 68 C72 46 104 44 112 66 C120 70 126 66 130 56 C132 44 140 36 150 38 C158 40 160 46 156 50 L146 52 C144 62 140 74 132 84 C128 90 128 94 128 118 h-8 v-24 C108 98 76 98 60 94 L56 118 Z"/>'
  '<path class="g" d="M40 118 v-26 C40 80 48 70 62 68 C72 46 104 44 112 66 C120 70 126 66 130 56 C132 44 140 36 150 38 C158 40 160 46 156 50 L146 52 C144 62 140 74 132 84 C128 90 128 94 128 118 h-8 v-24 C108 98 76 98 60 94 L56 118 Z"/>'
  f'<circle cx="148" cy="44" r="1.8" fill="{E}"/><path class="gt" d="M48 118 v-22 M110 118 v-20"/>'
  '<path class="e" d="M30 122 h140"/><path class="et" d="M150 38 l2 -6 M144 40 l-1 -6"/>')
# 15. الطائر وفرخاه
ART['tair'] = svg(
  '<path class="f2" d="M62 122 C70 104 130 104 138 122 C120 130 80 130 62 122Z"/><path class="g" d="M62 122 C70 104 130 104 138 122 C120 130 80 130 62 122Z M70 116 l60 0 M66 120 c20 -6 48 -6 68 0"/>'
  + ''.join(f'<circle class="f" cx="{x}" cy="106" r="9"/><circle class="g" cx="{x}" cy="106" r="9"/><circle cx="{x+3}" cy="104" r="1.6" fill="{E}"/><path class="e" d="M{x+8} 106 l5 -1 l-5 3"/>' for x in (88, 108))
  + '<path class="f" d="M100 50 C110 44 122 48 124 58 C126 66 118 72 108 72 C98 72 92 64 94 56Z"/>'
  '<path class="g" d="M100 50 C110 44 122 48 124 58 C126 66 118 72 108 72 C98 72 92 64 94 56Z"/>'
  '<path class="f2" d="M98 58 C80 38 60 34 46 40 C60 46 72 58 96 66Z"/><path class="g" d="M98 58 C80 38 60 34 46 40 C60 46 72 58 96 66Z M60 42 C70 48 80 54 92 62"/>'
  '<path class="f2" d="M118 54 C132 30 152 24 166 28 C154 36 142 48 122 62Z"/><path class="g" d="M118 54 C132 30 152 24 166 28 C154 36 142 48 122 62Z M152 32 C142 40 132 48 124 56"/>'
  f'<circle cx="118" cy="56" r="1.8" fill="{E}"/><path class="e" d="M124 58 l8 2 l-8 3"/><path class="g" d="M94 66 l-12 10 M100 70 l-8 12"/>')
# 16. خبز الشعير
ear = lambda x, y, a: (f'<g transform="rotate({a} {x} {y})"><path class="e" d="M{x} {y} v-44"/>' +
  ''.join(f'<ellipse class="f2" cx="{x+(4 if i%2 else -4)}" cy="{y-18-i*5}" rx="3.2" ry="5.5" transform="rotate({25 if i%2 else -25} {x+(4 if i%2 else -4)} {y-18-i*5})"/>' for i in range(6)) +
  ''.join(f'<path class="gt" d="M{x+(4 if i%2 else -4)} {y-22-i*5} l{6 if i%2 else -6} -10"/>' for i in range(6)) + '</g>')
ART['khubz'] = svg(
  '<ellipse class="f2" cx="96" cy="98" rx="54" ry="22"/><ellipse class="g" cx="96" cy="98" rx="54" ry="22"/><ellipse class="gt" cx="96" cy="96" rx="40" ry="14"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="2" fill="{G}"/>' for x, y in ((78, 92), (94, 98), (110, 92), (86, 104), (104, 104), (96, 88)))
  + ear(146, 80, 12) + ear(156, 84, 28))

# البطاقة ← الرسم والسطر تحته (يصف الشيء، ولا يدّعي أنه عين ما كان له ﷺ)
MAP = {
  'W11': ('miswak', 'السِّواك: عودٌ من شجر الأراك تُنظَّف به الأسنان'),
  'X05': ('miswak', 'السِّواك: عودٌ من شجر الأراك تُنظَّف به الأسنان'),
  'W20': ('dubba', 'الدُّبّاء: القرع، نباتٌ يُطبخ'),
  'X11': ('qiththa', 'القِثّاء: نوعٌ طويل من الخيار، ومعه الرُّطَب'),
  'B06': ('iftar', 'رُطَبات، ثم تمرات، ثم ماء'),
  'R04': ('iftar', 'التمر والماء'),
  'B07': ('tamr', 'تمرات'),
  'C43': ('tamr', 'التمر'),
  'D13': ('tamr', 'التمر'),
  'W25': ('honey', 'العسل'),
  'R05': ('hasir', 'الحصير: بساطٌ يُنسج من خوص النخل'),
  'X03': ('firash', 'فراشٌ من أَدَم: جلدٍ مدبوغ، حشوه ليف النخل'),
  'Y09': ('mudd', 'أربعة أمداد تساوي صاعًا واحدًا'),
  'V25': ('jidh', 'جذع النخلة، والمنبر ذو الدرجات الثلاث'),
  'W08': ('jidh', 'المنبر ذو الدرجات الثلاث'),
  'A09': ('hilal', 'الهلال: أول القمر في الشهر'),
  'A05': ('matar', 'المطر'),
  'C11': ('matar', 'المطر'),
  'V06': ('kabsh', 'كبشان أقرنان: لكلٍّ منهما قرنان'),
  'B04': ('naqa', 'الناقة'),
  'X24': ('naqa', 'الجمل'),
  'R07': ('tair', 'طائرٌ يرفرف فوق فرخيه'),
  'V24': ('khubz', 'خبز الشعير'),
}
out_dir = os.path.join(root, 'public/art'); os.makedirs(out_dir, exist_ok=True)
for k, v in ART.items():
    open(os.path.join(out_dir, k + '.svg'), 'w').write(v)
import time
json.dump({'version': int(time.time()), 'cards': {c: {'art': a, 'caption': t} for c, (a, t) in MAP.items()}},
          open(os.path.join(root, 'public/art.json'), 'w'), ensure_ascii=False, indent=0)
print(len(ART), 'drawings,', len(MAP), 'cards')
