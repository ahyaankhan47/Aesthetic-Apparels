from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json, re

root=Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__(convert_charrefs=True);self.nodes=[];self.feed(text)
    def handle_starttag(self,tag,attrs):self.nodes.append((tag,dict(attrs)))

pages={p.name:Page(p.read_text(encoding='utf8')) for p in root.glob('*.html')}
errors=[];references=0;images=0
for name,page in pages.items():
    ids=[a['id'] for t,a in page.nodes if 'id' in a]
    if len(ids)!=len(set(ids)):errors.append(f'{name}: duplicate IDs')
    if not any(t=='title' for t,a in page.nodes):errors.append(f'{name}: missing title')
    if not any(t=='meta' and a.get('name')=='description' for t,a in page.nodes):errors.append(f'{name}: missing description')
    if re.search(r'Experimental preview|Draft for review|Preview inquiry|Sample details|review\.html', (root/name).read_text(encoding='utf8')):errors.append(f'{name}: preview content left in production')
    if name!='aesthetic-apparels_finished.html':
        if sum(t=='main' for t,a in page.nodes)!=1:errors.append(f'{name}: expected one main landmark')
        if not any(t=='meta' and a.get('http-equiv')=='Content-Security-Policy' for t,a in page.nodes):errors.append(f'{name}: missing CSP')
    for tag,a in page.nodes:
        if tag=='img':
            images+=1
            if 'alt' not in a:errors.append(f'{name}: missing alt')
            if not a.get('alt') and a.get('class')!='hero-mark':errors.append(f'{name}: unexpected empty alt')
            if 'width' not in a or 'height' not in a:errors.append(f'{name}: missing image dimensions')
        if tag in ('input','select','textarea') and a.get('type')!='hidden':
            if not any(t=='label' and x.get('for')==a.get('id') for t,x in page.nodes):errors.append(f'{name}: unlabeled {a.get("id")}')
        for relation in ('aria-describedby','aria-labelledby','aria-controls'):
            for target in a.get(relation,'').split():
                if target not in ids:errors.append(f'{name}: missing ARIA target {target}')
        for key in ('src','href'):
            if key not in a:continue
            url=urlsplit(a[key])
            if url.scheme or url.netloc:
                if key=='src' or (tag=='link' and a.get('rel')=='stylesheet'):errors.append(f'{name}: automatic external request')
                continue
            dest=unquote(url.path).removeprefix('/Aesthetic-Apparels/') or name
            references+=1
            if not (root/dest).is_file():errors.append(f'{name}: missing local file {dest}')
            if url.fragment and dest in pages:
                targetids=[x.get('id') for t,x in pages[dest].nodes]
                # #inquiry is an intentional route interpreted by the popup's hash handler.
                if url.fragment not in targetids and url.fragment!='inquiry':errors.append(f'{name}: missing fragment {a[key]}')
for p in (root/'assets').glob('*.css'):
    for url in re.findall(r'url\(["\']?([^\)"\']+)',p.read_text(encoding='utf8')):
        if url.startswith('data:') or unquote(url).startswith('#'):continue
        if url.startswith('https:'):errors.append(f'{p.name}: remote CSS resource')
        elif not (p.parent/url).is_file():errors.append(f'{p.name}: missing CSS resource {url}')

result={'pages':len(pages),'localReferencesChecked':references,'imagesChecked':images,'errors':errors}

print(json.dumps(result,indent=2))
raise SystemExit(bool(errors))
