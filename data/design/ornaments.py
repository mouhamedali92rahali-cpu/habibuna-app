import math,urllib.parse,re,sys
SP='/tmp/claude-0/-home-user-habibuna-app/b6e33c15-4131-558d-b740-084f577fe445/scratchpad'
def P(r,a): return 20+r*math.cos(math.radians(a)),20+r*math.sin(math.radians(a))
def g(inner,w='.8'): return f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><g fill='none' stroke='#ffffff' stroke-opacity='.17' stroke-width='{w}' stroke-linejoin='round'>"+inner+"</g></svg>"
def khatam(R):
    pts=[]
    for k in range(8):
        pts.append(P(R,k*45-90)); pts.append(P(R*math.cos(math.radians(45))/math.cos(math.radians(22.5)),k*45-67.5))
    return "<polygon points='"+' '.join(f'{x:.2f},{y:.2f}' for x,y in pts)+"'/>"
S1=khatam(18)
pet=''
for k in range(12):
    a=k*30-90
    x1,y1=P(2,a); x2,y2=P(18,a)
    pet+=f"<path d='M{x1:.2f},{y1:.2f} A9.5 9.5 0 0 1 {x2:.2f},{y2:.2f} A9.5 9.5 0 0 1 {x1:.2f},{y1:.2f}'/>"
lines=''.join(f"<line x1='{P(6,a)[0]:.2f}' y1='{P(6,a)[1]:.2f}' x2='{P(18,a)[0]:.2f}' y2='{P(18,a)[1]:.2f}'/>" for a in range(0,360,90))
S2=pet+lines+"<circle cx='20' cy='20' r='3' fill='#ffffff' fill-opacity='.17'/>"
D,s=float(sys.argv[1]) if len(sys.argv)>1 else 9.5, float(sys.argv[2]) if len(sys.argv)>2 else 9
sq=''
for k in range(8):
    cx,cy=P(D,k*45-90)
    sq+=f"<rect x='{cx-s/2:.2f}' y='{cy-s/2:.2f}' width='{s}' height='{s}' transform='rotate({k*45+45} {cx:.2f} {cy:.2f})'/>"
oc="<polygon points='"+' '.join(f'{P(6.8,k*45-67.5)[0]:.2f},{P(6.8,k*45-67.5)[1]:.2f}' for k in range(8))+"'/>"
S3=sq+oc
base=open('data/design/mock7.html').read()
old=re.search(r"background:url\(\"data:image/svg\+xml,[^\"]*\"\) center/contain no-repeat",base).group(0)
blk=[]
for n,svg in [('1',S1),('2',S2),('3',S3)]:
    u="background:url(\"data:image/svg+xml,"+urllib.parse.quote(g(svg),safe="/:=' ")+"\") center/contain no-repeat"
    open(f'data/design/mock9-{n}.html','w').write(base.replace(old,u))
    blk.append(g(svg,'1').replace("viewBox='0 0 40 40'","viewBox='-3 -3 46 46'").replace("#ffffff' stroke-opacity='.17'","#000' stroke-opacity='1'").replace("fill='#ffffff' fill-opacity='.17'","fill='#000'").replace("viewBox","width='300' height='300' viewBox"))
open(SP+'/o.html','w').write("<body style='margin:0;background:#fff;display:flex;gap:10px;padding:20px'>"+''.join(blk)+"</body>")
