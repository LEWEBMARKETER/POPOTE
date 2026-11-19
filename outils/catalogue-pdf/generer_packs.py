"""Génère le PDF des packs alimentaires POPOTE, au format du catalogue PDF.

Usage : python3 outils/catalogue-pdf/generer_packs.py <sortie.html>
puis   : node outils/catalogue-pdf/imprimer_pdf.js <sortie.html> assets/pdf/POPOTE_Packs_<Mois>_<Année>.pdf
Les packs et les prix viennent de data/packs-alimentaires.json et data/catalogue-produits.json.
"""
import html, json, math, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.abspath(sys.argv[1])
LOGO = os.path.join(HERE, 'logo-blanc.png')

# À mettre à jour à chaque campagne
MOIS, ANNEE = 'Novembre', '2026'
ABONNEMENT = 3500

P = {p['reference']: p for p in json.load(open(f'{ROOT}/data/catalogue-produits.json'))}
packs = sorted(json.load(open(f'{ROOT}/data/packs-alimentaires.json')), key=lambda p: (p['budget'], p['proposition']))
BUDGETS = sorted({p['budget'] for p in packs})


def e(s):
    return html.escape(str(s))


def price(n):
    return f'{n:,}'.replace(',', '&#8239;')


FLAT = os.path.join(os.path.dirname(OUT), 'flat')
os.makedirs(FLAT, exist_ok=True)
def flat(rel):
    dst = os.path.join(FLAT, os.path.basename(rel).rsplit('.', 1)[0] + '.jpg')
    if not os.path.exists(dst):
        im = Image.open(f'{ROOT}/{rel}').convert('RGBA'); im.thumbnail((520, 520), Image.LANCZOS)
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
        bg.convert('RGB').save(dst, 'JPEG', quality=82, optimize=True)
    return dst


def amount(it):
    # même calcul que le site (catalogue.js : Math.round(prix unitaire × quantité))
    p = P[it['reference']]
    pu = p['prix_gros_fcfa'] / p['lot_partage_unites'] if it['option'] == 'Lot partagé' and p.get('lot_partage_unites') else p['prix_gros_fcfa']
    return math.floor(pu * it['quantite'] + 0.5)


def qty(it):
    p = P[it['reference']]
    q = it['quantite']
    if it['option'] == 'Lot complet':
        unit = (p.get('unite_prix') or 'unité').lower()
        return f'{q} {unit}' + ('s' if q > 1 and not unit.endswith('s') else '')
    label = p.get('lot_partage_unite_label') or 'pièce'
    if label == 'kg':
        return f'{q} kg'
    return f'{q} {label}' + ('s' if q > 1 else '')


TOTAL = len(packs) + 2

def footer(n):
    return f'''<footer class="foot"><span>Packs composés aux tarifs de gros du catalogue de {MOIS.lower()} {ANNEE} · groupage de <b>100 personnes minimum</b>.</span><span class="pnum">{n:02d}<small>/{TOTAL}</small></span></footer>'''


def header():
    return f'''<header class="head"><div class="hcircle"></div><img class="hlogo" src="file://{LOGO}" alt="Popote"><span class="htag">Ensemble achetons mieux !</span>
<div class="hright"><span class="hcat">Packs alimentaires</span><span class="hmonth">{MOIS} <em>{ANNEE}</em></span></div></header>'''


body = []

# --- Couverture ---
somm = ''
for k, pk in enumerate(packs, 2):
    somm += (f'<li><span class="num">{e(pk["lettre"])}</span><span class="t">{price(pk["budget"])} FCFA · {e(pk["titre"])}</span>'
             f'<span class="dots"></span><span class="pg">p.&nbsp;{k:02d}</span></li>')
