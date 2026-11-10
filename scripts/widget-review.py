"""صفحة مراجعة جمل زرّ الصلاة: python3 scripts/widget-review.py data/widget/lines2.json data/widget/review2.html widget2 "عنوان" """
import json, html, re, sys
src, out, col, title = sys.argv[1:5]
d = json.load(open(src)); e = html.escape
tpl = open('data/widget/review1.html').read()
def art(x):
    note = f'<div class="note">{e(x["note"])}</div>' if x['note'] else ''
    return (f'<article class="q"><div class="num">{x["id"]}</div>\n<div class="strip"><div class="coin"><b>ﷺ</b><i>3</i></div>'
            f'<div class="tx"><p>{e(x["text"])}</p><span>{e(x["src"])}</span></div><div class="star">✦</div></div>{note}\n'
            f'<div class="dec" data-id="{x["id"]}"><div class="btns"><button data-v="ok">موافق</button><button data-v="change">أغيّر</button><button data-v="note">ملاحظة</button></div>'
            f'<textarea placeholder="اكتب التعديل أو الملاحظة هنا" hidden></textarea><div class="st" aria-live="polite"></div></div></article>')
secs = [('آيات', 'quran'), ('أحاديث قصيرة', 'hadith'), ('فضل الصلاة عليه ﷺ', 'salat')]
body = ''.join(f'<h2>{t}</h2>' + ''.join(art(x) for x in d[k]) for t, k in secs if d.get(k))
n = sum(len(v) for v in d.values())
head = (f'<h1>{e(title)}</h1>\n<div class="note">{n} جملة جديدة بالطريقة نفسها: نص الآيات من المصحف، ونص الأحاديث من sunnah.com، ولا تكرار لما في الدفعات السابقة. '
        'تحت كل جملة: «موافق» أو «أغيّر» أو «ملاحظة»، وما لم تضغط عليه أعدّه مقبولًا.</div>\n')
page = re.sub(r'<h1>.*?(?=</div><script>)', lambda m: head + body + '\n', tpl, count=1, flags=re.S)
page = page.replace('collection("widget1")', f'collection("{col}")').replace('<title>جمل زرّ الصلاة</title>', f'<title>{e(title)}</title>')
open(out, 'w').write(page)
