# POPOTE Libreville

Site vitrine du groupement d'achat alimentaire mensuel réservé aux femmes de Libreville, Gabon.

Site statique (HTML/CSS/JS), sans dépendance ni build.

## Structure

- `index.html` — page d'accueil
- `catalogue.html` — catalogue mensuel (alimenté par `data/catalogue.json`)
- `faq.html` — foire aux questions
- `contact.html` — contact et localisation
- `assets/` — styles, scripts et images
- `data/catalogue.json` — contenu du catalogue du mois, à mettre à jour chaque mois

## Développement local

Comme le catalogue est chargé via `fetch()`, ouvrir les fichiers directement (`file://`) ne fonctionne pas pour cette page. Servez le dossier avec un petit serveur local, par exemple :

```bash
python3 -m http.server 8000
```

Puis ouvrez `http://localhost:8000`.

## Mettre à jour le catalogue mensuel

Éditez `data/catalogue.json` (mois, dates de clôture/paiement, catégories et produits). Le contenu est injecté automatiquement sur la page d'accueil et la page catalogue.
