"""Génère le catalogue PDF POPOTE (HTML imprimé par Chromium), sur le modèle du catalogue POPOTE."""
import json, html, os, sys

# Usage : python3 outils/catalogue-pdf/generer_html.py <sortie.html>
# puis   : node outils/catalogue-pdf/imprimer_pdf.js <sortie.html> assets/pdf/POPOTE_Catalogue_<Mois>_<Année>.pdf
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.abspath(sys.argv[1])
LOGO = os.path.join(HERE, 'logo-blanc.png')

# À mettre à jour à chaque campagne : période, et calendrier (CAL, plus bas)
MOIS, ANNEE = 'Novembre', '2026'
products = json.load(open(f'{ROOT}/data/catalogue-produits.json'))

FAMILIES = []
for p in products:
    if p['famille'] not in FAMILIES:
        FAMILIES.append(p['famille'])

def e(s):
    return html.escape(str(s))

def price(n):
    return f'{n:,}'.replace(',', '&#8239;')

import os
from PIL import Image
FLAT = os.path.join(os.path.dirname(OUT), 'flat')
os.makedirs(FLAT, exist_ok=True)
def flat(rel):
    dst = os.path.join(FLAT, os.path.basename(rel).rsplit('.', 1)[0] + '.jpg')
    if not os.path.exists(dst):
        im = Image.open(f'{ROOT}/{rel}').convert('RGBA'); im.thumbnail((520, 520), Image.LANCZOS)
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        bg.convert('RGB').save(dst, 'JPEG', quality=82, optimize=True)
    return dst

def card(p):
    img = flat(p["image"])
    badge = f'<span class="badge">{e(p["badge_format"])}</span>' if p.get('badge_format') else ''
    if p.get('visuel_a_venir'):
        note = '<p class="note">Visuel à venir</p>'
    elif p.get('visuel_illustratif'):
        note = '<p class="note">Visuel illustratif</p>'
    else:
        note = ''
    unit = 'FCFA' + (f' / {e(p["unite_prix"])}' if p.get('unite_prix') else '')
    label = 'Prix de gros' + (' · à partir de' if p.get('prix_a_partir_de') else '')
    return f'''
<article class="card">
  <div class="card-banner">{e(p["nom"])}</div>
  <div class="card-body">
    <div class="photo"><div class="photo-box"><img src="file://{img}" alt="">{badge}</div>{note}</div>
    <div class="info">
      <span class="lbl">Référence</span><span class="ref">{e(p["reference"])}</span>
      <span class="lbl">Conditionnement</span><span class="cond">{e(p["conditionnement"])}</span>
      <div class="pricebox"><span class="plbl">{label}</span><span class="amount">{price(p["prix_gros_fcfa"])}</span><span class="unit">{unit}</span></div>
    </div>
  </div>
</article>'''

# --- Pagination : au plus 3 rangées de 2 cartes et 2 titres de section par page ---
blocks = []  # (famille, index, rangée)
for i, fam in enumerate(FAMILIES, 1):
    items = [p for p in products if p['famille'] == fam]
    rows = [items[k:k + 2] for k in range(0, len(items), 2)]
    blocks.append((fam, i, rows))

pages = []  # chaque page : liste de (famille, numéro, suite, rangées)
cur, nrows = [], 0
for fam, num, rows in blocks:
    first = True
    if len(rows) <= 3 and nrows + len(rows) > 3:
        pages.append(cur); cur, nrows = [], 0
    while rows:
        titles = len(cur)
        if nrows >= 3 or titles >= 2:
            pages.append(cur); cur, nrows = [], 0
        take = min(3 - nrows, len(rows))
        cur.append((fam, num, not first, rows[:take]))
        nrows += take; rows = rows[take:]; first = False
pages.append(cur)

TOTAL = len(pages) + 2
first_page = {}
for k, pg in enumerate(pages, 2):
    for fam, num, suite, _ in pg:
        first_page.setdefault(fam, k)

