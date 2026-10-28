import re,sys
sys.path.insert(0,__import__('os').path.dirname(__file__))
from sh import raw
def crumb(book,pid):
  t=raw(book,pid); i=t.find('فهرس الكتاب'); seg=t[i:i+3000]; seg=seg[:seg.find('nomargin')]
  return ' ‹ '.join(re.findall(r'<span class="text-black">([^<]+)</span>',seg))
if __name__=='__main__':
  for p in sys.argv[2:]: print(p,crumb(sys.argv[1],int(p)))
