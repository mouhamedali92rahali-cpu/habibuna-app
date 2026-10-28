# usage: grab.py book startpid npages phrase [chars]
import sys; sys.path.insert(0,__import__('os').path.dirname(__file__))
from sh import page,strip
from crumb import crumb
book,s,n,ph=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]; L=int(sys.argv[5]) if len(sys.argv)>5 else 2500
for p in range(s,s+n):
  pt,pg,t=page(book,p); t=strip(t); i=t.find(ph)
  if i>=0:
    print(f'### id {p} ج{pt} ص{pg} | {crumb(book,p)}')
    rest=t[i:i+L]
    if len(rest)<L and p+1<s+n+3:
      pt2,pg2,t2=page(book,p+1); rest+=f'\n<<ج{pt2} ص{pg2}>>\n'+strip(t2)[:L-len(rest)]
    print(rest); break
else: print('NOT FOUND')
