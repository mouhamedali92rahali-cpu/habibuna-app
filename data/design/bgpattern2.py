# نقش الخلفية بعد ملاحظة المستخدم 2026-11-25 («الخلفية كارثية»): أكبر وأنعم بكثير، بظلال ضبابية خفيفة
import math,urllib.parse
def build(d=40,star=(21.2,12.25),hexr=17.4,strip='#f9f9fb',cell='#f5f5f8',sh='#000',sho=.07,blur=.9,hi=True):
    h=d*math.sqrt(3)/2; W=3*d; H=2*h
    def hexa(cx,cy,R): return [(cx+R*math.cos(math.radians(30+60*k)),cy+R*math.sin(math.radians(30+60*k))) for k in range(6)]
    def st(cx,cy,R,r): return [(cx+(R if k%2==0 else r)*math.cos(math.radians(30*k)),cy+(R if k%2==0 else r)*math.sin(math.radians(30*k))) for k in range(12)]
    cells=[]
    for i in range(-3,7):
        for j in range(-3,5):
            x=i*d+j*d/2; y=j*h
            if -d<x<W+d and -d<y<H+d: cells.append(st(x,y,*star) if (i-j)%3==0 else hexa(x,y,hexr))
    P=lambda pts,dx=0,dy=0:'M'+' L'.join(f'{x+dx:.1f},{y+dy:.1f}' for x,y in pts)+'Z'
    f=f"<defs><filter id='b' x='-10%' y='-10%' width='120%' height='120%'><feGaussianBlur stdDeviation='{blur}'/></filter></defs>"
    g=''.join(f"<path d='{P(p)}' fill='{cell}'/>" for p in cells)
    s=''.join(f"<path d='{P(p,0.9,1.2)}'/>" for p in cells)
    w=''.join(f"<path d='{P(p,-0.8,-0.9)}'/>" for p in cells) if hi else ''
    svg=(f"<svg xmlns='http://www.w3.org/2000/svg' width='{W:.1f}' height='{H:.1f}' viewBox='0 0 {W:.1f} {H:.1f}'>{f}<rect width='100%' height='100%' fill='{strip}'/>{g}"
         f"<g fill='none' stroke='#ffffff' stroke-width='1.6' filter='url(#b)'>{s}</g>"
         f"<g fill='none' stroke='{sh}' stroke-opacity='{sho}' stroke-width='1.6' filter='url(#b)'>{w}</g></svg>")
    return 'url("data:image/svg+xml,'+urllib.parse.quote(svg,safe="/:=' ,")+'")', W, H
