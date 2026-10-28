# POPOTE Libreville

Site vitrine du groupement d'achat alimentaire mensuel réservé aux femmes de Libreville, Gabon.

Site statique (HTML/CSS/JS), sans dépendance ni build. Aucune donnée n'est envoyée à un serveur : la liste de courses et l'identification de l'adhérente restent dans le navigateur (`localStorage`).

## Structure

- `index.html` — page d'accueil (lien vers le groupe WhatsApp)
- `catalogue.html` — catalogue du mois, packs alimentaires, « Ma liste » et proforma PDF
- `faq.html` — foire aux questions
- `contact.html` — contact et localisation
- `confidentialite.html` — politique de confidentialité
- `cgu.html` — conditions générales d'utilisation et de vente
- `assets/css/` — `style.css` (site) et `catalogue.css` (page catalogue)
- `assets/js/main.js` — scripts communs (navigation)
- `assets/js/catalogue.js` — logique du catalogue : affichage, Ma liste, lot partagé, proforma PDF, partage WhatsApp
- `assets/js/vendor/jspdf.umd.min.js` — bibliothèque jsPDF (génération de la proforma)
- `assets/img/catalogue/` — visuels des produits (`.webp`)
- `assets/pdf/` — catalogue PDF illustré téléchargeable
- `data/catalogue-produits.json` — produits du mois
- `data/packs-alimentaires.json` — packs alimentaires (5 budgets × 3 propositions)

## Développement local

Comme le catalogue est chargé via `fetch()`, ouvrir les fichiers directement (`file://`) ne fonctionne pas pour cette page. Servez le dossier avec un petit serveur local, par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.

## Mettre à jour le catalogue mensuel

1. **Produits** — éditez `data/catalogue-produits.json`. Chaque produit comporte notamment :
   - `reference` (ex. `RIZ-001`), `nom`, `famille`, `ordre_famille` ;
   - `conditionnement`, `prix_gros_fcfa`, `unite_prix`, `badge_format` ;
   - `image` (chemin dans `assets/img/catalogue/`) ;
   - `lot_partage_unites` : nombre d'unités pour le mode « Lot partagé » (`null` si non partageable).
2. **Packs** — éditez `data/packs-alimentaires.json`. Chaque pack référence des produits par leur `reference`, qui doit exister dans `catalogue-produits.json`.
3. **Catalogue PDF** — déposez le nouveau fichier dans `assets/pdf/` et mettez à jour le lien dans `catalogue.html`.
4. **Images** — ajoutez les nouveaux visuels dans `assets/img/catalogue/`.

## Cache des navigateurs (`?v=`)

Les fichiers statiques sont appelés avec un paramètre de version (ex. `style.css?v=20261022`) pour forcer le rechargement après une mise à jour. Après toute modification de CSS, JS, JSON ou PDF, remplacez la valeur de `?v=` (date du jour au format `AAAAMMJJ`) :

- dans toutes les pages `.html` ;
- dans `assets/js/catalogue.js` (`DATA_URL` et `PACKS_URL`).
