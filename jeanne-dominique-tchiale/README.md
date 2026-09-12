# Site vitrine — Jeanne Dominique Tchiale

Site statique (HTML/CSS/JS pur, sans dépendance ni build) pour Jeanne Dominique Tchiale,
femme entrepreneure depuis 1995 et consultante.

## Structure

- `index.html` — page d'accueil
- `expertise.html` — page « Mon expertise »
- `contact.html` — page contact (WhatsApp, email, formulaire)
- `assets/css/style.css` — tous les styles (palette, typographies, responsive, animations)
- `assets/js/main.js` — menu mobile, apparition au scroll, formulaire de contact
- `assets/img/` — visuels du site (photo et signature réelles de Jeanne Dominique Tchiale)
- `jeanne-dominique-tchiale-site.html` — variante en un seul fichier autonome (CSS/JS et
  images encodés en base64), pratique pour un hébergement en un seul upload

## Hébergement rapide (aucune configuration serveur nécessaire)

Ce site est 100 % statique. Pour le mettre en ligne en quelques minutes :

- **Netlify** : glisser-déposer le dossier `jeanne-dominique-tchiale/` sur [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** : `vercel deploy` depuis ce dossier
- **GitHub Pages** : pousser ce dossier dans un dépôt et activer GitHub Pages sur la branche
- **Tout hébergement mutualisé** : envoyer le contenu du dossier par FTP à la racine du site

Aucune base de données, aucun serveur applicatif n'est requis.

## Modifier les contenus

Tous les textes sont directement modifiables dans les fichiers `.html` (recherchez le texte
à changer et remplacez-le). Les sections suivantes sont volontairement prévues comme des
espaces à compléter :

- **Photo et signature** : la photo professionnelle (`assets/img/jeanne-portrait.jpg`) et la
  signature (`assets/img/jeanne-signature-dark.png` sur fonds clairs,
  `assets/img/jeanne-signature-light.png` sur fonds sombres comme le footer) sont déjà en
  place sur les 3 pages. Pour les changer, remplacez ces fichiers par de nouveaux visuels de
  mêmes noms (le fichier `jeanne-dominique-tchiale-site.html`, en un seul fichier, embarque
  ses propres copies en base64 et doit être régénéré séparément si ces visuels changent).
- **Étape de parcours (page Expertise)** : la timeline contient un élément « Étape à
  compléter » à remplacer par une date et un événement réels.
- **Domaine d'expertise supplémentaire** (page Expertise) : une carte « + Ajouter un domaine
  d'expertise » est prévue pour un 5ᵉ domaine.
- **Couleurs** : la palette officielle (magenta, turquoise, noir anthracite) est centralisée
  en haut du fichier `assets/css/style.css` dans le bloc `:root`. Modifier ces variables
  suffit à adapter l'ensemble du site.

## Coordonnées utilisées sur le site

- WhatsApp : +241 62 70 53 80 (lien `https://wa.me/24162705380`)
- Email : jeanneproduct_gab@yahoo.fr

## Développement local

Aucun serveur n'est strictement nécessaire (le site fonctionne en ouvrant directement les
fichiers `.html`), mais pour un rendu fidèle vous pouvez servir le dossier localement :

```bash
python3 -m http.server 8000
```

Puis ouvrir `http://localhost:8000`.