somm += f'<li><span class="num">i</span><span class="t">Commander un pack</span><span class="dots"></span><span class="pg">p.&nbsp;{TOTAL:02d}</span></li>'
budgets = ' · '.join(f'{price(b)}' for b in BUDGETS)
body.append(f'''
<section class="page cover">
  <div class="cv-top"><div class="cv-circle"></div><div class="cv-ring"></div>
    <img class="cv-logo" src="file://{LOGO}" alt="Popote Libreville">
    <p class="cv-kicker">Packs alimentaires</p>
    <h1 class="cv-title">{MOIS} <em>{ANNEE}</em></h1>
    <p class="cv-tag">Ensemble achetons mieux !</p>
  </div>
  <div class="cv-content">
    <div class="cv-100"><span class="big">{len(packs)}</span><div><h2>{len(packs)} paniers prêts à commander</h2><p>Deux propositions par budget ({budgets} FCFA), composées avec les produits essentiels du catalogue de {MOIS.lower()} {ANNEE}.</p></div></div>
    <div class="cv-cols">
      <div class="how"><h3>Ce qu’il faut savoir</h3>
        <div class="opt"><span class="ab">F</span><div><b>Montant à payer</b><p>Produits du pack + abonnement mensuel de {price(ABONNEMENT)} FCFA. Aucune autre somme ne s’ajoute.</p></div></div>
        <div class="opt"><span class="ab">B</span><div><b>Lot partagé</b><p>Les quantités sont des parts : POPOTE complète le lot avec les commandes d’autres membres.</p></div></div>
        <p class="how-note">Chaque pack peut être ajusté avant l’envoi. Prix définitifs confirmés à la consolidation du groupage.</p>
      </div>
      <div class="somm"><h3>Au sommaire</h3><ol>{somm}</ol></div>
    </div>
    <p class="cv-foot">Montants en FCFA au prix de gros · « Lot complet » : carton, sac ou unité entière · « Lot partagé » : part d’un lot regroupé.</p>
  </div>
  {footer(1)}
</section>''')

# --- Une page par pack ---
num_budget = {b: i for i, b in enumerate(BUDGETS, 1)}
for k, pk in enumerate(packs, 2):
    items = sorted(pk['items'], key=lambda it: -amount(it))
    subtotal = sum(amount(it) for it in items)
    photos = ''.join(f'<div class="pk-photo"><img src="file://{flat(src)}" alt=""></div>' for src in pk['images'])
    rows = ''.join(
        f'<tr><td class="th"><img src="file://{flat(P[it["reference"]]["image"])}" alt=""></td>'
        f'<td class="nm">{e(P[it["reference"]]["nom"])}</td><td class="rf">{e(it["reference"])}</td>'
        f'<td><span class="opt-tag{" full" if it["option"] == "Lot complet" else ""}">{e(it["option"])}</span></td>'
        f'<td class="qt">{e(qty(it))}</td><td class="am">{price(amount(it))}</td></tr>'
        for it in items)
    body.append(f'''
<section class="page">{header()}
  <div class="content">
    <h2 class="sec"><span class="snum">{num_budget[pk["budget"]]}</span>Packs {price(pk["budget"])} FCFA</h2>
    <article class="pk-card">
      <div class="card-banner"><span class="pk-letter">{e(pk["lettre"])}</span>Pack {e(pk["lettre"])} — {e(pk["titre"])}<span class="pk-count">{len(items)} produits</span></div>
      <div class="pk-photos">{photos}</div>
      <table class="pk-table">
        <thead><tr><th></th><th>Produit</th><th>Réf.</th><th>Option</th><th>Quantité</th><th class="am">Montant</th></tr></thead>
        <tbody>{rows}</tbody>
      </table>
      <div class="pk-total">
        <div><span class="plbl">Produits du pack</span><span class="pk-v">{price(subtotal)} F</span></div>
        <span class="pk-op">+</span>
        <div><span class="plbl">Abonnement mensuel</span><span class="pk-v">{price(ABONNEMENT)} F</span></div>
        <span class="pk-op">=</span>
        <div class="pk-pay"><span class="plbl">À payer</span><span class="amount">{price(subtotal + ABONNEMENT)}</span><span class="unit">FCFA</span></div>
      </div>
    </article>
  </div>
  {footer(k)}
</section>''')

# --- Dernière page : commander un pack ---
CAL = [('20 nov.', 'Sortie du catalogue'), ('20 – 25 nov.', 'Précommandes sur www.popotelibreville.com'),
       ('25 nov. – 5 déc.', 'Paiements via Airtel Money'), ('7 – 8 déc.', 'Livraisons')]
tiles = ''.join(f'<div class="tile"><span class="tt">{e(a)}</span><span class="td">{e(b)}</span></div>' for a, b in CAL)
recap = ''.join(
    f'<tr><td>{price(pk["budget"])} FCFA</td><td>Pack {e(pk["lettre"])} — {e(pk["titre"])}</td>'
    f'<td class="am">{price(sum(amount(it) for it in pk["items"]) + ABONNEMENT)} F</td></tr>' for pk in packs)
