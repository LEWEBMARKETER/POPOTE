"""Génère une version mono-fichier du site POPOTE (aperçu autonome, sans serveur).

Usage : python3 outils/site-mono-fichier/generer.py <sortie.html>

Les 6 pages deviennent des sections d'un seul fichier, affichées selon l'ancre de
l'adresse (#accueil, #catalogue, #faq:commandes…). Styles, scripts, données,
images et catalogue PDF sont intégrés. Ce fichier n'est pas le site à héberger :
le site réel reste les pages séparées + assets/ + data/.
"""
import base64, json, mimetypes, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = sys.argv[1]
PAGES = [('index', 'accueil'), ('catalogue', 'catalogue'), ('faq', 'faq'),
         ('contact', 'contact'), ('cgu', 'cgu'), ('confidentialite', 'confidentialite')]
SLUG = dict(PAGES)


def read(rel):
    return open(os.path.join(ROOT, rel), encoding='utf-8').read()


_cache = {}
def data_uri(rel):
    rel = rel.split('?')[0]
    if rel not in _cache:
        mime = mimetypes.guess_type(rel)[0] or 'application/octet-stream'
        if rel.endswith('.webp'):
            mime = 'image/webp'
        b64 = base64.b64encode(open(os.path.join(ROOT, rel), 'rb').read()).decode()
        _cache[rel] = f'data:{mime};base64,{b64}'
    return _cache[rel]


def links(html):
    # page.html#ancre -> #page:ancre ; page.html -> #page
    def rep(m):
        page, anchor = m.group(1), m.group(2)
        return f'href="#{SLUG[page]}' + (f':{anchor}' if anchor else '') + '"'
    html = re.sub(r'href="(index|catalogue|faq|contact|cgu|confidentialite)\.html(?:#([^"]*))?"', rep, html)
    # images
    html = re.sub(r'src="(assets/[^"]+\.(?:png|jpe?g|webp))(?:\?[^"]*)?"', lambda m: f'src="{data_uri(m.group(1))}"', html)
    # PDF : ouvert via un Blob (les navigateurs bloquent l'ouverture directe d'une URL data:)
    html = re.sub(r'href="assets/pdf/[^"]+"', 'href="#" data-pdf-catalogue', html)
    return html


def part(html, start, end):
    i = html.index(start); j = html.index(end, i) + len(end)
    return html[i:j]


# --- En-tête, pied de page et bouton WhatsApp : repris de l'accueil ---
index = read('index.html')
header = links(part(index, '<header class="site-header">', '</header>')).replace(' aria-current="page"', '')
footer = links(part(index, '<footer class="site-footer">', '</footer>'))
wa = links(part(index, '<a href="https://wa.me/24166980927?text=Bonjour%20POPOTE%20!" class="wa-float"', '</a>'))

sections = []
for page, slug in PAGES:
    html = read(page + '.html')
    body = part(html, '<main>', '</main>')
    body = body[len('<main>'):-len('</main>')]
    if page == 'catalogue':
        # mentions et panneau « Ma liste » propres au catalogue
        body += part(html, '<p class="cat-tag-footer">', '</p>')
        body += html[html.index('</footer>') + len('</footer>'):html.index('<a href="https://wa.me/24166980927?text=Bonjour%20POPOTE%20!" class="wa-float"')]
    title = re.search(r'<title>(.*?)</title>', html).group(1)
    sections.append(f'<div class="page-section" data-page-section="{slug}" data-title="{title}"{" hidden" if slug != "accueil" else ""}>{links(body)}</div>')

# --- Styles : images des CSS intégrées ---
css = read('assets/css/style.css') + '\n' + read('assets/css/catalogue.css')
css = re.sub(r'url\("\.\./([^")?]+)(?:\?[^")]*)?"\)', lambda m: f'url("{data_uri("assets/" + m.group(1))}")', css)

# --- Données : images en data URI, injectées à la place du fetch() ---
def inline_images(items, keys):
    for it in items:
        for k in keys:
            if isinstance(it.get(k), list):
                it[k] = [data_uri(s) for s in it[k]]
            elif it.get(k):
                it[k] = data_uri(it[k])
    return items
produits = inline_images(json.loads(read('data/catalogue-produits.json')), ['image'])
packs = inline_images(json.loads(read('data/packs-alimentaires.json')), ['images'])

js = read('assets/js/catalogue.js')
js = re.sub(r'fetch\(DATA_URL\)\s*\.then\(function \(res\) \{ return res\.json\(\); \}\)',
            'Promise.resolve(window.__POPOTE_PRODUITS__)', js)
js = re.sub(r'fetch\(PACKS_URL\)\s*\.then\(function \(res\) \{ return res\.json\(\); \}\)',
            'Promise.resolve(window.__POPOTE_PACKS__)', js)
assert 'fetch(' not in js, 'catalogue.js : un appel fetch() reste à remplacer'
js = js.replace('"assets/img/whatsapp-icon.png"', json.dumps(data_uri('assets/img/whatsapp-icon.png')))

pdf_b64 = base64.b64encode(open(os.path.join(ROOT, 'assets/pdf/POPOTE_Catalogue_Novembre_2026.pdf'), 'rb').read()).decode()

ROUTER = """
(function () {
  var sections = document.querySelectorAll('[data-page-section]');
  function show() {
    var h = decodeURIComponent(location.hash.slice(1)).split(':');
    var page = h[0] || 'accueil', anchor = h[1];
    var target = document.querySelector('[data-page-section="' + page + '"]');
    if (!target) { page = 'accueil'; target = sections[0]; }
    sections.forEach(function (s) { s.hidden = s !== target; });
    document.title = target.getAttribute('data-title');
    document.querySelectorAll('.site-header .nav a[href^="#"]').forEach(function (a) {
      if (a.getAttribute('href') === '#' + page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var el = anchor && document.getElementById(anchor);
    if (el) { el.scrollIntoView(); if (el.tagName === 'DETAILS') el.open = true; }
    else window.scrollTo(0, 0);
    window.dispatchEvent(new Event('scroll'));
  }
  window.addEventListener('hashchange', show);
  show();
  // Catalogue PDF : ouvert à partir des données intégrées
  var pdfUrl = null;
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-pdf-catalogue]');
    if (!a) return;
    e.preventDefault();
    if (!pdfUrl) {
      var bin = atob(document.getElementById('popote-pdf').textContent.trim());
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      pdfUrl = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
    }
    window.open(pdfUrl, '_blank');
  });
})();
"""

favicon = re.search(r'<link rel="icon"[^>]*>', index).group(0)
html = f'''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>POPOTE Libreville</title>
{favicon}
<style>
{css}
[hidden] {{ display: none !important; }}
</style>
</head>
<body>
{header}
<main>{"".join(sections)}</main>
{footer}
{wa}
<script type="application/octet-stream" id="popote-pdf">{pdf_b64}</script>
<script>window.__POPOTE_PRODUITS__ = {json.dumps(produits, ensure_ascii=False)};
window.__POPOTE_PACKS__ = {json.dumps(packs, ensure_ascii=False)};</script>
<script>{read('assets/js/vendor/jspdf.umd.min.js')}</script>
<script>{read('assets/js/main.js')}</script>
<script>{js}</script>
<script>{ROUTER}</script>
</body>
</html>
'''
open(OUT, 'w', encoding='utf-8').write(html)
print(f'{OUT} : {len(html.encode()) / 1e6:.1f} Mo')
