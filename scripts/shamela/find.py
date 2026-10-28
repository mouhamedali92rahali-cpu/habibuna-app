import re,sys
sys.path.insert(0,__import__('os').path.dirname(__file__))
from sh import page,a2l,strip
PAT={'1711':r'\[\s*([٠-٩0-9]+)\s*\]','1673':r'(?:^|\n)\s*([٠-٩]{1,4})\s*-\s*(?!باب)'}
HI={'1711':4086,'1673':7990,'21662':4700}
PAT['21662']=PAT['1711']
def nums(book,pid):
  return [int(a2l(x)) for x in re.findall(PAT[book],strip(page(book,pid)[2]))]
def probe(book,pid):
  # look forward up to 15 pages for a number
  for d in range(15):
    n=nums(book,pid+d)
    if n: return max(n)
  return None
def find(book,target,lo=1,hi=None):
  hi=hi or HI[book]
  while hi-lo>3:
    mid=(lo+hi)//2; v=probe(book,mid)
    if v is None or v>target: hi=mid
    else: lo=mid
  # linear scan
  for p in range(max(1,lo-3),lo+40):
    if target in nums(book,p): return p
  return None
if __name__=='__main__':
  book=sys.argv[1]
  for t in sys.argv[2:]:
    p=find(book,int(t)); print(t,'->',p, page(book,p)[:2] if p else '')