def footer(n):
    return f'''<footer class="foot"><span>Tarifs de gros négociés sur la base d’un groupage de <b>100 personnes minimum</b>.</span><span class="pnum">{n:02d}<small>/{TOTAL}</small></span></footer>'''

def header():
    return f'''<header class="head"><div class="hcircle"></div><img class="hlogo" src="file://{LOGO}" alt="Popote"><span class="htag">Ensemble achetons mieux !</span>
<div class="hright"><span class="hcat">Catalogue</span><span class="hmonth">{MOIS} <em>{ANNEE}</em></span></div></header>'''

body = []

# --- Couverture ---
somm = ''.join(f'<li><span class="num">{i}</span><span class="t">{e(f)}</span><span class="dots"></span><span class="pg">p.&nbsp;{first_page[f]:02d}</span></li>' for i, f in enumerate(FAMILIES, 1))
somm += f'<li><span class="num">i</span><span class="t">Fonctionnement et contacts</span><span class="dots"></span><span class="pg">p.&nbsp;{TOTAL:02d}</span></li>'
nb_vis = sum(1 for p in products if not p.get('visuel_a_venir'))
body.append(f'''
<section class="page cover">
  <div class="cv-top"><div class="cv-circle"></div><div class="cv-ring"></div>
    <img class="cv-logo" src="file://{LOGO}" alt="Popote Libreville">
    <p class="cv-kicker">Catalogue des achats groupés</p>
    <h1 class="cv-title">{MOIS} <em>{ANNEE}</em></h1>
    <p class="cv-tag">Ensemble achetons mieux !</p>
  </div>
  <div class="cv-content">
    <div class="cv-100"><span class="big">100</span><div><h2>Groupage de 100 personnes minimum</h2><p>Les tarifs de gros présentés dans ce catalogue sont négociés auprès des fournisseurs sur la base d’un groupage de 100 personnes minimum.</p></div></div>
    <div class="cv-cols">
      <div class="how"><h3>Comment commander ?</h3>
        <div class="opt"><span class="ab">A</span><div><b>Lot complet</b><p>Vous commandez le lot ou le carton entier.</p></div></div>
        <div class="opt"><span class="ab">B</span><div><b>Lot partagé</b><p>Vous prenez une partie du lot, regroupée avec les commandes d’autres ménages.</p></div></div>
        <p class="how-note">Prix membres (lot complet et part) communiqués à la validation du groupage.</p>
      </div>
      <div class="somm"><h3>Au sommaire</h3><ol>{somm}</ol></div>
    </div>
    <p class="cv-foot"><b>{len(products)}</b> produits · prix de gros en FCFA · « Visuel illustratif » : photo représentative, l’emballage livré peut différer · « Visuel à venir » : photo en cours d’ajout.</p>
  </div>
  {footer(1)}
</section>''')

# --- Pages produits ---
for k, pg in enumerate(pages, 2):
    parts = []
    for fam, num, suite, rows in pg:
        cards = ''.join(card(p) for row in rows for p in row)
        parts.append(f'<h2 class="sec"><span class="snum">{num}</span>{e(fam)}{" (suite)" if suite else ""}</h2><div class="grid">{cards}</div>')
    body.append(f'<section class="page">{header()}<div class="content">{"".join(parts)}</div>{footer(k)}</section>')

# --- Dernière page : fonctionnement ---
people = ''.join('<span class="pers"><i class="h"></i><i class="b"></i><span class="n">10</span></span>' for _ in range(5))
CAL = [('20 nov.', 'Envoi du catalogue'), ('20 – 25 nov.', 'Précommandes sur www.popotelibreville.com'),
       ('26 – 30 nov.', 'Phase 1 : confirmation des commandes et paiement via Airtel Money'),
       ('1er – 5 déc.', 'Phase 2 des paiements'), ('7 – 8 déc.', 'Livraison des membres')]
