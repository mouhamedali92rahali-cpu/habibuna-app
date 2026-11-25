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

# ——— الدفعة الثانية (2026-11-02) ———
def path2(d, cls='f', line='g'):
    return f'<path class="{cls}" d="{d}"/><path class="{line}" d="{d}"/>'
def ell(cx, cy, rx, ry, cls='f', line='g', rot=0):
    t = f' transform="rotate({rot} {cx} {cy})"' if rot else ''
    return f'<ellipse class="{cls}" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{t}/><ellipse class="{line}" cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"{t}/>'
def star(x, y, r=5, cls='e'):
    return f'<path class="{cls}" d="M{x} {y-r} v{2*r} M{x-r} {y} h{2*r}"/><path class="et" d="M{x-r*.6} {y-r*.6} l{r*1.2} {r*1.2} M{x+r*.6} {y-r*.6} l{-r*1.2} {r*1.2}"/>'

# 17. اللبنة: بيت حسن جميل ينقصه موضع لبنة من زاوية
def _labina():
    x0, x1, y0, rows, h, bw = 44, 156, 56, 8, 9.25, 16
    out = ''
    gap = None
    for r in range(rows):
        y = y0 + r*h; off = 0 if r % 2 == 0 else -bw/2
        x = x0 + off
        while x < x1:
            a, b = max(x, x0), min(x + bw, x1)
            if r == 0 and b == x1: gap = (a, y, b - a, h)
            else:
                fill = 'f2' if (r*5 + int(x)//bw) % 4 == 0 else 'f'
                out += f'<rect class="{fill}" x="{a+.9:.1f}" y="{y+.9:.2f}" width="{b-a-1.8:.1f}" height="{h-1.8:.2f}" rx="1.2" stroke="{G}" stroke-width=".9"/>'
            x += bw
    out += path2('M88 130 V106 a12 12 0 0 1 24 0 V130 Z', 'fe', 'e')
    out += path2('M58 86 v-11 a7 7 0 0 1 14 0 v11 Z', 'fe', 'et') + path2('M128 86 v-11 a7 7 0 0 1 14 0 v11 Z', 'fe', 'et')
    a, y, w, hh = gap
    out += f'<path class="g" d="M{x0} 130 V{y0} H{a} M{x1} {y0+h} V130"/><path class="e" d="M{x0-8} 131 H{x1+8}"/>'
    out += f'<rect x="{a+1}" y="{y+1}" width="{w-2}" height="{hh-2}" fill="#fffaf0" stroke="{E}" stroke-width="1.6" stroke-dasharray="3 2"/>'
    out += star(a + w/2, y - 13, 6)
    return svg(out)
ART['labina'] = _labina()

# 18. الشاة
def sheep(x, y, s=1.0, flip=1, cls='w'):
    wool = ''.join(f'<circle class="{cls}" cx="{cx}" cy="{cy}" r="{r}"/>' for cx, cy, r in ((-14,-4,9),(-4,-9,10),(8,-8,9),(16,-1,8),(10,6,9),(-2,7,10),(-14,5,8)))
    woolL = ''.join(f'<circle class="gt" cx="{cx}" cy="{cy}" r="{r}"/>' for cx, cy, r in ((-14,-4,9),(-4,-9,10),(8,-8,9),(16,-1,8),(10,6,9),(-2,7,10),(-14,5,8)))
    legs = ''.join(f'<path class="g" d="M{lx} 12 v14"/>' for lx in (-12, -5, 6, 13))
    head = (f'<ellipse class="f2" cx="20" cy="-11" rx="6" ry="2.6" transform="rotate(-25 20 -11)"/><ellipse class="gt" cx="20" cy="-11" rx="6" ry="2.6" transform="rotate(-25 20 -11)"/>'
            f'<ellipse class="f2" cx="28" cy="-3" rx="6.5" ry="11" transform="rotate(-50 28 -3)"/><ellipse class="g" cx="28" cy="-3" rx="6.5" ry="11" transform="rotate(-50 28 -3)"/>'
            f'<circle cx="26" cy="-7" r="1.5" fill="{E}"/>')
    return f'<g transform="translate({x} {y}) scale({s*flip} {s})">{legs}{woolL}{wool}{head}</g>'
ART['shah'] = svg(sheep(96, 80, 1.7) + '<path class="e" d="M40 128 C80 124 120 124 160 128"/>'
                  '<path class="et" d="M56 126 l-3 -6 M60 126 l1 -7 M140 126 l-2 -6 M144 126 l2 -6"/>')

# 19. غنمٌ بين جبلين
ART['ghanam'] = svg(
  path2('M26 122 C34 96 44 70 58 58 C66 52 72 58 78 66 C88 80 96 100 104 122 Z', 'f2')
  + path2('M96 122 C106 98 118 76 130 66 C138 60 146 66 152 76 C160 90 168 106 174 122 Z', 'f2')
  + '<path class="gt" d="M58 60 c-4 14 2 24 -4 40 M130 68 c-4 14 2 26 -4 40"/>'
  + sheep(70, 110, .62) + sheep(98, 114, .62) + sheep(126, 110, .62) + sheep(84, 126, .62) + sheep(112, 128, .62)
  + '<path class="e" d="M30 138 C80 134 120 134 170 138"/>')

# 20. جبل أُحد: سلسلة طويلة متعدّدة القمم
ART['uhud'] = svg(
  path2('M26 118 C34 108 40 92 50 86 C56 82 60 90 66 80 C72 70 78 64 86 70 C92 74 94 62 102 58 C110 54 114 66 120 64 C128 62 132 72 140 76 C148 80 152 92 160 98 C166 104 170 112 174 118 Z', 'f2')
  + '<path class="gt" d="M66 80 c2 10 -4 18 -2 30 M86 70 c-2 12 4 22 0 40 M102 58 c4 14 -2 30 4 52 M120 64 c-2 12 4 24 0 44 M140 76 c2 12 -4 20 0 34"/>'
  + '<path class="e" d="M20 124 C70 118 130 118 180 124"/>'
  + ''.join(f'<path class="et" d="M{x} 122 c0 -6 4 -8 6 -10 M{x+3} 122 c1 -5 -2 -8 -4 -10"/>' for x in (40, 150))
  + '<circle class="g" cx="150" cy="36" r="8"/>')

# 21. الحمار
ART['himar'] = svg(
  '<path class="g" d="M58 80 C50 88 48 100 52 112"/><path class="e" d="M52 110 l-4 7 M52 110 l1 8 M52 110 l4 6"/>'
  + ''.join(f'<path class="g" d="M{x} 98 l{dx} 28"/><path class="e" d="M{x+dx-3} 127 h6"/>' for x, dx in ((68, -2), (80, 1), (108, -1), (120, 2)))
  + ell(94, 86, 36, 17)
  + path2('M116 76 C122 66 128 56 134 50 L150 56 C144 66 136 80 128 92 Z')
  + '<path class="e" d="M118 72 C124 62 128 54 134 47"/>'
  + ell(134, 34, 4.5, 15, rot=-20) + ell(146, 34, 4.5, 15, rot=18)
  + '<path class="gt" d="M134 26 v14 M146 26 v14"/>'
  + ell(152, 68, 10, 21, rot=-38)
  + f'<circle cx="146" cy="56" r="2" fill="{E}"/><path class="et" d="M160 80 c2 1 3 0 4 -1"/>'
  + '<path class="gt" d="M28 130 h144"/>')

# 22. الريحان: غصن بأوراق متقابلة وسنبلة زهر
def _rayhan():
    out = '<path class="e" d="M100 136 C98 110 100 80 102 40"/><path class="et" d="M100 110 C110 96 124 92 134 86 M100 92 C88 80 76 76 66 72"/>'
    for i, y in enumerate((124, 108, 92, 76, 60)):
        s = 1 - i*0.12
        out += ell(100 - 13*s, y, 11*s, 5.5*s, 'fe', 'et', rot=-25) + ell(103 + 13*s, y - 2, 11*s, 5.5*s, 'fe', 'et', rot=25)
    out += ell(138, 82, 9, 4.5, 'fe', 'et', rot=-30) + ell(62, 68, 9, 4.5, 'fe', 'et', rot=30)
    out += ''.join(f'<circle class="f" cx="{102+(2 if k%2 else -2)}" cy="{48-k*4}" r="2.6"/><circle class="gt" cx="{102+(2 if k%2 else -2)}" cy="{48-k*4}" r="2.6"/>' for k in range(5))
    return svg(out)
ART['rayhan'] = _rayhan()

# 23. الصحفة المكسورة والطعام
ART['sahfa'] = svg(
  path2('M40 92 C40 116 70 126 92 124 L98 100 L86 84 L40 84 Z', 'f')
  + path2('M110 82 L162 84 C162 110 136 124 108 126 L104 108 Z', 'f')
  + '<path class="gt" d="M44 90 C60 96 78 96 88 92 M112 90 C130 96 146 96 158 90"/>'
  + ''.join(f'<ellipse class="f2" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}"/><ellipse class="gt" cx="{x}" cy="{y}" rx="{rx}" ry="{ry}"/>' for x, y, rx, ry in ((70, 80, 14, 5), (134, 78, 12, 4.5), (100, 134, 9, 3.5), (82, 136, 6, 2.6), (120, 138, 7, 3)))
  + path2('M92 128 l8 4 l-4 6 Z', 'f') + '<path class="e" d="M34 142 h132"/>')

# 24. طلوع الشمس
def _shuruq():
    import math
    rays = ''.join(f'<path class="g" d="M{100+40*math.cos(a):.1f} {108-40*math.sin(a):.1f} L{100+56*math.cos(a):.1f} {108-56*math.sin(a):.1f}"/>'
                   for a in [math.radians(d) for d in range(15, 170, 22)])
    return svg('<path class="f" d="M68 108 a32 32 0 0 1 64 0 Z"/><path class="g" d="M68 108 a32 32 0 0 1 64 0"/>' + rays
               + '<path class="e" d="M32 108 H168"/><path class="et" d="M48 118 H152 M66 127 H134"/>')
ART['shuruq'] = _shuruq()

# 25. قدحٌ من لبن
ART['qadah'] = svg(
  path2('M62 64 H138 C138 98 124 118 100 120 C76 118 62 98 62 64 Z', 'f2')
  + '<ellipse class="w" cx="100" cy="64" rx="38" ry="9"/><ellipse class="g" cx="100" cy="64" rx="38" ry="9"/>'
  + '<path class="gt" d="M68 82 C88 88 112 88 132 82 M74 100 C90 106 110 106 126 100"/>'
  + path2('M88 120 h24 l4 10 h-32 Z', 'f2') + '<path class="e" d="M50 132 h100"/>')

# 26. الدرع (حلقات الحديد) وصاعٌ من شعير
def _dir():
    body = ('M70 34 C76 30 84 30 88 32 C92 38 104 38 108 32 C112 30 120 30 126 34 L148 58 L136 70 L126 56 '
            'L126 136 L104 136 L98 124 L92 136 L70 136 L70 56 L60 70 L48 58 Z')
    rings = ''.join(f'<circle cx="{x}" cy="{y}" r="2.5" fill="none" stroke="#8c7a52" stroke-width="1"/>'
                    for y in range(30, 140, 4) for x in range(44 + ((y//4) % 2)*2, 152, 5))
    return svg(f'<defs><clipPath id="d"><path d="{body}"/></clipPath></defs>'
               f'<path fill="#e3dccb" d="{body}"/><g clip-path="url(#d)">{rings}</g>'
               f'<path fill="none" stroke="#6f6550" stroke-width="2.2" stroke-linejoin="round" d="{body}"/>'
               f'<path class="g" d="M88 32 C92 42 104 42 108 32 M70 56 L126 56 M70 130 H126"/>'
               + cup(158, 110, 1.1)
               + ''.join(f'<ellipse class="f2" cx="{x}" cy="{y}" rx="2.6" ry="1.5" transform="rotate({r} {x} {y})"/><ellipse class="gt" cx="{x}" cy="{y}" rx="2.6" ry="1.5" transform="rotate({r} {x} {y})"/>'
                         for x, y in ((148, 108), (154, 105), (160, 104), (166, 105), (170, 108), (151, 112), (158, 110), (165, 111), (157, 101), (163, 100)) for r in [ (x*7) % 60 - 30 ])
               + '<path class="e" d="M34 140 h138"/>')
ART['dir'] = _dir()

# 27. نعلان لكلٍّ منهما قِبالان (C10): منظر من فوق؛ نعل عربية بسيطة لا تدّعي أنها عين نعله ﷺ
def _naal():
    def one(cx, flip):
        f = lambda x: cx + flip*(x - 125)
        sole = (f'M{f(125)} 26 C{f(144)} 26 {f(148)} 50 {f(146)} 70 C{f(144)} 92 {f(140)} 110 {f(139)} 124 '
                f'C{f(138)} 138 {f(112)} 138 {f(111)} 124 C{f(110)} 110 {f(105)} 92 {f(104)} 70 C{f(102)} 50 {f(106)} 26 {f(125)} 26 Z')
        o = path2(sole, 'f2') + f'<path class="gt" d="M{f(110)} 118 C{f(122)} 128 {f(130)} 128 {f(138)} 118" opacity=".6"/>'
        # الشِّراك: السير العريض فوق ظهر القدم
        o += f'<path d="M{f(104)} 80 C{f(116)} 70 {f(134)} 70 {f(146)} 80" fill="none" stroke="{E}" stroke-width="6" stroke-linecap="round"/>'
        o += f'<path d="M{f(104)} 80 C{f(116)} 70 {f(134)} 70 {f(146)} 80" fill="none" stroke="#2f8a72" stroke-width="2" stroke-linecap="round" opacity=".6"/>'
        # القِبالان: سيران من مقدّم النعل بين الأصابع إلى الشراك
        for px, py, qx in ((114, 44, 120), (128, 41, 128)):
            o += f'<path d="M{f(px)} {py} C{f(px)} {py+12} {f(qx)} {py+18} {f(qx)} 73" fill="none" stroke="{E}" stroke-width="3" stroke-linecap="round"/>'
            o += f'<circle cx="{f(px)}" cy="{py}" r="3.4" fill="{E}"/><circle cx="{f(px)}" cy="{py}" r="1.3" fill="#fffaf0"/>'
        return o
    return svg(one(128, 1) + one(72, -1))
ART['naal'] = _naal()

# ——— الدفعة الثالثة (2026-11-02، المراجعة الشاملة) ———
CAMEL = 'M40 118 v-26 C40 80 48 70 62 68 C72 46 104 44 112 66 C120 70 126 66 130 56 C132 44 140 36 150 38 C158 40 160 46 156 50 L146 52 C144 62 140 74 132 84 C128 90 128 94 128 118 h-8 v-24 C108 98 76 98 60 94 L56 118 Z'
def camel(tf='', thin=False):
    d = CAMEL
    if thin:  # البطن مرتفع إلى الظهر، والسنام ضامر
        d = d.replace('C72 46 104 44 112 66', 'C76 58 100 56 112 66').replace('C108 98 76 98 60 94', 'C104 84 78 84 60 86')
    o = path2(d, 'f2' if thin else 'f')
    if thin:
        o += ''.join(f'<path class="gt" d="M{x} {y} q3 6 0 12"/>' for x, y in ((70, 72), (78, 71), (86, 71), (94, 71), (102, 72)))
    o += f'<circle cx="148" cy="44" r="1.8" fill="{E}"/><path class="gt" d="M48 118 v-22 M110 118 v-20"/><path class="et" d="M150 38 l2 -6 M144 40 l-1 -6"/>'
    return f'<g transform="{tf}">{o}</g>' if tf else o
# 28. بعيرٌ هزيل (D09)
ART['bair'] = svg(camel(thin=True) + '<path class="e" d="M30 122 h140"/>')
# 29. ناقة وولدها (C33)
ART['naqa2'] = svg(camel('translate(-14 4) scale(.92)') + camel('translate(118 70) scale(.42)') + '<path class="e" d="M24 124 h152"/>')
# 30. الذَّنوب: الدلو العظيمة مملوءة ماءً (S04)
ART['dhanub'] = svg(
  path2('M58 62 L142 62 L132 128 C120 136 80 136 68 128 Z', 'f2')
  + '<ellipse class="fe" cx="100" cy="62" rx="42" ry="9"/><ellipse class="g" cx="100" cy="62" rx="42" ry="9"/>'
  + '<path class="gt" d="M62 84 C88 90 112 90 138 84 M65 106 C88 112 112 112 135 106"/>'
  + '<path class="g" d="M60 64 C64 22 136 22 140 64"/><path class="g" d="M100 26 V10"/>'
  + '<path class="et" d="M132 66 c8 6 10 14 8 22 M138 66 c10 10 12 22 6 34" opacity=".8"/>'
  + ''.join(f'<path class="fe" d="M{x} {y} c-3 5 -3 8 0 8 c3 0 3 -3 0 -8Z"/><path class="et" d="M{x} {y} c-3 5 -3 8 0 8 c3 0 3 -3 0 -8Z"/>' for x, y in ((146, 104), (150, 118), (142, 124))))
# 31. الخلّ والخبز (X10)
ART['khall'] = svg(
  path2('M34 88 C34 120 100 120 100 88 Z', 'f')
  + '<ellipse fill="#e9d9a6" cx="67" cy="88" rx="33" ry="7"/><ellipse class="g" cx="67" cy="88" rx="33" ry="7"/><path d="M50 87 q8 -2 14 0" stroke="#fffaf0" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<ellipse class="f2" cx="134" cy="100" rx="38" ry="15"/><ellipse class="g" cx="134" cy="100" rx="38" ry="15"/><ellipse class="gt" cx="134" cy="98" rx="27" ry="9"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="1.8" fill="{G}"/>' for x, y in ((120, 96), (134, 100), (148, 95), (128, 104), (142, 104)))
  + '<path class="e" d="M30 122 h140"/>')

# ——— خريطة المدينة (2026-11-02): المواضع من إحداثيات حقيقية، والمقياس 16px لكل كيلومتر ———
# المسجد النبوي 24.4670,39.6109 · قباء 24.4396,39.6172 · قمة أحد 24.5103,39.6139 · سيد الشهداء 24.5035,39.6127 · سلع 24.4750,39.5994 (ويكيبيديا)
import math
KM = 16; CX, CY = 96, 118
def at(lat, lon):
    dy = (lat - 24.4670) * 110.6; dx = (lon - 39.6109) * 111.3 * math.cos(math.radians(24.47))
    return round(CX + dx*KM, 1), round(CY - dy*KM, 1)
MOSQ, QUBA, UHUD, SHUH, SAL = at(24.4670, 39.6109), at(24.4396, 39.6172), at(24.5103, 39.6139), at(24.5035, 39.6127), at(24.4750, 39.5994)
LBL = 'font-family="Noto Naskh Arabic,Amiri,serif" text-anchor="middle" paint-order="stroke" stroke="#efe4c6" stroke-width="3" stroke-linejoin="round"'
BROWN = '#8a6d3b'
def palm(x, y, s=1.0, op=1.0):
    # نخلة صغيرة: جذع مائل قليلًا وخمس سعفات
    fr = ''.join(f'<path d="M{x} {y-10*s} q{dx*s} {dy*s} {ex*s} {ey*s}" fill="none" stroke="{E}" stroke-width="1.1" stroke-linecap="round"/>'
                 for dx, dy, ex, ey in ((-3, -4, -7, 0), (3, -4, 7, 0), (-2, -5, -5, -5), (2, -5, 5, -5), (0, -4, 0, -6)))
    return f'<g opacity="{op}"><path d="M{x} {y} q{1*s} {-5*s} 0 {-10*s}" fill="none" stroke="{G}" stroke-width="1.3" stroke-linecap="round"/>{fr}</g>'
def mosque(x, y, s=1.0, col=E):
    # مسجد صغير: قاعدة وقبة ومئذنة
    return (f'<rect x="{x-6*s}" y="{y-3*s}" width="{12*s}" height="{7*s}" fill="{col}"/>'
            f'<path d="M{x-4.5*s} {y-3*s} a{4.5*s} {4.5*s} 0 0 1 {9*s} 0 Z" fill="{col}"/>'
            f'<rect x="{x+6.5*s}" y="{y-10*s}" width="{2.2*s}" height="{14*s}" fill="{col}"/><path d="M{x+6.5*s} {y-10*s} l{1.1*s} {-2.5*s} l{1.1*s} {2.5*s} Z" fill="{col}"/>')
def harra(x0, y0, x1, y1, seed, n=None):
    # الحرّة: أرض حجارتها سوداء بركانية؛ ظلّ داكن خفيف وحجارة صغيرة مستديرة متفاوتة
    import random
    r = random.Random(seed)
    o = f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" rx="14" fill="#5a4a36" opacity=".10"/>'
    for _ in range(n or int((x1-x0)*(y1-y0)/70)):
        x, y = r.uniform(x0+2, x1-2), r.uniform(y0+2, y1-2)
        o += f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{r.uniform(1.1,2.2):.1f}" ry="{r.uniform(.8,1.5):.1f}" fill="#4a3d2c" opacity="{r.uniform(.35,.6):.2f}"/>'
    return o
def madina(hi):
    on = lambda k: k == hi
    def label(x, y, t, k, size=10, col=None):
        c = col or (E if on(k) else '#7d6c47')
        return f'<text x="{x}" y="{y}" {LBL} font-size="{size + (2.5 if on(k) else 0)}" font-weight="{700 if on(k) else 400}" fill="{c}">{t}</text>'
    W, H = 200, 240
    o = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">{STYLE}'
    o += f'<rect x="3" y="3" width="{W-6}" height="{H-6}" rx="14" fill="{BG}"/>'
    o += '<defs><clipPath id="mc"><rect x="9" y="9" width="182" height="222" rx="10"/></clipPath></defs><g clip-path="url(#mc)">'
    # الحرّتان: الشرقية (واقم) والغربية (الوبرة)، حجارة بركانية سوداء تحيط بالمدينة من الجانبين
    o += harra(146, 66, 192, 146, 1) + harra(8, 84, 46, 196, 2)
    o += label(171, 94, 'حرّة واقم', 'x', 8.5, BROWN) + label(28, 182, 'حرّة الوبرة', 'x', 8.5, BROWN)
    # النخيل: أكثره في الجنوب (قباء والعوالي)، وشيء حول المدينة
    for x, y, sc in ((64, 190, .85), (98, 206, .8), (58, 160, .75), (122, 210, .8), (140, 146, .7)):
        o += palm(x, y, sc, .55 if not on('awali') else .4)
    # جبل أحد: سلسلة بقمم وظلال
    ux, uy = UHUD; L = 7.5*KM/2
    ridge = (f'M{ux-L:.0f} {uy+10:.0f} L{ux-L+8:.0f} {uy+2:.0f} L{ux-34:.0f} {uy-2:.0f} L{ux-24:.0f} {uy-9:.0f} L{ux-14:.0f} {uy-5:.0f} L{ux-4:.0f} {uy-15:.0f} '
             f'L{ux+8:.0f} {uy-6:.0f} L{ux+18:.0f} {uy-12:.0f} L{ux+30:.0f} {uy-4:.0f} L{ux+42:.0f} {uy-9:.0f} L{ux+L-4:.0f} {uy-1:.0f} L{ux+L:.0f} {uy+10:.0f} Z')
    shade = ''.join(f'<path d="M{ux+dx:.0f} {uy+dy:.0f} l{-3} 10" stroke="{BROWN}" stroke-width=".9" opacity=".5"/>' for dx, dy in ((-24, -7), (-4, -13), (-1, -9), (18, -10), (21, -6), (42, -7), (-30, -1)))
    o += f'<path d="{ridge}" fill="{F if on("uhud") else F2}" opacity="{1 if on("uhud") else .75}"/>{shade}<path d="{ridge}" fill="none" stroke="{G}" stroke-width="{2 if on("uhud") else 1.2}" stroke-linejoin="round"/>'
    o += label(ux - 4, uy - 20, 'جبل أُحد', 'uhud', 11)
    if on('uhud'):
        sx_, sy_ = SHUH
        o += f'<circle cx="{sx_}" cy="{sy_}" r="2.6" fill="{E}"/><circle cx="{sx_}" cy="{sy_}" r="8" fill="none" stroke="{G}" stroke-width="1.6" stroke-dasharray="2.5 2"/>'
        o += f'<text x="{sx_+38}" y="{sy_+14}" {LBL} font-size="8.5" fill="#5b4a2a">موضع شهداء أُحد</text>'
        o += f'<path d="M{MOSQ[0]} {MOSQ[1]-14} L{sx_} {sy_+10}" stroke="{E}" stroke-width="1.2" stroke-dasharray="1.5 3"/>'
        o += f'<text x="{(MOSQ[0]+sx_)/2+20}" y="{(MOSQ[1]+sy_)/2+3}" {LBL} font-size="9" fill="{E}" font-weight="700">نحو 4 كم</text>'
    # جبل سلع
    sx, sy = SAL
    o += f'<path d="M{sx-11} {sy+4} L{sx-4} {sy-5} L{sx} {sy-2} L{sx+4} {sy-7} L{sx+11} {sy+4} Z" fill="{F if on("khandaq") else F2}"/><path d="M{sx-11} {sy+4} L{sx-4} {sy-5} L{sx} {sy-2} L{sx+4} {sy-7} L{sx+11} {sy+4}" fill="none" stroke="{G}" stroke-width="1.1"/>'
    o += label(sx - 22, sy + 4, 'سَلْع', 'khandaq', 9)
    # الخندق: شمال المدينة بين الحرّتين
    trench = f'M{sx-40:.0f} {sy-14:.0f} C{sx-14:.0f} {sy-18:.0f} {sx+22:.0f} {sy-17:.0f} {sx+56:.0f} {sy-22:.0f}'
    if on('khandaq'):
        o += f'<path d="{trench}" fill="none" stroke="{E}" stroke-width="3.2" stroke-dasharray="6 3" stroke-linecap="round"/>'
        o += label(sx + 8, sy - 27, 'الخندق تقريبًا', 'khandaq', 9.5)
    # العوالي
    ax, ay = CX + 3.6*KM, CY + 3.4*KM
    o += f'<ellipse cx="{ax}" cy="{ay}" rx="30" ry="22" fill="{F if on("awali") else "none"}" fill-opacity=".75" stroke="{E if on("awali") else G}" stroke-width="{1.8 if on("awali") else .9}" stroke-dasharray="4 3"/>'
    if on('awali'):
        for x, y in ((-14, 8), (-2, -4), (12, 8), (16, -6), (2, 12)): o += palm(ax + x, ay + y, .9)
        o += f'<path d="M{MOSQ[0]+8} {MOSQ[1]+6} L{ax-18} {ay-12}" stroke="{E}" stroke-width="1.2" stroke-dasharray="1.5 3"/>'
        o += f'<text x="{(MOSQ[0]+ax)/2+30}" y="{(MOSQ[1]+ay)/2-8}" {LBL} font-size="9" fill="{E}" font-weight="700">نحو 4 إلى 6 كم</text>'
    o += label(ax, ay + 32, 'العوالي', 'awali', 10)
    # قباء
    qx, qy = QUBA
    if on('quba'):
        o += f'<path d="M{MOSQ[0]} {MOSQ[1]+8} C{MOSQ[0]-6} {MOSQ[1]+22} {qx-8} {qy-22} {qx} {qy-8}" fill="none" stroke="{E}" stroke-width="1.4" stroke-dasharray="1.5 3"/>'
        o += f'<text x="{qx-24}" y="{(MOSQ[1]+qy)/2+3}" {LBL} font-size="9.5" fill="{E}" font-weight="700">نحو 3 كم</text>'
        o += f'<circle cx="{qx}" cy="{qy}" r="11" fill="none" stroke="{G}" stroke-width="1.6" stroke-dasharray="2.5 2"/>'
    o += mosque(qx, qy, .8 if not on('quba') else 1, E if on('quba') else G)
    o += label(qx - 24, qy + 4, 'قُباء', 'quba', 10)
    # المسجد النبوي
    mx, my = MOSQ
    o += f'<circle cx="{mx}" cy="{my}" r="16" fill="#fffaf0" opacity=".55"/>' + mosque(mx, my, 1.2)
    o += f'<text x="{mx+40}" y="{my+4}" {LBL} font-size="9.5" fill="{E}" font-weight="700">المسجد النبوي</text>'
    o += '</g>'
    # الإطار والشمال والمقياس والعنوان
    o += f'<rect x="9" y="9" width="182" height="222" rx="10" fill="none" stroke="{G}" stroke-width="1.2"/>'
    o += ''.join(f'<path d="M{x} {y+8*sy_} v{-8*sy_} h{8*sx_}" fill="none" stroke="{G}" stroke-width="1.6" transform="translate({sx_*-1} {sy_*-1})"/>'
                 for x, y, sx_, sy_ in ((14, 14, 1, 1), (186, 14, -1, 1), (14, 226, 1, -1), (186, 226, -1, -1)))
    o += f'<g transform="translate(28 36)"><circle r="10" fill="#fffaf0" stroke="{G}" stroke-width="1"/><path d="M0 -8 L3 0 L0 -2 L-3 0 Z" fill="{E}"/><path d="M0 8 L3 0 L0 2 L-3 0 Z" fill="{G}"/></g>'
    o += f'<text x="28" y="57" {LBL} font-size="8" fill="{E}">شمال</text>'
    o += f'<path d="M22 216 h{KM} M22 213 v6 M{22+KM} 213 v6" stroke="#6b5a36" stroke-width="1.2"/><text x="{22+KM/2}" y="209" {LBL} font-size="7.5" fill="#6b5a36">كيلومتر</text>'
    o += f'<text x="{W/2+20}" y="214" {LBL} font-size="10" fill="{G}" font-weight="700">المدينة المنورة</text>'
    o += harra(150, 219, 162, 227, 9, 5) + f'<text x="94" y="226" {LBL} font-size="6.5" fill="#5b4a2a">الحرّة: أرض حجارتها سوداء بركانية</text>'
    return o + '</svg>'
# ——— الدفعة الرابعة (2026-11-02، «أكمل الصور») ———
# 32. النُّغَير: طائر صغير كالعصفور على غصن (P05)
ART['nughayr'] = svg(
  '<path class="e" d="M34 112 C70 104 120 106 166 96"/><path class="fe" d="M140 100 c4 -10 16 -12 20 -6 c-6 6 -12 8 -20 6Z"/><path class="et" d="M140 100 c4 -10 16 -12 20 -6 c-6 6 -12 8 -20 6Z"/>'
  + path2('M70 96 C64 78 80 62 100 62 C116 62 126 72 126 84 C126 98 112 106 96 106 C84 106 74 104 70 96Z', 'f')
  + path2('M74 92 C88 84 104 84 116 90 C108 100 88 104 74 92Z', 'f2')
  + path2('M70 94 L44 84 L52 98 Z', 'f2')
  + ell(120, 62, 13, 12) + f'<circle cx="124" cy="59" r="2.2" fill="{E}"/>'
  + '<path d="M132 62 l10 2 l-10 3 Z" fill="#c0563b" stroke="#9a3f2a" stroke-width="1"/>'
  + '<path class="g" d="M92 106 l-2 8 M104 106 l2 8"/>')
# 33. المِرجل: قِدرٌ تغلي على أثافيّ ونار (G01)
ART['mirjal'] = svg(
  path2('M56 66 H144 C146 100 128 120 100 120 C72 120 54 100 56 66 Z', 'f2')
  + '<ellipse class="w" cx="100" cy="66" rx="44" ry="8"/><ellipse class="g" cx="100" cy="66" rx="44" ry="8"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fffaf0" stroke="{G}" stroke-width="1.2"/>' for x, y, r in ((84, 64, 3.5), (100, 62, 4.5), (114, 65, 3), (92, 67, 2.5), (108, 68, 2.4)))
  + '<path class="et" d="M84 52 c-5 -6 5 -10 0 -16 M100 50 c-5 -6 5 -10 0 -18 M116 52 c-5 -6 5 -10 0 -16" opacity=".7"/>'
  + '<path class="g" d="M54 66 h-8 M146 66 h8"/>'
  + path2('M76 140 C70 128 84 124 82 114 C92 122 96 130 92 140 Z', 'f') + path2('M96 140 C92 126 104 120 102 110 C114 120 118 132 110 140 Z', 'f') + path2('M114 140 C112 130 122 126 122 118 C130 126 132 134 126 140 Z', 'f')
  + ell(66, 136, 12, 6, 'f2', 'g') + ell(134, 136, 12, 6, 'f2', 'g'))
# 34. نارٌ يتهافت فيها الفَراش (C27)
def moth(x, y, a=0, s=1.0):
    return (f'<g transform="translate({x} {y}) rotate({a}) scale({s})"><path class="f" d="M0 0 C-10 -10 -16 -2 -10 4 C-6 8 -2 4 0 0 C2 4 6 8 10 4 C16 -2 10 -10 0 0Z"/>'
            f'<path class="gt" d="M0 0 C-10 -10 -16 -2 -10 4 C-6 8 -2 4 0 0 C2 4 6 8 10 4 C16 -2 10 -10 0 0Z"/><path class="et" d="M0 -3 v8 M0 -3 l-3 -5 M0 -3 l3 -5"/></g>')
ART['nar'] = svg(
  '<circle cx="100" cy="100" r="44" fill="#f3d58a" opacity=".35"/>'
  + path2('M78 128 C66 108 82 98 80 80 C92 90 94 74 96 58 C112 76 126 92 118 112 C126 106 128 98 126 92 C138 108 132 124 122 128 Z', 'f')
  + path2('M90 128 C86 116 96 110 96 98 C106 108 112 118 108 128 Z', 'f2')
  + '<path class="e" d="M64 134 l72 -8 M64 126 l72 8"/>'
  + moth(52, 60, -20) + moth(150, 56, 25) + moth(140, 92, 60, .85) + moth(60, 96, -50, .85) + moth(118, 40, 10, .7) + moth(84, 42, -15, .7))
# 35. وادٍ وشِعب (C42)
ART['shib'] = svg(
  path2('M26 124 C34 96 46 66 62 52 C70 46 76 54 82 64 C90 80 96 104 100 124 Z', 'f2')
  + path2('M100 124 C106 100 116 74 132 58 C140 50 148 58 154 68 C164 86 170 106 174 124 Z', 'f2')
  + '<path class="gt" d="M62 54 c-4 14 2 24 -4 40 M132 60 c-4 14 2 26 -4 40"/>'
  + '<path d="M100 124 C96 112 104 104 98 94 C94 86 102 80 100 72" fill="none" stroke="#fffaf0" stroke-width="5" stroke-linecap="round"/>'
  + '<path d="M100 124 C96 112 104 104 98 94 C94 86 102 80 100 72" fill="none" stroke="#c9a96a" stroke-width="1.2" stroke-dasharray="3 3"/>'
  + '<path class="e" d="M24 132 C70 126 130 126 176 132"/>' + palm(46, 128, .8, .8) + palm(158, 128, .8, .8))
# 36. أول الثمر: عِذق رُطَب في النخلة (V27)
ART['thamar'] = svg(
  '<path class="g" d="M100 152 C98 120 100 92 104 64" stroke-width="7" opacity=".5"/><path class="g" d="M100 152 C98 120 100 92 104 64"/>'
  + '<path class="e" d="M104 64 C88 50 64 48 44 56 M104 64 C120 48 146 46 164 54 M104 64 C100 44 104 30 114 22 M104 64 C122 60 142 66 152 80 M104 64 C86 62 66 68 56 82"/>'
  + '<path class="g" d="M106 70 C116 78 120 88 120 96"/>'
  + date(112, 100, -10, s=.8) + date(124, 98, 15, s=.8) + date(118, 114, 0, s=.8) + date(130, 110, 20, s=.8) + date(106, 112, -15, s=.75) + date(124, 124, 5, s=.75))

for k in ('quba', 'uhud', 'awali', 'khandaq'):
    ART['madina-' + k] = madina(k)
# ——— خريطتا الحجاز ومكة (2026-11-02) ———
# الكعبة 21.4225,39.8262 · المدينة 24.4670,39.6109 (340 كم خطًّا مستقيمًا، ونحو 450 كم بالطريق) · عرفة 21.3549,39.9841 (makkahlive)
# التنعيم شمال مكة نحو 7.5 كم (هيئة تطوير مكة) · الحديبية (الشميسي) غربها 20–24 كم · وادي حنين (الشرائع) شمال شرقها 24–30 كم · الطائف 21.2703,40.4158
def proj(lat0, lon0, k, cx, cy):
    def f(lat, lon):
        return round(cx + (lon - lon0) * 111.3 * math.cos(math.radians(lat0)) * k, 1), round(cy - (lat - lat0) * 110.6 * k, 1)
    return f
def kaaba(x, y, s=1.0):
    return (f'<path d="M{x-6*s} {y-2*s} l{6*s} {-3*s} l{6*s} {3*s} v{8*s} l{-6*s} {3*s} l{-6*s} {-3*s} Z" fill="#1e1a16"/>'
            f'<path d="M{x-6*s} {y-2*s} l{6*s} {3*s} l{6*s} {-3*s} M{x} {y+1*s} v{8*s}" stroke="#3a332b" stroke-width=".8" fill="none"/>'
            f'<path d="M{x-6*s} {y+.5*s} l{6*s} {3*s} l{6*s} {-3*s}" stroke="{G}" stroke-width="1.3" fill="none"/>')
def mframe(title, W=200, H=240):
    o = f'<rect x="9" y="9" width="182" height="222" rx="10" fill="none" stroke="{G}" stroke-width="1.2"/>'
    o += ''.join(f'<path d="M{x} {y+8*sy_} v{-8*sy_} h{8*sx_}" fill="none" stroke="{G}" stroke-width="1.6" transform="translate({-sx_} {-sy_})"/>'
                 for x, y, sx_, sy_ in ((14, 14, 1, 1), (186, 14, -1, 1), (14, 226, 1, -1), (186, 226, -1, -1)))
    o += f'<g transform="translate(28 36)"><circle r="10" fill="#fffaf0" stroke="{G}" stroke-width="1"/><path d="M0 -8 L3 0 L0 -2 L-3 0 Z" fill="{E}"/><path d="M0 8 L3 0 L0 2 L-3 0 Z" fill="{G}"/></g>'
    o += f'<text x="28" y="57" {LBL} font-size="8" fill="{E}">شمال</text>'
    o += f'<text x="{W/2}" y="222" {LBL} font-size="10" fill="{G}" font-weight="700">{title}</text>'
    return o
def T(x, y, t, size=10, col=None, bold=False):
    return f'<text x="{x}" y="{y}" {LBL} font-size="{size}" font-weight="{700 if bold else 400}" fill="{col or "#7d6c47"}">{t}</text>'
def mountains(pts, op=.6):
    return ''.join(f'<path d="M{x-7} {y+4} L{x-2} {y-4} L{x+1} {y-1} L{x+4} {y-6} L{x+9} {y+4}" fill="{F2}" opacity="{op}" stroke="{G}" stroke-width=".8"/>' for x, y in pts)

def hijaz():
    P = proj(21.4225, 39.8262, .44, 118, 188)
    MK, MD, TF = P(21.4225, 39.8262), P(24.4670, 39.6109), P(21.2703, 40.4158)
    o = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">{STYLE}<rect x="3" y="3" width="194" height="234" rx="14" fill="{BG}"/>'
    o += '<defs><clipPath id="hc"><rect x="9" y="9" width="182" height="222" rx="10"/></clipPath></defs><g clip-path="url(#hc)">'
    # البحر الأحمر غربًا: الساحل تقريبي بين ينبع (24.09,38.06) وجدة (21.54,39.17) والليث
    c = [P(25.3, 37.2), P(24.09, 38.06), P(23.2, 38.6), P(22.4, 39.05), P(21.54, 39.17), P(20.9, 39.4), P(20.0, 40.0)]
    coast = 'M' + ' L'.join(f'{x} {y}' for x, y in c)
    o += f'<path d="{coast} L-20 300 L-20 -20 Z" fill="#cfe0d6" opacity=".8"/><path d="{coast}" fill="none" stroke="{E}" stroke-width="1.2" opacity=".7"/>'
    o += ''.join(f'<path d="M{x} {y} q3 -3 6 0 t6 0" fill="none" stroke="{E}" stroke-width=".8" opacity=".5"/>' for x, y in ((20, 120), (30, 150), (22, 180), (44, 196), (16, 92)))
    o += T(30, 136, 'البحر', 9, E) + T(30, 147, 'الأحمر', 9, E)
    o += mountains([(120, 70), (134, 98), (150, 126), (142, 150), (158, 168), (128, 120)], .5)
    # الطريق: خطّ مستقيم منقّط مع المسافتين
    o += f'<path d="M{MD[0]} {MD[1]+8} L{MK[0]} {MK[1]-10}" stroke="{E}" stroke-width="1.6" stroke-dasharray="2 4" stroke-linecap="round"/>'
    mid = ((MD[0]+MK[0])/2, (MD[1]+MK[1])/2)
    o += T(mid[0]+34, mid[1]-4, 'نحو 340 كم', 10, E, True) + T(mid[0]+34, mid[1]+9, 'خطًّا مستقيمًا', 7.5, '#5b4a2a') + T(mid[0]+34, mid[1]+20, 'ونحو 450 كم بالطريق', 7.5, '#5b4a2a')
    o += f'<circle cx="{MD[0]}" cy="{MD[1]}" r="14" fill="#fffaf0" opacity=".6"/>' + mosque(MD[0], MD[1], 1.1) + T(MD[0]+48, MD[1]+4, 'المدينة المنورة', 10, E, True)
    o += f'<circle cx="{MK[0]}" cy="{MK[1]}" r="14" fill="#fffaf0" opacity=".6"/>' + kaaba(MK[0], MK[1], 1.2) + T(MK[0]-30, MK[1]+4, 'مكة', 11, E, True)
    o += f'<circle cx="{TF[0]}" cy="{TF[1]}" r="2.4" fill="{G}"/>' + T(TF[0]+2, TF[1]+12, 'الطائف', 8.5)
    o += '</g>' + mframe('') + T(140, 222, 'الحجاز', 10, G, True) + '</svg>'
    return o

def makka(hi):
    on = lambda k: k == hi
    K = 2.3
    P = proj(21.4225, 39.8262, K, 84, 118)
    MK, AR = P(21.4225, 39.8262), P(21.3549, 39.9841)
    # التنعيم نحو 7.5 كم شمالًا، الحديبية نحو 22 كم غربًا، حنين نحو 27 كم شمال شرق؛ والطائف (نحو 63 كم جنوب شرق) خارج الإطار بسهم
    TN = (MK[0] - 1.2*K, MK[1] - 7.4*K)
    HD = (MK[0] - 22*K, MK[1] - 1.5*K)
    HN = (MK[0] + 22*K, MK[1] - 15*K)
    o = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">{STYLE}<rect x="3" y="3" width="194" height="234" rx="14" fill="{BG}"/>'
    o += '<defs><clipPath id="kc"><rect x="9" y="9" width="182" height="222" rx="10"/></clipPath></defs><g clip-path="url(#kc)">'
    o += mountains([(56, 70), (150, 66), (128, 172), (170, 120), (44, 168), (96, 190), (160, 196), (100, 64)], .45)
    def place(pt, name, k, ldx, ldy, dist=None, ddy=12):
        r = ''
        if on(k):
            r += f'<path d="M{MK[0]} {MK[1]} L{pt[0]} {pt[1]}" stroke="{E}" stroke-width="1.3" stroke-dasharray="1.5 3"/>'
            r += f'<circle cx="{pt[0]}" cy="{pt[1]}" r="8" fill="none" stroke="{G}" stroke-width="1.6" stroke-dasharray="2.5 2"/>'
        r += f'<circle cx="{pt[0]}" cy="{pt[1]}" r="{3 if on(k) else 2.4}" fill="{E if on(k) else G}"/>'
        r += T(pt[0]+ldx, pt[1]+ldy, name, 11.5 if on(k) else 9.5, E if on(k) else '#7d6c47', on(k))
        if on(k) and dist: r += T(pt[0]+ldx, pt[1]+ldy+ddy, dist, 8.5, E, True)
        return r
    o += place(TN, 'التنعيم', 'tanim', 0, -12, 'نحو 7 كم', -10)
    o += place(HD, 'الحديبية', 'tanim', 0, 16, 'نحو 22 كم')
    o += place(HN, 'وادي حُنين', 'hunayn', 0, -12, 'نحو 25 إلى 30 كم', -11)
    o += f'<circle cx="{AR[0]}" cy="{AR[1]}" r="2" fill="{G}"/>' + T(AR[0]+2, AR[1]+12, 'عرفة', 8.5)
    # الطائف خارج الإطار: سهم على الحافة في اتجاهها
    o += f'<path d="M{MK[0]+70} {MK[1]+22} L{MK[0]+96} {MK[1]+29}" stroke="{G}" stroke-width="1.2" stroke-dasharray="3 3"/><path d="M{MK[0]+96} {MK[1]+29} l-6 -4 l1 6 Z" fill="{G}"/>'
    o += T(MK[0]+84, MK[1]+44, 'إلى الطائف', 8.5) + T(MK[0]+84, MK[1]+55, 'نحو 65 كم', 7.5, '#6b5a36')
    o += f'<circle cx="{MK[0]}" cy="{MK[1]}" r="10" fill="#fffaf0" opacity=".6"/>' + kaaba(MK[0], MK[1], 1.0) + T(MK[0]-2, MK[1]+21, 'مكة', 11, E, True)
    o += f'<path d="M22 204 h{10*K} M22 201 v6 M{22+10*K} 201 v6" stroke="#6b5a36" stroke-width="1.2"/>' + T(22+5*K+6, 197, 'عشرة كيلومترات', 7, '#6b5a36')
    o += '</g>' + mframe('ما حول مكة') + '</svg>'
    return o
ART['hijaz'] = hijaz()
ART['makka-hunayn'] = makka('hunayn')
ART['makka-tanim'] = makka('tanim')

# ——— الدفعة الخامسة (مراجعة الصور الشاملة 2026-11-25) ———
def dates_heap(cx, base, w, h, seed):
    import random
    r = random.Random(seed); o = f'<path class="f2" d="M{cx-w} {base} Q{cx} {base-2*h} {cx+w} {base} Z"/>'
    rows = 5
    for i in range(rows):
        y = base - 4 - i*(h/rows)*1.6; half = w*(1 - i/rows) - 4
        x = cx - half
        while x < cx + half:
            o += date(round(x, 1), round(y, 1), r.choice((-70, -90, -110, 60, 80)), True, .45)
            x += 7.5
    return o
# 44. أكوام التمر (DN07)
ART['kawm'] = svg(dates_heap(64, 120, 30, 26, 1) + dates_heap(136, 120, 30, 26, 2) + dates_heap(100, 116, 38, 40, 3) + '<path class="e" d="M26 122 h148"/>')
# 45. بئرٌ ودلو (DN08، LB09)
def well(x=100, top=86, rw=34):
    o = path2(f'M{x-rw} {top} V{top+34} C{x-rw} {top+44} {x+rw} {top+44} {x+rw} {top+34} V{top} Z', 'f2')
    o += f'<ellipse class="fe" cx="{x}" cy="{top}" rx="{rw}" ry="8"/><ellipse class="g" cx="{x}" cy="{top}" rx="{rw}" ry="8"/>'
    o += f'<ellipse fill="#3d5f55" opacity=".55" cx="{x}" cy="{top+1}" rx="{rw-8}" ry="4.5"/>'
    for j, yy in enumerate((top+12, top+24)):
        off = 0 if j % 2 == 0 else 8
        o += f'<path class="gt" d="M{x-rw} {yy} C{x-rw/2} {yy+6} {x+rw/2} {yy+6} {x+rw} {yy}"/>'
        for k in range(-2, 3):
            xx = x + k*15 + off - 4
            if abs(xx-x) < rw-3: o += f'<path class="gt" d="M{xx} {yy+3} v10"/>'
    return o
def bucket_rope(x=100, y=46):
    o = f'<path class="g" d="M{x-44} {y+40} V{y-6} M{x+44} {y+40} V{y-6}"/><path class="g" d="M{x-48} {y-6} H{x+48}"/>'
    o += f'<path class="et" d="M{x} {y-6} V{y+14}"/>'
    o += path2(f'M{x-10} {y+16} h20 l-3 16 h-14 Z', 'f') + f'<path class="gt" d="M{x-10} {y+16} q10 -8 20 0"/>'
    return o
ART['bir'] = svg(well() + bucket_rope() + '<path class="e" d="M36 130 h128"/>')
# 46. كلبٌ يلهث عند بئر، وخُفٌّ يُملأ ماءً (PF09)
DOG = ('M40 118 l3 -22 c-8 -2 -14 -8 -14 -16 c6 4 10 6 16 6 c16 -4 34 -4 48 -2 c4 -6 8 -10 14 -12 '
       'c2 -6 6 -9 12 -9 c8 0 12 5 13 10 l12 4 c2 4 -2 8 -8 8 l-10 0 c-3 4 -6 8 -10 10 l-2 6 v26 h-7 l-1 -20 '
       'c-12 4 -26 4 -40 0 l-4 20 h-7 Z')
ART['kalb'] = svg(
  f'<g transform="translate(2 6) scale(.78)">{path2(DOG, "f2")}'
  f'<path class="g" d="M114 66 c-4 2 -6 8 -4 14 c4 -2 6 -6 6 -10"/><circle cx="124" cy="64" r="1.7" fill="{E}"/>'
  '<path d="M136 80 q3 8 -1 12 q-4 -5 -2 -11" fill="#d98a7a" stroke="#b45f4f" stroke-width="1"/></g>'
  + well(150, 100, 22)
  + f'<g transform="rotate(-28 118 122)">{path2("M110 104 h9 v12 c5 1 10 3 10 7 h-19 Z", "f")}</g>'
  + '<path class="e" d="M26 132 h148"/>')
# 47. فرسٌ تسوخ قوائمها في الرمل (KB07)
HORSE = ('M44 104 c-2 -16 6 -28 20 -32 c16 -4 34 -4 48 -2 c6 -10 14 -20 22 -26 l2 -8 l5 7 c6 2 10 8 10 14 '
         'l-6 4 l-10 -2 c-4 6 -8 14 -10 20 c2 8 2 14 0 22 l-2 12 h-7 l1 -14 c-12 4 -30 4 -44 0 l-4 14 h-7 l1 -14 c-8 -2 -14 -6 -19 -9 Z')
ART['faras'] = svg(
  path2(HORSE, 'f2') + f'<circle cx="138" cy="48" r="1.7" fill="{E}"/>'
  '<path class="g" d="M126 46 c-6 4 -10 10 -12 18 M44 98 c-10 2 -16 10 -18 18"/>'
  '<path class="f" d="M28 120 C52 108 70 110 92 116 C116 110 140 108 172 120 L172 136 H28 Z"/>'
  '<path class="g" d="M28 120 C52 108 70 110 92 116 C116 110 140 108 172 120"/>'
  '<path class="gt" d="M44 128 q10 -4 20 0 M100 126 q10 -4 20 0 M140 130 q8 -3 16 0"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="1.4" fill="{G}"/>' for x, y in ((58, 110), (64, 106), (112, 108), (118, 104))))
# 48. المسجد النبوي الأول: جدران من اللَّبِن، وعُمُد من جذوع النخل، وسقف من الجريد (KN36)
def frond(x, y, L, a):
    return (f'<g transform="rotate({a} {x} {y})"><path class="et" d="M{x} {y} h{L}"/>'
            + ''.join(f'<path class="et" d="M{x+i} {y} l3 -4 M{x+i} {y} l3 4"/>' for i in range(4, L-2, 5)) + '</g>')
def _masjid():
    o = ''
    # الجدار الخلفي من اللبن
    for r in range(4):
        y = 64 + r*9; off = 0 if r % 2 == 0 else 7
        x = 40 - off
        while x < 160:
            a, b = max(x, 40), min(x + 14, 160)
            o += f'<rect class="{"f2" if (r+int(x))%3==0 else "f"}" x="{a+.7}" y="{y+.7}" width="{b-a-1.4}" height="7.6" rx="1" stroke="{G}" stroke-width=".8"/>'
            x += 14
    o += '<path class="g" d="M40 64 V100 H160 V64"/>'
    # السقف من الجريد فوق العُمُد
    o += f'<path class="f" d="M30 52 H170 V60 H30 Z"/><path class="g" d="M30 52 H170 V60 H30 Z"/>'
    o += ''.join(frond(x, 52, 22, -6 if i % 2 else 6) for i, x in enumerate(range(30, 160, 16)))
    # العُمُد: جذوع النخل
    for x in (50, 82, 118, 150):
        o += path2(f'M{x-4} 60 H{x+4} V124 H{x-4} Z', 'f2')
        o += ''.join(f'<path class="gt" d="M{x-4} {y} l8 -3"/>' for y in range(68, 122, 8))
    o += '<path class="e" d="M26 126 h148"/>'
    return svg(o)
ART['masjid'] = _masjid()
# 49. اللَّبِن: الطوب من الطين (I03)
def _labin():
    o = ''
    for r, (n, x0) in enumerate(((5, 50), (4, 59), (3, 68), (2, 77))):
        y = 112 - r*14
        for i in range(n):
            x = x0 + i*20
            o += path2(f'M{x} {y} h18 v12 h-18 Z', 'f2' if (r+i) % 2 else 'f')
            o += f'<path class="gt" d="M{x+2} {y+4} h5 M{x+10} {y+8} h5"/>'
    o += '<path class="e" d="M34 125 h132"/>'
    o += path2('M140 92 C150 86 162 90 164 100 C166 110 154 116 144 112 C136 108 134 98 140 92 Z', 'f2') + '<path class="gt" d="M146 98 c4 -2 10 0 12 4"/>'
    return svg(o)
ART['labin'] = _labin()
# 50. الزُّبد والتمر (SH07)
ART['zubd'] = svg(
  path2('M30 92 C32 120 100 120 102 92 Z', 'w')
  + '<ellipse class="w" cx="66" cy="92" rx="36" ry="8"/><ellipse class="g" cx="66" cy="92" rx="36" ry="8"/>'
  + '<path fill="#f7e7a8" stroke="#b8923f" stroke-width="1.2" d="M46 90 C50 76 62 72 68 78 C74 70 88 76 86 90 Z"/>'
  + '<path d="M58 82 q4 -3 8 0" stroke="#fffaf0" stroke-width="2" fill="none" stroke-linecap="round"/>'
  + '<ellipse class="w" cx="136" cy="108" rx="34" ry="9"/><ellipse class="g" cx="136" cy="108" rx="34" ry="9"/>'
  + date(122, 98, -70, True, .8) + date(138, 96, -100, True, .8) + date(152, 100, -60, True, .8) + date(132, 86, -85, True, .75)
  + '<path class="e" d="M26 122 h148"/>')
# 51. الإثمد: حجر الكحل الأسود، ومعه المِكحلة والمِرود (LB12)
ART['ithmid'] = svg(
  '<path fill="#2e2a26" stroke="#b8923f" stroke-width="1.4" d="M44 112 l8 -16 l14 -4 l10 10 l-4 12 Z"/>'
  '<path fill="#3a3430" stroke="#b8923f" stroke-width="1.4" d="M70 116 l6 -12 l12 0 l6 10 l-6 6 Z"/>'
  '<path d="M54 100 l6 -2 M78 108 l5 0" stroke="#8c8277" stroke-width="1.2"/>'
  + path2('M118 70 h16 v6 c10 4 16 14 16 26 c0 14 -10 22 -24 22 c-14 0 -24 -8 -24 -22 c0 -12 6 -22 16 -26 Z', 'f')
  + '<path class="e" d="M114 70 h24"/><path class="gt" d="M108 98 h36"/>'
  + '<path class="g" d="M150 40 L128 76"/><circle cx="150" cy="40" r="3" class="f2"/><circle class="gt" cx="150" cy="40" r="3"/>'
  + '<path class="e" d="M34 126 h132"/>')
# 52. خُفّان من جلدٍ أسود (LB06)
BOOT = 'M0 0 h18 v30 c0 6 4 8 12 10 c10 2 14 6 14 12 h-44 Z'
ART['khuff'] = svg(''.join(
  f'<g transform="translate({x} {y})"><path fill="#2f2a25" d="{BOOT}"/><path stroke="{G}" stroke-width="2" fill="none" stroke-linejoin="round" d="{BOOT}"/>'
  f'<path d="M0 6 h18" stroke="{G}" stroke-width="1.2"/><path d="M4 52 v-4 M14 52 v-4" stroke="#8c8277" stroke-width="1"/></g>'
  for x, y in ((52, 62), (100, 68))) + '<path class="e" d="M34 122 h132"/>')
# 53. كسوف الشمس (KN20)
ART['kusuf'] = svg(
  ''.join(f'<path class="g" d="M{100+38*math.cos(math.radians(a)):.1f} {78+38*math.sin(math.radians(a)):.1f} L{100+52*math.cos(math.radians(a)):.1f} {78+52*math.sin(math.radians(a)):.1f}"/>' for a in range(0, 360, 30))
  + '<circle cx="100" cy="78" r="30" fill="#f2d98a" stroke="#b8923f" stroke-width="2.2"/>'
  + '<circle cx="112" cy="74" r="29" fill="#2c3a36" stroke="#0f5c4d" stroke-width="1.6"/>')
# 54. شجرتان في وادٍ (DN09)
def tree(x, y, s=1.0):
    return (f'<path class="g" d="M{x} {y} q{2*s} {-18*s} 0 {-30*s}"/>'
            + ''.join(f'<ellipse class="fe" cx="{x+dx*s}" cy="{y-30*s+dy*s}" rx="{r*s}" ry="{r*.8*s}"/><ellipse class="et" cx="{x+dx*s}" cy="{y-30*s+dy*s}" rx="{r*s}" ry="{r*.8*s}"/>'
                      for dx, dy, r in ((-10, 2, 11), (10, 2, 11), (0, -8, 13))))
ART['shajar'] = svg(
  mountains([(40, 92), (54, 86), (150, 90), (164, 94)], .7)
  + '<path class="f" d="M30 122 C60 110 80 108 100 112 C120 108 140 110 170 122 Z"/><path class="g" d="M30 122 C60 110 80 108 100 112 C120 108 140 110 170 122"/>'
  + tree(78, 114, 1.15) + tree(124, 114, 1.15))

# 44. أكوام التمر: عراجين من التمر بعضها فوق بعض (DN07، طلب المستخدم: «أظهر العراجين»)
def irjun(x, y, s=1.0, seed=0, lean=0):
    import random
    r = random.Random(seed)
    o = f'<g transform="translate({x} {y}) rotate({lean}) scale({s})">'
    o += '<path d="M0 -56 C-2 -46 2 -40 0 -32" fill="none" stroke="#a07a35" stroke-width="4" stroke-linecap="round"/>'
    o += ''.join(f'<path d="M0 -34 Q{dx*.5} -26 {dx} {dy}" fill="none" stroke="#b08a45" stroke-width="1"/>' for dx, dy in ((-16, -6), (-8, 0), (0, 2), (8, 0), (16, -6)))
    for row, (n, yy) in enumerate(((3, -26), (4, -16), (5, -6), (4, 4))):
        for k in range(n):
            xx = (k - (n-1)/2) * 8.4 + r.uniform(-1, 1)
            o += date(round(xx, 1), round(yy + r.uniform(-1, 1), 1), r.choice((-12, 0, 12)), False, .55)
    return o + '</g>'
ART['kawm'] = svg(irjun(62, 112, .95, 1, -10) + irjun(138, 112, .95, 2, 10) + irjun(100, 108, 1.1, 3) + '<path class="e" d="M34 124 h132"/>')
# 47. الفرس: شكل الفرس كاملًا، وقوائمه تسوخ في الرمل إلى الركب (KB07، طلب المستخدم)
def horse():
    o = ''
    for x0, x1 in ((62, 66), (74, 76), (124, 128), (136, 138)):
        o += f'<path d="M{x0} 96 L{x1} 120" stroke="{G}" stroke-width="9" stroke-linecap="round"/><path d="M{x0} 96 L{x1} 120" stroke="{F2}" stroke-width="5.5" stroke-linecap="round"/>'
    o += path2('M54 86 C54 70 70 64 92 64 C112 64 126 62 134 60 C142 58 146 66 146 76 C146 92 132 100 112 100 C94 102 74 102 64 98 C58 96 54 92 54 86 Z', 'f2')
    o += path2('M132 64 C136 52 142 40 150 32 L160 40 C154 48 150 58 146 74 Z', 'f2')
    o += path2('M148 30 C154 24 164 24 170 30 L178 44 C180 48 176 52 172 50 L160 46 C154 44 150 38 148 30 Z', 'f2')
    o += f'<path class="g" d="M150 28 l-2 -8 l6 5 M156 26 l2 -8 l3 8"/><circle cx="163" cy="34" r="1.8" fill="{E}"/><path class="gt" d="M174 44 l3 1"/>'
    o += '<path class="e" d="M146 30 C140 36 136 46 132 58 M150 30 C142 40 140 50 136 60"/>'
    o += '<path class="g" d="M56 80 C44 84 40 96 44 110 C46 100 50 92 56 88"/>'
    return o
ART['faras'] = svg(horse()
  + '<path class="f" d="M30 112 C56 106 80 108 100 112 C124 106 148 106 172 112 L172 136 H30 Z"/>'
  + '<path class="g" d="M30 112 C56 106 80 108 100 112 C124 106 148 106 172 112"/>'
  + ''.join(f'<path class="gt" d="M{x-7} {112} q7 -5 14 0"/>' for x in (64, 75, 126, 137))
  + '<path class="gt" d="M44 124 q10 -4 20 0 M100 126 q10 -4 20 0 M140 130 q8 -3 16 0"/>')
# 46. كلبٌ يلهث عند بئر، وخُفّ (PF09، طلب المستخدم: الساقان الخلفيتان واضحتان)
def dog(x0=0, y0=0, s=1.0):
    o = ''
    for a, b in ((52, 50), (62, 62), (98, 100), (108, 110)):
        o += f'<path d="M{a} 92 L{b} 120" stroke="{G}" stroke-width="7" stroke-linecap="round"/><path d="M{a} 92 L{b} 120" stroke="{F2}" stroke-width="4" stroke-linecap="round"/>'
    o += path2('M46 86 C46 74 60 70 80 70 C96 70 108 70 112 74 C118 80 116 92 108 96 C96 100 66 100 54 96 C48 94 46 90 46 86 Z', 'f2')
    o += path2('M106 74 C110 64 114 58 120 54 L128 62 C124 66 120 72 116 82 Z', 'f2')
    o += path2('M118 50 C124 44 134 46 136 52 L148 56 C150 60 148 64 142 64 L132 64 C126 66 120 62 118 56 Z', 'f2')
    o += path2('M120 50 C116 52 114 60 116 66 C120 62 122 56 122 52 Z', 'f')
    o += f'<circle cx="130" cy="53" r="1.6" fill="{E}"/><circle cx="148" cy="58" r="1.4" fill="{E}"/>'
    o += '<path d="M140 64 q2 8 -2 11 q-4 -4 -2 -10" fill="#d98a7a" stroke="#b45f4f" stroke-width="1"/>'
    o += '<path class="g" d="M48 80 C40 74 38 64 42 56"/>'
    return f'<g transform="translate({x0} {y0}) scale({s})">{o}</g>'
ART['kalb'] = svg(dog(-14, 14, .9) + well(152, 98, 22)
  + f'<g transform="rotate(-20 128 124)">{path2("M120 106 h9 v12 c5 1 10 3 10 7 h-19 Z", "f")}</g>'
  + '<path class="e" d="M26 132 h148"/>')
# 54. شجرتان في وادٍ: شجر سَمُر بجذع وأغصان وتاج مسطّح (DN09، طلب المستخدم)
def acacia(x, y, s=1.0):
    t = (f'<path class="g" d="M{x} {y} C{x} {y-14*s} {x-2*s} {y-22*s} {x-12*s} {y-32*s} M{x} {y-14*s} C{x+4*s} {y-22*s} {x+10*s} {y-28*s} {x+16*s} {y-32*s} '
         f'M{x-1*s} {y-20*s} C{x} {y-26*s} {x+1*s} {y-30*s} {x} {y-34*s}"/>')
    crown = (f'M{x-30*s} {y-32*s} C{x-28*s} {y-42*s} {x-14*s} {y-46*s} {x-4*s} {y-44*s} C{x+4*s} {y-50*s} {x+20*s} {y-48*s} {x+26*s} {y-40*s} '
             f'C{x+34*s} {y-38*s} {x+34*s} {y-30*s} {x+24*s} {y-30*s} C{x+10*s} {y-28*s} {x-10*s} {y-28*s} {x-24*s} {y-30*s} C{x-32*s} {y-30*s} {x-34*s} {y-30*s} {x-30*s} {y-32*s} Z')
    leaves = ''.join(f'<path class="et" d="M{x+dx*s} {y-36*s} q3 -3 6 0"/>' for dx in (-22, -12, -2, 8, 18))
    return t + path2(crown, 'fe', 'e') + leaves
ART['shajar'] = svg(
  mountains([(40, 92), (54, 86), (150, 90), (164, 94)], .7)
  + '<path class="f" d="M30 122 C60 110 80 108 100 112 C120 108 140 110 170 122 Z"/><path class="g" d="M30 122 C60 110 80 108 100 112 C120 108 140 110 170 122"/>'
  + acacia(66, 118, 1.25) + acacia(136, 118, 1.25))

# 55. غار حراء وغار ثور حول مكة (KN21 KN23 KN32 I01). الإحداثيات (ويكيبيديا): الكعبة 21.4225,39.8262 · جبل النور 21.4580,39.8611 · غار ثور 21.3772,39.8497
def ghar(hi):
    K = 11
    P = proj(21.4225, 39.8262, K, 86, 112)
    MK, HR, TH = P(21.4225, 39.8262), P(21.4580, 39.8611), P(21.3772, 39.8497)
    o = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">{STYLE}<rect x="3" y="3" width="194" height="234" rx="14" fill="{BG}"/>'
    o += '<defs><clipPath id="gc"><rect x="9" y="9" width="182" height="222" rx="10"/></clipPath></defs><g clip-path="url(#gc)">'
    o += mountains([(40, 80), (60, 170), (150, 150), (40, 130), (170, 96), (120, 196)], .4)
    def cave(pt, name, k, dist, ly):
        on = k == hi
        r = f'<path d="M{pt[0]-16} {pt[1]+8} L{pt[0]-4} {pt[1]-10} L{pt[0]+2} {pt[1]-4} L{pt[0]+8} {pt[1]-12} L{pt[0]+18} {pt[1]+8} Z" fill="{F2}" stroke="{G}" stroke-width="1.2"/>'
        r += f'<path d="M{pt[0]-2} {pt[1]+8} a3.5 4 0 0 1 7 0 Z" fill="#3a332b"/>'
        if on:
            r += f'<path d="M{MK[0]} {MK[1]} L{pt[0]} {pt[1]}" stroke="{E}" stroke-width="1.3" stroke-dasharray="1.5 3"/>'
            r += f'<circle cx="{pt[0]+1}" cy="{pt[1]}" r="21" fill="none" stroke="{G}" stroke-width="1.6" stroke-dasharray="2.5 2"/>'
        r += T(pt[0]+1, pt[1]+ly, name, 11.5 if on else 9.5, E if on else '#7d6c47', on)
        if on: r += T(pt[0]+1, pt[1]+ly+(12 if ly > 0 else -12), dist, 8.5, E, True)
        return r
    o += cave(HR, 'غار حراء', 'hira', 'نحو 5 كم', -26)
    o += cave(TH, 'غار ثور', 'thawr', 'نحو 6 كم', -26)
    o += f'<circle cx="{MK[0]}" cy="{MK[1]}" r="10" fill="#fffaf0" opacity=".6"/>' + kaaba(MK[0], MK[1], 1.0) + T(MK[0]-20, MK[1]+4, 'مكة', 11, E, True)
    o += f'<path d="M24 204 h{K} M24 201 v6 M{24+K} 201 v6" stroke="#6b5a36" stroke-width="1.2"/>' + T(24+K/2+20, 207, 'كيلومتر واحد', 7, '#6b5a36')
    o += '</g>' + mframe('حول مكة، خطًّا مستقيمًا تقريبًا') + '</svg>'
    return o
ART['ghar-hira'] = ghar('hira')
ART['ghar-thawr'] = ghar('thawr')

MAPS = {
  'C07': ('madina-quba', 'مسجد قُباء: جنوب المسجد النبوي، على نحو 3 كم'),
  'W07': ('madina-awali', 'عوالي المدينة: قرى ومزارع في جنوبها الشرقي، أدناها على ميلين أو ثلاثة؛ نحو 4 إلى 6 كم'),
  'C47': ('madina-uhud', 'جبل أُحد: شمال المسجد النبوي على نحو 4 كم، وطوله نحو 7 كم'),
  'U20': ('madina-uhud', 'جبل أُحد: شمال المسجد النبوي على نحو 4 كم، وعند سفحه شهداء أُحد'),
  'C37': ('madina-khandaq', 'موضع الخندق تقريبًا: شمال المدينة، وجبل سَلْع خلف المسلمين'),
  'O07': ('hijaz', 'مكة والمدينة: بينهما نحو 340 كم خطًّا مستقيمًا، ونحو 450 كم بالطريق'),
  'O08': ('hijaz', 'مكة والمدينة: بينهما نحو 340 كم خطًّا مستقيمًا، ونحو 450 كم بالطريق'),
  'R01': ('makka-hunayn', 'وادي حُنين: بين مكة والطائف، شمال شرق مكة على نحو 25 إلى 30 كم'),
  'O01': ('makka-tanim', 'التنعيم: شمال مكة على نحو 7 كم، والحديبية غربها على نحو 22 كم'),
  # مراجعة الصور 2026-11-25
  'HB50': ('madina-uhud', 'جبل أُحد: شمال المسجد النبوي على نحو 4 كم'),
  'KB12': ('madina-uhud', 'جبل أُحد: شمال المسجد النبوي على نحو 4 كم'),
  'HB48': ('madina-quba', 'قُباء: جنوب المسجد النبوي على نحو 3 كم'),
  'KN35': ('madina-quba', 'قُباء: جنوب المسجد النبوي على نحو 3 كم، وفيها بنو عمرو بن عوف'),
  'KN21': ('ghar-hira', 'غار حراء: في جبل النور، شمال شرق مكة على نحو 5 كم'),
  'KN23': ('ghar-hira', 'غار حراء: في جبل النور، شمال شرق مكة على نحو 5 كم'),
  'KN32': ('ghar-thawr', 'غار ثور: في جبل ثور، جنوب مكة على نحو 6 كم'),
  'I01': ('ghar-thawr', 'غار ثور: في جبل ثور، جنوب مكة على نحو 6 كم'),
}

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
  # الدفعة الثانية
  'U10': ('labina', 'بيتٌ حسنٌ جميل، ينقصه موضع لبنة واحدة في زاويته'),
  'R02': ('ghanam', 'غنمٌ تملأ ما بين جبلين'),
  'C47': ('uhud', 'جبل أُحد، شمال المدينة المنورة'),
  'X13': ('himar', 'الحمار'),
  'E04': ('rayhan', 'الريحان: نبتةٌ طيبة الرائحة'),
  'C23': ('sahfa', 'صحفةٌ مكسورة: الصحفة إناءٌ واسع للطعام'),
  'B03': ('shuruq', 'طلوع الشمس'),
  'X21': ('qadah', 'قدحٌ من لبن'),
  'C44': ('dir', 'درعٌ من حلقات الحديد، وصاعٌ من شعير'),
  'D09': ('bair', 'بعيرٌ هزيل: لحق ظهره ببطنه من الجوع'),
  'C33': ('naqa2', 'ناقةٌ وولدها'),
  'S04': ('dhanub', 'الذَّنوب: الدلو العظيمة المملوءة ماءً'),
  'X10': ('khall', 'الخلّ والخبز'),
  'W12': ('miswak', 'السِّواك: عودٌ من شجر الأراك تُنظَّف به الأسنان'),
  'E06': ('shah', 'الشاة'),
  'L02': ('naal', 'نعلان: والنهي عن المشي في واحدة منهما'),
  'P05': ('nughayr', 'النُّغَير: طائرٌ صغير كالعصفور'),
  'G01': ('mirjal', 'المِرجل: القِدر إذا غلت فسُمع لها أزيز'),
  'C27': ('nar', 'نارٌ يتهافت فيها الفَراش'),
  'C42': ('shib', 'وادٍ وشِعب: والشِّعب طريقٌ بين جبلين'),
  'V27': ('thamar', 'أول الثمر: باكورة الرُّطَب في النخل'),
  'V09': ('naqa', 'الراحلة: الناقة يُسافَر عليها'),
  'N05': ('shah', 'الشاة'),
  'X08': ('qadah', 'القدح: إناء الشرب'),
  'B16': ('tamr', 'التمر: والتحنيك أن تُمضغ التمرة ويوضع منها في فم المولود'),
  'C10': ('naal', 'نعلان لكلٍّ منهما قِبالان: سيران بين الأصابع إلى الشِّراك'),
  'B19': ('shah', 'الشاة'),
  'C41': ('shah', 'الشاة'),
  'R06': ('naqa', 'الجمل'),
  'O03': ('naqa', 'البعير'),
  'W04': ('naqa', 'البعير'),
  # مراجعة الصور 2026-11-25: رسوم موجودة
  'HB20': ('tamr', 'تمرات'), 'AD05': ('tamr', 'تمرات'), 'AD09': ('tamr', 'تمرات'),
  'UM03': ('kabsh', 'كبش أقرن'), 'KB21': ('naqa', 'الجمل'), 'KN12': ('ghanam', 'غنمٌ ترعى بين الجبال'),
  'PF11': ('himar', 'الحمار'), 'PF05': ('dir', 'درعٌ من حلقات الحديد'), 'KB04': ('qadah', 'قدحٌ من لبن'),
  'DN05': ('khubz', 'أقراص خبز الشعير'), 'DN06': ('mirjal', 'القِدر'), 'PF10': ('tair', 'طائر'),
  'DN04': ('matar', 'المطر'), 'HB19': ('jidh', 'المنبر ذو الدرجات الثلاث'), 'KB23': ('jidh', 'المنبر ذو الدرجات الثلاث'),
  'LB05': ('jidh', 'المنبر ذو الدرجات الثلاث'),
  # رسوم جديدة أقرّها المستخدم 2026-11-25
  'DN07': ('kawm', 'عراجين التمر'),
  'PF09': ('kalb', 'كلبٌ يلهث عند بئر، وخُفٌّ يُملأ ماءً'),
  'KB07': ('faras', 'فرسٌ تسوخ قوائمها في الرمل'),
  'DN08': ('bir', 'بئرٌ ودلو'),
  'LB09': ('bir', 'بئر: والخاتم وقع في بئر أريس بالمدينة'),
  'KN36': ('masjid', 'المسجد النبوي الأول: جدرانٌ من اللَّبِن، وعُمُدٌ من جذوع النخل، وسقفٌ من الجريد'),
  'I03': ('labin', 'اللَّبِن: الطوب من الطين يُنقل لبناء المسجد'),
  'SH07': ('zubd', 'الزُّبد والتمر'),
  'LB12': ('ithmid', 'الإثمد: حجر الكحل الأسود، ومعه المِكحلة'),
  'LB06': ('khuff', 'خُفّان من جلدٍ أسود'),
  'KN20': ('kusuf', 'كسوف الشمس'),
}
# رسوم جديدة تنتظر رؤية المستخدم قبل ربطها بالبطاقات (2026-11-25)
PENDING = {
  'DN09': ('shajar', 'شجرتان في وادٍ'),
}
out_dir = os.path.join(root, 'public/art'); os.makedirs(out_dir, exist_ok=True)
for k, v in ART.items():
    open(os.path.join(out_dir, k + '.svg'), 'w').write(v)
import time
json.dump({'version': int(time.time()), 'cards': {c: {'art': a, 'caption': t} for c, (a, t) in MAP.items()},
           'maps': {c: {'art': a, 'caption': t} for c, (a, t) in MAPS.items()}},
          open(os.path.join(root, 'public/art.json'), 'w'), ensure_ascii=False, indent=0)
print(len(ART), 'drawings,', len(MAP), 'cards')

# علامة «pic» في cards.json لكل بطاقة لها رسم أو خريطة: بها يأتي «يوم الصورة» كل ثلاثة أيام (cardFor في notify.ts)
# دون انتظار تحميل art.json، فلا يختلف الإشعار عن البطاقة في التطبيق. يُرفع version فقط إن تغيّر شيء.
pics = set(MAP) | set(MAPS)
for path in ('public/cards.json', 'data/cards.json'):
    full = os.path.join(root, path)
    d = json.load(open(full))
    changed = False
    for c in d['cards']:
        want = c['id'] in pics
        if bool(c.get('pic')) != want:
            changed = True
            if want: c['pic'] = True
            else: c.pop('pic', None)
    if changed:
        if path.startswith('public'): bump = d['version'] + 1
        d['version'] = bump
        out = json.dumps(d, ensure_ascii=False, indent=1)
        out = out.replace('{\n "version": %d,\n "app": "%s",' % (d['version'], d['app']), '{\n "version": %d, "app": "%s",' % (d['version'], d['app']), 1)
        open(full, 'w').write(out)
        print(path, 'pic marks updated, version', d['version'])
