import re,html,os,sys,json,subprocess,time
C=os.environ.get('SHAMELA_CACHE',os.path.join(os.path.dirname(__file__),'.cache')); os.makedirs(C,exist_ok=True)
AR='٠١٢٣٤٥٦٧٨٩'
def a2l(s): return s.translate(str.maketrans(AR,'0123456789'))
def raw(book,pid):
  f=f'{C}/{book}_{pid}.html'
  if not os.path.exists(f) or os.path.getsize(f)<1000:
    for k in range(4):
      r=subprocess.run(['curl','-s','--max-time','40','-o',f,f'https://shamela.ws/book/{book}/{pid}'])
      if os.path.exists(f) and os.path.getsize(f)>1000: break
      time.sleep(2*(k+1))
  return open(f,encoding='utf8').read()
def page(book,pid):
  t=raw(book,pid)
  part=re.search(r'id="fld_part_top" value="([^"]*)"',t); pg=re.search(r'id="fld_goto_top" value="([^"]*)"',t)
  m=re.search(r'<div class="nass[^"]*" data-page-id="\d+"[^>]*>(.*?)</div>\s*<div id="appended_pages"',t,re.S)
  body=m.group(1) if m else ''
  body=re.sub(r'<span class="c2">(.*?)</span>',r'⟦\1⟧',body,flags=re.S)
  body=re.sub(r'</p>','\n',body); body=re.sub(r'<[^>]+>','',body); body=html.unescape(body)
  return (part.group(1) if part else '?', pg.group(1) if pg else '?', body.strip())
def strip(s): return re.sub(r'[ً-ْٰ]','',s)
if __name__=='__main__':
  book,pid=sys.argv[1],int(sys.argv[2]); n=int(sys.argv[3]) if len(sys.argv)>3 else 1
  for p in range(pid,pid+n):
    pt,pg,b=page(book,p); print(f'===== book {book} id {p}  ج{pt} ص{pg}'); print(strip(b) if os.environ.get('STRIP') else b)
