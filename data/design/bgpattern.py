# نقش الخلفية البارز (نجوم وسداسيات بيضاء) على مثال صورة القوس التي أرسلها المستخدم 2026-11-25
import math,urllib.parse
d=26; h=d*math.sqrt(3)/2; W=3*d; H=2*h
def hexa(cx,cy,R):
    return [(cx+R*math.cos(math.radians(30+60*k)),cy+R*math.sin(math.radians(30+60*k))) for k in range(6)]
def star(cx,cy,R,r):
    pts=[]
    for k in range(12):
        rr=R if k%2==0 else r; a=math.radians(30*k)
        pts.append((cx+rr*math.cos(a),cy+rr*math.sin(a)))
    return pts
cells=[]
for i in range(-3,7):
    for j in range(-3,5):
        x=i*d+j*d/2; y=j*h
        if -d<x<W+d and -d<y<H+d:
            c=(i-j)%3
            cells.append(star(x,y,13.8,7.97) if c==0 else hexa(x,y,11.3))
def path(pts,dx=0,dy=0): return 'M'+' L'.join(f'{x+dx:.2f},{y+dy:.2f}' for x,y in pts)+'Z'
def svg(strip,cell,dark,light):
    g=''.join(f"<path d='{path(p)}' fill='{cell}'/>" for p in cells)
    sh=''.join(f"<path d='{path(p,0.9,1.1)}'/>" for p in cells)
    hi=''.join(f"<path d='{path(p,-0.7,-0.8)}'/>" for p in cells)
    return (f"<svg xmlns='http://www.w3.org/2000/svg' width='{W:.2f}' height='{H:.2f}' viewBox='0 0 {W:.2f} {H:.2f}'>"
            f"<rect width='100%' height='100%' fill='{strip}'/>{g}"
            f"<g fill='none' stroke='{light}' stroke-width='1.1' stroke-linejoin='round'>{sh}</g>"
            f"<g fill='none' stroke='{dark}' stroke-width='1.1' stroke-linejoin='round'>{hi}</g></svg>")
def uri(s): return 'url("data:image/svg+xml,'+urllib.parse.quote(s,safe="/:=' ,")+'")'
LIGHT=svg('#f7f6f9','#eeedf1','#d3d1db','#ffffff')
DARK=svg('#141a30','#10152a','#0a0e1e','#232a48')
if __name__=='__main__':
    open('data/design/bg_light.svg','w').write(LIGHT); print(len(uri(LIGHT)),W,H)