tiles = ''.join(f'<div class="tile"><span class="tt">{e(a)}</span><span class="td">{e(b)}</span></div>' for a, b in CAL)
body.append(f'''
<section class="page last">
  <header class="lhead"><img src="file://{LOGO}" alt="Popote"><div class="lsep"></div><div><p class="lk">Principe de fonctionnement</p><h1>Les achats groupés POPOTE</h1><p class="ltag">Ensemble achetons mieux !</p></div><div class="lring"></div></header>
  <div class="lcontent">
    <div class="row2">
      <div class="box"><h3><span class="snum">1</span>Qui sommes-nous ?</h3><p>Une initiative d’<b>achats groupés alimentaires</b> : les ménages réunissent leurs commandes pour obtenir de meilleures conditions auprès des fournisseurs.</p><p>Objectif : une communauté d’<b>au moins 100 ménages</b> pour renforcer notre pouvoir de négociation et réduire le coût du panier.</p></div>
      <div class="box"><h3><span class="snum">2</span>Comment ça marche ?</h3><p>Chaque ménage choisit ses produits et quantités dans le catalogue. POPOTE regroupe les commandes en gros volumes.</p>
        <div class="opt"><span class="ab">A</span><p><b>Lot complet</b> — vous commandez le carton ou le lot entier.</p></div>
        <div class="opt"><span class="ab">B</span><p><b>Lot partagé</b> — vous commandez une partie ; POPOTE complète le lot avec d’autres membres.</p></div></div>
    </div>
    <div class="box tint"><h3><span class="snum">3</span>Exemple : un carton de sardines BELMA</h3>
      <div class="ex"><div class="people">{people}</div><span class="eq">=</span><div class="carton"><b>1 carton</b><span>50 boîtes · prix de gros fournisseur 26 500 FCFA</span></div></div>
      <p>5 femmes commandent chacune <b>10 boîtes</b> : ensemble, elles constituent 1 carton complet. Chacune achète seulement ce dont elle a besoin, sans payer seule les 50 boîtes.</p></div>
    <div class="box"><h3><span class="snum">4</span>Calendrier et conditions · {MOIS} – Décembre {ANNEE}</h3>
      <div class="tiles">{tiles}</div>
      <div class="minimum">Panier minimum <b>50 000 FCFA</b> par ménage</div>
      <p class="small">Si un lot partagé n’est pas complet, POPOTE informe les membres concernés des solutions possibles avant toute confirmation.</p></div>
    <div class="row2">
      <div class="box"><h3><span class="snum">5</span>Comment sont fixés les prix ?</h3><ul>
        <li>Les <b>prix de gros</b> du catalogue sont des prix fournisseurs : ils servent de base de calcul.</li>
        <li>Le <b>prix membre</b> tient compte des volumes regroupés, des remises négociées et des frais de préparation.</li>
        <li>Vous recevez le <b>montant définitif</b> de votre panier avant de confirmer et de payer.</li>
        <li>Le regroupement renforce la négociation, sans garantir une remise sur tous les produits.</li></ul></div>
      <div class="box"><h3><span class="snum">6</span>Notre engagement</h3>
        <p class="eng">Transparence des prix membres</p><p class="eng">Organisation des commandes</p><p class="eng">Solidarité entre les ménages</p>
        <p class="engq">Plus nous regroupons nos besoins, plus nous négocions de meilleures conditions.</p></div>
    </div>
  </div>
  <footer class="lfoot"><div class="ct"><span class="ic">▭</span><div><span class="cl">Numéro de paiement</span><b>+241 74 12 82 48</b></div></div>
    <div class="ct"><span class="ic">✆</span><div><span class="cl">Assistance &amp; commandes</span><b>+241 66 98 09 27</b></div></div>
    <span class="pnum">{TOTAL:02d}<small>/{TOTAL}</small></span></footer>
</section>''')

CSS = open(os.path.join(HERE, 'catalogue.css')).read()
open(OUT, 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>POPOTE — Catalogue {MOIS} {ANNEE}</title><style>{CSS}</style></head><body>{"".join(body)}</body></html>')
print('pages', TOTAL, {f: first_page[f] for f in FAMILIES})