body.append(f'''
<section class="page last">
  <header class="lhead"><img src="file://{LOGO}" alt="Popote"><div class="lsep"></div><div><p class="lk">Packs alimentaires</p><h1>Commander un pack</h1><p class="ltag">Ensemble achetons mieux !</p></div><div class="lring"></div></header>
  <div class="lcontent">
    <div class="box"><h3><span class="snum">1</span>Comment commander</h3>
      <div class="opt"><span class="ab">1</span><p>Sur <b>www.popotelibreville.com</b>, page Catalogue : choisissez votre budget puis <b>« Ajouter ce pack à Ma liste »</b>.</p></div>
      <div class="opt"><span class="ab">2</span><p>Ajustez les quantités si besoin, puis envoyez votre liste sur WhatsApp.</p></div>
      <div class="opt"><span class="ab">3</span><p>Payez via Airtel Money pendant la période de paiement et envoyez la capture de la transaction.</p></div></div>
    <div class="box"><h3><span class="snum">2</span>Récapitulatif des packs</h3>
      <table class="pk-recap"><thead><tr><th>Budget</th><th>Pack</th><th class="am">À payer (abonnement inclus)</th></tr></thead><tbody>{recap}</tbody></table></div>
    <div class="box"><h3><span class="snum">3</span>Calendrier · {MOIS} – Décembre {ANNEE}</h3>
      <div class="tiles">{tiles}</div>
      <div class="minimum">Panier minimum <b>50 000 FCFA</b> par ménage</div></div>
  </div>
  <footer class="lfoot"><div class="ct"><span class="ic">▭</span><div><span class="cl">Numéro de paiement</span><b>+241 74 12 82 48</b></div></div>
    <div class="ct"><span class="ic">✆</span><div><span class="cl">Assistance &amp; commandes</span><b>+241 66 98 09 27</b></div></div>
    <span class="pnum">{TOTAL:02d}<small>/{TOTAL}</small></span></footer>
</section>''')

CSS = open(os.path.join(HERE, 'catalogue.css')).read() + '''
/* Pages packs */
.pk-card { border: .3mm solid var(--line); border-radius: 3mm; overflow: hidden; box-shadow: 0 .6mm 1.6mm rgba(6,77,29,.08); }
.pk-card .card-banner { height: 12mm; font-size: 12pt; gap: 3mm; }
.pk-letter { width: 7mm; height: 7mm; border-radius: 50%; background: var(--yellow); color: var(--dark); display: inline-flex; align-items: center; justify-content: center; font-size: 9pt; flex: none; }
.pk-count { margin-left: auto; font-size: 8pt; font-weight: 700; text-transform: none; color: #d9ecdd; }
.pk-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; padding: 4mm 5mm 2mm; }
.pk-photo { height: 24mm; position: relative; background: #fff; }
.pk-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.pk-table { width: calc(100% - 10mm); margin: 2mm 5mm 0; border-collapse: collapse; font-size: 8.4pt; }
.pk-table th { text-align: left; font-size: 6.4pt; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); padding: 1.6mm 1.5mm; border-bottom: .4mm solid var(--tint); }
.pk-table td { padding: .5mm 1.5mm; border-bottom: .25mm solid #eef3ef; vertical-align: middle; }
.pk-table td.th { width: 9mm; padding: .6mm 1mm; }
.pk-table td.th img { width: 7.5mm; height: 7.5mm; object-fit: contain; display: block; }
.pk-table .nm { font-weight: 700; }
.pk-table .rf { color: var(--banner); font-weight: 800; white-space: nowrap; }
.pk-table .qt { white-space: nowrap; }
.pk-table .am, .pk-recap .am { text-align: right; font-weight: 800; white-space: nowrap; }
.opt-tag { font-size: 6.8pt; font-weight: 700; padding: .5mm 1.8mm; border-radius: 1mm; background: var(--tint); color: var(--banner); white-space: nowrap; }
.opt-tag.full { background: var(--banner); color: #fff; }
.pk-total { display: flex; align-items: center; gap: 3mm; margin: 4mm 5mm 5mm; }
.pk-total > div { flex: 1; background: var(--tint); border-radius: 2.6mm; padding: 2.4mm 3mm; display: flex; flex-direction: column; }
.pk-total .pk-v { font-size: 13pt; font-weight: 800; color: var(--dark); }
.pk-total .pk-pay { background: var(--yellow); flex: 1.3; }
.pk-op { font-size: 16pt; font-weight: 800; color: var(--banner); }
.pk-recap { width: 100%; border-collapse: collapse; font-size: 8.6pt; }
.pk-recap th { text-align: left; font-size: 6.6pt; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); padding: 1.4mm 2mm; border-bottom: .4mm solid var(--tint); }
.pk-recap td { padding: 1.6mm 2mm; border-bottom: .25mm solid #eef3ef; }
.pk-recap td:first-child { font-weight: 800; color: var(--banner); white-space: nowrap; }
.box .opt p { font-size: 9pt; }
'''
open(OUT, 'w').write(f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>POPOTE — Packs alimentaires {MOIS} {ANNEE}</title><style>{CSS}</style></head><body>{"".join(body)}</body></html>')
print('pages', TOTAL)
